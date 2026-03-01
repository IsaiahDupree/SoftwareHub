"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchItem {
  label: string;
  href: string;
  category?: string;
}

const defaultItems: SearchItem[] = [
  { label: "Dashboard", href: "/app", category: "Navigation" },
  { label: "Courses", href: "/app/courses", category: "Navigation" },
  { label: "Settings", href: "/app/settings", category: "Navigation" },
  { label: "Admin", href: "/admin", category: "Admin" },
  { label: "Notifications", href: "/app/notifications", category: "Navigation" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const filtered = defaultItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div
        className="relative w-full max-w-lg bg-background rounded-lg shadow-2xl border"
        role="dialog"
        aria-label="Quick navigation"
      >
        <div className="flex items-center gap-2 px-4 border-b">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or navigate..."
            className="w-full py-3 bg-transparent text-sm outline-none"
          />
          <kbd className="text-xs text-muted-foreground border rounded px-1">Esc</kbd>
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No results</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.href}
                onClick={() => handleSelect(item.href)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-muted text-left"
              >
                <span>{item.label}</span>
                {item.category && (
                  <span className="text-xs text-muted-foreground">{item.category}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
