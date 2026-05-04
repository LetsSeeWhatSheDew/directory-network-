"use client";

import { useState } from "react";

export default function ClaimForm({ slug }: { slug: string }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("email_reply");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_slug: slug,
          claimant_name: name,
          claimant_role: role,
          claimant_email: email,
          claimant_phone: phone,
          verification_method: method,
          message,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
      } else {
        setError(data.error || "Could not submit. Try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={styles.thanks}>
        <div style={styles.thanksTitle}>Thanks!</div>
        <div style={styles.thanksBody}>
          We&apos;ll verify and transfer the listing within 24 hours. Check your email.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={styles.form}>
      <Field label="Your name" value={name} onChange={setName} required placeholder="Jane Doe" />
      <Field label="Your role" value={role} onChange={setRole} required placeholder="Owner, manager, GM…" />
      <Field label="Email" type="email" value={email} onChange={setEmail} required placeholder="you@dispensary.com" />
      <Field label="Phone" type="tel" value={phone} onChange={setPhone} placeholder="(309) 555-0123" />

      <div style={styles.field}>
        <label style={styles.label}>How should we verify?</label>
        <label style={styles.radio}>
          <input type="radio" name="method" value="email_reply" checked={method === "email_reply"} onChange={() => setMethod("email_reply")} />
          <span>I&apos;ll reply from the dispensary&apos;s email</span>
        </label>
        <label style={styles.radio}>
          <input type="radio" name="method" value="phone_call" checked={method === "phone_call"} onChange={() => setMethod("phone_call")} />
          <span>Call me to verify</span>
        </label>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Anything else we should know? <span style={styles.optional}>(optional)</span></label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Context, URLs, social links, etc."
          rows={3}
          style={styles.textarea}
        />
      </div>

      <button type="submit" disabled={submitting} style={styles.submit}>
        {submitting ? "Submitting…" : "Submit claim request"}
      </button>

      {error && <div style={styles.err}>{error}</div>}
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}{required && <span style={{ color: "#dc2626" }}> *</span>}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        style={styles.input}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    background: "#fff",
    border: "1px solid #e8e4da",
    borderRadius: 14,
    padding: 24,
  },
  field: { marginBottom: 18 },
  label: {
    display: "block",
    fontSize: ".8rem",
    fontWeight: 600,
    color: "#1F3D2B",
    fontFamily: "system-ui, sans-serif",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: ".05em",
  },
  optional: { color: "#9ca3af", fontWeight: 400, textTransform: "none", letterSpacing: 0 },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1cfc6",
    borderRadius: 8,
    fontFamily: "system-ui, sans-serif",
    fontSize: ".92rem",
    color: "#1F3D2B",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1cfc6",
    borderRadius: 8,
    fontFamily: "system-ui, sans-serif",
    fontSize: ".9rem",
    color: "#1F3D2B",
    outline: "none",
    resize: "vertical",
  },
  radio: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    border: "1px solid #d1cfc6",
    borderRadius: 8,
    fontFamily: "system-ui, sans-serif",
    fontSize: ".88rem",
    color: "#374151",
    marginBottom: 6,
    cursor: "pointer",
  },
  submit: {
    width: "100%",
    background: "#7DBA47",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "12px 20px",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 700,
    fontSize: ".95rem",
    cursor: "pointer",
    marginTop: 6,
  },
  err: {
    marginTop: 12,
    padding: "10px 14px",
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: 8,
    fontFamily: "system-ui, sans-serif",
    fontSize: ".85rem",
  },
  thanks: {
    background: "#F2F8E9",
    border: "1px solid #C7E5A8",
    borderRadius: 14,
    padding: 24,
    textAlign: "center",
  },
  thanksTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#3F6B1F",
    marginBottom: 8,
  },
  thanksBody: {
    fontSize: ".9rem",
    color: "#3F6B1F",
    fontFamily: "system-ui, sans-serif",
  },
};
