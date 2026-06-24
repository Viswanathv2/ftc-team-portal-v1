import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import RoleMultiSelect from "./RoleMultiSelect";

export default function AlumniAdminTab() {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [formData, setFormData] = useState({ name: "", role: "", year: "", bio: "" });

  useEffect(() => {
    loadAlumni();
  }, []);

  async function loadAlumni() {
    setLoading(true);
    const { data, error } = await supabase.from("alumni").select("id,name,role,year,bio").order("sort_order", { ascending: true });
    if (!error && data) {
      setAlumni(data);
    }
    setLoading(false);
  }

  async function addAlumnus() {
    if (!formData.name.trim()) {
      setStatus({ type: "error", message: "Name is required" });
      return;
    }
    const { error } = await supabase.from("alumni").insert({ ...formData, is_active: true });
    if (error) {
      setStatus({ type: "error", message: `Failed: ${error.message}` });
    } else {
      setFormData({ name: "", role: "", year: "", bio: "" });
      setStatus({ type: "success", message: "Alumni member added!" });
      loadAlumni();
    }
  }

  async function deleteAlumnus(id) {
    if (!confirm("Delete this alumni member?")) return;
    const { error } = await supabase.from("alumni").delete().eq("id", id);
    if (error) {
      setStatus({ type: "error", message: `Failed: ${error.message}` });
    } else {
      setStatus({ type: "success", message: "Alumni member deleted!" });
      loadAlumni();
    }
  }

  if (loading) return <p>Loading alumni...</p>;

  return (
    <div className="admin-section">
      <h2>Manage Alumni</h2>
      {status.message && <p className={status.type}>{status.message}</p>}

      <div className="admin-form">
        <h3>Add Alumni Member</h3>
        <label htmlFor="alumniName">Name</label>
        <input id="alumniName" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
        <label htmlFor="alumniRole">Roles</label>
        <RoleMultiSelect id="alumniRole" value={formData.role} onChange={(role) => setFormData((p) => ({ ...p, role }))} />
        <label htmlFor="alumniYear">Year</label>
        <input id="alumniYear" value={formData.year} onChange={(e) => setFormData((p) => ({ ...p, year: e.target.value }))} />
        <label htmlFor="alumniBio">Bio</label>
        <textarea id="alumniBio" value={formData.bio} onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))} />
        <button className="admin-save-btn" onClick={addAlumnus}>
          Add Alumni Member
        </button>
      </div>

      <div className="alumni-list">
        <h3>Current Alumni</h3>
        {alumni.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Year</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alumni.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.role || "-"}</td>
                  <td>{member.year || "-"}</td>
                  <td>
                    <button className="admin-delete-btn" onClick={() => deleteAlumnus(member.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No alumni yet.</p>
        )}
      </div>
    </div>
  );
}
