# Homework Mode — Implementation Plan

## Context

Currently, assignments are created via `window.prompt()` capturing only a title. The `due_at`, `description`, and `template_code` fields exist in the database and API but the UI exposes none of them. There is no deadline tracking, no per-student status (not started / submitted / late), and no way for a teacher to see who has and hasn't turned in work. "Homework mode" means: any assignment with a `due_at` becomes a homework assignment — displaying deadlines, urgency colors, and a full class roster of submission status for the teacher.

No new backend endpoints or DB migrations are needed. Everything is already in the schema.

---

## Files to Modify

| File | What changes |
|------|-------------|
| `frontend-vite/src/lib/api.ts` | Add `dueAt` param to `createAssignment` |
| `frontend-vite/src/MentorApp.tsx` | All UI changes (modal, cards, banner, roster) |

---

## Step 1 — `api.ts`: Update `createAssignment`

Add optional `dueAt: string | null = null` parameter and pass it as `due_at`:

```ts
export async function createAssignment(
  classroomId: string,
  title: string,
  description = "",
  templateCode = "",
  dueAt: string | null = null,
): Promise<any> {
  return apiClient.post("/api/v1/assignments/", {
    classroom_id: classroomId,
    title,
    description,
    template_code: templateCode,
    test_code: null,
    due_at: dueAt,
  });
}
```

---

## Step 2 — `MentorApp.tsx`: Pure utility functions (module level, above all components)

```ts
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
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
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
```

---

## Step 3 — `MentorApp.tsx`: `DeadlineBadge` micro-component

Small reusable badge for assignment cards and headers:

```tsx
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
```

---

## Step 4 — `MentorApp.tsx`: `CreateAssignmentModal` component

Replace `window.prompt()` with a proper form modal. Define as a `const` component inside `MentorApp.tsx`.

**Props:**
```ts
interface CreateAssignmentModalProps {
  onConfirm: (data: { title: string; description: string; templateCode: string; dueAt: string | null }) => void;
  onCancel: () => void;
}
```

**Internal state:** `title`, `description`, `templateCode` (default: `"# Write your solution here\n\n"`), `isHomework` (boolean toggle), `dueDate` (string, YYYY-MM-DD), `dueTime` (string, default `"23:59"`).

**`dueAt` computation:** `isHomework && dueDate ? new Date(`${dueDate}T${dueTime}`).toISOString() : null`

**Layout:**
- Full-screen overlay: `fixed inset-0 bg-black/60 z-50 flex items-center justify-center`
- Card: `w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4`
- Fields (top to bottom): Title (text input, required), Description (textarea, 3 rows), Template Code (textarea, 6 rows, font-mono)
- Homework toggle row: label + pill toggle button (`bg-sky-500` active, `bg-slate-700` inactive)
- Due date/time row: visible only when `isHomework`, `flex gap-2`, `<input type="date">` + `<input type="time">`
- Button row: "Cancel" (border slate) + "Create Assignment" (sky-500, disabled when title empty)
- `useEffect` to close on `Escape` key

---

## Step 5 — `MentorApp.tsx`: New state variables

```ts
const [showCreateModal, setShowCreateModal] = useState(false);
const [submissionsByAssignment, setSubmissionsByAssignment] = useState<Record<string, any[]>>({});
const [groupMembers, setGroupMembers] = useState<any[]>([]);
```

Also add `listGroupMembers` to the imports from `./lib/api`.

---

## Step 6 — `MentorApp.tsx`: Replace `handleCreateAssignment`

```ts
const handleCreateAssignment = () => setShowCreateModal(true);

const handleCreateAssignmentConfirm = async (data: {...}) => {
  if (!currentClassroom) return;
  setShowCreateModal(false);
  setError(null);
  try {
    const asg = await createAssignment(
      currentClassroom.id, data.title, data.description, data.templateCode, data.dueAt,
    );
    setAssignments((prev) => [...prev, asg]);
  } catch (e: any) {
    setError(e.message || "Failed to create assignment.");
  }
};
```

Render modal in JSX (just before the closing outer `</div>`):
```tsx
{showCreateModal && (
  <CreateAssignmentModal onConfirm={handleCreateAssignmentConfirm} onCancel={() => setShowCreateModal(false)} />
)}
```

---

## Step 7 — `MentorApp.tsx`: Update `openClassroom`

Pre-load submissions for all assignments so cards can show status badges without extra round-trips when the classroom opens:

```ts
const openClassroom = async (cls: any) => {
  setCurrentClassroom(cls);
  setError(null);
  try {
    const asg = await listAssignments(cls.id);
    setAssignments(asg || []);
    // Pre-load submissions for badge display on assignment cards
    if (asg?.length) {
      const results = await Promise.all(asg.map((a: any) => listSubmissions(a.id).catch(() => [])));
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
```

---

## Step 8 — `MentorApp.tsx`: Update `openAssignment`

Fetch group members for teacher homework roster:

```ts
const openAssignment = async (asg: any) => {
  // ... existing file/code setup ...
  setError(null);
  try {
    const subs = await listSubmissions(asg.id);
    setSubmissions(subs || []);
    if (user?.role === "teacher" && asg.due_at && currentClassroom?.group_id) {
      try {
        const members = await listGroupMembers(currentClassroom.group_id);
        setGroupMembers((members || []).filter((m: any) => m.role === "student"));
      } catch { setGroupMembers([]); }
    } else {
      setGroupMembers([]);
    }
    setView("assignment");
  } catch (e: any) {
    setError(e.message || "Failed to load submissions.");
  }
};
```

---

## Step 9 — `MentorApp.tsx`: Rewrite `ClassroomView` — assignment cards

**New props:** add `userRole: string`, `userId: string`, `submissionsByAssignment: Record<string, any[]>` to `ClassroomViewProps`.

Replace the flat `<ul>/<li>` assignment list with rich cards:

Each card shows:
- **"HW" badge** (indigo) when `assignment.due_at` is set
- **Title**
- **Description** (truncated, 2 lines) when present
- **`<DeadlineBadge>`** when `due_at` is set
- **Teacher:** `X submitted` pill (count from `submissionsByAssignment[a.id].length`)
- **Student:** own status badge — "Not Started" (slate) / "Submitted ✓" (emerald) / "Submitted Late" (orange)

Student status logic:
```ts
const subs = submissionsByAssignment[a.id] || [];
const mySub = userRole === "student" ? subs.find((s: any) => s.user_id === userId) : null;
const late = mySub && a.due_at ? isSubmittedLate(mySub.submitted_at, a.due_at) : false;
```

Pass `userRole={user?.role || "student"}`, `userId={user?.id || ""}`, `submissionsByAssignment={submissionsByAssignment}` from MentorApp JSX.

---

## Step 10 — `MentorApp.tsx`: Deadline banner in `AssignmentView` (student)

Insert between the title header row and the editor split, visible only when `assignment.due_at && userRole === "student"`:

```tsx
{assignment.due_at && userRole === "student" && (() => {
  const urgency = getDeadlineUrgency(assignment.due_at);
  const mySub = submissions.find((s: any) => s.user_id === userId) || null;
  const bannerColors = {
    green: "bg-emerald-950/50 border-emerald-800 text-emerald-300",
    yellow: "bg-yellow-950/50 border-yellow-800 text-yellow-300",
    orange: "bg-orange-950/50 border-orange-800 text-orange-300",
    red: "bg-red-950/60 border-red-800 text-red-300",
    overdue: "bg-red-950/60 border-red-800 text-red-300",
    none: "",
  };
  return (
    <div className={`px-4 py-1.5 border-b text-xs flex items-center justify-between ${bannerColors[urgency]}`}>
      <span>
        {urgency === "overdue" ? "⚠ OVERDUE" : `Due: ${formatDueDate(assignment.due_at)} — ${formatTimeRemaining(assignment.due_at)}`}
      </span>
      {mySub && (
        <span className={isSubmittedLate(mySub.submitted_at, assignment.due_at) ? "text-orange-400" : "text-emerald-400"}>
          Submitted {new Date(mySub.submitted_at).toLocaleString()}
          {isSubmittedLate(mySub.submitted_at, assignment.due_at) ? " (Late)" : " ✓"}
        </span>
      )}
    </div>
  );
})()}
```

**New props to add:** `userId: string` to `AssignmentViewProps`. Pass `userId={user?.id || ""}` from MentorApp JSX.

---

## Step 11 — `MentorApp.tsx`: Teacher homework roster in `AssignmentView`

**New props:** `groupMembers: any[]` to `AssignmentViewProps`. Pass `groupMembers={groupMembers}` from MentorApp JSX.

When `userRole === "teacher" && assignment.due_at && groupMembers.length > 0`, replace the submissions sidebar with the homework roster panel. Otherwise render the existing submissions list unchanged.

**Roster logic:**
```ts
const isHomeworkRoster = userRole === "teacher" && !!assignment.due_at && groupMembers.length > 0;
const subByUserId = Object.fromEntries(submissions.map((s: any) => [s.user_id, s]));
const rosterRows = groupMembers.map((m: any) => {
  const sub = subByUserId[m.user_id] || null;
  return { ...m, sub, submitted: !!sub, late: sub ? isSubmittedLate(sub.submitted_at, assignment.due_at) : false };
}).sort((a: any, b: any) => Number(b.submitted) - Number(a.submitted)); // submitted first, then not submitted
```

**Roster panel replaces current submissions `<div>`:**
- Header: "Roster" label + `X/N` count (emerald if all submitted, else slate)
- Each row:
  - Student name
  - Status badge: "Submitted ✓" (emerald), "Late" (orange), "Not Submitted" (red)
  - Submission timestamp (if submitted)
  - Clickable to select submission (same as current behavior — calls `onSelectSubmission`)

---

## Verification

1. **Teacher creates assignment with due date:** Click `+ New Classroom` button → modal opens with all fields → toggle "Set as Homework" → date/time appear → submit → assignment card shows "HW" badge + deadline
2. **Student views classroom:** Card shows "Not Started" / "Submitted" / "Submitted Late" badge + colored `DeadlineBadge`
3. **Student views assignment:** Deadline banner appears at top with countdown (green→yellow→orange→red as deadline approaches)
4. **Student submits:** Banner updates to show "Submitted [time] ✓" or "(Late)"
5. **Teacher views homework assignment:** Submissions panel shows full class roster with who submitted vs. not, timestamps, late indicators
6. **TypeScript check:** `npx tsc --noEmit` in `frontend-vite/` passes with zero errors

---

## Design Decisions

- **No new DB columns or migrations needed** — `due_at` already exists on assignments
- **Homework = `due_at != null`** — no separate boolean flag; a due date implies homework
- **`Promise.all` on classroom open** — N parallel fetches for N assignments; acceptable since classrooms typically have <20 assignments
- **`listGroupMembers` (already in `api.ts`)** — teacher-only endpoint returns all group members including role; filter for `role === "student"` to build roster
- **All changes in 2 files** — `api.ts` (1 function) and `MentorApp.tsx` (new components + state + logic)
