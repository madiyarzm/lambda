import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CodeEditor } from "./components/CodeEditor";
import { DrawingCanvas } from "./components/DrawingCanvas";
import { SimpleInputModal } from "./components/SimpleInputModal";
import {
  addSubmissionFeedback,
  createAssignment,
  createClassroom,
  createGroup,
  createSubmission,
  getHint,
  getMe,
  getMyActivity,
  getMyStats,
  isLoggedIn,
  joinGroup,
  listAllUsers,
  listAssignments,
  listClassrooms,
  listGroupMembers,
  listGroups,
  listSubmissions,
  logout,
  runSandbox,
  updateUserRole,
} from "./lib/api";
import { Play, X, Users, Shield, Hand, Home, LogOut, Trophy, Flame, Gem, Zap, PenLine, Crown, Star } from "lucide-react";
import { Confetti } from "./components/Confetti";
import { ChalkLogo } from "./components/Logo";
import { Avatar } from "./components/Avatar";
import { Badge } from "./components/Badge";
import { ActivityGraph } from "./components/ActivityGraph";

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

const URGENCY_STYLES: Record<DeadlineUrgency, { bg: string; color: string }> = {
  none:    { bg: "var(--bg-3)", color: "var(--muted)" },
  green:   { bg: "var(--mint-muted)", color: "var(--mint)" },
  yellow:  { bg: "var(--amber-muted)", color: "var(--amber)" },
  orange:  { bg: "var(--amber-muted)", color: "var(--amber)" },
  red:     { bg: "var(--rose-muted)", color: "var(--rose)" },
  overdue: { bg: "var(--rose-muted)", color: "var(--rose)" },
};

const DeadlineBadge: React.FC<{ dueAt: string; className?: string }> = ({ dueAt, className = "" }) => {
  const urgency = getDeadlineUrgency(dueAt);
  const s = URGENCY_STYLES[urgency];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full font-mono font-medium ${className}`}
      style={{ background: s.bg, color: s.color }}
    >
      {urgency === "overdue" ? "⚠ OVERDUE" : `Due ${formatDueDate(dueAt)}`}
    </span>
  );
};

// ─── CreateAssignmentModal ──────────────────────────────────────────────────

interface CreateAssignmentModalData {
  title: string;
  description: string;
  templateCode: string;
  testCode: string | null;
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
  const [showTestCode, setShowTestCode] = useState(false);
  const [testCode, setTestCode] = useState("# assert your_function() == expected_output\n");
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
    onConfirm({ title: title.trim(), description, templateCode, testCode: showTestCode ? testCode : null, dueAt });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "oklch(0% 0 0 / 0.7)" }}>
      <div
        className="w-full max-w-lg rounded-[16px] shadow-2xl"
        style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold">New Assignment</h2>
          <button type="button" onClick={onCancel} style={{ color: "var(--subtle)" }} className="hover:text-[var(--text)] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs" style={{ color: "var(--muted)" }}>Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { hw: false, emoji: "💻", title: "In-class Exercise", desc: "Live coding session, no deadline", accent: "var(--indigo)" },
                { hw: true, emoji: "📋", title: "Homework", desc: "Completed outside class, with deadline", accent: "var(--mint)" },
              ].map(opt => (
                <button
                  key={String(opt.hw)}
                  type="button"
                  onClick={() => setIsHomework(opt.hw)}
                  className="flex flex-col items-start gap-1 px-3 py-3 rounded-[10px] border text-left transition-all"
                  style={{
                    borderColor: isHomework === opt.hw ? opt.accent : "var(--border)",
                    background: isHomework === opt.hw ? `${opt.accent}15` : "var(--bg-3)",
                    outline: isHomework === opt.hw ? `1px solid ${opt.accent}40` : undefined,
                  }}
                >
                  <span className="text-lg leading-none">{opt.emoji}</span>
                  <span className="text-xs font-semibold" style={{ color: isHomework === opt.hw ? opt.accent : "var(--text)" }}>{opt.title}</span>
                  <span className="text-[10px] leading-snug" style={{ color: "var(--subtle)" }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {isHomework && (
            <div className="flex items-center gap-2 p-3 rounded-[10px]" style={{ background: "var(--indigo-muted)", border: "1px solid oklch(55% 0.22 264 / 0.25)" }}>
              <span className="text-xs font-medium shrink-0" style={{ color: "var(--indigo)" }}>Due:</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 rounded bg-[var(--bg)] border border-[var(--border)] px-2 py-1 text-xs focus:outline-none"
                style={{ color: "var(--text)" }}
              />
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-24 rounded bg-[var(--bg)] border border-[var(--border)] px-2 py-1 text-xs focus:outline-none"
                style={{ color: "var(--text)" }}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs" style={{ color: "var(--muted)" }}>Title <span style={{ color: "var(--rose)" }}>*</span></label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Variables & Data Types"
              className="w-full rounded-[10px] px-3 py-2 text-sm placeholder:opacity-40 focus:outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs" style={{ color: "var(--muted)" }}>Instructions</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what students should do…"
              rows={3}
              className="w-full rounded-[10px] px-3 py-2 text-sm placeholder:opacity-40 focus:outline-none resize-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs" style={{ color: "var(--muted)" }}>Starter Code</label>
            <textarea
              value={templateCode}
              onChange={(e) => setTemplateCode(e.target.value)}
              rows={5}
              className="w-full rounded-[10px] px-3 py-2 text-xs font-mono focus:outline-none resize-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          <div
            className="space-y-2 rounded-[10px] p-3"
            style={{ background: "var(--bg-3)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium">Auto-Grading Tests</span>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--subtle)" }}>
                  Runs after submission — students see pass/fail.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTestCode(v => !v)}
                className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                style={{ background: showTestCode ? "var(--indigo)" : "var(--border-2)" }}
                role="switch"
                aria-checked={showTestCode}
              >
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: showTestCode ? "translateX(18px)" : "translateX(2px)" }}
                />
              </button>
            </div>
            {showTestCode && (
              <textarea
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                rows={4}
                placeholder="# assert my_function(2) == 4"
                className="w-full rounded-[10px] px-3 py-2 text-xs font-mono placeholder:opacity-40 focus:outline-none resize-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs rounded-[10px] transition-colors"
              style={{ border: "1px solid var(--border)", color: "var(--muted)", background: "transparent" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || (isHomework && !dueDate)}
              className="px-4 py-1.5 text-xs rounded-[10px] font-semibold disabled:opacity-50 transition-colors"
              style={{ background: "var(--indigo)", color: "#fff" }}
            >
              {isHomework ? "Create Homework" : "Create Exercise"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ─── XP Bar ────────────────────────────────────────────────────────────────

function xpLevel(xp: number): { level: number; title: string; next: number; prev: number } {
  const thresholds = [
    { level: 1, title: "Novice", xp: 0 },
    { level: 2, title: "Apprentice", xp: 300 },
    { level: 3, title: "Coder", xp: 700 },
    { level: 4, title: "Hacker", xp: 1500 },
    { level: 5, title: "Expert", xp: 3000 },
    { level: 6, title: "Master", xp: 5500 },
    { level: 7, title: "Legend", xp: 10000 },
  ];
  let current = thresholds[0];
  let next = thresholds[1];
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (xp >= thresholds[i].xp && xp < thresholds[i + 1].xp) {
      current = thresholds[i];
      next = thresholds[i + 1];
      break;
    }
    if (xp >= thresholds[thresholds.length - 1].xp) {
      current = thresholds[thresholds.length - 1];
      next = thresholds[thresholds.length - 1];
    }
  }
  return { level: current.level, title: current.title, next: next.xp, prev: current.xp };
}


// ─── App types ─────────────────────────────────────────────────────────────

type View = "dashboard" | "classroom" | "assignment" | "submissions";

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
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [user, setUser] = useState<any | null>(null);

  const [groups, setGroups] = useState<any[]>([]);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [groupClassrooms, setGroupClassrooms] = useState<Record<string, any[]>>({});

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_sidebarCollapsed, _setSidebarCollapsed] = useState(false);
  const [currentClassroom, setCurrentClassroom] = useState<any | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [files, setFiles] = useState<EditorFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [output, setOutput] = useState<string>("(Run or submit to see output)");
  const [stdinInput, setStdinInput] = useState<string>("");
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submissionsByAssignment, setSubmissionsByAssignment] = useState<Record<string, any[]>>({});
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [showCreateClassroomModal, setShowCreateClassroomModal] = useState<string | null>(null);
  const [showAddFileModal, setShowAddFileModal] = useState(false);

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const [xp, setXp] = useState<number | null>(null);
  const [activityDays, setActivityDays] = useState<{ date: string; count: number }[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  const [viewAsRole, setViewAsRole] = useState<"teacher" | "student" | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const init = async () => {
      if (isLoggedIn()) {
        try {
          const me = await getMe();
          setUser(me);
          const [grps, stats, activity] = await Promise.all([
            listGroups(),
            getMyStats().catch(() => null),
            getMyActivity().catch(() => null),
          ]);
          setGroups(grps || []);
          if (stats) setXp(stats.xp);
          if (activity) setActivityDays(activity.days);
          if (grps && grps.length > 0) {
            const clsResults = await Promise.all(grps.map((g: any) => listClassrooms(g.id).catch(() => [])));
            const clsMap: Record<string, any[]> = {};
            grps.forEach((g: any, idx: number) => { clsMap[g.id] = clsResults[idx] || []; });
            setGroupClassrooms(clsMap);
          }
          setAuthChecked(true);
        } catch {
          logout();
          navigate("/", { replace: true });
        }
      } else {
        navigate("/", { replace: true });
      }
    };
    void init();
  }, []);

  useEffect(() => {
    if (!currentAssignment) return;
    const id = setInterval(async () => {
      try {
        const subs = await listSubmissions(currentAssignment.id);
        setSubmissions(subs || []);
        setSelectedSubmission((prev: any) =>
          prev ? (subs || []).find((s: any) => s.id === prev.id) ?? prev : null,
        );
      } catch {}
    }, 5_000);
    return () => clearInterval(id);
  }, [currentAssignment?.id]);

  const handleLogout = () => { logout(); navigate("/", { replace: true }); };
  const handleCreateGroup = () => setShowCreateGroupModal(true);

  const handleCreateGroupConfirm = async (name: string) => {
    setShowCreateGroupModal(false);
    setError(null);
    try {
      const grp = await createGroup(name, "");
      setGroups(prev => [...prev, grp]);
    } catch (e: any) { setError(e.message || "Failed to create group."); }
  };

  const handleJoinGroup = () => setShowJoinGroupModal(true);

  const handleJoinGroupConfirm = async (code: string) => {
    setShowJoinGroupModal(false);
    setError(null);
    try {
      await joinGroup(code);
      const grps = await listGroups();
      setGroups(grps || []);
    } catch (e: any) { setError(e.message || "Failed to join group."); }
  };

  const toggleGroup = async (groupId: string) => {
    if (expandedGroupId === groupId) { setExpandedGroupId(null); return; }
    setExpandedGroupId(groupId);
    if (!groupClassrooms[groupId]) {
      try {
        const cls = await listClassrooms(groupId);
        setGroupClassrooms(prev => ({ ...prev, [groupId]: cls || [] }));
      } catch (e: any) { setError(e.message || "Failed to load classrooms."); }
    }
  };

  const handleCreateClassroom = (groupId: string) => setShowCreateClassroomModal(groupId);

  const handleCreateClassroomConfirm = async (name: string) => {
    const groupId = showCreateClassroomModal;
    setShowCreateClassroomModal(null);
    if (!groupId) return;
    setError(null);
    try {
      const cls = await createClassroom(groupId, name, "");
      setGroupClassrooms(prev => ({ ...prev, [groupId]: [...(prev[groupId] || []), cls] }));
    } catch (e: any) { setError(e.message || "Failed to create classroom."); }
  };

  const openClassroom = async (cls: any) => {
    setCurrentClassroom(cls);
    setError(null);
    try {
      const asg = await listAssignments(cls.id);
      setAssignments(asg || []);
      if (asg?.length) {
        const results = await Promise.all(asg.map((a: any) => listSubmissions(a.id).catch(() => [])));
        const map: Record<string, any[]> = {};
        asg.forEach((a: any, i: number) => { map[a.id] = results[i] || []; });
        setSubmissionsByAssignment(map);
      } else {
        setSubmissionsByAssignment({});
      }
      setView("classroom");
    } catch (e: any) { setError(e.message || "Failed to load assignments."); }
  };

  const handleCreateAssignment = () => setShowCreateModal(true);

  const handleCreateAssignmentConfirm = async (data: CreateAssignmentModalData) => {
    if (!currentClassroom) return;
    setShowCreateModal(false);
    setError(null);
    try {
      const asg = await createAssignment(currentClassroom.id, data.title, data.description, data.templateCode, data.dueAt, data.testCode);
      setAssignments(prev => [...prev, asg]);
      setSubmissionsByAssignment(prev => ({ ...prev, [asg.id]: [] }));
    } catch (e: any) { setError(e.message || "Failed to create assignment."); }
  };

  const openAssignment = async (asg: any) => {
    setCurrentAssignment(asg);
    setSelectedSubmission(null);
    const initialCode = asg.template_code || "# Write your code here\n\n";
    const defaultName = (asg.title || "main").replace(/\s+/g, "_").toLowerCase() + ".py";
    const initialFile: EditorFile = { id: asg.id || "main", name: defaultName, content: initialCode };
    setFiles([initialFile]);
    setActiveFileId(initialFile.id);
    setCode(initialCode);
    setOutput("(Run or submit to see output)");
    setTerminalEntries([]);
    setError(null);
    setFailedAttempts(0);
    setHint(null);
    try {
      const subs = await listSubmissions(asg.id);
      setSubmissions(subs || []);
      if (effectiveRole === "teacher" && asg.due_at && currentClassroom?.group_id) {
        try {
          const members = await listGroupMembers(currentClassroom.group_id);
          setGroupMembers((members || []).filter((m: any) => m.role === "student"));
        } catch { setGroupMembers([]); }
      } else { setGroupMembers([]); }
      setView("assignment");
    } catch (e: any) { setError(e.message || "Failed to load submissions."); }
  };

  const handleAddFile = () => { if (currentAssignment) setShowAddFileModal(true); };

  const handleAddFileConfirm = (name: string) => {
    setShowAddFileModal(false);
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const file: EditorFile = { id, name, content: "" };
    setFiles(prev => [...prev, file]);
    setActiveFileId(id);
    setCode("");
  };

  const handleSelectFile = (id: string) => {
    const file = files.find(f => f.id === id);
    if (!file) return;
    setActiveFileId(id);
    setCode(file.content);
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (!activeFileId) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: value } : f));
  };

  const handleRun = async () => {
    if (!currentAssignment) return;
    setLoading(true);
    setOutput("Running…");
    const activeFile = files.find(f => f.id === activeFileId) || files[0] || null;
    const fileName = activeFile?.name || "main.py";
    try {
      const res = await runSandbox(code, stdinInput);
      const text = res?.stdout || res?.stderr || JSON.stringify(res?.result_json || {});
      setOutput(text);
      const status: "success" | "error" = res?.status === "success" ? "success" : "error";
      setTerminalEntries(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, type: "run", fileName, timestamp: new Date().toLocaleTimeString(), status, output: text }]);
    } catch (e: any) {
      const text = `Error: ${e.message}`;
      setOutput(text);
      setTerminalEntries(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, type: "run", fileName, timestamp: new Date().toLocaleTimeString(), status: "error", output: text }]);
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!currentAssignment) return;
    setLoading(true);
    setError(null);
    const activeFile = files.find(f => f.id === activeFileId) || files[0] || null;
    const fileName = activeFile?.name || "main.py";
    try {
      const sub = await createSubmission(currentAssignment.id, code);
      setSubmissions(prev => [sub, ...prev]);
      if (sub.status === "success") {
        setShowConfetti(true);
        setXp(prev => (prev ?? 0) + 10);
        setFailedAttempts(0);
        setHint(null);
      } else {
        setXp(prev => (prev ?? 0) + 2);
        setFailedAttempts(prev => prev + 1);
      }
      const text = `Submitted! Status: ${sub.status}`;
      setOutput(text);
      const status: "success" | "error" = sub.status === "success" ? "success" : "error";
      setTerminalEntries(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, type: "submit", fileName, timestamp: new Date().toLocaleTimeString(), status, output: text }]);
    } catch (e: any) { setError(e.message || "Failed to submit."); } finally { setLoading(false); }
  };

  const isAdmin = user?.email === "madiyar.zmm@gmail.com";
  const effectiveRole: "teacher" | "student" = (isAdmin && viewAsRole) ? viewAsRole : (user?.role || "student");
  const canCreate = effectiveRole === "teacher";

  const handleOpenAdminPanel = async () => {
    setShowAdminPanel(true);
    setAdminLoading(true);
    try {
      const users = await listAllUsers();
      setAdminUsers(users || []);
    } catch (e: any) { setError(e.message || "Failed to load users."); } finally { setAdminLoading(false); }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "teacher" ? "student" : "teacher";
    try {
      const updated = await updateUserRole(userId, newRole as "teacher" | "student");
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, role: updated.role } : u));
    } catch (e: any) { setError(e.message || "Failed to update role."); }
  };

  const handleGetHint = async () => {
    if (!currentAssignment) return;
    setHintLoading(true);
    try {
      const h = await getHint(currentAssignment.id, code, failedAttempts);
      setHint(h);
      setXp(prev => Math.max(0, (prev ?? 0) - 5));
    } catch { setHint("Keep going — re-read the problem statement and trace through your code step by step."); } finally { setHintLoading(false); }
  };

  const handleSaveFeedback = async (submissionId: string, feedback: string) => {
    const updated = await addSubmissionFeedback(submissionId, feedback);
    setSelectedSubmission(updated);
    setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, feedback: updated.feedback } : s));
  };

  const handleClearTerminal = () => setTerminalEntries([]);

  const roomIdForEditor = currentClassroom && currentAssignment && activeFileId
    ? `${currentClassroom.id}:${currentAssignment.id}:${activeFileId}` : undefined;

  const drawingRoomId = currentClassroom && currentAssignment
    ? `drawing:${currentClassroom.id}:${currentAssignment.id}` : undefined;

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="flex items-center gap-3 text-sm" style={{ color: "var(--muted)" }}>
          <span
            className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--indigo)", borderTopColor: "transparent" }}
          />
          Loading…
        </div>
      </div>
    );
  }

  // ── nav items per role ────────────────────────────────────────────────────
  const teacherNav = [
    { id: "dashboard" as View, label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "classroom" as View, label: "Classroom", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { id: "submissions" as View, label: "Submissions", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  ];
  const studentNav = [
    { id: "dashboard" as View, label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "classroom" as View, label: "Classroom", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { id: "assignment" as View, label: "Editor", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
  ];
  const navItems = effectiveRole === "teacher" ? teacherNav : studentNav;
  // classroom nav item links to classroom view only if a classroom is selected
  const handleNavClick = (id: View) => {
    if (id === "classroom" && !currentClassroom) return;
    if (id === "assignment" && !currentAssignment) return;
    if (id === "submissions" && !currentClassroom) return;
    setView(id);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 220, flexShrink: 0, height: "100vh", position: "sticky", top: 0,
        display: "flex", flexDirection: "column",
        background: "var(--bg)", borderRight: "1px solid var(--border)", padding: "18px 10px",
      }}>
        {/* Logo */}
        <div style={{ padding: "2px 10px 18px", borderBottom: "1px solid var(--border)", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <ChalkLogo size={26} />
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
            style={{ background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-3)", fontSize: 14 }}
            title="Toggle theme"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>

        {/* Nav items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {navItems.map(item => {
            const isActive = view === item.id;
            const isDisabled = (item.id === "classroom" && !currentClassroom) ||
              (item.id === "assignment" && !currentAssignment) ||
              (item.id === "submissions" && !currentClassroom);
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: "var(--r)", border: "none",
                  background: isActive ? "var(--indigo-10)" : "transparent",
                  color: isActive ? "var(--indigo)" : isDisabled ? "var(--border-2)" : "var(--text-3)",
                  cursor: isDisabled ? "default" : "pointer",
                  fontSize: 13, fontWeight: isActive ? 600 : 500, textAlign: "left",
                  transition: "background 120ms",
                }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </button>
            );
          })}

          {/* Classroom list (under Classroom nav) */}
          {groups.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 12px 6px" }}>
                Classrooms
              </div>
              {groups.map(g => {
                const isExpanded = expandedGroupId === g.id;
                const classrooms = groupClassrooms[g.id] || [];
                return (
                  <div key={g.id}>
                    <button
                      onClick={() => toggleGroup(g.id)}
                      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 12px", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 12, fontWeight: 600 }}
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={isExpanded ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                      </svg>
                      <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
                    </button>
                    {isExpanded && classrooms.map(c => (
                      <button
                        key={c.id}
                        onClick={() => openClassroom(c)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, width: "100%",
                          padding: "6px 12px 6px 28px", border: "none",
                          cursor: "pointer", fontSize: 12,
                          color: currentClassroom?.id === c.id ? "var(--indigo)" : "var(--text-3)",
                          background: currentClassroom?.id === c.id ? "var(--indigo-10)" : "transparent",
                          borderRadius: "var(--r)",
                        }}
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                      </button>
                    ))}
                    {isExpanded && classrooms.length === 0 && (
                      <div style={{ padding: "4px 12px 4px 28px", fontSize: 11, color: "var(--border-2)" }}>No classrooms</div>
                    )}
                    {isExpanded && canCreate && (
                      <button
                        onClick={e => { e.stopPropagation(); handleCreateClassroom(g.id); }}
                        style={{ display: "block", width: "100%", padding: "4px 12px 4px 28px", background: "transparent", border: "none", cursor: "pointer", fontSize: 11, color: "var(--indigo)", textAlign: "left" }}
                      >
                        + New Classroom
                      </button>
                    )}
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: 4, padding: "4px 12px" }}>
                <button onClick={handleJoinGroup} style={{ flex: 1, padding: "5px 0", borderRadius: 6, fontSize: 11, fontWeight: 500, background: "var(--bg-3)", border: "none", cursor: "pointer", color: "var(--text-3)" }}>Join</button>
                {canCreate && <button onClick={handleCreateGroup} style={{ flex: 1, padding: "5px 0", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "var(--bg-3)", border: "none", cursor: "pointer", color: "var(--indigo)" }}>+ Group</button>}
              </div>
            </div>
          )}
        </div>

        {/* VIEW AS — admin only */}
        {isAdmin && (
          <div style={{ background: "var(--bg-2)", borderRadius: "var(--r)", padding: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>View as</div>
            <div style={{ display: "flex", gap: 4, background: "var(--bg-3)", borderRadius: 8, padding: 3 }}>
              {(["teacher", "student"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => { setViewAsRole(r); setFailedAttempts(0); setHint(null); }}
                  style={{
                    flex: 1, padding: "5px 0", borderRadius: 6, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                    background: effectiveRole === r ? "var(--bg)" : "transparent",
                    color: effectiveRole === r ? "var(--text)" : "var(--text-3)",
                    boxShadow: effectiveRole === r ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    textTransform: "capitalize",
                  }}
                >{r}</button>
              ))}
            </div>
          </div>
        )}

        {/* User row */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 6px 8px" }}>
            <Avatar name={user?.name || user?.email || "?"} size={32} pulse={false} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "capitalize" }}>{effectiveRole}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {isAdmin && (
              <button
                onClick={handleOpenAdminPanel}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "5px 0", borderRadius: 6, fontSize: 11, background: "var(--bg-3)", border: "none", cursor: "pointer", color: "var(--text-3)" }}
              >
                <Users className="h-3 w-3" /> Users
              </button>
            )}
            <button
              onClick={handleLogout}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "5px 0", borderRadius: 6, fontSize: 11, background: "var(--bg-3)", border: "none", cursor: "pointer", color: "var(--text-3)" }}
            >
              <LogOut className="h-3 w-3" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: "100vh" }}>
        {error && (
          <div style={{ background: "var(--rose-muted)", borderBottom: "1px solid var(--border)", color: "var(--rose)", padding: "8px 16px", fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {view === "dashboard" && (
            <DashboardView
              user={user}
              groups={groups}
              canCreate={canCreate}
              effectiveRole={effectiveRole}
              xp={xp}
              activityDays={activityDays}
              onCreateGroup={handleCreateGroup}
              onJoinGroup={handleJoinGroup}
              groupClassrooms={groupClassrooms}
              onOpenClassroom={openClassroom}
            />
          )}
          {view === "classroom" && currentClassroom && (
            <ClassroomView
              classroom={currentClassroom}
              assignments={assignments}
              canCreate={canCreate}
              userRole={effectiveRole}
              userId={user?.id || ""}
              submissionsByAssignment={submissionsByAssignment}
              groupMembers={groupMembers}
              onCreateAssignment={handleCreateAssignment}
              onOpenAssignment={openAssignment}
              onBack={() => setView("dashboard")}
            />
          )}
          {view === "submissions" && currentClassroom && (
            <SubmissionsView
              classroom={currentClassroom}
              assignments={assignments}
              submissions={submissions}
              selectedSubmission={selectedSubmission}
              onSelectSubmission={setSelectedSubmission}
              onOpenAssignment={openAssignment}
              onBack={() => setView("classroom")}
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
              userRole={effectiveRole}
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
              stdinInput={stdinInput}
              onStdinChange={setStdinInput}
              onRun={handleRun}
              onSubmit={handleSubmit}
              onBack={() => setView("classroom")}
              onSaveFeedback={handleSaveFeedback}
              failedAttempts={failedAttempts}
              hint={hint}
              hintLoading={hintLoading}
              onGetHint={handleGetHint}
              onDismissHint={() => setHint(null)}
              xp={xp}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateAssignmentModal onConfirm={handleCreateAssignmentConfirm} onCancel={() => setShowCreateModal(false)} />
      )}
      {showCreateGroupModal && (
        <SimpleInputModal title="New Group" placeholder="e.g. Python Basics — Spring 2026" confirmLabel="Create Group" onConfirm={handleCreateGroupConfirm} onCancel={() => setShowCreateGroupModal(false)} />
      )}
      {showJoinGroupModal && (
        <SimpleInputModal title="Join Group" placeholder="Enter invite code" confirmLabel="Join" onConfirm={handleJoinGroupConfirm} onCancel={() => setShowJoinGroupModal(false)} />
      )}
      {showCreateClassroomModal && (
        <SimpleInputModal title="New Classroom" placeholder="e.g. Introduction to OOP" confirmLabel="Create Classroom" onConfirm={handleCreateClassroomConfirm} onCancel={() => setShowCreateClassroomModal(null)} />
      )}
      {showAddFileModal && (
        <SimpleInputModal title="New File" placeholder="filename.py" defaultValue={`file${files.length + 1}.py`} confirmLabel="Add File" onConfirm={handleAddFileConfirm} onCancel={() => setShowAddFileModal(false)} />
      )}

      {showAdminPanel && (
        <div className="fixed inset-0 z-50 flex items-start justify-end" style={{ background: "oklch(0% 0 0 / 0.6)" }}>
          <div
            className="h-full w-full max-w-md flex flex-col shadow-2xl"
            style={{ background: "var(--bg-2)", borderLeft: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" style={{ color: "var(--amber)" }} />
                <h2 className="text-sm font-semibold">User Management</h2>
              </div>
              <button onClick={() => setShowAdminPanel(false)} className="transition-colors" style={{ color: "var(--subtle)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto divide-y" style={{ borderColor: "var(--border)" }}>
              {adminLoading ? (
                <div className="flex items-center justify-center h-32 text-sm gap-2" style={{ color: "var(--muted)" }}>
                  <span className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--indigo)", borderTopColor: "transparent" }} />
                  Loading users…
                </div>
              ) : (
                adminUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <Avatar name={u.name || u.email} size={28} />
                      <div>
                        <div className="text-sm font-medium truncate">{u.name}</div>
                        <div className="text-xs truncate" style={{ color: "var(--subtle)" }}>{u.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge type={u.role === "teacher" ? "in-progress" : "default"} label={u.role} />
                      {u.email !== "madiyar.zmm@gmail.com" && (
                        <button
                          onClick={() => handleToggleRole(u.id, u.role)}
                          className="text-[11px] px-2 py-1 rounded-[8px] border transition-colors"
                          style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
                        >
                          {u.role === "teacher" ? "→ Student" : "→ Teacher"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
              {!adminLoading && adminUsers.length === 0 && (
                <div className="px-5 py-8 text-center text-xs" style={{ color: "var(--subtle)" }}>No users found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />
    </div>
  );
};

// ─── XP / cosmetics constants ────────────────────────────────────────────────

const XP_FRAMES = [
  { id: "plain",  name: "Default", cost: 0,    color: "var(--border)",        glow: "none", unlocked: true },
  { id: "bronze", name: "Bronze",  cost: 100,  color: "#cd7f32",              glow: "0 0 12px #cd7f3266" },
  { id: "silver", name: "Silver",  cost: 250,  color: "#c0c0c0",              glow: "0 0 12px #c0c0c066" },
  { id: "gold",   name: "Gold",    cost: 500,  color: "#ffd700",              glow: "0 0 16px #ffd70066" },
  { id: "cosmic", name: "Cosmic",  cost: 1000, color: "oklch(0.60 0.22 308)", glow: "0 0 20px oklch(0.60 0.22 308 / 0.5)" },
];

const XP_BGTYPES = [
  { id: "default", name: "Default", cost: 0,   bg: "linear-gradient(135deg, oklch(0.52 0.26 265) 0%, oklch(0.48 0.27 265) 100%)", unlocked: true },
  { id: "cosmic",  name: "Cosmic",  cost: 200, bg: "linear-gradient(135deg, #0d0221 0%, #1a0533 50%, #0d1b2a 100%)" },
  { id: "matrix",  name: "Matrix",  cost: 300, bg: "linear-gradient(135deg, #001100 0%, #003300 50%, #001a00 100%)" },
  { id: "sunset",  name: "Sunset",  cost: 400, bg: "linear-gradient(135deg, #ff6b35 0%, #f7c948 50%, #e8506a 100%)" },
  { id: "ocean",   name: "Ocean",   cost: 500, bg: "linear-gradient(135deg, #0575e6 0%, #021b79 100%)" },
];

const ACHIEVEMENTS: { id: string; Icon: React.ComponentType<{ size?: number; color?: string }>; name: string; desc: string; unlocked: boolean; rarity: string }[] = [
  { id: "first",     Icon: Trophy,  name: "First Blood",     desc: "First successful submission",     unlocked: true,  rarity: "common" },
  { id: "streak7",   Icon: Flame,   name: "Week Warrior",    desc: "7-day coding streak",              unlocked: true,  rarity: "rare" },
  { id: "perfect10", Icon: Gem,     name: "Perfectionist",   desc: "10 perfect score submissions",    unlocked: true,  rarity: "epic" },
  { id: "speed",     Icon: Zap,     name: "Speed Coder",     desc: "Submit in under 5 minutes",       unlocked: true,  rarity: "rare" },
  { id: "500lines",  Icon: PenLine, name: "Prolific Writer", desc: "500+ lines of code written",      unlocked: false, rarity: "rare" },
  { id: "collab",    Icon: Users,   name: "Team Player",     desc: "Edit in a session with 5+ peers", unlocked: false, rarity: "epic" },
  { id: "legend",    Icon: Crown,   name: "Legendary",       desc: "Reach Level 20",                  unlocked: false, rarity: "legendary" },
  { id: "nocopy",    Icon: Star,    name: "Original",        desc: "0% plagiarism on all work",       unlocked: true,  rarity: "common" },
];
const RARITY_COLOR: Record<string, string> = {
  common: "#94a3b8", rare: "#818cf8", epic: "oklch(0.60 0.22 308)", legendary: "#fbbf24",
};

// ─── Dashboard view ─────────────────────────────────────────────────────────

interface DashboardViewProps {
  user: any;
  groups: any[];
  groupClassrooms: Record<string, any[]>;
  canCreate: boolean;
  effectiveRole: string;
  xp: number | null;
  activityDays: { date: string; count: number }[];
  onCreateGroup: () => void;
  onJoinGroup: () => void;
  onOpenClassroom: (c: any) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ user, groups, groupClassrooms, canCreate, effectiveRole, xp, activityDays, onCreateGroup, onJoinGroup, onOpenClassroom }) => {
  // derive flat classroom list for teacher
  const allClassrooms = groups.flatMap(g => (groupClassrooms[g.id] || []).map((c: any) => ({ ...c, groupName: g.name })));
  // student: assignments across all classrooms
  const totalStudents = groups.reduce((sum, g) => sum + Math.max(0, (g.member_count || 1) - 1), 0);

  if (effectiveRole === "teacher") {
    const teacherStats = [
      { label: "Classrooms",      value: String(allClassrooms.length), iconPath: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", color: "var(--indigo)" },
      { label: "Total students",  value: String(totalStudents),        iconPath: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "oklch(0.55 0.22 308)" },
      { label: "Live right now",  value: String(allClassrooms.reduce((s: number, c: any) => s + (c.active || 0), 0)), iconPath: "M13 10V3L4 14h7v7l9-11h-7z", color: "var(--mint)", live: true },
      { label: "Pending reviews", value: "—",                          iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", color: "var(--amber)" },
    ];

    if (groups.length === 0) {
      return (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-2)" }}>
          <div style={{ textAlign: "center", maxWidth: 320 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--indigo-muted)", border: "1px solid oklch(55% 0.22 264 / 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Home className="h-6 w-6" style={{ color: "var(--indigo)" }} />
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Create your first group</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>Groups hold your classrooms and students. Create one and share the invite code.</p>
            <button onClick={onCreateGroup} style={{ padding: "10px 24px", background: "var(--indigo)", color: "#fff", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Create Group</button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ flex: 1, overflowY: "auto", background: "var(--bg-2)" }}>
        {/* Header */}
        <div style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)", padding: "24px 32px 20px" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋</h1>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>Here's what's happening in your classrooms today.</p>
        </div>

        <div style={{ padding: "24px 32px" }}>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            {teacherStats.map(s => (
              <div key={s.label} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "20px 20px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}1a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" fill="none" stroke={s.color} strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={s.iconPath} />
                    </svg>
                  </div>
                  {(s as any).live && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--mint)", background: "var(--mint-10)", borderRadius: 20, padding: "2px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--mint)", display: "inline-block", animation: "pulseDot 1.4s ease-in-out infinite" }} />
                      LIVE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Classrooms grid */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Classrooms</h2>
            {canCreate && (
              <button onClick={onCreateGroup} style={{ fontSize: 12, fontWeight: 600, color: "var(--indigo)", background: "var(--indigo-10)", border: "none", borderRadius: "var(--r)", padding: "6px 14px", cursor: "pointer" }}>+ New</button>
            )}
          </div>
          {allClassrooms.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", fontSize: 13, color: "var(--text-3)" }}>No classrooms yet. Create a group and add classrooms from the sidebar.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {allClassrooms.map((c: any) => {
                const submitted = 4; const total = Math.max(1, (c.member_count || 1) - 1);
                const pct = Math.round((submitted / total) * 100);
                return (
                  <button
                    key={c.id}
                    onClick={() => onOpenClassroom(c)}
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 20, textAlign: "left", cursor: "pointer", transition: "border-color 150ms" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--indigo)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--indigo-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--indigo)" }}>
                        {c.name?.[0]?.toUpperCase() || "C"}
                      </div>
                      {(c.active || 0) > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--mint)", background: "var(--mint-10)", borderRadius: 20, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--mint)", display: "inline-block" }} />
                          {c.active} live
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 12 }}>{c.groupName} · {total} students</div>
                    {/* Progress bar */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>
                        <span>Submissions</span><span>{pct}%</span>
                      </div>
                      <div style={{ height: 4, background: "var(--bg-3)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "var(--indigo)", borderRadius: 2, transition: "width 600ms ease" }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Student Dashboard ──────────────────────────────────────────────────────
  const [selectedFrame, setSelectedFrame] = useState("plain");
  const [selectedBg, setSelectedBg] = useState("default");
  const [shopOpen, setShopOpen] = useState(false);
  const frame = XP_FRAMES.find(f => f.id === selectedFrame) || XP_FRAMES[0];
  const bg = XP_BGTYPES.find(b => b.id === selectedBg) || XP_BGTYPES[0];
  const lvlInfo = xp !== null ? xpLevel(xp) : null;
  const xpPct = lvlInfo ? (lvlInfo.next === lvlInfo.prev ? 100 : Math.round(((xp! - lvlInfo.prev) / (lvlInfo.next - lvlInfo.prev)) * 100)) : 0;

  const studentStats = [
    { label: "Total XP",   value: xp !== null ? `${xp}` : "—",            sub: "points",  color: "var(--indigo)" },
    { label: "Level",      value: lvlInfo ? String(lvlInfo.level) : "—",   sub: lvlInfo?.title || "", color: "oklch(0.60 0.22 308)" },
    { label: "Streak",     value: "7",   sub: "days",    color: "var(--amber)" },
    { label: "Classrooms", value: String(allClassrooms.length), sub: "joined", color: "var(--mint)" },
  ];

  if (groups.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-2)" }}>
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--indigo-muted)", border: "1px solid oklch(55% 0.22 264 / 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Home className="h-6 w-6" style={{ color: "var(--indigo)" }} />
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Join a group to get started</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>Ask your teacher for an invite code to join a group.</p>
          <button onClick={onJoinGroup} style={{ padding: "10px 24px", background: "var(--indigo)", color: "#fff", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Join with Code</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--bg-2)" }}>
      {/* Profile hero */}
      <div style={{ background: bg.bg, padding: "28px 32px 24px", position: "relative", overflow: "hidden" }}>
        {/* Decorative orbs */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.06)", animation: "orbFloat 6s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: -60, left: "30%", width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)", animation: "orbFloat 8s ease-in-out infinite 1s" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 20 }}>
          {/* Avatar with XP frame */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", border: `3px solid ${frame.color}`, boxShadow: frame.glow !== "none" ? frame.glow : undefined, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.15)", fontSize: 24, fontWeight: 700, color: "#fff" }}>
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: "50%", background: "var(--mint)", border: "2px solid var(--bg)", animation: "pulseDot 2s ease-in-out infinite" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{user?.name || "Student"}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 10 }}>{lvlInfo?.title || "Novice"} · {xp ?? 0} XP</div>
            {/* XP bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${xpPct}%`, background: "#fff", borderRadius: 3, transition: "width 600ms ease" }} />
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontFamily: "DM Mono, monospace" }}>{xpPct}%</span>
            </div>
          </div>
          <button
            onClick={() => setShopOpen(o => !o)}
            style={{ padding: "8px 16px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "var(--r)", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer", backdropFilter: "blur(4px)" }}
          >
            {shopOpen ? "Close Shop" : "Customize"}
          </button>
        </div>
      </div>

      {/* Cosmetics shop */}
      {shopOpen && (
        <div style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)", padding: "20px 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Avatar Frame</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {XP_FRAMES.map(f => (
                  <button key={f.id} onClick={() => setSelectedFrame(f.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 10px", borderRadius: 8, border: `2px solid ${selectedFrame === f.id ? f.color : "var(--border)"}`, background: selectedFrame === f.id ? "var(--bg-2)" : "transparent", cursor: "pointer" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${f.color}`, boxShadow: f.glow !== "none" ? f.glow : undefined }} />
                    <span style={{ fontSize: 10, color: "var(--text-3)" }}>{f.name}</span>
                    {f.cost > 0 && <span style={{ fontSize: 9, color: "var(--amber)" }}>{f.cost} XP</span>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Background</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {XP_BGTYPES.map(b => (
                  <button key={b.id} onClick={() => setSelectedBg(b.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 8px", borderRadius: 8, border: `2px solid ${selectedBg === b.id ? "var(--indigo)" : "var(--border)"}`, background: "transparent", cursor: "pointer" }}>
                    <div style={{ width: 32, height: 20, borderRadius: 4, background: b.bg }} />
                    <span style={{ fontSize: 10, color: "var(--text-3)" }}>{b.name}</span>
                    {b.cost > 0 && <span style={{ fontSize: 9, color: "var(--amber)" }}>{b.cost} XP</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "24px 32px" }}>
        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {studentStats.map(s => (
            <div key={s.label} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
          <div>
            {/* Achievements */}
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Achievements</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
              {ACHIEVEMENTS.map(a => (
                <div key={a.id} style={{ background: "var(--bg)", border: `1px solid ${a.unlocked ? RARITY_COLOR[a.rarity] + "40" : "var(--border)"}`, borderRadius: "var(--r)", padding: "14px 10px", textAlign: "center", opacity: a.unlocked ? 1 : 0.45 }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 7 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: a.unlocked ? RARITY_COLOR[a.rarity] + "18" : "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <a.Icon size={18} color={a.unlocked ? RARITY_COLOR[a.rarity] : "var(--text-3)"} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: a.unlocked ? RARITY_COLOR[a.rarity] : "var(--text-3)", marginBottom: 2 }}>{a.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.4 }}>{a.desc}</div>
                </div>
              ))}
            </div>

            {/* Activity graph */}
            {activityDays.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Activity</h3>
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "16px 20px" }}>
                  <ActivityGraph days={activityDays} />
                </div>
              </div>
            )}
          </div>

          {/* Assignments list */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>My Classrooms</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {allClassrooms.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => onOpenClassroom(c)}
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "12px 14px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--indigo-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--indigo)", flexShrink: 0 }}>
                    {c.name?.[0]?.toUpperCase() || "C"}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>{c.groupName}</div>
                  </div>
                </button>
              ))}
              {allClassrooms.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px 0", fontSize: 12, color: "var(--text-3)" }}>
                  No classrooms yet.{" "}
                  <button onClick={onJoinGroup} style={{ color: "var(--indigo)", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Join one →</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ClassroomView ──────────────────────────────────────────────────────────

interface ClassroomViewProps {
  classroom: any;
  assignments: any[];
  canCreate: boolean;
  userRole: string;
  userId: string;
  submissionsByAssignment: Record<string, any[]>;
  groupMembers: any[];
  onCreateAssignment: () => void;
  onOpenAssignment: (asg: any) => void;
  onBack: () => void;
}

const ClassroomView: React.FC<ClassroomViewProps> = ({
  classroom, assignments, canCreate, userRole, userId,
  submissionsByAssignment, groupMembers, onCreateAssignment, onOpenAssignment, onBack,
}) => {
  const [activeTab, setActiveTab] = useState<"assignments" | "students">("assignments");

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-2)", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)", padding: "20px 32px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 12, padding: 0 }}>Dashboard</button>
          <span>›</span>
          <span>Classrooms</span>
          <span>›</span>
          <span style={{ color: "var(--text-2)" }}>{classroom.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{classroom.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <code style={{ fontFamily: "DM Mono, monospace", background: "var(--bg-2)", border: "1px solid var(--border)", padding: "3px 10px", borderRadius: 6, fontSize: 11, color: "var(--text-2)" }}>
                Invite: {classroom.invite_code || classroom.code || "—"}
              </code>
              {(classroom.active || 0) > 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--mint)", background: "var(--mint-10)", borderRadius: 20, padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mint)", display: "inline-block", animation: "pulseDot 1.4s ease-in-out infinite" }} />
                  {classroom.active} live now
                </span>
              )}
            </div>
          </div>
          {canCreate && (
            <button onClick={onCreateAssignment} style={{ padding: "9px 18px", background: "var(--indigo)", color: "#fff", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
              + New Assignment
            </button>
          )}
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginTop: 20, borderBottom: "1px solid var(--border)", marginBottom: -1 }}>
          {(["assignments", "students"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px", background: "none", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, textTransform: "capitalize",
                color: activeTab === tab ? "var(--indigo)" : "var(--text-3)",
                borderBottom: activeTab === tab ? "2px solid var(--indigo)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >{tab}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: "24px 32px" }}>
        {activeTab === "assignments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {assignments.map(a => {
              const isHw = !!a.due_at;
              const subs = submissionsByAssignment[a.id] || [];
              const submittedCount = subs.length;
              const mySub = userRole === "student" ? (subs.find((s: any) => s.user_id === userId) || null) : null;
              const late = mySub ? isSubmittedLate(mySub.submitted_at, a.due_at) : false;
              const totalMembers = classroom.member_count ? Math.max(1, classroom.member_count - 1) : null;
              const pct = totalMembers && submittedCount > 0 ? Math.round((submittedCount / totalMembers) * 100) : 0;

              return (
                <div
                  key={a.id}
                  onClick={() => onOpenAssignment(a)}
                  style={{
                    background: "var(--bg)", border: `1px solid ${isHw ? "oklch(55% 0.22 264 / 0.3)" : "var(--border)"}`,
                    borderLeft: isHw ? "3px solid var(--indigo)" : undefined,
                    borderRadius: "var(--r)", padding: "16px 20px", cursor: "pointer",
                    transition: "border-color 120ms",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--indigo)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = isHw ? "oklch(55% 0.22 264 / 0.3)" : "var(--border)")}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      {isHw && <span style={{ flexShrink: 0, padding: "1px 7px", fontSize: 10, fontWeight: 700, background: "var(--indigo-muted)", color: "var(--indigo)", borderRadius: 20 }}>HW</span>}
                      <span style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      {userRole === "teacher" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <svg style={{ transform: "rotate(-90deg)" }} width="22" height="22" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="8" fill="none" strokeWidth="2.5" stroke="var(--border)" />
                            <circle cx="10" cy="10" r="8" fill="none" strokeWidth="2.5"
                              stroke={pct >= 100 ? "var(--mint)" : "var(--indigo)"}
                              strokeDasharray={`${2 * Math.PI * 8}`}
                              strokeDashoffset={`${2 * Math.PI * 8 * (1 - pct / 100)}`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: pct >= 100 ? "var(--mint)" : "var(--text-3)" }}>{submittedCount} submitted</span>
                        </div>
                      )}
                      {userRole === "student" && mySub && <Badge type={late ? "timeout" : "success"} label={late ? "Submitted Late" : "Submitted ✓"} />}
                      {userRole === "student" && !mySub && <Badge type="not-started" label="Not started" />}
                    </div>
                  </div>
                  {a.description && <p style={{ marginTop: 6, fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{a.description}</p>}
                  {isHw && (
                    <div style={{ marginTop: 10 }}>
                      <DeadlineBadge dueAt={a.due_at} />
                      {userRole === "teacher" && totalMembers && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ height: 4, background: "var(--bg-3)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? "var(--mint)" : "var(--indigo)", borderRadius: 2 }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {assignments.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0", fontSize: 13, color: "var(--text-3)" }}>
                No assignments yet.{canCreate ? ' Click "+ New Assignment" to create the first one.' : ""}
              </div>
            )}
          </div>
        )}

        {activeTab === "students" && (
          <div>
            <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16 }}>
              {groupMembers.length} student{groupMembers.length !== 1 ? "s" : ""} enrolled
            </div>
            {groupMembers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", fontSize: 13, color: "var(--text-3)" }}>No students enrolled yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {groupMembers.map((m: any) => (
                  <div key={m.user_id || m.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--indigo-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--indigo)", flexShrink: 0 }}>
                      {(m.name || m.email || "?")[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name || m.email}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)" }}>{m.email}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {m.online ? (
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--mint)", background: "var(--mint-10)", borderRadius: 20, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--mint)", display: "inline-block", animation: "pulseDot 1.4s ease-in-out infinite" }} />
                          Live
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--text-3)" }}>Offline</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── SubmissionsView ─────────────────────────────────────────────────────────

interface SubmissionsViewProps {
  classroom: any;
  assignments: any[];
  submissions: any[];
  selectedSubmission: any | null;
  onSelectSubmission: (s: any | null) => void;
  onOpenAssignment: (asg: any) => void;
  onBack: () => void;
}

const SubmissionsView: React.FC<SubmissionsViewProps> = ({
  classroom, assignments, submissions, selectedSubmission, onSelectSubmission, onOpenAssignment, onBack,
}) => {
  const [filterAssignment, setFilterAssignment] = useState<string>("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const statusStyle: Record<string, { bg: string; color: string; dot: string }> = {
    success:  { bg: "var(--mint-10)",   color: "oklch(0.40 0.14 162)", dot: "var(--mint)" },
    error:    { bg: "var(--rose-10)",   color: "var(--rose)",          dot: "var(--rose)" },
    timeout:  { bg: "var(--amber-10)",  color: "oklch(0.52 0.14 75)",  dot: "var(--amber)" },
  };

  const filtered = filterAssignment === "all" ? submissions : submissions.filter(s => s.assignment_id === filterAssignment);

  // Group by student
  const studentMap = new Map<string, { id: string; name: string; email: string; subs: any[] }>();
  for (const s of filtered) {
    const uid = s.user_id || s.user_email || "unknown";
    if (!studentMap.has(uid)) {
      studentMap.set(uid, { id: uid, name: s.user_name || s.user_email || "Student", email: s.user_email || "", subs: [] });
    }
    studentMap.get(uid)!.subs.push(s);
  }
  const students = Array.from(studentMap.values()).sort((a, b) => {
    const lastA = new Date(a.subs[a.subs.length - 1]?.submitted_at || 0).getTime();
    const lastB = new Date(b.subs[b.subs.length - 1]?.submitted_at || 0).getTime();
    return lastB - lastA;
  });

  const activeStudent = selectedStudentId ? studentMap.get(selectedStudentId) || null : null;
  const studentSubs = activeStudent
    ? [...activeStudent.subs].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    : [];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)", padding: "20px 32px" }}>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 12, padding: 0 }}>Dashboard</button>
          <span>›</span>
          <span>{classroom.name}</span>
          <span>›</span>
          <span style={{ color: "var(--text-2)" }}>Submissions</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Submissions</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {["success", "error", "timeout"].map(st => {
              const count = submissions.filter(s => s.status === st).length;
              const ss = statusStyle[st];
              return (
                <span key={st} style={{ fontSize: 11, fontWeight: 600, background: ss.bg, color: ss.color, borderRadius: 20, padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: ss.dot, display: "inline-block" }} />
                  {count} {st}
                </span>
              );
            })}
          </div>
        </div>
        {/* Assignment filter */}
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          <button
            onClick={() => { setFilterAssignment("all"); setSelectedStudentId(null); onSelectSubmission(null); }}
            style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", background: filterAssignment === "all" ? "var(--indigo)" : "var(--bg-3)", color: filterAssignment === "all" ? "#fff" : "var(--text-3)" }}
          >All</button>
          {assignments.map(a => (
            <button
              key={a.id}
              onClick={() => { setFilterAssignment(a.id); setSelectedStudentId(null); onSelectSubmission(null); }}
              style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", background: filterAssignment === a.id ? "var(--indigo)" : "var(--bg-3)", color: filterAssignment === a.id ? "#fff" : "var(--text-3)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >{a.title}</button>
          ))}
        </div>
      </div>

      {/* 3-col split: students | history | detail */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: activeStudent ? (selectedSubmission ? "220px 280px 1fr" : "220px 1fr") : "220px 1fr", overflow: "hidden", transition: "grid-template-columns 200ms ease" }}>

        {/* Col 1: student list */}
        <div style={{ borderRight: "1px solid var(--border)", overflowY: "auto", background: "var(--bg-2)" }}>
          <div style={{ padding: "10px 12px 6px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--subtle)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {students.length} student{students.length !== 1 ? "s" : ""}
            </span>
          </div>
          {students.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 16px", fontSize: 12, color: "var(--text-3)" }}>No submissions yet.</div>
          ) : (
            students.map(stu => {
              const latestSub = stu.subs.reduce((a: any, b: any) => new Date(a.submitted_at) > new Date(b.submitted_at) ? a : b, stu.subs[0]);
              const solvedCount = stu.subs.filter((s: any) => s.status === "success").length;
              const ss = statusStyle[latestSub?.status] || statusStyle.error;
              const isActive = selectedStudentId === stu.id;
              return (
                <button
                  key={stu.id}
                  onClick={() => { setSelectedStudentId(stu.id); onSelectSubmission(null); }}
                  style={{
                    display: "block", width: "100%", padding: "12px 14px",
                    background: isActive ? "var(--indigo-10)" : "transparent",
                    border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", textAlign: "left",
                    borderLeft: isActive ? "3px solid var(--indigo)" : "3px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Avatar name={stu.name} size={24} />
                    <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{stu.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 32 }}>
                    <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                      {stu.subs.length} attempt{stu.subs.length !== 1 ? "s" : ""}
                      {solvedCount > 0 && <span style={{ color: "var(--mint)", marginLeft: 4 }}>· {solvedCount} ✓</span>}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, background: ss.bg, color: ss.color, borderRadius: 10, padding: "1px 6px", display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: ss.dot, display: "inline-block" }} />
                      {latestSub?.status}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Col 2: selected student's submission log */}
        {!activeStudent ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", gap: 8 }}>
            <svg width="32" height="32" fill="none" stroke="var(--border-2)" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span style={{ fontSize: 13, color: "var(--text-3)" }}>Select a student to view their log</span>
          </div>
        ) : (
          <div style={{ borderRight: selectedSubmission ? "1px solid var(--border)" : "none", overflowY: "auto", background: "var(--bg)" }}>
            {/* Student header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <Avatar name={activeStudent.name} size={32} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{activeStudent.name}</div>
                  {activeStudent.email && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{activeStudent.email}</div>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8, paddingLeft: 42 }}>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}><span style={{ fontWeight: 600, color: "var(--text-2)" }}>{studentSubs.length}</span> attempts</span>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}><span style={{ fontWeight: 600, color: "var(--mint)" }}>{studentSubs.filter(s => s.status === "success").length}</span> solved</span>
              </div>
            </div>

            {/* Submission timeline */}
            <div style={{ padding: "12px 0" }}>
              {studentSubs.map((s, idx) => {
                const ss = statusStyle[s.status] || statusStyle.error;
                const asg = assignments.find(a => a.id === s.assignment_id);
                const isSelected = selectedSubmission?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectSubmission(isSelected ? null : s)}
                    style={{
                      display: "block", width: "100%", padding: "10px 20px",
                      background: isSelected ? "var(--indigo-10)" : "transparent",
                      border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", textAlign: "left",
                      borderLeft: isSelected ? "3px solid var(--indigo)" : "3px solid transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, color: "var(--subtle)", fontFamily: "DM Mono, monospace" }}>#{studentSubs.length - idx}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                          {asg?.title || "Unknown assignment"}
                        </span>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, background: ss.bg, color: ss.color, borderRadius: 10, padding: "1px 7px", display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: ss.dot, display: "inline-block" }} />
                        {s.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--border-2)", marginTop: 1 }}>
                      {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : ""}
                    </div>
                    {s.output && (
                      <div style={{ marginTop: 5, fontSize: 10, fontFamily: "DM Mono, monospace", color: s.status === "success" ? "var(--mint)" : "var(--rose)", background: "var(--bg-2)", padding: "4px 8px", borderRadius: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.output.split("\n")[0]}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Col 3: submission code detail */}
        {selectedSubmission && (
          <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-2)" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{assignments.find(a => a.id === selectedSubmission.assignment_id)?.title || "Submission"}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>{selectedSubmission.submitted_at ? new Date(selectedSubmission.submitted_at).toLocaleString() : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {selectedSubmission.assignment_id && (
                  <button
                    onClick={() => { const a = assignments.find(x => x.id === selectedSubmission.assignment_id); if (a) onOpenAssignment(a); }}
                    style={{ padding: "5px 12px", background: "var(--indigo)", color: "#fff", border: "none", borderRadius: "var(--r)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                  >Open in Editor</button>
                )}
                <button
                  onClick={() => onSelectSubmission(null)}
                  style={{ padding: "5px 10px", background: "transparent", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 11, cursor: "pointer" }}
                >✕</button>
              </div>
            </div>
            <div style={{ flex: 1, padding: "16px 20px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Code</div>
              <pre style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "14px 16px", fontSize: 12, fontFamily: "DM Mono, monospace", color: "var(--text)", overflow: "auto", lineHeight: 1.7, maxHeight: 360 }}>
                {selectedSubmission.code || "(no code)"}
              </pre>
              {selectedSubmission.output && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Output</div>
                  <pre style={{ background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "10px 14px", fontSize: 12, fontFamily: "DM Mono, monospace", color: selectedSubmission.status === "success" ? "var(--mint)" : "var(--rose)", overflow: "auto", lineHeight: 1.6, maxHeight: 180 }}>
                    {selectedSubmission.output}
                  </pre>
                </div>
              )}
              {selectedSubmission.feedback && (
                <div style={{ marginTop: 14, background: "var(--amber-10)", border: "1px solid var(--amber-muted)", borderRadius: "var(--r)", padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Feedback</div>
                  <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>{selectedSubmission.feedback}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── AssignmentView ─────────────────────────────────────────────────────────

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
  stdinInput: string;
  onStdinChange: (v: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  onBack: () => void;
  onSaveFeedback: (submissionId: string, feedback: string) => Promise<void>;
  failedAttempts: number;
  hint: string | null;
  hintLoading: boolean;
  onGetHint: () => void;
  onDismissHint: () => void;
  xp?: number | null;
}

const AssignmentView: React.FC<AssignmentViewProps> = ({
  assignment, code, setCode, roomId, drawingRoomId,
  userName, userRole, userId, groupMembers, files, activeFileId,
  onSelectFile, onAddFile, terminalEntries, onClearTerminal,
  submissions, selectedSubmission, onSelectSubmission, loading,
  stdinInput, onStdinChange, onRun, onSubmit, onBack,
  failedAttempts, hint, hintLoading, onGetHint, onDismissHint, xp,
}) => {
  const [editorMode, setEditorMode] = useState<"code" | "draw">("code");
  const [handRaised, setHandRaised] = useState(false);
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

  const firstSolverId = React.useMemo(() => {
    const accepted = submissions.filter((s: any) => s.status === "success");
    if (!accepted.length) return null;
    return accepted.reduce((a: any, b: any) =>
      new Date(a.submitted_at) < new Date(b.submitted_at) ? a : b
    ).user_id;
  }, [submissions]);

  const mySub = userRole === "student" ? (submissions.find((s: any) => s.user_id === userId) || null) : null;
  const deadlineUrgency = getDeadlineUrgency(assignment.due_at);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Assignment header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-2.5 py-1 text-xs rounded-[8px] border transition-colors"
            style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
          >
            ← Back
          </button>
          <span className="font-semibold">{assignment.title}</span>
          {isHomework && <DeadlineBadge dueAt={assignment.due_at} />}
        </div>
        {userRole === "student" && xp != null && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[10px]" style={{ background: "var(--amber-10)", border: "1px solid var(--amber-muted)" }}>
            <Zap className="h-3 w-3" style={{ color: "var(--amber)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--amber)" }}>{xp} XP</span>
          </div>
        )}
      </div>

      {/* Deadline banners */}
      {isHomework && userRole === "teacher" && (
        <div
          className="px-4 py-2 border-b flex items-center justify-between text-xs"
          style={{ background: "var(--indigo-muted)", borderColor: "oklch(55% 0.22 264 / 0.3)", color: "var(--indigo)" }}
        >
          <span>📋 Homework — Due {formatDueDate(assignment.due_at)} · {formatTimeRemaining(assignment.due_at)}</span>
          <span style={{ color: "oklch(55% 0.22 264 / 0.7)" }}>
            {submittedCount}/{groupMembers.length > 0 ? groupMembers.length : "?"} submitted
          </span>
        </div>
      )}
      {isHomework && userRole === "student" && deadlineUrgency !== "none" && (
        <div
          className="px-4 py-2 border-b flex items-center justify-between text-xs"
          style={{
            background: URGENCY_STYLES[deadlineUrgency].bg,
            borderColor: "var(--border)",
            color: URGENCY_STYLES[deadlineUrgency].color,
          }}
        >
          <span>
            {deadlineUrgency === "overdue"
              ? "⚠ This assignment is overdue"
              : `Due: ${formatDueDate(assignment.due_at)} — ${formatTimeRemaining(assignment.due_at)}`}
          </span>
          {mySub && (
            <span style={{ color: isSubmittedLate(mySub.submitted_at, assignment.due_at) ? "var(--amber)" : "var(--mint)" }}>
              Submitted {new Date(mySub.submitted_at).toLocaleString()}
              {isSubmittedLate(mySub.submitted_at, assignment.due_at) ? " (Late)" : " ✓"}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Editor + terminal */}
        <div
          className="flex-1 flex flex-col overflow-hidden border-r"
          style={{ borderColor: "var(--border)", background: "var(--bg)" }}
        >
          {/* Mode + file tabs */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b"
            style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}
          >
            <div className="flex items-center gap-1">
              {["code", "draw"].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setEditorMode(mode as "code" | "draw")}
                  className="px-2.5 py-1 rounded-[8px] text-xs font-medium transition-colors capitalize"
                  style={{
                    background: editorMode === mode ? "var(--indigo-muted)" : "transparent",
                    color: editorMode === mode ? "var(--indigo)" : "var(--muted)",
                    border: editorMode === mode ? "1px solid oklch(55% 0.22 264 / 0.3)" : "1px solid transparent",
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
            {editorMode === "code" && (
              <div className="flex items-center gap-1">
                {files.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onSelectFile(f.id)}
                    className="px-2 py-0.5 rounded-[6px] text-xs font-mono transition-colors"
                    style={{
                      background: activeFileId === f.id ? "var(--bg)" : "transparent",
                      color: activeFileId === f.id ? "var(--indigo)" : "var(--muted)",
                      border: activeFileId === f.id ? "1px solid var(--border)" : "1px solid transparent",
                    }}
                  >
                    {f.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={onAddFile}
                  className="px-1.5 py-0.5 text-xs rounded-[6px] border transition-colors"
                  style={{ border: "1px solid var(--border)", color: "var(--subtle)" }}
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Editor area */}
          <div className="flex-1 min-h-0 overflow-hidden" style={{ background: "var(--bg)" }}>
            <div className={editorMode === "code" ? "h-full" : "hidden"}>
              <CodeEditor
                key={activeFileId || "single-file"}
                value={code}
                onChange={setCode}
                roomId={roomId}
                userName={userName}
                userRole={userRole}
                handRaised={handRaised}
                className="bg-[var(--bg)]"
              />
            </div>
            <div className={editorMode === "draw" ? "h-full" : "hidden"}>
              <DrawingCanvas roomId={drawingRoomId} userName={userName} userRole={userRole} className="h-full" />
            </div>
          </div>

          {/* action buttons */}
          {editorMode === "code" && (
            <div className="border-t" style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}>
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  onClick={onRun}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[10px] font-semibold disabled:opacity-60 transition-all"
                  style={{ background: "var(--indigo)", color: "#fff", boxShadow: "0 0 12px oklch(55% 0.22 264 / 0.35)" }}
                >
                  <Play className="h-3 w-3" />
                  Run
                </button>
                <button
                  onClick={onSubmit}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs rounded-[10px] border font-medium disabled:opacity-60 transition-colors"
                  style={{
                    borderColor: isHomework ? "oklch(55% 0.22 264 / 0.4)" : "var(--border)",
                    background: isHomework ? "var(--indigo-muted)" : "transparent",
                    color: isHomework ? "var(--indigo)" : "var(--muted)",
                  }}
                >
                  {isHomework ? "Submit Homework" : "Submit"}
                </button>
                {userRole === "student" && (
                  <button
                    type="button"
                    onClick={() => setHandRaised(v => !v)}
                    className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-[10px] border transition-all"
                    style={{
                      borderColor: handRaised ? "var(--amber)" : "var(--border)",
                      background: handRaised ? "var(--amber-muted)" : "transparent",
                      color: handRaised ? "var(--amber)" : "var(--muted)",
                      animation: handRaised ? "pulseDot 2s ease-in-out infinite" : undefined,
                    }}
                  >
                    <Hand className="h-3 w-3" />
                    {handRaised ? "Hand raised" : "Ask for help"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Hint panel */}
          {userRole === "student" && failedAttempts >= 3 && (
            <div
              className="border-t px-4 py-2.5"
              style={{ borderColor: "oklch(78% 0.17 85 / 0.3)", background: "var(--amber-muted)" }}
            >
              {hint ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--amber)" }}>💡 Hint</span>
                    <button type="button" onClick={onDismissHint} className="text-[10px]" style={{ color: "var(--subtle)" }}>dismiss</button>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>{hint}</p>
                  <p className="text-[10px]" style={{ color: "var(--amber)" }}>−5 XP used for this hint</p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs" style={{ color: "var(--amber)" }}>
                    Stuck after {failedAttempts} attempts — need a nudge?
                  </span>
                  <button
                    type="button"
                    onClick={onGetHint}
                    disabled={hintLoading}
                    className="shrink-0 px-2.5 py-1 text-xs rounded-[8px] border transition-colors disabled:opacity-60"
                    style={{ border: "1px solid var(--amber)", background: "transparent", color: "var(--amber)" }}
                  >
                    {hintLoading ? "Thinking…" : "Get a hint (−5 XP)"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Terminal */}
          <div className="border-t" style={{ borderColor: "var(--border)" }}>
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--subtle)" }}>Terminal</span>
              <button
                type="button"
                onClick={onClearTerminal}
                className="text-[10px] px-1.5 py-0.5 rounded-[6px] border transition-colors"
                style={{ border: "1px solid var(--border)", color: "var(--subtle)" }}
              >
                Clear
              </button>
            </div>
            <div
              className="h-28 overflow-auto px-3 py-2 font-mono text-[11px]"
              style={{ background: "var(--bg)" }}
            >
              {terminalEntries.length === 0 ? (
                <div style={{ color: "var(--subtle)" }}>
                  No runs yet. Press <span style={{ color: "var(--indigo)" }}>Run</span> or <span style={{ color: "var(--indigo)" }}>Submit</span>.
                </div>
              ) : (
                <div className="space-y-1">
                  {terminalEntries.map(entry => (
                    <div key={entry.id}>
                      <div style={{ color: "var(--subtle)" }}>
                        chalk@runtime:~$ {entry.type === "run" ? `python ${entry.fileName}` : `submit ${entry.fileName}`}
                        <span className="ml-2" style={{ color: "var(--border-2)" }}>{entry.timestamp}</span>
                      </div>
                      <pre
                        className="whitespace-pre-wrap break-words"
                        style={{ color: entry.status === "success" ? "var(--mint)" : "var(--rose)" }}
                      >
                        {entry.output || "(no output)"}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {code.includes('input(') && (
              <div
                className="border-t flex items-center gap-2 px-3 py-1.5"
                style={{ borderColor: "oklch(72% 0.18 168 / 0.3)", background: "var(--mint-10)" }}
              >
                <span className="text-[10px] font-semibold shrink-0" style={{ color: "var(--mint)" }}>stdin ›</span>
                <input
                  type="text"
                  value={stdinInput}
                  onChange={e => onStdinChange(e.target.value)}
                  placeholder="Values for input() calls, one per line…"
                  className="flex-1 text-[11px] px-2 py-0.5 rounded-[6px] focus:outline-none font-mono"
                  style={{ background: "var(--bg)", border: "1px solid oklch(72% 0.18 168 / 0.3)", color: "var(--text)" }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Submissions / Roster panel */}
        {showRoster ? (
          <div
            className="w-64 flex flex-col shrink-0 border-r"
            style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}
          >
            <div
              className="px-3 py-2.5 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--subtle)" }}>Roster</span>
              <span
                className="text-[11px] font-mono"
                style={{ color: submittedCount === rosterRows.length ? "var(--mint)" : "var(--muted)" }}
              >
                {submittedCount}/{rosterRows.length}
              </span>
            </div>
            <ul className="flex-1 overflow-auto">
              {rosterRows.map((row: any) => {
                const sub = row.sub;
                return (
                  <li
                    key={row.user_id}
                    className="px-3 py-2.5 border-b transition-colors text-xs"
                    style={{
                      borderColor: "var(--border)",
                      cursor: sub ? "pointer" : "default",
                      opacity: sub ? 1 : 0.6,
                      background: selectedSubmission?.id === sub?.id ? "var(--bg-3)" : "transparent",
                    }}
                    onClick={() => sub && onSelectSubmission(selectedSubmission?.id === sub.id ? null : sub)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={row.name || "Student"} size={22} />
                        <span className="font-medium truncate">
                          {row.name || "Student"}
                          {firstSolverId && row.sub?.user_id === firstSolverId && row.sub?.status === "success" && (
                            <span title="First to solve!" className="ml-1">👑</span>
                          )}
                        </span>
                      </div>
                      <Badge type={row.submitted ? (row.late ? "timeout" : "success") : "failed"} label={row.submitted ? (row.late ? "Late" : "✓") : "Missing"} />
                    </div>
                    {sub && (
                      <div className="mt-1 text-[10px]" style={{ color: "var(--subtle)" }}>
                        {new Date(sub.submitted_at).toLocaleString()}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div
            className="w-64 flex flex-col shrink-0 border-r"
            style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}
          >
            <div
              className="px-3 py-2.5 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--subtle)" }}>Submissions</span>
              {submissions.length > 0 && (
                <span className="text-[11px] font-mono" style={{ color: "var(--muted)" }}>{submissions.length}</span>
              )}
            </div>
            {submissions.length === 0 ? (
              <div className="flex-1 overflow-auto">
                {/* Assignment info when no submissions */}
                <div className="px-3 pt-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--subtle)" }}>Assignment</div>
                  <div className="text-xs font-semibold mb-1">{assignment.title}</div>
                  {assignment.description && (
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-3)" }}>{assignment.description}</p>
                  )}
                </div>
                {assignment.due_at && (
                  <div className="px-3 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                    <div className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--subtle)" }}>Due date</div>
                    <div className="text-[11px]" style={{ color: "var(--text-2)" }}>{formatDueDate(assignment.due_at)}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>{formatTimeRemaining(assignment.due_at)}</div>
                  </div>
                )}
                <div className="px-3 py-4 text-center">
                  <div className="text-[11px]" style={{ color: "var(--subtle)" }}>No submissions yet</div>
                  <div className="text-[10px] mt-1" style={{ color: "var(--border-2)" }}>Waiting for students to submit</div>
                </div>
              </div>
            ) : (
              <ul className="flex-1 overflow-auto">
                {submissions.map(s => (
                  <li
                    key={s.id}
                    className="px-3 py-2.5 border-b cursor-pointer transition-colors text-xs"
                    style={{
                      borderColor: "var(--border)",
                      background: selectedSubmission?.id === s.id ? "var(--bg-3)" : "transparent",
                    }}
                    onClick={() => onSelectSubmission(selectedSubmission?.id === s.id ? null : s)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={s.submitter_name || "?"} size={22} />
                        <span className="font-medium truncate">
                          {s.submitter_name || "Unknown"}
                          {firstSolverId === s.user_id && s.status === "success" && <span className="ml-1">👑</span>}
                        </span>
                      </div>
                      <Badge
                        type={s.status === "success" ? "success" : s.status === "timeout" ? "timeout" : "failed"}
                        label={s.status_display || s.status}
                      />
                    </div>
                    <div className="mt-1 text-[10px]" style={{ color: "var(--subtle)" }}>
                      {new Date(s.submitted_at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
