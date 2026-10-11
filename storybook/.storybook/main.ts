import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs"],
  framework: { name: "@storybook/react-vite", options: {} },
  core: { disableTelemetry: true },
  viteFinal: async (cfg) => {
    // the library source lives one folder up
    cfg.server = { ...cfg.server, fs: { ...(cfg.server?.fs ?? {}), allow: [".."] } };
    // ../src imports react: resolve it from storybook/node_modules (no install needed in the library root)
    cfg.resolve = { ...cfg.resolve, dedupe: [...(cfg.resolve?.dedupe ?? []), "react", "react-dom"] };
    cfg.base = process.env.STORYBOOK_BASE ?? cfg.base;
    return cfg;
  },
};
export default config;
