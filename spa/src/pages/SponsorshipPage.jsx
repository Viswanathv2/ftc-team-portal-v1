import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import RouteLoading from "../components/RouteLoading";
import { usePortalPage } from "../hooks/usePortalPage";
import { useTrackVisit } from "../hooks/useTrackVisit";
import { supabase } from "../lib/supabase";
import {
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID,
  EMAILJS_PUBLIC_KEY,
  emailjsConfigured
} from "../config/emailjs";

const SPONSOR_EMAIL = "viswanathv2@gmail.com";

export default function SponsorshipPage() {
  const page = usePortalPage("sponsorship");
  useTrackVisit("sponsorship");
  const [sponsors, setSponsors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    level: "",
    message: ""
  });

  useEffect(() => {
    let isMounted = true;
    async function loadSponsors() {
      const { data } = await supabase
        .from("sponsors")
        .select("id,name,website_url,statement,logo_url,sort_order")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (isMounted) setSponsors(Array.isArray(data) ? data : []);
    }
    loadSponsors();
    return () => {
      isMounted = false;
    };
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function sendViaMailto() {
    const subject = `Sponsorship Inquiry from ${form.name}${
      form.organization ? ` (${form.organization})` : ""
    }`;
    const bodyLines = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone || "—"}`,
      `Organization / Company: ${form.organization || "—"}`,
      `Sponsorship Level: ${form.level || "Not sure yet"}`,
      "",
      "Message:",
      form.message || "(none)"
    ];
    const mailto = `mailto:${SPONSOR_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.location.href = mailto;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setError("Please provide a phone number or an email address so we can reach you.");
      return;
    }

    const { error: insertError } = await supabase.from("interest_submissions").insert({
      kind: "sponsor",
      full_name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      team_location: form.organization.trim() || null,
      student_count: form.level || null,
      additional_info: form.message.trim() || null,
      status: "New",
      created_at: new Date().toISOString()
    });

    if (insertError) {
      setError(`Sorry, we couldn't submit your form: ${insertError.message}`);
      return;
    }

    // Submission saved to interest_submissions. Skip email delivery for now.
    setSubmitted(true);
    setSending(false);
  }

  function resetForm() {
    setForm({ name: "", email: "", phone: "", organization: "", level: "", message: "" });
    setSubmitted(false);
    setError("");
  }

  if (page.loading) {
    return <RouteLoading />;
  }

  return (
    <section className="landing-page">
      <header className="landing-header">
        <h1>{page.title || "Sponsors"}</h1>
        <p className="landing-tagline">{page.subtitle || "Our Supporters"}</p>
      </header>
      <div className="landing-container">
        <section className="landing-section sponsorship-section">
          <p className="sponsors-intro">
            Architechs is powered by the generosity of our sponsors. Their investment funds
            components, travel, registration fees, and our outreach programs.
          </p>

          {sponsors.length ? (
            <div className="current-sponsors">
              <h3>Our Sponsors</h3>
              <p className="current-sponsors-lead">
                We are deeply grateful to the partners who believe in our students and make our
                season possible. Thank you for fueling curiosity, teamwork, and engineering.
              </p>
              <div className="sponsor-grid">
                {sponsors.map((s) => {
                  const card = (
                    <>
                      <div className="sponsor-card-logo">
                        {s.logo_url ? (
                          <img src={s.logo_url} alt={s.name} loading="lazy" />
                        ) : (
                          <span className="sponsor-card-initial">{s.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="sponsor-card-name">{s.name}</div>
                      {s.statement ? <p className="sponsor-card-statement">{s.statement}</p> : null}
                    </>
                  );
                  return s.website_url ? (
                    <a
                      key={s.id}
                      className="sponsor-card"
                      href={s.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {card}
                    </a>
                  ) : (
                    <div key={s.id} className="sponsor-card">
                      {card}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="sponsorship-levels">
            <h3>Sponsorship Levels</h3>

            <div className="sponsor-level platinum">
              <h4>Platinum Sponsor – $2000+</h4>
              <ul>
                <li>Logo on robot</li>
                <li>Logo on team shirts</li>
                <li>Social media recognition</li>
                <li>Logo on engineering portfolio &amp; pit display</li>
                <li>Invitation to team events</li>
              </ul>
            </div>

            <div className="sponsor-level gold">
              <h4>Gold Sponsor – $1000+</h4>
              <ul>
                <li>Logo on pit display</li>
                <li>Social media recognition</li>
                <li>Acknowledgment in team documents</li>
              </ul>
            </div>

            <div className="sponsor-level silver">
              <h4>Silver Sponsor – $500+</h4>
              <ul>
                <li>Social media recognition</li>
                <li>Listed as a supporter on our materials</li>
                <li>Thank-you mention on social media (Friends of the Team – Any Amount)</li>
              </ul>
            </div>
          </div>

          <div className="sponsors-getintouch">
            <h3>Interested in sponsoring Architechs?</h3>
            <p>Your support helps us compete, learn, and inspire students to pursue engineering.</p>
            {!showForm && (
              <button type="button" className="download-btn" onClick={() => setShowForm(true)}>
                Get in Touch ↗
              </button>
            )}
          </div>

          {showForm && (
            <div className="sponsor-form-card">
              {submitted ? (
                <div className="sponsor-success">
                  <h3>Thank you!</h3>
                  <p>
                    {emailjsConfigured
                      ? "Your inquiry has been sent to our team. We'll be in touch soon!"
                      : "Your email app should have opened with your inquiry ready to send. If it didn't, you can email us directly at "}
                    {!emailjsConfigured && <strong>{SPONSOR_EMAIL}</strong>}
                    {!emailjsConfigured && "."}
                  </p>
                  <button type="button" className="sponsor-link-btn" onClick={resetForm}>
                    Submit another
                  </button>
                </div>
              ) : (
                <form className="sponsor-form" onSubmit={handleSubmit}>
                  <div className="sponsor-form-title">Express Interest</div>
                  <p className="sponsor-form-sub">
                    Fill this out and we&apos;ll get back to you about sponsoring the team.
                  </p>

                  <label className="sponsor-label" htmlFor="spName">Full Name</label>
                  <input
                    id="spName"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Your full name"
                  />

                  <label className="sponsor-label" htmlFor="spEmail">
                    Email Address <span className="sponsor-optional">(optional if phone provided)</span>
                  </label>
                  <input
                    id="spEmail"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@company.com"
                  />

                  <label className="sponsor-label" htmlFor="spPhone">
                    Phone Number <span className="sponsor-optional">(optional if email provided)</span>
                  </label>
                  <input
                    id="spPhone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />

                  <label className="sponsor-label" htmlFor="spOrg">Organization / Company</label>
                  <input
                    id="spOrg"
                    type="text"
                    value={form.organization}
                    onChange={(e) => update("organization", e.target.value)}
                    placeholder="Your business or organization"
                  />

                  <label className="sponsor-label" htmlFor="spLevel">Sponsorship Level</label>
                  <select
                    id="spLevel"
                    value={form.level}
                    onChange={(e) => update("level", e.target.value)}
                  >
                    <option value="">Select a level...</option>
                    <option value="Platinum Sponsor – $2000+">Platinum – $2000+</option>
                    <option value="Gold Sponsor – $1000+">Gold – $1000+</option>
                    <option value="Silver Sponsor – $500+">Silver – $500+</option>
                    <option value="Friends of the Team – Any Amount">Friends – Any Amount</option>
                    <option value="Not sure yet">Not sure yet</option>
                  </select>

                  <label className="sponsor-label" htmlFor="spMessage">
                    Tell us about your interest <span className="sponsor-optional">(optional)</span>
                  </label>
                  <textarea
                    id="spMessage"
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder="Any questions, ideas, or details about your support..."
                  />

                  <button
                    type="submit"
                    className="admin-save-btn sponsor-submit-btn"
                    disabled={sending}
                  >
                    {sending ? "Sending\u2026" : "Submit Application \u203a"}
                  </button>
                  {error && <p className="sponsor-form-error">{error}</p>}
                  <p className="sponsor-form-note">
                    We review on a rolling basis. You&apos;ll hear from us within a week.
                  </p>
                </form>
              )}
            </div>
          )}

          <div className="sponsorship-contact">
            <p><strong>Questions?</strong></p>
            <p>
              Email us:{" "}
              <a href={`mailto:${page.contactEmail || SPONSOR_EMAIL}`}>
                {page.contactEmail || SPONSOR_EMAIL}
              </a>
            </p>
            <p>
              Phone: <a href="tel:+15855206852">585 520 6852</a>
            </p>
            <p>
              <a
                href="/Need%20Sponsorship.pdf"
                className="download-btn"
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Sponsorship Document (PDF)
              </a>
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}
