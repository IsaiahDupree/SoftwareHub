"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DownloadsOverTimeChartProps {
  data: Array<{ date: string; downloads: number }>;
}

export function DownloadsOverTimeChart({ data }: DownloadsOverTimeChartProps) {
  if (data.every((d) => d.downloads === 0)) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        No downloads in this period
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs text-muted-foreground"
            tickLine={false}
            tickFormatter={(value) => {
              const d = new Date(value);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
            interval={13}
          />
          <YAxis
            className="text-xs text-muted-foreground"
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <div className="text-sm font-medium">{payload[0].payload.date}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Downloads: {payload[0].payload.downloads}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="downloads"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#downloadGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
