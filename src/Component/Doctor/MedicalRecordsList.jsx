import React, { useState, useEffect } from "react";
import axios from "axios";

const MedicalRecordsList = () => {
  const [records, setRecords] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({ diagnosis: "", treatment: "", notes: "" });
  const token = localStorage.getItem("token");

  const fetchRecords = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/medical-records/getAll", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(res.data);
    } catch (err) {
      console.error("❌ Error fetching records:", err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // ✅ بدأ التعديل
  const startEdit = (record) => {
    setEditingRow(record.id);
    setEditForm({
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      notes: record.notes,
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
      await axios.patch(
        `http://localhost:8080/api/medical-records/update/${id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Record updated!");
      setEditingRow(null);
      fetchRecords();
    } catch (err) {
      console.error("❌ Error updating record:", err);
    }
  };

  // ❌ حذف
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/api/medical-records/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("🗑️ Record deleted!");
      fetchRecords();
    } catch (err) {
      console.error("❌ Error deleting record:", err);
    }
  };

  // ✅ تنسيق التاريخ
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📄 Medical Records List</h2>
      <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6" }}>
            <th>Diagnosis</th>
            <th>Treatment</th>
            <th>Notes</th>
            <th>Member</th>
            <th>Doctor</th>
            <th>Created At</th>
            <th>Updated At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <React.Fragment key={r.id}>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td>{r.diagnosis}</td>
                <td>{r.treatment}</td>
                <td>{r.notes}</td>
                <td>{r.memberName}</td>
                <td>{r.doctorName}</td>
                <td>{formatDate(r.createdAt)}</td>
                <td>{formatDate(r.updatedAt)}</td>
                <td>
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
                  <button
                    onClick={() => handleDelete(r.id)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#EF4444",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>

              {/* ✅ صف التحرير يظهر تحت السطر لما تضغط Edit */}
              {editingRow === r.id && (
                <tr>
                  <td colSpan="8" style={{ background: "#F9FAFB" }}>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSave(r.id);
                      }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        padding: "1rem",
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                      }}
                    >
                      <input
                        type="text"
                        name="diagnosis"
                        value={editForm.diagnosis}
                        onChange={handleChange}
                        placeholder="Diagnosis"
                        style={{
                          padding: "8px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "6px",
                        }}
                      />
                      <input
                        type="text"
                        name="treatment"
                        value={editForm.treatment}
                        onChange={handleChange}
                        placeholder="Treatment"
                        style={{
                          padding: "8px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "6px",
                        }}
                      />
                      <textarea
                        name="notes"
                        value={editForm.notes}
                        onChange={handleChange}
                        placeholder="Notes"
                        rows="3"
                        style={{
                          padding: "8px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "6px",
                        }}
                      />
                      <div style={{ display: "flex", gap: "0.5rem" }}>
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
                      </div>
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

export default MedicalRecordsList;
