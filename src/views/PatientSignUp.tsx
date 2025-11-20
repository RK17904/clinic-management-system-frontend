import type { Dispatch, SetStateAction } from 'react';
import type { ViewMode } from '../types/types';
import { UserIcon, MailIcon, LockIcon } from '../components/Icons';
import signUpIllustration from '../assets/signup.jpg';

interface PatientSignUpProps {
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
}

const PatientSignUp = ({ setViewMode }: PatientSignUpProps) => {
  return (
    <>
      {/* --- BLUE LEFT PANEL --- */}
      <div className="form-panel blue-panel">
        <h1>HealthCare +</h1>
        <h2>Sign Up Now</h2>
        <p><i>Join us and take the first step toward better health...</i></p>
        <img src={signUpIllustration} alt="Sign up" className="panel-image" />
      </div>

      {/* --- WHITE RIGHT PANEL --- */}
      <div className="form-panel white-panel">
        <div className="white-panel-header">
          <p>
            Already have an account?<br />
            <span onClick={() => setViewMode('patientSignIn')} className="toggle-link">Sign In</span>
          </p>
        </div>

        <div className="form-content">
          <h2 className="form-title">Sign Up</h2>
          <form>
            {/* Patient "Username" field */}
            <div className="input-group username-input">
              <span className="icon"><UserIcon /></span>
              <input type="text" placeholder="Username" />
            </div>

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
              SIGN UP
            </button>
          </form>
          <p className="footer-text">
            By clicking Sign Up, you agree to our terms and conditions.
          </p>
        </div>
      </div>
    </>
  );
};

export default PatientSignUp;