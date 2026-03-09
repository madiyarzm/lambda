# Sandbox image for running student Python code in isolation.
# Build with optional packages, e.g.:
#   docker build -f docker/sandbox.Dockerfile --build-arg ALLOWED_PACKAGES="numpy pandas requests" -t lambda-sandbox:latest .
# Then set SANDBOX_USE_DOCKER=true and SANDBOX_DOCKER_IMAGE=lambda-sandbox:latest

FROM python:3.12-slim

# Optional: pre-install packages so students can "import numpy" etc. (comma-separated list).
ARG ALLOWED_PACKAGES=""
RUN if [ -n "$ALLOWED_PACKAGES" ]; then pip install --no-cache-dir $ALLOWED_PACKAGES; fi

# Run as non-root and use a fixed dir for mounted code.
RUN useradd --create-home sandbox
WORKDIR /code
RUN chown sandbox:sandbox /code
USER sandbox

# Default command: run the script we mount (overridden by docker run).
CMD ["python", "/code/user_code.py"]
