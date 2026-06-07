import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './DonorLogin.css';

export default function DonorLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axiosInstance.post('/donors/login', form);
      login(data.token, { role: 'donor', id: data.donor._id, name: data.donor.name, bloodGroup: data.donor.bloodGroup });
      toast.success(`Welcome back, ${data.donor.name}!`);
      const destination = location.state?.from || '/donor/dashboard';
      navigate(destination, { replace: true });
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
          <HeartPulse size={32} className="auth-icon donor-color" />
          <h1>Donor Login</h1>
          <p>Access your donor dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
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
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/donor/register">Register here</Link></p>
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
