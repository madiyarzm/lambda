/**
 * API client for Lambda backend.
 *
 * Mirrors the original vanilla JS api.js but typed for TypeScript.
 */

const API_BASE =
  window.location.port === "8000" ? "" : "http://127.0.0.1:8000";

function getToken(): string | null {
  return window.localStorage.getItem("lambda_token");
}

function getHeaders(includeAuth = true): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (includeAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function api(
  method: string,
  path: string,
  body: unknown = null,
  auth = true,
): Promise<any> {
  const opts: RequestInit = { method, headers: getHeaders(auth) };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (res.status === 401) {
    window.localStorage.removeItem("lambda_token");
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
  get: (path: string) => api("GET", path),
  post: (path: string, body: unknown) => api("POST", path, body),
  put: (path: string, body: unknown) => api("PUT", path, body),
  delete: (path: string) => api("DELETE", path),
};

export async function healthCheck(): Promise<any | null> {
  const url = API_BASE ? `${API_BASE}/health` : "/health";
  const res = await fetch(url);
  return res.ok ? await res.json() : null;
}

export async function devLogin(
  email: string,
  name: string,
  role: string = "student",
): Promise<any> {
  const data = await api(
    "POST",
    `/api/v1/auth/dev-login?email=${encodeURIComponent(email)}&name=${encodeURIComponent(
      name,
    )}&role=${encodeURIComponent(role)}`,
    null,
    false,
  );
  if (data?.access_token) {
    window.localStorage.setItem("lambda_token", data.access_token);
    return data;
  }
  throw new Error(data?.detail || "Login failed");
}

export async function getMe(): Promise<any> {
  return apiClient.get("/api/v1/users/me");
}

export async function listClassrooms(): Promise<any[]> {
  return apiClient.get("/api/v1/classrooms/");
}

export async function createClassroom(
  name: string,
  description = "",
): Promise<any> {
  return apiClient.post("/api/v1/classrooms/", { name, description });
}

export async function enrollInClassroom(
  classroomId: string,
  inviteCode: string | null = null,
): Promise<any> {
  const q = inviteCode ? `?invite_code=${encodeURIComponent(inviteCode)}` : "";
  return apiClient.post(`/api/v1/classrooms/${classroomId}/enroll${q}`, {});
}

export async function listAssignments(classroomId: string): Promise<any[]> {
  return apiClient.get(`/api/v1/assignments/?classroom_id=${classroomId}`);
}

export async function createAssignment(
  classroomId: string,
  title: string,
  description = "",
  templateCode = "",
): Promise<any> {
  return apiClient.post("/api/v1/assignments/", {
    classroom_id: classroomId,
    title,
    description,
    template_code: templateCode,
    test_code: null,
    due_at: null,
  });
}

export async function listSubmissions(assignmentId: string): Promise<any[]> {
  return apiClient.get(`/api/v1/submissions/?assignment_id=${assignmentId}`);
}

export async function getSubmission(submissionId: string): Promise<any> {
  return apiClient.get(`/api/v1/submissions/${submissionId}`);
}

export async function createSubmission(
  assignmentId: string,
  code: string,
): Promise<any> {
  return apiClient.post("/api/v1/submissions/", { assignment_id: assignmentId, code });
}

export async function runSandbox(code: string): Promise<any> {
  return apiClient.post("/api/v1/sandbox/run", { code });
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function logout(): void {
  window.localStorage.removeItem("lambda_token");
}

