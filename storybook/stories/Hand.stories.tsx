import type { Meta, StoryObj } from "@storybook/react-vite";
import { Hand } from "../../src/react/index.tsx";

const meta: Meta<typeof Hand> = {
  title: "Components/Hand",
  component: Hand,
  args: { cards: "Jc Qd", layout: "spread", face: "bold", size: 56, faceDown: false },
  argTypes: {
    layout: { control: "inline-radio", options: ["spread", "tight", "fan", "fan-tight"] },
    face: { control: "inline-radio", options: ["bold", "soft", "split"] },
    back: { control: "inline-radio", options: ["slogan", "symbol"] },
  },
};
export default meta;
type S = StoryObj<typeof Hand>;

export const HoldemSpread: S = {};
export const HoldemTight: S = { args: { layout: "tight" } };
export const HoldemFan: S = { args: { layout: "fan" } };
export const HoldemFanTight: S = { args: { layout: "fan-tight" } };
export const Omaha: S = { args: { cards: "As Kh Jd Tc", layout: "fan" } };
export const Omaha5: S = { args: { cards: "As Kh Qh Jd Tc", layout: "fan" } };
export const FaceDown: S = { args: { faceDown: true, layout: "fan" } };
export const AllLayouts: S = {
  render: (a) => (
    <div className="pz-col">
      {[["Hold’em", "Jc Qd"], ["Omaha", "As Kh Jd Tc"], ["5-card Omaha", "As Kh Qh Jd Tc"]].map(([n, c]) => (
        <div key={n} className="pz-row">
          {(["spread", "tight", "fan", ...(c!.split(" ").length === 2 ? ["fan-tight"] : [])] as const).map((l) => (
            <div key={l} className="pz-col"><Hand cards={c!} layout={l as never} face={a.face} size={a.size} /><span className="pz-cap">{n} · {l}</span></div>
          ))}
        </div>
      ))}
    </div>
  ),
};
