import { clearConfig, configPath } from "../lib/config";
import { printJson } from "../lib/output";

export interface LogoutCommandOptions {
  json?: boolean;
}

export async function runLogout(options: LogoutCommandOptions): Promise<number> {
  const path = configPath();
  const removed = clearConfig();
  if (options.json) {
    printJson({ removed, configPath: path });
    return 0;
  }
  process.stdout.write(removed ? `Removed ${path}\n` : `No config found at ${path}\n`);
  return 0;
}
