"use client";
import { useState } from "react";
import { browserDb } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function AuthForm({ next = "/account" }: { next?: string }) {
  const [mode, setMode] = useState<"login" | "signup">("login"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const client = browserDb();
      const email = String(form.get("email")),
        password = String(form.get("password"));
      if (mode === "signup") {
        const { error } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: String(form.get("name")) },
          },
        });
        if (error) throw error;
        setMessage("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.assign(
          next.startsWith("/") &&
            !next.startsWith("//") &&
            !next.includes("\\") &&
            !/[\u0000-\u001f]/.test(next)
            ? next
            : "/account",
        );
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-card">
      <p className="eyebrow">YOUR MULABA</p>
      <h1>{mode === "login" ? "Welcome back." : "Make yourself at home."}</h1>
      <p>
        {mode === "login"
          ? "Sign in to your account to continue."
          : "Create an account to shop and follow your orders."}
      </p>
      <form onSubmit={submit}>
        {mode === "signup" && (
          <label>
            Full name
            <Input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
            />
          </label>
        )}
        <label>
          Email address
          <Input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <Input
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            minLength={8}
            maxLength={128}
          />
        </label>
        {message && <p role="status">{message}</p>}
        <Button disabled={busy} className="w-full">
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>
      <Button
        variant="ghost"
        className="w-full"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setMessage("");
        }}
      >
        {mode === "login"
          ? "New here? Create an account"
          : "Already have an account? Sign in"}
      </Button>
    </div>
  );
}
