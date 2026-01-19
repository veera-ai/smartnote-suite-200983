import React from "react";
import { getApiConfig } from "../api/client";

// PUBLIC_INTERFACE
export default function SettingsPage() {
  /** Settings page: shows env-driven configuration and expected API surface. */
  const cfg = getApiConfig();

  return (
    <div className="panel">
      <div className="row-between">
        <h1 className="h1">Settings</h1>
        <span className="badge">Developer</span>
      </div>

      <hr className="hr" />

      <div className="stack">
        <div className="card" style={{ padding: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 13 }}>Runtime configuration</div>
          <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
            API Base: <span className="kbd">{cfg.apiBaseUrl || "not set"}</span>
          </div>
          <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
            WS URL: <span className="kbd">{cfg.wsUrl || "not set"}</span>
          </div>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 13 }}>Env vars</div>
          <div className="muted" style={{ marginTop: 6 }}>
            <div>
              <span className="kbd">REACT_APP_API_BASE</span> (preferred) – e.g. <span className="kbd">https://api.example.com</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <span className="kbd">REACT_APP_BACKEND_URL</span> (fallback) – same format as API base
            </div>
            <div style={{ marginTop: 6 }}>
              <span className="kbd">REACT_APP_WS_URL</span> (optional) – websocket endpoint for future real-time features
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 13 }}>Expected backend endpoints (minimal)</div>
          <div className="muted" style={{ marginTop: 6 }}>
            <div>
              <span className="kbd">POST /auth/login</span> → <span className="kbd">{`{ accessToken, refreshToken, user }`}</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <span className="kbd">POST /auth/register</span> → <span className="kbd">{`{ accessToken, refreshToken, user }`}</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <span className="kbd">POST /auth/refresh</span> → <span className="kbd">{`{ accessToken, refreshToken?, user? }`}</span>
            </div>

            <div style={{ marginTop: 10 }}>
              <span className="kbd">GET /notes</span>, <span className="kbd">POST /notes</span>, <span className="kbd">GET /notes/:id</span>,{" "}
              <span className="kbd">PATCH /notes/:id</span>, <span className="kbd">DELETE /notes/:id</span>
            </div>

            <div style={{ marginTop: 10 }}>
              <span className="kbd">POST /ai/title</span>, <span className="kbd">POST /ai/summarize</span>, <span className="kbd">POST /ai/expand</span>
            </div>
          </div>
        </div>

        <div className="muted" style={{ fontSize: 12 }}>
          If no backend is configured, SmartNote runs in local demo mode using browser storage.
        </div>
      </div>
    </div>
  );
}
