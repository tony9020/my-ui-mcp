import { createHighlighter, type Highlighter } from "shiki";

/**
 * Shiki singleton with the same dual themes the marketplace ships
 * (`github-light` / `github-dark`), emitted as CSS variables so a single
 * render serves both colour schemes.
 */
let highlighterPromise: Promise<Highlighter> | null = null;

const LANGS = ["tsx", "ts", "jsx", "js", "json", "bash", "css", "html", "md", "shell"] as const;

export function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: [...LANGS],
    });
  }
  return highlighterPromise;
}

function normalizeLang(lang: string): string {
  const l = lang.toLowerCase();
  if ((LANGS as readonly string[]).includes(l)) return l;
  if (l === "sh" || l === "zsh") return "bash";
  return "tsx";
}

export async function highlight(code: string, lang = "tsx"): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, {
    lang: normalizeLang(lang),
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
    transformers: [
      {
        line(node, line) {
          node.properties["data-line"] = String(line);
        },
      },
    ],
  });
}

export function detectLangFromPath(path: string): string {
  const ext = path.split(".").pop() ?? "tsx";
  return normalizeLang(ext);
}
