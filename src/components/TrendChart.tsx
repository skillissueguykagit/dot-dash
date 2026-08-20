"use client";

import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export default function TrendChart({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  if (!data.length) {
    return <p className="text-text-faint text-xs">No tests yet — finish one to start your trend line.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data}>
        <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
