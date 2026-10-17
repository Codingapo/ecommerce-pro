"use client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import type { SalesReport } from "@/lib/analytics";
import { money } from "@/lib/utils";
export function SalesCharts({ report }: { report: SalesReport }) {
  return (
    <>
      <div className="chart-card">
        <h2>Revenue over time</h2>
        <p className="muted">Confirmed payments · ZAR · UTC</p>
        <div
          className="chart-canvas"
          role="img"
          aria-label="Daily paid revenue line chart"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={report.daily}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => String(v).slice(5)}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `R${Number(v) / 100}`}
              />
              <Tooltip formatter={(v) => money(Number(v))} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#345e45"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="report-grid">
        <div className="chart-card">
          <h2>Orders by status</h2>
          <div className="chart-canvas">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.statuses}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  name="Orders"
                  fill="#78947e"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-card">
          <h2>Top selling pieces</h2>
          {report.top.length ? (
            report.top.map((p, i) => (
              <div className="top-product" key={p.name}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{p.name}</strong>
                  <small>{p.quantity} sold</small>
                </div>
                <span>{money(p.revenue)}</span>
              </div>
            ))
          ) : (
            <p className="muted">
              Your bestsellers will appear after your first paid order.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
