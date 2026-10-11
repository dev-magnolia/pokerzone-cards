import { createElement, type ReactNode } from "react";
import type { Child } from "../markup/vnode.ts";

const KEEP = /^(data-|aria-)/;
const RENAME: Record<string, string> = { class: "className", for: "htmlFor", tabindex: "tabIndex" };

function styleObject(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of s.split(";")) {
    const i = part.indexOf(":");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (!k) continue;
    out[k.startsWith("--") ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
  }
  return out;
}

/** The markup tree as React elements. */
export function toReact(node: Child, key?: string | number): ReactNode {
  if (typeof node === "string") return node;
  const props: Record<string, unknown> = {};
  if (key !== undefined) props.key = key;
  for (const [k, v] of Object.entries(node.a ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "style") props.style = styleObject(String(v));
    else if (RENAME[k]) props[RENAME[k]] = v;
    else if (KEEP.test(k) || k === "viewBox") props[k] = v;
    else props[k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
  }
  const kids = (node.c ?? []).map((c, i) => toReact(c, i));
  return createElement(node.t, props, ...kids);
}

export function toReactList(nodes: Child[]): ReactNode[] {
  return nodes.map((c, i) => toReact(c, i));
}
