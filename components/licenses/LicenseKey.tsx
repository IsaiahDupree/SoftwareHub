"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy, Check } from "lucide-react";

const REVEAL_TIMEOUT_MS = 30_000;

export function LicenseKey({
  licenseId,
  maskedKey,
}: {
  licenseId: string;
  maskedKey: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [fullKey, setFullKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const hideKey = useCallback(() => {
    setRevealed(false);
    setFullKey(null);
  }, []);

  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(hideKey, REVEAL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [revealed, hideKey]);

  async function handleReveal() {
    if (revealed) {
      hideKey();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/licenses/${licenseId}/reveal`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reveal");
      const data = await res.json();
      setFullKey(data.license_key);
      setRevealed(true);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!fullKey) return;
    try {
      await navigator.clipboard.writeText(fullKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
        {revealed && fullKey ? fullKey : maskedKey}
      </code>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleReveal}
        disabled={loading}
        title={revealed ? "Hide key" : "Reveal key"}
      >
        {revealed ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </Button>
      {revealed && fullKey && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      )}
    </div>
  );
}
