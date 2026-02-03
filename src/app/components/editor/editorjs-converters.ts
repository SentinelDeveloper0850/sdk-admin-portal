"use client";

import type { OutputBlockData, OutputData } from "@editorjs/editorjs";
import edjsHTML from "editorjs-html";

const edjsParser = edjsHTML();

export function editorJsToHtml(data: OutputData | null | undefined): string {
  if (!data?.blocks?.length) return "";
  const parts = edjsParser.parse(data) as string[];
  return parts.join("");
}

function blockTextToMarkdown(block: OutputBlockData): string {
  switch (block.type) {
    case "header": {
      const level = Number((block.data as any)?.level ?? 2);
      const text = String((block.data as any)?.text ?? "");
      return `${"#".repeat(Math.min(Math.max(level, 1), 6))} ${text}`.trim();
    }
    case "paragraph": {
      return String((block.data as any)?.text ?? "").trim();
    }
    case "list": {
      const style = String((block.data as any)?.style ?? "unordered");
      const items = Array.isArray((block.data as any)?.items)
        ? (block.data as any).items
        : [];
      if (!items.length) return "";
      if (style === "ordered") {
        return items
          .map((it: any, idx: number) => `${idx + 1}. ${String(it).trim()}`)
          .join("\n");
      }
      return items.map((it: any) => `- ${String(it).trim()}`).join("\n");
    }
    case "quote": {
      const text = String((block.data as any)?.text ?? "").trim();
      const caption = String((block.data as any)?.caption ?? "").trim();
      const lines = text ? text.split("\n").map((l) => `> ${l}`) : [];
      const cap = caption ? `\n> \n> — ${caption}` : "";
      return lines.join("\n") + cap;
    }
    case "code": {
      const code = String((block.data as any)?.code ?? "");
      return `\`\`\`\n${code}\n\`\`\``;
    }
    case "delimiter": {
      return "---";
    }
    default: {
      // best-effort: stringify known "text" fields
      const text = (block.data as any)?.text;
      if (typeof text === "string") return text.trim();
      return "";
    }
  }
}

export function editorJsToMarkdown(
  data: OutputData | null | undefined
): string {
  if (!data?.blocks?.length) return "";
  const md = data.blocks
    .map((b) => blockTextToMarkdown(b))
    .filter(Boolean)
    .join("\n\n");
  return md;
}
