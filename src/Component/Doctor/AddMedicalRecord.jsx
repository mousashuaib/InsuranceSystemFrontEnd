import React, { useState } from "react";
import axios from "axios";
import "./DoctorDashboard.md.css";

function AddMedicalRecord() {
  const [form, setForm] = useState({
    diagnosis: "",
    treatment: "",
    notes: "",
    memberName: "", // 👈 إدخال اسم المريض بدل ID
  });

  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(
        "http://localhost:8080/api/medical-records/create-medical",
        form, // 👈 backend يستقبل memberName + diagnosis + treatment + notes
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("✅ Medical record created successfully!");
      setForm({
        diagnosis: "",
        treatment: "",
        notes: "",
        memberName: "",
      });
    } catch (err) {
      console.error("❌ Error creating medical record:", err.response || err);
      alert("Failed to create medical record ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="form-title">➕ Add New Medical Record</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label>Member Name</label>
          <input
            type="text"
            name="memberName"
            value={form.memberName}
            onChange={handleChange}
            placeholder="Enter patient's full name"
            required
          />
        </div>

        <div className="form-group">
          <label>Diagnosis</label>
          <input
            type="text"
            name="diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Treatment</label>
          <input
            type="text"
            name="treatment"
            value={form.treatment}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving..." : "💾 Add Medical Record"}
        </button>
      </form>
    </div>
  );
}

export default AddMedicalRecord;
