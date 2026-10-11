import type { Meta, StoryObj } from "@storybook/react-vite";
import { CardBack } from "../../src/react/index.tsx";

const meta: Meta<typeof CardBack> = {
  title: "Components/CardBack",
  component: CardBack,
  args: { variant: "slogan", muck: false, size: 96 },
  argTypes: { variant: { control: "inline-radio", options: ["slogan", "symbol"] } },
};
export default meta;
type S = StoryObj<typeof CardBack>;

export const Slogan: S = {};
export const Symbol: S = { args: { variant: "symbol" } };
export const Muck: S = { args: { muck: true } };
export const Overview: S = {
  render: () => <div className="pz-row">{(["slogan", "symbol"] as const).map((v) => [false, true].map((m) => <div key={v + m} className="pz-col"><CardBack variant={v} muck={m} size={96} /><span className="pz-cap">{v}{m ? " · muck" : ""}</span></div>))}</div>,
};
