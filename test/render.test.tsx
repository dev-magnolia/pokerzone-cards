import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { renderCardSvg, renderMiniSvg, renderBackSvg, renderSuitSvg, backFile } from "../src/svg/index.ts";
import { cardHtml, miniHtml, handHtml, boardHtml, renderToHtml, backHtml, inlineHtml } from "../src/dom/index.ts";
import { Card, CardBack, MiniCard, Hand, Board, CardText, CardsProvider, FlipCard } from "../src/react/index.tsx";
import remarkPzCards from "../src/plugins/remark.ts";
import rehypePzCards from "../src/plugins/rehype.ts";

test("svg: card faces, minis, backs, suits", () => {
  for (const face of ["bold", "soft", "split"] as const) {
    const s = renderCardSvg("Th", { face, width: 96 });
    assert.match(s, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="96" height="134.4"/);
    assert.match(s, /aria-label="Ten of hearts"/);
    assert.ok(!/NaN|undefined/.test(s), face);
  }
  assert.match(renderCardSvg("Ax", { face: "bold" }), /<path d="M45\.36 67\.26/);
  assert.ok(!/dasharray/.test(cardHtml("Ax")));
  assert.match(inlineHtml("Kx"), />K\?<\/span>$/);
  assert.match(renderCardSvg("Ac", { face: "split", surface: "dark", deck: "two" }), /#4A5357/);
  assert.match(renderMiniSvg("Qd", { shape: "tile" }), /width="26" height="34"/);
  assert.match(renderMiniSvg("Qd", { shape: "tag", colour: true }), /fill="#004EB6"/);
  assert.match(renderBackSvg({ baseUrl: "/cards/backs", muck: true }), /href="\/cards\/backs\/back-slogan-muck.svg"/);
  assert.equal(backFile({ mini: "tile" }), "back-mini-tile.svg");
  assert.match(renderSuitSvg("s", { size: 32 }), /#3E4649/);
});

test("html: the shared markup", () => {
  const c = cardHtml("10h", { face: "bold", width: 64 });
  assert.match(c, /^<span class="pzc pzc--bold" data-s="heart" style="--w:64px" role="img" aria-label="Ten of hearts"><b class="rk">T<\/b><svg class="big"/);
  assert.match(miniHtml("As", { shape: "tag" }), /data-c="A♠" data-l="As"/);
  assert.match(miniHtml("??", { shape: "tile", muck: true }), /pzb-mini pzb--muck/);
  assert.match(cardHtml("Xx"), /pzb pzb--slogan/);
  assert.match(backHtml({ variant: "symbol", muck: true }), /pzb--symbol pzb--muck/);
  assert.match(handHtml("As Kd Jh Tc", { layout: "fan" }), /pzh pzh--fan/);
  assert.equal((boardHtml("As Kd 7c").match(/pzc--slot/g) ?? []).length, 2);
  assert.match(inlineHtml("Th"), /class="pzi" data-s="heart"/);
  const t = renderToHtml("Flop [As Kd 7c] & <b>");
  assert.match(t, /^Flop <span class="pzc pzc--tag"/);
  assert.match(t, /&amp; &lt;b&gt;$/);
  assert.match(cardHtml("As", { deck: "two", surface: "dark" }), /data-deck="two" data-surface="dark"/);
});

test("react: components render the same markup", () => {
  const html = renderToStaticMarkup(
    <CardsProvider deck="two" copy={false}>
      <Card card="Th" />
      <CardBack muck />
      <MiniCard card="As" shape="tile" />
      <Hand cards="As Kd" layout="tight" />
      <Board cards={["As", "Kd", "7c"]} />
      <FlipCard card="Qh" open />
      <CardText>Villain shows [Ah Kx] on {"{Th 7c 2d}"}</CardText>
    </CardsProvider>,
  );
  assert.match(html, /class="pzc pzc--bold" data-s="heart" data-deck="two" style="--w:64px"/);
  assert.match(html, /pzb--slogan pzb--muck/);
  assert.match(html, /pzh pzh--tight/);
  assert.match(html, /pzflip is-open/);
  assert.match(html, /aria-label="King of unknown suit"/);
  assert.equal((html.match(/pzc--tag/g) ?? []).length, 5);
  const inline = renderToStaticMarkup(<CardText mode="inline">Board A♠ K♦</CardText>);
  assert.match(inline, /<span class="pzi" data-s="spade"[^>]*>A♠<\/span> <span class="pzi" data-s="diamond"/);
  // bare: "strict" (old report text): plain letter cards too, words untouched
  const bare = renderToStaticMarkup(<CardText mode="inline" bare="strict">Flop Kc 3c Qd as the Kd turned</CardText>);
  assert.equal((bare.match(/class="pzi"/g) ?? []).length, 4);
  assert.match(bare, /as the /);
  assert.doesNotMatch(renderToStaticMarkup(<CardText mode="inline">Flop Kc 3c Qd</CardText>), /pzi/);
});

test("remark and rehype plugins", () => {
  const md = { type: "root", children: [{ type: "paragraph", children: [{ type: "text", value: "Flop [As Kd 7c]" }, { type: "inlineCode", value: "[As]" }] }] };
  remarkPzCards()(md);
  const p = md.children[0]!.children;
  assert.equal(p[0]!.type, "text");
  assert.equal(p[1]!.type, "html");
  assert.equal(p.at(-1)!.type, "inlineCode");
  const md2 = { type: "root", children: [{ type: "text", value: "Hero [Ah Kh]" }] };
  remarkPzCards({ output: "text" })(md2);
  assert.equal((md2.children[0] as { value: string }).value, "Hero A♥ K♥");

  const hast = { type: "root", children: [
    { type: "element", tagName: "p", properties: {}, children: [{ type: "text", value: "Turn [Qh]" }] },
    { type: "element", tagName: "code", properties: {}, children: [{ type: "text", value: "[Qh]" }] },
  ] };
  rehypePzCards({ mode: "tile" })(hast);
  const pk = (hast.children[0] as { children: { type: string; tagName?: string; properties?: { className?: string[] } }[] }).children;
  assert.equal(pk[1]!.tagName, "span");
  assert.deepEqual(pk[1]!.properties!.className, ["pzc", "pzc--tile"]);
  assert.equal((hast.children[1] as { children: { type: string }[] }).children[0]!.type, "text");
  const old = { type: "root", children: [{ type: "element", tagName: "p", properties: {}, children: [{ type: "text", value: "Flop Kc 3c Qd" }] }] };
  rehypePzCards({ mode: "tile", bare: "strict" })(old);
  const po = (old.children[0] as { children: { tagName?: string }[] }).children;
  assert.equal(po.filter((c) => c.tagName === "span").length, 3);
});
