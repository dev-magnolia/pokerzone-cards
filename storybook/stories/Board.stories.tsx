import type { Meta, StoryObj } from "@storybook/react-vite";
import { Board, FlipCard } from "../../src/react/index.tsx";
import { useState } from "react";

const meta: Meta<typeof Board> = {
  title: "Components/Board",
  component: Board,
  args: { cards: "As Kd 7c", face: "bold", size: 64 },
  argTypes: { face: { control: "inline-radio", options: ["bold", "soft", "split"] } },
};
export default meta;
type S = StoryObj<typeof Board>;

export const Flop: S = {};
export const Turn: S = { args: { cards: "As Kd 7c 2h" } };
export const River: S = { args: { cards: "As Kd 7c 2h Qs" } };
export const Empty: S = { args: { cards: "" } };

function DealDemo() {
  const board = ["As", "Kd", "7c", "2h", "Qs"];
  const [n, setN] = useState(0);
  return (
    <div className="pz-col">
      <div className="pz-row">{board.map((c, i) => <FlipCard key={c} card={c} open={i < n} size={64} />)}</div>
      <div className="pz-row"><button onClick={() => setN((x) => (x === 0 ? 3 : x >= 5 ? 0 : x + 1))}>{n === 0 ? "Deal the flop" : n >= 5 ? "Reset" : n === 3 ? "Turn" : "River"}</button><span className="pz-cap">FlipCard: 0.45 s, instant with prefers-reduced-motion</span></div>
    </div>
  );
}
export const DealAndFlip: S = { render: () => <DealDemo /> };
