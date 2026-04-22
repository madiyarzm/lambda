import { Avatar } from "./Avatar";

interface AvatarStackProps {
  names: string[];
  max?: number;
  size?: number;
}

export function AvatarStack({ names, max = 4, size = 24 }: AvatarStackProps) {
  const visible = names.slice(0, max);
  const overflow = names.length - max;
  return (
    <div className="flex items-center" style={{ gap: `${-(size * 0.35)}px` }}>
      {visible.map((name, i) => (
        <Avatar key={name + i} name={name} size={size} ring style={{ zIndex: visible.length - i }} />
      ))}
      {overflow > 0 && (
        <div
          className="flex items-center justify-center rounded-full font-semibold select-none"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.34,
            background: "var(--bg-3)",
            color: "var(--muted)",
            border: "2px solid var(--bg)",
            zIndex: 0,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
