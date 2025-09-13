import React, { useState } from "react";
import axios from "axios";
import "./DoctorDashboard.md.css";

function AddPrescription() {
  const [form, setForm] = useState({
    medicine: "",
    dosage: "",
    instructions: "",
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
        "http://localhost:8080/api/prescriptions/create",
        form, // 👈 backend يستقبل memberName + medicine + dosage + instructions
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("✅ Prescription created successfully!");
      setForm({
        medicine: "",
        dosage: "",
        instructions: "",
        memberName: "",
      });
    } catch (err) {
      console.error("❌ Error creating prescription:", err.response || err);
      alert("Failed to create prescription ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="form-title">➕ Add New Prescription</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label>Medicine</label>
          <input
            type="text"
            name="medicine"
            value={form.medicine}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Dosage</label>
          <input
            type="text"
            name="dosage"
            value={form.dosage}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Instructions</label>
          <textarea
            name="instructions"
            value={form.instructions}
            onChange={handleChange}
            rows="3"
          />
        </div>

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

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving..." : "💊  Add Prescription"}
        </button>
      </form>
    </div>
  );
}

export default AddPrescription;
