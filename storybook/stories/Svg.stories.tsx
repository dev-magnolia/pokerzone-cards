import type { Meta, StoryObj } from "@storybook/react-vite";
import { renderCardSvg, renderMiniSvg, renderSuitSvg } from "../../src/svg/index.ts";

function SvgDemo({ card, face, width }: { card: string; face: "bold" | "soft" | "split"; width: number }) {
  const svg = renderCardSvg(card, { face, width });
  return (
    <div className="pz-col" style={{ maxWidth: 900 }}>
      <div className="pz-row">
        <span dangerouslySetInnerHTML={{ __html: svg }} />
        <span dangerouslySetInnerHTML={{ __html: renderMiniSvg(card, { shape: "tile" }) }} />
        <span dangerouslySetInnerHTML={{ __html: renderMiniSvg(card, { shape: "tag" }) }} />
        <span dangerouslySetInnerHTML={{ __html: renderSuitSvg(null, { size: 40 }) }} />
        {(["s", "h", "d", "c"] as const).map((s) => <span key={s} dangerouslySetInnerHTML={{ __html: renderSuitSvg(s, { size: 40 }) }} />)}
      </div>
      <span className="pz-cap">Standalone SVG strings — ranks are outlines, no font needed (OG images, e-mail, PNG). {svg.length.toLocaleString()} bytes.</span>
      <pre className="pz-code">{`import { renderCardSvg } from "@pokerzon/cards/svg";\nrenderCardSvg("${card}", { face: "${face}", width: ${width} });`}</pre>
    </div>
  );
}
const meta: Meta<typeof SvgDemo> = {
  title: "SVG/renderCardSvg",
  component: SvgDemo,
  args: { card: "Ah", face: "bold", width: 128 },
  argTypes: { face: { control: "inline-radio", options: ["bold", "soft", "split"] } },
};
export default meta;
export const Default: StoryObj<typeof SvgDemo> = {};
