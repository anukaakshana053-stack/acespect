"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("reviewer@acespect.app");
  const [password, setPassword] = useState("Review123");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ accessToken: string; user: { role: string } }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) },
      );
      if (res.user.role !== "REVIEWER" && res.user.role !== "ADMIN") {
        throw new Error("This account is not a reviewer.");
      }
      setToken(res.accessToken);
      router.push("/inspections");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <div className="brand" style={{ marginBottom: 4 }}>
          ACE <span>SPECT</span>
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          Reviewer sign in
        </p>
        {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        <div className="spacer" />
        <label>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
        />
        <div className="spacer" />
        <button className="primary" style={{ width: "100%" }} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
