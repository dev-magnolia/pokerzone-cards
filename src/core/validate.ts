import { RANKS, SUITS } from "./constants.ts";
import { sameCard } from "./format.ts";
import { toCards } from "./parse.ts";
import type { Card, CardsInput, Game, Suit } from "./types.ts";

/** Cards that appear more than once (unknown cards are ignored). Each duplicate is listed once. */
export function findDuplicates(input: CardsInput): Card[] {
  const cards = toCards(input);
  const out: Card[] = [];
  cards.forEach((c, i) => {
    if (c.rank === null || c.suit === null) return;
    if (cards.findIndex((d) => sameCard(c, d)) !== i && !out.some((d) => sameCard(c, d))) out.push(c);
  });
  return out;
}

export type HandError = "count" | "duplicate";

/** Card counts per game: Hold'em 2, Omaha 4, 5-card Omaha 5, board 0–5. */
export const GAME_CARDS: Readonly<Record<Game, readonly [min: number, max: number]>> = {
  holdem: [2, 2],
  omaha: [4, 4],
  omaha5: [5, 5],
  board: [0, 5],
};

/** Checks the card count for the game and duplicates. */
export function validateHand(input: CardsInput, game: Game): { ok: boolean; errors: HandError[] } {
  const cards = toCards(input);
  const [min, max] = GAME_CARDS[game];
  const errors: HandError[] = [];
  if (cards.length < min || cards.length > max) errors.push("count");
  if (findDuplicates(cards).length) errors.push("duplicate");
  return { ok: errors.length === 0, errors };
}

/** The board split into streets. */
export function splitBoard(input: CardsInput): { flop: Card[]; turn: Card | null; river: Card | null } {
  const c = toCards(input);
  return { flop: c.slice(0, 3), turn: c[3] ?? null, river: c[4] ?? null };
}

/** Street of a board index: 0–2 flop, 3 turn, 4 river. */
export function streetOf(index: number): "flop" | "turn" | "river" | null {
  return index < 0 ? null : index < 3 ? "flop" : index === 3 ? "turn" : index === 4 ? "river" : null;
}

/** Rank comparison, high first: negative if `a` ranks higher. Unknown ranks sort last. */
export function compareRank(a: Card, b: Card): number {
  const ia = a.rank === null ? 99 : RANKS.indexOf(a.rank);
  const ib = b.rank === null ? 99 : RANKS.indexOf(b.rank);
  return ia - ib;
}

/** Sorts by rank (high first), then suit (default ♠ ♥ ♦ ♣); unknowns last. Returns a new array. */
export function sortCards(input: CardsInput, options: { suitOrder?: readonly Suit[] } = {}): Card[] {
  const order = options.suitOrder ?? SUITS;
  const si = (s: Suit | null) => (s === null ? 99 : order.indexOf(s));
  return [...toCards(input)].sort((a, b) => compareRank(a, b) || si(a.suit) - si(b.suit));
}
