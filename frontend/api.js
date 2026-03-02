/**
 * API client for Lambda backend.
 *
 * All requests use the stored JWT when available.
 * Base URL is configurable for different environments.
 */

// Use same origin when frontend is served from FastAPI (port 8000), else backend URL
const API_BASE =
  window.location.port === "8000" ? "" : "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("lambda_token");
}

function getHeaders(includeAuth = true) {
  const headers = { "Content-Type": "application/json" };
  if (includeAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function api(method, path, body = null, auth = true) {
  const opts = { method, headers: getHeaders(auth) };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (res.status === 401) {
    localStorage.removeItem("lambda_token");
    throw new Error("Unauthorized");
  }
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(res.statusText || "Request failed");
  }
}

export const apiClient = {
  get: (path) => api("GET", path),
  post: (path, body) => api("POST", path, body),
  put: (path, body) => api("PUT", path, body),
  delete: (path) => api("DELETE", path),
};

export async function healthCheck() {
  const url = API_BASE ? `${API_BASE}/health` : "/health";
  const res = await fetch(url);
  return res.ok ? (await res.json()) : null;
}

export async function devLogin(email, name, role = "student") {
  const data = await api(
    "POST",
    `/api/v1/auth/dev-login?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&role=${encodeURIComponent(role)}`,
    null,
    false
  );
  if (data?.access_token) {
    localStorage.setItem("lambda_token", data.access_token);
    return data;
  }
  throw new Error(data?.detail || "Login failed");
}

export async function getMe() {
  return apiClient.get("/api/v1/users/me");
}

export async function listClassrooms() {
  return apiClient.get("/api/v1/classrooms/");
}

export async function createClassroom(name, description = "") {
  return apiClient.post("/api/v1/classrooms/", { name, description });
}

export async function enrollInClassroom(classroomId, inviteCode = null) {
  const q = inviteCode ? `?invite_code=${encodeURIComponent(inviteCode)}` : "";
  return apiClient.post(`/api/v1/classrooms/${classroomId}/enroll${q}`);
}

export async function listAssignments(classroomId) {
  return apiClient.get(`/api/v1/assignments/?classroom_id=${classroomId}`);
}

export async function createAssignment(classroomId, title, description = "", templateCode = "") {
  return apiClient.post("/api/v1/assignments/", {
    classroom_id: classroomId,
    title,
    description,
    template_code: templateCode,
    test_code: null,
    due_at: null,
  });
}

export async function listSubmissions(assignmentId) {
  return apiClient.get(`/api/v1/submissions/?assignment_id=${assignmentId}`);
}

export async function createSubmission(assignmentId, code) {
  return apiClient.post("/api/v1/submissions/", { assignment_id: assignmentId, code });
}

export async function runSandbox(code) {
  return apiClient.post("/api/v1/sandbox/run", { code });
}

export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem("lambda_token");
}
