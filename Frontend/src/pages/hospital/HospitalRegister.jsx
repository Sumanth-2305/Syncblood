import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hospital, Upload, MapPin, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './HospitalRegister.css';

export default function HospitalRegister() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', contactPhone: '',
  });
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFile(e) {
    setCertificate(e.target.files[0]);
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
      toast.error('Please capture your hospital location before registering');
      return;
    }
    if (!certificate) {
      toast.error('Please upload your hospital certificate');
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => formData.append(key, val));
    formData.append('latitude', coords.lat);
    formData.append('longitude', coords.lng);
    formData.append('certificate', certificate);

    setLoading(true);
    try {
      const { data } = await axiosInstance.post('/hospitals/register', formData);
      login(data.token, { role: 'hospital', id: data.hospital._id, name: data.hospital.name });
      toast.success('Registration successful! Awaiting admin verification.');
      navigate('/hospital/dashboard');
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
          <Hospital size={32} className="auth-icon hospital-color" />
          <h1>Hospital Registration</h1>
          <p>Join the SyncBlood network</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Hospital Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="City General Hospital"
                required
              />
            </div>
            <div className="form-group">
              <label>Contact Phone</label>
              <input
                type="tel"
                name="contactPhone"
                value={form.contactPhone}
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
              placeholder="admin@hospital.com"
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

          <div className="location-section">
            <button type="button" className="btn-location" onClick={getLocation} disabled={locating}>
              {locating ? <Loader size={16} className="spinning" /> : <MapPin size={16} />}
              {locating ? 'Locating...' : coords ? 'Location Captured ✓' : 'Get Hospital Location'}
            </button>
            {coords && (
              <span className="coords-display">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Hospital Certificate</label>
            <label className="file-upload-label">
              <Upload size={18} />
              {certificate ? certificate.name : 'Click to upload certificate (PDF/Image)'}
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFile}
                className="file-input-hidden"
              />
            </label>
          </div>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register Hospital'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Already registered? <Link to="/hospital/login">Login here</Link></p>
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
