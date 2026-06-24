import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import RoleMultiSelect from "./RoleMultiSelect";

export default function TeamMembersAdminTab() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [formData, setFormData] = useState({ name: "", roles: "", grade: "", bio: "" });

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    const { data, error } = await supabase.from("team_members").select("id,name,roles,grade,bio").order("sort_order", { ascending: true });
    if (!error && data) {
      setMembers(data);
    }
    setLoading(false);
  }

  async function addMember() {
    if (!formData.name.trim()) {
      setStatus({ type: "error", message: "Name is required" });
      return;
    }
    const { error } = await supabase.from("team_members").insert({ ...formData, is_active: true });
    if (error) {
      setStatus({ type: "error", message: `Failed: ${error.message}` });
    } else {
      setFormData({ name: "", roles: "", grade: "", bio: "" });
      setStatus({ type: "success", message: "Member added!" });
      loadMembers();
    }
  }

  async function deleteMember(id) {
    if (!confirm("Delete this member?")) return;
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) {
      setStatus({ type: "error", message: `Failed: ${error.message}` });
    } else {
      setStatus({ type: "success", message: "Member deleted!" });
      loadMembers();
    }
  }

  if (loading) return <p>Loading team members...</p>;

  return (
    <div className="admin-section">
      <h2>Manage Team Members</h2>
      {status.message && <p className={status.type}>{status.message}</p>}

      <div className="admin-form">
        <h3>Add Team Member</h3>
        <label htmlFor="memberName">Name</label>
        <input id="memberName" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
        <label htmlFor="memberRoles">Roles</label>
        <RoleMultiSelect id="memberRoles" value={formData.roles} onChange={(roles) => setFormData((p) => ({ ...p, roles }))} />
        <label htmlFor="memberGrade">Grade</label>
        <input id="memberGrade" value={formData.grade} onChange={(e) => setFormData((p) => ({ ...p, grade: e.target.value }))} />
        <label htmlFor="memberBio">Bio</label>
        <textarea id="memberBio" value={formData.bio} onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))} />
        <button className="admin-save-btn" onClick={addMember}>
          Add Member
        </button>
      </div>

      <div className="members-list">
        <h3>Current Members</h3>
        {members.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Roles</th>
                <th>Grade</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.roles || "-"}</td>
                  <td>{member.grade || "-"}</td>
                  <td>
                    <button className="admin-delete-btn" onClick={() => deleteMember(member.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No team members yet.</p>
        )}
      </div>
    </div>
  );
}
