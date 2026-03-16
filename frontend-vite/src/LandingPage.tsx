import React from "react";
import { Link } from "react-router-dom";
import { ContainerScroll } from "./components/ui/container-scroll-animation";
import {
  Terminal,
  Users,
  BookOpen,
  Play,
  ChevronRight,
  ChevronDown,
  Zap,
  Shield,
  ArrowRight,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-20 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 h-13 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm font-mono shadow-[0_0_14px_rgba(56,189,248,0.5)]">
              λ
            </div>
            <span className="font-mono font-bold text-sm tracking-tight text-slate-100">
              Lambda
            </span>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Beta
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-xs text-slate-400">
            <a href="#features" className="hover:text-slate-200 transition-colors">Features</a>
            <a href="#how" className="hover:text-slate-200 transition-colors">How it works</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Docs</a>
          </nav>
          <div className="flex items-center gap-2 text-xs">
            <Link
              to="/app"
              className="px-3 py-1.5 border border-slate-700 rounded-md bg-transparent hover:bg-slate-900 transition-colors text-slate-300"
            >
              Sign In
            </Link>
            <Link
              to="/app"
              className="px-3 py-1.5 rounded-md bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-medium hover:from-sky-400 hover:to-indigo-400 transition-all shadow-[0_0_16px_rgba(56,189,248,0.35)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]"
            >
              Start Mentoring
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative">
          {/* Grid background */}
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          {/* Glow orbs */}
          <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-sky-500/8 blur-[120px] z-0" />
          <div className="pointer-events-none absolute top-40 left-1/3 w-[300px] h-[200px] rounded-full bg-indigo-500/6 blur-[100px] z-0" />

          <div className="relative z-10">
            <ContainerScroll
              titleComponent={
                <div className="space-y-5">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-500/25 bg-sky-500/8 text-sky-400 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                    Real-time collaborative Python IDE
                  </div>

                  {/* Headline */}
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-100 leading-tight">
                    Master Python.
                    <br />
                    <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                      Together. In Sync.
                    </span>
                  </h1>

                  {/* Sub */}
                  <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
                    A focused environment for mentors and students to write, run,
                    and review Python code together — live, with zero setup.
                  </p>

                  {/* CTAs */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Link
                      to="/app"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-medium shadow-[0_0_24px_rgba(56,189,248,0.4)] hover:shadow-[0_0_32px_rgba(56,189,248,0.6)] hover:from-sky-400 hover:to-indigo-400 transition-all"
                    >
                      Open Classroom
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      to="/app"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-900 hover:border-slate-600 transition-all"
                    >
                      Watch Demo
                    </Link>
                  </div>
                </div>
              }
            >
              <HeroEditorMock />
            </ContainerScroll>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-y border-slate-800 bg-slate-900/40">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              {[
                { value: "< 1s", label: "Execution latency" },
                { value: "∞", label: "Students per session" },
                { value: "100%", label: "Browser-native" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-xl md:text-2xl font-bold text-slate-100 font-mono">
                    {s.value}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
            <div className="mb-12 text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-700 bg-slate-900 text-slate-400 text-xs">
                Features
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
                Built for deliberate practice
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Every tool is designed around the mentor–student feedback loop.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FeatureCard
                number="01"
                icon={<Terminal className="h-4 w-4 text-sky-400" />}
                title="Synchronized Execution"
                text="Run code together in a shared sandbox. Students see output the moment you hit Run — no screen sharing needed."
                accent="sky"
              />
              <FeatureCard
                number="02"
                icon={<Users className="h-4 w-4 text-indigo-400" />}
                title="Live Collaboration"
                text="CRDT-powered co-editing with real-time cursors. Multiple people editing the same file with zero conflicts."
                accent="indigo"
              />
              <FeatureCard
                number="03"
                icon={<BookOpen className="h-4 w-4 text-violet-400" />}
                title="Structured Curriculum"
                text="Organize lessons into groups and classrooms. Track submissions, review student code, and iterate fast."
                accent="violet"
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-slate-800 bg-slate-900/30">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
            <div className="mb-12 text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-700 bg-slate-900 text-slate-400 text-xs">
                How it works
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
                Up and running in minutes
              </h2>
            </div>
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* connector line */}
              <div className="hidden md:block absolute top-7 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-sky-500/30 via-indigo-500/30 to-violet-500/30" />
              {[
                {
                  step: "1",
                  icon: <Zap className="h-4 w-4" />,
                  title: "Create a classroom",
                  text: "Sign in, create a group, add classrooms and assignments in seconds.",
                  color: "sky",
                },
                {
                  step: "2",
                  icon: <Users className="h-4 w-4" />,
                  title: "Invite students",
                  text: "Share an invite code. Students join and see your live cursor immediately.",
                  color: "indigo",
                },
                {
                  step: "3",
                  icon: <Shield className="h-4 w-4" />,
                  title: "Code & review",
                  text: "Write, run, and submit. Review submissions and give inline feedback.",
                  color: "violet",
                },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center gap-3">
                  <div
                    className={`relative z-10 h-14 w-14 rounded-full border-2 flex items-center justify-center ${
                      item.color === "sky"
                        ? "border-sky-500/40 bg-sky-500/10 text-sky-400"
                        : item.color === "indigo"
                        ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-400"
                        : "border-violet-500/40 bg-violet-500/10 text-violet-400"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA banner */}
        <section className="border-t border-slate-800 bg-slate-950">
          <div className="mx-auto max-w-4xl px-4 py-16 md:py-20 text-center">
            <div className="relative rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-900 to-slate-950 px-8 py-12 overflow-hidden">
              {/* glow */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500/5 via-transparent to-indigo-500/5" />
              <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full bg-sky-500/10 blur-3xl" />

              <div className="relative space-y-5">
                <h2 className="text-2xl md:text-4xl font-bold text-slate-100">
                  Start your first session{" "}
                  <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                    today.
                  </span>
                </h2>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  No installs. No config. Just open a browser and teach.
                </p>
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-medium shadow-[0_0_24px_rgba(56,189,248,0.4)] hover:shadow-[0_0_36px_rgba(56,189,248,0.6)] hover:from-sky-400 hover:to-indigo-400 transition-all"
                >
                  Open Classroom
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col md:flex-row gap-4 items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-mono font-bold text-[10px]">
              λ
            </div>
            <span>© Lambda 2024</span>
          </div>
          <div className="flex gap-5">
            <button className="hover:text-sky-400 transition-colors">Documentation</button>
            <button className="hover:text-sky-400 transition-colors">Manifesto</button>
            <Link to="/app" className="hover:text-sky-400 transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  number: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  accent: "sky" | "indigo" | "violet";
}

const FeatureCard: React.FC<FeatureCardProps> = ({ number, icon, title, text, accent }) => {
  const accentClasses = {
    sky: "border-sky-500/20 group-hover:border-sky-500/40 bg-sky-500/8 text-sky-400",
    indigo: "border-indigo-500/20 group-hover:border-indigo-500/40 bg-indigo-500/8 text-indigo-400",
    violet: "border-violet-500/20 group-hover:border-violet-500/40 bg-violet-500/8 text-violet-400",
  };
  const glowClasses = {
    sky: "group-hover:shadow-[0_0_30px_rgba(56,189,248,0.08)]",
    indigo: "group-hover:shadow-[0_0_30px_rgba(99,102,241,0.08)]",
    violet: "group-hover:shadow-[0_0_30px_rgba(139,92,246,0.08)]",
  };

  return (
    <div
      className={`group relative rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-4 transition-all duration-300 hover:border-slate-700 hover:-translate-y-0.5 ${glowClasses[accent]}`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${accentClasses[accent]}`}
        >
          {icon}
        </div>
        <span className="font-mono text-[11px] text-slate-700 font-bold">{number}</span>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{text}</p>
      </div>
    </div>
  );
};

const HeroEditorMock: React.FC = () => {
  return (
    <div className="flex h-full w-full flex-col bg-slate-950 overflow-hidden text-slate-300">
      {/* Top bar */}
      <div className="h-9 border-b border-slate-800 flex items-center justify-between px-3 bg-slate-950/95 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 flex items-center justify-center rounded border border-slate-800 bg-slate-900 text-slate-400 text-[9px]">
            «
          </div>
          <span className="font-mono font-bold text-sm tracking-tight">Lambda</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="hidden md:inline">Backend: ok</span>
          <span className="hidden md:inline">Alice (teacher)</span>
          <div className="px-2 py-0.5 border border-slate-800 rounded bg-slate-900 text-[10px]">
            Logout
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: Groups */}
        <div className="w-44 border-r border-slate-800 bg-slate-900/90 flex-col flex-shrink-0 hidden md:flex">
          <div className="px-2 py-1.5 border-b border-slate-800 text-[10px] uppercase tracking-wide text-slate-500 flex items-center justify-between">
            <span>Groups</span>
            <div className="flex items-center gap-1">
              <span className="border border-slate-800 rounded px-1 py-0.5 bg-slate-950 text-[10px]">Join</span>
              <span className="text-sky-400 text-[10px] px-1 py-0.5 border border-slate-800 rounded">+</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="border-b border-slate-800">
              <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-900/60">
                <ChevronDown className="h-3 w-3 text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">Python Basics</div>
                  <div className="text-[10px] text-slate-500">4 members</div>
                </div>
              </div>
              <div className="bg-slate-950/40">
                <div className="pl-5 pr-2 py-1.5 text-[11px] text-slate-400 cursor-pointer hover:bg-slate-900/60">
                  Intro to OOP
                </div>
                <div className="pl-5 pr-2 py-1.5 text-[11px] text-sky-400 bg-slate-900 border-l-2 border-sky-500">
                  Random Module
                </div>
                <div className="pl-5 pr-2 py-1 text-[10px] text-sky-500">
                  + New Classroom
                </div>
              </div>
            </div>
            <div className="border-b border-slate-800">
              <div className="flex items-center gap-1 px-2 py-1.5">
                <ChevronRight className="h-3 w-3 text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">Advanced Python</div>
                  <div className="text-[10px] text-slate-500">2 members</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col bg-slate-900/90 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-800 flex-shrink-0">
            <div className="px-2 py-0.5 text-[11px] border border-slate-800 rounded bg-slate-950">
              ← Back
            </div>
            <span className="text-xs font-semibold">Random Module</span>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Code editor + terminal */}
            <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-900/80 overflow-hidden">
              <div className="px-3 py-1.5 text-[11px] text-slate-400 flex items-center justify-between border-b border-slate-800/80 flex-shrink-0">
                <span className="tracking-wide uppercase">Code</span>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded border text-[11px] font-mono border-sky-500 text-sky-400 bg-slate-900">
                    random_lesson.py
                  </span>
                  <span className="px-1.5 py-0.5 text-[11px] border border-slate-700 rounded bg-slate-950">+</span>
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden min-h-0">
                <div className="w-7 border-r border-slate-800 bg-slate-900/80 text-[10px] text-slate-600 font-mono pt-2 px-1.5 space-y-[3.5px] flex-shrink-0 select-none">
                  {Array.from({ length: 9 }, (_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <pre className="flex-1 font-mono text-[11px] leading-[1.6] px-3 pt-2 bg-slate-900 text-slate-200 overflow-auto">
                  <span className="text-emerald-400"># Selecting a random student</span>{"\n"}
                  <span className="text-sky-400">import</span>{" random\n"}
                  {"\n"}
                  <span className="text-sky-400">def</span>{" "}<span className="text-purple-400">pick_student</span>{"(students):\n"}
                  {"    "}<span className="text-sky-400">return</span>{" random.choice(students)\n"}
                  {"\n"}
                  <span className="text-sky-400">if</span>{" __name__ == "}<span className="text-amber-400">"__main__"</span>{":\n"}
                  {"    group = ["}<span className="text-amber-400">"Alice"</span>{", "}<span className="text-amber-400">"Bob"</span>{"]\n"}
                  {"    print(pick_student(group))"}
                </pre>
              </div>

              <div className="px-3 py-1.5 flex items-center gap-2 border-t border-slate-800 flex-shrink-0">
                <button className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded bg-gradient-to-r from-sky-500 to-indigo-500 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.4)] font-medium">
                  <Play className="h-2.5 w-2.5" />
                  Run
                </button>
                <button className="px-2.5 py-1 text-[11px] rounded border border-slate-800 bg-slate-950 hover:bg-slate-900">
                  Submit
                </button>
              </div>

              <div className="border-t border-slate-800 flex-shrink-0">
                <div className="px-3 py-1 text-[10px] text-slate-400 uppercase tracking-wide border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
                  <span>Terminal</span>
                  <span className="border border-slate-700 rounded px-1 py-0.5">Clear</span>
                </div>
                <div className="h-14 bg-slate-950 font-mono text-[10px] px-3 py-1.5 overflow-auto">
                  <div className="text-slate-500">lambda@runtime:~$ python random_lesson.py</div>
                  <div className="text-emerald-400">Alice</div>
                  <div className="text-slate-600">[info] Shared run completed in 38 ms.</div>
                </div>
              </div>
            </div>

            {/* Submissions panel */}
            <div className="w-40 flex-col bg-slate-900/90 flex-shrink-0 hidden md:flex">
              <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] uppercase tracking-wide text-slate-400">
                Submissions
              </div>
              <div className="flex-1 overflow-auto text-[11px]">
                {[
                  { name: "Alice", status: "success", time: "2:14 PM" },
                  { name: "Bob", status: "error", time: "2:11 PM" },
                  { name: "Carol", status: "success", time: "2:08 PM" },
                ].map((s) => (
                  <div key={s.name} className="px-3 py-1.5 border-b border-slate-800 hover:bg-slate-800/60 cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                          s.status === "success" ? "bg-emerald-400" : "bg-red-400"
                        }`}
                      />
                      <span className="font-medium text-slate-200 truncate">{s.name}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span
                        className={`font-mono text-[10px] ${
                          s.status === "success" ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {s.status}
                      </span>
                      <span className="text-slate-500 text-[10px]">{s.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="h-6 border-t border-slate-800 bg-slate-950/95 text-[10px] text-slate-500 px-3 flex items-center justify-between flex-shrink-0">
        <span>
          Python Sandbox <span className="text-slate-700">|</span>{" "}
          <span className="text-slate-400">Teacher Mode</span>
        </span>
        <span className="hidden md:inline">
          Backend: <span className="text-slate-300">ok</span>
        </span>
      </div>
    </div>
  );
};
