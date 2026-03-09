/**
 * IDE-style code editor with real-time CRDT collaboration.
 *
 * Renders colored cursors and selections of other participants via Yjs Awareness.
 */

import React, { useMemo, useRef, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { bracketMatching } from "@codemirror/language";
import {
  closeBrackets,
  autocompletion,
  completeFromList,
} from "@codemirror/autocomplete";
import * as Y from "yjs";
import { yCollab } from "y-codemirror.next";
import { useCollab, type PeerInfo } from "../hooks/useCollab";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  roomId?: string;
  userName?: string;
}

const PYTHON_SNIPPETS = [
  { label: "print", type: "function", apply: "print()", detail: "Built-in function", info: "Prints the given values to standard output." },
  { label: "range", type: "function", apply: "range()", detail: "Built-in function", info: "Creates an arithmetic progression of integers." },
  { label: "len", type: "function", apply: "len()", detail: "Built-in function", info: "Returns the length of a sequence or collection." },
  { label: "def", type: "keyword", apply: "def ", detail: "Keyword", info: "Defines a new function: def name(args):" },
  { label: "for", type: "keyword", apply: "for ", detail: "Keyword", info: "Loop keyword: for item in iterable:" },
  { label: "if", type: "keyword", apply: "if ", detail: "Keyword", info: "Conditional branch: if condition:" },
];

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  className = "",
  roomId,
  userName,
}) => {
  const ydocRef = useRef<Y.Doc | null>(null);
  if (!ydocRef.current) {
    ydocRef.current = new Y.Doc();
  }
  const ydoc = ydocRef.current;
  const ytext = useMemo(() => ydoc.getText("code"), [ydoc]);

  const { awareness, peers } = useCollab(roomId, ydoc, value, userName);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const updateHandler = () => {
      onChangeRef.current(ytext.toString());
    };
    updateHandler();
    ytext.observe(updateHandler);
    return () => {
      ytext.unobserve(updateHandler);
    };
  }, [ytext]);

  const extensions = useMemo(
    () => [
      python(),
      bracketMatching(),
      closeBrackets(),
      autocompletion({
        override: [completeFromList(PYTHON_SNIPPETS)],
        activateOnTyping: true,
      }),
      yCollab(ytext, awareness ?? undefined),
    ],
    [ytext, awareness],
  );

  return (
    <div className="h-full flex flex-col">
      {/* Presence bar: show colored dots for each remote peer */}
      {peers.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1 border-b border-slate-800 bg-slate-900/80 text-[10px] text-slate-400">
          {peers.map((p) => (
            <span key={p.clientId} className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.name}
            </span>
          ))}
        </div>
      )}
      <CodeMirror
        height="100%"
        className={`flex-1 min-h-0 text-[13px] md:text-sm font-mono ${className}`}
        theme="dark"
        extensions={extensions}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: false,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          indentOnInput: true,
          tabSize: 4,
        }}
        style={{ flex: 1 }}
      />
    </div>
  );
};
