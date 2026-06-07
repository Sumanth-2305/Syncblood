import { useState, useEffect, useCallback } from 'react';
import { Hospital, Plus, RefreshCw, User, Phone, Droplets, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar.jsx';
import axiosInstance from '../../api/axiosInstance.js';
import './HospitalDashboard.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const initialForm = {
  patientName: '',
  patientBloodGroup: 'O+',
  transfusionCycle: '',
  unitsRequired: 1,
  urgency: 'Standard',
  maxDistanceKm: 10,
  requiredDonationDate: '',
};

export default function HospitalDashboard() {
  const [form, setForm] = useState(initialForm);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const { data } = await axiosInstance.get('/requests/dashboard');
      setRequests(data.requests || []);
    } catch (err) {
      toast.error('Failed to load requests');
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosInstance.post('/requests', form);
      toast.success('Request created! Top donors are being notified.');
      setForm(initialForm);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="hospital-dashboard-container">

        <section className="create-request-section">
          <div className="section-header">
            <Hospital size={22} className="section-icon" />
            <h2>Create Blood Request</h2>
          </div>
          <form onSubmit={handleSubmit} className="request-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Patient Name</label>
                <input
                  type="text"
                  name="patientName"
                  value={form.patientName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="form-group">
                <label>Blood Group</label>
                <select name="patientBloodGroup" value={form.patientBloodGroup} onChange={handleChange}>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Transfusion Cycle</label>
                <input
                  type="text"
                  name="transfusionCycle"
                  value={form.transfusionCycle}
                  onChange={handleChange}
                  placeholder="e.g. Monthly, One-time"
                  required
                />
              </div>
              <div className="form-group">
                <label>Units Required</label>
                <input
                  type="number"
                  name="unitsRequired"
                  value={form.unitsRequired}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Urgency</label>
                <select name="urgency" value={form.urgency} onChange={handleChange}>
                  <option value="Standard">Standard</option>
                  <option value="SOS">SOS</option>
                </select>
              </div>
              <div className="form-group">
                <label>Search Radius (km)</label>
                <input
                  type="number"
                  name="maxDistanceKm"
                  value={form.maxDistanceKm}
                  onChange={handleChange}
                  min="1"
                  max="100"
                  required
                />
              </div>
              <div className="form-group form-group-full">
                <label>Required Donation Date</label>
                <input
                  type="date"
                  name="requiredDonationDate"
                  value={form.requiredDonationDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-create-request" disabled={submitting}>
              <Plus size={18} />
              {submitting ? 'Creating & Notifying Donors...' : 'Create Request'}
            </button>
          </form>
        </section>

        <section className="requests-feed-section">
          <div className="section-header">
            <h2>Live Requests</h2>
            <button className="btn-refresh" onClick={fetchRequests} disabled={loadingRequests}>
              <RefreshCw size={15} className={loadingRequests ? 'spinning' : ''} />
              Refresh
            </button>
          </div>

          {loadingRequests ? (
            <div className="loading-state">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <p>No requests yet. Create your first blood request above.</p>
            </div>
          ) : (
            <div className="requests-grid">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className={`request-card ${req.status === 'Accepted' ? 'card-accepted' : ''}`}
                >
                  <div className="request-card-top">
                    <div className="request-patient">
                      <span className="patient-name">{req.patientName}</span>
                      <span className="blood-group-badge">{req.patientBloodGroup}</span>
                    </div>
                    <div className="request-badges">
                      {req.urgency === 'SOS' && (
                        <span className="badge badge-sos">
                          <AlertTriangle size={12} /> SOS
                        </span>
                      )}
                      <span className={`badge badge-status ${req.status === 'Accepted' ? 'badge-accepted' : req.status === 'Completed' ? 'badge-completed' : 'badge-pending'}`}>
                        {req.status}
                      </span>
                    </div>
                  </div>

                  <div className="request-details">
                    <span>{req.unitsRequired} unit{req.unitsRequired !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{req.transfusionCycle}</span>
                    {req.requiredDonationDate && (
                      <>
                        <span>·</span>
                        <span>By {new Date(req.requiredDonationDate).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>

                  {req.status === 'Accepted' && req.acceptedBy && (
                    <div className="donor-info">
                      <h4>Donor Details</h4>
                      <div className="donor-detail">
                        <User size={14} />
                        <span>{req.acceptedBy.name}</span>
                      </div>
                      <div className="donor-detail">
                        <Phone size={14} />
                        <span>{req.acceptedBy.phone}</span>
                      </div>
                      <div className="donor-detail">
                        <Droplets size={14} />
                        <span>{req.acceptedBy.bloodGroup}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
