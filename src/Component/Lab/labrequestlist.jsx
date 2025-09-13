import React, { useState } from "react";

const RequestList = ({ requests = [], onUploaded }) => {
  const [uploadingRow, setUploadingRow] = useState(null);
  const [file, setFile] = useState(null);
  const token = localStorage.getItem("token");

  const safeRequests = Array.isArray(requests) ? requests : [];

  const handleUpload = async (reqId) => {
    if (!file) {
      alert("⚠️ Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `http://localhost:8080/api/labs/${reqId}/upload`, // ✅ backend URL صحيح
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` }, // ⚠️ لا تحط Content-Type يدوي
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      alert("✅ Result uploaded successfully!");
      setUploadingRow(null);
      setFile(null);

      if (onUploaded) onUploaded(data);
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("Error uploading result");
    }
  };

  const getStatusBadge = (status) => {
    const baseStyle = {
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "0.8rem",
      fontWeight: "600",
      color: "white",
    };

    if (status === "PENDING") {
      return <span style={{ ...baseStyle, backgroundColor: "#F59E0B" }}>Pending</span>;
    } else if (status === "COMPLETED") {
      return <span style={{ ...baseStyle, backgroundColor: "#10B981" }}>Completed</span>;
    } else {
      return <span style={{ ...baseStyle, backgroundColor: "#6B7280" }}>{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // dd/mm/yyyy
  };

  return (
    <div className="table-section">
      <h2>Lab Requests</h2>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Test</th>
              <th>Doctor</th>
              <th>Notes</th>
              <th>Patient</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {safeRequests.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "1rem" }}>
                  No lab requests found
                </td>
              </tr>
            )}
            {safeRequests.map((req) => (
              <React.Fragment key={req.id}>
                <tr>
                  <td>{req.testName}</td>
                  <td>{req.doctorName || "-"}</td>
                  <td>{req.notes || "-"}</td>
                  <td>{req.memberName || "-"}</td>
                  <td>{formatDate(req.createdAt)}</td>
                  <td>{getStatusBadge(req.status)}</td>
                  <td>
                    {req.status === "PENDING" && (
                      <button
                        className="btn-upload"
                        onClick={() =>
                          setUploadingRow(uploadingRow === req.id ? null : req.id)
                        }
                      >
                        ⬆️ Upload Result
                      </button>
                    )}
                    {req.status === "COMPLETED" && (
                      <>
                        <a
                          href={`http://localhost:8080${req.resultUrl}`} // ✅ عرض الملف من السيرفر
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-view"
                        >
                          📄 View
                        </a>
                        <a
                          href={`http://localhost:8080${req.resultUrl}`}
                          download
                          className="btn-download"
                        >
                          ⬇️ Download
                        </a>
                      </>
                    )}
                  </td>
                </tr>

                {uploadingRow === req.id && (
                  <tr>
                    <td colSpan="7" style={{ background: "#F9FAFB" }}>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleUpload(req.id);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <input
                          type="file"
                          onChange={(e) => setFile(e.target.files[0])}
                          accept=".pdf,.jpg,.png"
                        />
                        <button type="submit" className="btn-confirm">
                          ✅ Confirm Upload
                        </button>
                        <button
                          type="button"
                          className="btn-cancel"
                          onClick={() => setUploadingRow(null)}
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
    </div>
  );
};

export default RequestList;
