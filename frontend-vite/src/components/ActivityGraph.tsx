interface ActivityDay {
  date: string;
  count: number;
}

interface ActivityGraphProps {
  days: ActivityDay[];
}

const INTENSITY_COLORS = [
  "transparent",
  "var(--indigo-muted)",
  "oklch(35% 0.18 264)",
  "var(--indigo-dim)",
  "var(--indigo)",
];

function intensityIndex(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

export function ActivityGraph({ days }: ActivityGraphProps) {
  const weeks: ActivityDay[][] = [];
  for (let w = 0; w < 15; w++) {
    weeks.push(days.slice(w * 7, w * 7 + 7));
  }

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--subtle)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Coding activity
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {weeks.map((week, w) => (
          <div key={w} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {week.map((day, d) => (
              <div
                key={d}
                title={day.count > 0 ? `${day.count} submission${day.count > 1 ? "s" : ""} on ${day.date}` : day.date}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: INTENSITY_COLORS[intensityIndex(day.count)],
                  border: day.count === 0 ? "1px solid var(--border)" : "none",
                  transition: "background 0.2s",
                  cursor: day.count > 0 ? "pointer" : "default",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
