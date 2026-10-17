import type { Event } from "@/lib/types";
const steps = [
  "page_view",
  "product_view",
  "add_to_cart",
  "checkout_started",
  "purchase_completed",
];
export function funnelReport(
  events: Pick<Event, "session_id" | "kind" | "source" | "created_at">[],
) {
  const sessions = new Map<string, { stage: number; source: string }>();
  for (const e of [...events].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  )) {
    let s = sessions.get(e.session_id);
    if (!s && e.kind === "page_view") {
      s = { stage: 1, source: e.source || "direct" };
      sessions.set(e.session_id, s);
      continue;
    }
    if (s && steps[s.stage] === e.kind) s.stage++;
  }
  const funnel = steps.map((name, i) => ({
    name: name.replaceAll("_", " "),
    value: [...sessions.values()].filter((s) => s.stage > i).length,
  }));
  const sources = new Map<string, number>();
  for (const s of sessions.values())
    sources.set(s.source, (sources.get(s.source) || 0) + 1);
  return {
    funnel,
    sessions: sessions.size,
    conversion: sessions.size ? (funnel[4].value / sessions.size) * 100 : 0,
    sources: [...sources]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
  };
}
export function groupRevenue(
  rows: { date: string; revenue: number }[],
  period: "day" | "week" | "month",
) {
  const groups = new Map<string, number>();
  for (const r of rows) {
    const date = new Date(r.date + "T00:00:00Z");
    if (period === "week")
      date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    if (period === "month") date.setUTCDate(1);
    const key = date.toISOString().slice(0, 10);
    groups.set(key, (groups.get(key) || 0) + r.revenue);
  }
  return [...groups].map(([date, revenue]) => ({ date, revenue }));
}
