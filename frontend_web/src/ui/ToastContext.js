import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

let nextId = 1;

// PUBLIC_INTERFACE
export function ToastProvider({ children }) {
  /** Provides toast notifications for non-blocking feedback. */
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = nextId++;
      const ttlMs = toast.ttlMs ?? 4500;
      const item = { id, type: toast.type || "info", title: toast.title, description: toast.description, ttlMs };
      setToasts((t) => [item, ...t].slice(0, 4));
      window.setTimeout(() => remove(id), ttlMs);
      return id;
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      toasts,
      push,
      remove,
      // Convenience helpers
      info: (title, description) => push({ type: "info", title, description }),
      success: (title, description) => push({ type: "success", title, description }),
      error: (title, description) => push({ type: "error", title, description })
    }),
    [toasts, push, remove]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-host" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type === "error" ? "toast-error" : t.type === "success" ? "toast-success" : ""}`}
            role="status"
          >
            <p className="toast-title">{t.title}</p>
            {t.description ? <p className="toast-desc">{t.description}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useToasts() {
  /** Hook to push toasts. */
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts must be used within ToastProvider");
  return ctx;
}
