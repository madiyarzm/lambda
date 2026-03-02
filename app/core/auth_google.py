"""
Google OAuth helpers.

This module is responsible only for building the authorization URL
and exchanging an authorization code for user profile data.
"""

from typing import Any, Dict
from urllib.parse import urlencode

import httpx

from app.config import Settings


GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GOOGLE_SCOPES = ["openid", "email", "profile"]


def build_google_oauth_url(settings: Settings, redirect_uri: str, state: str) -> str:
    """
    Construct the Google OAuth authorization URL.

    Args:
        settings: Application settings with Google client id.
        redirect_uri: Backend callback URL.
        state: CSRF token to be validated on callback.

    Returns:
        Fully qualified Google OAuth URL.
    """

    query = {
        "client_id": settings.google_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(GOOGLE_SCOPES),
        "access_type": "offline",
        "include_granted_scopes": "true",
        "state": state,
        "prompt": "consent",
    }
    return f"{GOOGLE_AUTH_BASE}?{urlencode(query)}"


async def exchange_code_for_tokens(
    *, settings: Settings, code: str, redirect_uri: str
) -> Dict[str, Any]:
    """
    Exchange an authorization code for tokens at Google's token endpoint.

    Args:
        settings: Application settings with Google credentials.
        code: Authorization code from query parameters.
        redirect_uri: Must match the one used during authorization.

    Returns:
        Parsed token response from Google as a dictionary.
    """

    payload = {
        "code": code,
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(GOOGLE_TOKEN_URL, data=payload)
        response.raise_for_status()
        return response.json()


async def fetch_google_userinfo(*, access_token: str) -> Dict[str, Any]:
    """
    Fetch user profile information from Google using an access token.

    Args:
        access_token: OAuth access token with 'openid email profile' scopes.

    Returns:
        Dictionary of user profile fields.
    """

    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(GOOGLE_USERINFO_URL, headers=headers)
        response.raise_for_status()
        return response.json()

