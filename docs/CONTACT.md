# PRO — storefront support sections

The homepage now includes accessible native FAQ accordions, customer story presentation, and a contact form based on the supplied design references. Header anchors link to FAQ and contact.

## Contact configuration
Set STORE_CONTACT_EMAIL, STORE_WHATSAPP_NUMBER (international country code + number) and STORE_CONTACT_ADDRESS in Vercel. Redeploy after updating settings. Only public business details belong in these variables.

The form validates with Zod and opens a mailto draft. It does not send mail directly or store enquiries. The user must send the draft from their email application. When the email address is missing or invalid, submit stays disabled with an explanation. A valid WhatsApp number enables the chat link. No fictitious contact information is shown.

## Customer stories
The three reference testimonials are placeholders, clearly labelled and displayed only when NEXT_PUBLIC_DEMO_MODE=true. Production shows a neutral empty state until genuine, consented testimonials are added. This is static marketing presentation, not a product review submission system. The Pro product review system is unchanged.

FAQ answers intentionally do not invent delivery regions, charges or return deadlines. Replace the relevant answers with the store's confirmed policies before launch.
