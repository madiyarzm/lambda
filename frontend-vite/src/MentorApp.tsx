import React, { useEffect, useRef, useState } from "react";
import { CodeEditor } from "./components/CodeEditor";
import { DrawingCanvas } from "./components/DrawingCanvas";
import {
  createAssignment,
  createClassroom,
  createGroup,
  createSubmission,
  devLogin,
  getMe,
  healthCheck,
  isLoggedIn,
  joinGroup,
  listAssignments,
  listClassrooms,
  listGroupMembers,
  listGroups,
  listSubmissions,
  logout,
  runSandbox,
} from "./lib/api";
import { Play, ChevronRight, ChevronDown, X } from "lucide-react";

// ─── Deadline utilities ────────────────────────────────────────────────────

type DeadlineUrgency = "none" | "green" | "yellow" | "orange" | "red" | "overdue";

function getDeadlineUrgency(dueAt: string | null): DeadlineUrgency {
  if (!dueAt) return "none";
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff < 0) return "overdue";
  const hours = diff / 3_600_000;
  if (hours < 24) return "red";
  const days = hours / 24;
  if (days < 3) return "orange";
  if (days < 7) return "yellow";
  return "green";
}

function formatDueDate(dueAt: string): string {
  return new Date(dueAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimeRemaining(dueAt: string): string {
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff <= 0) return "OVERDUE";
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h remaining`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} remaining`;
}

function isSubmittedLate(submittedAt: string, dueAt: string | null): boolean {
  if (!dueAt) return false;
  return new Date(submittedAt) > new Date(dueAt);
}

// ─── DeadlineBadge ─────────────────────────────────────────────────────────

const URGENCY_CLASSES: Record<DeadlineUrgency, string> = {
  none:    "text-slate-500 border-slate-700 bg-slate-800/50",
  green:   "text-emerald-400 border-emerald-600/50 bg-emerald-500/10",
  yellow:  "text-yellow-400 border-yellow-600/50 bg-yellow-500/10",
  orange:  "text-orange-400 border-orange-600/50 bg-orange-500/10",
  red:     "text-red-400 border-red-600/50 bg-red-500/10",
  overdue: "text-red-400 border-red-600/50 bg-red-500/10",
};

const DeadlineBadge: React.FC<{ dueAt: string; className?: string }> = ({ dueAt, className = "" }) => {
  const urgency = getDeadlineUrgency(dueAt);
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border font-mono ${URGENCY_CLASSES[urgency]} ${className}`}>
      {urgency === "overdue" ? "⚠ OVERDUE" : `Due ${formatDueDate(dueAt)}`}
    </span>
  );
};

// ─── CreateAssignmentModal ──────────────────────────────────────────────────

interface CreateAssignmentModalData {
  title: string;
  description: string;
  templateCode: string;
  dueAt: string | null;
}

interface CreateAssignmentModalProps {
  onConfirm: (data: CreateAssignmentModalData) => void;
  onCancel: () => void;
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ onConfirm, onCancel }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [templateCode, setTemplateCode] = useState("# Write your solution here\n\n");
  const [isHomework, setIsHomework] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("23:59");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  const dueAt = isHomework && dueDate
    ? new Date(`${dueDate}T${dueTime}`).toISOString()
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onConfirm({ title: title.trim(), description, templateCode, dueAt });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-100">New Assignment</h2>
          <button type="button" onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

          {/* Assignment type selector — shown first, most important choice */}
          <div className="space-y-1.5">
            <label className="block text-xs text-slate-400">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsHomework(false)}
                className={`flex flex-col items-start gap-1 px-3 py-3 rounded-lg border text-left transition-all ${
                  !isHomework
                    ? "border-sky-500/60 bg-sky-500/10 ring-1 ring-sky-500/30"
                    : "border-slate-700 bg-slate-950 hover:border-slate-600"
                }`}
              >
                <span className="text-lg leading-none">💻</span>
                <span className={`text-xs font-semibold ${!isHomework ? "text-sky-300" : "text-slate-300"}`}>In-class Exercise</span>
                <span className="text-[10px] text-slate-500 leading-snug">Live coding session, no deadline</span>
              </button>
              <button
                type="button"
                onClick={() => setIsHomework(true)}
                className={`flex flex-col items-start gap-1 px-3 py-3 rounded-lg border text-left transition-all ${
                  isHomework
                    ? "border-indigo-500/60 bg-indigo-500/10 ring-1 ring-indigo-500/30"
                    : "border-slate-700 bg-slate-950 hover:border-slate-600"
                }`}
              >
                <span className="text-lg leading-none">📋</span>
                <span className={`text-xs font-semibold ${isHomework ? "text-indigo-300" : "text-slate-300"}`}>Homework</span>
                <span className="text-[10px] text-slate-500 leading-snug">Completed outside class, with deadline</span>
              </button>
            </div>
          </div>

          {/* Due date/time — shown immediately under type when homework is selected */}
          {isHomework && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/50">
              <span className="text-indigo-400 text-xs font-medium shrink-0">Due:</span>
              <div className="flex-1">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
                />
              </div>
              <div className="w-24">
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
                />
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="block text-xs text-slate-400">Title <span className="text-red-400">*</span></label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Variables & Data Types"
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs text-slate-400">Instructions</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what students should do…"
              rows={3}
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60 resize-none"
            />
          </div>

          {/* Template code */}
          <div className="space-y-1">
            <label className="block text-xs text-slate-400">Starter Code</label>
            <textarea
              value={templateCode}
              onChange={(e) => setTemplateCode(e.target.value)}
              rows={5}
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500/60 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs border border-slate-700 rounded-md bg-transparent text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || (isHomework && !dueDate)}
              className={`px-4 py-1.5 text-xs rounded-md font-medium disabled:opacity-50 transition-colors ${
                isHomework
                  ? "bg-indigo-500 text-white hover:bg-indigo-400"
                  : "bg-sky-500 text-slate-950 hover:bg-sky-400"
              }`}
            >
              {isHomework ? "Create Homework" : "Create Exercise"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── App types ─────────────────────────────────────────────────────────────

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

  const [groups, setGroups] = useState<any[]>([]);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [groupClassrooms, setGroupClassrooms] = useState<Record<string, any[]>>({});

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submissionsByAssignment, setSubmissionsByAssignment] = useState<Record<string, any[]>>({});
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

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
          const grps = await listGroups();
          setGroups(grps || []);
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
      const grps = await listGroups();
      setGroups(grps || []);
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

  const handleCreateGroup = async () => {
    const name = window.prompt("Group name (e.g. 'Python Basics — Spring 2026'):");
    if (!name || !name.trim()) return;
    setError(null);
    try {
      const grp = await createGroup(name.trim(), "");
      setGroups((prev) => [...prev, grp]);
    } catch (e: any) {
      setError(e.message || "Failed to create group.");
    }
  };

  const handleJoinGroup = async () => {
    const code = window.prompt("Enter group invite code:");
    if (!code || !code.trim()) return;
    setError(null);
    try {
      await joinGroup(code.trim());
      const grps = await listGroups();
      setGroups(grps || []);
    } catch (e: any) {
      setError(e.message || "Failed to join group.");
    }
  };

  const toggleGroup = async (groupId: string) => {
    if (expandedGroupId === groupId) {
      setExpandedGroupId(null);
      return;
    }
    setExpandedGroupId(groupId);
    if (!groupClassrooms[groupId]) {
      try {
        const cls = await listClassrooms(groupId);
        setGroupClassrooms((prev) => ({ ...prev, [groupId]: cls || [] }));
      } catch (e: any) {
        setError(e.message || "Failed to load classrooms.");
      }
    }
  };

  const handleCreateClassroom = async (groupId: string) => {
    const name = window.prompt("Classroom name:");
    if (!name || !name.trim()) return;
    setError(null);
    try {
      const cls = await createClassroom(groupId, name.trim(), "");
      setGroupClassrooms((prev) => ({
        ...prev,
        [groupId]: [...(prev[groupId] || []), cls],
      }));
    } catch (e: any) {
      setError(e.message || "Failed to create classroom.");
    }
  };

  const openClassroom = async (cls: any) => {
    setCurrentClassroom(cls);
    setError(null);
    try {
      const asg = await listAssignments(cls.id);
      setAssignments(asg || []);
      // Pre-load submissions for badge display on assignment cards
      if (asg?.length) {
        const results = await Promise.all(
          asg.map((a: any) => listSubmissions(a.id).catch(() => []))
        );
        const map: Record<string, any[]> = {};
        asg.forEach((a: any, i: number) => { map[a.id] = results[i] || []; });
        setSubmissionsByAssignment(map);
      } else {
        setSubmissionsByAssignment({});
      }
      setView("classroom");
    } catch (e: any) {
      setError(e.message || "Failed to load assignments.");
    }
  };

  const handleCreateAssignment = () => setShowCreateModal(true);

  const handleCreateAssignmentConfirm = async (data: CreateAssignmentModalData) => {
    if (!currentClassroom) return;
    setShowCreateModal(false);
    setError(null);
    try {
      const asg = await createAssignment(
        currentClassroom.id,
        data.title,
        data.description,
        data.templateCode,
        data.dueAt,
      );
      setAssignments((prev) => [...prev, asg]);
      // Add empty submissions entry for the new assignment
      setSubmissionsByAssignment((prev) => ({ ...prev, [asg.id]: [] }));
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
      // Fetch group members for teacher homework roster
      if (user?.role === "teacher" && asg.due_at && currentClassroom?.group_id) {
        try {
          const members = await listGroupMembers(currentClassroom.group_id);
          setGroupMembers((members || []).filter((m: any) => m.role === "student"));
        } catch {
          setGroupMembers([]);
        }
      } else {
        setGroupMembers([]);
      }
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

  const drawingRoomId =
    currentClassroom && currentAssignment
      ? `drawing:${currentClassroom.id}:${currentAssignment.id}`
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
          {/* Left sidebar: Groups → Classrooms */}
          <aside
            className={`border-r border-slate-800 bg-slate-900/90 flex flex-col transition-all duration-300 ${
              sidebarCollapsed ? "w-10" : "w-64"
            }`}
          >
            <div className="px-2 py-2 border-b border-slate-800 text-[10px] uppercase tracking-wide text-slate-500 flex items-center justify-between gap-1">
              {!sidebarCollapsed && <span>Groups</span>}
              {!sidebarCollapsed && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleJoinGroup}
                    className="text-xs border border-slate-800 rounded px-1.5 py-0.5 bg-slate-950 hover:bg-slate-900 transition-colors"
                  >
                    Join
                  </button>
                  {canCreate && (
                    <button
                      onClick={handleCreateGroup}
                      className="text-sky-400 text-xs px-1.5 py-0.5 border border-slate-800 rounded"
                    >
                      +
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto text-sm">
              {groups.map((g) => {
                const isExpanded = expandedGroupId === g.id;
                const classrooms = groupClassrooms[g.id] || [];
                return (
                  <div key={g.id} className="border-b border-slate-800">
                    {/* Group header */}
                    <div
                      className={`flex items-center gap-1 cursor-pointer hover:bg-slate-900/80 transition-all ${
                        sidebarCollapsed ? "px-0 py-2 justify-center" : "px-2 py-2"
                      } ${isExpanded ? "bg-slate-900/60" : ""}`}
                      onClick={() => toggleGroup(g.id)}
                    >
                      {sidebarCollapsed ? (
                        <div
                          className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono"
                          title={g.name}
                        >
                          {g.name?.[0]?.toUpperCase() || "G"}
                        </div>
                      ) : (
                        <>
                          <span className="text-slate-500">
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{g.name}</div>
                            <div className="text-[10px] text-slate-500">
                              {g.member_count || 0} member{(g.member_count || 0) !== 1 ? "s" : ""}
                              {g.invite_code && (
                                <span className="ml-1 font-mono text-slate-600">
                                  [{g.invite_code}]
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Classrooms within group */}
                    {isExpanded && !sidebarCollapsed && (
                      <div className="bg-slate-950/40">
                        {classrooms.map((c) => (
                          <div
                            key={c.id}
                            className={`pl-6 pr-2 py-1.5 text-xs cursor-pointer hover:bg-slate-900/80 hover:translate-x-0.5 transition-all ${
                              currentClassroom?.id === c.id
                                ? "text-sky-400 bg-slate-900 border-l-2 border-sky-500"
                                : "text-slate-400"
                            }`}
                            onClick={() => openClassroom(c)}
                          >
                            {c.name}
                          </div>
                        ))}
                        {classrooms.length === 0 && (
                          <div className="pl-6 pr-2 py-1.5 text-[10px] text-slate-600">
                            No classrooms yet.
                          </div>
                        )}
                        {canCreate && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateClassroom(g.id);
                            }}
                            className="pl-6 pr-2 py-1 text-[10px] text-sky-500 hover:text-sky-400 w-full text-left transition-colors"
                          >
                            + New Classroom
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Middle / Right */}
          <div className="flex-1 flex flex-col">
            {view === "dashboard" && (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
                Select a group and classroom to begin.
              </div>
            )}

            {view === "classroom" && currentClassroom && (
              <ClassroomView
                classroom={currentClassroom}
                assignments={assignments}
                canCreate={canCreate}
                userRole={user?.role || "student"}
                userId={user?.id || ""}
                submissionsByAssignment={submissionsByAssignment}
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
                drawingRoomId={drawingRoomId}
                userName={user?.name || "Anonymous"}
                userRole={user?.role || "student"}
                userId={user?.id || ""}
                groupMembers={groupMembers}
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
      {showCreateModal && (
        <CreateAssignmentModal
          onConfirm={handleCreateAssignmentConfirm}
          onCancel={() => setShowCreateModal(false)}
        />
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
  userRole: string;
  userId: string;
  submissionsByAssignment: Record<string, any[]>;
  onCreateAssignment: () => void;
  onOpenAssignment: (asg: any) => void;
  onBack: () => void;
}

const ClassroomView: React.FC<ClassroomViewProps> = ({
  classroom,
  assignments,
  canCreate,
  userRole,
  userId,
  submissionsByAssignment,
  onCreateAssignment,
  onOpenAssignment,
  onBack,
}) => {
  const hwCount = assignments.filter((a) => !!a.due_at).length;

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
          {hwCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              {hwCount} homework
            </span>
          )}
        </div>
        {canCreate && (
          <button
            onClick={onCreateAssignment}
            className="px-2.5 py-1 text-xs rounded-md bg-sky-500 text-slate-950 hover:bg-sky-400 font-medium transition-colors"
          >
            + New Assignment
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2">
        {assignments.map((a) => {
          const isHw = !!a.due_at;
          const subs = submissionsByAssignment[a.id] || [];
          const submittedCount = subs.length;
          const mySub = userRole === "student"
            ? (subs.find((s: any) => s.user_id === userId) || null)
            : null;
          const late = mySub ? isSubmittedLate(mySub.submitted_at, a.due_at) : false;

          return (
            <div
              key={a.id}
              onClick={() => onOpenAssignment(a)}
              className={`px-4 py-3 border rounded-lg bg-slate-900 hover:bg-slate-800/80 hover:-translate-y-px cursor-pointer transition-all ${
                isHw
                  ? "border-indigo-800/60 border-l-2 border-l-indigo-500"
                  : "border-slate-800"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  {isHw && (
                    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      HW
                    </span>
                  )}
                  <span className="font-medium text-slate-100 text-sm truncate">{a.title}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Teacher: submission count */}
                  {userRole === "teacher" && (
                    <span className={`px-1.5 py-0.5 text-[10px] rounded-full border font-mono ${
                      submittedCount > 0
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-600/40"
                        : "bg-slate-800 text-slate-500 border-slate-700"
                    }`}>
                      {submittedCount} submitted
                    </span>
                  )}
                  {/* Student: own status */}
                  {userRole === "student" && mySub && (
                    <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${
                      late
                        ? "bg-orange-500/10 text-orange-400 border-orange-600/40"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-600/40"
                    }`}>
                      {late ? "Submitted Late" : "Submitted ✓"}
                    </span>
                  )}
                  {userRole === "student" && !mySub && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded border bg-slate-800/80 text-slate-500 border-slate-700">
                      Not Started
                    </span>
                  )}
                </div>
              </div>

              {a.description && (
                <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {a.description}
                </p>
              )}

              {isHw && (
                <div className="mt-2">
                  <DeadlineBadge dueAt={a.due_at} />
                </div>
              )}
            </div>
          );
        })}

        {assignments.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-slate-500">
            No assignments yet.{canCreate ? " Click \"+ New Assignment\" to create the first one." : ""}
          </div>
        )}
      </div>
    </div>
  );
};

interface AssignmentViewProps {
  assignment: any;
  code: string;
  setCode: (c: string) => void;
  output: string;
  roomId?: string;
  drawingRoomId?: string;
  userName?: string;
  userRole?: string;
  userId: string;
  groupMembers: any[];
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
  drawingRoomId,
  userName,
  userRole,
  userId,
  groupMembers,
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
  const [editorMode, setEditorMode] = useState<"code" | "draw">("code");
  const isSuccess = selectedSubmission?.status === "success";

  // Homework roster logic (teacher only)
  const isHomework = !!assignment.due_at;
  const showRoster = userRole === "teacher" && isHomework && groupMembers.length > 0;
  const subByUserId = Object.fromEntries(submissions.map((s: any) => [s.user_id, s]));
  const rosterRows = showRoster
    ? groupMembers.map((m: any) => {
        const sub = subByUserId[m.user_id] || null;
        const submitted = !!sub;
        const late = sub ? isSubmittedLate(sub.submitted_at, assignment.due_at) : false;
        return { ...m, sub, submitted, late };
      }).sort((a: any, b: any) => Number(b.submitted) - Number(a.submitted))
    : [];
  const submittedCount = rosterRows.filter((r: any) => r.submitted).length;

  // Deadline banner values (student only)
  const mySub = userRole === "student"
    ? (submissions.find((s: any) => s.user_id === userId) || null)
    : null;
  const deadlineUrgency = getDeadlineUrgency(assignment.due_at);
  const BANNER_COLORS: Record<DeadlineUrgency, string> = {
    none:    "",
    green:   "bg-emerald-950/40 border-emerald-800/60 text-emerald-300",
    yellow:  "bg-yellow-950/40 border-yellow-800/60 text-yellow-300",
    orange:  "bg-orange-950/50 border-orange-800/60 text-orange-300",
    red:     "bg-red-950/50 border-red-800/60 text-red-300",
    overdue: "bg-red-950/50 border-red-800/60 text-red-300",
  };

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
          {isHomework && <DeadlineBadge dueAt={assignment.due_at} />}
        </div>
      </div>

      {/* Homework banner — teacher */}
      {isHomework && userRole === "teacher" && (
        <div className="px-4 py-1.5 border-b border-indigo-800/50 bg-indigo-950/40 text-xs flex items-center justify-between">
          <span className="text-indigo-300 font-medium">
            📋 Homework Assignment — Due {formatDueDate(assignment.due_at)}
            {" · "}{formatTimeRemaining(assignment.due_at)}
          </span>
          <span className="text-indigo-400/60 text-[10px]">
            {submittedCount}/{groupMembers.length > 0 ? groupMembers.length : "?"} submitted
          </span>
        </div>
      )}

      {/* Deadline banner — student only, homework assignments */}
      {isHomework && userRole === "student" && deadlineUrgency !== "none" && (
        <div className={`px-4 py-1.5 border-b text-xs flex items-center justify-between ${BANNER_COLORS[deadlineUrgency]}`}>
          <span>
            {deadlineUrgency === "overdue"
              ? "⚠ This assignment is overdue"
              : `Due: ${formatDueDate(assignment.due_at)} — ${formatTimeRemaining(assignment.due_at)}`}
          </span>
          {mySub && (
            <span className={`font-medium ${isSubmittedLate(mySub.submitted_at, assignment.due_at) ? "text-orange-300" : "text-emerald-300"}`}>
              Submitted {new Date(mySub.submitted_at).toLocaleString()}
              {isSubmittedLate(mySub.submitted_at, assignment.due_at) ? " (Late)" : " ✓"}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        {/* Code editor and output */}
        <div className="flex-1 flex flex-col border-r border-slate-800 transition-colors rounded-tl-lg rounded-bl-lg bg-slate-900/80">
          <div className="px-4 py-2 text-[11px] text-slate-400 flex items-center justify-between border-b border-slate-800/80">
            {/* Code / Draw mode toggle */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEditorMode("code")}
                className={`px-2 py-0.5 rounded-t-md border-b-0 border text-xs font-mono transition-colors ${
                  editorMode === "code"
                    ? "border-sky-500 text-sky-400 bg-slate-900 shadow-[0_0_0_1px_rgba(56,189,248,0.35)_inset]"
                    : "border-slate-700 text-slate-300 bg-slate-950 hover:bg-slate-900"
                }`}
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => setEditorMode("draw")}
                className={`px-2 py-0.5 rounded-t-md border-b-0 border text-xs font-mono transition-colors ${
                  editorMode === "draw"
                    ? "border-sky-500 text-sky-400 bg-slate-900 shadow-[0_0_0_1px_rgba(56,189,248,0.35)_inset]"
                    : "border-slate-700 text-slate-300 bg-slate-950 hover:bg-slate-900"
                }`}
              >
                Draw
              </button>
            </div>
            {editorMode === "code" && (
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
            )}
          </div>
          <div className="flex-1 min-h-0 border-t border-slate-800 bg-slate-950 rounded-b-lg overflow-hidden">
            {editorMode === "code" ? (
              <CodeEditor
                key={activeFileId || "single-file"}
                value={code}
                onChange={setCode}
                roomId={roomId}
                userName={userName}
                userRole={userRole}
                className="bg-slate-950"
              />
            ) : (
              <DrawingCanvas
                roomId={drawingRoomId}
                userName={userName}
                userRole={userRole}
                className="h-full"
              />
            )}
          </div>
          {editorMode === "code" && (
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
                className={`px-3 py-1.5 text-xs rounded-md disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-colors ${
                  isHomework
                    ? "border border-indigo-700 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 focus-visible:ring-indigo-500/60"
                    : "border border-slate-800 bg-slate-950 hover:bg-slate-900 focus-visible:ring-slate-500/60"
                }`}
              >
                {isHomework ? "Submit Homework" : "Submit"}
              </button>
            </div>
          )}
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

        {/* Submissions / Roster panel */}
        {showRoster ? (
          <div className="w-64 flex flex-col border-r border-slate-800 transition-colors bg-slate-900/90">
            <div className="px-3 py-2 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wide flex items-center justify-between">
              <span>Roster</span>
              <span className={`font-mono text-[11px] ${submittedCount === rosterRows.length ? "text-emerald-400" : "text-slate-400"}`}>
                {submittedCount}/{rosterRows.length}
              </span>
            </div>
            <ul className="flex-1 overflow-auto text-xs">
              {rosterRows.map((row: any) => {
                const sub = row.sub;
                return (
                  <li
                    key={row.user_id}
                    className={`px-3 py-2 border-b border-slate-800 transition-colors ${
                      sub ? "cursor-pointer hover:bg-slate-800/80" : "opacity-70"
                    } ${selectedSubmission?.id === sub?.id ? "bg-slate-800" : ""}`}
                    onClick={() => sub && onSelectSubmission(selectedSubmission?.id === sub.id ? null : sub)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-200 truncate" title={row.name}>
                        {row.name || "Student"}
                      </span>
                      {row.submitted ? (
                        <span className={`shrink-0 px-1.5 py-0.5 text-[10px] rounded border font-medium ${
                          row.late
                            ? "bg-orange-500/10 text-orange-400 border-orange-600/40"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-600/40"
                        }`}>
                          {row.late ? "Late" : "✓"}
                        </span>
                      ) : (
                        <span className="shrink-0 px-1.5 py-0.5 text-[10px] rounded border bg-red-500/10 text-red-400 border-red-600/40">
                          Missing
                        </span>
                      )}
                    </div>
                    {sub && (
                      <div className="mt-0.5 text-slate-500 text-[10px]">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </div>
                    )}
                  </li>
                );
              })}
              {rosterRows.length === 0 && (
                <li className="px-3 py-3 text-slate-500">No students enrolled.</li>
              )}
            </ul>
          </div>
        ) : (
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
        )}

        {/* Submission detail */}
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
