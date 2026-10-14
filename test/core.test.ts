import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCard, parseCards, tokenize, formatCard, formatCards, toSymbolText, toLetterText, normalize, normalizeCard,
  findDuplicates, validateHand, splitBoard, sortCards, compareRank, fullDeck, suitColour, cardLabel, cardsLabel,
  findCards, isCard, isValidNotation, cardKey, streetOf,
} from "../src/index.ts";

test("parseCard: ranks, 10 and T, lower case", () => {
  assert.deepEqual(parseCard("Th"), { rank: "T", suit: "h" });
  assert.deepEqual(parseCard("10h"), { rank: "T", suit: "h" });
  assert.deepEqual(parseCard("ah"), { rank: "A", suit: "h" });
  assert.deepEqual(parseCard("tD"), { rank: "T", suit: "d" });
  assert.deepEqual(parseCard("2c"), { rank: "2", suit: "c" });
  assert.equal(parseCard("1h"), null);
  assert.equal(parseCard("Zh"), null);
  assert.equal(parseCard("A"), null);
  assert.equal(parseCard("AsK"), null);
});

test("parseCard: symbols, outlined and emoji variants", () => {
  assert.deepEqual(parseCard("A♠"), { rank: "A", suit: "s" });
  assert.deepEqual(parseCard("K♡"), { rank: "K", suit: "h" });
  assert.deepEqual(parseCard("Q♦️"), { rank: "Q", suit: "d" });
  assert.deepEqual(parseCard("10♣"), { rank: "T", suit: "c" });
});

test("parseCard: unknown suit and unknown card", () => {
  assert.deepEqual(parseCard("Ax"), { rank: "A", suit: null });
  assert.deepEqual(parseCard("TX"), { rank: "T", suit: null });
  assert.deepEqual(parseCard("Xx"), { rank: null, suit: null });
  assert.deepEqual(parseCard("xx"), { rank: null, suit: null });
  assert.deepEqual(parseCard("??"), { rank: null, suit: null });
  assert.equal(parseCard("?s"), null);
});

test("parseCards: separators, brackets, glued cards", () => {
  const ak = [{ rank: "A", suit: "s" }, { rank: "K", suit: "d" }];
  assert.deepEqual(parseCards("As Kd"), ak);
  assert.deepEqual(parseCards("[As, Kd]"), ak);
  assert.deepEqual(parseCards("{AsKd}"), ak);
  assert.deepEqual(parseCards("A♠ K♦"), ak);
  assert.deepEqual(parseCards("10sKd"), [{ rank: "T", suit: "s" }, { rank: "K", suit: "d" }]);
  assert.deepEqual(parseCards("[10H, kd]"), [{ rank: "T", suit: "h" }, { rank: "K", suit: "d" }]);
  assert.equal(parseCards("[1]"), null);
  assert.equal(parseCards("[sic]"), null);
  assert.equal(parseCards("[]"), null);
  assert.equal(parseCards("As Kd foo"), null);
  assert.equal(isValidNotation("[As Kd]"), true);
  assert.equal(isValidNotation("[2024]"), false);
});

test("tokenize: [] and {} are equivalent; non-cards stay text", () => {
  const s = tokenize("See [1] and [As Kd] or {Th 7c} — {note}, [sic], [2024].");
  const groups = s.filter((x) => x.type === "cards");
  assert.equal(groups.length, 2);
  assert.equal(s.map((x) => (x.type === "text" ? x.text : `<${x.group.raw}>`)).join(""), "See [1] and <[As Kd]> or <{Th 7c}> — {note}, [sic], [2024].");
  const g = groups[1]!;
  assert.equal(g.type === "cards" && g.group.bracket, "{");
});

test("tokenize: symbol cards anywhere, letter form only in brackets", () => {
  const s = tokenize("As I said, Ad Kc was A♠ K♦ and 10♥.");
  const cards = s.flatMap((x) => (x.type === "cards" ? x.group.cards : []));
  assert.deepEqual(cards.map((c) => cardKey(c)), ["As", "Kd", "Th"]);
  assert.equal(s[0]!.type === "text" && s[0]!.text, "As I said, Ad Kc was ");
});

test("tokenize: escape and offsets", () => {
  const s = tokenize("Literal \\[As Kd] but [Qh]");
  assert.equal(s.map((x) => (x.type === "text" ? x.text : `<${x.group.raw}>`)).join(""), "Literal [As Kd] but <[Qh]>");
  const t = "Board [Ah Kh] then A♠";
  const groups = tokenize(t).flatMap((x) => (x.type === "cards" ? [x.group] : []));
  for (const g of groups) assert.equal(t.slice(g.start, g.end), g.raw);
  assert.deepEqual(findCards("x [Ah Kx] y ??").map((c) => cardKey(c)), ["Ah", "Kx"]);
});

const marked = (text: string) =>
  tokenize(text, { bare: "strict" })
    .map((x) => (x.type === "text" ? x.text : `<${x.group.raw}>`))
    .join("");

test("tokenize bare: strict: plain letter cards outside brackets, as old reports write them", () => {
  // groups of two or more, spaces or commas between (real report text)
  assert.equal(marked("Flop Kc 3c Qd, turn 7h"), "Flop <Kc 3c Qd>, turn <7h>");
  assert.equal(marked("He shows Kd 6s Ad Kh for two pair"), "He shows <Kd 6s Ad Kh> for two pair");
  assert.equal(marked("8d, 7d on 10h 9c 2s"), "<8d, 7d> on <10h 9c 2s>");
  assert.equal(findCards("Board: As Kd", { bare: "strict" }).map((c) => cardKey(c)).join(" "), "As Kd");
  // one card alone too; an As starting a sentence is the word
  assert.equal(marked("the Kd on the turn, then the river Ah"), "the <Kd> on the turn, then the river <Ah>");
  assert.equal(marked("As the chips moved. As soon as the As landed"), "As the chips moved. As soon as the <As> landed");
  assert.equal(marked("Turn As , river Ad Ac"), "Turn <As> , river <Ad Ac>");
});

test("tokenize bare: strict leaves words alone; brackets and symbols still work", () => {
  // lower or wrong case is never bare (4d as …: "as" is a word)
  assert.equal(marked("he checked the 4d as well"), "he checked the <4d> as well");
  assert.equal(marked("KD QH kd qh"), "KD QH kd qh");
  // word boundaries
  assert.equal(marked("he asks; Khac; 2sday; x7d"), "he asks; Khac; 2sday; x7d");
  // brackets must match ([ah} stays text), escape, symbols as before
  assert.equal(marked("[ah} and \\[Kd] and A♠"), "[ah} and [Kd] and <A♠>");
  assert.equal(marked("[Ah Kh] then Qd Jd"), "<[Ah Kh]> then <Qd Jd>");
  // offsets point into the source
  const t = "Flop Kc 3c Qd then A♠ and [Th 9h]";
  for (const s of tokenize(t, { bare: "strict" }))
    if (s.type === "cards") assert.equal(t.slice(s.group.start, s.group.end), s.group.raw);
  // off by default
  assert.equal(tokenize("Flop Kc 3c Qd").length, 1);
});

test("normalize with bare: strict writes the canonical form", () => {
  assert.equal(normalize("Flop Kc 3c Qd, turn 10h", { bare: "strict" }), "Flop [Kc 3c Qd], turn [Th]");
  assert.equal(normalize("Flop Kc 3c Qd"), "Flop Kc 3c Qd");
});

test("format and conversions", () => {
  assert.equal(formatCard("Th"), "T♥");
  assert.equal(formatCard("Th", { ten: "10" }), "10♥");
  assert.equal(formatCard("Th", { style: "letter" }), "Th");
  assert.equal(formatCard("Ax"), "Ax");
  assert.equal(formatCard("??"), "??");
  assert.equal(formatCard("??", { style: "letter" }), "Xx");
  assert.equal(formatCards("As Kd", { wrap: "[" }), "[A♠ K♦]");
  assert.equal(toSymbolText("Flop [As Kd 7c], hero {10h 9h}"), "Flop A♠ K♦ 7♣, hero T♥ 9♥");
  assert.equal(toLetterText("Flop A♠ K♦ and {T♥ 9♥}"), "Flop [As] [Kd] and {Th 9h}");
  assert.equal(normalize("[10H, kd] and {as} and A♠"), "[Th Kd] and {As} and [As]");
  assert.equal(normalizeCard("10h"), "Th");
  assert.equal(normalizeCard("nope"), null);
});

test("helpers: duplicates, hands, board, sort", () => {
  assert.deepEqual(findDuplicates("As Kd As ?? ??").map((c) => cardKey(c)), ["As"]);
  assert.deepEqual(validateHand("As Kd", "holdem"), { ok: true, errors: [] });
  assert.deepEqual(validateHand("As As", "holdem"), { ok: false, errors: ["duplicate"] });
  assert.deepEqual(validateHand("As Kd Qh", "omaha"), { ok: false, errors: ["count"] });
  assert.equal(validateHand("As Kd Qh Jc Tc", "omaha5").ok, true);
  const b = splitBoard("As Kd 7c 2h Qs");
  assert.equal(b.flop.length, 3);
  assert.equal(b.turn && cardKey(b.turn), "2h");
  assert.equal(streetOf(4), "river");
  assert.deepEqual(sortCards("7c Ah Kx As ??").map((c) => cardKey(c)), ["As", "Ah", "Kx", "7c", "Xx"]);
  assert.ok(compareRank({ rank: "A", suit: "s" }, { rank: "K", suit: "s" }) < 0);
  assert.equal(fullDeck().length, 52);
  assert.equal(isCard({ rank: "A", suit: "s" }), true);
  assert.equal(isCard({ rank: "Z", suit: "s" }), false);
});

test("colours and labels", () => {
  assert.equal(suitColour("h"), "#CE0000");
  assert.equal(suitColour("d", { deck: "two" }), "#CE0000");
  assert.equal(suitColour("c", { tone: "upper" }), "#0BB164");
  assert.equal(suitColour("s", { surface: "dark", tone: "upper" }), "#FFFFFF");
  assert.equal(suitColour(null), "#9CA8AB");
  assert.equal(cardLabel("As"), "Ace of spades");
  assert.equal(cardLabel("Tx"), "Ten of unknown suit");
  assert.equal(cardLabel("??"), "Unknown card");
  assert.equal(cardsLabel("As Kd", "en", "Board"), "Board: ace of spades, king of diamonds");
});
