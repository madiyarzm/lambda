import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { googleLogin, isLoggedIn } from "./lib/api";
import { ChalkLogo } from "./components/Logo";

// ── Scroll reveal ──────────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function reveal(visible: boolean, delay = 0): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(28px)",
    transition: `opacity 0.7s ${delay}s ease, transform 0.7s ${delay}s ease`,
  };
}

// ── Brand colors ───────────────────────────────────────────────────────────
const B = {
  red: "#FF5A5F",
  blue: "#204FFE",
  yellow: "#FFD166",
  sky: "#8FD3F4",
};

// ── Btn ────────────────────────────────────────────────────────────────────
function Btn({
  onClick, children, variant = "primary", size = "md",
  style: xs = {},
}: {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "red";
  size?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
}) {
  const sz: Record<string, React.CSSProperties> = {
    sm: { padding: "5px 12px", fontSize: 12 },
    md: { padding: "8px 16px", fontSize: 13 },
    lg: { padding: "13px 26px", fontSize: 15 },
  };
  const vt: Record<string, React.CSSProperties> = {
    primary: { background: B.blue, color: "white", border: "none" },
    red: { background: B.red, color: "white", border: "none" },
    secondary: { background: "var(--bg-2)", color: "var(--text)", border: "1px solid var(--border)" },
    ghost: { background: "transparent", color: "var(--text-2)", border: "none" },
  };
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        fontFamily: "var(--font)", fontWeight: 700, borderRadius: 12,
        cursor: "pointer", transition: "all 0.14s",
        ...sz[size], ...vt[variant], ...xs,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = "brightness(0.88)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "none"; }}
    >
      {children}
    </button>
  );
}

// ── Mock users ─────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: 1, initials: "PZ", color: B.blue },
  { id: 2, initials: "AK", color: B.red },
  { id: 3, initials: "JL", color: "oklch(0.60 0.20 145)" },
  { id: 4, initials: "SP", color: B.yellow },
  { id: 5, initials: "MC", color: B.sky },
  { id: 6, initials: "EW", color: "oklch(0.60 0.22 308)" },
];

function MiniAvatar({ initials, color, size = 30, ring = false, i = 0 }: {
  initials: string; color: string; size?: number; ring?: boolean; i?: number;
}) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, color: "white",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
      boxShadow: ring ? "0 0 0 2px var(--bg)" : "none",
      marginLeft: ring && i > 0 ? -size * 0.35 : 0,
      zIndex: ring ? 10 - i : undefined,
    }}>
      {initials}
    </div>
  );
}

function AvatarRow({ users, size = 30 }: { users: typeof MOCK_USERS; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {users.map((u, i) => <MiniAvatar key={u.id} {...u} size={size} ring i={i} />)}
    </div>
  );
}

// ── Google logo ────────────────────────────────────────────────────────────
const GoogleLogo: React.FC<{ white?: boolean }> = ({ white }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    {white ? (
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="rgba(255,255,255,0.85)" />
    ) : (
      <>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </>
    )}
  </svg>
);

// ── Strawie mascot ─────────────────────────────────────────────────────────
function StrawieCharacter({ size = 220 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="110" cy="208" rx="52" ry="8" fill="rgba(0,0,0,0.18)" />
      {/* Body */}
      <ellipse cx="110" cy="138" rx="62" ry="66" fill={B.red} />
      {/* Seeds */}
      {[[88,130],[102,148],[122,136],[108,118],[92,155],[125,158]].map(([x,y],i) => (
        <ellipse key={i} cx={x} cy={y} rx="3.5" ry="5" fill="rgba(255,255,255,0.28)" transform={`rotate(${i*25} ${x} ${y})`} />
      ))}
      {/* Leaves on top */}
      <ellipse cx="98" cy="80" rx="14" ry="22" fill="#22c55e" transform="rotate(-30 98 80)" />
      <ellipse cx="110" cy="74" rx="10" ry="24" fill="#16a34a" />
      <ellipse cx="122" cy="80" rx="14" ry="22" fill="#22c55e" transform="rotate(30 122 80)" />
      {/* Face - eyes */}
      <circle cx="96" cy="128" r="7" fill="white" />
      <circle cx="124" cy="128" r="7" fill="white" />
      <circle cx="98" cy="130" r="4" fill="#1a1a2e" />
      <circle cx="126" cy="130" r="4" fill="#1a1a2e" />
      <circle cx="99.5" cy="128.5" r="1.5" fill="white" />
      <circle cx="127.5" cy="128.5" r="1.5" fill="white" />
      {/* Smile */}
      <path d="M98 143 Q110 154 122 143" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Cheeks */}
      <ellipse cx="87" cy="140" rx="9" ry="6" fill="rgba(255,255,255,0.22)" />
      <ellipse cx="133" cy="140" rx="9" ry="6" fill="rgba(255,255,255,0.22)" />
      {/* Right arm raised holding marker */}
      <path d="M168 118 Q180 104 174 90" stroke={B.red} strokeWidth="14" strokeLinecap="round" fill="none" />
      <rect x="168" y="76" width="10" height="22" rx="4" fill={B.yellow} transform="rotate(20 168 76)" />
      <rect x="171" y="94" width="10" height="7" rx="2" fill="#e8a000" transform="rotate(20 168 76)" />
      {/* Left arm */}
      <path d="M52 118 Q40 130 46 148" stroke={B.red} strokeWidth="14" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ── IDE Mockup ─────────────────────────────────────────────────────────────
const LINES = [
  { tokens: [{ t: "def ", c: "#818cf8" }, { t: "fibonacci", c: "#34d399" }, { t: "(n: ", c: "#e2e8f0" }, { t: "int", c: "#fb923c" }, { t: ") -> ", c: "#e2e8f0" }, { t: "int", c: "#fb923c" }, { t: ":", c: "#e2e8f0" }] },
  { tokens: [{ t: '    """Return the nth Fibonacci number."""', c: "#64748b" }] },
  { tokens: [{ t: "    if ", c: "#818cf8" }, { t: "n <= ", c: "#e2e8f0" }, { t: "1", c: "#c084fc" }, { t: ":", c: "#e2e8f0" }] },
  { tokens: [{ t: "        return ", c: "#818cf8" }, { t: "n", c: "#e2e8f0" }] },
  { tokens: [{ t: "    return fibonacci(n-1) + fibonacci(n-2)", c: "#e2e8f0" }] },
  { tokens: [] },
  { tokens: [{ t: "print", c: "#34d399" }, { t: "(", c: "#e2e8f0" }, { t: "fibonacci", c: "#34d399" }, { t: "(", c: "#e2e8f0" }, { t: "10", c: "#c084fc" }, { t: "))", c: "#e2e8f0" }] },
];

const PRESENCE = [
  { initials: "PZ", color: B.blue },
  { initials: "AK", color: B.red },
  { initials: "JL", color: "oklch(0.60 0.20 145)" },
  { initials: "SP", color: B.yellow },
];

function HeroMockup({ wide = false }: { wide?: boolean }) {
  const fullLine = "    return fibonacci(n-1) + fibonacci(n-2)";
  const [typedChars, setTypedChars] = useState(18);

  useEffect(() => {
    const t = setInterval(() => {
      setTypedChars(n => n < fullLine.length ? n + 1 : 18);
    }, 80);
    return () => clearInterval(t);
  }, []);

  const displayLines = LINES.map((line, li) => ({
    ...line,
    tokens: li === 4 ? [{ t: fullLine.slice(0, typedChars), c: "#e2e8f0" }] : line.tokens,
  }));

  return (
    <div style={{
      background: "#0d1117", borderRadius: 16, overflow: "hidden",
      boxShadow: "0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07)",
      fontFamily: "DM Mono, ui-monospace, monospace", fontSize: wide ? 13 : 12,
    }}>
      {/* Window chrome */}
      <div style={{ padding: "11px 16px", background: "#080d14", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map(c => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "3px 14px", fontSize: 11, color: "#475569", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            fibonacci.py — Strawie
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
          <span style={{ fontSize: 10, color: "#334155", fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 600 }}>4 live</span>
          <div style={{ display: "flex" }}>
            {PRESENCE.map((u, i) => (
              <div key={i} style={{ width: 20, height: 20, borderRadius: "50%", background: u.color, fontSize: 7, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: i > 0 ? -5 : 0, border: "2px solid #0d1117", zIndex: PRESENCE.length - i }}>
                {u.initials[0]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div style={{ display: "flex" }}>
        <div style={{ width: 36, padding: "14px 0", background: "#080d14", borderRight: "1px solid rgba(255,255,255,0.04)", textAlign: "right" }}>
          {displayLines.map((_, i) => (
            <div key={i} style={{ lineHeight: "22px", paddingRight: 8, color: "#1e2a3a", fontSize: 11 }}>{i + 1}</div>
          ))}
        </div>
        <div style={{ flex: 1, padding: "14px 18px", position: "relative" }}>
          {displayLines.map((line, li) => (
            <div key={li} style={{ lineHeight: "22px", position: "relative", minHeight: 22 }}>
              {line.tokens.length === 0
                ? <span>&nbsp;</span>
                : line.tokens.map((tok, ti) => <span key={ti} style={{ color: tok.c }}>{tok.t}</span>)}
              {li === 2 && (
                <>
                  <span style={{ position: "absolute", top: 3, left: 48, width: 2, height: 15, background: B.blue, display: "inline-block", zIndex: 5 }} />
                  <div style={{ position: "absolute", top: -20, left: 44, background: B.blue, color: "white", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, fontFamily: "Plus Jakarta Sans, sans-serif", whiteSpace: "nowrap", zIndex: 10, pointerEvents: "none" }}>Prof. Zhunussov</div>
                </>
              )}
              {li === 4 && (
                <>
                  <span style={{ position: "absolute", top: 3, left: Math.min(typedChars, fullLine.length) * (wide ? 7.8 : 7.2) - 1, width: 2, height: 15, background: B.red, display: "inline-block", zIndex: 5 }} />
                  <div style={{ position: "absolute", top: -20, left: Math.max(0, Math.min(typedChars, fullLine.length) * (wide ? 7.8 : 7.2) - 2), background: B.red, color: "white", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, fontFamily: "Plus Jakarta Sans, sans-serif", whiteSpace: "nowrap", zIndex: 10, pointerEvents: "none" }}>Alikhan</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Output bar */}
      <div style={{ padding: "10px 18px", background: "#080d14", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: "#34d399", fontWeight: 700 }}>✓ Tests passed</span>
        <span style={{ color: "#475569" }}>|</span>
        <span style={{ color: "#34d399" }}>55</span>
        <span style={{ color: "#334155" }}>// fibonacci(10) = 55</span>
        <span style={{ marginLeft: "auto", background: "#ff5a5f22", color: B.red, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, border: `1px solid ${B.red}33` }}>+10 XP</span>
      </div>
    </div>
  );
}

// ── Activity Heatmap ───────────────────────────────────────────────────────
function ActivityHeatmap() {
  const weeks = 12;
  const days = 7;
  const data = Array.from({ length: weeks * days }, (_, i) => {
    const v = Math.random();
    if (i > weeks * days - 14) return Math.floor(v * 4);
    return Math.random() > 0.55 ? Math.floor(v * 3) : 0;
  });
  const colors = ["#1e293b", `${B.red}55`, `${B.red}99`, B.red];
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: weeks }, (_, w) => (
        <div key={w} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {Array.from({ length: days }, (_, d) => (
            <div key={d} style={{ width: 11, height: 11, borderRadius: 2, background: colors[data[w * days + d]] }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Gamification mockup ────────────────────────────────────────────────────
function GamificationMockup() {
  const achievements = [
    { icon: "🔥", name: "Hot Streak", desc: "7 days in a row", unlocked: true },
    { icon: "⚡", name: "Speed Coder", desc: "Submit in <2 min", unlocked: true },
    { icon: "🎯", name: "Perfect Run", desc: "100% on first try", unlocked: true },
    { icon: "👑", name: "First Blood", desc: "First to solve", unlocked: false },
    { icon: "🤖", name: "AI Whisperer", desc: "Use 10 hints", unlocked: false },
    { icon: "🌟", name: "Legend", desc: "Reach 10,000 XP", unlocked: false },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Profile card */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: B.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: `3px solid ${B.yellow}`, flexShrink: 0 }}>
            🍓
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Alikhan</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Hacker · Level 12</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, height: 6, background: "#1e293b", borderRadius: 99, overflow: "hidden", width: 100 }}>
                <div style={{ width: "67%", height: "100%", background: `linear-gradient(90deg, ${B.red}, ${B.yellow})`, borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>1340 / 1500 XP</span>
            </div>
          </div>
        </div>

        {/* AI hint card */}
        <div style={{ background: `${B.blue}15`, border: `1px solid ${B.blue}30`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: B.blue, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>✨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>AI Hint available</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Unlock with -5 XP</div>
          </div>
          <div style={{ background: B.blue, color: "white", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, cursor: "pointer", flexShrink: 0 }}>Unlock</div>
        </div>
      </div>

      {/* Achievements */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Achievements</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {achievements.map((a) => (
            <div key={a.name} style={{ background: a.unlocked ? `${B.red}15` : "#1e293b", border: `1px solid ${a.unlocked ? B.red + "40" : "#334155"}`, borderRadius: 10, padding: "10px 8px", textAlign: "center", opacity: a.unlocked ? 1 : 0.5 }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{a.unlocked ? a.icon : "🔒"}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: a.unlocked ? "#e2e8f0" : "#475569" }}>{a.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Coding activity</div>
        <ActivityHeatmap />
      </div>
    </div>
  );
}

// ── Step card ──────────────────────────────────────────────────────────────
function StepCard({ number, title, desc, visible, delay, color }: {
  number: string; title: string; desc: string;
  visible: boolean; delay: number; color: string;
}) {
  return (
    <div style={{ ...reveal(visible, delay), padding: 28, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: color + "12" }} />
      <div style={{ width: 40, height: 40, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, border: `1px solid ${color}30` }}>
        <span style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "DM Mono, monospace" }}>{number}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.65 }}>{desc}</div>
    </div>
  );
}

// ── Landing page ────────────────────────────────────────────────────────────
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);
  const ide = useReveal(0.08);
  const gamification = useReveal(0.08);
  const steps = useReveal();
  const collab = useReveal();
  const roles = useReveal();
  const cta = useReveal(0.3);

  useEffect(() => {
    if (isLoggedIn()) navigate("/app", { replace: true });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font)" }}>

      {/* ── NAV ── */}
      <nav style={{ padding: "18px 56px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid var(--border)", background: "rgba(8,13,20,0.92)", backdropFilter: "blur(14px)" }}>
        <ChalkLogo size={30} />
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" size="sm" onClick={googleLogin}>Sign in</Btn>
          <Btn variant="red" size="sm" onClick={googleLogin}>Get started →</Btn>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ minHeight: "92vh", position: "relative", display: "flex", alignItems: "center", overflow: "hidden" }}>
        {/* Background glow */}
        <div style={{ position: "absolute", top: -120, left: "5%", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${B.red}18 0%, transparent 65%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 80, right: "2%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${B.blue}12 0%, transparent 65%)`, pointerEvents: "none" }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", padding: "80px 56px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          {/* Left */}
          <div>
            <div style={{ ...reveal(heroVisible, 0), display: "inline-flex", alignItems: "center", gap: 7, background: `${B.red}18`, color: B.red, fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 99, marginBottom: 28, border: `1px solid ${B.red}35`, letterSpacing: "0.02em" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: B.red }} />
              Real-time IDE for programming education
            </div>

            <h1 style={{ ...reveal(heroVisible, 0.08), fontSize: 58, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.038em", color: "var(--text)", margin: "0 0 24px" }}>
              A Real-Time IDE<br />
              <span style={{ background: `linear-gradient(125deg, ${B.red} 0%, ${B.yellow} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                for Programming
              </span>
              <br />Education.
            </h1>

            <p style={{ ...reveal(heroVisible, 0.16), fontSize: 17, color: "var(--text-2)", lineHeight: 1.7, margin: "0 0 40px", maxWidth: 500 }}>
              Strawie provides a browser-based workspace with live multi-user editing, secure sandboxed execution, and built-in assignment management.
            </p>

            <div style={{ ...reveal(heroVisible, 0.24), display: "flex", gap: 12, marginBottom: 44, flexWrap: "wrap" }}>
              <Btn variant="red" size="lg" onClick={googleLogin} style={{ borderRadius: 14 }}>
                <GoogleLogo white />
                Create a classroom →
              </Btn>
              <Btn variant="secondary" size="lg" onClick={googleLogin} style={{ borderRadius: 14 }}>
                Join with a code
              </Btn>
            </div>

            {/* Social proof */}
            <div style={{ ...reveal(heroVisible, 0.32), display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", background: "var(--bg-2)", borderRadius: 14, border: "1px solid var(--border)", maxWidth: 440 }}>
              <AvatarRow users={MOCK_USERS} size={28} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>500+ students coding right now</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>Across 40+ classrooms worldwide</div>
              </div>
              <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#34d399", flexShrink: 0 }} />
            </div>
          </div>

          {/* Right — mascot */}
          <div style={{ ...reveal(heroVisible, 0.12), display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
            {/* Floating XP badge */}
            <div style={{ position: "absolute", top: 20, right: 30, background: "#0f172a", border: `1px solid ${B.yellow}55`, borderRadius: 12, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, boxShadow: `0 8px 32px ${B.yellow}20` }}>
              <span style={{ fontSize: 18 }}>⚡</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: B.yellow }}>+10 XP earned!</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>Test passed</div>
              </div>
            </div>
            {/* Floating hint badge */}
            <div style={{ position: "absolute", bottom: 40, left: 10, background: "#0f172a", border: `1px solid ${B.blue}55`, borderRadius: 12, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, boxShadow: `0 8px 32px ${B.blue}20` }}>
              <span style={{ fontSize: 18 }}>✨</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: B.sky }}>AI Hint ready</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>-5 XP to unlock</div>
              </div>
            </div>
            <StrawieCharacter size={260} />
          </div>
        </div>
      </div>

      {/* ── FULL-WIDTH IDE SHOWCASE ── */}
      <div ref={ide.ref} style={{ background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "80px 0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 56px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ ...reveal(ide.visible, 0), display: "inline-block", background: `${B.sky}18`, color: B.sky, fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 99, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em", border: `1px solid ${B.sky}35` }}>Live editor</div>
            <h2 style={{ ...reveal(ide.visible, 0.06), fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 14px" }}>Watch the classroom come alive.</h2>
            <p style={{ ...reveal(ide.visible, 0.1), fontSize: 16, color: "var(--text-3)", maxWidth: 520, margin: "0 auto" }}>Multiple cursors, real-time edits, instant test output — all in the browser, nothing to install.</p>
          </div>
          <div style={{ ...reveal(ide.visible, 0.14) as React.CSSProperties }}>
            <HeroMockup wide />
          </div>
          {/* Stats row */}
          <div style={{ ...reveal(ide.visible, 0.2) as React.CSSProperties, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 36 }}>
            {[
              { value: "<100ms", label: "Sync latency", color: B.sky },
              { value: "Sandboxed", label: "Secure Python execution", color: B.red },
              { value: "∞ students", label: "Per classroom", color: B.yellow },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center", padding: "20px 16px", background: "var(--bg)", borderRadius: 14, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "var(--text-3)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── GAMIFICATION ── */}
      <div ref={gamification.ref} style={{ maxWidth: 1280, margin: "0 auto", padding: "100px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{ ...reveal(gamification.visible, 0), display: "inline-block", background: `${B.yellow}18`, color: B.yellow, fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 99, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.08em", border: `1px solid ${B.yellow}35` }}>Gamification</div>
            <h2 style={{ ...reveal(gamification.visible, 0.06), fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 20px", lineHeight: 1.1 }}>
              Learn. Earn.<br />
              <span style={{ background: `linear-gradient(125deg, ${B.yellow} 0%, ${B.red} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Level up.
              </span>
            </h2>
            <p style={{ ...reveal(gamification.visible, 0.1), fontSize: 16, color: "var(--text-2)", lineHeight: 1.7, margin: "0 0 32px" }}>
              Every correct submission earns XP. Stuck on a problem? Spend XP for a tailored AI hint powered by Claude. Unlock achievements, track your coding streak, and customize your profile.
            </p>
            <div style={{ ...reveal(gamification.visible, 0.14) as React.CSSProperties, display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { icon: "⚡", color: B.yellow, title: "XP for every submission", desc: "+10 XP for accepted, +2 XP for failed — effort always pays off" },
                { icon: "✨", color: B.blue, title: "AI hints powered by Claude", desc: "Spend 5 XP to unlock a contextual, assignment-specific hint" },
                { icon: "🏆", color: B.red, title: "Achievements & streaks", desc: "First-to-solve crown, hot streak badges, and profile cosmetics" },
                { icon: "📊", color: B.sky, title: "GitHub-style activity graph", desc: "See your coding consistency — and keep the streak alive" },
              ].map(f => (
                <div key={f.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: f.color + "18", border: `1px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...reveal(gamification.visible, 0.1) as React.CSSProperties }}>
            <GamificationMockup />
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div ref={steps.ref} style={{ background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "100px 56px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ ...reveal(steps.visible, 0), fontSize: 12, fontWeight: 700, color: B.red, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>How it works</div>
            <h2 style={{ ...reveal(steps.visible, 0.05), fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 16px" }}>From zero to coding<br />in 60 seconds.</h2>
            <p style={{ ...reveal(steps.visible, 0.1), fontSize: 17, color: "var(--text-3)", maxWidth: 480, margin: "0 auto" }}>No installs, no config, no broken environments. Strawie runs in the browser — for everyone.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {[
              { n: "01", title: "Create a classroom", desc: "Teachers set up a classroom in seconds and share an invite code with students.", color: B.blue },
              { n: "02", title: "Students join instantly", desc: "Open a browser, enter the code. No install, no account setup — coding in seconds.", color: B.red },
              { n: "03", title: "Code together live", desc: "Everyone edits the same file. See each other's cursors and changes in real time.", color: "var(--mint)" },
              { n: "04", title: "Submit & earn XP", desc: "Click Submit. Strawie runs the code in a safe sandbox, shows results, and awards XP.", color: B.yellow },
            ].map((s, i) => (
              <StepCard key={s.n} number={s.n} title={s.title} desc={s.desc} color={s.color} visible={steps.visible} delay={0.1 + i * 0.1} />
            ))}
          </div>
        </div>
      </div>

      {/* ── LIVE COLLAB SHOWCASE ── */}
      <div ref={collab.ref} style={{ maxWidth: 1280, margin: "0 auto", padding: "100px 56px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <div>
          <div style={{ ...reveal(collab.visible, 0), display: "inline-block", background: "var(--mint-10)", color: "var(--mint)", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 99, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.08em", border: "1px solid oklch(0.85 0.08 162)" }}>Live collaboration</div>
          <h2 style={{ ...reveal(collab.visible, 0.05), fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 20px", lineHeight: 1.1 }}>See every keystroke, in real time.</h2>
          <p style={{ ...reveal(collab.visible, 0.1), fontSize: 16, color: "var(--text-2)", lineHeight: 1.7, margin: "0 0 32px" }}>Strawie uses a CRDT engine (the same technology as Figma) so edits never conflict. Every cursor, selection, and change from every user appears instantly — no refreshing, no locking.</p>
          <div style={{ ...reveal(collab.visible, 0.15) as React.CSSProperties, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "●", color: B.blue, label: "Teacher cursor", desc: "Professors appear in blue so students always know where they are" },
              { icon: "●", color: B.red, label: "Student cursors", desc: "Each student gets a unique color — their name floats above the cursor" },
              { icon: "◐", color: "var(--mint)", label: "Presence bar", desc: "See who's active, who's idle, and who just joined — at a glance" },
            ].map(f => (
              <div key={f.label} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ color: f.color, fontSize: 10, marginTop: 3, flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...reveal(collab.visible, 0.1) as React.CSSProperties, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Presence card */}
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--mint)" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", letterSpacing: "0.04em" }}>LIVE IN FIBONACCI.PY</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {MOCK_USERS.slice(0, 4).map(u => (
                <div key={u.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ position: "relative" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: u.color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                      {u.initials}
                    </div>
                    <span style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: "var(--mint)", border: "2px solid var(--bg)" }} />
                  </div>
                  <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 500 }}>{["Prof.", "Alex", "Jordan", "Sam"][u.id - 1]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity bar */}
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Activity this session</div>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 48 }}>
              {[12, 18, 8, 24, 32, 16, 28, 20, 36, 22, 30, 14].map((h, i) => (
                <div key={i} style={{ flex: 1, borderRadius: 3, background: i > 8 ? B.red : "var(--bg-3)", height: `${h * 1.3}px`, transition: "height 0.3s" }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-3)", marginTop: 6 }}>
              <span>Session start</span><span>Now</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOR TEACHERS / STUDENTS ── */}
      <div ref={roles.ref} style={{ background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "100px 56px" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ ...reveal(roles.visible, 0), fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 12px" }}>Built for both sides of the desk.</h2>
            <p style={{ ...reveal(roles.visible, 0.05), fontSize: 17, color: "var(--text-3)" }}>Strawie adapts to whether you're teaching or learning.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {[
              { role: "Teacher", color: B.blue, items: ["Create classrooms with invite codes", "Watch every student's code in real time", "Set assignments with template code + test cases", "Auto-grade submissions with your test suite", "Jump into any student editor to leave a cursor"] },
              { role: "Student", color: B.red, items: ["Join class instantly — no setup", "Edit code with your classmates live", "Submit with one click — instant test results", "Earn XP, unlock achievements, track your streak", "Spend XP on AI hints when you're stuck"] },
            ].map((r, ri) => (
              <div key={r.role} style={{ ...reveal(roles.visible, 0.1 + ri * 0.08) as React.CSSProperties, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 20, padding: 36, overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: r.color + "10" }} />
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: r.color + "15", borderRadius: 99, padding: "6px 14px", marginBottom: 24 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>For {r.role}s</span>
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                  {r.items.map(item => (
                    <li key={item} style={{ display: "flex", gap: 12, fontSize: 14, color: "var(--text-2)", alignItems: "flex-start" }}>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill={r.color} style={{ flexShrink: 0, marginTop: 1 }}>
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 28 }}>
                  <Btn variant={r.role === "Teacher" ? "primary" : "red"} size="md" onClick={googleLogin} style={{ width: "100%", justifyContent: "center", borderRadius: 12 }}>
                    Get started as {r.role} →
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div ref={cta.ref} style={{ background: `linear-gradient(135deg, #0d1117 0%, ${B.red}22 40%, ${B.blue}18 100%)`, padding: "100px 56px", textAlign: "center", position: "relative", overflow: "hidden", borderTop: "1px solid var(--border)" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${B.red}10 0%, transparent 60%)`, pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🍓</div>
          <h2 style={{ ...reveal(cta.visible, 0), fontSize: 52, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 16px", lineHeight: 1.05 }}>Ready to code together?</h2>
          <p style={{ ...reveal(cta.visible, 0.05), fontSize: 18, color: "var(--text-3)", margin: "0 0 40px" }}>Free to start. No credit card. No setup.</p>
          <div style={{ ...reveal(cta.visible, 0.1) as React.CSSProperties, display: "flex", gap: 14, justifyContent: "center" }}>
            <button
              onClick={googleLogin}
              style={{ padding: "14px 32px", background: B.red, color: "white", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font)", boxShadow: `0 8px 32px ${B.red}40`, transition: "transform 0.15s", display: "inline-flex", alignItems: "center", gap: 10 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; }}
            >
              <GoogleLogo white />
              Create a classroom →
            </button>
            <button
              onClick={googleLogin}
              style={{ padding: "14px 32px", background: "var(--bg-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font)", transition: "transform 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; }}
            >
              Join as student
            </button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "28px 56px", borderTop: "1px solid var(--border)", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <ChalkLogo size={26} />
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>© Strawie 2026</div>
      </footer>
    </div>
  );
};
