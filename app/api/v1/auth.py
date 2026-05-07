"""
Authentication routes.

Provides:
- Google OAuth login and callback endpoints.
- Development-only login to simplify local testing.
All endpoints issue a JWT that can be used as a Bearer token on protected routes.
"""

import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse

from app.config import Settings, get_settings
from app.core.auth_google import (
    build_google_oauth_url,
    exchange_code_for_tokens,
    fetch_google_userinfo,
)
from app.core.limiter import limiter
from app.core.security import create_access_token
from app.dependencies import DBSession
from app.schemas.user import TokenResponse
from app.services.user_service import create_or_get_dev_user, get_or_create_google_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/google", response_class=RedirectResponse)
@limiter.limit("20/minute")
async def auth_google(request: Request, settings: Settings = Depends(get_settings)) -> RedirectResponse:
    """
    Start Google OAuth flow by redirecting the user to Google's consent screen.
    """
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        )

    redirect_uri = f"{settings.frontend_url}/api/v1/auth/callback"
    state = secrets.token_urlsafe(16)

    is_production = settings.app_env == "production"
    response = RedirectResponse(
        url=build_google_oauth_url(settings=settings, redirect_uri=redirect_uri, state=state),
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
    )
    response.set_cookie(
        key="oauth_state",
        value=state,
        max_age=600,
        secure=is_production,
        httponly=True,
        samesite="lax",
    )
    return response


@router.get("/callback", name="auth_callback")
@limiter.limit("20/minute")
async def auth_callback(
    request: Request,
    db: DBSession,
    settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    """
    Handle Google's OAuth callback: exchange code for tokens, fetch user info, issue JWT,
    then redirect back to the frontend with the token in the URL hash fragment.
    """
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    cookie_state = request.cookies.get("oauth_state")

    def err(reason: str) -> RedirectResponse:
        url = f"{settings.frontend_url}/auth/callback?error={reason}"
        logger.warning("OAuth callback error: %s | state=%s cookie=%s code_present=%s",
                       reason, state, cookie_state, bool(code))
        return RedirectResponse(url=url, status_code=status.HTTP_302_FOUND)

    if not code:
        return err("no_code")

    if not state or not cookie_state:
        return err("no_state_cookie")

    if state != cookie_state:
        return err("state_mismatch")

    redirect_uri = f"{settings.frontend_url}/api/v1/auth/callback"
    try:
        token_data = await exchange_code_for_tokens(settings=settings, code=code, redirect_uri=redirect_uri)
        access_token = token_data.get("access_token")
        if not access_token:
            return err("no_access_token")
        profile = await fetch_google_userinfo(access_token=access_token)
        user = get_or_create_google_user(db, profile=profile)
        jwt_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role},
            settings=settings,
        )
    except Exception as exc:
        logger.exception("OAuth callback failed: %s", exc)
        return err(f"exception")

    # Hash fragment is never sent to the server, so the token won't appear in logs or Referer headers.
    frontend_success_url = f"{settings.frontend_url}/auth/callback#{jwt_token}"
    return RedirectResponse(url=frontend_success_url, status_code=status.HTTP_302_FOUND)


@router.post("/dev-login", response_model=TokenResponse)
def dev_login(
    email: str,
    name: str,
    db: DBSession,
    role: str = "student",
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    """
    Development-only login. Returns 404 in production.
    """
    if settings.app_env != "development":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    user = create_or_get_dev_user(db, email=email, name=name, role=role)
    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role}, settings=settings)
    return TokenResponse(access_token=token)
