import React, { useEffect, useState } from "react";
import axios from "axios";

const ClientMedicalRecord = ({ user }) => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!user?.id) return;

        const res = await axios.get(
          `http://localhost:8080/api/medical-records/Bymember/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecords(res.data);
      } catch (err) {
        console.error("❌ Error fetching medical records:", err);
      }
    };

    fetchRecords();
  }, [user]);

  // ✅ تنسيق التاريخ
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const optionsDate = { year: "numeric", month: "2-digit", day: "2-digit" };
    const optionsTime = { hour: "2-digit", minute: "2-digit", hour12: false };
    return `${date.toLocaleDateString("en-CA", optionsDate)} ${date.toLocaleTimeString(
      "en-GB",
      optionsTime
    )}`;
  };

  return (
    <div className="page-content">
      {/* ✅ ستايل داخلي */}
      <style>
        {`
          .medical-page-header {
            background: #fff;
            padding: 1.5rem 2rem;
            margin: 0 0 1.5rem 0;
            box-shadow: 0 2px 6px rgba(0,0,0,0.05);
            border-radius: 8px;
          }

          .medical-page-header h1 {
            font-size: 1.75rem; 
            font-weight: 700;
            margin-bottom: 0.25rem;
          }

          .medical-page-header p {
            font-size: 0.95rem;
            color: #6B7280;
          }

          .medical-table-section {
            background: #fff;
            margin: 0 0 2rem 0;
            padding: 1rem 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }

          .medical-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.95rem;
          }

          .medical-table thead {
            background-color: #f9fafb;
            text-align: left;
          }

          .medical-table th, 
          .medical-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #f1f1f1;
            text-align: left;
            width: 20%; /* ✅ توزيع الأعمدة بالتساوي */
          }

          .medical-table th {
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
          }

          .medical-table td {
            color: #4b5563;
          }

          .medical-table tbody tr:nth-child(even) {
            background-color: #f9fafb;
          }

          .medical-table tbody tr:hover {
            background-color: #f3f4f6;
            transition: 0.2s ease-in-out;
          }
        `}
      </style>

      {/* Header */}
      <div className="medical-page-header">
        <h1>📖 My Medical Records</h1>
        <p>List of your medical records</p>
      </div>

      {/* Table */}
      <div className="medical-table-section">
        <div className="table-container">
          <table className="medical-table">
            <thead>
              <tr>
                <th>Diagnosis</th>
                <th>Treatment</th>
                <th>Notes</th>
                <th>Doctor</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((rec) => (
                  <tr key={rec.id}>
                    <td>{rec.diagnosis}</td>
                    <td>{rec.treatment}</td>
                    <td>{rec.notes}</td>
                    <td>{rec.doctorName}</td>
                    <td>{formatDate(rec.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "1rem" }}>
                    No medical records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientMedicalRecord;
