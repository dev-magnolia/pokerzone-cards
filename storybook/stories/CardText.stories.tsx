import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { CardText, useCopyHand, useCardsSettings } from "../../src/react/index.tsx";

const meta: Meta<typeof CardText> = {
  title: "Text/CardText",
  component: CardText,
  args: { children: "Hero raises with [Ah Kd], Villain calls with {Qx Qc}. Flop [7c 2d Jh], turn A♠ — Villain mucks [?? ??].", mode: "tag" },
  argTypes: { mode: { control: "inline-radio", options: ["tag", "tile", "inline", "cards"] } },
  render: (a) => <p className="pz-text" style={{ maxWidth: 760 }}><CardText {...a} /></p>,
};
export default meta;
type S = StoryObj<typeof CardText>;

export const Tag: S = {};
export const Tile: S = { args: { mode: "tile" } };
export const Inline: S = { args: { mode: "inline" } };
export const Cards: S = { args: { mode: "cards", size: 44 } };
export const SplitLook: S = { args: { colour: true }, name: "Minis in the Split look" };

function CopyDemo() {
  const copy = useCopyHand();
  const { settings, set } = useCardsSettings();
  const [pasted, setPasted] = useState("");
  return (
    <div className="pz-col" style={{ maxWidth: 760 }}>
      <p className="pz-text"><CardText>Hero [Jc Qd] · Flop [As Kd Th] · Turn [7c] · River [Qh] — Hero wins with a straight</CardText></p>
      <div className="pz-row">
        <button onClick={() => set({ copyFormat: settings.copyFormat === "symbol" ? "letter" : "symbol" })}>Copy format: {settings.copyFormat === "symbol" ? "Symbol text (A♠)" : "Letter text (As)"}</button>
        <button onClick={() => copy("Jc Qd As Kd Th").then(setPasted)}>useCopyHand()</button>
      </div>
      <span className="pz-cap">Select the line above and copy (Cmd/Ctrl+C), then paste below: the cards come as text.</span>
      <textarea className="pz-input" rows={4} placeholder="Paste here…" value={pasted} onChange={(e) => setPasted(e.target.value)} />
    </div>
  );
}
export const CopyAsText: S = { render: () => <CopyDemo /> };
