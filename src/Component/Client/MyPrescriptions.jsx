const MyPrescriptions = ({ prescriptions = [], onVerify, onReject, onPrint, onDetails }) => {

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#F59E0B';
      case 'verified': return '#059669';
      case 'rejected': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const renderActions = (prescription) => {
    const status = prescription.status?.toLowerCase();

    switch (status) {
      case 'pending':
        return (
          <div className="action-buttons">
            
          </div>
        );
      case 'verified':
        return (
          <div className="action-buttons">
            {onPrint && (
              <button
                className="btn-print"
                onClick={() => onPrint(prescription.id)}
              >
                🖨️ Print
              </button>
            )}
          </div>
        );
      case 'rejected':
        return (
          <div className="action-buttons">
            {onDetails && (
              <button
                className="btn-details"
                onClick={() => onDetails(prescription.id)}
              >
                ℹ️ Details
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div className="page-content">
        <div className="page-header">
          <h1>My Prescriptions</h1>
          <p>List of all your prescriptions</p>
        </div>
        <div className="table-section">
          <div className="table-container">
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#6B7280',
              fontSize: '1rem'
            }}>
              No prescriptions found
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>My Prescriptions</h1>
        <p>List of all your prescriptions</p>
      </div>

    <div className="table-section">
  <div className="table-container">
    <table className="data-table">
      <thead>
        <tr>
         
          <th>Doctor</th>
          <th>Medicine</th>
          <th>Dosage</th>
          <th>Instructions</th>
          <th>Date</th>
          <th>Status</th>
         
        </tr>
      </thead>
      <tbody>
        {prescriptions.map(p => (
          <tr key={p.id}>
           
           <td>{p.doctorName || '-'}</td>

            <td>{p.medicine || '-'}</td>
            <td>{p.dosage || '-'}</td>
            <td>{p.instructions || '-'}</td>
            <td>{formatDate(p.createdAt)}</td>
            <td>
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(p.status) }}
              >
                {p.status || 'Unknown'}
              </span>
            </td>
            <td>{renderActions(p)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>


      </div>
    </div>
  );
};

export default MyPrescriptions;
