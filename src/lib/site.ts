/**
 * Canonical origin for the project. Used by metadata, share links, copy-prompt
 * payloads and the shadcn registry URLs so every surface points at the same
 * deployment. Override with NEXT_PUBLIC_SITE_URL when a custom domain is attached.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://my-ui-dun.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "My Ui";
