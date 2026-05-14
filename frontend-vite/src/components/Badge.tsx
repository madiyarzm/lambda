import { useTranslation } from "react-i18next";

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

const BADGE_STYLES: Record<BadgeType, { bg: string; color: string; dot: string }> = {
  success:     { bg: "var(--mint-muted)",   color: "var(--mint)",   dot: "var(--mint)" },
  failed:      { bg: "var(--rose-muted)",   color: "var(--rose)",   dot: "var(--rose)" },
  timeout:     { bg: "var(--amber-muted)",  color: "var(--amber)",  dot: "var(--amber)" },
  open:        { bg: "var(--mint-muted)",   color: "var(--mint)",   dot: "var(--mint)" },
  closed:      { bg: "var(--bg-3)",         color: "var(--muted)",  dot: "var(--subtle)" },
  live:        { bg: "var(--rose-muted)",   color: "var(--rose)",   dot: "var(--rose)" },
  "in-progress":{ bg: "var(--indigo-muted)", color: "var(--indigo)", dot: "var(--indigo)" },
  submitted:   { bg: "var(--mint-muted)",   color: "var(--mint)",   dot: "var(--mint)" },
  "not-started":{ bg: "var(--bg-3)",        color: "var(--muted)",  dot: "var(--subtle)" },
  default:     { bg: "var(--bg-3)",         color: "var(--muted)",  dot: "var(--subtle)" },
};

interface BadgeProps {
  type?: BadgeType;
  label?: string;
  pulse?: boolean;
}

export function Badge({ type = "default", label, pulse = false }: BadgeProps) {
  const { t } = useTranslation();
  const s = BADGE_STYLES[type];
  const text = label ?? (type === "default" ? "" : t(`badge.${type}`));
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
