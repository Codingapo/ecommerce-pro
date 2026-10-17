"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
export function FunnelChart({
  funnel,
}: {
  funnel: { name: string; value: number }[];
}) {
  return (
    <div className="chart-card">
      <h2>The path to purchase</h2>
      <div
        className="chart-canvas"
        role="img"
        aria-label="Shopping conversion funnel"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={funnel}
            layout="vertical"
            margin={{ left: 20, right: 20 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tick={{ fontSize: 11 }}
            />
            <Tooltip />
            <Bar
              dataKey="value"
              name="Sessions"
              fill="#3f6a4c"
              radius={[0, 5, 5, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="funnel-numbers">
        {funnel.map((s) => (
          <span key={s.name}>
            {s.name}: <strong>{s.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
