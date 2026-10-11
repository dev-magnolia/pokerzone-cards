import { scanGroup, parseCard } from "./parse.ts";
import type { Bracket, Card, CardGroup, Segment } from "./types.ts";

export interface TokenizeOptions {
  /** Replace `[…]` and `{…}` groups (default `true`). The two are equivalent (D-168). */
  brackets?: boolean;
  /** Replace bare symbol cards such as `A♠`, `10♥`, `t♦` anywhere in the text (default `true`). */
  symbols?: boolean;
}

/*
 * Rules (D-168):
 * - `[As Kd]` and `{As Kd}` are card groups — only if every item is a card, so `[1]`, `[sic]`, `{note}` stay text;
 * - `\[` / `\{` turns the replacement off (the backslash is dropped, the bracket stays);
 * - the letter form (`As`) is only read inside brackets; the symbol form (`A♠`) anywhere;
 * - the brackets must match: `[…]` or `{…}`.
 */
const GROUP = /(\\?)(\[([^\[\]{}\n]{1,120})\]|\{([^\[\]{}\n]{1,120})\})/g;
const SYMBOL_CARD = /(?<![\p{L}\p{N}])(10|[2-9TJQKAtjqka])([♠♥♦♣♤♡♢♧])[︎️]?/gu;

/** Splits text into text and card-group segments. Every renderer builds on this. */
export function tokenize(text: string, options: TokenizeOptions = {}): Segment[] {
  const { brackets = true, symbols = true } = options;
  const out: Segment[] = [];
  let buf = "";
  const pushText = (t: string) => {
    if (!t) return;
    if (symbols) splitSymbols(t, out, (s) => (buf += s), () => flush());
    else buf += t;
  };
  const flush = () => {
    if (buf) out.push({ type: "text", text: buf });
    buf = "";
  };

  let last = 0;
  if (brackets) {
    GROUP.lastIndex = 0;
    for (let m = GROUP.exec(text); m; m = GROUP.exec(text)) {
      const [whole, esc, bracketed, insideSq, insideCu] = m;
      const start = m.index;
      pushText(text.slice(last, start));
      last = start + whole.length;
      if (esc) {
        // escaped: keep the bracket text as it is (without the backslash), never cards
        buf += bracketed;
        continue;
      }
      const inside = insideSq ?? insideCu ?? "";
      const cards = scanGroup(inside);
      if (!cards) {
        pushText(bracketed!);
        continue;
      }
      flush();
      const bracket: Bracket = insideSq !== undefined ? "[" : "{";
      out.push({ type: "cards", group: { cards, bracket, raw: bracketed!, start: start + esc!.length, end: last } });
    }
  }
  pushText(text.slice(last));
  flush();
  fixOffsets(out, text);
  return out;
}

/** Splits a text chunk on bare symbol cards (`A♠`). */
function splitSymbols(t: string, out: Segment[], addText: (s: string) => void, flush: () => void) {
  let last = 0;
  SYMBOL_CARD.lastIndex = 0;
  for (let m = SYMBOL_CARD.exec(t); m; m = SYMBOL_CARD.exec(t)) {
    const card = parseCard(m[1]! + m[2]!);
    if (!card) continue;
    addText(t.slice(last, m.index));
    flush();
    out.push({ type: "cards", group: { cards: [card], bracket: null, raw: m[0], start: -1, end: -1 } });
    last = m.index + m[0].length;
  }
  addText(t.slice(last));
}

/** Bare symbol cards are found inside text chunks; their offsets are filled in here by searching the source. */
function fixOffsets(segs: Segment[], text: string) {
  let pos = 0;
  for (const s of segs) {
    if (s.type === "text") {
      const i = text.indexOf(s.text, pos);
      pos = i >= 0 ? i + s.text.length : pos;
      continue;
    }
    const g = s.group;
    if (g.start < 0) {
      const i = text.indexOf(g.raw, pos);
      g.start = i;
      g.end = i + g.raw.length;
    }
    pos = Math.max(pos, g.end);
  }
}

/** Replaces every card group with the callback's result (text to text). */
export function replaceCards(text: string, fn: (group: CardGroup) => string, options?: TokenizeOptions): string {
  return tokenize(text, options)
    .map((s) => (s.type === "text" ? s.text : fn(s.group)))
    .join("");
}

/** All card groups in a text. */
export function findCardGroups(text: string, options?: TokenizeOptions): CardGroup[] {
  return tokenize(text, options).flatMap((s) => (s.type === "cards" ? [s.group] : []));
}

/** All cards in a text, in order. */
export function findCards(text: string, options?: TokenizeOptions): Card[] {
  return findCardGroups(text, options).flatMap((g) => g.cards);
}
