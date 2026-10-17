"use client";
import { useState } from "react";
import type { Profile } from "@/lib/types";
import { api } from "@/lib/client-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function ProfileForm({ profile }: { profile: Profile }) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const address = (profile.address || {}) as Record<string, string>;
  return (
    <form
      className="form-card"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        const f = new FormData(e.currentTarget);
        try {
          await api(
            "/api/profile",
            {
              recovery_opt_in: f.get("recovery_opt_in") === "on",
              full_name: f.get("name"),
              phone: f.get("phone"),
              address: {
                name: f.get("name"),
                phone: f.get("phone"),
                line1: f.get("line1"),
                city: f.get("city"),
                province: f.get("province"),
                postal_code: f.get("postal_code"),
                country: "ZA",
              },
            },
            "PATCH",
          );
          setMessage("Your details are saved.");
        } catch (err) {
          setMessage(
            err instanceof Error ? err.message : "Could not save profile",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Your details</h2>
      <div className="form-grid">
        {[
          { name: "name", label: "Full name", value: profile.full_name },
          { name: "phone", label: "Phone number", value: profile.phone },
          { name: "line1", label: "Street address", value: address.line1 },
          { name: "city", label: "City", value: address.city },
          { name: "province", label: "Province", value: address.province },
          {
            name: "postal_code",
            label: "Postal code",
            value: address.postal_code,
          },
        ].map((f) => (
          <label key={f.name}>
            {f.label}
            <Input
              name={f.name}
              defaultValue={f.value || ""}
              required
              maxLength={180}
            />
          </label>
        ))}
      </div>
      <label className="consent-checkbox">
        <input
          type="checkbox"
          name="recovery_opt_in"
          defaultChecked={profile.recovery_opt_in}
        />{" "}
        Email me one reminder if I leave items in my bag. I can unsubscribe at
        any time.
      </label>
      <Button disabled={busy}>{busy ? "Saving…" : "Save details"}</Button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
