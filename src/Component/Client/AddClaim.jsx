import React, { useState } from "react";
import axios from "axios";

const AddClaim = ({ onAdded }) => {
  const [newClaim, setNewClaim] = useState({
    policyName: "",   // 🔄 بدل policyId → policyName
    description: "",
    diagnosis: "",
    treatmentDetails: "",
    amount: "",
    serviceDate: "",
    providerName: "",
    doctorName: "",
    invoiceImagePath: null,
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "invoiceImagePath") {
      setNewClaim((prev) => ({ ...prev, invoiceImagePath: files[0] }));
    } else {
      setNewClaim((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({
          policyName: newClaim.policyName, // 🔄 هنا نرسل الـ name بدل الـ id
          description: newClaim.description,
          diagnosis: newClaim.diagnosis,
          treatmentDetails: newClaim.treatmentDetails,
          amount: newClaim.amount,
          serviceDate: newClaim.serviceDate,
          providerName: newClaim.providerName,
          doctorName: newClaim.doctorName,
        })
      );

      if (newClaim.invoiceImagePath) {
        formData.append("invoiceImage", newClaim.invoiceImagePath);
      }

      const res = await axios.post(
        "http://localhost:8080/api/claims/create", // 🔄 endpoint خاص بالـ name
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (onAdded) {
        onAdded(res.data);
      }

      alert("✅ Claim submitted successfully!");
      setNewClaim({
        policyName: "",
        description: "",
        diagnosis: "",
        treatmentDetails: "",
        amount: "",
        serviceDate: "",
        providerName: "",
        doctorName: "",
        invoiceImagePath: null,
      });
    } catch (err) {
      console.error("❌ Error submitting claim:", err);
      alert("Error submitting claim");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-claim-container">
      <form onSubmit={handleSubmit} className="table-section">
        <h2 style={{ marginBottom: "1rem" }}>➕ New Claim</h2>
        <div className="claim-form">
          <div className="form-group">
            <label>Policy Name</label> {/* 🔄 بدل Policy ID */}
            <input
              type="text"
              name="policyName"
              value={newClaim.policyName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input type="text" name="description" value={newClaim.description} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Diagnosis</label>
            <input type="text" name="diagnosis" value={newClaim.diagnosis} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Treatment Details</label>
            <input type="text" name="treatmentDetails" value={newClaim.treatmentDetails} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Amount</label>
            <input type="number" name="amount" value={newClaim.amount} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Service Date</label>
            <input type="date" name="serviceDate" value={newClaim.serviceDate} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Provider Name</label>
            <input type="text" name="providerName" value={newClaim.providerName} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Doctor Name</label>
            <input type="text" name="doctorName" value={newClaim.doctorName} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Invoice Image</label>
            <input type="file" name="invoiceImagePath" onChange={handleInputChange} />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: "#7C3AED",
            color: "#fff",
            padding: "0.6rem 1.2rem",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
            border: "none",
          }}
        >
          {loading ? "Submitting..." : "✅ Submit Claim"}
        </button>
      </form>
    </div>
  );
};

export default AddClaim;
