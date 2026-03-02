"""
Aggregates all API route modules under a single prefix.

Mount v1 routes at /api/v1 so we can add v2 later without breaking clients.
"""

from fastapi import APIRouter

from app.api.v1 import auth, users, classrooms, assignments, submissions, sandbox

api_router = APIRouter()

# v1 routes
v1_router = APIRouter(prefix="/v1", tags=["v1"])
v1_router.include_router(auth.router, prefix="/auth", tags=["auth"])
v1_router.include_router(users.router, prefix="/users", tags=["users"])
v1_router.include_router(classrooms.router, prefix="/classrooms", tags=["classrooms"])
v1_router.include_router(assignments.router, prefix="/assignments", tags=["assignments"])
v1_router.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
v1_router.include_router(sandbox.router, prefix="/sandbox", tags=["sandbox"])

api_router.include_router(v1_router)
