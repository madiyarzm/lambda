type BadgeType =
  | "success"
  | "failed"
  | "timeout"
  | "open"
  | "closed"
  | "live"
  | "in-progress"
  | "submitted"
  | "not-started"
  | "default";

const BADGE_STYLES: Record<BadgeType, { bg: string; color: string; dot: string; label: string }> = {
  success:     { bg: "var(--mint-muted)",   color: "var(--mint)",   dot: "var(--mint)",   label: "Accepted" },
  failed:      { bg: "var(--rose-muted)",   color: "var(--rose)",   dot: "var(--rose)",   label: "Failed" },
  timeout:     { bg: "var(--amber-muted)",  color: "var(--amber)",  dot: "var(--amber)",  label: "Timeout" },
  open:        { bg: "var(--mint-muted)",   color: "var(--mint)",   dot: "var(--mint)",   label: "Open" },
  closed:      { bg: "var(--bg-3)",         color: "var(--muted)",  dot: "var(--subtle)", label: "Closed" },
  live:        { bg: "var(--rose-muted)",   color: "var(--rose)",   dot: "var(--rose)",   label: "Live" },
  "in-progress":{ bg: "var(--indigo-muted)", color: "var(--indigo)", dot: "var(--indigo)", label: "In Progress" },
  submitted:   { bg: "var(--mint-muted)",   color: "var(--mint)",   dot: "var(--mint)",   label: "Submitted" },
  "not-started":{ bg: "var(--bg-3)",        color: "var(--muted)",  dot: "var(--subtle)", label: "Not Started" },
  default:     { bg: "var(--bg-3)",         color: "var(--muted)",  dot: "var(--subtle)", label: "" },
};

interface BadgeProps {
  type?: BadgeType;
  label?: string;
  pulse?: boolean;
}

export function Badge({ type = "default", label, pulse = false }: BadgeProps) {
  const s = BADGE_STYLES[type];
  const text = label ?? s.label;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      <span
        className={`rounded-full shrink-0 ${pulse && type === "live" ? "animate-pulseDot" : ""}`}
        style={{ width: 6, height: 6, background: s.dot, display: "inline-block" }}
      />
      {text}
    </span>
  );
}
