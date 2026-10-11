import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "../../src/react/index.tsx";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  args: { card: "As", face: "bold", size: 96 },
  argTypes: { face: { control: "inline-radio", options: ["bold", "soft", "split"] }, size: { control: { type: "range", min: 44, max: 160, step: 4 } } },
};
export default meta;
type S = StoryObj<typeof Card>;

export const Bold: S = {};
export const Soft: S = { args: { face: "soft", card: "Kh" } };
export const Split: S = { args: { face: "split", card: "Qd" } };
export const UnknownSuit: S = { args: { card: "Tx" } };
export const UnknownCard: S = { args: { card: "Xx" }, parameters: { docs: { description: { story: "An unknown card renders its back." } } } };

const FOUR = ["As", "Kh", "Qd", "Jc", "Tx"];
export const AllFaces: S = {
  render: (a) => (
    <div className="pz-col">
      {(["bold", "soft", "split"] as const).map((face) => (
        <div key={face} className="pz-row">{FOUR.map((c) => <Card key={c} card={c} face={face} size={a.size} />)}<span className="pz-cap">{face}</span></div>
      ))}
    </div>
  ),
  args: { size: 72 },
};
export const Sizes: S = {
  render: (a) => <div className="pz-row">{[44, 56, 64, 96, 128].map((w) => <div key={w} className="pz-col"><Card card={a.card} face={a.face} size={w} /><span className="pz-cap">{w} px</span></div>)}</div>,
};
