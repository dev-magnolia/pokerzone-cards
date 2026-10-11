/**
 * @pokerzon/cards/remark — a remark (Markdown / MDX) plugin: replaces card notation in text with card markup.
 * No dependency on unified: it walks the mdast tree directly. Code (inline and blocks) is never touched.
 *
 *   unified().use(remarkParse).use(remarkPzCards, { mode: "tag" }).use(remarkRehype, { allowDangerousHtml: true })…
 *
 * Output: `html` nodes (needs `allowDangerousHtml` + `rehype-raw` or an HTML stringifier), or with
 * `output: "text"` plain text in the symbol form (A♠) — for RSS, meta descriptions, push notifications.
 */
import { tokenize } from "../core/tokenize.ts";
import { toSymbolText } from "../core/format.ts";
import { textNodes, type TextOptions } from "../markup/cards.ts";
import { toHtml } from "../markup/vnode.ts";

export interface RemarkPzCardsOptions extends TextOptions {
  output?: "html" | "text";
}

interface MdNode {
  type: string;
  value?: string;
  children?: MdNode[];
}

const SKIP = new Set(["code", "inlineCode", "html", "mdxjsEsm", "mdxFlowExpression", "mdxTextExpression", "link", "linkReference"]);

export default function remarkPzCards(options: RemarkPzCardsOptions = {}) {
  return (tree: MdNode) => {
    walk(tree, options);
  };
}
export { remarkPzCards };

function walk(node: MdNode, o: RemarkPzCardsOptions) {
  if (!node.children) return;
  const next: MdNode[] = [];
  for (const child of node.children) {
    if (SKIP.has(child.type)) {
      next.push(child);
      continue;
    }
    if (child.type === "text" && child.value) {
      if (!tokenize(child.value, o).some((s) => s.type === "cards")) {
        next.push(child);
        continue;
      }
      if (o.output === "text") next.push({ type: "text", value: toSymbolText(child.value, o) });
      else {
        for (const part of textNodes(child.value, o)) {
          next.push(typeof part === "string" ? { type: "text", value: part } : { type: "html", value: toHtml(part) });
        }
      }
      continue;
    }
    walk(child, o);
    next.push(child);
  }
  node.children = next;
}
