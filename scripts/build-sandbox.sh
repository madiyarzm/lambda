#!/usr/bin/env bash
# Build the Lambda sandbox Docker image from project root.
# Usage: ./scripts/build-sandbox.sh [packages]
#   packages: optional space-separated list, e.g. "numpy pandas"
# Example: ./scripts/build-sandbox.sh
# Example: ./scripts/build-sandbox.sh "numpy pandas requests"

set -e
cd "$(dirname "$0")/.."
ALLOWED="${1:-}"
IMAGE="${SANDBOX_DOCKER_IMAGE:-lambda-sandbox:latest}"

if [ -n "$ALLOWED" ]; then
  echo "Building $IMAGE with packages: $ALLOWED"
  docker build -f docker/sandbox.Dockerfile \
    --build-arg ALLOWED_PACKAGES="$ALLOWED" \
    -t "$IMAGE" .
else
  echo "Building $IMAGE (stdlib only)"
  docker build -f docker/sandbox.Dockerfile -t "$IMAGE" .
fi
echo "Done. Set SANDBOX_USE_DOCKER=true in .env and restart the backend."
