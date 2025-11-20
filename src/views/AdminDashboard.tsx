import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ViewMode } from '../types/types.ts'; 
import { UserIcon, SignInIcon, DoctorIcon, PlusIcon, ListIcon, UsersIcon, CalendarIcon } from '../components/Icons.tsx';

interface AdminDashboardProps {
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
}

 /* --the main admin dashboard layout--- */
const AdminDashboard = ({ setViewMode }: AdminDashboardProps) => {
  
  const handleLogout = () => {
    setViewMode('adminLogin');
  };

  // manage the active sidebar tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'doctors' | 'patients' | 'appointments'>('dashboard');
  
  // manage the sub-section in the "Doctors" tab
  const [doctorSubTab, setDoctorSubTab] = useState<'view' | 'add'>('view');

  // Mock Data for the table 📍 API CALL: Fetch Doctors
  const doctorsList = [
    { id: 'D001', name: 'Dr. Nimal', clinic: 'Cardiology', contact: '077-1234567', email: 'nimal@gmail.com'},
    { id: 'D002', name: 'Dr. Mihiri', clinic: 'Neurology', contact: '071-1234567', email: 'mihiri@gmail.com'},
    { id: 'D003', name: 'Dr. Saman', clinic: 'Pediatrics', contact: '075-1234567', email: 'saman@gmail.com'},
  ];
   const patientsList = [ // 📍 API CALL: Fetch Patients
    { id: 'P001', name: 'Kasun Tharanga', disease: 'Flu', clinic: 'General', doctor: 'Dr. Nimal', email: 'Kasun@gmail.com', contact: '077-1111111' },
    { id: 'P002', name: 'Dinithi Sadamali', disease: 'Migraine', clinic: 'Neurology', doctor: 'Dr. Mihiri', email: 'dinithi@gmail.com', contact: '071-222222' },
    { id: 'P003', name: 'Maheshi Parami', disease: 'Fracture', clinic: 'Orthopedics', doctor: 'Dr. Saman', email: 'parami@gmail.com', contact: '074-333333' },
  ];

  const appointmentsList = [ // 📍 API CALL: Fetch Appointments
    { pName: 'Uditha Bhanuka', pId: 'P001', docName: 'Dr. Saman', docId: 'D001', clinic: 'General', date: '2025-11-25', time: '10:00 AM' },
    { pName: 'Suhith Chamindu', pId: 'P002', docName: 'Dr. Mihiri', docId: 'D002', clinic: 'Neurology', date: '2025-11-21', time: '02:30 PM' },
    { pName: 'Dulan Tharaka', pId: 'P003', docName: 'Dr. Saman', docId: 'D003', clinic: 'Orthopedics', date: '2025-12-02', time: '09:15 AM' },
  ];

  

  // get the header title
  const getTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Welcome, Admin!';
      case 'doctors': return 'Manage Doctors';
      case 'patients': return 'Patient Details';
      case 'appointments': return 'Appointment Details';
      default: return '';
    }
  };


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

          <button 
            onClick={() => setActiveTab('patients')} 
            className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`}
          >
            <UsersIcon />
            <span>Patient Details</span>
          </button>

          <button 
            onClick={() => setActiveTab('appointments')} 
            className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
          >
            <CalendarIcon />
            <span>Appointments</span>
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
          <h1>{getTitle()}</h1>
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

              <div className="slider-viewport">
                <div className={`slider-track ${doctorSubTab === 'add' ? 'slide-left' : ''}`}>
                  {/* SLIDE 1: Table */}
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

                  {/* SLIDE 2: Form */}
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
            </section>
          )}

          {/* --- VIEW 3: PATIENT DETAILS --- */}
          {activeTab === 'patients' && (
            <section className="doctors-section"> 
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient ID</th>
                      <th>Name</th>
                      <th>Disease</th>
                      <th>Clinic</th>
                      <th>Doctor</th>
                      <th>Email</th>
                      <th>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientsList.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.name}</td>
                        <td>{p.disease}</td>
                        <td>{p.clinic}</td>
                        <td>{p.doctor}</td>
                        <td>{p.email}</td>
                        <td>{p.contact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* --- VIEW 4: APPOINTMENT DETAILS --- */}
          {activeTab === 'appointments' && (
            <section className="doctors-section"> 
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Patient ID</th>
                      <th>Doctor Name</th>
                      <th>Doctor ID</th>
                      <th>Clinic</th>
                      <th>Date</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointmentsList.map((app, index) => (
                      <tr key={index}>
                        <td>{app.pName}</td>
                        <td>{app.pId}</td>
                        <td>{app.docName}</td>
                        <td>{app.docId}</td>
                        <td>{app.clinic}</td>
                        <td>{app.date}</td>
                        <td>{app.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;