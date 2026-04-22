import React from "react";

const AVATAR_COLORS = [
  "oklch(55% 0.22 264)",
  "oklch(72% 0.18 168)",
  "oklch(78% 0.17 85)",
  "oklch(65% 0.21 15)",
  "oklch(68% 0.19 300)",
  "oklch(70% 0.18 200)",
];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: number;
  ring?: boolean;
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Avatar({ name, size = 32, ring = false, pulse = false, className = "", style }: AvatarProps) {
  const bg = colorForName(name);
  return (
    <div className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size, ...style }}>
      <div
        className="flex items-center justify-center rounded-full select-none font-semibold"
        style={{
          width: size,
          height: size,
          background: bg,
          fontSize: size * 0.36,
          color: "oklch(14% 0.01 264)",
          outline: ring ? "2px solid var(--bg)" : undefined,
          outlineOffset: ring ? "1px" : undefined,
        }}
      >
        {initials(name)}
      </div>
      {pulse && (
        <span
          className="absolute bottom-0 right-0 rounded-full animate-pulseDot"
          style={{
            width: size * 0.28,
            height: size * 0.28,
            background: "var(--mint)",
            border: "2px solid var(--bg)",
          }}
        />
      )}
    </div>
  );
}
