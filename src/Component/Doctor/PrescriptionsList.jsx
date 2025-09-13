import React, { useState, useEffect } from "react";
import axios from "axios";

const PrescriptionsList = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({});
  const token = localStorage.getItem("token");

  // ✅ جلب الوصفات
  const fetchPrescriptions = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/prescriptions/doctor/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrescriptions(res.data);
    } catch (err) {
      console.error("❌ Error fetching prescriptions:", err);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  // ✅ بدأ التعديل
  const startEdit = (p) => {
    setEditingRow(p.id);
    setEditForm({
      medicine: p.medicine,
      dosage: p.dosage,
      instructions: p.instructions,
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
        `http://localhost:8080/api/prescriptions/${id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Prescription updated!");
      setEditingRow(null);
      fetchPrescriptions();
    } catch (err) {
      console.error("❌ Error updating prescription:", err);
      alert("Error updating prescription");
    }
  };

  // ❌ حذف
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/api/prescriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("🗑️ Prescription deleted!");
      fetchPrescriptions();
    } catch (err) {
      console.error("❌ Error deleting prescription:", err);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>💊 Prescriptions List</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Dosage</th>
            <th>Instructions</th>
            <th>Member</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {prescriptions.map((p) => (
            <React.Fragment key={p.id}>
              <tr>
                <td>{p.medicine}</td>
                <td>{p.dosage}</td>
                <td>{p.instructions}</td>
                <td>{p.memberName}</td>
                <td>{p.status}</td>
                <td>
                  {/* ✅ زر التعديل يظهر فقط إذا كانت PENDING */}
                  {p.status === "PENDING" && (
                    <button
                      onClick={() => startEdit(p)}
                      style={{
                        marginRight: "8px",
                        padding: "6px 12px",
                        backgroundColor: "#3B82F6",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      ✏️ Edit
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(p.id)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#EF4444",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>

              {/* ✅ صف التحرير يظهر فقط إذا كان Pending */}
              {editingRow === p.id && p.status === "PENDING" && (
                <tr>
                  <td colSpan="6" style={{ background: "#F9FAFB" }}>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSave(p.id);
                      }}
                      style={{
                        display: "flex",
                        gap: "1rem",
                        alignItems: "center",
                        padding: "1rem",
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                      }}
                    >
                      <input
                        type="text"
                        name="medicine"
                        value={editForm.medicine}
                        onChange={handleChange}
                        placeholder="Medicine"
                        style={{
                          flex: 1,
                          padding: "8px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "6px",
                        }}
                      />
                      <input
                        type="text"
                        name="dosage"
                        value={editForm.dosage}
                        onChange={handleChange}
                        placeholder="Dosage"
                        style={{
                          flex: 1,
                          padding: "8px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "6px",
                        }}
                      />
                      <input
                        type="text"
                        name="instructions"
                        value={editForm.instructions}
                        onChange={handleChange}
                        placeholder="Instructions"
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
                          backgroundColor: "#EF4444",
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

export default PrescriptionsList;
