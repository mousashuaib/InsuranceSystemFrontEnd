import React from "react";

const MyClaims = ({ claims }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending": return "#F59E0B";
      case "approved": return "#059669";
      case "rejected": return "#DC2626";
      default: return "#6B7280";
    }
  };

  return (
    <div className="page-content">
      {/* 🔹 العنوان */}
      <div className="page-header">
        <h1>My Claims</h1>
        <p>List of all your submitted claims</p>
      </div>

      {/* 🔹 جدول الكليمات */}
      <div className="table-section">
        <div className="table-container">
          {!claims || claims.length === 0 ? (
            <div
              style={{ padding: "2rem", textAlign: "center", color: "#6B7280" }}
            >
              No claims found
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Policy</th>
                  <th>Member</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Provider</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.id}>
                    <td>{claim.policyName || "-"}</td>
                    <td>{claim.memberName || "-"}</td>
                    <td>{claim.description}</td>
                    <td>${claim.amount}</td>
                    <td>{claim.providerName}</td>
                    <td>{claim.doctorName}</td>
                    <td>{formatDate(claim.serviceDate)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(claim.status) }}
                      >
                        {claim.status}
                      </span>
                    </td>
                    <td>
                      {claim.invoiceImagePath ? (
                        <a
                          href={
                            claim.invoiceImagePath.startsWith("http")
                              ? claim.invoiceImagePath
                              : `http://localhost:8080${claim.invoiceImagePath}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Invoice
                        </a>
                      ) : (
                        "-"
                      )}
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

export default MyClaims;
