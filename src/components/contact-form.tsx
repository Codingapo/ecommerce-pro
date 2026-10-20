"use client";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { ArrowUpRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.email("Please enter a valid email address.").max(254),
  phone: z.string().trim().max(40),
  subject: z.string().trim().min(3, "Please add a subject.").max(120),
  message: z.string().trim().min(10, "Please write at least 10 characters.").max(1500),
});
export function ContactForm({ email }: { email: string | null }) {
  const [status, setStatus] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget).entries());
    const parsed = inquirySchema.safeParse(fields);
    if (!parsed.success) { setStatus(parsed.error.issues[0]?.message || "Check your details."); return; }
    const data = parsed.data;
    const body = data.message + "\n\nName: " + data.name + "\nEmail: " + data.email + (data.phone ? "\nPhone: " + data.phone : "");
    window.location.href = "mailto:" + email + "?subject=" + encodeURIComponent(data.subject) + "&body=" + encodeURIComponent(body);
    setStatus("Your email app has been requested. Send the draft there to complete your enquiry. If it did not open, use the email link beside this form.");
  }
  return <form className="inquiry-form" onSubmit={submit} aria-describedby="inquiry-note">
    <div className="inquiry-form-heading"><span className="support-icon"><Mail size={22}/></span><div><h3>Let’s talk.</h3><p>A question about a piece, an order, or something else?</p></div></div>
    <div className="inquiry-fields">
      <label htmlFor="inquiry-name">Name <span aria-hidden="true">*</span><input id="inquiry-name" name="name" autoComplete="name" required minLength={2} maxLength={100}/></label>
      <label htmlFor="inquiry-email">Email <span aria-hidden="true">*</span><input id="inquiry-email" name="email" type="email" autoComplete="email" required maxLength={254}/></label>
      <label htmlFor="inquiry-phone">Phone <span className="optional">(optional)</span><input id="inquiry-phone" name="phone" type="tel" autoComplete="tel" maxLength={40}/></label>
      <label htmlFor="inquiry-subject">Subject <span aria-hidden="true">*</span><input id="inquiry-subject" name="subject" required minLength={3} maxLength={120}/></label>
      <label htmlFor="inquiry-message" className="inquiry-wide">Message <span aria-hidden="true">*</span><textarea id="inquiry-message" name="message" rows={5} required minLength={10} maxLength={1500}/></label>
    </div>
    <p id="inquiry-note" className="inquiry-note">{email ? "This form prepares a draft in your email app. Nothing is sent until you send it there." : "Contact is not connected in this demo. You can explore the form; messages cannot be sent yet."}</p>
    <Button type="submit" disabled={!email}>Open email draft <ArrowUpRight size={18}/></Button>
    <p role="status" aria-live="polite" className="inquiry-status">{status}</p>
  </form>;
}
