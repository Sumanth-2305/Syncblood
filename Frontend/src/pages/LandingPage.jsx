import { Link } from 'react-router-dom';
import { ShieldCheck, Hospital, HeartPulse, Droplets } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="landing-logo">
          <Droplets size={32} />
          <span>SyncBlood</span>
        </div>
        <p className="landing-tagline">AI-powered blood donor matching, when every second counts.</p>
      </header>

      <main className="landing-cards">
        <div className="portal-card">
          <div className="portal-card-icon donor-icon">
            <HeartPulse size={36} />
          </div>
          <h2>Donor Portal</h2>
          <p>Register as a blood donor and receive notifications when nearby hospitals need your blood type.</p>
          <div className="portal-card-actions">
            <Link to="/donor/register" className="btn btn-primary">Register</Link>
            <Link to="/donor/login" className="btn btn-outline">Login</Link>
          </div>
        </div>

        <div className="portal-card portal-card-featured">
          <div className="portal-card-icon hospital-icon">
            <Hospital size={36} />
          </div>
          <h2>Hospital Portal</h2>
          <p>Create blood requests and let our AI instantly identify and notify the best-matched donors near you.</p>
          <div className="portal-card-actions">
            <Link to="/hospital/register" className="btn btn-primary">Register</Link>
            <Link to="/hospital/login" className="btn btn-outline">Login</Link>
          </div>
        </div>

        <div className="portal-card">
          <div className="portal-card-icon admin-icon">
            <ShieldCheck size={36} />
          </div>
          <h2>Admin Portal</h2>
          <p>Review and verify hospital registrations to maintain the integrity of the SyncBlood network.</p>
          <div className="portal-card-actions">
            <Link to="/admin/login" className="btn btn-outline">Admin Login</Link>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <p>SyncBlood &mdash; Connecting donors with hospitals through intelligent matching.</p>
      </footer>
    </div>
  );
}
