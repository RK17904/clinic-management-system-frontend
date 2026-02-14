import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './App.css';

// Import Sidebar Icons
import { SignInIcon, SignUpIcon, DoctorIcon, StethoscopeIcon, HomeIcon } from './components/Icons.tsx';

// Import View Components
import PatientSignIn from './views/PatientSignIn.tsx';
import PatientSignUp from './views/PatientSignUp.tsx';
import PatientDashboard from './views/PatientDashboard.tsx';
import DoctorLogin from './views/DoctorLogin.tsx';
import DoctorDashboard from './views/DoctorDashboard.tsx';
import AdminLogin from './views/AdminLogIn.tsx';
import AdminDashboard from './views/AdminDashboard.tsx';
import Home from './views/Home.tsx'; 

// --- Layout Component for Auth Pages (Sidebar + Content) ---
const AuthLayout = ({ children, activeTab }: { children: React.ReactNode, activeTab: string }) => {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);

  const handleGoHome = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate('/home');
    }, 500); 
  };

  return (
    <div className="auth-background">
      <div 
        className="app-wrapper"
        style={{
          transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
          transform: isExiting ? 'translateX(-100vw)' : 'none',
          opacity: isExiting ? 0.5 : 1
        }}
      >
        {/* --- SIDEBAR --- */}
        <div className="sidebar">
          
          {/* Home Button */}
          <div
            className="sidebar-icon"
            onClick={handleGoHome} 
            title="Go to Home Page"
          >
            <HomeIcon />
            <span>Home</span>
          </div>

          {/* Patient Sign In */}
          <div
            className={`sidebar-icon ${activeTab === 'patientSignIn' ? 'active' : ''}`}
            onClick={() => navigate('/patient-login')}
          >
            <SignInIcon /> 
            <span>Sign In</span>
          </div>

          {/* Patient Sign Up */}
          <div
            className={`sidebar-icon ${activeTab === 'patientSignUp' ? 'active' : ''}`}
            onClick={() => navigate('/patient-signup')}
          >
            <SignUpIcon /> 
            <span>Sign Up</span>
          </div>

          {/* Doctor Log In */}
          <div
            className={`sidebar-icon ${activeTab === 'doctorLogin' ? 'active' : ''}`}
            onClick={() => navigate('/doctor-login')}
          >
            <StethoscopeIcon /> 
            <span>Doctor</span>
          </div>

          {/* Admin Log In */}
          <div
            className={`sidebar-icon ${activeTab === 'adminLogin' ? 'active' : ''}`}
            onClick={() => navigate('/admin-login')}
            style={{ marginTop: 'auto', marginBottom: '20px' }} 
          >
            <DoctorIcon /> 
            <span>Admin</span>
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className={`main-container ${activeTab !== 'patientSignUp' ? 'sign-in-mode' : ''}`}>
           {children}
        </div>
      </div>
    </div>
  );
};

// --- Wrapper to handle "setViewMode" prop compatibility ---
// This bridge allows components to switch routes using their existing props logic
const AuthPageWrapper = ({ Component, mode }: { Component: any, mode: string }) => {
    const navigate = useNavigate();

    // Map the 'ViewMode' strings to actual Routes
    const handleSetViewMode = (newMode: string) => {
        if (newMode === 'patientSignIn') navigate('/patient-login');
        if (newMode === 'patientSignUp') navigate('/patient-signup');
        if (newMode === 'doctorLogin') navigate('/doctor-login');
        if (newMode === 'adminLogin') navigate('/admin-login');
    };

    return (
        <AuthLayout activeTab={mode}>
            <Component setViewMode={handleSetViewMode} />
        </AuthLayout>
    );
};

// --- MAIN APP COMPONENT ---
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- HOME ROUTE --- */}
        <Route path="/home" element={<Home />} />
        
        {/* --- AUTH ROUTES (Wrapped in Layout) --- */}
        <Route path="/patient-login" element={<AuthPageWrapper Component={PatientSignIn} mode="patientSignIn" />} />
        <Route path="/patient-signup" element={<AuthPageWrapper Component={PatientSignUp} mode="patientSignUp" />} />
        <Route path="/doctor-login" element={<AuthPageWrapper Component={DoctorLogin} mode="doctorLogin" />} />
        <Route path="/admin-login" element={<AuthPageWrapper Component={AdminLogin} mode="adminLogin" />} />

        {/* --- DASHBOARD ROUTES --- */}
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* --- DEFAULT REDIRECT --- */}
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;