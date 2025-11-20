import type { Dispatch, SetStateAction } from 'react';
import type { ViewMode } from '../types/types.ts'; 
import { UserIcon, SignInIcon } from '../components/Icons.tsx';

interface AdminDashboardProps {
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
}

 /* ---A new component for the main admin dashboard layout--- */
const AdminDashboard = ({ setViewMode }: AdminDashboardProps) => {
  
  const handleLogout = () => {
    setViewMode('adminLogin');
  };

  return (
    <div className="dashboard-layout">
      {/* --- Dashboard Sidebar --- */}
      <div className="dashboard-sidebar">
        <div className="dashboard-logo">
          <h2>HealthCare+</h2>
        </div>
        <nav className="dashboard-nav">
          <a href="#" className="nav-item active">
            <UserIcon />
            <span>Dashboard</span>
          </a>
        </nav>
        <div className="dashboard-logout">
          <button onClick={handleLogout} className="nav-item">
            <SignInIcon />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Welcome,  Admin!</h1>
        </header>
        <section className="dashboard-content">
          <div className="stat-card">
            <h3>Total Patients</h3>
            <p>1,234</p>
          </div>
          <div className="stat-card">
            <h3>Doctors On Duty</h3>
            <p>56</p>
          </div>
          <div className="stat-card">
            <h3>Appointments Today</h3>
            <p>78</p>
          </div>
          <div className="stat-card">
            <h3>Pending Approvals</h3>
            <p>12</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;