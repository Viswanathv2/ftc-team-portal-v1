import { useEffect, useMemo, useState } from "react";
import RouteLoading from "../components/RouteLoading";
import { usePortalPage } from "../hooks/usePortalPage";
import { useTrackVisit } from "../hooks/useTrackVisit";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

// Small circular placeholder avatar
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23e5e8f0'/%3E%3Ccircle cx='40' cy='32' r='16' fill='%23a8aec4'/%3E%3Cpath d='M 10 74 Q 10 50 40 50 Q 70 50 70 74 Z' fill='%23a8aec4'/%3E%3C/svg%3E";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Completed", "Blocked"];

function statusClass(status) {
  switch (status) {
    case "Completed":
      return "task-status-completed";
    case "In Progress":
      return "task-status-progress";
    case "Blocked":
      return "task-status-blocked";
    default:
      return "task-status-pending";
  }
}

const emptyTask = { task: "", start_date: "", end_date: "", status: "Not Started" };

export default function SchedulePage() {
  const page = usePortalPage("schedule");
  useTrackVisit("schedule");
  const { user, profile } = useAuth();

  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [newTask, setNewTask] = useState(emptyTask);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);

  const isCoach = Boolean(profile?.isCoach || profile?.isPortalAdmin);
  const myEmail = String(user?.email || "").trim().toLowerCase();

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [membersResp, coachesResp, mentorsResp, tasksResp, announcementsResp] = await Promise.all([
      supabase
        .from("team_members")
        .select("id,name,roles,image_url,email")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("coaches")
        .select("id,name,role,image_url,email")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("mentors")
        .select("id,name,role,image_url,email")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("tasks")
        .select("id,member_id,member_type,task,start_date,end_date,status,sort_order,created_at")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("announcements")
        .select("id,title,body,author_name,created_at")
        .order("created_at", { ascending: false })
        .limit(50)
    ]);

    const teamMembers = (Array.isArray(membersResp.data) ? membersResp.data : []).map((m) => ({
      ...m,
      type: "team_member",
      typeLabel: "Member"
    }));
    const coaches = (Array.isArray(coachesResp.data) ? coachesResp.data : []).map((m) => ({
      ...m,
      type: "coach",
      typeLabel: "Coach"
    }));
    const mentors = (Array.isArray(mentorsResp.data) ? mentorsResp.data : []).map((m) => ({
      ...m,
      type: "mentor",
      typeLabel: "Mentor"
    }));

    setMembers([...teamMembers, ...coaches, ...mentors]);
    setTasks(Array.isArray(tasksResp.data) ? tasksResp.data : []);
    setAnnouncements(Array.isArray(announcementsResp.data) ? announcementsResp.data : []);
    setLoading(false);
  }

  async function deleteAnnouncement(id) {
    if (!confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) {
      setStatus({ type: "error", message: `Failed: ${error.message}` });
    } else {
      setStatus({ type: "success", message: "Announcement deleted." });
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }
  }

  const selectedMember = useMemo(
    () => members.find((m) => `${m.type}:${m.id}` === selectedKey) || null,
    [members, selectedKey]
  );

  const memberTasks = useMemo(
    () =>
      selectedMember
        ? tasks.filter((t) => t.member_id === selectedMember.id && t.member_type === selectedMember.type)
        : [],
    [tasks, selectedMember]
  );

  const taskCounts = useMemo(() => {
    const counts = {};
    for (const t of tasks) {
      const key = `${t.member_type}:${t.member_id}`;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [tasks]);

  // Can the current user edit this member's tasks (start/end/status)?
  const isOwnBoard = Boolean(
    selectedMember && myEmail && String(selectedMember.email || "").trim().toLowerCase() === myEmail
  );
  const canEditDates = isCoach || isOwnBoard;

  async function addTask() {
    if (!newTask.task.trim()) {
      setStatus({ type: "error", message: "Task name is required" });
      return;
    }
    const { error } = await supabase.from("tasks").insert({
      member_id: selectedMember.id,
      member_type: selectedMember.type,
      task: newTask.task.trim(),
      start_date: newTask.start_date || null,
      end_date: newTask.end_date || null,
      status: newTask.status
    });
    if (error) {
      setStatus({ type: "error", message: `Failed: ${error.message}` });
    } else {
      setNewTask(emptyTask);
      setStatus({ type: "success", message: "Task assigned!" });
      loadAll();
    }
  }

  async function updateTaskField(id, field, value) {
    // optimistic UI update
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
    const payload = { [field]: field.endsWith("_date") ? value || null : value };
    const { error } = await supabase.from("tasks").update(payload).eq("id", id);
    if (error) {
      setStatus({ type: "error", message: `Save failed: ${error.message}` });
      loadAll();
    }
  }

  async function deleteTask(id) {
    if (!confirm("Delete this task?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      setStatus({ type: "error", message: `Failed: ${error.message}` });
    } else {
      setStatus({ type: "success", message: "Task deleted!" });
      loadAll();
    }
  }

  if (page.loading || loading) {
    return <RouteLoading />;
  }

  return (
    <section className="landing-page">
      <header className="landing-header">
        <h1>{page.title || "Team Activities"}</h1>
        <p className="landing-tagline">{page.subtitle || "Tasks and assignments for Team 25795"}</p>
      </header>

      <div className="landing-container">
        {status.message && (
          <p className={status.type} role="status">{status.message}</p>
        )}

        {!selectedMember ? (
          <section className="landing-section">
            <div className="announcements-block">
              <button
                type="button"
                className="announcements-toggle"
                onClick={() => setAnnouncementsOpen((v) => !v)}
                aria-expanded={announcementsOpen}
              >
                <span className="announcements-caret" aria-hidden="true">
                  {announcementsOpen ? "▾" : "▸"}
                </span>
                Announcements
                {announcements.length > 0 && (
                  <span className="announcements-count">{announcements.length}</span>
                )}
              </button>

              {announcementsOpen && (
                announcements.length ? (
                  <ul className="announcement-list">
                    {announcements.map((a) => (
                      <li key={a.id} className="announcement-card">
                        <div className="announcement-head">
                          <h3>{a.title}</h3>
                          {isCoach && (
                            <button
                              type="button"
                              className="admin-delete-btn"
                              onClick={() => deleteAnnouncement(a.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        {a.body && <p className="announcement-body">{a.body}</p>}
                        <p className="announcement-meta">
                          {a.author_name || "Coach"} · {new Date(a.created_at).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="announcement-empty">No announcements yet.</p>
                )
              )}
            </div>

            <h2>Team Members</h2>
            {members.length ? (
              <div className="activity-grid">
                {members.map((member) => {
                  const key = `${member.type}:${member.id}`;
                  const count = taskCounts[key] || 0;
                  return (
                    <button
                      key={key}
                      type="button"
                      className="activity-tile"
                      onClick={() => {
                        setSelectedKey(key);
                        setStatus({ type: "", message: "" });
                        setNewTask(emptyTask);
                      }}
                    >
                      <span className="activity-avatar">
                        <img src={member.image_url || DEFAULT_AVATAR} alt={member.name} />
                      </span>
                      <span className="activity-tile-info">
                        <span className="activity-tile-name">{member.name}</span>
                        <span className="activity-tile-meta">
                          {member.typeLabel} · {count} task{count === 1 ? "" : "s"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p>No active team members yet.</p>
            )}
          </section>
        ) : (
          <section className="landing-section">
            <div className="activity-board-head">
              <button type="button" className="activity-back" onClick={() => setSelectedKey(null)}>
                ← All members
              </button>
              <div className="activity-board-title">
                <span className="activity-avatar small">
                  <img src={selectedMember.image_url || DEFAULT_AVATAR} alt={selectedMember.name} />
                </span>
                <h2>{selectedMember.name}</h2>
                <span className="activity-type-badge">{selectedMember.typeLabel}</span>
              </div>
            </div>

            {isCoach && (
              <div className="task-add-form">
                <h3>Assign a Task</h3>
                <div className="task-add-grid">
                  <input
                    placeholder="Task description"
                    value={newTask.task}
                    onChange={(e) => setNewTask((p) => ({ ...p, task: e.target.value }))}
                  />
                  <input
                    type="date"
                    aria-label="Start date"
                    value={newTask.start_date}
                    onChange={(e) => setNewTask((p) => ({ ...p, start_date: e.target.value }))}
                  />
                  <input
                    type="date"
                    aria-label="End date"
                    value={newTask.end_date}
                    onChange={(e) => setNewTask((p) => ({ ...p, end_date: e.target.value }))}
                  />
                  <select
                    aria-label="Status"
                    value={newTask.status}
                    onChange={(e) => setNewTask((p) => ({ ...p, status: e.target.value }))}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button type="button" className="admin-save-btn" onClick={addTask}>
                    Assign
                  </button>
                </div>
              </div>
            )}

            {memberTasks.length ? (
              <div className="task-table-wrap">
                <table className="task-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                      {isCoach && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {memberTasks.map((t) => (
                      <tr key={t.id}>
                        <td>
                          {isCoach ? (
                            <input
                              className="task-input"
                              value={t.task}
                              onChange={(e) => updateTaskField(t.id, "task", e.target.value)}
                            />
                          ) : (
                            t.task
                          )}
                        </td>
                        <td>
                          {canEditDates ? (
                            <input
                              type="date"
                              className="task-input"
                              value={t.start_date || ""}
                              onChange={(e) => updateTaskField(t.id, "start_date", e.target.value)}
                            />
                          ) : (
                            t.start_date || "—"
                          )}
                        </td>
                        <td>
                          {canEditDates ? (
                            <input
                              type="date"
                              className="task-input"
                              value={t.end_date || ""}
                              onChange={(e) => updateTaskField(t.id, "end_date", e.target.value)}
                            />
                          ) : (
                            t.end_date || "—"
                          )}
                        </td>
                        <td>
                          {canEditDates ? (
                            <select
                              className={`task-input task-status-select ${statusClass(t.status)}`}
                              value={t.status}
                              onChange={(e) => updateTaskField(t.id, "status", e.target.value)}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`task-status-badge ${statusClass(t.status)}`}>{t.status}</span>
                          )}
                        </td>
                        {isCoach && (
                          <td>
                            <button className="admin-delete-btn" onClick={() => deleteTask(t.id)}>
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No tasks assigned yet.</p>
            )}

            {!canEditDates && (
              <p className="activity-hint">
                Sign in with this member&apos;s email to update task dates and status.
              </p>
            )}
          </section>
        )}
      </div>
    </section>
  );
}
