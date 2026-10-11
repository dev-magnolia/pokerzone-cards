/** Copy as text: copying a selection turns hand-history cards into text (Symbol text A♠ or Letter text As). */
export type CopyFormat = "symbol" | "letter";

const CARD_SEL = ".pzc--tile,.pzc--tag,.pzi";

/** The text of a node with its cards written as text. */
export function selectionText(node: Node, format: CopyFormat): string {
  const c = node.cloneNode(true) as Element | DocumentFragment;
  const key = format === "letter" ? "l" : "c";
  c.querySelectorAll?.(CARD_SEL).forEach((m) => {
    const el = m as HTMLElement;
    el.replaceWith(` ${el.dataset[key] ?? el.textContent ?? ""} `);
  });
  return (c.textContent ?? "").replace(/[ \t]+/g, " ").replace(/ ([,.])/g, "$1").trim();
}

/**
 * Installs one document-level copy handler (idempotent; returns an uninstall function). When the selection
 * contains cards, the clipboard gets text; otherwise the browser's default copy runs.
 */
export function installCopyHandler(format: CopyFormat | (() => CopyFormat) = "symbol"): () => void {
  if (typeof document === "undefined") return () => {};
  const get = typeof format === "function" ? format : () => format;
  const handler = (e: ClipboardEvent) => {
    const sel = document.getSelection();
    if (!sel || !sel.rangeCount || !e.clipboardData) return;
    const frag = sel.getRangeAt(0).cloneContents();
    if (!frag.querySelector(CARD_SEL)) return;
    const d = document.createElement("div");
    d.appendChild(frag);
    e.clipboardData.setData("text/plain", selectionText(d, get()));
    e.preventDefault();
  };
  document.addEventListener("copy", handler);
  return () => document.removeEventListener("copy", handler);
}
