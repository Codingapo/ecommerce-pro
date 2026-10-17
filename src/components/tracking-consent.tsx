"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/tracking";
export function TrackingConsent() {
  const [visible, setVisible] = useState(false);
  const path = usePathname();
  useEffect(() => {
    setVisible(!localStorage.getItem("mulaba-analytics-consent"));
    track("page_view");
  }, [path]);
  function choose(yes: boolean) {
    localStorage.setItem("mulaba-analytics-consent", yes ? "yes" : "no");
    setVisible(false);
    if (yes) {
      track("page_view");
      window.dispatchEvent(new Event("mulaba-analytics-enabled"));
    } else {
      sessionStorage.removeItem("mulaba-session");
      sessionStorage.removeItem("mulaba-source");
    }
  }
  return (
    <>
      {visible && (
        <aside className="consent-banner" aria-label="Analytics preference">
          <div>
            <strong>A little insight. A better store.</strong>
            <p>
              Allow shopping activity analytics to help improve the store?
              Signed-in activity can be linked to your account. No session
              recordings. Your choice does not affect checkout.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => choose(false)}>
            No thanks
          </Button>
          <Button size="sm" onClick={() => choose(true)}>
            Allow analytics
          </Button>
        </aside>
      )}
      <button className="privacy-choice" onClick={() => setVisible(true)}>
        Analytics preferences
      </button>
    </>
  );
}
