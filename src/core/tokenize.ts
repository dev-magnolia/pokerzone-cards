import { scanGroup, parseCard } from "./parse.ts";
import type { Bracket, Card, CardGroup, Segment } from "./types.ts";

export interface TokenizeOptions {
  /** Replace `[…]` and `{…}` groups (default `true`). The two are equivalent (D-168). */
  brackets?: boolean;
  /** Replace bare symbol cards such as `A♠`, `10♥`, `t♦` anywhere in the text (default `true`). */
  symbols?: boolean;
  /**
   * Read the letter form outside brackets (default `false`: never, an `As` may be a word). `"strict"` reads it as
   * plain report text writes it (`Kc 3c Qd`, `the Kd on the turn`) and still leaves words alone:
   * - strict case only: the rank upper case or a digit (`2–9`, `10`, `T J Q K A`), the suit lower case (`s h d c`) —
   *   `as`, `ah`, `KD` stay text;
   * - two or more cards in a row, separated by spaces or commas, are a group;
   * - one card alone too (`the Kd on the turn`, `river Ah`) — except an `As` that starts a sentence (`As the
   *   chips…`): there it is the word;
   * - word boundaries: no letter or digit right before or after (`asks`, `Khac` stay text).
   */
  bare?: false | "strict";
}

/*
 * Rules (D-168):
 * - `[As Kd]` and `{As Kd}` are card groups — only if every item is a card, so `[1]`, `[sic]`, `{note}` stay text;
 * - `\[` / `\{` turns the replacement off (the backslash is dropped, the bracket stays);
 * - the letter form (`As`) is only read inside brackets — or, with `bare: "strict"`, in strict case outside them;
 *   the symbol form (`A♠`) anywhere;
 * - the brackets must match: `[…]` or `{…}`.
 */
const GROUP = /(\\?)(\[([^\[\]{}\n]{1,120})\]|\{([^\[\]{}\n]{1,120})\})/g;
const SYMBOL_CARD = /(?<![\p{L}\p{N}])(10|[2-9TJQKAtjqka])([♠♥♦♣♤♡♢♧])[︎️]?/gu;
/** `bare: "strict"`: letter cards in strict case, one or more in a row (spaces / commas between), word-bounded. */
const BARE_CARD = "(?:10|[2-9TJQKA])[shdc]";
const BARE_GROUP = new RegExp(
  `(?<![\\p{L}\\p{N}\\\\])${BARE_CARD}(?:(?:[ \\t]*,[ \\t]*|[ \\t]+)${BARE_CARD})*(?![\\p{L}\\p{N}])`,
  "gu"
);

/** Splits text into text and card-group segments. Every renderer builds on this. */
export function tokenize(text: string, options: TokenizeOptions = {}): Segment[] {
  const { brackets = true, symbols = true, bare = false } = options;
  const out: Segment[] = [];
  let buf = "";
  const pushPlain = (t: string) => {
    if (!t) return;
    if (symbols) splitSymbols(t, out, (s) => (buf += s), () => flush());
    else buf += t;
  };
  const pushText = (t: string) => {
    if (!t) return;
    if (bare === "strict") splitBare(t, out, pushPlain, () => flush());
    else pushPlain(t);
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

/** Splits a text chunk on bare letter cards (`bare: "strict"`); the text between goes on to the symbol split. */
function splitBare(t: string, out: Segment[], addText: (s: string) => void, flush: () => void) {
  let last = 0;
  BARE_GROUP.lastIndex = 0;
  for (let m = BARE_GROUP.exec(t); m; m = BARE_GROUP.exec(t)) {
    const cards = scanGroup(m[0]);
    if (!cards || (m[0] === "As" && startsSentence(t, m.index))) continue;
    addText(t.slice(last, m.index));
    flush();
    out.push({ type: "cards", group: { cards, bracket: null, raw: m[0], start: -1, end: -1 } });
    last = m.index + m[0].length;
  }
  addText(t.slice(last));
}

/** Nothing but spaces before `at`, or the end of a sentence (`.`, `!`, `?`, `:`, `;`), a quote, `(` or `/`. */
function startsSentence(t: string, at: number): boolean {
  const before = t.slice(0, at).trimEnd();
  return before === "" || /[.!?:;"'“‘(\/]$/.test(before);
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
