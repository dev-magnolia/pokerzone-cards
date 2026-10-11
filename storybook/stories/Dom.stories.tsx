import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef } from "react";
import { defineCardElements, renderCardsIn, renderToHtml } from "../../src/dom/index.ts";

function DomDemo() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    defineCardElements();
    if (ref.current) renderCardsIn(ref.current);
  }, []);
  return (
    <div className="pz-col" style={{ maxWidth: 900 }}>
      <div className="pz-box pz-text" ref={ref}>
        Plain HTML, no React: Hero <b>[Ah Kd]</b> on {"{Th 7c 2d}"}. <code>[As]</code> in code stays as it is; <span data-no-cards>[Qs] here too</span>.
      </div>
      <div className="pz-box pz-text" dangerouslySetInnerHTML={{ __html: `renderToHtml(): ${renderToHtml("Villain [Ax Kx] mucks [?? ??]", { mode: "tile" })}` }} />
      <div className="pz-box" dangerouslySetInnerHTML={{ __html: `<pz-hand cards="As Kh Jd Tc" layout="fan"></pz-hand> <pz-card card="10h" face="split" size="72"></pz-card> <pz-back variant="symbol" size="72"></pz-back> <pz-board cards="As Kd 7c" size="56"></pz-board>` }} />
      <pre className="pz-code">{`import { renderCardsIn, defineCardElements, renderToHtml } from "@pokerzon/cards/dom";\nrenderCardsIn(document.querySelector("article"));\ndefineCardElements(); // <pz-card card="Th">, <pz-mini>, <pz-hand>, <pz-board>, <pz-back>, <pz-text>`}</pre>
    </div>
  );
}
const meta: Meta<typeof DomDemo> = { title: "DOM/Without React", component: DomDemo };
export default meta;
export const Default: StoryObj<typeof DomDemo> = {};
