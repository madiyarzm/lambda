"""
Service functions for user management.

Contains business logic for creating or updating users based on
external identity providers (e.g., Google) or development helpers.
"""

from typing import Any, Dict

from sqlalchemy.orm import Session

from app.models.user import User


def get_user_by_google_id(db: Session, google_id: str) -> User | None:
    """
    Look up a user by Google account identifier.

    Args:
        db: Database session.
        google_id: Stable Google subject identifier.

    Returns:
        User instance if found, otherwise None.
    """

    return db.query(User).filter(User.google_id == google_id).one_or_none()


def get_user_by_email(db: Session, email: str) -> User | None:
    """
    Look up a user by email address.

    Args:
        db: Database session.
        email: User email to search.

    Returns:
        User instance if found, otherwise None.
    """

    return db.query(User).filter(User.email == email).one_or_none()


def _resolve_role_for_email(email: str) -> str:
    """Default role for a brand-new account.

    Everyone signs up as a student; the real role is chosen on the
    first-login screen (``POST /users/me/role``) and then locked. The
    admin-email auto-promotion that used to live here was a privilege-
    escalation risk: anyone who got Google to send an unverified email
    matching the admin address would inherit the role.
    """
    return "student"


class GoogleEmailNotVerifiedError(Exception):
    """Raised when Google reports the email as not verified."""


class GoogleAccountConflictError(Exception):
    """Raised when a Google login collides with a different account that was not
    created through Google (e.g. a leftover dev-login row). Linking accounts
    across providers must be explicit, not silent."""


def _profile_says_email_verified(profile: Dict[str, Any]) -> bool:
    """Return True only if Google explicitly confirms the email is verified.

    Google's userinfo endpoint sends email_verified as a JSON boolean; some
    older OpenID flows use the string "true". Anything else (missing, false,
    other strings) is treated as unverified.
    """
    value = profile.get("email_verified")
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() == "true"
    return False


def create_user_from_google_profile(
    db: Session, profile: Dict[str, Any], default_role: str = "student"
) -> User:
    """Create a new user record from a Google profile payload."""

    google_id = str(profile.get("sub"))
    email = str(profile.get("email"))
    name = str(profile.get("name") or email)
    picture = profile.get("picture")

    role = _resolve_role_for_email(email) if email else default_role

    user = User(
        google_id=google_id,
        email=email,
        name=name,
        picture_url=picture,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_or_create_google_user(db: Session, profile: Dict[str, Any]) -> User:
    """Find or create a user from a Google profile.

    Security:
      * The email must be marked verified by Google. Anyone can put any email
        on a Google account; only ``email_verified: true`` means Google
        confirmed the user controls that inbox.
      * Existing users are matched by ``google_id`` only. We do NOT match by
        email — silently linking a fresh Google login to a different
        (e.g. dev-login) account at the same address would let an attacker
        inherit a role they didn't earn.
    """

    if not _profile_says_email_verified(profile):
        raise GoogleEmailNotVerifiedError(
            "Google reported this email as not verified; cannot sign in."
        )

    google_id = str(profile.get("sub") or "")
    email = str(profile.get("email") or "")

    if not google_id or not email:
        raise GoogleEmailNotVerifiedError("Incomplete Google profile.")

    existing = get_user_by_google_id(db, google_id=google_id)
    if existing:
        return existing

    # No Google-linked account yet. If a different account already owns this
    # email (e.g. a dev-login row), refuse rather than merging silently.
    email_collision = get_user_by_email(db, email=email)
    if email_collision is not None:
        raise GoogleAccountConflictError(
            "An account with this email already exists but is not linked to Google."
        )

    return create_user_from_google_profile(db, profile)


def create_or_get_dev_user(db: Session, email: str, name: str, role: str = "student") -> User:
    """Development-only helper to create a user without OAuth.

    New users are created with the given ``role`` (default ``student``).
    Existing users' roles are NOT modified — preventing dev-login from being
    used as a privilege-escalation or downgrade primitive.
    """

    existing = get_user_by_email(db, email=email)
    if existing:
        return existing

    user = User(
        google_id=f"dev-{email}",
        email=email,
        name=name,
        picture_url=None,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def user_is_teacher(user: User) -> bool:
    """
    Check if the user has a teacher role.

    Args:
        user: User instance to inspect.

    Returns:
        True if user.role is 'teacher', else False.
    """

    return user.role == "teacher"


def user_is_student(user: User) -> bool:
    """
    Check if the user has a student role.

    Args:
        user: User instance to inspect.

    Returns:
        True if user.role is 'student', else False.
    """

    return user.role == "student"

