import React, { useEffect, useMemo, useState } from "react";
import { useToasts } from "../ui/ToastContext";
import { debounce } from "../utils/debounce";
import { useCreateNote, useDeleteNote, useNotesList, useUpdateNote } from "../notes/useNotes";
import NoteEditor from "../notes/NoteEditor";

function normalizeTags(tags) {
  const arr = Array.isArray(tags) ? tags : [];
  return arr
    .map((t) => String(t || "").trim())
    .filter(Boolean)
    .filter((t, i, self) => self.indexOf(t) === i);
}

// PUBLIC_INTERFACE
export default function NotesPage() {
  /** Notes module: list + filters + editor with autosave. */
  const toasts = useToasts();
  const notesQ = useNotesList();
  const createM = useCreateNote();
  const updateM = useUpdateNote();
  const deleteM = useDeleteNote();

  const [selectedId, setSelectedId] = useState(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");

  useEffect(() => {
    const fn = debounce((v) => setDebouncedQuery(v), 250);
    fn(query);
  }, [query]);

  const notes = useMemo(() => (Array.isArray(notesQ.data) ? notesQ.data : []), [notesQ.data]);

  // Select first note when list loads
  useEffect(() => {
    if (!selectedId && notes.length) setSelectedId(notes[0].id);
  }, [notes, selectedId]);

  const tags = useMemo(() => {
    const set = new Set();
    for (const n of notes) for (const t of normalizeTags(n.tags)) set.add(t);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [notes]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return notes
      .slice()
      .sort((a, b) => {
        const ap = a.pinned ? 1 : 0;
        const bp = b.pinned ? 1 : 0;
        if (ap !== bp) return bp - ap;
        const af = a.favorite ? 1 : 0;
        const bf = b.favorite ? 1 : 0;
        if (af !== bf) return bf - af;
        const ad = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bd = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bd - ad;
      })
      .filter((n) => {
        const matchesQuery = !q || (n.title || "").toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q);
        const matchesTag = !activeTag || normalizeTags(n.tags).includes(activeTag);
        return matchesQuery && matchesTag;
      });
  }, [notes, debouncedQuery, activeTag]);

  const selected = useMemo(() => filtered.find((n) => n.id === selectedId) || notes.find((n) => n.id === selectedId) || null, [
    filtered,
    notes,
    selectedId
  ]);

  async function createNewNote() {
    try {
      const created = await createM.mutateAsync({
        title: "Untitled",
        content: "",
        tags: [],
        pinned: false,
        favorite: false
      });
      toasts.success("Note created", "Start writing.");
      setSelectedId(created.id);
    } catch (e) {
      toasts.error("Could not create note", e.message || "Try again.");
    }
  }

  async function deleteSelected() {
    if (!selected) return;
    const ok = window.confirm(`Delete "${selected.title || "Untitled"}"? This cannot be undone.`);
    if (!ok) return;

    try {
      await deleteM.mutateAsync(selected.id);
      toasts.success("Deleted", "Note removed.");
      setSelectedId(null);
    } catch (e) {
      toasts.error("Could not delete note", e.message || "Try again.");
    }
  }

  return (
    <div className="grid-two">
      <div className="panel">
        <div className="row-between">
          <h1 className="h1">Notes</h1>
          <button className="btn btn-primary btn-sm" onClick={createNewNote} disabled={createM.isPending}>
            + New
          </button>
        </div>

        <div style={{ marginTop: 10 }} className="stack">
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            aria-label="Search notes"
          />

          <div className="row" style={{ flexWrap: "wrap" }}>
            <button className={`pill pill-btn ${activeTag === "" ? "pill-active" : ""}`} onClick={() => setActiveTag("")} type="button">
              All tags
            </button>
            {tags.map((t) => (
              <button
                key={t}
                className={`pill pill-btn ${activeTag === t ? "pill-active" : ""}`}
                onClick={() => setActiveTag((x) => (x === t ? "" : t))}
                type="button"
              >
                #{t}
              </button>
            ))}
          </div>

          <hr className="hr" />

          {notesQ.isLoading ? <div className="muted">Loading notes…</div> : null}

          {notesQ.isError ? (
            <div className="card" style={{ padding: 12, borderColor: "rgba(239,68,68,0.35)" }}>
              <div style={{ fontWeight: 800, fontSize: 13 }}>Could not load notes</div>
              <div className="muted" style={{ marginTop: 6 }}>
                {notesQ.error?.message || "Unexpected error."}
              </div>
            </div>
          ) : null}

          {!notesQ.isLoading && !notesQ.isError && filtered.length === 0 ? (
            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13 }}>No notes found</div>
              <div className="muted" style={{ marginTop: 6 }}>
                Try a different search or create a new note.
              </div>
            </div>
          ) : null}

          <div className="stack" style={{ gap: 10 }}>
            {filtered.map((n) => (
              <div key={n.id} className="card" style={{ borderColor: n.id === selectedId ? "rgba(37,99,235,0.45)" : undefined }}>
                <button className="card-btn" onClick={() => setSelectedId(n.id)}>
                  <div className="split">
                    <div style={{ fontWeight: 800, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.title || "Untitled"}
                    </div>
                    <div className="note-meta">
                      {n.pinned ? <span title="Pinned">📌</span> : null}
                      {n.favorite ? <span title="Favorite">★</span> : null}
                    </div>
                  </div>
                  <div className="note-meta" style={{ marginTop: 6 }}>
                    {(normalizeTags(n.tags).slice(0, 3) || []).map((t) => (
                      <span key={t} className="pill">
                        #{t}
                      </span>
                    ))}
                    <span className="muted">
                      {n.updatedAt ? new Date(n.updatedAt).toLocaleString() : n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                    </span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="row-between">
          <h2 className="h1" style={{ fontSize: 16 }}>
            Editor
          </h2>
          <div className="row">
            <button className="btn btn-danger btn-sm" onClick={deleteSelected} disabled={!selected || deleteM.isPending}>
              Delete
            </button>
          </div>
        </div>

        <hr className="hr" />

        {!selected ? (
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>Select a note</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Choose one from the list or create a new note.
            </div>
          </div>
        ) : (
          <NoteEditor
            key={selected.id}
            note={selected}
            onPatch={async (patch) => {
              try {
                await updateM.mutateAsync({ id: selected.id, patch });
              } catch (e) {
                toasts.error("Save failed", e.message || "Try again.");
                throw e;
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
