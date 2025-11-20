import { useState } from 'react';
import './App.css';

// Import Types
import type { ViewMode } from './types/types.ts'; 

// Import Sidebar Icons
import { SignInIcon, SignUpIcon, DoctorIcon } from './components/Icons.tsx'; 

// Import View Components
import PatientSignIn from './views/PatientSignIn.tsx'; 
import PatientSignUp from './views/PatientSignUp.tsx'; 
import DoctorLogin from './views/DoctorLogin.tsx'; 
import AdminLogin from './views/AdminLogIn.tsx'; 
import AdminDashboard from './views/AdminDashboard.tsx'; 

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('patientSignIn');

  // The sign-up/sign-in animation
  const isSignInMode = viewMode !== 'patientSignUp';

  // Render the login/signup views
  const renderLoginViews = () => {
    switch (viewMode) {
      case 'patientSignIn':
        return <PatientSignIn setViewMode={setViewMode} />;
      case 'patientSignUp':
        return <PatientSignUp setViewMode={setViewMode} />;
      case 'doctorLogin':
        return <DoctorLogin setViewMode={setViewMode} />;
      case 'adminLogin':
        return <AdminLogin setViewMode={setViewMode} />;
      default:
        return <PatientSignIn setViewMode={setViewMode} />;
    }
  };

  if (viewMode === 'adminDashboard') {
    return <AdminDashboard setViewMode={setViewMode} />;
  }

  // --- Default: Render the Login/Signup layout ---
  return (
    <div className="auth-background"> 
      <div className="app-wrapper">
        
        {/* --- FAR LEFT SIDEBAR --- */}
        <div className="sidebar">
          <div 
            className={`sidebar-icon ${viewMode === 'patientSignIn' ? 'active' : ''}`}
            onClick={() => setViewMode('patientSignIn')}
          >
            <SignInIcon />
            <span>Sign In</span>
          </div>
          
          <div 
            className={`sidebar-icon ${viewMode === 'patientSignUp' ? 'active' : ''}`}
            onClick={() => setViewMode('patientSignUp')}
          >
            <SignUpIcon />
            <span>Sign Up</span>
          </div>

          <div 
            className={`sidebar-icon ${viewMode === 'doctorLogin' || viewMode === 'adminLogin' ? 'active' : ''}`}
            onClick={() => setViewMode('doctorLogin')}
          >
            <DoctorIcon />
            <span>Doctor log In</span>
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className={`main-container ${isSignInMode ? 'sign-in-mode' : ''}`}>
          
          {/* Render the active login/signup view component */}
          {renderLoginViews()}

        </div>
      </div>
    </div> 
  );
}

export default App;