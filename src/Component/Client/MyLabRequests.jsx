const MyLabRequests = ({ labRequests = [] }) => {

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#F59E0B';
      case 'completed': return '#059669';
      case 'rejected': return '#DC2626';
      default: return '#6B7280';
    }
  };

  if (!labRequests || labRequests.length === 0) {
    return (
      <div className="page-content">
        <div className="page-header">
          <h1>My Lab Requests</h1>
          <p>List of all your lab requests</p>
        </div>
        <div className="table-section">
          <div className="table-container">
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#6B7280',
              fontSize: '1rem'
            }}>
              No lab requests found
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>My Lab Requests</h1>
        <p>List of all your lab requests</p>
      </div>

      <div className="table-section">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
              
                <th>Doctor</th>
                <th>Type</th>
                <th>Result</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
           <tbody>
  {labRequests.map(r => (
    <tr key={r.id}>
      
      <td>{r.doctorName || '-'}</td> {/* جهزته من الـ Backend */}
      <td>{r.testName || '-'}</td>   {/* بدال type */}
     <td>
  {r.resultUrl ? (
    <a
      href={
        r.resultUrl.startsWith("http")
          ? r.resultUrl
          : `http://localhost:8080${r.resultUrl}`
      }
      target="_blank"
      rel="noopener noreferrer"
    >
      Download
    </a>
  ) : (
    "-"
  )}
</td>

      <td>{formatDate(r.createdAt)}</td>
      <td>
        <span
          className="status-badge"
          style={{ backgroundColor: getStatusColor(r.status) }}
        >
          {r.status || 'Unknown'}
        </span>
      </td>
    </tr>
  ))}
</tbody>

          </table>
        </div>
      </div>
    </div>
  );
};

export default MyLabRequests;