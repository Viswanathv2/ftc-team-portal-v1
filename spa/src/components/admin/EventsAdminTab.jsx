import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const EVENT_TYPES = [
  { value: "game", label: "Game" },
  { value: "party", label: "Party" },
  { value: "outreach", label: "Outreach" },
  { value: "workout", label: "Workout Session" },
  { value: "design", label: "Design" },
  { value: "other", label: "Other" }
];

const BUCKET = "event-media";
const emptyMedia = { title: "", event_type: "game", event_date: "", caption: "" };
const emptyAchv = { season: "", event_name: "", event_date: "", location: "", score: "", result: "" };

export default function EventsAdminTab() {
  const [section, setSection] = useState("media");

  // ---- Event media state --------------------------------------------------
  const [mediaList, setMediaList] = useState([]);
  const [mediaForm, setMediaForm] = useState(emptyMedia);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ---- Achievements state -------------------------------------------------
  const [achievements, setAchievements] = useState([]);
  const [achvForm, setAchvForm] = useState(emptyAchv);

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [mediaResp, achvResp] = await Promise.all([
      supabase.from("event_media").select("*").order("event_date", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("achievements").select("*").order("season", { ascending: false }).order("sort_order", { ascending: true })
    ]);
    setMediaList(Array.isArray(mediaResp.data) ? mediaResp.data : []);
    setAchievements(Array.isArray(achvResp.data) ? achvResp.data : []);
    setLoading(false);
  }

  // ---- Media upload -------------------------------------------------------
  async function uploadMedia() {
    if (!mediaForm.title.trim()) {
      setStatus({ type: "error", message: "Title is required" });
      return;
    }
    if (!file) {
      setStatus({ type: "error", message: "Please choose a photo or video file" });
      return;
    }

    setUploading(true);
    setStatus({ type: "", message: "" });

    const ext = file.name.split(".").pop();
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${mediaForm.event_type}/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setStatus({ type: "error", message: `Upload failed: ${uploadError.message}` });
      setUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const mediaType = file.type.startsWith("video") ? "video" : "image";

    const { error: insertError } = await supabase.from("event_media").insert({
      title: mediaForm.title,
      event_type: mediaForm.event_type,
      event_date: mediaForm.event_date || null,
      caption: mediaForm.caption,
      media_url: publicData.publicUrl,
      media_type: mediaType,
      storage_path: path
    });

    if (insertError) {
      setStatus({ type: "error", message: `Saved file but DB insert failed: ${insertError.message}` });
    } else {
      setMediaForm(emptyMedia);
      setFile(null);
      setStatus({ type: "success", message: "Media uploaded!" });
      loadAll();
    }
    setUploading(false);
  }

  async function deleteMedia(item) {
    if (!confirm("Delete this media?")) return;
    if (item.storage_path) {
      await supabase.storage.from(BUCKET).remove([item.storage_path]);
    }
    const { error } = await supabase.from("event_media").delete().eq("id", item.id);
    if (error) {
      setStatus({ type: "error", message: `Failed: ${error.message}` });
    } else {
      setStatus({ type: "success", message: "Media deleted!" });
      loadAll();
    }
  }

  // ---- Achievements -------------------------------------------------------
  async function addAchievement() {
    if (!achvForm.season.trim() || !achvForm.event_name.trim()) {
      setStatus({ type: "error", message: "Season and event name are required" });
      return;
    }
    const { error } = await supabase.from("achievements").insert({ ...achvForm });
    if (error) {
      setStatus({ type: "error", message: `Failed: ${error.message}` });
    } else {
      setAchvForm(emptyAchv);
      setStatus({ type: "success", message: "Achievement added!" });
      loadAll();
    }
  }

  async function deleteAchievement(id) {
    if (!confirm("Delete this achievement?")) return;
    const { error } = await supabase.from("achievements").delete().eq("id", id);
    if (error) {
      setStatus({ type: "error", message: `Failed: ${error.message}` });
    } else {
      setStatus({ type: "success", message: "Achievement deleted!" });
      loadAll();
    }
  }

  return (
    <div className="admin-section">
      <h2>Team Story — Events &amp; Achievements</h2>

      <div className="admin-form">
        <label htmlFor="storySection">Section</label>
        <select id="storySection" value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="media">Event Photos &amp; Videos</option>
          <option value="achievements">Season Achievements</option>
        </select>
      </div>

      {status.message && <p className={status.type}>{status.message}</p>}

      {section === "media" ? (
        <>
          <div className="admin-form">
            <h3>Upload Photo / Video</h3>
            <label htmlFor="mediaTitle">Title</label>
            <input id="mediaTitle" value={mediaForm.title} onChange={(e) => setMediaForm((p) => ({ ...p, title: e.target.value }))} />

            <label htmlFor="mediaType">Event Type</label>
            <select id="mediaType" value={mediaForm.event_type} onChange={(e) => setMediaForm((p) => ({ ...p, event_type: e.target.value }))}>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <label htmlFor="mediaDate">Event Date</label>
            <input id="mediaDate" type="date" value={mediaForm.event_date} onChange={(e) => setMediaForm((p) => ({ ...p, event_date: e.target.value }))} />

            <label htmlFor="mediaCaption">Caption</label>
            <textarea id="mediaCaption" value={mediaForm.caption} onChange={(e) => setMediaForm((p) => ({ ...p, caption: e.target.value }))} />

            <label htmlFor="mediaFile">Photo or Video file</label>
            <input id="mediaFile" type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />

            <button className="admin-save-btn" onClick={uploadMedia} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload Media"}
            </button>
          </div>

          <div className="members-list">
            <h3>Uploaded Media</h3>
            {loading ? (
              <p>Loading…</p>
            ) : mediaList.length ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Media</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mediaList.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.event_type}</td>
                      <td>{item.event_date || "-"}</td>
                      <td>
                        <a href={item.media_url} target="_blank" rel="noopener noreferrer">
                          {item.media_type === "video" ? "▶ View" : "🖼 View"}
                        </a>
                      </td>
                      <td>
                        <button className="admin-delete-btn" onClick={() => deleteMedia(item)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No media uploaded yet.</p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="admin-form">
            <h3>Add Achievement</h3>
            <label htmlFor="achvSeason">Season</label>
            <input id="achvSeason" placeholder="e.g. 2024-25" value={achvForm.season} onChange={(e) => setAchvForm((p) => ({ ...p, season: e.target.value }))} />

            <label htmlFor="achvEvent">Event Name</label>
            <input id="achvEvent" value={achvForm.event_name} onChange={(e) => setAchvForm((p) => ({ ...p, event_name: e.target.value }))} />

            <label htmlFor="achvDate">Date</label>
            <input id="achvDate" placeholder="e.g. Dec 14, 2024" value={achvForm.event_date} onChange={(e) => setAchvForm((p) => ({ ...p, event_date: e.target.value }))} />

            <label htmlFor="achvLocation">Location</label>
            <input id="achvLocation" value={achvForm.location} onChange={(e) => setAchvForm((p) => ({ ...p, location: e.target.value }))} />

            <label htmlFor="achvScore">Score</label>
            <input id="achvScore" placeholder="e.g. 185 pts" value={achvForm.score} onChange={(e) => setAchvForm((p) => ({ ...p, score: e.target.value }))} />

            <label htmlFor="achvResult">Result / Award</label>
            <input id="achvResult" placeholder="e.g. 2nd Place / Inspire Award" value={achvForm.result} onChange={(e) => setAchvForm((p) => ({ ...p, result: e.target.value }))} />

            <button className="admin-save-btn" onClick={addAchievement}>Add Achievement</button>
          </div>

          <div className="members-list">
            <h3>Achievements</h3>
            {loading ? (
              <p>Loading…</p>
            ) : achievements.length ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Season</th>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Result</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {achievements.map((a) => (
                    <tr key={a.id}>
                      <td>{a.season}</td>
                      <td>{a.event_name}</td>
                      <td>{a.event_date || "-"}</td>
                      <td>{a.score || "-"}</td>
                      <td>{a.result || "-"}</td>
                      <td>
                        <button className="admin-delete-btn" onClick={() => deleteAchievement(a.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No achievements yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
