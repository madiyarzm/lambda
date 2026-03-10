import React, { useEffect, useState } from "react";
import { CodeEditor } from "./components/CodeEditor";
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
import { Play } from "lucide-react";

type View = "login" | "dashboard" | "classroom" | "assignment";

type EditorFile = {
  id: string;
  name: string;
  content: string;
};

type TerminalEntry = {
  id: string;
  type: "run" | "submit";
  fileName: string;
  timestamp: string;
  status: "success" | "error";
  output: string;
};

export const MentorApp: React.FC = () => {
  const [view, setView] = useState<View>("login");
  const [health, setHealth] = useState<string>("Checking…");
  const [user, setUser] = useState<any | null>(null);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentClassroom, setCurrentClassroom] = useState<any | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [files, setFiles] = useState<EditorFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [output, setOutput] = useState<string>("(Run or submit to see output)");
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([]);
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
    setSelectedSubmission(null);
    const initialCode = asg.template_code || "# Write your code here\n\n";
    const defaultName =
      (asg.title || "main").replace(/\s+/g, "_").toLowerCase() + ".py";
    const initialFile: EditorFile = {
      id: asg.id || "main",
      name: defaultName,
      content: initialCode,
    };
    setFiles([initialFile]);
    setActiveFileId(initialFile.id);
    setCode(initialCode);
    setOutput("(Run or submit to see output)");
    setTerminalEntries([]);
    setError(null);
    try {
      const subs = await listSubmissions(asg.id);
      setSubmissions(subs || []);
      setView("assignment");
    } catch (e: any) {
      setError(e.message || "Failed to load submissions.");
    }
  };

  const handleAddFile = () => {
    if (!currentAssignment) return;
    const index = files.length + 1;
    const suggested = `file${index}.py`;
    const name = window.prompt("New file name:", suggested);
    if (!name || !name.trim()) return;
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const file: EditorFile = { id, name: name.trim(), content: "" };
    setFiles((prev) => [...prev, file]);
    setActiveFileId(id);
    setCode("");
  };

  const handleSelectFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file) return;
    setActiveFileId(id);
    setCode(file.content);
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (!activeFileId) return;
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: value } : f)),
    );
  };

  const handleRun = async () => {
    if (!currentAssignment) return;
    setLoading(true);
    setOutput("Running…");
    const activeFile =
      files.find((f) => f.id === activeFileId) || files[0] || null;
    const fileName = activeFile?.name || "main.py";
    try {
      const res = await runSandbox(code);
      const text =
        res?.stdout || res?.stderr || JSON.stringify(res?.result_json || {});
      setOutput(text);
      const status: "success" | "error" =
        res?.status === "success" ? "success" : "error";
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: "run",
          fileName,
          timestamp: new Date().toLocaleTimeString(),
          status,
          output: text,
        },
      ]);
    } catch (e: any) {
      const text = `Error: ${e.message}`;
      setOutput(text);
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: "run",
          fileName,
          timestamp: new Date().toLocaleTimeString(),
          status: "error",
          output: text,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentAssignment) return;
    setLoading(true);
    setError(null);
    const activeFile =
      files.find((f) => f.id === activeFileId) || files[0] || null;
    const fileName = activeFile?.name || "main.py";
    try {
      const sub = await createSubmission(currentAssignment.id, code);
      setSubmissions((prev) => [sub, ...prev]);
      const text = `Submitted! Status: ${sub.status}`;
      setOutput(text);
      const status: "success" | "error" =
        sub.status === "success" ? "success" : "error";
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: "submit",
          fileName,
          timestamp: new Date().toLocaleTimeString(),
          status,
          output: text,
        },
      ]);
    } catch (e: any) {
      setError(e.message || "Failed to submit.");
    } finally {
      setLoading(false);
    }
  };

  const canCreate = user?.role === "teacher";

  const handleClearTerminal = () => {
    setTerminalEntries([]);
  };

  const roomIdForEditor =
    currentClassroom && currentAssignment && activeFileId
      ? `${currentClassroom.id}:${currentAssignment.id}:${activeFileId}`
      : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col">
      {/* Top bar */}
      <header className="h-11 border-b border-slate-800 flex items-center justify-between px-4 text-xs bg-slate-950/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="h-6 w-6 flex items-center justify-center rounded-md border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 text-[10px] transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? "»" : "«"}
            </button>
          </div>
          <div className="font-mono font-bold text-sm tracking-tight">Lambda</div>
        </div>
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
          {/* Left: classrooms / projects sidebar */}
          <aside
            className={`border-r border-slate-800 bg-slate-900/90 flex flex-col transition-all duration-300 ${
              sidebarCollapsed ? "w-10" : "w-64"
            }`}
          >
            <div className="px-2 py-2 border-b border-slate-800 text-[10px] uppercase tracking-wide text-slate-500 flex items-center justify-between gap-1">
              {!sidebarCollapsed && <span>Classrooms</span>}
              {!sidebarCollapsed && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleJoinClassroom}
                    className="text-xs border border-slate-800 rounded px-1.5 py-0.5 bg-slate-950 hover:bg-slate-900 transition-colors"
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
              )}
            </div>
            <ul className="flex-1 overflow-auto text-sm">
              {classrooms.map((c) => (
                <li
                  key={c.id}
                  className={`border-b border-slate-800 cursor-pointer hover:bg-slate-900/80 hover:translate-x-0.5 transition-all ${
                    sidebarCollapsed ? "px-0 py-2 flex justify-center" : "px-3 py-2"
                  } ${
                    currentClassroom?.id === c.id
                      ? "bg-slate-900 text-sky-400 border-l-2 border-sky-500 shadow-[0_0_0_1px_rgba(56,189,248,0.15)_inset]"
                      : ""
                  }`}
                  onClick={() => openClassroom(c)}
                >
                  {sidebarCollapsed ? (
                    <div
                      className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono"
                      title={c.name}
                    >
                      {c.name?.[0]?.toUpperCase() || "C"}
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono break-all">
                        {c.id}
                      </div>
                      {c.description && (
                        <div className="text-xs text-slate-500">
                          {c.description}
                        </div>
                      )}
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
                setCode={handleCodeChange}
                output={output}
                roomId={roomIdForEditor}
                userName={user?.name || "Anonymous"}
                userRole={user?.role || "student"}
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onAddFile={handleAddFile}
                terminalEntries={terminalEntries}
                onClearTerminal={handleClearTerminal}
                submissions={submissions}
                selectedSubmission={selectedSubmission}
                onSelectSubmission={setSelectedSubmission}
                loading={loading}
                onRun={handleRun}
                onSubmit={handleSubmit}
                onBack={() => setView("classroom")}
              />
            )}
          </div>
        </div>
      )}
      {view !== "login" && (
        <footer className="h-7 border-t border-slate-800 bg-slate-950/95 text-[10px] text-slate-500 px-4 flex items-center justify-between">
          <span>
            Python Sandbox{" "}
            <span className="text-slate-400">|</span>{" "}
            <span className="text-slate-400">
              {user?.role === "teacher" ? "Teacher Mode" : "Student Mode"}
            </span>
          </span>
          <span className="hidden sm:inline">
            Backend: <span className="text-slate-300">{health}</span>
          </span>
        </footer>
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
    <div className="flex-1 flex flex-col border-l border-slate-800 bg-slate-900/90">
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
            New File
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
            No files yet. {canCreate ? "Create the first one." : ""}
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
  roomId?: string;
  userName?: string;
  userRole?: string;
  files: EditorFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onAddFile: () => void;
  terminalEntries: TerminalEntry[];
  onClearTerminal: () => void;
  submissions: any[];
  selectedSubmission: any | null;
  onSelectSubmission: (s: any | null) => void;
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
  roomId,
  userName,
  userRole,
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  terminalEntries,
  onClearTerminal,
  submissions,
  selectedSubmission,
  onSelectSubmission,
  loading,
  onRun,
  onSubmit,
  onBack,
}) => {
  const [detailExpanded, setDetailExpanded] = useState(false);
  const isSuccess = selectedSubmission?.status === "success";
  return (
    <div className="flex-1 flex flex-col border-l border-slate-800 bg-slate-900/90 transition-colors">
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
        <div className="flex-1 flex flex-col border-r border-slate-800 transition-colors rounded-tl-lg rounded-bl-lg bg-slate-900/80">
          <div className="px-4 py-2 text-[11px] text-slate-400 flex items-center justify-between border-b border-slate-800/80">
            <span className="tracking-wide uppercase">Code</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[11px]">
                {files.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onSelectFile(f.id)}
                    className={`px-2 py-0.5 rounded-t-md border-b-0 border text-xs font-mono transition-colors ${
                      activeFileId === f.id
                        ? "border-sky-500 text-sky-400 bg-slate-900 shadow-[0_0_0_1px_rgba(56,189,248,0.35)_inset]"
                        : "border-slate-700 text-slate-300 bg-slate-950 hover:bg-slate-900"
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onAddFile}
                className="px-1.5 py-0.5 text-xs border border-slate-700 rounded bg-slate-950 hover:bg-slate-900"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 border-t border-slate-800 bg-slate-950 rounded-b-lg overflow-hidden">
            <CodeEditor
              key={activeFileId || "single-file"}
              value={code}
              onChange={setCode}
              roomId={roomId}
              userName={userName}
              userRole={userRole}
              className="bg-slate-950"
            />
          </div>
          <div className="px-4 py-2 flex items-center gap-2 border-t border-slate-800">
            <button
              onClick={onRun}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-gradient-to-r from-sky-500 to-indigo-500 text-slate-950 hover:from-sky-400 hover:to-indigo-400 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.45)] transition"
            >
              <Play className="h-3 w-3" />
              <span>Run</span>
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="px-3 py-1.5 text-xs rounded-md border border-slate-800 bg-slate-950 hover:bg-slate-900 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-colors"
            >
              Submit
            </button>
          </div>
          <div className="border-t border-slate-800 px-4 py-2 text-[11px] text-slate-400 flex items-center justify-between bg-slate-950/90">
            <span className="tracking-wide uppercase">Terminal</span>
            <button
              type="button"
              onClick={onClearTerminal}
              className="text-[10px] text-slate-400 hover:text-slate-200 border border-slate-700 rounded px-1.5 py-0.5"
            >
              Clear
            </button>
          </div>
          <div className="h-32 bg-slate-950 text-slate-100 font-mono text-[11px] px-3 py-2 overflow-auto m-0">
            {terminalEntries.length === 0 ? (
              <div className="text-slate-500">
                No runs yet. Press <span className="text-sky-400">Run</span> or{" "}
                <span className="text-sky-400">Submit</span>.
                <div className="mt-1 text-[10px] text-slate-500">
                  Last output: {output || "(none)"}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {terminalEntries.map((entry) => (
                  <div key={entry.id}>
                    <div className="text-[10px] text-slate-500">
                      lambda@runtime:~${" "}
                      {entry.type === "run"
                        ? `python ${entry.fileName}`
                        : `submit ${entry.fileName}`}
                      <span className="ml-2 text-slate-600">
                        {entry.timestamp}
                      </span>
                    </div>
                    <pre
                      className={`whitespace-pre-wrap break-words ${
                        entry.status === "success"
                          ? "text-emerald-400"
                          : "text-red-300"
                      }`}
                    >
                      {entry.output || "(no output)"}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submissions list */}
        <div className="w-64 flex flex-col border-r border-slate-800 transition-colors bg-slate-900/90">
          <div className="px-3 py-2 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wide">
            Submissions
          </div>
          <ul className="flex-1 overflow-auto text-xs">
            {submissions.map((s) => (
              <li
                key={s.id}
                className={`px-3 py-2 border-b border-slate-800 cursor-pointer hover:bg-slate-800/80 transition-colors ${
                  selectedSubmission?.id === s.id ? "bg-slate-800" : "text-slate-300"
                }`}
                onClick={() => onSelectSubmission(selectedSubmission?.id === s.id ? null : s)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        s.status === "success"
                          ? "bg-emerald-400"
                          : "bg-red-400"
                      }`}
                    />
                    <span
                      className="font-medium text-slate-200 truncate"
                      title={s.submitter_name || s.user_id}
                    >
                      {s.submitter_name || "Unknown"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span
                    className={`font-mono text-[11px] ${
                      s.status === "success" ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {s.status_display || s.status}
                  </span>
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

        {/* Submission detail: only when a submission is selected; closable and expandable */}
        {selectedSubmission && (
          <div
            className={`flex flex-col bg-slate-950 border-l border-slate-800 shrink-0 transition-all duration-300 ${
              detailExpanded ? "w-[36rem] min-w-[28rem]" : "w-96"
            }`}
          >
            <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">Submission</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDetailExpanded((e) => !e)}
                  className="text-slate-400 hover:text-slate-200 text-xs px-1.5 py-0.5 rounded border border-slate-700 hover:border-slate-600"
                  title={detailExpanded ? "Collapse" : "Expand"}
                >
                  {detailExpanded ? "← Collapse" : "Expand →"}
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSubmission(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs px-1.5 py-0.5 rounded border border-slate-700 hover:border-slate-600"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="px-3 py-2 border-b border-slate-800">
              <div className="text-sm font-medium text-slate-200">
                {selectedSubmission.submitter_name || "Unknown"}
              </div>
              {selectedSubmission.submitter_email && (
                <div className="text-xs text-slate-500">{selectedSubmission.submitter_email}</div>
              )}
              <div className="mt-2">
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-mono rounded ${
                    isSuccess
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-red-500/20 text-red-400 border border-red-500/40"
                  }`}
                >
                  {selectedSubmission.status_display || selectedSubmission.status}
                </span>
              </div>
              {selectedSubmission.error_summary && (
                <p className="mt-2 text-xs text-red-400 border border-red-500/30 bg-red-500/10 rounded px-2 py-1.5">
                  {selectedSubmission.error_summary}
                </p>
              )}
            </div>
            <div className="px-3 py-2 text-xs text-slate-500 border-b border-slate-800">
              Code
            </div>
            <pre className="flex-1 overflow-auto font-mono text-xs text-slate-300 px-3 py-2 m-0 whitespace-pre-wrap break-words">
              {selectedSubmission.code || ""}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

