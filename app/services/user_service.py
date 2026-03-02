"""
Service functions for user management.

Contains business logic for creating or updating users based on
external identity providers (e.g., Google) or development helpers.
"""

from typing import Any, Dict
from uuid import UUID

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


def create_user_from_google_profile(
    db: Session, profile: Dict[str, Any], default_role: str = "student"
) -> User:
    """
    Create a new user record from a Google profile payload.

    Args:
        db: Database session.
        profile: Mapping with keys like 'sub', 'email', 'name', 'picture'.
        default_role: Fallback role for a new user.

    Returns:
        Persisted User instance.
    """

    google_id = str(profile.get("sub"))
    email = str(profile.get("email"))
    name = str(profile.get("name") or email)
    picture = profile.get("picture")

    user = User(
        google_id=google_id,
        email=email,
        name=name,
        picture_url=picture,
        role=default_role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_or_create_google_user(db: Session, profile: Dict[str, Any]) -> User:
    """
    Find or create a user from a Google profile.

    Existing users are matched by google_id if possible, otherwise by email.
    """

    google_id = str(profile.get("sub"))
    email = str(profile.get("email"))

    if google_id:
        existing = get_user_by_google_id(db, google_id=google_id)
        if existing:
            return existing

    if email:
        existing = get_user_by_email(db, email=email)
        if existing:
            # Backfill google_id if it was not set earlier.
            if not existing.google_id and google_id:
                existing.google_id = google_id
                db.commit()
                db.refresh(existing)
            return existing

    return create_user_from_google_profile(db, profile)


def create_or_get_dev_user(db: Session, email: str, name: str, role: str = "student") -> User:
    """
    Development-only helper to create a user without OAuth.

    Args:
        db: Database session.
        email: Email to use for the dev user.
        name: Display name.
        role: User role for permissions (e.g., 'teacher', 'student').

    Returns:
        Persisted or existing User instance.
    """

    existing = get_user_by_email(db, email=email)
    if existing:
        # Allow quick role adjustment for development scenarios.
        if existing.role != role:
            existing.role = role
            db.commit()
            db.refresh(existing)
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

