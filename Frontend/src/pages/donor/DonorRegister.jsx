import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HeartPulse, MapPin, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './DonorRegister.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function DonorRegister() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', bloodGroup: 'O+', lastDonationDate: '',
  });
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function getLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Location captured!');
        setLocating(false);
      },
      () => {
        toast.error('Unable to get location. Please allow location access.');
        setLocating(false);
      }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!coords) {
      toast.error('Please capture your location before registering');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        longitude: coords.lng,
        latitude: coords.lat,
      };
      if (!payload.lastDonationDate) delete payload.lastDonationDate;

      const { data } = await axiosInstance.post('/donors/register', payload);
      login(data.token, { role: 'donor', id: data.donor._id, name: data.donor.name, bloodGroup: data.donor.bloodGroup });
      toast.success('Registration successful! Welcome to SyncBlood.');
      navigate('/donor/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-card-header">
          <HeartPulse size={32} className="auth-icon donor-color" />
          <h1>Donor Registration</h1>
          <p>Save lives by joining SyncBlood</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your Name"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Blood Group</label>
              <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Last Donation Date (optional)</label>
              <input
                type="date"
                name="lastDonationDate"
                value={form.lastDonationDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="location-section">
            <button type="button" className="btn-location" onClick={getLocation} disabled={locating}>
              {locating ? <Loader size={16} className="spinning" /> : <MapPin size={16} />}
              {locating ? 'Locating...' : coords ? 'Location Captured ✓' : 'Get My Location'}
            </button>
            {coords && (
              <span className="coords-display">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </span>
            )}
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register as Donor'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Already registered? <Link to="/donor/login">Login here</Link></p>
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
