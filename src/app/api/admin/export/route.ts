import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/supabase/admin";
import { checked, failure, AppError } from "@/lib/http";
import { csvRow } from "@/lib/csv";
import { rateLimit } from "@/lib/limits";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const { client, user } = await requireAdmin();
    await rateLimit(`export:${user.id}`, 5, 300);
    const kind = new URL(request.url).searchParams.get("kind");
    if (kind !== "orders" && kind !== "customers")
      throw new AppError(400, "Choose orders or customers.");
    checked(
      await adminDb()
        .from("activity_logs")
        .insert({
          actor_id: user.id,
          action: "export_csv",
          entity: kind,
          entity_id: "all",
        }),
    );
    const encoder = new TextEncoder();
    let offset = 0;
    let header = false;
    let finished = false;
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          if (!header) {
            controller.enqueue(
              encoder.encode(
                "\uFEFF" +
                  csvRow(
                    kind === "orders"
                      ? [
                          "Order",
                          "Reference",
                          "Email",
                          "Status",
                          "Payment",
                          "Total (ZAR)",
                          "Created",
                        ]
                      : ["Name", "Email", "Phone", "Joined"],
                  ),
              ),
            );
            header = true;
            return;
          }
          if (finished) {
            controller.close();
            return;
          }
          if (kind === "orders") {
            const rows = checked(
              await client
                .from("orders")
                .select("*")
                .order("id")
                .range(offset, offset + 499),
            );
            for (const o of rows)
              controller.enqueue(
                encoder.encode(
                  csvRow([
                    o.order_number,
                    o.reference,
                    o.email,
                    o.status,
                    o.payment_status,
                    (o.total / 100).toFixed(2),
                    o.created_at,
                  ]),
                ),
              );
            finished = rows.length < 500;
          } else {
            const rows = checked(
              await client
                .from("profiles")
                .select("*")
                .order("id")
                .range(offset, offset + 499),
            );
            for (const p of rows)
              controller.enqueue(
                encoder.encode(
                  csvRow([p.full_name, p.email, p.phone, p.created_at]),
                ),
              );
            finished = rows.length < 500;
          }
          offset += 500;
        } catch (error) {
          controller.error(error);
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mulaba-${kind}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
