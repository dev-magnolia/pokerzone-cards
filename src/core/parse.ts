import type { Card, CardInput, CardsInput, Rank, Suit } from "./types.ts";

/*
 * Notation (D-168):
 * - rank: A K Q J T 9…2, also `10`, lower case too; X / ? = unknown rank (only for the unknown card)
 * - suit: s h d c (upper case too), ♠ ♥ ♦ ♣, outlined ♤ ♡ ♢ ♧, emoji variants (U+FE0F); x / X / ? = unknown suit
 * - unknown card: Xx, xx, XX, ??
 * Inside a group the cards may be separated by spaces, commas, semicolons — or nothing (`AsKd`, `10sKd`).
 */

const RANK_SRC = "10|[2-9TJQKAtjqka]|[Xx?]";
const SUIT_SRC = "[shdcSHDCxX?]|[♠♥♦♣♤♡♢♧][\\uFE0E\\uFE0F]?";

/** One card, sticky (used to scan a group). */
const TOKEN_Y = new RegExp(`(${RANK_SRC})(${SUIT_SRC})`, "y");
/** Separators between cards inside a group. */
const SEP_Y = /[\s,;]*/y;

const SUIT_OF: Record<string, Suit> = {
  s: "s", h: "h", d: "d", c: "c", S: "s", H: "h", D: "d", C: "c",
  "♠": "s", "♥": "h", "♦": "d", "♣": "c", "♤": "s", "♡": "h", "♢": "d", "♧": "c",
};

function rankOf(r: string): Rank | null | undefined {
  if (r === "10") return "T";
  if (r === "X" || r === "x" || r === "?") return null;
  const u = r.toUpperCase();
  return "AKQJT98765432".includes(u) && u.length === 1 ? (u as Rank) : undefined;
}

function suitOf(s: string): Suit | null | undefined {
  const base = s.replace(/[︎️]/g, "");
  if (base === "x" || base === "X" || base === "?") return null;
  return SUIT_OF[base];
}

/** Builds a card from a rank and a suit token; `undefined` if the pair is not a card. */
function make(r: string, s: string): Card | undefined {
  const rank = rankOf(r);
  const suit = suitOf(s);
  if (rank === undefined || suit === undefined) return undefined;
  // an unknown rank is only allowed for the unknown card (Xx, ??) or with a known suit (Xs = some spade)
  if (rank === null && r === "?" && s !== "?") return undefined;
  return { rank, suit };
}

/**
 * Parses one card: `parseCard("10h")` → `{ rank: "T", suit: "h" }`; `parseCard("Ax")` → `{ rank: "A", suit: null }`;
 * `parseCard("??")` → `{ rank: null, suit: null }`. Returns `null` when the text is not exactly one card.
 */
export function parseCard(input: string): Card | null {
  const s = input.trim();
  TOKEN_Y.lastIndex = 0;
  const m = TOKEN_Y.exec(s);
  if (!m || m[0].length !== s.length) return null;
  return make(m[1]!, m[2]!) ?? null;
}

/**
 * Parses a group: `"As Kd"`, `"[As, Kd]"`, `"{10sKd}"`, `"A♠ K♦"`. Returns `null` if any part is not a card
 * (so `"[1]"` or `"[sic]"` are not cards). An empty group is `null`.
 */
export function parseCards(input: string): Card[] | null {
  let s = input.trim();
  if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith("{") && s.endsWith("}"))) s = s.slice(1, -1);
  return scanGroup(s);
}

/** Scans the inside of a group; `null` unless it is one or more cards and separators only. */
export function scanGroup(s: string): Card[] | null {
  const out: Card[] = [];
  let i = 0;
  SEP_Y.lastIndex = 0;
  SEP_Y.exec(s);
  i = SEP_Y.lastIndex;
  while (i < s.length) {
    TOKEN_Y.lastIndex = i;
    const m = TOKEN_Y.exec(s);
    if (!m) return null;
    const card = make(m[1]!, m[2]!);
    if (!card) return null;
    out.push(card);
    i = TOKEN_Y.lastIndex;
    SEP_Y.lastIndex = i;
    SEP_Y.exec(s);
    i = SEP_Y.lastIndex;
  }
  return out.length ? out : null;
}

/** A Card or its notation → Card; throws on invalid notation. */
export function toCard(input: CardInput): Card {
  if (typeof input !== "string") return input;
  const c = parseCard(input);
  if (!c) throw new Error(`@pokerzon/cards: not a card: ${JSON.stringify(input)}`);
  return c;
}

/** Cards from an array or a notation string; throws on invalid notation. */
export function toCards(input: CardsInput): Card[] {
  if (typeof input === "string") {
    if (!input.trim()) return [];
    const c = parseCards(input);
    if (!c) throw new Error(`@pokerzon/cards: not a card group: ${JSON.stringify(input)}`);
    return c;
  }
  return input.map(toCard);
}

/** Type guard for Card objects. */
export function isCard(x: unknown): x is Card {
  if (!x || typeof x !== "object") return false;
  const c = x as Record<string, unknown>;
  const rankOk = c.rank === null || (typeof c.rank === "string" && "AKQJT98765432".includes(c.rank) && c.rank.length === 1);
  const suitOk = c.suit === null || c.suit === "s" || c.suit === "h" || c.suit === "d" || c.suit === "c";
  return rankOk && suitOk && "rank" in c && "suit" in c;
}

/** `true` when the text is one card or one group of cards. */
export function isValidNotation(input: string): boolean {
  return parseCards(input) !== null;
}
