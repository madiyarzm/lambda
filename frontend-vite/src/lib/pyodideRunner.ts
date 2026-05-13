/**
 * Pyodide-based Python runner. Executes student code in the browser's
 * WebAssembly sandbox instead of on the server.
 *
 * Pyodide is loaded from CDN on first use (~10MB, cached by the browser).
 * stdin is fed from a pre-supplied queue of lines; once exhausted, input()
 * returns "" (empty line).
 */

const PYODIDE_VERSION = "0.27.5";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// Subresource Integrity hash for the pyodide.js loader. The browser refuses
// to execute the file if its actual SHA-384 doesn't match this string — so
// a compromised CDN serving a malicious loader is blocked.
//
// Important caveats:
//   * Pyodide's loader internally fetch()es pyodide.asm.wasm, .asm.js, and
//     python_stdlib.zip. Those sub-fetches are NOT SRI-verified — Pyodide
//     upstream doesn't ship a manifest. SRI here protects the entry point;
//     full integrity requires self-hosting.
//   * When bumping PYODIDE_VERSION above, you MUST regenerate this hash:
//       curl -fsSL https://cdn.jsdelivr.net/pyodide/v<NEW>/full/pyodide.js \
//         | openssl dgst -sha384 -binary | openssl base64 -A
//     Otherwise the loader will fail to start and Pyodide won't work.
const PYODIDE_INTEGRITY =
  "sha384-rm4QcPMX69sqmX2kWiJa3BF02sgdJkVyATWkw5NHAxBUAvmLXhToWZYaP2wCcyEe";

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<any>;
  }
}

export type RunOutput = { type: "stdout" | "stderr"; text: string };

export type RunResult = {
  status: "success" | "error" | "timeout";
  stdout: string;
  stderr: string;
  exit_code: number;
  elapsed: number;
};

export type SubmissionResult = RunResult & {
  test_passed: boolean | null;
  test_output: string;
};

type ProgressEvent =
  | { kind: "loading"; message: string }
  | { kind: "ready" };

type ProgressListener = (e: ProgressEvent) => void;

let pyodidePromise: Promise<any> | null = null;
const progressListeners = new Set<ProgressListener>();

function emitProgress(e: ProgressEvent): void {
  for (const fn of progressListeners) fn(e);
}

export function onPyodideProgress(listener: ProgressListener): () => void {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
}

export function isPyodideReady(): boolean {
  return pyodidePromise !== null && (pyodidePromise as any)._resolved === true;
}

function loadScript(src: string, integrity?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Pyodide")));
      // If already loaded:
      if ((existing as HTMLScriptElement).dataset.loaded === "true") resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    // SRI: browser refuses to execute the script if its hash doesn't match
    // `integrity`. `crossOrigin="anonymous"` is required for SRI on
    // cross-origin scripts — without it the browser can't read the body
    // to verify the hash.
    if (integrity) {
      s.integrity = integrity;
      s.crossOrigin = "anonymous";
    }
    s.onload = () => {
      s.dataset.loaded = "true";
      resolve();
    };
    s.onerror = () => reject(new Error("Failed to load Pyodide (integrity check or network)"));
    document.head.appendChild(s);
  });
}

async function loadPyodideOnce(): Promise<any> {
  if (pyodidePromise) return pyodidePromise;
  emitProgress({ kind: "loading", message: "Loading Python runtime…" });
  pyodidePromise = (async () => {
    await loadScript(`${PYODIDE_CDN}pyodide.js`, PYODIDE_INTEGRITY);
    if (!window.loadPyodide) throw new Error("Pyodide failed to expose loadPyodide");
    const py = await window.loadPyodide({ indexURL: PYODIDE_CDN });
    (pyodidePromise as any)._resolved = true;
    emitProgress({ kind: "ready" });
    return py;
  })();
  return pyodidePromise;
}

/** Eagerly trigger Pyodide download. Safe to call multiple times. */
export function warmupPyodide(): void {
  void loadPyodideOnce();
}

type RunOpts = {
  code: string;
  stdinLines?: string[];
  onOutput?: (e: RunOutput) => void;
  /** Hard wall-clock timeout in ms. Default 10s. */
  timeoutMs?: number;
};

async function runWithIO(opts: RunOpts): Promise<RunResult> {
  const py = await loadPyodideOnce();
  const start = performance.now();

  const stdoutBuf: string[] = [];
  const stderrBuf: string[] = [];
  const queue = [...(opts.stdinLines ?? [])];

  py.setStdout({
    batched: (s: string) => {
      stdoutBuf.push(s + "\n");
      opts.onOutput?.({ type: "stdout", text: s + "\n" });
    },
  });
  py.setStderr({
    batched: (s: string) => {
      stderrBuf.push(s + "\n");
      opts.onOutput?.({ type: "stderr", text: s + "\n" });
    },
  });
  py.setStdin({
    stdin: () => {
      if (queue.length === 0) return "";
      return queue.shift() as string;
    },
    autoEOF: false,
  });

  // Watchdog: Pyodide on main thread can't be killed mid-execution, but we
  // can at least report timeout to the caller.
  const timeoutMs = opts.timeoutMs ?? 10_000;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    py.checkInterrupt?.();
  }, timeoutMs);

  let status: RunResult["status"] = "success";
  let exitCode = 0;
  try {
    await py.runPythonAsync(opts.code);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    stderrBuf.push(msg + "\n");
    opts.onOutput?.({ type: "stderr", text: msg + "\n" });
    status = timedOut ? "timeout" : "error";
    exitCode = 1;
  } finally {
    clearTimeout(timer);
  }

  return {
    status,
    stdout: stdoutBuf.join(""),
    stderr: stderrBuf.join(""),
    exit_code: exitCode,
    elapsed: parseFloat(((performance.now() - start) / 1000).toFixed(2)),
  };
}

export function runInteractive(opts: RunOpts): Promise<RunResult> {
  return runWithIO(opts);
}

/**
 * Run student code, then the assignment's test_code (if present) appended
 * to the student code, in a fresh interpreter scope. Returns one result
 * for the student run plus test_passed/test_output for grading.
 */
export async function runForSubmission(
  code: string,
  testCode: string | null | undefined,
  stdinLines: string[] = [],
): Promise<SubmissionResult> {
  const studentRun = await runWithIO({ code, stdinLines });

  let test_passed: boolean | null = null;
  let test_output = "";

  if (testCode && testCode.trim()) {
    const combined = code + "\n\n# === auto-grader ===\n" + testCode;
    const testRun = await runWithIO({ code: combined, stdinLines });
    test_passed = testRun.status === "success";
    test_output = (testRun.stdout || "") + (testRun.stderr || "");
  }

  return {
    ...studentRun,
    test_passed,
    test_output,
  };
}
