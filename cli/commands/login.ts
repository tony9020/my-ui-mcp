import readline from "node:readline/promises";
import { ApiError, fetchMe } from "../lib/api";
import { configPath, readConfig, resolveApiUrl, writeConfig } from "../lib/config";
import { paint, printJson, warn } from "../lib/output";

export interface LoginCommandOptions {
  token?: string;
  apiUrl?: string;
  email?: string;
  local?: boolean;
  offline?: boolean;
  json?: boolean;
}

async function question(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(prompt)).trim();
  } finally {
    rl.close();
  }
}

export async function runLogin(options: LoginCommandOptions): Promise<number> {
  let apiUrl = resolveApiUrl(options.apiUrl) ?? "";
  let token = options.token ?? process.env.MYUI_TOKEN ?? "";
  const local = options.local ?? false;

  if (!local && !apiUrl) {
    if (!process.stdin.isTTY) {
      process.stderr.write(
        "error: no API URL. Pass --api-url <url>, set MYUI_API_URL, or use --local.\n",
      );
      return 2;
    }
    apiUrl = await question("My Ui API URL: ");
    if (!apiUrl) {
      process.stderr.write("error: an API URL is required for a hosted login. Use --local to store a token offline.\n");
      return 2;
    }
  }

  if (!token) {
    if (!process.stdin.isTTY) {
      process.stderr.write("error: no token. Pass --token <token> or set MYUI_TOKEN.\n");
      return 2;
    }
    token = await question("API token: ");
    if (!token) {
      process.stderr.write("error: a token is required.\n");
      return 2;
    }
  }

  let email = options.email;
  let expiresAt: string | undefined;
  let verified = false;

  if (!local && apiUrl && !options.offline) {
    try {
      const me = await fetchMe({ apiUrl, token, timeoutMs: 8_000 });
      verified = true;
      email = email ?? me.user?.email ?? me.email;
      expiresAt = me.expiresAt;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        process.stderr.write("error: the host rejected this token (401). Nothing was saved.\n");
        return 1;
      }
      const message = error instanceof Error ? error.message : String(error);
      warn(`could not verify the token at ${apiUrl}: ${message}. Storing it unverified.`);
    }
  }

  const file = writeConfig({
    ...readConfig(),
    apiUrl: apiUrl || undefined,
    token,
    email,
    expiresAt,
    local,
  });

  if (options.json) {
    printJson({
      saved: true,
      configPath: file,
      apiUrl: apiUrl || null,
      email: email ?? null,
      expiresAt: expiresAt ?? null,
      verified,
      local,
    });
    return 0;
  }

  process.stdout.write(
    [
      paint("green", "Saved."),
      `  Config: ${configPath()}`,
      `  API:    ${apiUrl || "not configured"}`,
      `  Account:${email ? ` ${email}` : " unknown"}`,
      `  Token:  ${local ? "stored locally (unverified)" : verified ? "verified" : "stored unverified"}`,
    ].join("\n") + "\n",
  );
  return 0;
}
