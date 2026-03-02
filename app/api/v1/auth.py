"""
Authentication routes.

Provides:
- Google OAuth login and callback endpoints.
- Development-only login to simplify local testing.
All endpoints issue a JWT that can be used as a Bearer token on protected routes.
"""

import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.core.auth_google import (
    build_google_oauth_url,
    exchange_code_for_tokens,
    fetch_google_userinfo,
)
from app.core.security import create_access_token
from app.dependencies import DBSession
from app.schemas.user import TokenResponse
from app.services.user_service import create_or_get_dev_user, get_or_create_google_user

router = APIRouter()


@router.get("/google", response_class=RedirectResponse)
async def auth_google(request: Request, settings: Settings = Depends(get_settings)) -> RedirectResponse:
    """
    Start Google OAuth flow by redirecting the user to Google's consent screen.

    Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to be configured.
    """

    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        )

    redirect_uri = str(request.url_for("auth_callback"))
    state = secrets.token_urlsafe(16)

    # Store state in a non-HttpOnly cookie so we can validate CSRF on callback.
    response = RedirectResponse(
        url=build_google_oauth_url(settings=settings, redirect_uri=redirect_uri, state=state),
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
    )
    response.set_cookie(
        key="oauth_state",
        value=state,
        max_age=600,
        secure=False,
        httponly=False,
        samesite="lax",
    )
    return response


@router.get("/callback", response_model=TokenResponse, name="auth_callback")
async def auth_callback(
    request: Request,
    db: DBSession,
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    """
    Handle Google's OAuth callback: exchange code for tokens, fetch user info, and issue JWT.

    Returns:
        TokenResponse with access_token to be used as Bearer token.
    """

    code = request.query_params.get("code")
    state = request.query_params.get("state")
    cookie_state = request.cookies.get("oauth_state")

    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing authorization code")

    if not state or not cookie_state or state != cookie_state:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state")

    redirect_uri = str(request.url_for("auth_callback"))
    try:
        token_data = await exchange_code_for_tokens(settings=settings, code=code, redirect_uri=redirect_uri)
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google did not return an access token",
            )
        profile = await fetch_google_userinfo(access_token=access_token)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to communicate with Google OAuth endpoints",
        )

    user = get_or_create_google_user(db, profile=profile)
    jwt_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role}, settings=settings)
    return TokenResponse(access_token=jwt_token)


@router.post("/dev-login", response_model=TokenResponse)
def dev_login(
    email: str,
    name: str,
    db: DBSession,
    role: str = "student",
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    """
    Development-only login to simplify local testing without Google OAuth.

    This endpoint is available only when ENV is set to 'development'.
    Do not expose it in production deployments.
    """

    if settings.app_env != "development":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    user = create_or_get_dev_user(db, email=email, name=name, role=role)
    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role}, settings=settings)
    return TokenResponse(access_token=token)
