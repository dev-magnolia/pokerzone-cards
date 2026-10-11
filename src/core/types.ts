/** Card ranks, high to low. `T` is the ten (input also accepts `10`). */
export type Rank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";

/** Suits: spades, hearts, diamonds, clubs. */
export type Suit = "s" | "h" | "d" | "c";

/**
 * One card. `null` means unknown:
 * - `{ rank: "A", suit: null }` — rank known, suit unknown (`Ax`)
 * - `{ rank: null, suit: null }` — unknown card (`Xx`, `??`)
 */
export interface Card {
  rank: Rank | null;
  suit: Suit | null;
}

/** Which bracket a group used in the source text (`null`: a bare symbol card such as `A♠`). */
export type Bracket = "[" | "{" | null;

/** A run of cards found in text. */
export interface CardGroup {
  cards: Card[];
  bracket: Bracket;
  /** The source text of the group, including brackets. */
  raw: string;
  /** Offsets in the source text (end exclusive). */
  start: number;
  end: number;
}

/** A piece of tokenized text. */
export type Segment = { type: "text"; text: string } | { type: "cards"; group: CardGroup };

/** Four-colour (♠ neutral, ♥ red, ♦ blue, ♣ green — default) or two-colour (♠♣ neutral, ♥♦ red). */
export type Deck = "four" | "two";

/** The surface the card or suit sits on. Cards with a white face (Bold, Soft) always use the light palette. */
export type Surface = "light" | "dark";

/** Card faces: Bold (default), Soft, Split (highlight). */
export type Face = "bold" | "soft" | "split";

/** Hand-history minis: Tile (upright) and Tag (lying). */
export type MiniShape = "tile" | "tag";

/** Card backs: Slogan (default) and Symbol. */
export type BackVariant = "slogan" | "symbol";

/** Hole-card layouts. Tight: 2 cards −55 %, 4–5 cards −50 %. */
export type HandLayout = "spread" | "tight" | "fan" | "fan-tight";

/** Games for `validateHand`. */
export type Game = "holdem" | "omaha" | "omaha5" | "board";

/** Anything the API accepts as a card: a Card or its notation (`"Th"`, `"10h"`, `"T♥"`). */
export type CardInput = Card | string;

/** Several cards: an array, or a notation string (`"As Kd"`, `"[As Kd]"`). */
export type CardsInput = readonly CardInput[] | string;
