"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
export function Unsubscribe({ token }: { token: string }) {
  const [message, setMessage] = useState(""),
    [done, setDone] = useState(false),
    [busy, setBusy] = useState(false);
  return (
    <div className="empty-state">
      <h1>Just the emails you want.</h1>
      <p>
        Turn off shopping reminders. You will still receive essential order
        emails.
      </p>
      <Button
        disabled={done || busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api("/api/unsubscribe", { token });
            setDone(true);
            setMessage("You are unsubscribed from shopping reminders.");
          } catch (err) {
            setMessage(
              err instanceof Error ? err.message : "Please try again.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {done
          ? "Unsubscribed"
          : busy
            ? "Updating…"
            : "Unsubscribe from reminders"}
      </Button>
      <p role="status">{message}</p>
    </div>
  );
}
