"use client";
import { useState } from "react";
import { browserDb } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
export function SignOut() {
  const [error, setError] = useState("");
  return (
    <>
      <Button
        variant="outline"
        onClick={async () => {
          try {
            const { error } = await browserDb().auth.signOut();
            if (error) throw error;
            window.location.assign("/");
          } catch {
            setError("Could not sign out. Please retry.");
          }
        }}
      >
        Sign out
      </Button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
