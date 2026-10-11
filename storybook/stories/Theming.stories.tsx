import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card, CardsProvider, Hand, MiniCard } from "../../src/react/index.tsx";

function Decks() {
  const cards = ["As", "Kh", "Qd", "Jc"];
  return (
    <div className="pz-col">
      {(["four", "two"] as const).map((deck) => (
        <CardsProvider key={deck} deck={deck} copy={false}>
          <div className="pz-row">
            {cards.map((c) => <Card key={c} card={c} size={64} />)}
            {cards.map((c) => <Card key={c + "s"} card={c} face="split" size={64} />)}
            {cards.map((c) => <MiniCard key={c + "m"} card={c} />)}
            <span className="pz-cap">{deck}-colour deck · &lt;CardsProvider deck="{deck}"&gt;</span>
          </div>
        </CardsProvider>
      ))}
      <div className="pz-box pz-dark" style={{ background: "#0D1112" }}>
        <div className="pz-row">{cards.map((c) => <Card key={c} card={c} face="split" size={64} surface="dark" />)}<Hand cards="Ah Kh" layout="fan" face="split" surface="dark" /><span className="pz-cap">surface="dark" (or .pz-dark on a parent): the neutral Split card is not full black</span></div>
      </div>
      <pre className="pz-code">{`/* CSS tokens (styles/themes/pokerzon.css) — override for another brand */\n:root { --pz-heart-1: #CE0000; --pz-heart-u: #DE3B3D; --pz-heart-l: #BB061E; … }\n[data-deck="two"] { --pz-diamond-1: #CE0000; … }`}</pre>
    </div>
  );
}
const meta: Meta<typeof Decks> = { title: "Theming/Decks and surfaces", component: Decks };
export default meta;
export const Default: StoryObj<typeof Decks> = {};
