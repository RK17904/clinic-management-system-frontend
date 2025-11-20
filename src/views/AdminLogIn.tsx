import { useState } from 'react'; // <-- IMPORT
import type { Dispatch, SetStateAction, FormEvent } from 'react'; // <-- IMPORT FormEvent
import type { ViewMode } from '../types/types.ts';
import { UserIcon, LockIcon } from '../components/Icons.tsx';
import adminIllustration from '../assets/admin.jpg';

interface AdminLoginProps {
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
}

const AdminLogin = ({ setViewMode }: AdminLoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  /*
   Handles the form submission
   */
  const handleLogin = (e: FormEvent) => {
    e.preventDefault(); // Stop the page from reloading
    setError(''); // Clear any previous errors

    // --- log for testing ---
    console.log('Login attempt with:', { username, password });

    // ---  where  would call an API ---
    // For now, use mock credentials
    if (username === 'admin' && password === 'admin') {
      // Success! Change the view to the dashboard
      setViewMode('adminDashboard');
    } else {
      // Failed login
      setError('Invalid username or password.');
    }
  };

  return (
    <>
      {/* --- BLUE LEFT PANEL (No change) --- */}
      <div className="form-panel blue-panel">
        <div className="logo-container"> 
          <h1>HealthCare +</h1>
        </div> 
        <h1>Admin Portal</h1>
        <p><i>Please enter your admin credentials.</i></p>
        <img src={adminIllustration} alt="Admin" className="panel-image" />
      </div>

      {/* --- WHITE RIGHT PANEL (Updated) --- */}
      <div className="form-panel white-panel">
        <div className="white-panel-header">
          <p>
            Are you a Patient?
            <span onClick={() => setViewMode('patientSignIn')} className="toggle-link">Patient Login</span>
          </p>
        </div>

        <div className="form-content">
          <h2 className="form-title">Admin Log In</h2>
          
          {/* --- UPDATED FORM --- */}
          <form onSubmit={handleLogin}>
            {/* Admin "User Name" field */}
            <div className="input-group">
              <span className="icon"><UserIcon /></span>
              <input 
                type="text" 
                placeholder="User Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            {/* Password field */}
            <div className="input-group">
              <span className="icon"><LockIcon /></span>
              <input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {/* --- NEW: Error Message Display --- */}
            {error && <p className="form-error">{error}</p>}
            
            <button type="submit" className="form-button">
              SIGN IN
            </button>
          </form>
          <p className="footer-text">
            Access is restricted to authorized users.
          </p>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;