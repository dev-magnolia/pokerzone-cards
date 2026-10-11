import type { Preview } from "@storybook/react-vite";
import "../../styles/cards.css";
import "./preview.css";
import { CardsProvider } from "../../src/react/index.tsx";

const preview: Preview = {
  globalTypes: {
    deck: { description: "Deck", toolbar: { title: "Deck", icon: "paintbrush", items: [{ value: "four", title: "Four-colour" }, { value: "two", title: "Two-colour" }], dynamicTitle: true } },
    surface: { description: "Surface", toolbar: { title: "Surface", icon: "mirror", items: [{ value: "light", title: "Light" }, { value: "dark", title: "Dark" }], dynamicTitle: true } },
  },
  initialGlobals: { deck: "four", surface: "light" },
  parameters: {
    layout: "padded",
    controls: { expanded: true },
    options: { storySort: { order: ["Introduction", "Notation", "Components", "Text", "SVG", "DOM", "Theming"] } },
  },
  decorators: [
    (Story, ctx) => {
      const dark = ctx.globals.surface === "dark";
      return (
        <CardsProvider deck={ctx.globals.deck} surface={dark ? "dark" : undefined}>
          <div className={`pz-sb${dark ? " pz-dark" : ""}`} data-deck={ctx.globals.deck}>
            <Story />
          </div>
        </CardsProvider>
      );
    },
  ],
};
export default preview;
