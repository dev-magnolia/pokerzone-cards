/**
 * @pokerzon/cards/dom — without React: HTML strings, replacing cards in existing HTML elements, Web Components.
 * Styles: link `@pokerzon/cards/styles.css`.
 */
import { tokenize } from "../core/tokenize.ts";
import {
  backNode, boardNode, cardNode, handNode, inlineNode, miniNode, spriteNode, textNodes,
  type BackOptions, type CardOptions, type HandOptions, type MiniOptions, type TextOptions,
} from "../markup/cards.ts";
import { toHtml } from "../markup/vnode.ts";
import type { CardInput, CardsInput } from "../core/types.ts";

export { installCopyHandler, selectionText, type CopyFormat } from "./copy.ts";
export type { BackOptions, CardOptions, HandOptions, MiniOptions, TextOptions };

/** HTML strings (server side too: e-mail, static export). */
export const cardHtml = (card: CardInput, o?: CardOptions) => toHtml(cardNode(card, o));
export const backHtml = (o?: BackOptions) => toHtml(backNode(o));
export const miniHtml = (card: CardInput, o?: MiniOptions) => toHtml(miniNode(card, o));
export const handHtml = (cards: CardsInput, o?: HandOptions) => toHtml(handNode(cards, o));
export const boardHtml = (cards: CardsInput, o?: CardOptions & { slots?: number }) => toHtml(boardNode(cards, o));
export const inlineHtml = (card: CardInput, o?: TextOptions) => toHtml(inlineNode(card, o));
export const spriteHtml = () => toHtml(spriteNode());

/** Text → HTML with the cards replaced (the text itself is escaped). */
export function renderToHtml(text: string, o?: TextOptions): string {
  return toHtml(textNodes(text, o));
}

const SKIP = "code,pre,a,script,style,textarea,[data-no-cards],.pzc,.pzi";

/**
 * Replaces the cards in the text of an existing element (embed, static page). Skips code, pre, links,
 * form fields and `[data-no-cards]`. Returns the number of card groups replaced.
 */
export function renderCardsIn(root: Element, o?: TextOptions): number {
  const walker = root.ownerDocument.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n as Text;
    if (t.parentElement?.closest(SKIP)) continue;
    if (/[\[{♠♥♦♣♤♡♢♧]/.test(t.data)) nodes.push(t);
  }
  let count = 0;
  for (const t of nodes) {
    const segs = tokenize(t.data, o);
    const groups = segs.filter((s) => s.type === "cards").length;
    if (!groups) continue;
    const tpl = root.ownerDocument.createElement("template");
    tpl.innerHTML = renderToHtml(t.data, o);
    t.replaceWith(tpl.content);
    count += groups;
  }
  return count;
}

/**
 * Defines the Web Components (call once, in the browser):
 * `<pz-card card="Th" face="bold" size="64">`, `<pz-mini card="Th" shape="tag">`, `<pz-hand cards="As Kd" layout="fan">`,
 * `<pz-board cards="As Kd 7c">`, `<pz-back variant="slogan" muck>`, `<pz-text mode="tag">Flop [As Kd 7c]</pz-text>`.
 * They render light DOM (the page's styles.css applies).
 */
export function defineCardElements(prefix = "pz"): void {
  if (typeof customElements === "undefined") return;
  const num = (v: string | null) => (v ? Number(v) : undefined);
  const common = (el: HTMLElement) => ({
    deck: (el.getAttribute("deck") as "four" | "two" | null) ?? undefined,
    surface: (el.getAttribute("surface") as "light" | "dark" | null) ?? undefined,
  });
  const def = (name: string, render: (el: HTMLElement) => string, observed: string[]) => {
    const tag = `${prefix}-${name}`;
    if (customElements.get(tag)) return;
    customElements.define(tag, class extends HTMLElement {
      static get observedAttributes() { return observed; }
      private src: string | null = null;
      connectedCallback() { this.paint(); }
      attributeChangedCallback() { if (this.isConnected) this.paint(); }
      paint() {
        if (this.src === null) this.src = this.textContent ?? "";
        this.dataset.src = this.src;
        this.innerHTML = render(this);
      }
    });
  };
  const A = ["deck", "surface"];
  def("card", (el) => cardHtml(el.getAttribute("card") ?? "Xx", { ...common(el), face: (el.getAttribute("face") as never) ?? undefined, width: num(el.getAttribute("size")) }), ["card", "face", "size", ...A]);
  def("mini", (el) => miniHtml(el.getAttribute("card") ?? "Xx", { ...common(el), shape: (el.getAttribute("shape") as never) ?? undefined, colour: el.hasAttribute("colour"), muck: el.hasAttribute("muck") }), ["card", "shape", "colour", "muck", ...A]);
  def("hand", (el) => handHtml(el.getAttribute("cards") ?? "", { ...common(el), layout: (el.getAttribute("layout") as never) ?? undefined, face: (el.getAttribute("face") as never) ?? undefined, width: num(el.getAttribute("size")), faceDown: el.hasAttribute("face-down") }), ["cards", "layout", "face", "size", "face-down", ...A]);
  def("board", (el) => boardHtml(el.getAttribute("cards") ?? "", { ...common(el), face: (el.getAttribute("face") as never) ?? undefined, width: num(el.getAttribute("size")) }), ["cards", "face", "size", ...A]);
  def("back", (el) => backHtml({ ...common(el), variant: (el.getAttribute("variant") as never) ?? undefined, muck: el.hasAttribute("muck"), width: num(el.getAttribute("size")) }), ["variant", "muck", "size", ...A]);
  def("text", (el) => renderToHtml((el as HTMLElement & { dataset: DOMStringMap }).dataset.src ?? el.textContent ?? "", { ...common(el), mode: (el.getAttribute("mode") as never) ?? undefined }), ["mode", ...A]);
}
