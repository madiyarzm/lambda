import React from "react";
import { Link } from "react-router-dom";
import { ContainerScroll } from "./components/ui/container-scroll-animation";
import { Terminal, ListTree, BookOpen } from "lucide-react";

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
    <div className="flex h-full w-full divide-x divide-slate-800 bg-slate-900">
      <div className="w-40 border-r border-slate-800 bg-slate-900/80 hidden md:flex flex-col">
        <div className="px-3 py-2 border-b border-slate-800 text-[10px] uppercase tracking-wide text-slate-500">
          Curriculum
        </div>
        <div className="px-3 py-2 text-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Lesson 1 · Random</span>
          </div>
          <div className="pl-4 text-slate-400 text-[11px] space-y-1">
            <div>1. Concepts</div>
            <div>2. Implementation</div>
            <div>3. Practice</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center border-b border-slate-800 text-xs">
          <div className="px-3 py-1.5 border-r border-slate-800 bg-slate-950 text-slate-200">
            random_lesson.py
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex">
            <div className="w-10 border-r border-slate-800 bg-slate-900/80 text-[11px] text-slate-600 font-mono pt-3 px-2 space-y-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <pre className="flex-1 font-mono text-[12px] leading-relaxed px-4 pt-3 bg-slate-900 text-slate-200 overflow-auto">
<span className="text-emerald-400"># Selecting a random student from a group</span>
<span className="text-sky-400">import</span> random

<span className="text-sky-400">def</span> <span className="text-purple-400">pick_random_student</span>(students):
    <span className="text-emerald-400"># students is a non-empty list</span>
    <span className="text-sky-400">return</span> random.choice(students)

<span className="text-sky-400">if</span> __name__ == <span className="text-amber-400">&quot;__main__&quot;</span>:
    group = [<span className="text-amber-400">&quot;Alice&quot;</span>, <span className="text-amber-400">&quot;Bob&quot;</span>, <span className="text-amber-400">&quot;Carol&quot;</span>]
    print(<span className="text-amber-400">&quot;Selected:&quot;</span>, pick_random_student(group))
            </pre>
          </div>

          <div className="w-56 border-l border-slate-800 bg-slate-900/80 flex flex-col">
            <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] uppercase tracking-wide text-slate-500 font-mono">
              Console / Output
            </div>
            <pre className="flex-1 font-mono text-[11px] px-3 py-2 text-slate-200 overflow-auto">
$ python random_lesson.py
Selected: Alice

<span className="text-slate-500">[info] Shared run completed in 42 ms.
[info] Sandbox: execution is currently simulated.</span>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

