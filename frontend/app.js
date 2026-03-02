/**
 * Lambda frontend application.
 *
 * Simple SPA: login -> dashboard (classrooms) -> classroom (assignments) -> assignment (editor).
 * State is kept in memory; token in localStorage.
 */

import {
  apiClient,
  healthCheck,
  devLogin,
  getMe,
  listClassrooms,
  createClassroom,
  enrollInClassroom,
  listAssignments,
  createAssignment,
  listSubmissions,
  createSubmission,
  runSandbox,
  isLoggedIn,
  logout,
} from "./api.js";

// --- State ---
let state = {
  user: null,
  classrooms: [],
  assignments: [],
  submissions: [],
  currentClassroom: null,
  currentAssignment: null,
  error: null,
};

// --- DOM refs ---
const views = {
  login: document.getElementById("view-login"),
  dashboard: document.getElementById("view-dashboard"),
  classroom: document.getElementById("view-classroom"),
  assignment: document.getElementById("view-assignment"),
};

// --- Helpers ---
function showView(name) {
  Object.values(views).forEach((v) => (v.style.display = "none"));
  if (views[name]) views[name].style.display = "block";
}

function setError(msg) {
  state.error = msg;
  const el = document.getElementById("error-message");
  if (el) {
    el.textContent = msg || "";
    el.style.display = msg ? "block" : "none";
  }
}

// --- Render ---
function renderLogin() {
  const email = document.getElementById("login-email");
  const name = document.getElementById("login-name");
  const role = document.getElementById("login-role");
  const btn = document.getElementById("login-btn");
  if (!btn) return;

  btn.onclick = async () => {
    setError("");
    if (!email?.value?.trim() || !name?.value?.trim()) {
      setError("Email and name are required.");
      return;
    }
    btn.disabled = true;
    try {
      await devLogin(email.value.trim(), name.value.trim(), role?.value || "student");
      await loadUser();
      try {
        state.classrooms = await listClassrooms();
      } catch {
        state.classrooms = [];
      }
      showView("dashboard");
      renderDashboard();
    } catch (e) {
      setError(e.message || "Login failed.");
    } finally {
      btn.disabled = false;
    }
  };
}

async function loadUser() {
  try {
    state.user = await getMe();
  } catch {
    state.user = null;
    logout();
  }
}

function renderDashboard() {
  const list = document.getElementById("classroom-list");
  const create = document.getElementById("create-classroom");
  const user = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout-btn");

  if (user) user.textContent = state.user ? `${state.user.name} (${state.user.role})` : "";
  if (logoutBtn) {
    logoutBtn.style.display = state.user ? "inline-flex" : "none";
    logoutBtn.onclick = () => { logout(); state.user = null; showView("login"); renderLogin(); };
  }

  list.innerHTML = "";
  state.classrooms.forEach((c) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `<strong>${escapeHtml(c.name)}</strong>${c.description ? ` — ${escapeHtml(c.description)}` : ""}${c.invite_code ? ` <small>(code: ${escapeHtml(c.invite_code)})</small>` : ""}`;
    li.onclick = () => openClassroom(c);
    list.appendChild(li);
  });

  const joinBtn = document.getElementById("join-classroom");
  if (joinBtn) {
    joinBtn.style.display = state.user?.role === "student" ? "inline-flex" : "none";
    joinBtn.onclick = async () => {
      const id = prompt("Classroom ID (UUID):");
      if (!id?.trim()) return;
      const code = prompt("Invite code (or leave empty):");
      setError("");
      try {
        await enrollInClassroom(id.trim(), code?.trim() || null);
        state.classrooms = await listClassrooms();
        renderDashboard();
      } catch (e) {
        setError(e.message || "Failed to join classroom.");
      }
    };
  }

  if (create) {
    create.style.display = state.user?.role === "teacher" ? "inline-flex" : "none";
    create.onclick = async () => {
      const name = prompt("Classroom name:");
      if (!name?.trim()) return;
      setError("");
      try {
        const c = await createClassroom(name.trim(), "");
        state.classrooms.push(c);
        renderDashboard();
      } catch (e) {
        setError(e.message || "Failed to create classroom.");
      }
    };
  }
}

async function openClassroom(classroom) {
  state.currentClassroom = classroom;
  setError("");
  try {
    state.assignments = await listAssignments(classroom.id);
  } catch (e) {
    setError(e.message || "Failed to load assignments.");
  }
  showView("classroom");
  renderClassroom();
}

function renderClassroom() {
  const title = document.getElementById("classroom-title");
  const list = document.getElementById("assignment-list");
  const create = document.getElementById("create-assignment");
  const back = document.getElementById("back-to-dashboard");

  if (title) title.textContent = state.currentClassroom?.name || "Classroom";
  if (back) back.onclick = () => { state.currentClassroom = null; showView("dashboard"); renderDashboard(); };

  list.innerHTML = "";
  state.assignments.forEach((a) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `<strong>${escapeHtml(a.title)}</strong>${a.description ? ` — ${escapeHtml(a.description)}` : ""}`;
    li.onclick = () => openAssignment(a);
    list.appendChild(li);
  });

  if (create) {
    create.style.display = state.user?.role === "teacher" ? "inline-flex" : "none";
    create.onclick = async () => {
      const title = prompt("Assignment title:");
      if (!title?.trim()) return;
      setError("");
      try {
        const a = await createAssignment(
          state.currentClassroom.id,
          title.trim(),
          "",
          "def add(a, b):\n    pass"
        );
        state.assignments.push(a);
        renderClassroom();
      } catch (e) {
        setError(e.message || "Failed to create assignment.");
      }
    };
  }
}

async function openAssignment(assignment) {
  state.currentAssignment = assignment;
  setError("");
  try {
    state.submissions = await listSubmissions(assignment.id);
  } catch (e) {
    setError(e.message || "Failed to load submissions.");
  }
  showView("assignment");
  renderAssignment();
}

function renderAssignment() {
  const title = document.getElementById("assignment-title");
  const desc = document.getElementById("assignment-description");
  const editor = document.getElementById("code-editor");
  const runBtn = document.getElementById("run-btn");
  const submitBtn = document.getElementById("submit-btn");
  const output = document.getElementById("run-output");
  const submissionsList = document.getElementById("submissions-list");
  const back = document.getElementById("back-to-classroom");

  if (title) title.textContent = state.currentAssignment?.title || "Assignment";
  if (desc) desc.textContent = state.currentAssignment?.description || "";
  if (editor) editor.value = state.currentAssignment?.template_code || "# Write your code here\n\n";

  if (back) back.onclick = () => { state.currentAssignment = null; showView("classroom"); renderClassroom(); };

  if (runBtn) {
    runBtn.onclick = async () => {
      const code = editor?.value || "";
      runBtn.disabled = true;
      output.textContent = "Running…";
      try {
        const res = await runSandbox(code);
        output.textContent = res.stdout || res.stderr || JSON.stringify(res.result_json || {});
      } catch (e) {
        output.textContent = `Error: ${e.message}`;
      } finally {
        runBtn.disabled = false;
      }
    };
  }

  if (submitBtn) {
    submitBtn.onclick = async () => {
      const code = editor?.value || "";
      submitBtn.disabled = true;
      setError("");
      try {
        const sub = await createSubmission(state.currentAssignment.id, code);
        state.submissions.unshift(sub);
        renderAssignment();
        output.textContent = `Submitted! Status: ${sub.status}`;
      } catch (e) {
        setError(e.message || "Failed to submit.");
      } finally {
        submitBtn.disabled = false;
      }
    };
  }

  if (submissionsList) {
    submissionsList.innerHTML = "";
    state.submissions.forEach((s) => {
      const li = document.createElement("li");
      li.className = "list-item";
      li.innerHTML = `<code>${escapeHtml(s.status)}</code> — ${new Date(s.submitted_at).toLocaleString()}`;
      submissionsList.appendChild(li);
    });
  }
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

// --- Init ---
async function init() {
  const healthEl = document.getElementById("health-status");
  try {
    const h = await healthCheck();
    if (healthEl) healthEl.textContent = h ? `Backend: ${h.status}` : "Backend: unreachable";
  } catch {
    if (healthEl) healthEl.textContent = "Backend: unreachable";
  }

  if (isLoggedIn()) {
    await loadUser();
    if (state.user) {
      try {
        state.classrooms = await listClassrooms();
      } catch {
        state.classrooms = [];
      }
      showView("dashboard");
      renderDashboard();
    } else {
      showView("login");
      renderLogin();
    }
  } else {
    showView("login");
    renderLogin();
  }
}

document.addEventListener("DOMContentLoaded", () => void init());
