"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ActiveUsersChartProps {
  data: Array<{ date: string; users: number }>;
}

export function ActiveUsersChart({ data }: ActiveUsersChartProps) {
  if (data.every((d) => d.users === 0)) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        No download activity in the last 30 days
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs text-muted-foreground"
            tickLine={false}
            tickFormatter={(value) => {
              const d = new Date(value);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
            interval={6}
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
                      Active Users: {payload[0].payload.users}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="users"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
