import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ViewMode } from '../types/types.ts'; 
import { UserIcon, SignInIcon, DoctorIcon, PlusIcon, ListIcon } from '../components/Icons.tsx';

interface AdminDashboardProps {
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
}

 /* ---Component for the main admin dashboard layout--- */
const AdminDashboard = ({ setViewMode }: AdminDashboardProps) => {
  
  const handleLogout = () => {
    setViewMode('adminLogin');
  };

  // manage the active sidebar tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'doctors'>('dashboard');
  
  // manage the sub-section in the "Doctors" tab
  const [doctorSubTab, setDoctorSubTab] = useState<'view' | 'add'>('view');

  // Mock Data for the table
  const doctorsList = [
    { id: 'D001', name: 'Dr. Nimal', clinic: 'Cardiology', contact: '077-1234567', email: 'nimal@gmail.com'},
    { id: 'D002', name: 'Dr. Mihiri', clinic: 'Neurology', contact: '071-1234567', email: 'mihiri@gmail.com'},
    { id: 'D003', name: 'Dr. Saman', clinic: 'Pediatrics', contact: '075-1234567', email: 'saman@gmail.com'},
  ];


  return (
    <div className="dashboard-layout">
      {/* --- Dashboard Sidebar --- */}
      <div className="dashboard-sidebar">
        <div className="dashboard-logo">
          <h2>HealthCare+</h2>
        </div>
        
        <nav className="dashboard-nav">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <UserIcon />
            <span>Dashboard</span>
          </button>

          <button 
            onClick={() => setActiveTab('doctors')} 
            className={`nav-item ${activeTab === 'doctors' ? 'active' : ''}`}
          >
            <DoctorIcon />
            <span>Manage Doctors</span>
          </button>
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
          <h1>{activeTab === 'dashboard' ? 'Welcome, Admin!' : 'Manage Doctors'}</h1>
        </header>

        <div className="dashboard-content-wrapper">
          
          {/* --- VIEW 1: DASHBOARD STATS --- */}
          {activeTab === 'dashboard' && (
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
          )}

          {/* --- VIEW 2: MANAGE DOCTORS --- */}
          {activeTab === 'doctors' && (
            <section className="doctors-section">
              
              {/* Action Buttons */}
              <div className="action-buttons-container">
                <button 
                  className={`action-btn ${doctorSubTab === 'view' ? 'active' : ''}`}
                  onClick={() => setDoctorSubTab('view')}
                >
                  <ListIcon />
                  View Doctors
                </button>
                <button 
                  className={`action-btn ${doctorSubTab === 'add' ? 'active' : ''}`}
                  onClick={() => setDoctorSubTab('add')}
                >
                  <PlusIcon />
                  Add Doctor
                </button>
              </div>

              {/* --- VIEWPORT --- */}
              <div className="slider-viewport">
                {/* The track slides left/right based on the class 'slide-left' */}
                <div className={`slider-track ${doctorSubTab === 'add' ? 'slide-left' : ''}`}>
                  
                  {/* Table - View Doctors */}
                  <div className="slider-slide">
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Clinic</th>
                            <th>Contact</th>
                            <th>Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doctorsList.map((doc) => (
                            <tr key={doc.id}>
                              <td>{doc.id}</td>
                              <td>{doc.name}</td>
                              <td>{doc.clinic}</td>
                              <td>{doc.contact}</td>
                              <td>{doc.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SLIDE 2: Form (Add Doctor) */}
                  <div className="slider-slide">
                    <div className="form-container">
                      <h3>Enter Doctor Details</h3>
                      <form className="admin-form">
                        <div className="form-row">
                          <div className="form-group">
                            <label>ID Number</label>
                            <input type="text" placeholder="D00X" />
                          </div>
                          <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" placeholder="Dr. Name" />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Clinic / Department</label>
                            <input type="text" placeholder="e.g. Cardiology" />
                          </div>
                          <div className="form-group">
                            <label>Contact Number</label>
                            <input type="text" placeholder="07X-XXXXXXX" />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Email Address</label>
                          <input type="email" placeholder="doctor@gmail.com" />
                        </div>
                        <button type="button" className="save-btn">Save Doctor</button>
                      </form>
                    </div>
                  </div>

                </div>
              </div>
              {/* --- END SLIDING VIEWPORT --- */}

            </section>
          )}
          
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;