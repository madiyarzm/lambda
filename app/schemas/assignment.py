"""
Pydantic schemas for Assignment and Submission entities.

Assignments define what students should implement; submissions capture
their code and the sandbox execution result.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AssignmentBase(BaseModel):
    """
    Shared fields for assignment creation and updates.
    """

    title: str
    description: str | None = None
    template_code: str | None = None
    test_code: str | None = None
    due_at: datetime | None = None


class AssignmentCreate(AssignmentBase):
    """
    Payload for creating a new assignment in a classroom.
    """

    classroom_id: UUID


class AssignmentRead(AssignmentBase):
    """
    Assignment representation returned to clients.
    """

    id: UUID
    classroom_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        """
        Enable construction from SQLAlchemy ORM instances.
        """

        from_attributes = True


class SubmissionBase(BaseModel):
    """
    Shared payload fields for code submissions.
    """

    code: str


class SubmissionCreate(SubmissionBase):
    """
    Payload for creating a submission for an assignment.
    """

    assignment_id: UUID


class SubmissionRead(SubmissionBase):
    """
    Submission representation returned to clients.
    """

    id: UUID
    assignment_id: UUID
    user_id: UUID
    status: str
    result_json: dict | None = None
    submitted_at: datetime

    class Config:
        """
        Enable construction from SQLAlchemy ORM instances.
        """

        from_attributes = True

