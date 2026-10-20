import Link from "next/link";
import { ArrowUpRight, ArrowUp, Mail, MapPin, MessageCircle, Plus, Quote, Star } from "lucide-react";
import { z } from "zod";
import { ContactForm } from "@/components/contact-form";

const questions = [
  ["How do I place an order?", "Find a piece you love in the shop, open its product page, and add it to your bag. Review your bag, sign in, and continue to checkout. In demo mode you can explore the shop and bag, but live orders are unavailable."],
  ["How can I pay?", "When live checkout is enabled, payments are processed through Paystack. The available payment methods appear on its secure payment page. Never send card details or passwords through the contact form."],
  ["Do you offer delivery?", "Delivery availability, charges and collection arrangements depend on the store. Confirm these details with the store before paying. The demo does not promise a delivery area or delivery date."],
  ["What is the returns process?", "Contact the store with your order number and the reason for your request before sending an item back. Ask for the applicable return conditions and instructions; this demo does not define a return window."],
  ["How can I get support?", "Use the contact section below. When the store has connected its contact details, you can prepare an email enquiry or open a WhatsApp conversation. Include your order number if your question is about an existing order."],
];
const examples = [
  { name:"Lerato M.", initials:"LM", quote:"The ordering process was clear and I received helpful updates throughout." },
  { name:"Thabo K.", initials:"TK", quote:"Lovely product selection and quick, friendly assistance on WhatsApp." },
  { name:"Naledi P.", initials:"NP", quote:"Everything was simple from browsing to arranging collection." },
];
export function StoreSections() {
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const parsedEmail = z.email().safeParse(process.env.STORE_CONTACT_EMAIL?.trim());
  const email = parsedEmail.success ? parsedEmail.data : null;
  const phone = (process.env.STORE_WHATSAPP_NUMBER || "").replace(/[\s()+-]/g, "");
  const whatsapp = /^[1-9]\d{7,14}$/.test(phone) ? phone : null;
  const address = process.env.STORE_CONTACT_ADDRESS?.trim();

  return <>
    <section className="kind-words" aria-labelledby="kind-words-heading">
      <div className="support-container">
        <div className="support-heading"><div><p className="eyebrow">KIND WORDS</p><h2 id="kind-words-heading">Customer <em>stories.</em></h2></div><p className="section-aside">{demo ? "A preview of how customer stories can look. All examples below are placeholders." : "Good pieces. Personal spaces. Stories worth sharing."}</p></div>
        {demo ? <div className="testimonial-grid">{examples.map(item => <figure className="testimonial-card" key={item.name}>
          <div className="testimonial-top"><span className="testimonial-stars" aria-label="Example five-star rating">{[1,2,3,4,5].map(n=><Star key={n} size={17} fill="currentColor" aria-hidden="true"/>)}</span><Quote size={26} aria-hidden="true"/></div>
          <blockquote>{item.quote}</blockquote><figcaption><span className="testimonial-avatar" aria-hidden="true">{item.initials}</span><span><strong>{item.name}</strong><small>Placeholder review · demo only</small></span></figcaption>
        </figure>)}</div> : <div className="stories-empty"><p>Customer stories will appear here once they are available.</p><a href="#contact" className="text-link">Share your experience <ArrowUpRight size={17}/></a></div>}
      </div>
    </section>
    <section id="faq" className="faq-section" aria-labelledby="faq-heading">
      <div className="support-container faq-container">
        <div className="faq-heading"><p className="eyebrow">NEED TO KNOW</p><h2 id="faq-heading">Frequently asked<br/><em>questions.</em></h2><p>A little clarity before you find your next favourite.</p></div>
        <div className="faq-list">{questions.map(([question,answer],index)=><details className="faq-item" name="store-questions" key={question}>
          <summary><span className="faq-number" aria-hidden="true">0{index+1}</span><span>{question}</span><Plus size={23} aria-hidden="true"/></summary><div className="faq-answer"><p>{answer}</p>{index===4 ? <a href="#contact" className="text-link">Get in touch <ArrowUpRight size={16}/></a> : null}</div>
        </details>)}</div>
        <p className="faq-followup">Still wondering about something? <a href="#contact">Let’s talk <ArrowUpRight size={15}/></a></p>
      </div>
    </section>
    <section id="contact" className="contact-section" aria-labelledby="contact-heading">
      <div className="support-container contact-grid">
        <div className="contact-copy"><p className="eyebrow">GET IN TOUCH</p><h2 id="contact-heading">We’re here<br/>to <em>help.</em></h2><p className="contact-intro">From finding the right piece to a question about your order. Start a conversation with us.</p>
          <div className="contact-methods">
            <div><span className="support-icon"><Mail size={21}/></span><div><span className="contact-label">EMAIL US</span>{email ? <a href={"mailto:"+email}>{email}</a> : <p>Email details coming soon</p>}</div></div>
            <div><span className="support-icon"><MessageCircle size={21}/></span><div><span className="contact-label">WHATSAPP</span>{whatsapp ? <a href={"https://wa.me/"+whatsapp}>+{whatsapp}</a> : <p>WhatsApp not connected yet</p>}</div></div>
            <div><span className="support-icon"><MapPin size={21}/></span><div><span className="contact-label">FIND US</span><p>{address || "Store location to be confirmed"}</p></div></div>
          </div>
          {whatsapp ? <a className="whatsapp-cta" href={"https://wa.me/"+whatsapp} target="_blank" rel="noopener noreferrer">Chat on WhatsApp <ArrowUpRight size={19}/></a> : <p className="contact-availability">Direct contact options will appear when the store publishes its details.</p>}
          <Link href="/account/orders" className="text-link contact-order-link">Looking for your orders? <ArrowUpRight size={17}/></Link>
        </div>
        <ContactForm email={email}/>
      </div>
    </section>
    <div className="back-top-row"><a href="#store-top" className="back-top" aria-label="Back to top">Back to top <ArrowUp size={18}/></a></div>
  </>;
}
