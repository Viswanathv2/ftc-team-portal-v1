import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const TYPES = {
  coach: { table: "coaches", singular: "Coach", plural: "Coaches" },
  mentor: { table: "mentors", singular: "Mentor", plural: "Mentors" }
};

export default function StaffAdminTab() {
  const [type, setType] = useState("coach");
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [formData, setFormData] = useState({ name: "", role: "", bio: "" });

  const config = TYPES[type];

  useEffect(() => {
    loadPeople();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function loadPeople() {
    setLoading(true);
    const { data, error } = await supabase.from(config.table).select("id,name,role,bio").order("sort_order", { ascending: true });
    if (!error && data) {
      setPeople(data);
    } else {
      setPeople([]);
    }
    setLoading(false);
  }

  async function addPerson() {
    if (!formData.name.trim()) {
      setStatus({ type: "error", message: "Name is required" });
      return;
    }
    const { error } = await supabase.from(config.table).insert({ ...formData, is_active: true });
    if (error) {
      setStatus({ type: "error", message: `Failed: ${error.message}` });
    } else {
      setFormData({ name: "", role: "", bio: "" });
      setStatus({ type: "success", message: `${config.singular} added!` });
      loadPeople();
    }
  }

  async function deletePerson(id) {
    if (!confirm(`Delete this ${config.singular.toLowerCase()}?`)) return;
    const { error } = await supabase.from(config.table).delete().eq("id", id);
    if (error) {
      setStatus({ type: "error", message: `Failed: ${error.message}` });
    } else {
      setStatus({ type: "success", message: `${config.singular} deleted!` });
      loadPeople();
    }
  }

  function changeType(value) {
    setType(value);
    setFormData({ name: "", role: "", bio: "" });
    setStatus({ type: "", message: "" });
  }

  return (
    <div className="admin-section">
      <h2>Manage Coaches &amp; Mentors</h2>

      <div className="admin-form">
        <label htmlFor="staffType">Type</label>
        <select id="staffType" value={type} onChange={(e) => changeType(e.target.value)}>
          <option value="coach">Coach</option>
          <option value="mentor">Mentor</option>
        </select>
      </div>

      {status.message && <p className={status.type}>{status.message}</p>}

      <div className="admin-form">
        <h3>Add {config.singular}</h3>
        <label htmlFor="staffName">Name</label>
        <input id="staffName" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
        <label htmlFor="staffRole">Role (comma-separated)</label>
        <input id="staffRole" value={formData.role} onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))} />
        <label htmlFor="staffBio">Bio</label>
        <textarea id="staffBio" value={formData.bio} onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))} />
        <button className="admin-save-btn" onClick={addPerson}>
          Add {config.singular}
        </button>
      </div>

      <div className="members-list">
        <h3>Current {config.plural}</h3>
        {loading ? (
          <p>Loading {config.plural.toLowerCase()}...</p>
        ) : people.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person.id}>
                  <td>{person.name}</td>
                  <td>{person.role || "-"}</td>
                  <td>
                    <button className="admin-delete-btn" onClick={() => deletePerson(person.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No {config.plural.toLowerCase()} yet.</p>
        )}
      </div>
    </div>
  );
}
