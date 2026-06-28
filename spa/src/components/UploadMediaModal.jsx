import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const BUCKET = "event-media";

const CATEGORIES = [
  { value: "game", label: "Matches" },
  { value: "party", label: "Team Fun" },
  { value: "outreach", label: "Outreach" },
  { value: "workout", label: "Brainstorming" },
  { value: "design", label: "Design" },
  { value: "other", label: "Other" }
];

// Upload modal for logged-in members: drag-and-drop zone, live preview,
// caption + title fields, and a category selector. On success it returns the
// freshly-inserted row so the gallery can show it instantly with a NEW badge.
export default function UploadMediaModal({ onClose, onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isVideo, setIsVideo] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState({ title: "", caption: "", event_type: "game" });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function chooseFile(f) {
    if (!f) return;
    if (!f.type.startsWith("image") && !f.type.startsWith("video")) {
      setError("Please choose an image or video file.");
      return;
    }
    setError("");
    setFile(f);
    setIsVideo(f.type.startsWith("video"));
    setPreviewUrl(URL.createObjectURL(f));
    if (!form.title) {
      setForm((p) => ({ ...p, title: f.name.replace(/\.[^.]+$/, "") }));
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    chooseFile(e.dataTransfer.files?.[0]);
  }

  async function submit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a photo or video first.");
      return;
    }
    if (!form.title.trim()) {
      setError("Please add a short title.");
      return;
    }
    setUploading(true);
    setError("");

    const ext = file.name.split(".").pop();
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${form.event_type}/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const mediaType = isVideo ? "video" : "image";

    const { data, error: insertError } = await supabase
      .from("event_media")
      .insert({
        title: form.title.trim(),
        event_type: form.event_type,
        caption: form.caption.trim() || null,
        media_url: publicData.publicUrl,
        media_type: mediaType,
        storage_path: path
      })
      .select("id,title,event_type,event_date,caption,media_url,media_type,created_at")
      .single();

    if (insertError) {
      setError(`Saved file but could not add to gallery: ${insertError.message}`);
      setUploading(false);
      return;
    }

    onUploaded(data);
  }

  return (
    <div
      className="upload-modal-overlay"
      onClick={(e) => {
        if (e.target.classList.contains("upload-modal-overlay")) onClose();
      }}
    >
      <div className="upload-modal" role="dialog" aria-modal="true">
        <div className="upload-modal-head">
          <h3>Upload Media</h3>
          <button type="button" className="upload-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form className="upload-modal-form" onSubmit={submit}>
          <div
            className={`upload-dropzone${dragging ? " dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            {previewUrl ? (
              <div className="upload-preview">
                {isVideo ? (
                  <video src={previewUrl} muted />
                ) : (
                  <img src={previewUrl} alt="Preview" />
                )}
              </div>
            ) : (
              <div className="upload-dropzone-hint">
                <span className="upload-dropzone-icon">⬆</span>
                <span>Drag &amp; drop a photo or video here, or click to browse</span>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              style={{ display: "none" }}
              onChange={(e) => chooseFile(e.target.files?.[0])}
            />
          </div>

          <label className="upload-label" htmlFor="upTitle">Title</label>
          <input
            id="upTitle"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="What is this?"
          />

          <label className="upload-label" htmlFor="upCategory">Category</label>
          <select
            id="upCategory"
            value={form.event_type}
            onChange={(e) => setForm((p) => ({ ...p, event_type: e.target.value }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <label className="upload-label" htmlFor="upCaption">Caption (optional)</label>
          <textarea
            id="upCaption"
            value={form.caption}
            onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))}
            placeholder="Add a short description"
          />

          {error ? <p className="upload-error">{error}</p> : null}

          <div className="upload-modal-actions">
            <button type="button" className="admin-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-save-btn" disabled={uploading}>
              {uploading ? "Uploading…" : "Add to Gallery"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
