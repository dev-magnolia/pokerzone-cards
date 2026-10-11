import type { Card, Rank, Suit } from "./types.ts";

/** Ranks, high to low. */
export const RANKS: readonly Rank[] = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

/** Suits in the default sort order: ♠ ♥ ♦ ♣. */
export const SUITS: readonly Suit[] = ["s", "h", "d", "c"];

/** Unicode suit symbols (text style). */
export const SUIT_SYMBOL: Readonly<Record<Suit, string>> = { s: "♠", h: "♥", d: "♦", c: "♣" };

/** Suit names as used in the design data and in CSS (`data-s`). */
export const SUIT_NAME: Readonly<Record<Suit, "spade" | "heart" | "diamond" | "club">> = {
  s: "spade",
  h: "heart",
  d: "diamond",
  c: "club",
};

/** Text for an unknown suit / unknown card. */
export const UNKNOWN_SUIT = "x";
export const UNKNOWN_CARD_LETTER = "Xx";
export const UNKNOWN_CARD_TEXT = "??";

/** All 52 cards, ranks high to low, suits ♠ ♥ ♦ ♣. */
export function fullDeck(): Card[] {
  const out: Card[] = [];
  for (const rank of RANKS) for (const suit of SUITS) out.push({ rank, suit });
  return out;
}
