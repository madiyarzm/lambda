/**
 * API client for Lambda backend.
 *
 * Mirrors the backend REST API with typed wrappers.
 */

// In production (single Render service) VITE_API_URL is empty → same-origin.
// In local dev, Vite runs on :5173 so we point to the backend on :8000.
const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (window.location.port === "8000" ? "" : "http://localhost:8000");

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
  if (res.status === 204) return null;
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
  patch: (path: string, body: unknown) => api("PATCH", path, body),
  delete: (path: string) => api("DELETE", path),
};

// --- Health ---

export async function healthCheck(): Promise<any | null> {
  const url = API_BASE ? `${API_BASE}/health` : "/health";
  const res = await fetch(url);
  return res.ok ? await res.json() : null;
}

// --- Auth ---

export function googleLogin(): void {
  window.location.href = `${API_BASE}/api/v1/auth/google`;
}

export function saveToken(token: string): void {
  window.localStorage.setItem("lambda_token", token);
}

export async function getMe(): Promise<any> {
  return apiClient.get("/api/v1/users/me");
}

export async function getMyStats(): Promise<{ xp: number; submissions_total: number; submissions_accepted: number }> {
  return apiClient.get("/api/v1/users/me/stats");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function logout(): void {
  window.localStorage.removeItem("lambda_token");
}

// --- Admin ---

export async function listAllUsers(): Promise<any[]> {
  return apiClient.get("/api/v1/users/");
}

export async function updateUserRole(userId: string, role: "teacher" | "student"): Promise<any> {
  return apiClient.patch(`/api/v1/users/${userId}/role`, { role });
}

// --- Groups ---

export async function listGroups(): Promise<any[]> {
  return apiClient.get("/api/v1/groups/");
}

export async function createGroup(
  name: string,
  description = "",
): Promise<any> {
  return apiClient.post("/api/v1/groups/", { name, description });
}

export async function joinGroup(inviteCode: string): Promise<any> {
  return apiClient.post("/api/v1/groups/join", { invite_code: inviteCode });
}

export async function getGroup(groupId: string): Promise<any> {
  return apiClient.get(`/api/v1/groups/${groupId}`);
}

export async function listGroupMembers(groupId: string): Promise<any[]> {
  return apiClient.get(`/api/v1/groups/${groupId}/members`);
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  await apiClient.delete(`/api/v1/groups/${groupId}/members/${userId}`);
}

// --- Classrooms ---

export async function listClassrooms(groupId?: string): Promise<any[]> {
  const q = groupId ? `?group_id=${groupId}` : "";
  return apiClient.get(`/api/v1/classrooms/${q}`);
}

export async function createClassroom(
  groupId: string,
  name: string,
  description = "",
): Promise<any> {
  return apiClient.post("/api/v1/classrooms/", {
    group_id: groupId,
    name,
    description,
  });
}

// --- Assignments ---

export async function listAssignments(classroomId: string): Promise<any[]> {
  return apiClient.get(`/api/v1/assignments/?classroom_id=${classroomId}`);
}

export async function getHint(assignmentId: string, code: string, attemptNumber: number): Promise<string> {
  const res = await apiClient.post(`/api/v1/assignments/${assignmentId}/hint`, { code, attempt_number: attemptNumber });
  return res?.hint ?? "Keep going — you're almost there!";
}

export async function createAssignment(
  classroomId: string,
  title: string,
  description = "",
  templateCode = "",
  dueAt: string | null = null,
  testCode: string | null = null,
): Promise<any> {
  return apiClient.post("/api/v1/assignments/", {
    classroom_id: classroomId,
    title,
    description,
    template_code: templateCode,
    test_code: testCode,
    due_at: dueAt,
  });
}

export async function addSubmissionFeedback(submissionId: string, feedback: string): Promise<any> {
  return apiClient.patch(`/api/v1/submissions/${submissionId}/feedback`, { feedback });
}

// --- Submissions ---

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

// --- Sandbox ---

export async function runSandbox(code: string): Promise<any> {
  return apiClient.post("/api/v1/sandbox/run", { code });
}
