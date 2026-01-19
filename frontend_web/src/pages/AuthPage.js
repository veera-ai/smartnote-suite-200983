import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, getApiConfig } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useToasts } from "../ui/ToastContext";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// PUBLIC_INTERFACE
export default function AuthPage() {
  /** Authentication screen (sign-in / sign-up) with validation and env-driven backend. */
  const auth = useAuth();
  const toasts = useToasts();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const mode = params.get("mode") === "signup" ? "signup" : "signin";

  const apiBase = getApiConfig().apiBaseUrl;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const title = mode === "signup" ? "Create your account" : "Welcome back";
  const subtitle = mode === "signup" ? "Sign up to start organizing your notes." : "Sign in to continue to SmartNote.";

  const validation = useMemo(() => {
    const errs = [];
    if (mode === "signup" && name.trim().length < 2) errs.push("Name must be at least 2 characters.");
    if (!validateEmail(email)) errs.push("Enter a valid email address.");
    if (password.length < 8) errs.push("Password must be at least 8 characters.");
    return errs;
  }, [mode, name, email, password]);

  async function submit(e) {
    e.preventDefault();
    setFormError("");

    if (validation.length) {
      setFormError(validation[0]);
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        await auth.register({ name: name.trim(), email: email.trim(), password });
        toasts.success("Account created", "You are now signed in.");
      } else {
        await auth.login({ email: email.trim(), password });
        toasts.success("Signed in", "Welcome back.");
      }
      nav("/notes");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof TypeError
            ? "Could not reach the backend. Check REACT_APP_API_BASE / REACT_APP_BACKEND_URL."
            : "Sign in failed.";
      setFormError(msg);
      toasts.error("Authentication error", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <div className="navbar">
        <div className="brand">
          <div className="brand-badge" aria-hidden="true" />
          <div>
            <p className="brand-title">SmartNote</p>
            <p className="brand-subtitle">Ocean Professional</p>
          </div>
        </div>
        <div className="nav-actions">
          <span className="badge">{apiBase ? "API connected" : "Local demo mode"}</span>
        </div>
      </div>

      <div className="content">
        <div className="panel" style={{ maxWidth: 520, margin: "0 auto" }}>
          <div className="stack">
            <div>
              <h1 className="h1">{title}</h1>
              <div className="muted" style={{ marginTop: 6 }}>
                {subtitle}
              </div>
            </div>

            <hr className="hr" />

            <form className="stack" onSubmit={submit}>
              {mode === "signup" ? (
                <div className="field">
                  <label className="label" htmlFor="name">
                    Name
                  </label>
                  <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </div>
              ) : null}

              <div className="field">
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
                <div className="muted" style={{ fontSize: 12 }}>
                  Minimum 8 characters.
                </div>
              </div>

              {formError ? (
                <div className="card" style={{ borderColor: "rgba(239,68,68,0.35)", padding: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>Fix this</div>
                  <div className="muted" style={{ marginTop: 6 }}>
                    {formError}
                  </div>
                </div>
              ) : null}

              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
              </button>

              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setParams({ mode: mode === "signup" ? "signin" : "signup" })}
              >
                {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
              </button>
            </form>

            <div className="muted" style={{ fontSize: 12 }}>
              Tokens are stored in memory only. Refresh uses <span className="kbd">/auth/refresh</span> if configured.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
