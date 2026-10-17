import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { checked } from "@/lib/http";
import { salesReport } from "@/lib/analytics";
import { SalesCharts } from "@/components/sales-charts";
import { FunnelChart } from "@/components/funnel-chart";
import { funnelReport, groupRevenue } from "@/lib/funnel";
import type { Event } from "@/lib/types";
import { money } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export default async function Analytics({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; period?: string }>;
}) {
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const ago = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const date = z.iso.date();
  const from = date.safeParse(params.from).success ? params.from! : ago;
  const to = date.safeParse(params.to).success ? params.to! : today;
  const start = new Date(from + "T00:00:00Z"),
    end = new Date(to + "T00:00:00Z");
  end.setUTCDate(end.getUTCDate() + 1);
  if (end <= start || end.getTime() - start.getTime() > 366 * 86400000)
    return (
      <>
        <h1>Choose a smaller range.</h1>
        <p>
          Reports support up to 366 days.{" "}
          <a href="/admin/analytics">Reset dates →</a>
        </p>
      </>
    );
  const period =
    params.period === "week" || params.period === "month"
      ? params.period
      : "day";
  const { client } = await requireAdmin();
  const events: Event[] = [];
  for (let offset = 0; ; offset += 1000) {
    const rows = checked(
      await client
        .from("events")
        .select("*")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .order("created_at")
        .order("id")
        .range(offset, offset + 999),
    );
    events.push(...rows);
    if (rows.length < 1000) break;
  }
  const [report, traffic] = await Promise.all([
    salesReport(start.toISOString(), end.toISOString()),
    Promise.resolve(funnelReport(events)),
  ]);
  report.daily = groupRevenue(report.daily, period);
  return (
    <>
      <p className="eyebrow">KNOW WHAT IS WORKING</p>
      <h1>Your store, in focus.</h1>
      <form className="date-filters">
        <label>
          From
          <Input type="date" name="from" defaultValue={from} />
        </label>
        <label>
          To
          <Input type="date" name="to" defaultValue={to} />
        </label>
        <label>
          Group by
          <select name="period" defaultValue={period}>
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </label>
        <Button>Update report</Button>
      </form>
      <div className="stat-grid">
        <div className="stat-card">
          <span>Paid revenue</span>
          <strong>{money(report.revenue)}</strong>
        </div>
        <div className="stat-card">
          <span>Average order value</span>
          <strong>
            {money(report.paidOrders ? report.revenue / report.paidOrders : 0)}
          </strong>
        </div>
        <div className="stat-card">
          <span>Paid orders</span>
          <strong>{report.paidOrders}</strong>
        </div>
        <div className="stat-card">
          <span>Tracked funnel conversion</span>
          <strong>{traffic.conversion.toFixed(1)}%</strong>
          <small>{traffic.sessions} consenting sessions</small>
        </div>
      </div>
      <SalesCharts report={report} />
      <FunnelChart funnel={traffic.funnel} />
      <div className="chart-card">
        <h2>Traffic sources</h2>
        {traffic.sources.length ? (
          traffic.sources.slice(0, 20).map((s) => (
            <div className="source-row" key={s.name}>
              <span>{s.name}</span>
              <strong>{s.value} sessions</strong>
            </div>
          ))
        ) : (
          <p className="muted">Consenting visits will appear here.</p>
        )}
        <p className="muted">
          Funnel steps must occur in order within this date range. Browsers that
          decline analytics are excluded. Payment totals include every confirmed
          payment.
        </p>
      </div>
    </>
  );
}
