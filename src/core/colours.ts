import { COLOUR_DATA } from "../generated/colours.ts";
import { SUIT_NAME } from "./constants.ts";
import type { ColourKey } from "./data-types.ts";
import type { Deck, Suit, Surface } from "./types.ts";

export type Tone = "upper" | "lower" | "solid";

/** The colour family of a suit in a deck: `neutral`, `red`, `blue` or `green`; `unknown` for an unknown suit. */
export function suitColourKey(suit: Suit | null, deck: Deck = "four"): ColourKey | "unknown" {
  if (suit === null) return "unknown";
  return COLOUR_DATA.decks[deck][SUIT_NAME[suit]];
}

/**
 * The approved suit colour (brand guide 12 Cards). `tone`: `upper` / `lower` (the two halves of the Z-cut suit) or
 * `solid` (small suits, ranks). `surface: "light"` is a white card or a light page; `"dark"` a bare suit on a dark
 * page. An unknown suit is grey.
 */
export function suitColour(suit: Suit | null, options: { deck?: Deck; surface?: Surface; tone?: Tone } = {}): string {
  const { deck = "four", surface = "light", tone = "solid" } = options;
  const i = tone === "upper" ? 0 : tone === "lower" ? 1 : 2;
  const key = suitColourKey(suit, deck);
  const tones = key === "unknown" ? COLOUR_DATA.unknown[surface] : surface === "dark" ? COLOUR_DATA.onDark[key] : COLOUR_DATA.onLight[key];
  return tones[i]!;
}

/** All colour data (from the design export). */
export const COLOURS = COLOUR_DATA;
