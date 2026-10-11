import { toCard, toCards } from "./parse.ts";
import type { CardInput, CardsInput, Rank, Suit } from "./types.ts";

/** Accessible names. Only `en` for now; more locales (hu, ja, ko, zh, es) are planned. */
export type Locale = "en";

const RANK_NAME: Record<Locale, Record<Rank, string>> = {
  en: { A: "ace", K: "king", Q: "queen", J: "jack", T: "ten", "9": "nine", "8": "eight", "7": "seven", "6": "six", "5": "five", "4": "four", "3": "three", "2": "two" },
};
const SUIT_LABEL: Record<Locale, Record<Suit, string>> = {
  en: { s: "spades", h: "hearts", d: "diamonds", c: "clubs" },
};
const TEXT: Record<Locale, { unknownCard: string; unknownSuit: string; unknownRank: string; of: string; and: string }> = {
  en: { unknownCard: "unknown card", unknownSuit: "unknown suit", unknownRank: "unknown rank", of: "of", and: "," },
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** `"Ace of spades"`, `"Ten of unknown suit"`, `"Unknown card"`. */
export function cardLabel(input: CardInput, locale: Locale = "en"): string {
  const c = toCard(input);
  const t = TEXT[locale];
  if (c.rank === null && c.suit === null) return cap(t.unknownCard);
  const r = c.rank === null ? t.unknownRank : RANK_NAME[locale][c.rank];
  const s = c.suit === null ? t.unknownSuit : SUIT_LABEL[locale][c.suit];
  return cap(`${r} ${t.of} ${s}`);
}

/** `"Ace of spades, king of diamonds"` — optionally with a prefix: `"Board: …"`. */
export function cardsLabel(input: CardsInput, locale: Locale = "en", prefix?: string): string {
  const body = toCards(input)
    .map((c, i) => (i === 0 ? cardLabel(c, locale) : cardLabel(c, locale).toLowerCase()))
    .join(`${TEXT[locale].and} `);
  return prefix ? `${prefix}: ${body.charAt(0).toLowerCase()}${body.slice(1)}` : body;
}
