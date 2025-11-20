import type { Dispatch, SetStateAction } from 'react';
import type {ViewMode} from '../types/types';
import { UserIcon, LockIcon } from '../components/Icons';
import logInIllustration from '../assets/doctor.jpg';

interface DoctorLoginProps {
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
}

const DoctorLogin = ({ setViewMode }: DoctorLoginProps) => {    
return(
<>
      {/* --- BLUE LEFT PANEL --- */}
      <div className="form-panel blue-panel">
        <h1>HealthCare +</h1>
        <h2>Welcome to Doctor Portal</h2>
        <p><i>Access your digital clinic and manage with ease...</i></p>
        <img src={logInIllustration} alt="Doctor" className="panel-image" />
      </div>

      {/* --- WHITE RIGHT PANEL --- */}
      <div className="form-panel white-panel">
        <div className="white-panel-header">
          <p>
            Are you an Admin?
            <span onClick={() => setViewMode('adminLogin')} className="toggle-link admin-link">Admin Login</span>
          </p>
        </div>

        <div className="form-content">
          <h1 className="form-title">Doctor Log In</h1>
          <form>
            {/* Doctor "User name" field */}
            <div className="input-group">
              <span className="icon"><UserIcon /></span>
              <input type="text" placeholder="User name" />
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
            Access is restricted to authorized users.
          </p>
        </div>
      </div>
    </>
  );
};

export default DoctorLogin;