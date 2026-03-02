import React, { useEffect, useState } from "react";
import {
  createAssignment,
  createClassroom,
  createSubmission,
  devLogin,
  getMe,
  healthCheck,
  isLoggedIn,
  listAssignments,
  listClassrooms,
  listSubmissions,
  logout,
  runSandbox,
} from "./lib/api";

type View = "login" | "dashboard" | "classroom" | "assignment";

export const MentorApp: React.FC = () => {
  const [view, setView] = useState<View>("login");
  const [health, setHealth] = useState<string>("Checking…");
  const [user, setUser] = useState<any | null>(null);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [currentClassroom, setCurrentClassroom] = useState<any | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [code, setCode] = useState<string>("");
  const [output, setOutput] = useState<string>("(Run or submit to see output)");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        const h = await healthCheck();
        setHealth(h ? `Backend: ${h.status}` : "Backend: unreachable");
      } catch {
        setHealth("Backend: unreachable");
      }

      if (isLoggedIn()) {
        try {
          const me = await getMe();
          setUser(me);
          const cls = await listClassrooms();
          setClassrooms(cls || []);
          setView("dashboard");
        } catch {
          logout();
          setUser(null);
          setView("login");
        }
      } else {
        setView("login");
      }
    };

    void init();
  }, []);

  const handleDevLogin = async (email: string, name: string, role: string) => {
    setError(null);
    setLoading(true);
    try {
      await devLogin(email, name, role);
      const me = await getMe();
      setUser(me);
      const cls = await listClassrooms();
      setClassrooms(cls || []);
      setView("dashboard");
    } catch (e: any) {
      setError(e.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setView("login");
  };

  const handleCreateClassroom = async () => {
    const name = window.prompt("Classroom name:");
    if (!name || !name.trim()) return;
    setError(null);
    try {
      const cls = await createClassroom(name.trim(), "");
      setClassrooms((prev) => [...prev, cls]);
    } catch (e: any) {
      setError(e.message || "Failed to create classroom.");
    }
  };

  const handleJoinClassroom = async () => {
    const id = window.prompt("Classroom ID (UUID):");
    if (!id || !id.trim()) return;
    const code = window.prompt("Invite code (or leave empty):");
    setError(null);
    try {
      const { enrollInClassroom } = await import("./lib/api");
      await enrollInClassroom(id.trim(), code?.trim() || null);
      const cls = await listClassrooms();
      setClassrooms(cls || []);
    } catch (e: any) {
      setError(e.message || "Failed to join classroom.");
    }
  };

  const openClassroom = async (cls: any) => {
    setCurrentClassroom(cls);
    setError(null);
    try {
      const asg = await listAssignments(cls.id);
      setAssignments(asg || []);
      setView("classroom");
    } catch (e: any) {
      setError(e.message || "Failed to load assignments.");
    }
  };

  const handleCreateAssignment = async () => {
    if (!currentClassroom) return;
    const title = window.prompt("Assignment title:");
    if (!title || !title.trim()) return;
    setError(null);
    try {
      const asg = await createAssignment(
        currentClassroom.id,
        title.trim(),
        "",
        "def add(a, b):\n    pass",
      );
      setAssignments((prev) => [...prev, asg]);
    } catch (e: any) {
      setError(e.message || "Failed to create assignment.");
    }
  };

  const openAssignment = async (asg: any) => {
    setCurrentAssignment(asg);
    setCode(asg.template_code || "# Write your code here\n\n");
    setOutput("(Run or submit to see output)");
    setError(null);
    try {
      const subs = await listSubmissions(asg.id);
      setSubmissions(subs || []);
      setView("assignment");
    } catch (e: any) {
      setError(e.message || "Failed to load submissions.");
    }
  };

  const handleRun = async () => {
    if (!currentAssignment) return;
    setLoading(true);
    setOutput("Running…");
    try {
      const res = await runSandbox(code);
      setOutput(
        res?.stdout || res?.stderr || JSON.stringify(res?.result_json || {}),
      );
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentAssignment) return;
    setLoading(true);
    setError(null);
    try {
      const sub = await createSubmission(currentAssignment.id, code);
      setSubmissions((prev) => [sub, ...prev]);
      setOutput(`Submitted! Status: ${sub.status}`);
    } catch (e: any) {
      setError(e.message || "Failed to submit.");
    } finally {
      setLoading(false);
    }
  };

  const canCreate = user?.role === "teacher";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col">
      {/* Top bar */}
      <header className="h-11 border-b border-slate-800 flex items-center justify-between px-4 text-xs">
        <div className="font-mono font-bold text-sm tracking-tight">Lambda</div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>{health}</span>
          {user && (
            <span>
              {user.name} ({user.role})
            </span>
          )}
          {user && (
            <button
              onClick={handleLogout}
              className="px-2 py-1 border border-slate-800 rounded-md bg-slate-950 hover:bg-slate-900"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="border-b border-slate-800 bg-red-950/40 text-red-300 text-xs px-4 py-2">
          {error}
        </div>
      )}

      {/* Content */}
      {view === "login" && (
        <LoginView loading={loading} onLogin={handleDevLogin} />
      )}

      {view !== "login" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: classrooms */}
          <aside className="w-64 border-r border-slate-800 bg-slate-900/80 flex flex-col">
            <div className="px-3 py-2 border-b border-slate-800 text-[10px] uppercase tracking-wide text-slate-500 flex items-center justify-between gap-2">
              <span>Classrooms</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleJoinClassroom}
                  className="text-xs border border-slate-800 rounded px-1.5 py-0.5 bg-slate-950 hover:bg-slate-900"
                >
                  Join
                </button>
                {canCreate && (
                  <button
                    onClick={handleCreateClassroom}
                    className="text-sky-400 text-xs px-1.5 py-0.5 border border-slate-800 rounded"
                  >
                    +
                  </button>
                )}
              </div>
            </div>
            <ul className="flex-1 overflow-auto text-sm">
              {classrooms.map((c) => (
                <li
                  key={c.id}
                  className={`px-3 py-2 border-b border-slate-800 cursor-pointer hover:bg-slate-900 ${
                    currentClassroom?.id === c.id
                      ? "bg-slate-900 text-sky-400"
                      : ""
                  }`}
                  onClick={() => openClassroom(c)}
                >
                  <div className="font-medium">{c.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono break-all">
                    {c.id}
                  </div>
                  {c.description && (
                    <div className="text-xs text-slate-500">
                      {c.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </aside>

          {/* Middle / Right */}
          <div className="flex-1 flex flex-col">
            {view === "dashboard" && (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
                Select a classroom or create a new one to begin.
              </div>
            )}

            {view === "classroom" && currentClassroom && (
              <ClassroomView
                classroom={currentClassroom}
                assignments={assignments}
                canCreate={canCreate}
                onCreateAssignment={handleCreateAssignment}
                onOpenAssignment={openAssignment}
                onBack={() => setView("dashboard")}
              />
            )}

            {view === "assignment" && currentAssignment && (
              <AssignmentView
                assignment={currentAssignment}
                code={code}
                setCode={setCode}
                output={output}
                submissions={submissions}
                loading={loading}
                onRun={handleRun}
                onSubmit={handleSubmit}
                onBack={() => setView("classroom")}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface LoginViewProps {
  loading: boolean;
  onLogin: (email: string, name: string, role: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ loading, onLogin }) => {
  const [email, setEmail] = useState("teacher@example.com");
  const [name, setName] = useState("Teacher");
  const [role, setRole] = useState<"teacher" | "student">("teacher");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email.trim(), name.trim(), role);
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-slate-800 bg-slate-900 rounded-md px-6 py-6 space-y-4 text-sm"
      >
        <h1 className="text-lg font-semibold">Dev Login</h1>
        <p className="text-xs text-slate-500">
          Use this form for local testing. Authentication is backed by the FastAPI
          dev-login endpoint.
        </p>
        <div className="space-y-1">
          <label className="block text-xs text-slate-400">Email</label>
          <input
            type="email"
            className="w-full rounded-md bg-slate-950 border border-slate-800 px-2 py-1 text-sm text-slate-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-slate-400">Name</label>
          <input
            type="text"
            className="w-full rounded-md bg-slate-950 border border-slate-800 px-2 py-1 text-sm text-slate-200"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-slate-400">Role</label>
          <select
            className="w-full rounded-md bg-slate-950 border border-slate-800 px-2 py-1 text-sm text-slate-200"
            value={role}
            onChange={(e) => setRole(e.target.value as "teacher" | "student")}
          >
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-sky-500 text-slate-950 text-sm py-1.5 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
};

interface ClassroomViewProps {
  classroom: any;
  assignments: any[];
  canCreate: boolean;
  onCreateAssignment: () => void;
  onOpenAssignment: (asg: any) => void;
  onBack: () => void;
}

const ClassroomView: React.FC<ClassroomViewProps> = ({
  classroom,
  assignments,
  canCreate,
  onCreateAssignment,
  onOpenAssignment,
  onBack,
}) => {
  return (
    <div className="flex-1 flex flex-col border-l border-slate-800 bg-slate-900">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 text-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-2 py-1 text-xs border border-slate-800 rounded-md bg-slate-950 hover:bg-slate-900"
          >
            ← Back
          </button>
          <span className="font-semibold">{classroom.name}</span>
        </div>
        {canCreate && (
          <button
            onClick={onCreateAssignment}
            className="px-2 py-1 text-xs rounded-md bg-sky-500 text-slate-950 hover:bg-sky-400"
          >
            New Assignment
          </button>
        )}
      </div>
      <ul className="flex-1 overflow-auto text-sm">
        {assignments.map((a) => (
          <li
            key={a.id}
            className="px-4 py-2 border-b border-slate-800 cursor-pointer hover:bg-slate-950"
            onClick={() => onOpenAssignment(a)}
          >
            <div className="font-medium">{a.title}</div>
            {a.description && (
              <div className="text-xs text-slate-500">{a.description}</div>
            )}
          </li>
        ))}
        {assignments.length === 0 && (
          <li className="px-4 py-3 text-xs text-slate-500">
            No assignments yet. {canCreate ? "Create the first one." : ""}
          </li>
        )}
      </ul>
    </div>
  );
};

interface AssignmentViewProps {
  assignment: any;
  code: string;
  setCode: (c: string) => void;
  output: string;
  submissions: any[];
  loading: boolean;
  onRun: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

const AssignmentView: React.FC<AssignmentViewProps> = ({
  assignment,
  code,
  setCode,
  output,
  submissions,
  loading,
  onRun,
  onSubmit,
  onBack,
}) => {
  return (
    <div className="flex-1 flex flex-col border-l border-slate-800 bg-slate-900">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 text-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-2 py-1 text-xs border border-slate-800 rounded-md bg-slate-950 hover:bg-slate-900"
          >
            ← Back
          </button>
          <span className="font-semibold">{assignment.title}</span>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Code editor and output */}
        <div className="flex-1 flex flex-col border-r border-slate-800">
          <div className="px-4 py-2 text-xs text-slate-500">Code</div>
          <textarea
            className="flex-1 bg-slate-950 text-slate-200 font-mono text-sm border-t border-slate-800 px-3 py-2 outline-none resize-none"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />
          <div className="px-4 py-2 flex items-center gap-2 border-t border-slate-800">
            <button
              onClick={onRun}
              disabled={loading}
              className="px-3 py-1 text-xs rounded-md bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:opacity-60"
            >
              Run
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="px-3 py-1 text-xs rounded-md border border-slate-800 bg-slate-950 hover:bg-slate-900 disabled:opacity-60"
            >
              Submit
            </button>
          </div>
          <div className="border-t border-slate-800 px-4 py-2 text-xs text-slate-500">
            Output
          </div>
          <pre className="h-32 bg-slate-950 text-slate-200 font-mono text-xs px-3 py-2 overflow-auto m-0">
            {output}
          </pre>
        </div>

        {/* Submissions */}
        <div className="w-64 flex flex-col">
          <div className="px-3 py-2 border-b border-slate-800 text-xs text-slate-500">
            Submissions
          </div>
          <ul className="flex-1 overflow-auto text-xs">
            {submissions.map((s) => (
              <li
                key={s.id}
                className="px-3 py-2 border-b border-slate-800 text-slate-300"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px]">{s.status}</span>
                  <span className="text-slate-500">
                    {new Date(s.submitted_at).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
            {submissions.length === 0 && (
              <li className="px-3 py-3 text-slate-500">
                No submissions yet.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

