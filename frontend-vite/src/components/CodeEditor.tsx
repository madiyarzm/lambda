/**
 * IDE-style code editor: Python syntax highlighting, bracket matching,
 * auto-closing brackets, and real-time CRDT collaboration via Yjs.
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
import { useCollab } from "../hooks/useCollab";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  roomId?: string;
}

const PYTHON_SNIPPETS = [
  {
    label: "print",
    type: "function",
    apply: "print()",
    detail: "Built-in function",
    info: "Prints the given values to standard output.",
  },
  {
    label: "range",
    type: "function",
    apply: "range()",
    detail: "Built-in function",
    info: "Creates an arithmetic progression of integers (often used in for-loops).",
  },
  {
    label: "len",
    type: "function",
    apply: "len()",
    detail: "Built-in function",
    info: "Returns the length (number of items) of a sequence or collection.",
  },
  {
    label: "def",
    type: "keyword",
    apply: "def ",
    detail: "Keyword",
    info: "Defines a new function: def name(args):",
  },
  {
    label: "for",
    type: "keyword",
    apply: "for ",
    detail: "Keyword",
    info: "Loop keyword: for item in iterable:",
  },
  {
    label: "if",
    type: "keyword",
    apply: "if ",
    detail: "Keyword",
    info: "Conditional branch: if condition:",
  },
];

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  className = "",
  roomId,
}) => {
  const ydocRef = useRef<Y.Doc | null>(null);
  if (!ydocRef.current) {
    ydocRef.current = new Y.Doc();
  }
  const ydoc = ydocRef.current;
  const ytext = useMemo(() => ydoc.getText("code"), [ydoc]);

  // Collaboration + initial value seeding handled inside useCollab.
  // value is passed as initialValue so only the first client in the room
  // seeds the document (avoids duplication).
  useCollab(roomId, ydoc, value);

  // Keep parent React state in sync with CRDT document content
  // so that Run/Submit always use the latest text.
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
      yCollab(ytext, undefined as any),
    ],
    [ytext],
  );

  return (
    <CodeMirror
      height="100%"
      className={`h-full text-[13px] md:text-sm font-mono ${className}`}
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
  );
};
