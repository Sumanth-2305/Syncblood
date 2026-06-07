import { useState, useEffect } from 'react';
import { CheckCircle, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar.jsx';
import axiosInstance from '../../api/axiosInstance.js';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);

  async function fetchPending() {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/admin/hospitals/pending');
      setHospitals(data.hospitals || []);
    } catch (err) {
      toast.error('Failed to load pending hospitals');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPending();
  }, []);

  async function handleVerify(id) {
    setVerifying(id);
    try {
      await axiosInstance.put(`/admin/hospitals/verify/${id}`);
      setHospitals((prev) => prev.filter((h) => h._id !== id));
      toast.success('Hospital verified successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(null);
    }
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <ShieldCheck size={28} className="title-icon" />
            <div>
              <h1>Admin Dashboard</h1>
              <p>Review and verify pending hospital registrations</p>
            </div>
          </div>
          <button className="btn-refresh" onClick={fetchPending} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading pending hospitals...</div>
        ) : hospitals.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} className="empty-icon" />
            <h2>All caught up!</h2>
            <p>No hospitals are pending verification.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="hospitals-table">
              <thead>
                <tr>
                  <th>Hospital Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Certificate</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.map((hospital) => (
                  <tr key={hospital._id}>
                    <td className="hospital-name">{hospital.name}</td>
                    <td>{hospital.email}</td>
                    <td>{hospital.contactPhone}</td>
                    <td>
                      {hospital.certificateUrl ? (
                        <a
                          href={hospital.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cert-link"
                        >
                          <ExternalLink size={14} />
                          View Certificate
                        </a>
                      ) : (
                        <span className="text-muted">Not provided</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn-verify"
                        onClick={() => handleVerify(hospital._id)}
                        disabled={verifying === hospital._id}
                      >
                        {verifying === hospital._id ? 'Verifying...' : 'Verify Hospital'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
