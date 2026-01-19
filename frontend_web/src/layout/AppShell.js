import React, { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { getApiConfig } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme/ThemeContext";

function NavItem({ to, label, shortcut }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `pill pill-btn ${isActive ? "pill-active" : ""}`}
      style={{ textDecoration: "none", justifyContent: "space-between", width: "100%" }}
    >
      <span>{label}</span>
      {shortcut ? <span className="kbd">{shortcut}</span> : null}
    </NavLink>
  );
}

// PUBLIC_INTERFACE
export default function AppShell({ children }) {
  /** Main authenticated app layout (navbar + sidebar + content). */
  const { theme, toggleTheme } = useTheme();
  const auth = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const apiBase = getApiConfig().apiBaseUrl;
  const userLabel = useMemo(() => auth.user?.name || auth.user?.email || "User", [auth.user]);

  return (
    <div className={`App shell ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="navbar">
        <div className="brand">
          <button className="btn btn-sm btn-ghost" onClick={() => setSidebarOpen((s) => !s)} aria-label="Toggle sidebar">
            ☰
          </button>
          <div className="brand-badge" aria-hidden="true" />
          <div>
            <p className="brand-title">SmartNote</p>
            <p className="brand-subtitle">{apiBase ? "Connected" : "Local demo mode"}</p>
          </div>
        </div>

        <div className="nav-actions">
          <button className="btn btn-sm" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? "Dark" : "Light"}
          </button>
          <span className="badge">{userLabel}</span>
          <button className="btn btn-sm btn-danger" onClick={auth.logout}>
            Sign out
          </button>
        </div>
      </div>

      {sidebarOpen ? <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" /> : null}

      <div className="main">
        <aside className="sidebar" aria-label="Sidebar navigation">
          <div className="sidebar-inner">
            <div className="sidebar-section-title">Navigation</div>
            <NavItem to="/notes" label="Notes" shortcut="G N" />
            <NavItem to="/tags" label="Tags" shortcut="G T" />
            <NavItem to="/settings" label="Settings" shortcut="G S" />

            <div className="sidebar-section-title">Tips</div>
            <div className="card" style={{ padding: 12 }}>
              <div className="muted" style={{ fontSize: 12 }}>
                Search is debounced. Editor autosaves changes. AI actions require backend endpoints.
              </div>
            </div>
          </div>
        </aside>

        <main className="content" onClick={() => sidebarOpen && setSidebarOpen(false)}>
          {children}
        </main>
      </div>
    </div>
  );
}
