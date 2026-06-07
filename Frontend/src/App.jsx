import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import HospitalLogin from './pages/hospital/HospitalLogin.jsx';
import HospitalRegister from './pages/hospital/HospitalRegister.jsx';
import HospitalDashboard from './pages/hospital/HospitalDashboard.jsx';
import DonorLogin from './pages/donor/DonorLogin.jsx';
import DonorRegister from './pages/donor/DonorRegister.jsx';
import DonorDashboard from './pages/donor/DonorDashboard.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
        } />

        <Route path="/hospital/login" element={<HospitalLogin />} />
        <Route path="/hospital/register" element={<HospitalRegister />} />
        <Route path="/hospital/dashboard" element={
          <ProtectedRoute role="hospital"><HospitalDashboard /></ProtectedRoute>
        } />

        <Route path="/donor/login" element={<DonorLogin />} />
        <Route path="/donor/register" element={<DonorRegister />} />
        <Route path="/donor/dashboard" element={
          <ProtectedRoute role="donor"><DonorDashboard /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
