import React, { useState, useEffect } from "react";
import axios from "axios";

const LabRequestsList = () => {
  const [labRequests, setLabRequests] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({});
  const token = localStorage.getItem("token");

  // ✅ جلب الطلبات
  const fetchLabRequests = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/labs/doctor/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLabRequests(res.data);
    } catch (err) {
      console.error("❌ Error fetching lab requests:", err);
    }
  };

  useEffect(() => {
    fetchLabRequests();
  }, []);

  // ✅ بدأ التعديل
  const startEdit = (r) => {
    setEditingRow(r.id);
    setEditForm({
      testName: r.testName,
      notes: r.notes,
    });
  };

  // ✅ تعديل الحقول
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ حفظ التعديل
  const handleSave = async (id) => {
    try {
      await axios.put(`http://localhost:8080/api/labs/${id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Lab request updated!");
      setEditingRow(null);
      fetchLabRequests();
    } catch (err) {
      console.error("❌ Error updating lab request:", err);
      alert("Error updating lab request");
    }
  };

  // ❌ حذف
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/api/labs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("🗑️ Lab request deleted!");
      fetchLabRequests();
    } catch (err) {
      console.error("❌ Error deleting lab request:", err);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🧪 Lab Requests List</h2>
      <table
        className="data-table"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Test Name</th>
            <th>Notes</th>
            <th>Member</th>
            <th>Status</th>
            <th>Lab Technician</th>
            <th>Created At</th>
            <th>Result</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {labRequests.map((r) => (
            <React.Fragment key={r.id}>
              <tr>
                <td>{r.testName}</td>
                <td>{r.notes}</td>
                <td>{r.memberName}</td>
                <td>{r.status}</td>
                <td>{r.status === "COMPLETED" ? r.labTechName || "—" : "—"}</td>

                {/* ✅ تاريخ منسق */}
                <td>
                  {new Date(r.createdAt).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>

                {/* ✅ زر Download إذا COMPLETED */}
                <td>
                  {r.status === "COMPLETED" && r.resultUrl ? (
                    <a
                      href={`http://localhost:8080${r.resultUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        backgroundColor: "#10B981",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontWeight: "600",
                      }}
                      download
                    >
                      <span>⬇️</span> <span>Download</span>
                    </a>
                  ) : (
                    <span style={{ color: "#6B7280" }}>No Result</span>
                  )}
                </td>

                {/* ✅ Actions */}
                <td>
  {/* ✅ Edit يظهر فقط لو PENDING */}
  {r.status === "PENDING" && (
    <button
      onClick={() => startEdit(r)}
      style={{
        marginRight: "8px",
        padding: "6px 12px",
        backgroundColor: "#3B82F6",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      ✏️ Edit
    </button>
  )}
               {/* ✅ Delete يظهر دائماً، بس يتعطل لو COMPLETED */}
  <button
    onClick={() => r.status !== "COMPLETED" && handleDelete(r.id)}
    disabled={r.status === "COMPLETED"}
    style={{
      padding: "6px 12px",
      backgroundColor: r.status === "COMPLETED" ? "#9CA3AF" : "#EF4444", // رمادي لو COMPLETED
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: r.status === "COMPLETED" ? "not-allowed" : "pointer",
    }}
  >
    🗑️ Delete
  </button>
</td>
              </tr>

              {/* ✅ Form للتعديل يظهر بس لو PENDING */}
              {editingRow === r.id && r.status === "PENDING" && (
                <tr>
                  <td colSpan="8">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSave(r.id);
                      }}
                      style={{
                        display: "flex",
                        gap: "1rem",
                        alignItems: "center",
                        padding: "1rem",
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        marginTop: "0.5rem",
                      }}
                    >
                      <input
                        type="text"
                        name="testName"
                        value={editForm.testName}
                        onChange={handleChange}
                        placeholder="Test Name"
                        style={{
                          flex: 1,
                          padding: "8px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "6px",
                        }}
                      />
                      <input
                        type="text"
                        name="notes"
                        value={editForm.notes}
                        onChange={handleChange}
                        placeholder="Notes"
                        style={{
                          flex: 2,
                          padding: "8px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "6px",
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          padding: "8px 14px",
                          backgroundColor: "#10B981",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        ✅ Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingRow(null)}
                        style={{
                          padding: "8px 14px",
                          backgroundColor: "#6B7280",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        ❌ Cancel
                      </button>
                    </form>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LabRequestsList;
