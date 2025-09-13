import React from "react";

const PrescriptionList = ({ prescriptions = [], onVerify, onReject, onPrint, onDetails }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending": return "#F59E0B";
      case "verified": return "#059669";
      case "rejected": return "#DC2626";
      default: return "#6B7280";
    }
  };

  const renderActions = (prescription) => {
    const status = prescription.status?.toLowerCase();
    switch (status) {
      case "pending":
        return (
          <div className="action-buttons">
            <button className="btn btn-verify" onClick={() => onVerify(prescription.id)}>✅ Verify</button>
            <button className="btn btn-reject" onClick={() => onReject(prescription.id)}>❌ Reject</button>
          </div>
        );
      case "verified":
        return (
          <div className="action-buttons">
            <button className="btn btn-print" onClick={() => onPrint(prescription.id)}>🖨 Print</button>
          </div>
        );
      case "rejected":
        return (
          <div className="action-buttons">
            <button className="btn btn-details" onClick={() => onDetails(prescription.id)}>ℹ️ Details</button>
          </div>
        );
      default:
        return null;
    }
  };

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div className="table-section">
        <h2>Prescriptions</h2>
        <div className="table-container empty">
          <div style={{ padding: "2rem", textAlign: "center", color: "#6B7280" }}>
            No prescriptions found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-section">
      {/* ✅ CSS داخل الصفحة */}
      <style>
        {`
          .table-container {
            max-height: 400px;   /* 👈 ارتفاع ثابت */
            overflow-y: auto;    /* 👈 Scroll عمودي */
            border: 1px solid #E5E7EB;
            border-radius: 8px;
          }
          .table-container::-webkit-scrollbar {
            width: 8px;
          }
          .table-container::-webkit-scrollbar-thumb {
            background: #9CA3AF;
            border-radius: 8px;
          }
          .table-container::-webkit-scrollbar-thumb:hover {
            background: #6B7280;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
          }
          table.data-table th, table.data-table td {
            padding: 10px;
            border-bottom: 1px solid #E5E7EB;
            text-align: center;
          }
          table.data-table th {
            background: #F9FAFB;
            font-weight: bold;
          }
          .action-buttons {
            display: flex;
            gap: 8px;
            justify-content: center;
          }
          .btn {
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .btn-verify { background-color: #059669; color: #fff; }
          .btn-verify:hover { background-color: #047857; }
          .btn-reject { background-color: #DC2626; color: #fff; }
          .btn-reject:hover { background-color: #B91C1C; }
          .btn-print { background-color: #2563EB; color: #fff; }
          .btn-print:hover { background-color: #1D4ED8; }
          .btn-details { background-color: #6B7280; color: #fff; }
          .btn-details:hover { background-color: #4B5563; }
        `}
      </style>

      <h2>Prescriptions</h2>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
             
              <th>Patient</th>
              <th>Doctor</th>
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Instructions</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map((p) => (
              <tr key={p.id}>
              
                <td>{p.memberName || "-"}</td>
                <td>{p.doctorName || "-"}</td>
                <td>{p.medicine}</td>
                <td>{p.dosage}</td>
                <td>{p.instructions}</td>
                <td>{formatDate(p.createdAt)}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: getStatusColor(p.status),
                      color: "#fff",
                      padding: "0.3rem 0.6rem",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                    }}
                  >
                    {p.status}
                  </span>
                </td>
                <td>{renderActions(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrescriptionList;
