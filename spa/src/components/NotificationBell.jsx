import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

// Bell shown to any signed-in member. Notifications come from three sources:
//   * announcements        -> every signed-in member is notified, click -> /schedule
//   * learning_resources   -> every signed-in member is notified (except the
//                             uploader), click -> /learning
//   * interest_submissions -> only coaches / portal admins, click -> /admin
// A member can "clear" a notification just for themselves; that records a row in
// notification_dismissals keyed by their user id (ids are globally-unique uuids).
export default function NotificationBell() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isManager = Boolean(profile?.isCoach || profile?.isPortalAdmin);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager, user?.id]);

  async function load() {
    const queries = [
      supabase
        .from("announcements")
        .select("id,title,created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("notification_dismissals").select("submission_id").eq("user_id", user.id),
      supabase
        .from("learning_resources")
        .select("id,title,uploader_id,uploader_name,created_at")
        .order("created_at", { ascending: false })
        .limit(50)
    ];
    // Only managers receive interest-form notifications.
    if (isManager) {
      queries.push(
        supabase
          .from("interest_submissions")
          .select("id,kind,full_name,team_location,created_at")
          .order("created_at", { ascending: false })
          .limit(50)
      );
    }

    const [annResp, dismissedResp, resourceResp, interestResp] = await Promise.all(queries);
    const dismissedIds = new Set((dismissedResp.data || []).map((d) => d.submission_id));

    const announcements = (annResp.data || []).map((a) => ({
      id: a.id,
      type: "announcement",
      title: `Announcement: ${a.title}`,
      created_at: a.created_at,
      to: "/schedule"
    }));

    // Notify everyone about new resources, except the member who uploaded it.
    const resources = (resourceResp?.data || [])
      .filter((r) => r.uploader_id !== user.id)
      .map((r) => ({
        id: r.id,
        type: "resource",
        title: `New resource: ${r.title}`,
        created_at: r.created_at,
        to: "/learning"
      }));

    const interest = (interestResp?.data || []).map((s) => ({
      id: s.id,
      type: "interest",
      title:
        s.kind === "join"
          ? `Join request: ${s.full_name || "Someone"}`
          : `New team onboarding: ${s.team_location || "New team"}`,
      created_at: s.created_at,
      to: "/admin"
    }));

    const merged = [...announcements, ...resources, ...interest]
      .filter((n) => !dismissedIds.has(n.id))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setItems(merged);
  }

  async function clearOne(n) {
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    await supabase
      .from("notification_dismissals")
      .upsert(
        { user_id: user.id, submission_id: n.id, notif_type: n.type },
        { onConflict: "user_id,submission_id" }
      );
  }

  async function clearAll() {
    const rows = items.map((n) => ({
      user_id: user.id,
      submission_id: n.id,
      notif_type: n.type
    }));
    setItems([]);
    if (rows.length) {
      await supabase
        .from("notification_dismissals")
        .upsert(rows, { onConflict: "user_id,submission_id" });
    }
  }

  if (!user) return null;

  const count = items.length;

  return (
    <li className="notif-item" ref={ref}>
      <button
        type="button"
        className="notif-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Notifications${count ? ` (${count} new)` : ""}`}
        title="Notifications"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm6-6v-5a6 6 0 0 0-4.5-5.8V4a1.5 1.5 0 0 0-3 0v1.2A6 6 0 0 0 6 11v5l-1.7 1.7a1 1 0 0 0 .7 1.3h14a1 1 0 0 0 .7-1.3L18 16z"
          />
        </svg>
        {count > 0 && <span className="notif-badge">{count > 9 ? "9+" : count}</span>}
      </button>

      {open && (
        <div className="notif-dropdown" role="menu">
          <div className="notif-dropdown-head">
            <strong>Notifications</strong>
            {count > 0 && (
              <button type="button" className="notif-clear-all" onClick={clearAll}>
                Clear all
              </button>
            )}
          </div>
          {count === 0 ? (
            <p className="notif-empty">You&apos;re all caught up.</p>
          ) : (
            <ul className="notif-list">
              {items.map((n) => (
                <li key={`${n.type}:${n.id}`} className="notif-row">
                  <button
                    type="button"
                    className="notif-row-main"
                    onClick={() => {
                      setOpen(false);
                      navigate(n.to);
                    }}
                  >
                    <span className="notif-row-title">{n.title}</span>
                    <span className="notif-row-time">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="notif-row-clear"
                    onClick={() => clearOne(n)}
                    aria-label="Clear notification"
                    title="Clear"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
