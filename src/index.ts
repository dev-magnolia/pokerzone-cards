/**
 * @pokerzon/cards — core (no dependencies): card notation, formatting, helpers, colours, labels.
 * Rendering: `@pokerzon/cards/svg`, `/react`, `/dom`, `/remark`, `/rehype`; styles: `@pokerzon/cards/styles.css`.
 */
export type {
  Rank, Suit, Card, CardGroup, Segment, Bracket, Deck, Surface, Face, MiniShape, BackVariant, HandLayout, Game,
  CardInput, CardsInput,
} from "./core/types.ts";
export type { CardsData, ColourKey, Tones } from "./core/data-types.ts";
export { RANKS, SUITS, SUIT_SYMBOL, SUIT_NAME, UNKNOWN_SUIT, UNKNOWN_CARD_LETTER, UNKNOWN_CARD_TEXT, fullDeck } from "./core/constants.ts";
export { parseCard, parseCards, toCard, toCards, isCard, isValidNotation } from "./core/parse.ts";
export { tokenize, replaceCards, findCardGroups, findCards, type TokenizeOptions } from "./core/tokenize.ts";
export {
  formatCard, formatCards, cardKey, toSymbolText, toLetterText, normalize, normalizeCard, sameCard,
  type FormatOptions, type FormatCardsOptions,
} from "./core/format.ts";
export { findDuplicates, validateHand, splitBoard, streetOf, compareRank, sortCards, GAME_CARDS, type HandError } from "./core/validate.ts";
export { suitColour, suitColourKey, COLOURS, type Tone } from "./core/colours.ts";
export { cardLabel, cardsLabel, type Locale } from "./core/labels.ts";
export const VERSION = "0.2.1";
