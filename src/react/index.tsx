/**
 * @pokerzon/cards/react — React components (React ≥ 19). Styles: `import "@pokerzon/cards/styles.css"`.
 * The components render the shared markup tree (src/markup), so they look exactly like the HTML / DOM output.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toCards } from "../core/parse.ts";
import type { BackVariant, CardInput, CardsInput, Deck, Face, HandLayout, MiniShape, Surface } from "../core/types.ts";
import type { Locale } from "../core/labels.ts";
import { formatCards } from "../core/format.ts";
import {
  backNode, boardNode, cardNode, handNode, inlineNode, miniNode, spriteNode, textNodes, type TextMode,
} from "../markup/cards.ts";
import { installCopyHandler, type CopyFormat } from "../dom/copy.ts";
import { toReact, toReactList } from "./to-react.tsx";

export type { TextMode, CopyFormat };

/* ── settings ── */

export interface CardsSettings {
  /** Four-colour (default) or two-colour deck — the user's setting. */
  deck: Deck;
  /** Default card face. */
  face: Face;
  /** Surface the cards sit on (Split face and bare suits change on dark). */
  surface: Surface | undefined;
  /** What copying hand-history cards puts on the clipboard: `symbol` (A♠, default) or `letter` (As). */
  copyFormat: CopyFormat;
  locale: Locale;
  /** Suits by `<use>` from a sprite (render `<CardsSprite />` once on the page). */
  sprite: boolean;
}

const DEFAULTS: CardsSettings = { deck: "four", face: "bold", surface: undefined, copyFormat: "symbol", locale: "en", sprite: false };

const Ctx = createContext<{ settings: CardsSettings; set: (p: Partial<CardsSettings>) => void }>({ settings: DEFAULTS, set: () => {} });

export interface CardsProviderProps extends Partial<CardsSettings> {
  children?: ReactNode;
  /** Install the copy handler (copying hand-history cards gives text). Default true. */
  copy?: boolean;
}

/**
 * Settings for every card below. The values are props (controlled); `useCardsSettings().set` changes them locally
 * when the provider is uncontrolled for that key.
 */
export function CardsProvider({ children, copy = true, ...props }: CardsProviderProps) {
  const [local, setLocal] = useState<Partial<CardsSettings>>({});
  const settings = useMemo<CardsSettings>(() => {
    const s = { ...DEFAULTS } as CardsSettings;
    for (const k of Object.keys(DEFAULTS) as (keyof CardsSettings)[]) {
      const v = props[k] ?? local[k];
      if (v !== undefined) (s as unknown as Record<string, unknown>)[k] = v;
    }
    return s;
  }, [props.deck, props.face, props.surface, props.copyFormat, props.locale, props.sprite, local]);
  const set = useCallback((p: Partial<CardsSettings>) => setLocal((x) => ({ ...x, ...p })), []);
  useEffect(() => (copy ? installCopyHandler(() => settings.copyFormat) : undefined), [copy, settings.copyFormat]);
  return <Ctx.Provider value={{ settings, set }}>{children}</Ctx.Provider>;
}

/** The current settings and a setter (e.g. a four-/two-colour toggle). */
export function useCardsSettings() {
  return useContext(Ctx);
}

function useOpts<T extends object>(o: T) {
  const { settings: s } = useContext(Ctx);
  return { deck: s.deck, surface: s.surface, locale: s.locale, sprite: s.sprite, ...stripUndefined(o) } as T & {
    deck: Deck; surface: Surface | undefined; locale: Locale; sprite: boolean;
  };
}
function stripUndefined<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}

/* ── components ── */

export interface CardProps {
  card: CardInput;
  face?: Face;
  /** Width in px (default 64). */
  size?: number;
  deck?: Deck;
  surface?: Surface;
  /** Back for an unknown card. */
  back?: BackVariant;
  className?: string;
}

/** A card face: Bold (default), Soft, Split. `card` is a Card or notation (`"Th"`, `"10h"`, `"T♥"`, `"Ax"`). */
export function Card({ card, face, size, ...rest }: CardProps) {
  const { settings } = useContext(Ctx);
  const o = useOpts({ ...rest, face: face ?? settings.face, width: size });
  return <>{toReact(cardNode(card, o))}</>;
}

export interface CardBackProps {
  variant?: BackVariant;
  muck?: boolean;
  size?: number;
  surface?: Surface;
  className?: string;
}

/** A card back: Slogan (default) or Symbol; `muck` = folded. */
export function CardBack({ size, ...rest }: CardBackProps) {
  const o = useOpts({ ...rest, width: size });
  return <>{toReact(backNode(o))}</>;
}

export interface MiniCardProps {
  card: CardInput;
  shape?: MiniShape;
  /** The Split look (with the Split face). */
  colour?: boolean;
  /** Unknown card shown folded (grey). */
  muck?: boolean;
  deck?: Deck;
  surface?: Surface;
  className?: string;
}

/** A hand-history mini: Tile (upright) or Tag (lying, default). Copies as text. */
export function MiniCard({ card, ...rest }: MiniCardProps) {
  const o = useOpts(rest);
  return <>{toReact(miniNode(card, o))}</>;
}

export interface HandProps {
  cards: CardsInput;
  layout?: HandLayout;
  face?: Face;
  size?: number;
  /** Show the backs (an opponent's hidden cards). */
  faceDown?: boolean;
  back?: BackVariant;
  deck?: Deck;
  surface?: Surface;
  className?: string;
}

/** Hole cards: spread · tight · fan · fan-tight. The overlap and the arc follow the number of cards. */
export function Hand({ cards, face, size, ...rest }: HandProps) {
  const { settings } = useContext(Ctx);
  const o = useOpts({ ...rest, face: face ?? settings.face, width: size });
  return <>{toReact(handNode(cards, o))}</>;
}

export interface BoardProps {
  cards: CardsInput;
  face?: Face;
  size?: number;
  /** Number of places (default 5). */
  slots?: number;
  deck?: Deck;
  surface?: Surface;
  className?: string;
}

/** The board: five places; streets not dealt yet are empty slots. */
export function Board({ cards, face, size, ...rest }: BoardProps) {
  const { settings } = useContext(Ctx);
  const o = useOpts({ ...rest, face: face ?? settings.face, width: size });
  return <>{toReact(boardNode(cards, o))}</>;
}

export interface FlipCardProps {
  card: CardInput;
  /** Face up. */
  open: boolean;
  face?: Face;
  back?: BackVariant;
  size?: number;
  deck?: Deck;
  surface?: Surface;
  className?: string;
  onClick?: () => void;
}

/** A card that turns over (deal, showdown) — 0.45 s, instant with `prefers-reduced-motion`. */
export function FlipCard({ card, open, face, back, size = 64, className, onClick, ...rest }: FlipCardProps) {
  const { settings } = useContext(Ctx);
  const o = useOpts({ ...rest, face: face ?? settings.face, width: size });
  return (
    <span className={`pzflip${open ? " is-open" : ""}${className ? ` ${className}` : ""}`} style={{ ["--w" as string]: `${size}px` }} onClick={onClick}>
      <span className="pzflip-in">
        <span className="pzflip-back">{toReact(backNode({ ...o, variant: back }))}</span>
        <span className="pzflip-face">{toReact(cardNode(card, o))}</span>
      </span>
    </span>
  );
}

export interface CardTextProps {
  /** Text with card notation: `[As Kd]`, `{Th 7c}`, `A♠`, `10♥`, `Ax`, `??`. */
  children: ReactNode;
  /** `tag` (default) · `tile` · `inline` (coloured text) · `cards` (card faces). */
  mode?: TextMode;
  face?: Face;
  /** Card width for `mode="cards"` (default 44). */
  size?: number;
  colour?: boolean;
  /** Read `[…]` / `{…}` groups (default true). */
  brackets?: boolean;
  /** Read bare symbol cards such as `A♠` (default true). */
  symbols?: boolean;
  /** `"strict"`: read plain letter cards outside brackets too (`Kc 3c Qd`, a lone `Kd`) — e.g. old report text. */
  bare?: false | "strict";
  deck?: Deck;
  surface?: Surface;
}

/** Replaces the cards in its text children. Strings are processed; other nodes are kept as they are. */
export function CardText({ children, size, face, ...rest }: CardTextProps) {
  const { settings } = useContext(Ctx);
  const o = useOpts({ ...rest, face: face ?? settings.face, width: size });
  const walk = (c: ReactNode): ReactNode =>
    typeof c === "string" ? toReactList(textNodes(c, o)) : Array.isArray(c) ? c.map((x, i) => <Frag key={i}>{walk(x)}</Frag>) : c;
  return <>{walk(children)}</>;
}
function Frag({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** One card as coloured inline text (A♠). */
export function InlineCard({ card, ...rest }: { card: CardInput; deck?: Deck; surface?: Surface; className?: string }) {
  const o = useOpts(rest);
  return <>{toReact(inlineNode(card, o))}</>;
}

/** The sprite for `sprite: true` — once per page. */
export function CardsSprite() {
  return <>{toReact(spriteNode())}</>;
}

/* ── hooks ── */

/** Copies cards as text (`copyFormat` from the provider unless given): `copy("As Kd")` → "A♠ K♦" / "As Kd". */
export function useCopyHand() {
  const { settings } = useContext(Ctx);
  return useCallback(async (cards: CardsInput, format: CopyFormat = settings.copyFormat) => {
    const text = formatCards(toCards(cards), { style: format });
    await navigator.clipboard.writeText(text);
    return text;
  }, [settings.copyFormat]);
}
