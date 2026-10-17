"use client";
export function trackingContext() {
  if (
    typeof window === "undefined" ||
    localStorage.getItem("mulaba-analytics-consent") !== "yes"
  )
    return { analytics_session: null, traffic_source: "direct" };
  let session = sessionStorage.getItem("mulaba-session");
  if (!session) {
    session = crypto.randomUUID();
    sessionStorage.setItem("mulaba-session", session);
    const utm = new URLSearchParams(location.search).get("utm_source");
    let source = utm || "direct";
    if (!utm && document.referrer) {
      try {
        source = new URL(document.referrer).hostname;
      } catch {}
    }
    sessionStorage.setItem("mulaba-source", source.slice(0, 100));
  }
  return {
    analytics_session: session,
    traffic_source: sessionStorage.getItem("mulaba-source") || "direct",
  };
}
export function track(
  kind: "page_view" | "product_view" | "add_to_cart",
  product_id?: string,
) {
  if (
    ["/admin", "/account", "/login", "/auth", "/unsubscribe"].some((p) =>
      location.pathname.startsWith(p),
    )
  )
    return;
  const context = trackingContext();
  if (
    !context.analytics_session ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  )
    return;
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: crypto.randomUUID(),
      session_id: context.analytics_session,
      source: context.traffic_source,
      path: location.pathname.slice(0, 250),
      kind,
      product_id,
    }),
    keepalive: true,
  }).catch(() => {});
}
