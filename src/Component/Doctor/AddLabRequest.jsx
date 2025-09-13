import React, { useState } from "react";
import axios from "axios";

function AddLabRequest({ onAdd }) {
  const [form, setForm] = useState({
    testName: "",
    notes: "",
    memberName: "", // 🟢 لازم يطابق الـ backend
  });

  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:8080/api/labs/create",
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("✅ Lab Request Created Successfully!");
      console.log("Created Lab Request:", res.data);

      // إذا بدك تحدث القائمة بعد الإضافة
      if (onAdd) onAdd(res.data);

      // 🟢 إعادة تعيين الفورم
      setForm({
        testName: "",
        notes: "",
        memberName: "",
      });
    } catch (err) {
      console.error("❌ Error creating lab request:", err);
      alert("Failed to create lab request");
    }
  };

  return (
    <div className="form-container">
      <h2>➕ Add Lab Request</h2>
      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-grid">
          <div className="form-group">
            <label>Test Name</label>
            <input
              type="text"
              name="testName"
              value={form.testName}
              onChange={handleChange}
              placeholder="Enter test name"
              required
            />
          </div>

          <div className="form-group">
            <label>Member Name</label>
            <input
              type="text"
              name="memberName" // 🟢 غيرتها من member → memberName
              value={form.memberName}
              onChange={handleChange}
              placeholder="Enter member name"
              required
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label>Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Enter notes"
            required
          ></textarea>
        </div>

        <button type="submit" className="btn-primary">
          🧪 Add Lab Request
        </button>
      </form>
    </div>
  );
}

export default AddLabRequest;
