import React from "react";
import { Link } from "react-router-dom";
import { ContainerScroll } from "./components/ui/container-scroll-animation";
import { Terminal, ListTree, BookOpen, Play, ChevronRight, ChevronDown } from "lucide-react";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans">
      <header className="fixed top-0 inset-x-0 z-20 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-12 flex items-center justify-between">
          <div className="font-mono font-bold text-sm tracking-tight">
            Lambda
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="hidden md:flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>Mentor: Connected</span>
            </div>
            <Link
              to="/app"
              className="px-3 py-1 text-xs border border-slate-800 rounded-md bg-slate-950 hover:bg-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/app"
              className="px-3 py-1 text-xs rounded-md bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors"
            >
              Start Mentoring
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-0">
        <section>
          <ContainerScroll
            titleComponent={
              <>
                <h1 className="text-3xl md:text-5xl font-semibold">
                  Master Python. Together.{" "}
                  <span className="text-sky-400">In Sync.</span>
                </h1>
                <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto">
                  A minimalist, real-time environment built for CS students and
                  small-group mentorship.
                </p>
              </>
            }
          >
            <HeroEditorMock />
          </ContainerScroll>
        </section>

        <section className="border-t border-slate-800 bg-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
            <h2 className="text-lg font-semibold mb-6">
              Built for deliberate Python practice
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <FeatureCard
                icon={<Terminal className="h-4 w-4 text-sky-400" />}
                title="Synchronized Execution"
                text="Run code together in a shared sandbox while students observe each change."
              />
              <FeatureCard
                icon={<ListTree className="h-4 w-4 text-sky-400" />}
                title="Step-by-Step Logic"
                text="Trace execution paths and inspect state with tools designed for explanation."
              />
              <FeatureCard
                icon={<BookOpen className="h-4 w-4 text-sky-400" />}
                title="Structured Curriculum"
                text="Move beyond trivial scripts into OOP, libraries, and real-world patterns."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-between text-slate-500">
          <span>© Lambda 2024</span>
          <div className="flex gap-4">
            <button className="hover:text-sky-400">Documentation</button>
            <button className="hover:text-sky-400">Manifesto</button>
            <button className="hover:text-sky-400">Login</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  text: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, text }) => (
  <div className="rounded-md border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-3">
    <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 border border-slate-800">
      {icon}
    </div>
    <h3 className="text-sm font-semibold">{title}</h3>
    <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
  </div>
);

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
            {/* Group 1 - expanded */}
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
            {/* Group 2 - collapsed */}
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
          {/* Assignment header */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-800 flex-shrink-0">
            <div className="px-2 py-0.5 text-[11px] border border-slate-800 rounded bg-slate-950">
              ← Back
            </div>
            <span className="text-xs font-semibold">Random Module</span>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Code editor + terminal */}
            <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-900/80 overflow-hidden">
              {/* File tabs */}
              <div className="px-3 py-1.5 text-[11px] text-slate-400 flex items-center justify-between border-b border-slate-800/80 flex-shrink-0">
                <span className="tracking-wide uppercase">Code</span>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded border text-[11px] font-mono border-sky-500 text-sky-400 bg-slate-900">
                    random_lesson.py
                  </span>
                  <span className="px-1.5 py-0.5 text-[11px] border border-slate-700 rounded bg-slate-950">+</span>
                </div>
              </div>

              {/* Code area */}
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

              {/* Run / Submit */}
              <div className="px-3 py-1.5 flex items-center gap-2 border-t border-slate-800 flex-shrink-0">
                <button className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded bg-gradient-to-r from-sky-500 to-indigo-500 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.4)] font-medium">
                  <Play className="h-2.5 w-2.5" />
                  Run
                </button>
                <button className="px-2.5 py-1 text-[11px] rounded border border-slate-800 bg-slate-950 hover:bg-slate-900">
                  Submit
                </button>
              </div>

              {/* Terminal */}
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

