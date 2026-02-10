"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export function BetaToggle({ showBeta }: { showBeta: boolean }) {
  const router = useRouter();

  function handleToggle() {
    if (showBeta) {
      router.push("/app/downloads");
    } else {
      router.push("/app/downloads?beta=true");
    }
  }

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 text-sm"
    >
      <div
        className={`relative w-10 h-5 rounded-full transition-colors ${
          showBeta ? "bg-orange-500" : "bg-muted"
        }`}
      >
        <div
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            showBeta ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
      <span className="text-muted-foreground">
        {showBeta ? (
          <>
            Beta channel
            <Badge variant="outline" className="ml-1 text-orange-600 text-xs">
              Beta
            </Badge>
          </>
        ) : (
          "Stable channel"
        )}
      </span>
    </button>
  );
}
