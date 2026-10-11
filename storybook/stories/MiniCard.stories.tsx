import type { Meta, StoryObj } from "@storybook/react-vite";
import { MiniCard } from "../../src/react/index.tsx";

const meta: Meta<typeof MiniCard> = {
  title: "Components/MiniCard",
  component: MiniCard,
  args: { card: "As", shape: "tag", colour: false, muck: false },
  argTypes: { shape: { control: "inline-radio", options: ["tag", "tile"] } },
};
export default meta;
type S = StoryObj<typeof MiniCard>;

export const Tag: S = {};
export const Tile: S = { args: { shape: "tile" } };
const ALL = ["As", "Kh", "Qd", "Jc", "Tx", "??"];
export const Overview: S = {
  render: () => (
    <div className="pz-col">
      {(["tile", "tag"] as const).map((shape) => [false, true].map((colour) => (
        <div key={shape + colour} className="pz-row">{ALL.map((c) => <MiniCard key={c} card={c} shape={shape} colour={colour} />)}<MiniCard card="??" shape={shape} muck /><span className="pz-cap">{shape}{colour ? " · colour (with Split)" : " · white (with Bold / Soft)"} · last: muck</span></div>
      )))}
    </div>
  ),
};
