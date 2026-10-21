import { Command, Option } from "commander";
import { packageVersion } from "../mcp/lib/paths";
import { runAudit } from "./commands/audit";
import { runLogin } from "./commands/login";
import { runLogout } from "./commands/logout";
import { runMapTokens } from "./commands/map-tokens";
import { runPublish } from "./commands/publish";
import { runReview } from "./commands/review";
import { runSearch } from "./commands/search";
import { runStatus } from "./commands/status";
import { runTokens, tokenTypes } from "./commands/tokens";

const program = new Command();

function globalOptions(): Record<string, unknown> {
  return program.opts<Record<string, unknown>>();
}

program
  .name("myui")
  .description(
    "My Ui CLI — search the component index, audit UI source, map tokens, and publish to a hosted registry.",
  )
  .version(packageVersion(), "-v, --version")
  .option("--json", "machine-readable JSON on stdout")
  .option("--no-color", "disable ANSI colour")
  .option("--verbose", "extra diagnostics on stderr")
  .showHelpAfterError()
  .showSuggestionAfterError();

program.hook("preAction", (_thisCommand, actionCommand) => {
  const options = actionCommand.optsWithGlobals() as { color?: boolean };
  if (options.color === false) process.env.NO_COLOR = "1";
});

/* ------------------------------------------------------------------ search */

program
  .command("search")
  .description("Search 57 local components and the 8,157-record marketplace catalogue.")
  .argument("[query]", "free-text query; omit to browse with filters", "")
  .option("--category <category>", "category name or slug, for example 'ui' or 'Primitives'")
  .option("--tag <tag...>", "only components carrying all of these tags")
  .addOption(
    new Option("--kind <kind>", "component kind").choices([
      "primitive",
      "pattern",
      "section",
      "provider",
      "catalogue",
    ]),
  )
  .addOption(
    new Option("--license <policy>", "licence gate")
      .choices(["permissive-only", "allow-weak-copyleft", "any"])
      .default("permissive-only"),
  )
  .addOption(
    new Option("--trust <tier>", "minimum trust tier").choices([
      "verified",
      "linked",
      "reference",
    ]),
  )
  .option("--limit <n>", "maximum results", (value) => Number.parseInt(value, 10), 10)
  .option("--include-duplicates", "keep non-canonical duplicate records")
  .addOption(
    new Option("--sort <order>", "sort order").choices([
      "relevance",
      "popularity",
      "recent",
      "compliance",
    ]),
  )
  .option("--remote", "query the hosted /api/v1/search instead of the local index")
  .option("--api-url <url>", "override the hosted API base URL")
  .option("--token <token>", "override the stored API token")
  .action(async (query: string, options: Record<string, unknown>) => {
    const code = await runSearch(query, { ...globalOptions(), ...options } as never);
    if (code) process.exitCode = code;
  });

/* ------------------------------------------------------------------- audit */

program
  .command("audit")
  .description("Audit the catalogue, one source file, or a directory of source files.")
  .argument("[target]", "file or directory; omit to audit the catalogue")
  .addOption(
    new Option("--fail-on <level>", "exit non-zero when this severity is present")
      .choices(["none", "error", "warning"])
      .default("error"),
  )
  .option("--limit <n>", "maximum files to scan in a directory", (value) => Number.parseInt(value, 10), 500)
  .action(async (target: string | undefined, options: Record<string, unknown>) => {
    const code = await runAudit(target, { ...globalOptions(), ...options } as never);
    if (code) process.exitCode = code;
  });

program
  .command("review")
  .description("Stricter audit: warnings fail by default. Use in CI.")
  .argument("[target]", "file or directory; omit to audit the catalogue")
  .option("--strict", "fail on any warning (default)")
  .addOption(
    new Option("--fail-on <level>", "exit non-zero when this severity is present")
      .choices(["none", "error", "warning"])
      .default("warning"),
  )
  .option("--limit <n>", "maximum files to scan in a directory", (value) => Number.parseInt(value, 10), 500)
  .action(async (target: string | undefined, options: Record<string, unknown>) => {
    const code = await runReview(target, { ...globalOptions(), ...options } as never);
    if (code) process.exitCode = code;
  });

/* ------------------------------------------------------------------ status */

program
  .command("status")
  .description("Index counts, derived-data freshness, and the current CLI configuration.")
  .action(async () => {
    const code = await runStatus(globalOptions() as never);
    if (code) process.exitCode = code;
  });

/* ------------------------------------------------------------------ tokens */

program
  .command("tokens")
  .description("Print the semantic design tokens from globals.css.")
  .addOption(
    new Option("--type <type>", "token family").choices(tokenTypes()).default("all"),
  )
  .addOption(
    new Option("--format <format>", "output format").choices(["md", "json", "css"]).default("md"),
  )
  .action(async (options: Record<string, unknown>) => {
    const code = await runTokens({ ...globalOptions(), ...options } as never);
    if (code) process.exitCode = code;
  });

program
  .command("map-tokens")
  .description("Map your CSS variables onto My Ui semantic tokens.")
  .argument("[file]", "CSS or token file; omit to read stdin")
  .option("--stdin", "read tokens from stdin")
  .action(async (file: string | undefined, options: Record<string, unknown>) => {
    const code = await runMapTokens(file, { ...globalOptions(), ...options } as never);
    if (code) process.exitCode = code;
  });

/* ------------------------------------------------------------------- login */

program
  .command("login")
  .description("Store a hosted API token in ~/.config/myui/config.json (mode 0600).")
  .option("--token <token>", "API token; omit to be prompted")
  .option("--api-url <url>", "hosted API base URL")
  .option("--email <email>", "account email, for display only")
  .option("--local", "store the token without contacting a host")
  .option("--offline", "skip token verification")
  .action(async (options: Record<string, unknown>) => {
    const code = await runLogin({ ...globalOptions(), ...options } as never);
    if (code) process.exitCode = code;
  });

program
  .command("logout")
  .description("Remove the stored API token.")
  .action(async () => {
    const code = await runLogout(globalOptions() as never);
    if (code) process.exitCode = code;
  });

/* ----------------------------------------------------------------- publish */

program
  .command("publish")
  .description("Validate a component file and send it to the hosted registry.")
  .argument("<file>", "component file to publish")
  .option("--dry-run", "validate and print the payload without uploading")
  .option("--local", "write the payload to .myui/registry/<slug>.json instead of uploading")
  .option("--force", "publish even when validation reports errors")
  .option("--include-content", "include the full source in --dry-run --json output")
  .option("--name <name>", "display name")
  .option("--slug <slug>", "registry slug")
  .option("--category <category>", "category")
  .option("--license <license>", "licence identifier", "MIT")
  .option("--description <description>", "short description")
  .option("--api-url <url>", "override the hosted API base URL")
  .option("--token <token>", "override the stored API token")
  .action(async (file: string, options: Record<string, unknown>) => {
    const code = await runPublish(file, { ...globalOptions(), ...options } as never);
    if (code) process.exitCode = code;
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`error: ${message}\n`);
  process.exitCode = 1;
});
