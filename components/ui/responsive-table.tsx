import React from "react";

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
}

export function ResponsiveTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField,
}: ResponsiveTableProps<T>) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {columns.map((col) => (
                <th key={String(col.key)} className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={String(row[keyField])} className="border-b hover:bg-muted/50">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3">
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <div key={String(row[keyField])} className="rounded-lg border p-4 space-y-2">
            {columns.map((col) => (
              <div key={String(col.key)} className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">{col.header}</span>
                <span>{col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
