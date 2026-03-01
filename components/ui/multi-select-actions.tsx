"use client";

import { useState, ReactNode } from "react";

interface MultiSelectActionsProps<T> {
  items: T[];
  keyField: keyof T;
  renderItem: (item: T, selected: boolean) => ReactNode;
  actions: { label: string; onClick: (selected: T[]) => void; variant?: "default" | "danger" }[];
}

export function MultiSelectActions<T extends Record<string, unknown>>({
  items,
  keyField,
  renderItem,
  actions,
}: MultiSelectActionsProps<T>) {
  const [selectedKeys, setSelectedKeys] = useState<Set<unknown>>(new Set());

  const toggleItem = (key: unknown) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedKeys.size === items.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(items.map((item) => item[keyField])));
    }
  };

  const selectedItems = items.filter((item) => selectedKeys.has(item[keyField]));

  return (
    <div>
      {selectedKeys.size > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-muted rounded-md">
          <span className="text-sm font-medium">{selectedKeys.size} selected</span>
          <div className="flex gap-2 ml-auto">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={() => action.onClick(selectedItems)}
                className={`px-3 py-1 text-sm rounded-md ${
                  action.variant === "danger"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="mb-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selectedKeys.size === items.length && items.length > 0}
            onChange={toggleAll}
            className="rounded"
          />
          Select all
        </label>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={String(item[keyField])}
            onClick={() => toggleItem(item[keyField])}
            className="flex items-center gap-2 cursor-pointer hover:bg-muted rounded-md p-2"
          >
            <input
              type="checkbox"
              checked={selectedKeys.has(item[keyField])}
              onChange={() => toggleItem(item[keyField])}
              className="rounded"
            />
            {renderItem(item, selectedKeys.has(item[keyField]))}
          </div>
        ))}
      </div>
    </div>
  );
}
