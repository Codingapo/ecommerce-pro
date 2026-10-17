import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (code) {
    const { error } = await (await db()).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${siteUrl()}/account`);
  }
  return NextResponse.redirect(`${siteUrl()}/login?error=confirmation`);
}
