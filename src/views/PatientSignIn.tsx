import type { Dispatch, SetStateAction } from 'react';
import type { ViewMode } from '../types/types';
import { MailIcon, LockIcon } from '../components/Icons';
import signInIllustration from '../assets/signin.jpg';


interface PatientSignInProps {
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
}

const PatientSignIn = ({ setViewMode }: PatientSignInProps) => {
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
          <form>
            {/* Email field */}
            <div className="input-group">
              <span className="icon"><MailIcon /></span>
              <input type="email" placeholder="Email" />
            </div>
            
            {/* Password field */}
            <div className="input-group">
              <span className="icon"><LockIcon /></span>
              <input type="password" placeholder="Password" />
            </div>
            
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