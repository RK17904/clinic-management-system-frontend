import { useState, type Dispatch, type SetStateAction } from 'react';
import type { ViewMode } from '../types/types';
import { MailIcon, LockIcon } from '../components/Icons';
import signInIllustration from '../assets/signin.jpg';
import axios from 'axios'; // Backend 
import { useNavigate } from 'react-router-dom'; // Dashboard 

interface PatientSignInProps {
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
}

const PatientSignIn = ({ setViewMode }: PatientSignInProps) => {
  // 1. Input Data තියාගන්න Variables (State)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate(); // Page 

  // 2. Login Button  Click 
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Page not refresh 
    setError('');

    try {
      // Backend  Email & Password 
      const response = await axios.post('http://localhost:8083/api/patients/login', {
        email: email,
        password: password
      });

      if (response.status === 200) {
       
        localStorage.setItem('patientData', JSON.stringify(response.data));
        
        // Dashboard  (Route )
        navigate('/patient-dashboard'); 
      }
    } catch (err) {
      // Error 
      setError("Invalid Email or Password. Please try again.");
      console.error(err);
    }
  };

  return (
    <>
      {/* --- BLUE LEFT PANEL --- */}
      <div className="form-panel blue-panel">
        <h1>HealthCare +</h1>
        <h1>Welcome Back</h1>
        <p><i>Your health is our priority welcome back to better care...</i></p>
        <img src={signInIllustration} alt="Sign In" className="panel-image" />
      </div>

      {/* --- WHITE RIGHT PANEL --- */}
      <div className="form-panel white-panel">
        <div className="white-panel-header">
          <p>
            Don't have an account? <br />
            <span onClick={() => setViewMode('patientSignUp')} className="toggle-link">Sign Up</span>
          </p>
        </div>

        <div className="form-content">
          <h1 className="form-title">Sign In</h1>
          
          <form onSubmit={handleLogin}>
            {/* Email field */}
            <div className="input-group">
              <span className="icon"><MailIcon /></span>
              <input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)} // Type variable 
                required
              />
            </div>
            
            {/* Password field */}
            <div className="input-group">
              <span className="icon"><LockIcon /></span>
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)} // Type  variable 
                required
              />
            </div>
            
            {/* Error Message */}
            {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

            <button type="submit" className="form-button">
              SIGN IN
            </button>
          </form>
          
          <p className="footer-text">
            By clicking Sign In, you agree to our terms and conditions.
          </p>
        </div>
      </div>
    </>
  );
};

export default PatientSignIn;