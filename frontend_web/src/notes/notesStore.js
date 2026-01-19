import { ApiError, apiClient, getApiConfig } from "../api/client";

const DEMO_KEY = "smartnote.demoNotes";

/**
 * Local-only demo notes for when the backend isn't configured.
 * Stored in localStorage to keep the app usable without a server.
 */
function loadDemoNotes() {
  try {
    const raw = window.localStorage.getItem(DEMO_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  const seed = [
    {
      id: "demo-1",
      title: "Welcome to SmartNote",
      content: "This is a local demo note.\n\nSet `REACT_APP_API_BASE` to connect to a backend.",
      tags: ["welcome", "demo"],
      pinned: true,
      favorite: true,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: "demo-2",
      title: "Markdown supported",
      content: "Try **bold**, _italic_, lists, and headings.\n\n- Notes\n- Tags\n- AI actions (needs backend)\n",
      tags: ["markdown"],
      pinned: false,
      favorite: false,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
  ];
  window.localStorage.setItem(DEMO_KEY, JSON.stringify(seed));
  return seed;
}

function saveDemoNotes(notes) {
  window.localStorage.setItem(DEMO_KEY, JSON.stringify(notes));
}

function shouldUseDemoFallback(err) {
  const cfg = getApiConfig();
  if (!cfg.apiBaseUrl) return true;
  if (err instanceof ApiError && err.code === "NO_API_BASE") return true;
  // Fetch failures often manifest as TypeError in browsers; treat as missing backend.
  if (err instanceof TypeError) return true;
  return false;
}

// PUBLIC_INTERFACE
export async function listNotesWithFallback() {
  /** Lists notes from backend when available; otherwise uses local demo notes. */
  try {
    const notes = await apiClient.listNotes();
    return Array.isArray(notes) ? notes : [];
  } catch (e) {
    if (shouldUseDemoFallback(e)) return loadDemoNotes();
    throw e;
  }
}

// PUBLIC_INTERFACE
export async function createNoteWithFallback(note) {
  /** Creates note via backend or local demo storage. */
  try {
    return await apiClient.createNote(note);
  } catch (e) {
    if (!shouldUseDemoFallback(e)) throw e;
    const notes = loadDemoNotes();
    const now = new Date().toISOString();
    const created = {
      id: `demo-${Math.random().toString(16).slice(2)}`,
      title: note.title || "Untitled",
      content: note.content || "",
      tags: Array.isArray(note.tags) ? note.tags : [],
      pinned: !!note.pinned,
      favorite: !!note.favorite,
      createdAt: now,
      updatedAt: now
    };
    const next = [created, ...notes];
    saveDemoNotes(next);
    return created;
  }
}

// PUBLIC_INTERFACE
export async function updateNoteWithFallback(id, patch) {
  /** Updates note via backend or local demo storage. */
  try {
    return await apiClient.updateNote(id, patch);
  } catch (e) {
    if (!shouldUseDemoFallback(e)) throw e;
    const notes = loadDemoNotes();
    const idx = notes.findIndex((n) => n.id === id);
    if (idx < 0) throw new ApiError("Note not found.", { code: "NOT_FOUND" });
    const next = [...notes];
    next[idx] = { ...next[idx], ...patch, updatedAt: new Date().toISOString() };
    saveDemoNotes(next);
    return next[idx];
  }
}

// PUBLIC_INTERFACE
export async function deleteNoteWithFallback(id) {
  /** Deletes note via backend or local demo storage. */
  try {
    return await apiClient.deleteNote(id);
  } catch (e) {
    if (!shouldUseDemoFallback(e)) throw e;
    const notes = loadDemoNotes();
    const next = notes.filter((n) => n.id !== id);
    saveDemoNotes(next);
    return { ok: true };
  }
}
