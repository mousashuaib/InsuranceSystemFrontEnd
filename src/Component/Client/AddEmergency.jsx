import React, { useState } from "react";
import axios from "axios";

const AddEmergency = ({ onAdded }) => {
  const [newRequest, setNewRequest] = useState({
    description: "",
    location: "",
    contactPhone: "",
    incidentDate: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewRequest((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:8080/api/emergencies",
        newRequest,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Emergency Request Submitted Successfully!");

      if (onAdded) {
        onAdded(res.data); // تحديث القائمة إذا حابب
      }

      setNewRequest({
        description: "",
        location: "",
        contactPhone: "",
        incidentDate: "",
        notes: "",
      });
    } catch (err) {
      console.error("❌ Error submitting emergency:", err);
      alert("❌ Failed to submit emergency request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Add Emergency Request</h1>
        <p>Fill in the details below to submit a new emergency request</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="table-section"
        style={{ padding: "1rem", marginTop: "1rem" }}
      >
        <div className="claim-form">
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              name="description"
              value={newRequest.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={newRequest.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Phone</label>
            <input
              type="text"
              name="contactPhone"
              value={newRequest.contactPhone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Incident Date</label>
            <input
              type="date"
              name="incidentDate"
              value={newRequest.incidentDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group" style={{ gridColumn: "span 2" }}>
            <label>Notes</label>
            <textarea
              name="notes"
              value={newRequest.notes}
              onChange={handleChange}
              style={{ minHeight: "80px", padding: "0.6rem" }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: "#DC2626",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "0.6rem 1.2rem",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "1rem",
          }}
        >
          {loading ? "Submitting..." : "🚨 Submit Emergency Request"}
        </button>
      </form>
    </div>
  );
};

export default AddEmergency;
