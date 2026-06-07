import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, HeartPulse, Droplets, Bell, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar.jsx';
import axiosInstance from '../../api/axiosInstance.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './DonorDashboard.css';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [accepted, setAccepted] = useState({});

  const highlightRef = useRef(null);

  async function fetchAvailable() {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/requests/available');
      setRequests(data.requests || []);
    } catch (err) {
      toast.error('Failed to load available requests');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAvailable();
  }, []);

  useEffect(() => {
    if (!loading && requestId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loading, requestId]);

  async function handleAccept(id) {
    setAccepting(id);
    try {
      await axiosInstance.post(`/requests/${id}/accept`);
      setAccepted((prev) => ({ ...prev, [id]: true }));
      toast.success('Thank you! The hospital has been notified.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setAccepting(null);
    }
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="donor-dashboard-container">

        <div className="donor-profile-card">
          <div className="donor-avatar">
            <HeartPulse size={28} />
          </div>
          <div className="donor-profile-info">
            <h2>{user?.name || 'Donor'}</h2>
            <div className="donor-meta">
              {user?.bloodGroup && (
                <span className="blood-group-pill">
                  <Droplets size={13} />
                  {user.bloodGroup}
                </span>
              )}
              <span className="donor-role-tag">Active Donor</span>
            </div>
          </div>
        </div>

        <div className="requests-section">
          <div className="requests-section-header">
            <h3>Available Requests Near You</h3>
            <button className="btn-refresh" onClick={fetchAvailable} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spinning' : ''} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading-state">Looking for matching requests...</div>
          ) : requests.length === 0 ? (
            <div className="no-request-card">
              <div className="no-request-icon">
                <Bell size={32} />
              </div>
              <h3>No Requests Right Now</h3>
              <p>
                You're registered and active. When a nearby hospital creates a blood request
                matching your blood group, it will appear here. You'll also receive an email
                with a direct link.
              </p>
              <div className="availability-badge">
                <span className="availability-dot"></span>
                Available for donation
              </div>
            </div>
          ) : (
            <div className="requests-list">
              {requests.map((req) => {
                const isHighlighted = req._id === requestId;
                const isDone = accepted[req._id];
                return (
                  <div
                    key={req._id}
                    ref={isHighlighted ? highlightRef : null}
                    className={`available-card ${isHighlighted ? 'card-highlighted' : ''}`}
                  >
                    <div className="available-card-top">
                      <div className="card-left">
                        <span className="hospital-name">
                          {req.hospitalId?.name || 'Hospital'}
                        </span>
                        <span className="blood-group-pill">
                          <Droplets size={12} />
                          {req.patientBloodGroup}
                        </span>
                      </div>
                      <div className="card-badges">
                        {req.urgency === 'SOS' && (
                          <span className="badge badge-sos">
                            <AlertTriangle size={11} /> SOS
                          </span>
                        )}
                        {isHighlighted && (
                          <span className="badge badge-notified">Notified</span>
                        )}
                      </div>
                    </div>

                    <div className="available-card-details">
                      <span>{req.unitsRequired} unit{req.unitsRequired !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{req.transfusionCycle} cycle{req.transfusionCycle !== 1 ? 's' : ''}</span>
                      {req.requiredDonationDate && (
                        <>
                          <span>·</span>
                          <span>Needed by {new Date(req.requiredDonationDate).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>

                    {isDone ? (
                      <div className="donation-success">
                        <CheckCircle size={20} className="success-check-sm" />
                        <div>
                          <p className="success-title">Confirmed!</p>
                          <p className="success-sub">The hospital has been notified. They will contact you shortly.</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn-donate"
                        onClick={() => handleAccept(req._id)}
                        disabled={accepting === req._id}
                      >
                        {accepting === req._id ? 'Confirming...' : 'I WILL DONATE'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
