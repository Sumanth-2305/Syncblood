import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hospital } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './HospitalLogin.css';

export default function HospitalLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axiosInstance.post('/hospitals/login', form);
      login(data.token, { role: 'hospital', id: data.hospital._id, name: data.hospital.name });
      toast.success(`Welcome, ${data.hospital.name}!`);
      navigate('/hospital/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <Hospital size={32} className="auth-icon hospital-color" />
          <h1>Hospital Login</h1>
          <p>Access your SyncBlood dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="hospital@example.com"
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
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/hospital/register">Register here</Link></p>
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
