import React, { useEffect, useMemo, useRef, useState } from "react";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { ApiError, apiClient } from "../api/client";
import { useToasts } from "../ui/ToastContext";
import { debounce } from "../utils/debounce";

function tagsToString(tags) {
  return (Array.isArray(tags) ? tags : []).join(", ");
}

function stringToTags(s) {
  return String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((t, i, self) => self.indexOf(t) === i);
}

// PUBLIC_INTERFACE
export default function NoteEditor({ note, onPatch }) {
  /** Note editor: title + tags + flags + markdown body + autosave + AI actions. */
  const toasts = useToasts();

  const [title, setTitle] = useState(note.title || "");
  const [tagsRaw, setTagsRaw] = useState(tagsToString(note.tags));
  const [pinned, setPinned] = useState(!!note.pinned);
  const [favorite, setFavorite] = useState(!!note.favorite);
  const [content, setContent] = useState(note.content || "");

  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [aiBusy, setAiBusy] = useState(false);

  const lastSavedRef = useRef({
    title,
    tagsRaw,
    pinned,
    favorite,
    content
  });

  const mdeOptions = useMemo(
    () => ({
      spellChecker: false,
      autofocus: false,
      status: false,
      placeholder: "Write your note in Markdown…",
      toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "preview"]
    }),
    []
  );

  const commitPatch = useMemo(
    () =>
      debounce(async (patch) => {
        setSaveState("saving");
        try {
          await onPatch(patch);
          setSaveState("saved");
          window.setTimeout(() => setSaveState("idle"), 900);
        } catch {
          setSaveState("error");
          window.setTimeout(() => setSaveState("idle"), 1200);
        }
      }, 600),
    [onPatch]
  );

  // When local state changes, autosave if different from last saved snapshot.
  useEffect(() => {
    const next = { title, tagsRaw, pinned, favorite, content };
    const prev = lastSavedRef.current;
    const changed =
      next.title !== prev.title ||
      next.tagsRaw !== prev.tagsRaw ||
      next.pinned !== prev.pinned ||
      next.favorite !== prev.favorite ||
      next.content !== prev.content;

    if (!changed) return;

    const patch = {
      title: title || "Untitled",
      tags: stringToTags(tagsRaw),
      pinned,
      favorite,
      content
    };

    commitPatch(patch);
    lastSavedRef.current = next;
  }, [title, tagsRaw, pinned, favorite, content, commitPatch]);

  async function runAi(kind) {
    setAiBusy(true);
    try {
      const baseText = `${title ? `# ${title}\n\n` : ""}${content || ""}`.trim();
      if (!baseText) {
        toasts.info("Nothing to process", "Add some content first.");
        return;
      }

      if (kind === "title") {
        const data = await apiClient.aiTitle({ text: baseText });
        const newTitle = data?.title || "";
        if (!newTitle) throw new ApiError("AI returned no title.");
        setTitle(newTitle);
        toasts.success("Title generated", "Updated the note title.");
        return;
      }

      if (kind === "summarize") {
        const data = await apiClient.aiSummarize({ text: baseText });
        const summary = data?.summary || "";
        if (!summary) throw new ApiError("AI returned no summary.");
        setContent((c) => `${c}\n\n---\n\n## Summary\n\n${summary}\n`);
        toasts.success("Summary added", "Inserted summary at bottom of note.");
        return;
      }

      if (kind === "expand") {
        const data = await apiClient.aiExpand({ text: baseText });
        const expanded = data?.text || "";
        if (!expanded) throw new ApiError("AI returned no expanded text.");
        setContent(expanded);
        toasts.success("Text improved", "Replaced note body with improved text.");
        return;
      }
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof TypeError
            ? "AI endpoint unreachable. Configure backend and ensure /ai/* endpoints exist."
            : "AI action failed.";
      toasts.error("AI action unavailable", msg);
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="stack editor-shell">
      <div className="row-between">
        <div className="save-indicator" aria-live="polite">
          <span
            className={`dot ${saveState === "saving" ? "dot-saving" : saveState === "saved" ? "dot-saved" : saveState === "error" ? "dot-error" : ""}`}
            aria-hidden="true"
          />
          <span>
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
                ? "Saved"
                : saveState === "error"
                  ? "Save failed"
                  : "Autosave on"}
          </span>
        </div>

        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-sm btn-amber" onClick={() => runAi("title")} disabled={aiBusy}>
            Generate title
          </button>
          <button className="btn btn-sm" onClick={() => runAi("summarize")} disabled={aiBusy}>
            Summarize
          </button>
          <button className="btn btn-sm" onClick={() => runAi("expand")} disabled={aiBusy}>
            Expand/Improve
          </button>
        </div>
      </div>

      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }} className="field">
          <label className="label" htmlFor="title">
            Title
          </label>
          <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled" />
        </div>

        <div style={{ flex: 1, minWidth: 240 }} className="field">
          <label className="label" htmlFor="tags">
            Tags (comma-separated)
          </label>
          <input
            id="tags"
            className="input"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="e.g. work, ideas, research"
          />
        </div>
      </div>

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className={`pill pill-btn ${pinned ? "pill-active" : ""}`} onClick={() => setPinned((p) => !p)} type="button">
          📌 Pinned
        </button>
        <button className={`pill pill-btn ${favorite ? "pill-active" : ""}`} onClick={() => setFavorite((f) => !f)} type="button">
          ★ Favorite
        </button>
      </div>

      <SimpleMDE value={content} onChange={setContent} options={mdeOptions} />
    </div>
  );
}
