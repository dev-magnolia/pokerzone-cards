/**
 * @pokerzon/cards/svg — standalone SVG strings (OG images, e-mail, PNG export, server). Ranks are outlines
 * (Outfit 700), so the result needs no font. The geometry follows styles/cards.css.
 */
import { COLOUR_DATA } from "../generated/colours.ts";
import { RANK_GLYPHS, SUIT_PATHS, UNKNOWN_SUIT_PATH, VIEWBOX } from "../generated/shapes.ts";
import { SUIT_NAME } from "../core/constants.ts";
import { UNKNOWN_LIFT } from "../markup/cards.ts";
import { cardLabel } from "../core/labels.ts";
import { toCard } from "../core/parse.ts";
import type { BackVariant, CardInput, Deck, Face, MiniShape, Suit, Surface } from "../core/types.ts";
import type { Tones } from "../core/data-types.ts";

export { SUIT_PATHS, RANK_GLYPHS, UNKNOWN_SUIT_PATH, VIEWBOX };

const AR = VIEWBOX[2] / VIEWBOX[3];
const G = RANK_GLYPHS;
const n = (x: number) => +x.toFixed(2);
let uid = 0;

function tones(suit: Suit | null, deck: Deck, surface: Surface, white = true): Tones {
  if (suit === null) return COLOUR_DATA.unknown[white ? "light" : surface];
  const key = COLOUR_DATA.decks[deck][SUIT_NAME[suit]];
  return white || surface === "light" ? COLOUR_DATA.onLight[key] : COLOUR_DATA.onDark[key];
}

/** The rank outline at font size `f`, with the cap top at (x, y). */
function rankPath(rank: string, x: number, y: number, f: number, fill: string): string {
  const g = G.glyphs[rank];
  if (!g) return "";
  return `<path transform="translate(${n(x)} ${n(y)}) scale(${+(f / G.unitsPerEm).toFixed(5)})" d="${g.d}" fill="${fill}"/>`;
}
const advance = (rank: string, f: number) => ((G.glyphs[rank]?.advance ?? 600) * f) / G.unitsPerEm;
/** Cap top inside a CSS line box of line-height `lh` (em) whose top is `top`. */
const capTop = (top: number, f: number, lh: number) => {
  const asc = G.ascender / G.unitsPerEm, desc = -G.descender / G.unitsPerEm, cap = G.capHeight / G.unitsPerEm;
  return top + (lh - asc - desc) * f / 2 + asc * f - cap * f;
};

/** A suit placed in a box of height `h` at (x, y). `cut`: [upper, lower] colours; else a solid colour. */
function suitAt(suit: Suit | null, x: number, y: number, h: number, colours: [string, string] | string): string {
  const k = h / VIEWBOX[3];
  const t = `translate(${n(x)} ${n(y)}) scale(${+k.toFixed(5)}) translate(${-VIEWBOX[0]} ${-VIEWBOX[1]})`;
  if (suit === null) {
    const c = Array.isArray(colours) ? colours[1] : colours;
    const lift = Array.isArray(colours) ? ` transform="${UNKNOWN_LIFT}"` : "";
    return `<g transform="${t}"><path d="${UNKNOWN_SUIT_PATH}" fill="${c}"${lift}/></g>`;
  }
  const p = SUIT_PATHS[SUIT_NAME[suit]];
  return Array.isArray(colours)
    ? `<g transform="${t}"><path d="${p.upper}" fill="${colours[0]}"/><path d="${p.lower}" fill="${colours[1]}"/></g>`
    : `<g transform="${t}"><path d="${p.solid}" fill="${colours}"/></g>`;
}

export interface CardSvgOptions {
  face?: Face;
  width?: number;
  deck?: Deck;
  /** For the Split face (the neutral suit is lighter on dark). Bold and Soft are white cards. */
  surface?: Surface;
  /** Draw the 1 px edge (default true). */
  edge?: boolean;
}

/** A card face as a standalone SVG string. An unknown card (`Xx`) is not drawn here — use `renderBackSvg`. */
export function renderCardSvg(input: CardInput, o: CardSvgOptions = {}): string {
  const card = toCard(input);
  const { face = "bold", width: W = 64, deck = "four", surface = "light", edge = true } = o;
  const H = W * 1.4, R = W * 0.1;
  const id = `pzclip${++uid}`;
  const rank = card.rank ?? "?";
  const [u, l, solid] = tones(card.suit, deck, surface, face !== "split");
  let body = "";
  let bg = "#FFFFFF";
  const left = W * 0.09, top = H * 0.07;
  if (face === "bold") {
    const f = W * 0.56;
    body += rankPath(rank, left, capTop(top, f, 0.8), f, solid);
    const bh = W, bw = bh * AR;
    body += suitAt(card.suit, W + 0.15 * bw - bw, H + 0.1 * W - bh, bh, [u, l]);
  } else if (face === "soft") {
    const f = W * 0.52, sw = W * 0.24 * AR, adv = advance(rank, f), cw = Math.max(adv, sw);
    const [tu, tl] = card.suit === null ? [u, l] : COLOUR_DATA.tint[COLOUR_DATA.decks[deck][SUIT_NAME[card.suit]]];
    const bh = W * 0.86, bw = bh * AR;
    body += suitAt(card.suit, W + 0.17 * bw - bw, H + 0.07 * bh - bh, bh, [tu, tl]);
    body += rankPath(rank, left + (cw - adv) / 2, capTop(top, f, 0.8), f, solid);
    body += suitAt(card.suit, left + (cw - sw) / 2, top + 0.8 * f + 0.05 * W, W * 0.24, solid);
  } else {
    let [fu, fl] = [u, l];
    if (surface === "dark" && card.suit !== null && COLOUR_DATA.decks[deck][SUIT_NAME[card.suit]] === "neutral") [fu, fl] = COLOUR_DATA.splitNeutralDark;
    bg = surface === "dark" ? "#0D1112" : "#FFFFFF";
    body += `<polygon points="0,0 ${n(W)},0 ${n(W)},${n(H * 0.5)} 0,${n(H * 0.41875)}" fill="${fu}"/>`;
    body += `<polygon points="0,${n(H * 0.45125)} ${n(W)},${n(H * 0.55)} ${n(W)},${n(H)} 0,${n(H)}" fill="${fl}"/>`;
    const f = W * 0.52;
    body += rankPath(rank, left, capTop(top, f, 0.8), f, "#FFFFFF");
    const bh = W * 0.46, bw = bh * AR;
    body += suitAt(card.suit, W - 0.08 * W - bw, H - 0.06 * H - bh, bh, "#FFFFFF");
  }
  const edgeRect = edge && face !== "split" ? `<rect x="0.5" y="0.5" width="${n(W - 1)}" height="${n(H - 1)}" rx="${n(R - 0.5)}" fill="none" stroke="#E3E7E8"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n(W)}" height="${n(H)}" viewBox="0 0 ${n(W)} ${n(H)}" role="img" aria-label="${cardLabel(card)}">` +
    `<defs><clipPath id="${id}"><rect width="${n(W)}" height="${n(H)}" rx="${n(R)}"/></clipPath></defs>` +
    `<g clip-path="url(#${id})"><rect width="${n(W)}" height="${n(H)}" fill="${bg}"/>${body}</g>${edgeRect}</svg>`;
}

export interface MiniSvgOptions {
  shape?: MiniShape;
  /** The Split look (coloured card, white rank and suit). */
  colour?: boolean;
  deck?: Deck;
  surface?: Surface;
}

/** A hand-history mini card as a standalone SVG string. */
export function renderMiniSvg(input: CardInput, o: MiniSvgOptions = {}): string {
  const card = toCard(input);
  const { shape = "tag", colour = false, deck = "four", surface = "light" } = o;
  const W = shape === "tile" ? 26 : 36, H = shape === "tile" ? 34 : 24;
  const rank = card.rank ?? "?";
  let [, l, solid] = tones(card.suit, deck, surface, true);
  if (colour && surface === "dark" && card.suit !== null && COLOUR_DATA.decks[deck][SUIT_NAME[card.suit]] === "neutral") l = COLOUR_DATA.splitNeutralDark[1];
  const fg = colour ? "#FFFFFF" : solid;
  const bg = colour ? l : "#FFFFFF";
  let body = "";
  if (shape === "tile") {
    const f = 14, sh = 11, total = 0.85 * f + 1 + sh, y0 = (H - total) / 2, adv = advance(rank, f);
    body += rankPath(rank, (W - adv) / 2, capTop(y0, f, 0.85), f, fg);
    body += suitAt(card.suit, (W - sh * AR) / 2, y0 + 0.85 * f + 1, sh, fg);
  } else {
    const f = 15, sh = 12, adv = advance(rank, f), total = adv + 2 + sh * AR, x0 = (W - total) / 2;
    body += rankPath(rank, x0, capTop((H - f) / 2, f, 1), f, fg);
    body += suitAt(card.suit, x0 + adv + 2, (H - sh) / 2, sh, fg);
  }
  const edge = colour ? "" : `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="3.5" fill="none" stroke="#E3E7E8"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${cardLabel(card)}">` +
    `<rect width="${W}" height="${H}" rx="4" fill="${bg}"/>${body}${edge}</svg>`;
}

/** File name of a back in the package (`@pokerzon/cards/backs/…`). */
export function backFile(o: { variant?: BackVariant; muck?: boolean; mini?: MiniShape } = {}): string {
  const { variant = "slogan", muck = false, mini } = o;
  return mini ? `back-mini-${mini}${muck ? "-muck" : ""}.svg` : `back-${variant}${muck ? "-muck" : ""}.svg`;
}

/**
 * A card back as an SVG string that references the back file (`baseUrl` + file name). The backs are large
 * (60–110 KB), so they are not inlined; host the package's `backs/` folder (or use a CDN) and pass its URL.
 */
export function renderBackSvg(o: { variant?: BackVariant; muck?: boolean; width?: number; baseUrl: string }): string {
  const { width: W = 64 } = o;
  const H = W * 1.4, R = W * 0.1, id = `pzclip${++uid}`;
  const href = o.baseUrl.replace(/\/?$/, "/") + backFile(o);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${n(W)}" height="${n(H)}" viewBox="0 0 ${n(W)} ${n(H)}" role="img" aria-label="${o.muck ? "Folded card" : "Face-down card"}">` +
    `<defs><clipPath id="${id}"><rect width="${n(W)}" height="${n(H)}" rx="${n(R)}"/></clipPath></defs>` +
    `<image href="${href}" xlink:href="${href}" width="${n(W)}" height="${n(H)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/></svg>`;
}

/** One suit as a standalone SVG string (`cut`: the two-part Z-cut suit; colours from the deck and surface). */
export function renderSuitSvg(suit: Suit | null, o: { cut?: boolean; size?: number; deck?: Deck; surface?: Surface; colour?: string } = {}): string {
  const { cut = true, size = 32, deck = "four", surface = "light" } = o;
  const [u, l, solid] = tones(suit, deck, surface, false);
  const w = n(size * AR);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${size}" viewBox="0 0 ${w} ${size}">` +
    suitAt(suit, 0, 0, size, o.colour ?? (cut ? [u, l] : solid)) + `</svg>`;
}
