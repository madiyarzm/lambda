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

// ── Btn ────────────────────────────────────────────────────────────────────
function Btn({
  onClick, children, variant = "primary", size = "md",
  style: xs = {},
}: {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
}) {
  const sz: Record<string, React.CSSProperties> = {
    sm: { padding: "5px 12px", fontSize: 12 },
    md: { padding: "8px 16px", fontSize: 13 },
    lg: { padding: "12px 24px", fontSize: 15 },
  };
  const vt: Record<string, React.CSSProperties> = {
    primary: { background: "var(--indigo)", color: "white", border: "none" },
    secondary: { background: "var(--bg-2)", color: "var(--text)", border: "1px solid var(--border)" },
    ghost: { background: "transparent", color: "var(--text-2)", border: "none" },
  };
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        fontFamily: "var(--font)", fontWeight: 600, borderRadius: "var(--r)",
        cursor: "pointer", transition: "all 0.14s",
        ...sz[size], ...vt[variant], ...xs,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = "brightness(0.9)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "none"; }}
    >
      {children}
    </button>
  );
}

// ── Mock users for social proof & avatar stack ─────────────────────────────
const MOCK_USERS = [
  { id: 1, initials: "PC", color: "var(--indigo)" },
  { id: 2, initials: "AK", color: "oklch(0.62 0.22 28)" },
  { id: 3, initials: "JL", color: "oklch(0.60 0.20 145)" },
  { id: 4, initials: "SP", color: "oklch(0.60 0.22 308)" },
  { id: 5, initials: "MC", color: "oklch(0.62 0.18 200)" },
  { id: 6, initials: "EW", color: "oklch(0.65 0.18 55)" },
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

// ── Animated IDE mockup ────────────────────────────────────────────────────
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
  { initials: "PZ", color: "var(--indigo)" },
  { initials: "AK", color: "oklch(0.62 0.22 28)" },
  { initials: "JL", color: "oklch(0.60 0.20 145)" },
  { initials: "SP", color: "oklch(0.60 0.22 308)" },
];

function HeroMockup() {
  const fullLine = "    return fibonacci(n-1) + fibonacci(n-2)";
  const [typedChars, setTypedChars] = useState(18);
  const [cursorA, setCursorA] = useState({ x: 52 });

  useEffect(() => {
    const t = setInterval(() => {
      setTypedChars(n => n < fullLine.length ? n + 1 : n);
    }, 80);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setCursorA(c => ({ x: c.x + (Math.random() - 0.5) * 2 }));
    }, 1800);
    return () => clearInterval(t);
  }, []);

  const displayLines = LINES.map((line, li) => ({
    ...line,
    tokens: li === 4 ? [{ t: fullLine.slice(0, typedChars), c: "#e2e8f0" }] : line.tokens,
  }));

  return (
    <div style={{
      background: "#0d1117", borderRadius: 16, overflow: "hidden",
      boxShadow: "0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
      fontFamily: "DM Mono, monospace", fontSize: 12.5,
    }}>
      {/* Window chrome */}
      <div style={{ padding: "12px 16px", background: "#080d14", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map(c => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "4px 14px", fontSize: 11, color: "#475569", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            fibonacci.py — Chalk
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
        <div style={{ width: 32, padding: "14px 0", background: "#080d14", borderRight: "1px solid rgba(255,255,255,0.04)", textAlign: "right" }}>
          {displayLines.map((_, i) => (
            <div key={i} style={{ lineHeight: "22px", paddingRight: 8, color: "#1e2a3a", fontSize: 11 }}>{i + 1}</div>
          ))}
        </div>
        <div style={{ flex: 1, padding: "14px 16px", position: "relative" }}>
          {displayLines.map((line, li) => (
            <div key={li} style={{ lineHeight: "22px", position: "relative", minHeight: 22 }}>
              {line.tokens.length === 0
                ? <span>&nbsp;</span>
                : line.tokens.map((t, ti) => <span key={ti} style={{ color: t.c }}>{t.t}</span>)}
              {li === 2 && (
                <>
                  <span style={{ position: "absolute", top: 3, left: Math.max(20, cursorA.x), width: 2, height: 15, background: "var(--indigo)", display: "inline-block", zIndex: 5 }} />
                  <div style={{ position: "absolute", top: -20, left: Math.max(0, cursorA.x - 2), background: "var(--indigo)", color: "white", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, fontFamily: "Plus Jakarta Sans, sans-serif", whiteSpace: "nowrap", zIndex: 10, pointerEvents: "none" }}>Prof. Zhunussov</div>
                </>
              )}
              {li === 4 && (
                <>
                  <span style={{ position: "absolute", top: 3, left: Math.min(typedChars, fullLine.length) * 7.5 - 1, width: 2, height: 15, background: "oklch(0.62 0.22 28)", display: "inline-block", zIndex: 5 }} />
                  <div style={{ position: "absolute", top: -20, left: Math.max(0, Math.min(typedChars, fullLine.length) * 7.5 - 2), background: "oklch(0.62 0.22 28)", color: "white", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, fontFamily: "Plus Jakarta Sans, sans-serif", whiteSpace: "nowrap", zIndex: 10, pointerEvents: "none" }}>Alikhan</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Output bar */}
      <div style={{ padding: "10px 16px", background: "#080d14", borderTop: "1px solid rgba(255,255,255,0.05)", color: "#34d399", fontSize: 12 }}>
        <span style={{ color: "#334155" }}>▶ </span>55<span style={{ color: "#334155", marginLeft: 12 }}>// fibonacci(10) ✓</span>
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

// ── Landing page ────────────────────────────────────────────────────────────
const HERO_LINE1 = "Where code";
const HERO_LINE2 = "meets classroom.";
const HERO_FULL = HERO_LINE1 + "\n" + HERO_LINE2;

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);
  const [typeIdx, setTypeIdx] = useState(0);
  const [cursorOn, setCursorOn] = useState(true);
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

  useEffect(() => {
    if (!heroVisible) return;
    if (typeIdx >= HERO_FULL.length) return;
    const delay = typeIdx === 0 ? 400 : 55;
    const t = setTimeout(() => setTypeIdx(i => i + 1), delay);
    return () => clearTimeout(t);
  }, [heroVisible, typeIdx]);

  useEffect(() => {
    const t = setInterval(() => setCursorOn(v => !v), 530);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font)" }}>

      {/* ── NAV ── */}
      <nav style={{ padding: "20px 56px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 10, borderBottom: "1px solid var(--border)" }}>
        <ChalkLogo size={30} />
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" size="sm" onClick={googleLogin}>Sign in</Btn>
          <Btn variant="primary" size="sm" onClick={googleLogin}>Get started →</Btn>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ minHeight: "100vh", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Gradient orbs */}
        <div style={{ position: "absolute", top: -200, left: "10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, oklch(0.52 0.26 265 / 0.10) 0%, transparent 65%)", animation: "orbFloat 8s ease-in-out infinite alternate", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 100, right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, oklch(0.60 0.22 308 / 0.08) 0%, transparent 65%)", animation: "orbFloat 10s ease-in-out infinite alternate-reverse", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: "40%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, oklch(0.72 0.16 162 / 0.06) 0%, transparent 65%)", animation: "orbFloat 12s ease-in-out infinite alternate", pointerEvents: "none" }} />

        {/* Hero content — side by side */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", maxWidth: 1280, margin: "0 auto", width: "100%", padding: "80px 56px", gap: 80 }}>
          {/* Left */}
          <div style={{ flex: "0 0 520px" }}>
            <div style={{ ...reveal(heroVisible, 0), display: "inline-flex", alignItems: "center", gap: 7, background: "var(--indigo-10)", color: "var(--indigo)", fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 99, marginBottom: 28, border: "1px solid var(--indigo-20)", letterSpacing: "0.02em" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mint)" }} />
              Real-time collaborative coding classroom
            </div>

            <h1 style={{ ...reveal(heroVisible, 0.1), fontSize: 62, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.04em", color: "var(--text)", margin: "0 0 24px" }}>
              {HERO_LINE1.slice(0, Math.min(typeIdx, HERO_LINE1.length))}
              {typeIdx <= HERO_LINE1.length && (
                <span style={{ display: "inline-block", width: 3, height: "0.85em", background: "var(--indigo)", verticalAlign: "middle", marginLeft: 3, opacity: cursorOn ? 1 : 0, borderRadius: 1 }} />
              )}
              <br />
              <span style={{ background: "linear-gradient(125deg, var(--indigo) 0%, oklch(0.60 0.22 308) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {typeIdx > HERO_LINE1.length ? HERO_LINE2.slice(0, typeIdx - HERO_LINE1.length - 1) : ""}
                {typeIdx > HERO_LINE1.length && typeIdx <= HERO_FULL.length && (
                  <span style={{ display: "inline-block", width: 3, height: "0.85em", background: "var(--indigo)", verticalAlign: "middle", marginLeft: 2, opacity: cursorOn ? 1 : 0, borderRadius: 1, WebkitTextFillColor: "initial" }} />
                )}
              </span>
            </h1>

            <p style={{ ...reveal(heroVisible, 0.2), fontSize: 18, color: "var(--text-2)", lineHeight: 1.65, margin: "0 0 40px", maxWidth: 460 }}>
              Students and teachers edit the same code file simultaneously. Watch, guide, and grade — in real time, from any browser.
            </p>

            <div style={{ ...reveal(heroVisible, 0.3), display: "flex", gap: 12, marginBottom: 48 }}>
              <Btn variant="primary" size="lg" onClick={googleLogin} style={{ borderRadius: 12 }}>
                <GoogleLogo white />
                Create a classroom →
              </Btn>
              <Btn variant="secondary" size="lg" onClick={googleLogin} style={{ borderRadius: 12 }}>
                Join with a code
              </Btn>
            </div>

            {/* Social proof */}
            <div style={{ ...reveal(heroVisible, 0.4), display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: "var(--bg-2)", borderRadius: 14, border: "1px solid var(--border)" }}>
              <AvatarRow users={MOCK_USERS} size={30} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>500+ students coding right now</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>Across 40+ classrooms worldwide</div>
              </div>
              <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "var(--mint)", flexShrink: 0 }} />
            </div>
          </div>

          {/* Right — mockup */}
          <div style={{ flex: 1, ...reveal(heroVisible, 0.25) }}>
            <HeroMockup />
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div ref={steps.ref} style={{ padding: "100px 56px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ ...reveal(steps.visible, 0), fontSize: 12, fontWeight: 700, color: "var(--indigo)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>How it works</div>
          <h2 style={{ ...reveal(steps.visible, 0.05), fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 16px" }}>From zero to coding<br />in 60 seconds.</h2>
          <p style={{ ...reveal(steps.visible, 0.1), fontSize: 17, color: "var(--text-3)", maxWidth: 480, margin: "0 auto" }}>No installs, no config, no broken environments. Chalk runs in the browser — for everyone.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {[
            { n: "01", title: "Create a classroom", desc: "Teachers set up a classroom in seconds and share an invite code with students.", color: "var(--indigo)" },
            { n: "02", title: "Students join instantly", desc: "Open a browser, enter the code. No install, no account setup — coding in seconds.", color: "oklch(0.60 0.22 308)" },
            { n: "03", title: "Code together live", desc: "Everyone edits the same file. See each other's cursors, selections, and changes in real time.", color: "var(--mint)" },
            { n: "04", title: "Submit & get graded", desc: "Click Submit. Chalk runs the code in a safe sandbox and shows results instantly.", color: "var(--amber)" },
          ].map((s, i) => (
            <StepCard key={s.n} number={s.n} title={s.title} desc={s.desc} color={s.color} visible={steps.visible} delay={0.1 + i * 0.1} />
          ))}
        </div>
      </div>

      {/* ── LIVE COLLAB SHOWCASE ── */}
      <div ref={collab.ref} style={{ background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "100px 56px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{ ...reveal(collab.visible, 0), display: "inline-block", background: "var(--mint-10)", color: "var(--mint)", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 99, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.08em", border: "1px solid oklch(0.85 0.08 162)" }}>Live collaboration</div>
            <h2 style={{ ...reveal(collab.visible, 0.05), fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 20px", lineHeight: 1.1 }}>See every keystroke, in real time.</h2>
            <p style={{ ...reveal(collab.visible, 0.1), fontSize: 16, color: "var(--text-2)", lineHeight: 1.7, margin: "0 0 32px" }}>Chalk uses a CRDT engine (the same technology as Figma) so edits never conflict. Every cursor, selection, and change from every user appears instantly — no refreshing, no locking.</p>
            <div style={{ ...reveal(collab.visible, 0.15) as React.CSSProperties, display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: "●", color: "var(--indigo)", label: "Teacher cursor", desc: "Professors appear in indigo so students always know where they are" },
                { icon: "●", color: "oklch(0.62 0.22 28)", label: "Student cursors", desc: "Each student gets a unique color — their name floats above the cursor" },
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

            {/* Mini bar chart */}
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Activity this session</div>
              <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 48 }}>
                {[12, 18, 8, 24, 32, 16, 28, 20, 36, 22, 30, 14].map((h, i) => (
                  <div key={i} style={{ flex: 1, borderRadius: 3, background: i > 8 ? "var(--indigo)" : "var(--bg-3)", height: `${h * 1.3}px`, transition: "height 0.3s" }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-3)", marginTop: 6 }}>
                <span>Session start</span><span>Now</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOR TEACHERS / STUDENTS ── */}
      <div ref={roles.ref} style={{ maxWidth: 1280, margin: "0 auto", padding: "100px 56px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ ...reveal(roles.visible, 0), fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 12px" }}>Built for both sides of the desk.</h2>
          <p style={{ ...reveal(roles.visible, 0.05), fontSize: 17, color: "var(--text-3)" }}>Chalk adapts to whether you're teaching or learning.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {[
            { role: "Teacher", color: "var(--indigo)", items: ["Create classrooms with invite codes", "Watch every student's code in real time", "Set assignments with template code + test cases", "Auto-grade submissions with your test suite", "Jump into any student editor to leave a cursor"] },
            { role: "Student", color: "oklch(0.62 0.22 28)", items: ["Join class instantly — no setup", "Edit code with your classmates live", "See the teacher's cursor as they guide you", "Submit with one click — instant test results", "Track your XP, streak, and achievements"] },
          ].map((r, ri) => (
            <div key={r.role} style={{ ...reveal(roles.visible, 0.1 + ri * 0.08) as React.CSSProperties, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 20, padding: 36, overflow: "hidden", position: "relative" }}>
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
                <Btn variant="primary" size="md" onClick={googleLogin} style={{ background: r.color, width: "100%", justifyContent: "center", borderRadius: 12 }}>
                  Get started as {r.role} →
                </Btn>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div ref={cta.ref} style={{ background: "linear-gradient(135deg, var(--indigo) 0%, oklch(0.48 0.27 265) 50%, oklch(0.55 0.22 308) 100%)", padding: "100px 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ ...reveal(cta.visible, 0), fontSize: 52, fontWeight: 800, letterSpacing: "-0.03em", color: "white", margin: "0 0 16px", lineHeight: 1.05 }}>Ready to code together?</h2>
          <p style={{ ...reveal(cta.visible, 0.05), fontSize: 18, color: "rgba(255,255,255,0.7)", margin: "0 0 40px" }}>Free to start. No credit card. No setup.</p>
          <div style={{ ...reveal(cta.visible, 0.1) as React.CSSProperties, display: "flex", gap: 14, justifyContent: "center" }}>
            <button
              onClick={googleLogin}
              style={{ padding: "14px 32px", background: "white", color: "var(--indigo)", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font)", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", transition: "transform 0.15s", display: "inline-flex", alignItems: "center", gap: 10 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; }}
            >
              <GoogleLogo />
              Create a classroom →
            </button>
            <button
              onClick={googleLogin}
              style={{ padding: "14px 32px", background: "rgba(255,255,255,0.12)", color: "white", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font)", backdropFilter: "blur(8px)", transition: "transform 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; }}
            >
              Join as student
            </button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "32px 56px", borderTop: "1px solid var(--border)", background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <ChalkLogo size={26} />
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>© Chalk 2026</div>
      </footer>
    </div>
  );
};
