"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";

export function useCopy(resetMs = 1800) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);

  const copy = React.useCallback(
    async (text: string, label = "Copied to clipboard") => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // clipboard API can be blocked; fall back to a hidden textarea
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
        } catch {
          toast("Couldn't copy", "Select the text and copy manually.");
          document.body.removeChild(ta);
          return;
        }
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast(label);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), resetMs);
    },
    [resetMs],
  );

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  return { copied, copy };
}
