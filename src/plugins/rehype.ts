/**
 * @pokerzon/cards/rehype — a rehype (HTML) plugin: replaces card notation in text nodes with card elements
 * (e.g. iZY CMS rich text). No dependency on unified: it walks the hast tree directly.
 * Skips code, pre, links, script, style, textarea and elements with `data-no-cards`.
 *
 *   unified().use(rehypeParse, { fragment: true }).use(rehypePzCards, { mode: "tag" }).use(rehypeStringify)
 */
import { tokenize } from "../core/tokenize.ts";
import { textNodes, type TextOptions } from "../markup/cards.ts";
import { toHast, type HastElement } from "../markup/vnode.ts";

type HNode = HastElement | { type: "text"; value: string } | { type: string; children?: HNode[]; tagName?: string; properties?: Record<string, unknown>; value?: string };

const SKIP_TAGS = new Set(["code", "pre", "a", "script", "style", "textarea", "kbd", "samp"]);

export default function rehypePzCards(options: TextOptions = {}) {
  return (tree: HNode) => {
    walk(tree, options);
  };
}
export { rehypePzCards };

function skipped(n: HNode): boolean {
  const el = n as { tagName?: string; properties?: Record<string, unknown> };
  if (!el.tagName) return false;
  if (SKIP_TAGS.has(el.tagName)) return true;
  const p = el.properties ?? {};
  const cls = p.className;
  return "dataNoCards" in p || (Array.isArray(cls) && cls.some((c) => c === "pzc" || c === "pzi"));
}

function walk(node: HNode, o: TextOptions) {
  const kids = (node as { children?: HNode[] }).children;
  if (!kids) return;
  const next: HNode[] = [];
  for (const child of kids) {
    if (child.type === "text" && typeof (child as { value?: string }).value === "string") {
      const value = (child as { value: string }).value;
      if (tokenize(value, o).some((s) => s.type === "cards")) next.push(...textNodes(value, o).map((p) => toHast(p) as HNode));
      else next.push(child);
      continue;
    }
    if (!skipped(child)) walk(child, o);
    next.push(child);
  }
  (node as { children: HNode[] }).children = next;
}
