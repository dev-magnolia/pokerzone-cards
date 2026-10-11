/**
 * A tiny element tree — the single source of the card markup. The same tree becomes an HTML string (`toHtml`),
 * a hast tree (rehype), or React elements (`/react`), so every renderer draws exactly the same cards.
 * Attribute names are HTML / SVG names (`class`, `viewBox`, `stroke-dasharray`, `data-*`, `aria-*`).
 */
export type Attr = string | number | boolean | undefined | null;
export interface VNode {
  t: string;
  a?: Record<string, Attr>;
  c?: Child[];
}
export type Child = VNode | string;

export function h(t: string, a?: Record<string, Attr>, ...c: (Child | Child[] | false | null | undefined)[]): VNode {
  const kids: Child[] = [];
  for (const x of c) {
    if (x === false || x === null || x === undefined) continue;
    if (Array.isArray(x)) kids.push(...x);
    else kids.push(x);
  }
  return kids.length ? { t, a, c: kids } : { t, a };
}

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]!);

/** The tree as an HTML string. */
export function toHtml(node: Child | Child[]): string {
  if (Array.isArray(node)) return node.map(toHtml).join("");
  if (typeof node === "string") return esc(node);
  let attrs = "";
  for (const [k, v] of Object.entries(node.a ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    attrs += v === true ? ` ${k}` : ` ${k}="${esc(String(v))}"`;
  }
  return `<${node.t}${attrs}>${(node.c ?? []).map(toHtml).join("")}</${node.t}>`;
}

/** hast (HTML AST) node — for rehype. */
export interface HastElement {
  type: "element";
  tagName: string;
  properties: Record<string, string | number | boolean | string[]>;
  children: (HastElement | { type: "text"; value: string })[];
}

export function toHast(node: Child): HastElement | { type: "text"; value: string } {
  if (typeof node === "string") return { type: "text", value: node };
  const properties: HastElement["properties"] = {};
  for (const [k, v] of Object.entries(node.a ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") properties.className = String(v).split(/\s+/).filter(Boolean);
    else if (k.startsWith("data-") || k.startsWith("aria-")) properties[camelData(k)] = v as string;
    else properties[svgProp(k)] = v as string;
  }
  return { type: "element", tagName: node.t, properties, children: (node.c ?? []).map(toHast) };
}

function camelData(k: string) {
  // hast uses camelCase for data-* (dataS) and aria-* (ariaLabel)
  return k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}
function svgProp(k: string) {
  return k === "viewBox" ? "viewBox" : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}
