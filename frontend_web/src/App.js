import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./layout/AppShell";
import AuthPage from "./pages/AuthPage";
import NotesPage from "./pages/NotesPage";
import SettingsPage from "./pages/SettingsPage";
import TagsPage from "./pages/TagsPage";
import { useAuth } from "./auth/AuthContext";

// PUBLIC_INTERFACE
function ProtectedApp() {
  /** Routes that require authentication. */
  const auth = useAuth();
  if (!auth.isAuthenticated) return <Navigate to="/auth?mode=signin" replace />;
  return (
    <AppShell>
      <Routes>
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/notes" replace />} />
      </Routes>
    </AppShell>
  );
}

// PUBLIC_INTERFACE
export default function App() {
  /** SPA router for SmartNote. */
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/*" element={<ProtectedApp />} />
    </Routes>
  );
}
