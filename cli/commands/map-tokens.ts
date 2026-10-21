import fs from "node:fs";
import { mapUserTokens, tokenMapMarkdown } from "../../core/map-tokens";
import { getTokens } from "../lib/index";
import { printJson } from "../lib/output";

export interface MapTokensCommandOptions {
  stdin?: boolean;
  json?: boolean;
}

export async function runMapTokens(
  file: string | undefined,
  options: MapTokensCommandOptions,
): Promise<number> {
  let source: string;
  if (options.stdin || !file) {
    if (process.stdin.isTTY) {
      process.stderr.write("error: pass a file or pipe tokens on stdin (for example `myui map-tokens --stdin < tokens.css`)\n");
      return 1;
    }
    source = fs.readFileSync(0, "utf8");
  } else {
    try {
      source = fs.readFileSync(file, "utf8");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`error: ${message}\n`);
      return 1;
    }
  }

  if (!source.trim()) {
    process.stderr.write("error: no tokens found on stdin or in the file\n");
    return 1;
  }

  const result = mapUserTokens(source, getTokens());

  if (options.json) {
    printJson({
      source: options.stdin || !file ? "stdin" : file,
      ...result,
    });
    return 0;
  }

  process.stdout.write(tokenMapMarkdown(result) + "\n");
  return 0;
}
