import { SUIT_SYMBOL, UNKNOWN_CARD_LETTER, UNKNOWN_CARD_TEXT, UNKNOWN_SUIT } from "./constants.ts";
import { toCard, toCards } from "./parse.ts";
import { replaceCards, type TokenizeOptions } from "./tokenize.ts";
import type { Bracket, Card, CardInput, CardsInput } from "./types.ts";

export interface FormatOptions {
  /** `symbol`: A♠ (Symbol text, default) · `letter`: As (Letter text). */
  style?: "symbol" | "letter";
  /** How to write the ten: `T` (default) or `10`. */
  ten?: "T" | "10";
  /** Unknown suit (default `x`). */
  unknownSuit?: string;
  /** Unknown card (default `??` for symbol, `Xx` for letter). */
  unknownCard?: string;
}

export interface FormatCardsOptions extends FormatOptions {
  /** Separator between cards (default a space). */
  separator?: string;
  /** Wrap the group in brackets (default none). */
  wrap?: "[" | "{" | false;
}

/** One card as text: `formatCard("Th")` → `T♥`; `{ style: "letter" }` → `Th`; `{ ten: "10" }` → `10♥`. */
export function formatCard(input: CardInput, options: FormatOptions = {}): string {
  const { style = "symbol", ten = "T", unknownSuit = UNKNOWN_SUIT } = options;
  const card = toCard(input);
  if (card.rank === null && card.suit === null) return options.unknownCard ?? (style === "letter" ? UNKNOWN_CARD_LETTER : UNKNOWN_CARD_TEXT);
  const rank = card.rank === null ? "X" : card.rank === "T" && ten === "10" ? "10" : card.rank;
  const suit = card.suit === null ? unknownSuit : style === "letter" ? card.suit : SUIT_SYMBOL[card.suit];
  return rank + suit;
}

/** Several cards as text: `formatCards("As Kd")` → `A♠ K♦`; `{ wrap: "[", style: "letter" }` → `[As Kd]`. */
export function formatCards(input: CardsInput, options: FormatCardsOptions = {}): string {
  const { separator = " ", wrap = false } = options;
  const body = toCards(input).map((c) => formatCard(c, options)).join(separator);
  if (!wrap) return body;
  return wrap === "[" ? `[${body}]` : `{${body}}`;
}

/** The canonical key of a card: `Th`, `Ax`, `Xx`. */
export function cardKey(input: CardInput): string {
  return formatCard(input, { style: "letter", ten: "T", unknownCard: UNKNOWN_CARD_LETTER });
}

/** Every card in the text written in the symbol form, without brackets: `"Flop [As Kd 7c]"` → `"Flop A♠ K♦ 7♣"`. */
export function toSymbolText(text: string, options: Omit<FormatCardsOptions, "style"> & TokenizeOptions = {}): string {
  return replaceCards(text, (g) => formatCards(g.cards, { ...options, style: "symbol" }), options);
}

/**
 * Every card in the text written in the letter form (Letter text). Groups keep their brackets by default so the
 * result stays machine-readable: `"Flop A♠ K♦"` → `"Flop [As] [Kd]"`, `"{Th 7c}"` → `"{Th 7c}"`.
 */
export function toLetterText(text: string, options: Omit<FormatCardsOptions, "style"> & TokenizeOptions & { keepBrackets?: boolean } = {}): string {
  const keep = options.keepBrackets ?? true;
  return replaceCards(text, (g) => formatCards(g.cards, { ...options, style: "letter", wrap: keep ? (g.bracket ?? "[") : false }), options);
}

/**
 * The canonical form for storage and APIs (D-168): letter notation, `T`, single spaces, the source bracket kept
 * (a bare symbol card gets `[…]`): `"[10H, kd]"` → `"[Th Kd]"`, `"A♠"` → `"[As]"`.
 */
export function normalize(text: string): string {
  return replaceCards(text, (g) => formatCards(g.cards, { style: "letter", wrap: (g.bracket ?? "[") as Exclude<Bracket, null> }));
}

/** Normalizes one card notation: `"10h"` → `"Th"`; `null` if it is not a card. */
export function normalizeCard(input: string): string | null {
  try {
    return cardKey(input);
  } catch {
    return null;
  }
}

/** Equality by value. Unknown cards are never equal to anything. */
export function sameCard(a: Card, b: Card): boolean {
  return a.rank !== null && a.suit !== null && a.rank === b.rank && a.suit === b.suit;
}
