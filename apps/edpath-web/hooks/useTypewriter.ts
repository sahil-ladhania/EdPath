"use client";

import { useEffect, useState } from "react";

const TYPEWRITER_MS = 16;

export function useTypewriter(
  text: string,
  enabled: boolean,
  onComplete?: () => void,
): string {
  const [visible, setVisible] = useState<string>(enabled ? "" : text);

  useEffect(() => {
    if (!enabled) {
      setVisible(text);
      return;
    }

    setVisible("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisible(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(timer);
        onComplete?.();
      }
    }, TYPEWRITER_MS);

    return () => window.clearInterval(timer);
  }, [enabled, onComplete, text]);

  return visible;
}
