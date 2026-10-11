# @pokerzon/cards

PokerZON playing cards for every surface — pokerzon.com, asiapokerhub.com, PEL, iZY CMS content, embeds and the server:

- **Notation** — read and write cards in text: `[As Kd]`, `{Th 7c}`, `A♠`, `10h` / `Th`, lower case, `x` = unknown suit, `Xx` / `??` = unknown card.
- **Helpers** — parse, format (Symbol text `A♠` / Letter text `As`), normalize, validate hands, sort, split the board, colours, accessible labels.
- **Rendering** — React components, standalone SVG strings (no font needed), HTML strings and Web Components without React, remark / rehype plugins.
- **Design** — the PokerZON card system (brand guide → 12 Cards): Z-cut suits, faces **Bold** / **Soft** / **Split**, minis **Tile** / **Tag**, **Slogan** / **Symbol** backs, four- and two-colour decks.

Plan and decisions: `pokerzon-docs/docs/dev/CARDS-LIBRARY.md` (D-168). Storybook: run `npm run storybook` in `storybook/`.

## Install

```bash
npm install github:dev-magnolia/pokerzone-cards#v0.1.0
```

The build runs on install (`prepare`). React (≥ 19) is an optional peer dependency — only `@pokerzon/cards/react` needs it.

## Entry points

| Import | What | Depends on |
| --- | --- | --- |
| `@pokerzon/cards` | Core: notation, formatting, helpers, colours, labels | nothing |
| `@pokerzon/cards/react` | `Card`, `MiniCard`, `CardBack`, `Hand`, `Board`, `FlipCard`, `CardText`, `InlineCard`, `CardsProvider`, `CardsSprite`, `useCardsSettings`, `useCopyHand` | React ≥ 19 |
| `@pokerzon/cards/svg` | `renderCardSvg`, `renderMiniSvg`, `renderSuitSvg`, `renderBackSvg`, `backFile`; the path data | — |
| `@pokerzon/cards/dom` | `renderToHtml`, `renderCardsIn`, `defineCardElements`, `cardHtml` …, `installCopyHandler` | — |
| `@pokerzon/cards/remark` | remark plugin (Markdown / MDX) | — |
| `@pokerzon/cards/rehype` | rehype plugin (HTML) | — |
| `@pokerzon/cards/styles.css` | Styles + the PokerZON theme (imports `themes/pokerzon.css`; the rank font and the backs are bundled) | — |
| `@pokerzon/cards/backs/*`, `/fonts/*`, `/cards.json` | The back SVGs, the rank font, the design data | — |

## Notation

| Part | Accepted | Canonical |
| --- | --- | --- |
| Rank | `A K Q J T 9 … 2`, **`10`**, lower case (`a k q j t`) | upper case, `T` |
| Suit | `s h d c` (upper case too), `♠ ♥ ♦ ♣`, outlined `♤ ♡ ♢ ♧`, emoji variants (`♥️`) | `s h d c` |
| Unknown suit | `x` / `X` (`Ax`, `tx`) — drawn as a grey card with a question mark (`A?`) | `x` |
| Unknown card | `Xx`, `xx`, `XX`, `??` — drawn as a back | `Xx` |

- Groups: `[As Kd 7c]` and `{As Kd 7c}` mean the same. Separators: spaces, commas, semicolons or none (`AsKd`, `10sKd`).
- A group is replaced only if **every** item is a card: `[1]`, `[sic]`, `{note}`, `[2024]` stay text. `\[` / `\{` turns it off.
- The **symbol form** (`A♠`, `10♥`) is read anywhere; the **letter form** (`As`) only inside brackets (`As`, `Ad`, `Kc` are also English words).
- Canonical form for storage and APIs: `As Kd Th 7c`. Running text shows the symbol form (`A♠`).

## Core

```ts
import { parseCard, parseCards, tokenize, normalize, toSymbolText, toLetterText, validateHand, sortCards, suitColour, cardLabel } from "@pokerzon/cards";

parseCard("10h");                        // { rank: "T", suit: "h" }
parseCard("Ax");                         // { rank: "A", suit: null }  — unknown suit
parseCards("[As, Kd]");                  // [{ rank: "A", suit: "s" }, { rank: "K", suit: "d" }]
parseCards("[sic]");                     // null — not cards
normalize("[10H, kd] and A♠");           // "[Th Kd] and [As]"
toSymbolText("Flop [As Kd 7c]");         // "Flop A♠ K♦ 7♣"
toLetterText("Flop A♠ K♦");              // "Flop [As] [Kd]"
validateHand("As As", "holdem");         // { ok: false, errors: ["duplicate"] }
sortCards("7c Ah As");                   // As Ah 7c
suitColour("d", { deck: "four" });       // "#034DEB"
cardLabel("Tx");                         // "Ten of unknown suit"
tokenize("See [1] and [As Kd]");         // [text "See [1] and ", cards [As Kd]]
```

| Function | Returns | Note |
| --- | --- | --- |
| `parseCard(s)` · `parseCards(s)` | `Card \| null` · `Card[] \| null` | Any accepted form; `null` if not a card / not all cards. |
| `toCard(x)` · `toCards(x)` | `Card` · `Card[]` | Card or notation in; throws on invalid notation. |
| `tokenize(text, { brackets, symbols })` | `Segment[]` | Text and card-group segments — every renderer builds on it. |
| `replaceCards(text, fn)` · `findCardGroups` · `findCards` | `string` · `CardGroup[]` · `Card[]` | Text-level helpers. |
| `formatCard(c, { style, ten })` · `formatCards(cs, { wrap, separator })` | `string` | `A♠` / `As`; `ten: "10"`; `wrap: "["`. |
| `toSymbolText` · `toLetterText` · `normalize` · `normalizeCard` · `cardKey` | `string` | Whole-text conversions; canonical keys. |
| `findDuplicates` · `validateHand(cs, game)` · `splitBoard` · `streetOf` | — | Games: `holdem` 2, `omaha` 4, `omaha5` 5, `board` 0–5. |
| `sortCards` · `compareRank` · `RANKS` · `SUITS` · `fullDeck()` | — | Rank high → low, then ♠ ♥ ♦ ♣. |
| `suitColour(suit, { deck, surface, tone })` · `COLOURS` | `string` | The approved colours; unknown suit → grey. |
| `cardLabel(c)` · `cardsLabel(cs, locale, prefix)` | `string` | Accessible names (`en`; more locales planned). |

## React

```tsx
import "@pokerzon/cards/styles.css";
import { CardsProvider, Card, MiniCard, CardBack, Hand, Board, FlipCard, CardText } from "@pokerzon/cards/react";

<CardsProvider deck="four" face="bold" copyFormat="symbol">
  <Card card="10h" />                          {/* Bold (default) · face="soft" · face="split" · size={64} */}
  <Hand cards="As Kd Jh Tc" layout="fan" />    {/* spread · tight · fan · fan-tight; faceDown for backs */}
  <Board cards="As Kd 7c" />                   {/* missing streets are empty slots */}
  <CardBack variant="slogan" muck />
  <FlipCard card="Qh" open={revealed} />
  <CardText mode="tag">Villain shows [Ah Kx] on {"{Th 7c 2d}"}</CardText>  {/* tag · tile · inline · cards */}
</CardsProvider>
```

- `CardsProvider`: `deck` (the user's four-/two-colour setting), `face`, `surface`, `copyFormat` (`symbol` / `letter`), `locale`, `sprite`; it installs the copy handler (selected cards are copied as text).
- `useCardsSettings()` reads / changes the settings; `useCopyHand()` copies cards as text.
- The components render plain markup + CSS (no CSS-in-JS) and work in Server Components; `FlipCard` and the provider are interactive.
- Many cards on one page: `<CardsProvider sprite>` + `<CardsSprite />` once — the suits are drawn with `<use>`.

## SVG strings

```ts
import { renderCardSvg, renderMiniSvg, renderSuitSvg, renderBackSvg } from "@pokerzon/cards/svg";

renderCardSvg("Ah", { face: "bold", width: 128 });      // standalone <svg> — ranks are outlines, no font needed
renderMiniSvg("Qd", { shape: "tag", colour: true });
renderBackSvg({ variant: "slogan", baseUrl: "https://…/backs" });  // backs are large files: referenced, not inlined
```

## Without React

```ts
import { renderToHtml, renderCardsIn, defineCardElements, installCopyHandler } from "@pokerzon/cards/dom";

renderToHtml("Flop [As Kd 7c]", { mode: "tag" });   // HTML string (server side too)
renderCardsIn(document.querySelector("article"));   // replaces cards in existing text (skips code, pre, a, [data-no-cards])
defineCardElements();                               // <pz-card card="Th">, <pz-mini>, <pz-hand>, <pz-board>, <pz-back>, <pz-text>
installCopyHandler("symbol");
```

## Markdown and HTML

```ts
import remarkPzCards from "@pokerzon/cards/remark";
import rehypePzCards from "@pokerzon/cards/rehype";

unified().use(remarkParse).use(remarkPzCards, { mode: "tag" }).use(remarkRehype, { allowDangerousHtml: true }).use(rehypeRaw)…
unified().use(rehypeParse, { fragment: true }).use(rehypePzCards).use(rehypeStringify)…
remarkPzCards({ output: "text" });                  // plain symbol text (RSS, meta description, push)
```

Code (inline and blocks), links and `[data-no-cards]` are never touched.

## Styles and themes

`@pokerzon/cards/styles.css` imports `themes/pokerzon.css` (colour tokens). `[data-deck="two"]` on a card or any ancestor switches to the two-colour deck; `.pz-dark` on an ancestor (or `surface="dark"`) adjusts the Split face and the edges. Other brands (asiapokerhub, later) override the tokens.

## Development

```bash
npm install
npm test            # node:test via tsx — notation edge cases, rendering
npm run typecheck
npm run build       # dist/
cd storybook && npm install && npm run storybook
```

- `data/cards.json` comes from the design repo: `pokerzon-docs design/pokerzon/cards/source/build_cards.py` → `cards/lib/cards.json`; `npm run gen` writes `src/generated/*` and `styles/themes/pokerzon.css`. The backs (`backs/`) are copied from `design/pokerzon/cards/svg/backs/`.
- All markup comes from one tree (`src/markup`): React, HTML strings, hast and the Web Components draw exactly the same cards.

## Release

Test → version in `package.json` (semver) → commit → tag (`git tag v0.1.0`) → push with the tag. Projects reference the tag.

## License

Code: MIT. The rank font is a subset of Outfit (SIL Open Font License 1.1, `fonts/OFL-outfit.txt`). The suit shapes, the card designs and the backs are part of the PokerZON brand — see `NOTICE`.
