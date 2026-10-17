import { secret } from "@/lib/env";
import { failure } from "@/lib/http";
import { recoverCarts } from "@/lib/recovery";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    if (
      request.headers.get("authorization") !== `Bearer ${secret("CRON_SECRET")}`
    )
      return new Response("Unauthorized", { status: 401 });
    return Response.json(await recoverCarts());
  } catch (error) {
    return failure(error);
  }
}
