import React, { useMemo, useState } from "react";
import { useNotesList } from "../notes/useNotes";

function normalizeTags(tags) {
  const arr = Array.isArray(tags) ? tags : [];
  return arr
    .map((t) => String(t || "").trim())
    .filter(Boolean)
    .filter((t, i, self) => self.indexOf(t) === i);
}

// PUBLIC_INTERFACE
export default function TagsPage() {
  /** Tags module: view tags and notes per tag (client-side). */
  const notesQ = useNotesList();
  const notes = useMemo(() => (Array.isArray(notesQ.data) ? notesQ.data : []), [notesQ.data]);
  const [activeTag, setActiveTag] = useState("");

  const tags = useMemo(() => {
    const map = new Map();
    for (const n of notes) {
      for (const t of normalizeTags(n.tags)) {
        map.set(t, (map.get(t) || 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  const filtered = useMemo(() => {
    if (!activeTag) return [];
    return notes
      .filter((n) => normalizeTags(n.tags).includes(activeTag))
      .slice()
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  }, [notes, activeTag]);

  return (
    <div className="panel">
      <div className="row-between">
        <h1 className="h1">Tags</h1>
        <span className="badge">{tags.length} tags</span>
      </div>

      <hr className="hr" />

      {notesQ.isLoading ? <div className="muted">Loading…</div> : null}
      {notesQ.isError ? <div className="muted">Could not load tags: {notesQ.error?.message || "Error"}</div> : null}

      {!notesQ.isLoading && !notesQ.isError ? (
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className={`pill pill-btn ${activeTag === "" ? "pill-active" : ""}`} onClick={() => setActiveTag("")} type="button">
            All
          </button>
          {tags.map(([t, count]) => (
            <button
              key={t}
              className={`pill pill-btn ${activeTag === t ? "pill-active" : ""}`}
              onClick={() => setActiveTag((x) => (x === t ? "" : t))}
              type="button"
            >
              #{t} <span className="muted">({count})</span>
            </button>
          ))}
        </div>
      ) : null}

      {activeTag ? (
        <div style={{ marginTop: 14 }} className="stack">
          <h2 className="h2">Notes tagged #{activeTag}</h2>
          {filtered.length === 0 ? (
            <div className="muted">No notes for this tag.</div>
          ) : (
            filtered.map((n) => (
              <div key={n.id} className="card" style={{ padding: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>{n.title || "Untitled"}</div>
                <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                  Updated {n.updatedAt ? new Date(n.updatedAt).toLocaleString() : "—"}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ marginTop: 14 }} className="muted">
          Select a tag to view matching notes.
        </div>
      )}
    </div>
  );
}
