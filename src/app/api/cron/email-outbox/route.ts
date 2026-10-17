import { secret } from "@/lib/env";
import { dispatchEmails } from "@/lib/email";
import { failure } from "@/lib/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    if (
      request.headers.get("authorization") !== `Bearer ${secret("CRON_SECRET")}`
    )
      return new Response("Unauthorized", { status: 401 });
    return Response.json(await dispatchEmails(30));
  } catch (error) {
    return failure(error);
  }
}
