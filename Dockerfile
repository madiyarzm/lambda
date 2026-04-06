# ── Stage 1: build Vite frontend ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /build/frontend-vite
COPY frontend-vite/package*.json ./
RUN npm ci
COPY frontend-vite/ ./
# VITE_API_URL="" means same-origin (frontend and API share one Render URL)
RUN npm run build

# ── Stage 2: production backend ───────────────────────────────────────────────
FROM python:3.12-slim
WORKDIR /app

# Install deps first (layer cache friendly)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . .

# Copy compiled frontend where main.py expects it: <project_root>/frontend/
COPY --from=frontend-builder /build/frontend-vite/dist ./frontend

EXPOSE 8000

# Run Alembic migrations then start the server.
# Using shell form so we can chain commands.
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
