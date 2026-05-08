import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Code2,
  Sparkles,
  CheckCircle2,
  KeyRound,
  Activity,
  Terminal,
  PenLine,
  Trophy,
} from "lucide-react";
import { googleLogin, isLoggedIn } from "./lib/api";
import { StrawieLogoSvg } from "./components/Logo";

import strawieTeaching from "./assets/mascots/strawie-teaching.png";
import berryFocused from "./assets/mascots/berry-focused.png";
import berryAsking from "./assets/mascots/berry-asking.png";

// ── Motion variants ─────────────────────────────────────────────────────
const SPRING = { type: "spring" as const, stiffness: 220, damping: 24, mass: 0.9 };

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { ...SPRING, delay: i * 0.08 },
  }),
};

// ── Editor: shared types ────────────────────────────────────────────────
type Tok = { t: string; c: string };
type Line = Tok[];

// Light editor palette — readable on a light card.
const PY = {
  ink: "#1F2937",
  comment: "#94A3B8",
  keyword: "#7C3AED",
  fn: "#0F766E",
  string: "#0E7490",
  number: "#B45309",
  punct: "#475569",
} as const;

// ── Lesson 1: Variables — the demo lesson ───────────────────────────────
const LESSON_LINES: Line[] = [
  [{ t: "# lesson 1 — variables", c: PY.comment }],
  [
    { t: "name", c: PY.ink },
    { t: " = ", c: PY.punct },
    { t: '"Aigerim"', c: PY.string },
  ],
  [
    { t: "xp", c: PY.ink },
    { t: " = ", c: PY.punct },
    { t: "0", c: PY.number },
  ],
  [],
  [
    { t: "print", c: PY.fn },
    { t: "(", c: PY.punct },
    { t: 'f"Welcome to class, ', c: PY.string },
    { t: "{name}", c: PY.keyword },
    { t: '!"', c: PY.string },
    { t: ")", c: PY.punct },
  ],
];

const TYPING_LINE_INDEX = 4;
const TYPING_FULL = `print(f"Welcome to class, {name}!")`;

// ── Glass nav ───────────────────────────────────────────────────────────
const Nav: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => (
  <header className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
    <nav
      className="flex items-center gap-2 px-3 py-2 rounded-full
                 bg-white/70 backdrop-blur-xl
                 border border-white/60
                 shadow-lift-glass"
    >
      <div className="pl-2 pr-3">
        <StrawieLogoSvg size={26} />
      </div>
      <div className="hidden md:flex items-center gap-1 text-[13px] text-apple-ink-3 font-medium">
        <a className="px-3 py-1.5 rounded-full hover:bg-apple-mist transition" href="#editor">Editor</a>
        <a className="px-3 py-1.5 rounded-full hover:bg-apple-mist transition" href="#features">Features</a>
        <a className="px-3 py-1.5 rounded-full hover:bg-apple-mist transition" href="#teachers">Teachers</a>
        <a className="px-3 py-1.5 rounded-full hover:bg-apple-mist transition" href="#students">Students</a>
      </div>
      <button
        onClick={onSignIn}
        className="px-3 py-1.5 text-[13px] font-medium text-apple-ink-2 hover:text-apple-ink rounded-full transition"
      >
        Sign in
      </button>
      <button
        onClick={onSignIn}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full
                   bg-apple-ink text-white text-[13px] font-semibold
                   shadow-lift-sm
                   hover:bg-apple-ink-2 active:scale-[0.98] transition"
      >
        Open Strawie
        <ArrowRight size={14} strokeWidth={2.5} />
      </button>
    </nav>
  </header>
);

// ── Code Editor card ────────────────────────────────────────────────────
type EditorProps = {
  className?: string;
  showStrawie?: boolean;
};

const EditorCard: React.FC<EditorProps> = ({ className = "", showStrawie = false }) => {
  const [typed, setTyped] = useState(0);
  const [pausing, setPausing] = useState(false);

  useEffect(() => {
    if (pausing) {
      const t = setTimeout(() => { setTyped(0); setPausing(false); }, 2500);
      return () => clearTimeout(t);
    }
    if (typed < TYPING_FULL.length) {
      const t = setTimeout(() => setTyped((n) => n + 1), 80);
      return () => clearTimeout(t);
    }
    setPausing(true);
  }, [typed, pausing]);

  const lines = LESSON_LINES.map((line, i) =>
    i === TYPING_LINE_INDEX
      ? ([{ t: TYPING_FULL.slice(0, typed), c: PY.ink }] as Line)
      : line
  );

  return (
    <div className={`relative ${className}`}>
      <div
        className="rounded-[22px] bg-white
                   border border-apple-line
                   shadow-lift-xl
                   overflow-hidden"
      >
        {/* window chrome */}
        <div className="flex items-center gap-3 px-4 h-10 border-b border-apple-line bg-apple-mist/50">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6058]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="text-[11px] font-medium text-apple-ink-3 font-mono">
              lesson_1_variables.py
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <PresenceDot color="#5B7FFF" name="Strawie" />
            <PresenceDot color="#9B7BFF" name="A" />
          </div>
        </div>

        {/* tabs */}
        <div className="flex items-center px-4 h-9 border-b border-apple-line bg-white/60">
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-apple-mist text-[12px] font-medium text-apple-ink-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-berry-blue" />
            lesson_1_variables.py
          </div>
        </div>

        {/* editor body */}
        <div className="flex font-mono text-[13px] leading-[22px]">
          {/* gutter */}
          <div className="py-4 px-3 text-right text-apple-ink-4/70 select-none border-r border-apple-line bg-apple-mist/30">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          {/* code */}
          <div className="flex-1 py-4 px-5 relative">
            {lines.map((line, li) => (
              <div key={li} className="relative min-h-[22px]">
                {line.length === 0 ? (
                  <span>&nbsp;</span>
                ) : (
                  line.map((tok, ti) => (
                    <span key={ti} style={{ color: tok.c }}>
                      {tok.t}
                    </span>
                  ))
                )}
                {/* teacher cursor on line 2 (name = "Aigerim") */}
                {li === 1 && (
                  <CollabCursor color="#5B7FFF" label="Strawie" offsetCh={0} />
                )}
                {/* student typing cursor on line 5 */}
                {li === TYPING_LINE_INDEX && (
                  <CollabCursor
                    color="#9B7BFF"
                    label="Aigerim"
                    offsetCh={Math.min(typed, TYPING_FULL.length)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* output bar */}
        <div className="flex items-center gap-3 px-5 h-11 border-t border-apple-line bg-apple-mist/40">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span className="text-[12px] font-medium text-apple-ink-2 font-mono">
            Welcome to class, Aigerim!
          </span>
          <span className="ml-auto text-[11px] font-semibold text-berry-blue
                           bg-berry-blue-soft px-2 py-0.5 rounded-full">
            +10 XP
          </span>
        </div>
      </div>

      {/* Strawie peeking from behind the card */}
      {showStrawie && (
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: -10 }}
          animate={{ opacity: 1, y: 0, rotate: -6 }}
          transition={{ ...SPRING, delay: 0.5 }}
          className="absolute -bottom-12 -left-10 w-44 h-44 pointer-events-none"
        >
          <img
            src={strawieTeaching}
            alt="Strawie the teacher"
            className="w-full h-full object-cover object-[50%_55%] rounded-[28px]
                       drop-shadow-[0_18px_30px_rgba(15,23,42,0.18)]"
          />
        </motion.div>
      )}
    </div>
  );
};

const PresenceDot: React.FC<{ color: string; name: string }> = ({ color, name }) => (
  <div
    className="flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold text-white"
    style={{ background: color }}
    title={name}
  >
    {name[0]}
  </div>
);

const CollabCursor: React.FC<{ color: string; label: string; offsetCh: number }> = ({
  color,
  label,
  offsetCh,
}) => (
  <>
    <span
      className="absolute top-0 w-[2px] h-[18px] animate-cursorPulse"
      style={{ left: `calc(${offsetCh}ch)`, background: color, top: 3 }}
    />
    <span
      className="absolute -top-[18px] px-1.5 py-px rounded-[3px] text-[9px] font-semibold text-white whitespace-nowrap"
      style={{ left: `calc(${offsetCh}ch)`, background: color, fontFamily: "Plus Jakarta Sans, sans-serif" }}
    >
      {label}
    </span>
  </>
);

// ── Hero ────────────────────────────────────────────────────────────────
const Hero: React.FC<{ onCta: () => void }> = ({ onCta }) => {
  return (
    <section className="relative pt-36 pb-28 px-6 overflow-hidden">
      {/* subtle background wash */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-berry-blue-soft/60 blur-3xl rounded-full" />
        <div className="absolute top-64 right-[-10%] w-[500px] h-[500px] bg-berry-purple-soft/70 blur-3xl rounded-full" />
      </div>

      <div className="max-w-[1180px] mx-auto">
        <motion.div
          initial="hidden"
          animate="show"
          className="text-center max-w-[820px] mx-auto"
        >
          <motion.div
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                       bg-white/70 backdrop-blur-md border border-apple-line
                       shadow-lift-sm mb-7"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[12px] font-medium text-apple-ink-2">
              For computer-science classrooms
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            className="text-[clamp(40px,6vw,76px)] leading-[1.04] tracking-[-0.04em]
                       font-[800] text-apple-ink"
          >
            Teach Python the way{" "}
            <span className="bg-gradient-to-br from-berry-blue via-berry-purple to-berry-coral
                             bg-clip-text text-transparent">
              you'd teach it
            </span>{" "}
            in person.
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            className="mt-7 text-[18px] leading-[1.55] text-apple-ink-3 max-w-[620px] mx-auto"
          >
            Strawie is a browser-based Python editor where teachers and students
            work in the same file, live. No installs, no Docker, no setup.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            className="mt-10 flex items-center justify-center gap-3"
          >
            <button
              onClick={onCta}
              className="flex items-center gap-2 px-5 py-3 rounded-full
                         bg-apple-ink text-white text-[14px] font-semibold
                         shadow-lift-md
                         hover:bg-apple-ink-2 active:scale-[0.98] transition"
            >
              Start a classroom
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
            <button
              onClick={onCta}
              className="px-5 py-3 rounded-full
                         bg-white/70 backdrop-blur-md
                         border border-apple-line
                         text-[14px] font-semibold text-apple-ink-2
                         shadow-lift-sm
                         hover:bg-white transition"
            >
              Join with a code
            </button>
          </motion.div>
        </motion.div>

        {/* centerpiece editor */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...SPRING, delay: 0.45 }}
          className="mt-20 max-w-[960px] mx-auto"
        >
          <EditorCard showStrawie />
        </motion.div>
      </div>
    </section>
  );
};

// ── Section header helper ───────────────────────────────────────────────
const SectionHeader: React.FC<{ eyebrow: string; title: React.ReactNode; sub?: string }> = ({
  eyebrow,
  title,
  sub,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={SPRING}
    className="text-center max-w-[640px] mx-auto mb-16"
  >
    <div className="inline-block px-3 py-1 rounded-full bg-apple-mist text-[11px] font-semibold tracking-wide uppercase text-apple-ink-3 mb-4">
      {eyebrow}
    </div>
    <h2 className="text-[clamp(28px,4vw,46px)] leading-[1.08] tracking-[-0.03em] font-[800] text-apple-ink">
      {title}
    </h2>
    {sub && <p className="mt-4 text-[16px] text-apple-ink-3 leading-[1.6]">{sub}</p>}
  </motion.div>
);

// ── Editor showcase section ─────────────────────────────────────────────
const EditorShowcase: React.FC = () => (
  <section id="editor" className="px-6 py-28 bg-gradient-to-b from-apple-bg to-white">
    <div className="max-w-[1180px] mx-auto">
      <SectionHeader
        eyebrow="Live editor"
        title={<>Two cursors. One file.<br /> Zero conflicts.</>}
        sub="Edits are merged with a CRDT — a sync algorithm that lets multiple people change the same code without overwriting each other. Your students see your cursor; you see theirs."
      />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ ...SPRING, delay: 0.1 }}
        className="max-w-[940px] mx-auto"
      >
        <EditorCard />
      </motion.div>
    </div>
  </section>
);

// ── Bento ───────────────────────────────────────────────────────────────
const BentoTile: React.FC<{
  className?: string;
  children: React.ReactNode;
  delay?: number;
}> = ({ className = "", children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ ...SPRING, delay }}
    whileHover={{ y: -4 }}
    className={`relative rounded-[24px] bg-white border border-apple-line shadow-lift-md
                p-7 overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
);

const Bento: React.FC = () => (
  <section id="features" className="px-6 py-28">
    <div className="max-w-[1180px] mx-auto">
      <SectionHeader
        eyebrow="Features"
        title={<>Everything a small classroom needs.</>}
        sub="Built-in, not bolted on. Strawie ships with everything a small classroom needs — editor, runner, grader, and hints — no integrations required."
      />

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* 1. Live editing — wide */}
        <BentoTile className="md:col-span-4 md:row-span-2 min-h-[420px]" delay={0}>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-berry-blue uppercase tracking-wider mb-2">
            <Code2 size={14} /> Live editing
          </div>
          <h3 className="text-[24px] font-[800] tracking-[-0.02em] text-apple-ink mb-2">
            See every keystroke.
          </h3>
          <p className="text-[14px] text-apple-ink-3 leading-relaxed mb-6 max-w-[420px]">
            CodeMirror under the hood, Yjs for sync. Cursors carry names, selections
            highlight live, and the file stays consistent even when ten students
            edit at once.
          </p>
          <div className="absolute bottom-0 right-0 w-[78%] translate-y-[18%] translate-x-[10%]">
            <div className="rounded-tl-[18px] overflow-hidden border border-apple-line shadow-lift-md">
              <EditorCard />
            </div>
          </div>
        </BentoTile>

        {/* 2. AI hints */}
        <BentoTile className="md:col-span-2" delay={0.05}>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-berry-purple uppercase tracking-wider mb-2">
            <Sparkles size={14} /> AI hints
          </div>
          <h3 className="text-[20px] font-[800] tracking-[-0.02em] text-apple-ink mb-2">
            Stuck? Spend a few XP.
          </h3>
          <div className="flex items-end gap-3">
            <img src={berryAsking} alt="" className="w-20 h-20 object-cover object-[50%_60%] rounded-2xl" />
            <div className="flex-1 mb-2 px-3 py-2 rounded-2xl rounded-bl-sm bg-berry-purple-soft text-[12px] text-apple-ink-2 leading-snug border border-berry-purple/15">
              Try printing <code className="px-1 rounded bg-white text-berry-purple font-mono">name</code> first to see what's inside.
            </div>
          </div>
        </BentoTile>

        {/* 3. Auto-grading */}
        <BentoTile className="md:col-span-2" delay={0.1}>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-emerald-600 uppercase tracking-wider mb-2">
            <CheckCircle2 size={14} /> Auto-grading
          </div>
          <h3 className="text-[20px] font-[800] tracking-[-0.02em] text-apple-ink mb-3">
            Tests run on submit.
          </h3>
          <div className="space-y-2 text-[12px] font-mono">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700">
              <CheckCircle2 size={12} /> test_prints_welcome — passed
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700">
              <CheckCircle2 size={12} /> test_xp_increments — passed
            </div>
          </div>
        </BentoTile>

        {/* 4. Invite codes */}
        <BentoTile className="md:col-span-2" delay={0.15}>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-berry-coral uppercase tracking-wider mb-2">
            <KeyRound size={14} /> Invite
          </div>
          <h3 className="text-[20px] font-[800] tracking-[-0.02em] text-apple-ink mb-3">
            One link, six characters.
          </h3>
          <div className="flex items-center gap-1">
            {"H6P-2Q9".split("").map((ch, i) =>
              ch === "-" ? (
                <span key={i} className="text-apple-ink-4 mx-0.5">·</span>
              ) : (
                <div
                  key={i}
                  className="w-9 h-11 flex items-center justify-center rounded-lg
                             bg-apple-mist border border-apple-line
                             text-apple-ink font-mono font-bold"
                >
                  {ch}
                </div>
              )
            )}
          </div>
        </BentoTile>

        {/* 5. Sandbox */}
        <BentoTile className="md:col-span-2" delay={0.2}>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-apple-ink-3 uppercase tracking-wider mb-2">
            <Terminal size={14} /> Sandbox
          </div>
          <h3 className="text-[20px] font-[800] tracking-[-0.02em] text-apple-ink mb-3">
            Code runs, isolated.
          </h3>
          <div className="rounded-xl bg-apple-ink p-3 font-mono text-[11px]">
            <div className="text-emerald-400">$ python lesson_1.py</div>
            <div className="text-zinc-300 mt-1">Welcome to class, Aigerim!</div>
            <div className="text-zinc-500 mt-1">— exit code 0 in 0.04s</div>
          </div>
        </BentoTile>

        {/* 6. Drawing Mode — fills row 3 cols 5-6 */}
        <BentoTile className="md:col-span-2" delay={0.22}>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-berry-coral uppercase tracking-wider mb-2">
            <PenLine size={14} /> Drawing
          </div>
          <h3 className="text-[20px] font-[800] tracking-[-0.02em] text-apple-ink mb-3">
            Diagram together.
          </h3>
          <div className="relative rounded-xl border border-apple-line bg-apple-mist/30 h-[90px] overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 90" preserveAspectRatio="none">
              <path d="M 15 68 Q 50 18 90 45 T 155 35" stroke="#5B7FFF" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
              <path d="M 40 75 Q 75 35 115 55 T 185 42" stroke="#9B7BFF" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
              <circle cx="155" cy="35" r="4.5" fill="#5B7FFF" opacity="0.9"/>
              <circle cx="185" cy="42" r="4.5" fill="#9B7BFF" opacity="0.9"/>
            </svg>
            <div className="absolute top-1.5 right-2 flex gap-1">
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ background: "#5B7FFF" }}>Strawie</span>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ background: "#9B7BFF" }}>Aigerim</span>
            </div>
          </div>
          <p className="text-[11px] text-apple-ink-3 mt-2 leading-snug">
            Miro-style canvas, real-time. Sketch diagrams while you code.
          </p>
        </BentoTile>

        {/* 7. Streaks — wide */}
        <BentoTile className="md:col-span-4" delay={0.25}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 text-[12px] font-semibold text-berry-amber uppercase tracking-wider mb-1">
                <Activity size={14} /> Streaks &amp; XP
              </div>
              <h3 className="text-[20px] font-[800] tracking-[-0.02em] text-apple-ink">
                Effort visible from a glance.
              </h3>
            </div>
            <div className="text-right">
              <div className="text-[12px] font-bold text-apple-ink">Lv 3 · Coder</div>
              <div className="text-[11px] text-apple-ink-4">720 / 1500 XP</div>
            </div>
          </div>
          {/* XP progress bar */}
          <div className="h-1.5 rounded-full bg-apple-mist overflow-hidden mb-4">
            <div className="h-full rounded-full bg-gradient-to-r from-berry-blue to-berry-purple" style={{ width: "48%" }} />
          </div>
          <div className="flex gap-[3px]">
            {Array.from({ length: 12 }).map((_, w) => (
              <div key={w} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((_, d) => {
                  const r = Math.abs(Math.sin((w + 1) * (d + 2) * 13.7));
                  const lvl = w > 7 ? Math.floor(r * 4) : Math.floor(r * 3);
                  const palette = [
                    "bg-apple-mist",
                    "bg-berry-blue-soft",
                    "bg-berry-blue/40",
                    "bg-berry-blue",
                  ];
                  return (
                    <div key={d} className={`w-3 h-3 rounded-[3px] ${palette[lvl]}`} />
                  );
                })}
              </div>
            ))}
          </div>
        </BentoTile>

        {/* 8. Achievements — fills row 4 cols 5-6 */}
        <BentoTile className="md:col-span-2" delay={0.28}>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-berry-amber uppercase tracking-wider mb-2">
            <Trophy size={14} /> Achievements
          </div>
          <h3 className="text-[20px] font-[800] tracking-[-0.02em] text-apple-ink mb-3">
            Earn as you learn.
          </h3>
          <div className="flex gap-2">
            {[
              { emoji: "🔥", label: "7-day streak", bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-600" },
              { emoji: "⚡", label: "First solve", bg: "bg-blue-50", border: "border-blue-100", text: "text-berry-blue" },
              { emoji: "🏆", label: "Top scorer", bg: "bg-yellow-50", border: "border-yellow-100", text: "text-yellow-600" },
            ].map((b) => (
              <div
                key={b.label}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border flex-1 ${b.bg} ${b.border}`}
              >
                <span className="text-xl leading-none">{b.emoji}</span>
                <span className={`text-[9px] font-semibold leading-tight text-center ${b.text}`}>{b.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            {[
              { emoji: "🌟", label: "100 XP", locked: false },
              { emoji: "🧠", label: "Hint master", locked: false },
              { emoji: "🎯", label: "Perfect run", locked: true },
            ].map((b) => (
              <div
                key={b.label}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl border flex-1 ${b.locked ? "bg-apple-mist border-apple-line opacity-40" : "bg-white border-apple-line"}`}
              >
                <span className="text-base leading-none">{b.emoji}</span>
                <span className="text-[9px] font-medium text-apple-ink-3 text-center leading-tight">{b.label}</span>
              </div>
            ))}
          </div>
        </BentoTile>
      </div>
    </div>
  </section>
);

// ── How it works ───────────────────────────────────────────────────────
const Steps: React.FC = () => {
  const steps = [
    { n: "01", title: "Create a classroom", desc: "Sign in with Google. Name your group. Done." },
    { n: "02", title: "Share the code", desc: "Send a 6-character invite to your students." },
    { n: "03", title: "Code together", desc: "Open the same file. Cursors and edits sync live." },
    { n: "04", title: "Submit & review", desc: "Tests run automatically. Leave feedback inline." },
  ];

  return (
    <section className="px-6 py-28 bg-apple-mist/40">
      <div className="max-w-[1180px] mx-auto">
        <SectionHeader
          eyebrow="How it works"
          title={<>Setup is one link.</>}
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ ...SPRING, delay: i * 0.06 }}
              className="rounded-[20px] bg-white border border-apple-line shadow-lift-sm p-6"
            >
              <div className="font-mono text-[12px] font-semibold text-apple-ink-4 mb-3">
                {s.n}
              </div>
              <h3 className="text-[17px] font-[700] text-apple-ink mb-1.5 tracking-[-0.01em]">
                {s.title}
              </h3>
              <p className="text-[13px] text-apple-ink-3 leading-[1.55]">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Roles split ────────────────────────────────────────────────────────
const Roles: React.FC<{ onCta: () => void }> = ({ onCta }) => {
  const teacher = {
    id: "teachers",
    role: "Teachers",
    img: strawieTeaching,
    accentText: "text-berry-blue",
    bullets: [
      "Create classrooms with invite codes",
      "Watch every student's editor live",
      "Set assignments with template & test code",
      "Auto-grade against your own tests",
      "Drop into any student's file to leave a cursor",
    ],
  };
  const student = {
    id: "students",
    role: "Students",
    img: berryFocused,
    accentText: "text-berry-purple",
    bullets: [
      "Join a class with a code — no setup",
      "Edit code with classmates in the same file",
      "Submit once — see test results immediately",
      "Earn XP, build a streak, customize a profile",
      "Spend XP for an AI hint when stuck",
    ],
  };

  return (
    <section className="px-6 py-28">
      <div className="max-w-[1180px] mx-auto">
        <SectionHeader
          eyebrow="Two views"
          title={<>Different views of the same room.</>}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[teacher, student].map((r, i) => (
            <motion.div
              key={r.role}
              id={r.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ ...SPRING, delay: i * 0.1 }}
              className="relative rounded-[28px] bg-white border border-apple-line
                         shadow-lift-md p-8 overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-apple-mist">
                  <img
                    src={r.img}
                    alt=""
                    className="w-full h-full object-cover object-[50%_55%]"
                  />
                </div>
                <div>
                  <div className={`text-[11px] font-semibold uppercase tracking-wider ${r.accentText}`}>
                    For {r.role}
                  </div>
                  <h3 className="text-[24px] font-[800] tracking-[-0.02em] text-apple-ink">
                    {r.role === "Teachers" ? "Lead the room." : "Learn out loud."}
                  </h3>
                </div>
              </div>
              <ul className="space-y-3">
                {r.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-[14px] text-apple-ink-2">
                    <CheckCircle2
                      size={16}
                      className={`mt-0.5 shrink-0 ${r.accentText}`}
                      strokeWidth={2.2}
                    />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <button
                  onClick={onCta}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full
                              bg-apple-ink text-white text-[13px] font-semibold
                              shadow-lift-sm hover:bg-apple-ink-2 transition`}
                >
                  Open Strawie as {r.role.replace(/s$/, "").toLowerCase()}
                  <ArrowRight size={14} strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── CTA ────────────────────────────────────────────────────────────────
const CTA: React.FC<{ onCta: () => void }> = ({ onCta }) => (
  <section className="px-6 py-32">
    <div className="max-w-[920px] mx-auto">
      <div className="relative rounded-[32px] bg-white border border-apple-line shadow-lift-xl p-12 text-center overflow-hidden">
        {/* gentle gradient blobs */}
        <div className="absolute -top-32 left-1/3 w-96 h-96 bg-berry-blue-soft rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/3 w-96 h-96 bg-berry-purple-soft rounded-full blur-3xl" />

        <div className="relative">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={SPRING}
            className="text-[clamp(32px,4vw,52px)] leading-[1.05] tracking-[-0.03em] font-[800] text-apple-ink"
          >
            Open the room.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...SPRING, delay: 0.1 }}
            className="mt-4 text-[16px] text-apple-ink-3 max-w-[480px] mx-auto"
          >
            Free while we're in beta. Sign in with a Google account — that's all
            it takes.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...SPRING, delay: 0.18 }}
            className="mt-9 flex items-center justify-center gap-3"
          >
            <button
              onClick={onCta}
              className="flex items-center gap-2 px-6 py-3 rounded-full
                         bg-apple-ink text-white text-[14px] font-semibold
                         shadow-lift-md hover:bg-apple-ink-2 active:scale-[0.98] transition"
            >
              Open Strawie
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  </section>
);

// ── Footer ─────────────────────────────────────────────────────────────
const Footer: React.FC = () => (
  <footer className="px-6 py-10 border-t border-apple-line bg-white">
    <div className="max-w-[1180px] mx-auto flex items-center justify-between">
      <StrawieLogoSvg size={24} />
      <div className="text-[12px] text-apple-ink-4">© Strawie · 2026</div>
    </div>
  </footer>
);

// ── Page ───────────────────────────────────────────────────────────────
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) navigate("/app", { replace: true });
  }, [navigate]);

  // Force light surface for the page; rest of the app is dark.
  return (
    <div
      data-theme="light"
      className="min-h-screen bg-apple-bg text-apple-ink antialiased"
      style={{
        // Keep wordmark/logo visible — Logo reads --text via data-theme="light".
        background:
          "radial-gradient(1200px 800px at 50% -200px, #FFFFFF 0%, #FAFAF7 60%, #FAFAF7 100%)",
      }}
    >
      <Nav onSignIn={googleLogin} />
      <Hero onCta={googleLogin} />
      <EditorShowcase />
      <Bento />
      <Steps />
      <Roles onCta={googleLogin} />
      <CTA onCta={googleLogin} />
      <Footer />
    </div>
  );
};
