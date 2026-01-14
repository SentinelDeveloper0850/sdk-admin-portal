"use client";

import EditorJS, { type OutputData } from "@editorjs/editorjs";
import CodeTool from "@editorjs/code";
import Delimiter from "@editorjs/delimiter";
import Header from "@editorjs/header";
import InlineCode from "@editorjs/inline-code";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import { useEffect, useId, useRef } from "react";

type Props = {
  initialData?: OutputData;
  placeholder?: string;
  onChange?: (data: OutputData) => void;
};

export default function EditorJsEditor({ initialData, placeholder, onChange }: Props) {
  const holderId = useId().replace(/:/g, "");
  const editorRef = useRef<EditorJS | null>(null);
  const changeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (editorRef.current) return;

    const editor = new EditorJS({
      holder: holderId,
      placeholder: placeholder ?? "Write...",
      autofocus: false,
      data: initialData,
      tools: {
        header: Header,
        list: List,
        quote: Quote,
        code: CodeTool,
        delimiter: Delimiter,
        inlineCode: InlineCode,
      },
      onChange: async (api) => {
        if (!onChange) return;
        if (changeTimerRef.current) window.clearTimeout(changeTimerRef.current);
        changeTimerRef.current = window.setTimeout(async () => {
          try {
            const data = await api.saver.save();
            onChange(data);
          } catch {
            // ignore save errors during rapid typing/unmount
          }
        }, 250);
      },
    });

    editorRef.current = editor;

    return () => {
      if (changeTimerRef.current) window.clearTimeout(changeTimerRef.current);
      changeTimerRef.current = null;
      editorRef.current?.destroy?.();
      editorRef.current = null;
    };
  }, [holderId, initialData, onChange, placeholder]);

  return (
    <div className="rounded-md border bg-background px-3 py-2 text-sm">
      <div id={holderId} className="min-h-48" />
    </div>
  );
}

