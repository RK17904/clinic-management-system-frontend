import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; 
import { UserIcon, SignInIcon, ListIcon, CalendarIcon } from '../components/Icons.tsx';

// --- Interfaces ---
interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: string;
  address: string;
}

interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
  patient: Patient;
  // Doctor 
}

interface MedicalRecord {
  id: number;
  diagnosis: string;
  treatment: string;
  notes: string;
  recordDate: string;
  patient: Patient;
}

const PatientDashboard = () => {
  const navigate = useNavigate();
  
  // --- States ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'records'>('dashboard');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [myRecords, setMyRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Logout Function ---
  const handleLogout = () => {
    localStorage.removeItem('patientData');
    navigate('/patient-login');
  };

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      // 1. Get Logged In Patient Data
      const storedData = localStorage.getItem('patientData');
      if (!storedData) {
        navigate('/patient-login');
        return;
      }
      
      const parsedPatient = JSON.parse(storedData);
      setPatient(parsedPatient);

      try {
        setLoading(true);
        // 2. Fetch All Appointments & Filter by Patient ID
        const appRes = await api.get('/appointments');
        const patientAppointments = appRes.data.filter((a: Appointment) => a.patient?.id === parsedPatient.id);
        setMyAppointments(patientAppointments);

        // 3. Fetch All Records & Filter by Patient ID
        const recRes = await api.get('/medical-records');
        const patientRecords = recRes.data.filter((r: MedicalRecord) => r.patient?.id === parsedPatient.id);
        setMyRecords(patientRecords);

      } catch (err) {
        console.error("Error fetching patient data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (!patient) return <div>Loading...</div>;

  // --- Sidebar Styles ---
  const sidebarColor = 'white'; 
  const activeTextColor = '#0056b3'; // Blue for active tab

  return (
    <div className="dashboard-layout">
      
      {/* --- SIDEBAR --- */}
      <div className="dashboard-sidebar" style={{ background: sidebarColor, color: '#333', borderRight: '1px solid #eee' }}>
        <div className="dashboard-logo" style={{borderBottom:'1px solid #eee'}}>
          <h2 style={{color: '#0056b3'}}>Health Care+</h2>
        </div>
        
        <nav className="dashboard-nav">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={activeTab === 'dashboard' ? { color: activeTextColor, background: '#eef2ff' } : { color: '#555' }}
          >
            <UserIcon /> <span>Dashboard</span>
          </button>

          <button 
            onClick={() => setActiveTab('appointments')} 
            className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
            style={activeTab === 'appointments' ? { color: activeTextColor, background: '#eef2ff' } : { color: '#555' }}
          >
            <CalendarIcon /> <span>My Appointments</span>
          </button>

          <button 
            onClick={() => setActiveTab('records')} 
            className={`nav-item ${activeTab === 'records' ? 'active' : ''}`}
            style={activeTab === 'records' ? { color: activeTextColor, background: '#eef2ff' } : { color: '#555' }}
          >
            <ListIcon /> <span>Medical Records</span>
          </button>
        </nav>

        <div className="dashboard-logout" style={{borderTop:'1px solid #eee'}}>
          <button onClick={handleLogout} className="nav-item" style={{color: '#d9534f'}}>
            <SignInIcon /> <span>Logout</span>
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Welcome, {patient.firstName} {patient.lastName} 👋</h1>
        </header>

        <div className="dashboard-content-wrapper">
          
          {/* 1. DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-content">
              {/* Profile Card */}
              <div className="stat-card" style={{borderLeft: '5px solid #0056b3'}}>
                <h3>My Profile</h3>
                <div style={{fontSize: '0.95rem', color: '#555', marginTop: '10px', lineHeight: '1.6'}}>
                  <p><strong>Email:</strong> {patient.email}</p>
                  <p><strong>Phone:</strong> {patient.phone}</p>
                  <p><strong>Age:</strong> {patient.age}</p>
                  <p><strong>Address:</strong> {patient.address}</p>
                </div>
              </div>

              {/* Stats Card */}
              <div className="stat-card">
                <h3>Upcoming Appointments</h3>
                <p style={{color: '#0056b3'}}>{myAppointments.length}</p>
              </div>
            </div>
          )}

          {/* 2. APPOINTMENTS TAB */}
          {activeTab === 'appointments' && (
            <section className="doctors-section">
              <h3>My Appointments History</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAppointments.length === 0 ? (
                      <tr><td colSpan={3} style={{textAlign:'center', padding:'20px'}}>No Appointments Found</td></tr>
                    ) : (
                      myAppointments.map(appt => (
                        <tr key={appt.id}>
                          <td>{appt.date}</td>
                          <td>{appt.time}</td>
                          <td>
                            <span style={{
                                padding: '5px 10px', 
                                borderRadius: '15px', 
                                background: appt.status === 'SCHEDULED' ? '#FFF3CD' : '#D1E7DD',
                                color: appt.status === 'SCHEDULED' ? '#856404' : '#0F5132',
                                fontSize: '0.8rem', fontWeight: 'bold'
                            }}>
                                {appt.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 3. MEDICAL RECORDS TAB */}
          {activeTab === 'records' && (
            <section className="doctors-section">
              <h3>My Medical Records</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Diagnosis</th>
                      <th>Treatment</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRecords.length === 0 ? (
                      <tr><td colSpan={4} style={{textAlign:'center', padding:'20px'}}>No Medical Records Found</td></tr>
                    ) : (
                      myRecords.map(rec => (
                        <tr key={rec.id}>
                          <td>{rec.recordDate}</td>
                          <td>{rec.diagnosis}</td>
                          <td>{rec.treatment}</td>
                          <td style={{maxWidth: '300px'}}>{rec.notes}</td>
                        </tr>
                      ))
                    )}
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

export default PatientDashboard;