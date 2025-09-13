import React from "react";

const MyEmergencyRequests = ({ emergencyRequests = [] }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "#F59E0B";
      case "approved":
        return "#059669";
      case "rejected":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Emergency Requests</h1>
        <p>Overview of your emergency activities</p>
      </div>

      <div className="table-section">
        <div className="table-container">
          {!emergencyRequests || emergencyRequests.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6B7280" }}>
              No emergency requests found
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Location</th>
                  <th>Phone</th>
                  <th>Date</th>
                  <th>Notes</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {emergencyRequests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.description || "-"}</td>
                    <td>{r.location || "-"}</td>
                    <td>{r.contactPhone || "-"}</td>
                    <td>{formatDate(r.incidentDate)}</td>
                    <td>{r.notes || "-"}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(r.status) }}
                      >
                        {r.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyEmergencyRequests;
