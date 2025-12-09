import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. useNavigate
import { UserIcon, SignInIcon, DoctorIcon, PlusIcon, ListIcon, UsersIcon, CalendarIcon } from '../components/Icons.tsx';
import api from '../api/axiosConfig';

// --- Types ---
interface Doctor {
  id?: number;
  name: string;
  specialization: string;
  phone: string;
  email: string;
  experience: string;
  password?: string;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
}

// 2. Props  (setViewMode )
const AdminDashboard = () => {
  const navigate = useNavigate(); // Hook 

  const handleLogout = () => {
    localStorage.removeItem('token');
    // 3. Navigate 
    navigate('/admin-login');
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'doctors' | 'patients' | 'appointments'>('dashboard');
  const [doctorSubTab, setDoctorSubTab] = useState<'view' | 'add'>('view');

  // --- DATA STATE ---
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);

  // --- NEW DOCTOR FORM STATE ---
  const [newDoctor, setNewDoctor] = useState<Doctor>({
    name: '', specialization: '', email: '', phone: '', experience: '', password: ''
  });

  // --- API CALLS ---
  const fetchDoctors = async () => {
    try { const res = await api.get('/doctors'); setDoctorsList(res.data); } catch (err) { console.error(err); }
  };

  const fetchPatients = async () => {
    try { const res = await api.get('/patients'); setPatientsList(res.data); } catch (err) { console.error(err); }
  };

  const fetchAppointments = async () => {
    try { const res = await api.get('/appointments'); setAppointmentsList(res.data); } catch (err) { console.error(err); }
  };

  // ✅ ADD DOCTOR FUNCTION (Admin Only)
  const handleAddDoctor = async () => {
    try {
      if(!newDoctor.name || !newDoctor.email || !newDoctor.password) {
        alert("Please fill in required fields!");
        return;
      }

      await api.post('/doctors', newDoctor);
      alert("Doctor Added Successfully!");
      
      // Clear form
      setNewDoctor({ name: '', specialization: '', email: '', phone: '', experience: '', password: '' });
      // Refresh list
      fetchDoctors();
      setDoctorSubTab('view');
      
    } catch (error) {
      console.error("Error adding doctor:", error);
      alert("Failed to add doctor!");
    }
  };

  useEffect(() => {
    if (activeTab === 'doctors') fetchDoctors();
    if (activeTab === 'patients') fetchPatients();
    if (activeTab === 'appointments') fetchAppointments();
    if (activeTab === 'dashboard') { fetchDoctors(); fetchPatients(); fetchAppointments(); }
  }, [activeTab]);

  const getTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Admin Dashboard';
      case 'doctors': return 'Manage Doctors';
      case 'patients': return 'Patient Directory';
      case 'appointments': return 'All Appointments';
      default: return '';
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-sidebar">
        <div className="dashboard-logo"><h2>HealthCare+</h2></div>
        <nav className="dashboard-nav">
          <button onClick={() => setActiveTab('dashboard')} className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}><UserIcon /> <span>Dashboard</span></button>
          <button onClick={() => setActiveTab('doctors')} className={`nav-item ${activeTab === 'doctors' ? 'active' : ''}`}><DoctorIcon /> <span>Manage Doctors</span></button>
          <button onClick={() => setActiveTab('patients')} className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`}><UsersIcon /> <span>View Patients</span></button>
          <button onClick={() => setActiveTab('appointments')} className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}><CalendarIcon /> <span>Appointments</span></button>
        </nav>
        <div className="dashboard-logout"><button onClick={handleLogout} className="nav-item"><SignInIcon /> <span>Logout</span></button></div>
      </div>

      <main className="dashboard-main">
        <header className="dashboard-header"><h1>{getTitle()}</h1></header>
        <div className="dashboard-content-wrapper">
          
          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <section className="dashboard-content">
              <div className="stat-card"><h3>Total Patients</h3><p>{patientsList.length}</p></div>
              <div className="stat-card"><h3>Doctors</h3><p>{doctorsList.length}</p></div>
              <div className="stat-card"><h3>Appointments</h3><p>{appointmentsList.length}</p></div>
            </section>
          )}

          {/*  DOCTORS SECTION (View & Add) */}
          {activeTab === 'doctors' && (
            <section className="doctors-section">
              <div className="action-buttons-container">
                <button className={`action-btn ${doctorSubTab === 'view' ? 'active' : ''}`} onClick={() => setDoctorSubTab('view')}><ListIcon /> View Doctors</button>
                <button className={`action-btn ${doctorSubTab === 'add' ? 'active' : ''}`} onClick={() => setDoctorSubTab('add')}><PlusIcon /> Add Doctor</button>
              </div>

              <div className="slider-viewport">
                <div className={`slider-track ${doctorSubTab === 'add' ? 'slide-left' : ''}`}>
                  
                  {/* Table View */}
                  <div className="slider-slide">
                    <div className="table-container">
                      <table className="data-table">
                        <thead><tr><th>Name</th><th>Specialization</th><th>Email</th><th>Phone</th><th>Exp</th></tr></thead>
                        <tbody>{doctorsList.map(d => <tr key={d.id}><td>{d.name}</td><td>{d.specialization}</td><td>{d.email}</td><td>{d.phone}</td><td>{d.experience}</td></tr>)}</tbody>
                      </table>
                    </div>
                  </div>

                  {/* Add Form */}
                  <div className="slider-slide">
                    <div className="form-container">
                      <h3>Register New Doctor</h3>
                      <form className="admin-form">
                        <div className="form-row">
                            <div className="form-group"><label>Doctor Name</label><input type="text" value={newDoctor.name} onChange={e => setNewDoctor({...newDoctor, name: e.target.value})} /></div>
                            <div className="form-group"><label>Specialization</label><input type="text" value={newDoctor.specialization} onChange={e => setNewDoctor({...newDoctor, specialization: e.target.value})} /></div>
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label>Email</label><input type="email" value={newDoctor.email} onChange={e => setNewDoctor({...newDoctor, email: e.target.value})} /></div>
                            <div className="form-group"><label>Phone</label><input type="text" value={newDoctor.phone} onChange={e => setNewDoctor({...newDoctor, phone: e.target.value})} /></div>
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label>Experience</label><input type="text" value={newDoctor.experience} onChange={e => setNewDoctor({...newDoctor, experience: e.target.value})} /></div>
                            <div className="form-group"><label>Password</label><input type="password" value={newDoctor.password} onChange={e => setNewDoctor({...newDoctor, password: e.target.value})} /></div>
                        </div>
                        
                        <button type="button" className="save-btn" onClick={handleAddDoctor}>Save Doctor</button>
                      </form>
                    </div>
                  </div>

                </div>
              </div>
            </section>
          )}

          {/* PATIENTS (View Only for Admin) */}
          {activeTab === 'patients' && (
             <section className="doctors-section">
               <div className="table-container">
                 <table className="data-table">
                   <thead><tr><th>Name</th><th>Email</th><th>Phone</th></tr></thead>
                   <tbody>{patientsList.map(p => <tr key={p.id}><td>{p.firstName} {p.lastName}</td><td>{p.email}</td><td>{p.phone}</td></tr>)}</tbody>
                 </table>
               </div>
             </section>
          )}

          {/* APPOINTMENTS */}
          {activeTab === 'appointments' && (
             <section className="doctors-section">
               <div className="table-container">
                 <table className="data-table">
                   <thead><tr><th>ID</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
                   <tbody>{appointmentsList.map(a => <tr key={a.id}><td>{a.id}</td><td>{a.date}</td><td>{a.time}</td><td>{a.status}</td></tr>)}</tbody>
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