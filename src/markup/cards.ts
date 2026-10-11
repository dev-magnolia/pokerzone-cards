import { SUIT_NAME, SUIT_SYMBOL } from "../core/constants.ts";
import { cardKey, formatCard } from "../core/format.ts";
import { cardLabel, cardsLabel, type Locale } from "../core/labels.ts";
import { toCard, toCards } from "../core/parse.ts";
import { tokenize, type TokenizeOptions } from "../core/tokenize.ts";
import type { BackVariant, Card, CardInput, CardsInput, Deck, Face, HandLayout, MiniShape, Suit, Surface } from "../core/types.ts";
import { SUIT_PATHS, UNKNOWN_SUIT_PATH, VIEWBOX } from "../generated/shapes.ts";
import { h, type Child, type VNode } from "./vnode.ts";

/** Options shared by every card. Deck and surface are written on the element only when given. */
export interface CommonOptions {
  deck?: Deck;
  surface?: Surface;
  locale?: Locale;
  /** Use `<use href="#pzs-…">` instead of inline paths (needs the sprite once on the page: `spriteNode()`). */
  sprite?: boolean;
  className?: string;
}

const VB = VIEWBOX.join(" ");
/** The question mark (unknown suit) on a big, bleeding suit: lifted so the dot stays on the card. */
export const UNKNOWN_LIFT = "translate(0 -10)";
const suitName = (s: Suit | null) => (s === null ? "x" : SUIT_NAME[s]);
const cls = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** Inline suit. `cut`: the two-part Z-cut suit (32 px and up); else the solid suit. An unknown suit is a question mark. */
export function suitNode(suit: Suit | null, opts: { cut?: boolean; className?: string; sprite?: boolean } = {}): VNode {
  const a = { class: opts.className, viewBox: VB, "aria-hidden": "true", focusable: "false" };
  if (suit === null) {
    // On the big (bleeding) suit the question mark is lifted so its dot stays on the card.
    return h("svg", a, h("path", { d: UNKNOWN_SUIT_PATH, fill: "var(--s1,var(--rk))", transform: opts.cut ? UNKNOWN_LIFT : undefined }));
  }
  const name = SUIT_NAME[suit];
  if (opts.sprite) return h("svg", a, h("use", { href: `#pzs-${name}-${opts.cut ? "cut" : "solid"}` }));
  const p = SUIT_PATHS[name];
  return opts.cut
    ? h("svg", a, h("path", { d: p.upper, fill: "var(--u)" }), h("path", { d: p.lower, fill: "var(--l)" }))
    : h("svg", a, h("path", { d: p.solid, fill: "var(--s1,var(--rk))" }));
}

/** The sprite (`<defs>`), once per page, for `sprite: true`. */
export function spriteNode(): VNode {
  const defs: VNode[] = [];
  for (const s of ["s", "h", "d", "c"] as Suit[]) {
    const n = SUIT_NAME[s];
    const p = SUIT_PATHS[n];
    defs.push(h("g", { id: `pzs-${n}-cut` }, h("path", { d: p.upper, fill: "var(--u)" }), h("path", { d: p.lower, fill: "var(--l)" })));
    defs.push(h("g", { id: `pzs-${n}-solid` }, h("path", { d: p.solid, fill: "var(--s1,var(--rk))" })));
  }
  return h("svg", { width: 0, height: 0, style: "position:absolute", "aria-hidden": "true" }, h("defs", {}, defs));
}

function base(card: Card, extraClass: string, o: CommonOptions, style?: string) {
  return {
    class: cls("pzc", extraClass, o.className),
    "data-s": suitName(card.suit),
    "data-deck": o.deck,
    "data-surface": o.surface,
    style,
    role: "img",
    "aria-label": cardLabel(card, o.locale),
  };
}

export interface CardOptions extends CommonOptions {
  face?: Face;
  /** Card width in px (default 64; smallest recommended 44). */
  width?: number;
  /** For an unknown card (`Xx`): the back to show. */
  back?: BackVariant;
}

/** A card face (Bold, Soft, Split). An unknown card renders its back. */
export function cardNode(input: CardInput, o: CardOptions = {}): VNode {
  const card = toCard(input);
  const { face = "bold", width = 64 } = o;
  if (card.rank === null && card.suit === null) return backNode({ ...o, variant: o.back });
  const rank = card.rank ?? "?";
  const style = `--w:${width}px`;
  const sp = o.sprite;
  if (face === "soft") {
    return h("span", base(card, "pzc--soft", o, style),
      h("span", { class: "ix" }, h("b", { class: "rk" }, rank), suitNode(card.suit, { sprite: sp })),
      suitNode(card.suit, { cut: true, className: "big", sprite: sp }));
  }
  if (face === "split") {
    return h("span", base(card, "pzc--split", o, style),
      h("i", { class: "fu" }), h("i", { class: "fl" }), h("b", { class: "rk" }, rank),
      suitNode(card.suit, { className: "br", sprite: sp }));
  }
  return h("span", base(card, "pzc--bold", o, style), h("b", { class: "rk" }, rank), suitNode(card.suit, { cut: true, className: "big", sprite: sp }));
}

export interface BackOptions extends CommonOptions {
  variant?: BackVariant;
  /** A folded card. */
  muck?: boolean;
  width?: number;
}

/** A card back. */
export function backNode(o: BackOptions = {}): VNode {
  const { variant = "slogan", muck = false, width = 64 } = o;
  return h("span", {
    class: cls("pzc", "pzb", `pzb--${variant}`, muck && "pzb--muck", o.className),
    "data-surface": o.surface,
    style: `--w:${width}px`,
    role: "img",
    "aria-label": muck ? "Folded card" : "Face-down card",
  });
}

export interface MiniOptions extends CommonOptions {
  shape?: MiniShape;
  /** The Split look (coloured card, white rank and suit) — goes with the Split face. */
  colour?: boolean;
  /** An unknown card shown as folded (grey). */
  muck?: boolean;
}

/** A hand-history mini card (Tile / Tag). Unknown card → the mini back. Copies as text (data-c / data-l). */
export function miniNode(input: CardInput, o: MiniOptions = {}): VNode {
  const card = toCard(input);
  const { shape = "tag" } = o;
  if (card.rank === null && card.suit === null) {
    return h("span", {
      class: cls("pzc", `pzc--${shape}`, "pzb-mini", o.muck && "pzb--muck", o.className),
      "data-c": "??", "data-l": "??", "data-surface": o.surface,
      role: "img", "aria-label": o.muck ? "Folded card" : "Unknown card",
    }, h("span", { class: "ct" }, "??"));
  }
  const text = formatCard(card);
  return h("span", {
    ...base(card, cls(`pzc--${shape}`, o.colour && "pzc--mini-colour"), o),
    "data-c": text,
    "data-l": formatCard(card, { style: "letter" }),
  }, h("b", { class: "rk", "aria-hidden": "true" }, card.rank ?? "?"), suitNode(card.suit, { sprite: o.sprite }), h("span", { class: "ct" }, text));
}

export interface HandOptions extends CardOptions {
  layout?: HandLayout;
  /** Show the backs instead of the faces (an opponent's hidden cards). */
  faceDown?: boolean;
}

/** Hole cards in a layout (spread / tight / fan / fan-tight). */
export function handNode(input: CardsInput, o: HandOptions = {}): VNode {
  const cards = toCards(input);
  const { layout = "spread", width = 56 } = o;
  const kids = cards.map((c) => (o.faceDown ? backNode({ ...o, variant: o.back, width }) : cardNode(c, { ...o, width })));
  return h("span", {
    class: cls("pzh", `pzh--${layout}`, o.className),
    style: `--w:${width}px`,
    role: "group",
    "aria-label": o.faceDown ? `${cards.length} face-down cards` : cardsLabel(cards, o.locale, "Hand"),
  }, kids);
}

/** The board: five places; missing streets are empty slots. */
export function boardNode(input: CardsInput, o: CardOptions & { slots?: number } = {}): VNode {
  const cards = toCards(input);
  const { width = 64, slots = 5 } = o;
  const kids: VNode[] = [];
  for (let i = 0; i < Math.max(slots, cards.length); i++) {
    const c = cards[i];
    kids.push(c ? cardNode(c, { ...o, width }) : h("span", { class: "pzc pzc--slot", "data-surface": o.surface, style: `--w:${width}px`, "aria-hidden": "true" }));
  }
  return h("span", { class: cls("pzbd", o.className), style: `--w:${width}px`, role: "group", "aria-label": cards.length ? cardsLabel(cards, o.locale, "Board") : "Board" }, kids);
}

export type TextMode = "tag" | "tile" | "inline" | "cards";

export interface TextOptions extends CommonOptions, TokenizeOptions {
  /** `tag` (default) / `tile`: minis · `inline`: coloured text (A♠) · `cards`: card faces. */
  mode?: TextMode;
  face?: Face;
  /** Card width for `mode: "cards"` (default 44). */
  width?: number;
  /** Minis in the Split look. */
  colour?: boolean;
}

/** Text with its cards replaced (D-168 notation). */
export function textNodes(text: string, o: TextOptions = {}): Child[] {
  const { mode = "tag" } = o;
  const out: Child[] = [];
  for (const seg of tokenize(text, o)) {
    if (seg.type === "text") {
      out.push(seg.text);
      continue;
    }
    const cards = seg.group.cards;
    if (mode === "inline") {
      cards.forEach((c, i) => {
        if (i) out.push(" ");
        out.push(inlineNode(c, o));
      });
    } else if (mode === "cards") {
      out.push(h("span", { class: "pzcg", role: "group", "aria-label": cardsLabel(cards, o.locale) }, cards.map((c) => cardNode(c, { ...o, width: o.width ?? 44 }))));
    } else {
      cards.forEach((c) => out.push(miniNode(c, { ...o, shape: mode })));
    }
  }
  return out;
}

/** A card as coloured inline text: A♠. */
export function inlineNode(input: CardInput, o: CommonOptions = {}): VNode {
  const card = toCard(input);
  const text = formatCard(card);
  if (card.rank === null && card.suit === null) return h("span", { class: "pzi", "data-s": "x", "data-c": "??", "data-l": "??" }, "??");
  return h("span", {
    class: cls("pzi", o.className), "data-s": suitName(card.suit), "data-deck": o.deck, "data-surface": o.surface,
    "data-c": text, "data-l": cardKey(card), title: cardLabel(card, o.locale),
  }, (card.rank ?? "X") + (card.suit ? SUIT_SYMBOL[card.suit] : "?"));
}
