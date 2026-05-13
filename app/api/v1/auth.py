"""
Authentication routes.

Provides:
- Google OAuth login and callback endpoints.
- Development-only login to simplify local testing.
- Logout that clears the auth cookie.

The JWT is delivered to the browser as an ``httpOnly`` cookie named
``lambda_token``. httpOnly means JavaScript cannot read it, so an XSS bug
can no longer steal the session. A Bearer-header fallback is still
accepted by ``dependencies.get_current_user`` for non-browser clients.
"""

import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field

from app.config import Settings, get_settings
from app.core.auth_google import (
    build_google_oauth_url,
    exchange_code_for_tokens,
    fetch_google_userinfo,
)
from app.core.limiter import limiter
from app.core.security import create_access_token
from app.dependencies import AUTH_COOKIE_NAME, DBSession
from app.schemas.user import TokenResponse
from app.services.user_service import (
    GoogleAccountConflictError,
    GoogleEmailNotVerifiedError,
    create_or_get_dev_user,
    get_or_create_google_user,
)


# JWT lifetime in minutes — keep the cookie ``max_age`` in lockstep so the
# cookie expires when the token does. If you change one, change the other.
_JWT_TTL_MINUTES = 60


def _set_auth_cookie(response: Response, token: str, *, is_production: bool) -> None:
    """Attach the ``lambda_token`` cookie with appropriate flags.

    * ``httponly=True``  — JavaScript on the page cannot read the token.
    * ``samesite="lax"`` — sent on top-level navigations (so OAuth redirect
      works) but not on cross-site fetches (CSRF protection).
    * ``secure``         — only sent over HTTPS in production. Left off in
      dev so http://localhost works.
    """
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        max_age=_JWT_TTL_MINUTES * 60,
        httponly=True,
        secure=is_production,
        samesite="lax",
        path="/",
    )


class DevLoginRequest(BaseModel):
    """Body for the development-only login endpoint.

    Role is intentionally not accepted from the client: dev accounts are
    always created as students. Promotion happens via the admin role
    endpoint, which is the same path real users follow.
    """

    email: EmailStr
    name: str = Field(min_length=1, max_length=255)

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

    def _error_redirect(reason: str) -> RedirectResponse:
        return RedirectResponse(
            url=f"{settings.frontend_url}/auth/callback?error={reason}",
            status_code=status.HTTP_302_FOUND,
        )

    if not code or not state or not cookie_state or state != cookie_state:
        logger.warning("OAuth callback rejected: code=%s state_match=%s", bool(code), state == cookie_state)
        return _error_redirect("state_mismatch")

    redirect_uri = f"{settings.frontend_url}/api/v1/auth/callback"
    try:
        token_data = await exchange_code_for_tokens(settings=settings, code=code, redirect_uri=redirect_uri)
        access_token = token_data.get("access_token")
        if not access_token:
            logger.warning("No access_token in Google response")
            return _error_redirect("token_exchange_failed")
        profile = await fetch_google_userinfo(access_token=access_token)
        user = get_or_create_google_user(db, profile=profile)
        jwt_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role},
            settings=settings,
        )
    except GoogleEmailNotVerifiedError:
        logger.warning("OAuth login refused: email not verified")
        return _error_redirect("email_not_verified")
    except GoogleAccountConflictError:
        logger.warning("OAuth login refused: account conflict")
        return _error_redirect("account_conflict")
    except Exception as exc:
        logger.exception("OAuth login failed: %s", exc)
        return _error_redirect("auth_failed")

    # Set the JWT as an httpOnly cookie. The frontend just sees a success
    # redirect — no token in URL, no localStorage write, no XSS exposure.
    redirect = RedirectResponse(
        url=f"{settings.frontend_url}/auth/callback?login=success",
        status_code=status.HTTP_302_FOUND,
    )
    _set_auth_cookie(redirect, jwt_token, is_production=(settings.app_env == "production"))
    # Clear the short-lived state cookie now that we're done with it.
    redirect.delete_cookie("oauth_state", path="/")
    return redirect


@router.post("/dev-login", response_model=TokenResponse)
def dev_login(
    body: DevLoginRequest,
    response: Response,
    db: DBSession,
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    """Development-only login. Returns 404 in production.

    Sets the httpOnly cookie (so the dev frontend works without any token
    handling) AND returns the token in the body so test clients that
    can't use cookies easily still work.

    Role is hardcoded to ``student`` server-side — clients cannot request
    a higher role.
    """
    if settings.app_env != "development":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    user = create_or_get_dev_user(db, email=str(body.email), name=body.name, role="student")
    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role}, settings=settings)
    _set_auth_cookie(response, token, is_production=False)
    return TokenResponse(access_token=token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> Response:
    """Clear the auth cookie. Idempotent — safe to call when not logged in."""
    response.delete_cookie(AUTH_COOKIE_NAME, path="/")
    response.status_code = status.HTTP_204_NO_CONTENT
    return response
