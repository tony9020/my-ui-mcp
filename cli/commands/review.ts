import { runAudit } from "./audit";
import type { AuditCommandOptions, FailOn } from "./audit";

export interface ReviewCommandOptions extends AuditCommandOptions {
  strict?: boolean;
  failOn?: FailOn;
}

/**
 * `review` is `audit` with a stricter default: warnings fail the run. Useful
 * in CI for a "no new warnings" gate on a component directory.
 */
export async function runReview(target: string | undefined, options: ReviewCommandOptions): Promise<number> {
  return runAudit(target, {
    ...options,
    failOn: options.failOn ?? (options.strict ? "warning" : "warning"),
  });
}
