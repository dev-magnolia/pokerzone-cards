import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { cardKey, normalize, toLetterText, toSymbolText, tokenize, cardsLabel } from "../../src/index.ts";
import { CardText } from "../../src/react/index.tsx";

function Playground({ initial, bare: bareInitial = false }: { initial: string; bare?: boolean }) {
  const [text, setText] = useState(initial);
  const [bareOn, setBare] = useState(bareInitial);
  const bare = bareOn ? ("strict" as const) : false;
  const segs = tokenize(text, { bare });
  return (
    <div className="pz-col" style={{ maxWidth: 900 }}>
      <textarea className="pz-input" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      <label className="pz-cap"><input type="checkbox" checked={bareOn} onChange={(e) => setBare(e.target.checked)} /> bare: "strict" — plain letter cards outside brackets (report text)</label>
      <div className="pz-box pz-text"><CardText bare={bare}>{text}</CardText></div>
      <div className="pz-box pz-text"><CardText mode="tile" bare={bare}>{text}</CardText></div>
      <div className="pz-box pz-text"><CardText mode="inline" bare={bare}>{text}</CardText></div>
      <table className="pz-t">
        <tbody>
          <tr><th>normalize()</th><td><code>{normalize(text, { bare })}</code></td></tr>
          <tr><th>toSymbolText()</th><td><code>{toSymbolText(text, { bare })}</code></td></tr>
          <tr><th>toLetterText()</th><td><code>{toLetterText(text, { bare })}</code></td></tr>
          <tr><th>tokenize()</th><td>{segs.map((s, i) => <div key={i}><code>{s.type === "text" ? JSON.stringify(s.text) : `cards ${s.group.bracket ?? "·"} [${s.group.cards.map((c) => cardKey(c)).join(" ")}] — ${cardsLabel(s.group.cards)}`}</code></div>)}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

const meta: Meta<typeof Playground> = { title: "Notation/Playground", component: Playground };
export default meta;
type S = StoryObj<typeof Playground>;

export const Playground_: S = { name: "Playground", args: { initial: "Hero [Ah Kd] vs {10s 10c}, board [7c2d Jh] Qx — see [1] and [sic]; literal \\[As]. A♠ wins, Villain mucks [?? ??]." } };
export const TenAndLowerCase: S = { args: { initial: "[10h 10d] = [th TD] = {T♥ 10♦}" } };
export const UnknownCards: S = { args: { initial: "Villain [Ax Kx], unknown [Xx ??], board [Ah Kh Qx]" } };
export const NotCards: S = { args: { initial: "Footnote [1], [sic], {note}, [2024], As I said Ad Kc — only bracketed or symbol cards: [Ad Kc] A♦" } };
export const PlainReportText: S = {
  name: "Plain report text (bare: strict)",
  args: {
    bare: true,
    initial:
      "As the chips moved, Kim opened. Flop Kc 3c Qd, the Kd on the turn and the river Ah. He shows Kd 6s Ad Kh — 8d, 7d mucked. " +
      "Words stay text: he checked the 4d as well; asks; Khac; KD kd. The As landed on the river.",
  },
};
