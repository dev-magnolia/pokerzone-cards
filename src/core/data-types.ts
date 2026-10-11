/** The shape of data/cards.json (exported by the design repo). */
export type Tones = [upper: string, lower: string, solid: string];
export type ColourKey = "neutral" | "red" | "blue" | "green";

export interface CardsData {
  version: string;
  date: string;
  source: string;
  /** The suit box: x, y, width, height (all four suits end on the same line). */
  viewBox: [number, number, number, number];
  suits: Record<"spade" | "heart" | "diamond" | "club", { upper: string; lower: string; solid: string }>;
  /** Unknown suit (`Ax`): a question mark in the suit box, ending on the suit baseline. */
  unknownSuit: string;
  ranks: {
    unitsPerEm: number;
    capHeight: number;
    ascender: number;
    descender: number;
    /** Glyph outlines, y down: the cap top at 0, the baseline at capHeight. */
    glyphs: Record<string, { d: string; advance: number; inkLeft: number; inkRight: number }>;
  };
  colours: {
    onLight: Record<ColourKey, Tones>;
    onDark: Record<ColourKey, Tones>;
    tint: Record<ColourKey, [string, string]>;
    splitNeutralDark: [string, string];
    muck: string;
    unknown: { light: Tones; dark: Tones };
    decks: Record<"four" | "two", Record<"spade" | "heart" | "diamond" | "club", ColourKey>>;
  };
}
