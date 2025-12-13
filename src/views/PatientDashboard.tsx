import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; 
import { UserIcon, SignInIcon, ListIcon, CalendarIcon, PlusIcon } from '../components/Icons.tsx';

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

// Doctor Interface
interface Doctor {
  id: number;
  name: string; 
  specialization: string;
}

interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
  patient: Patient;
  doctor?: Doctor; 
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

  // --- NEW STATES for Booking ---
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [newBooking, setNewBooking] = useState({
      doctorId: '',
      date: '',
      time: '',
      notes: ''
  });

  // --- NEW: Helper to Generate 15-min Time Slots ----
  const generateTimeSlots = () => {
      const slots:string[] = [];
      // Helper function time adding slots
      const addSlots = (startHour: number, endHour: number) => {
          for (let hour = startHour; hour < endHour; hour++) {
              for (let min = 0; min < 60; min += 15) {
                  const h = hour < 10 ? `0${hour}` : hour;
                  const m = min === 0 ? '00' : min;
                  slots.push(`${h}:${m}`);
              }
          }
      };

      // 1. Morning Shift (07:00 AM - 10:00 AM)
       
      addSlots(7, 10);

      // 2. Evening Shift (05:00 PM - 10:00 PM) -> 17:00 to 22:00
      
      addSlots(17, 22);
      return slots;
  };
  const timeSlots = generateTimeSlots();

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

        // 4. NEW: Fetch Doctors for Dropdown
        try {
            const docRes = await api.get('/doctors'); 
            setDoctors(docRes.data);
        } catch(e) { console.log("Doctors loading failed", e); }

      } catch (err) {
        console.error("Error fetching patient data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // --- NEW FUNCTION: Handle Booking ---
  const handleBookAppointment = async () => {
      if(!patient || !newBooking.doctorId || !newBooking.date || !newBooking.time) {
          alert("Please select a doctor, date and time!");
          return;
      }
      
      try {
          const payload = {
              patientId: patient.id,
              doctorId: parseInt(newBooking.doctorId),
              date: newBooking.date,
              time: newBooking.time + ":00", 
              notes: newBooking.notes
          };

          await api.post('/appointments/book', payload); 
          alert("Appointment Request Sent Successfully!");
          
          setShowBookingForm(false);
          setNewBooking({ doctorId: '', date: '', time: '', notes: '' });
          
          // Refresh list
          const appRes = await api.get('/appointments');
          const patientAppointments = appRes.data.filter((a: Appointment) => a.patient?.id === patient.id);
          setMyAppointments(patientAppointments);

      } catch (error: any) {
          console.error(error);
          if(error.response && error.response.data && error.response.data.message) {
              alert("Booking Failed: " + error.response.data.message);
          } else {
              alert("Booking Failed! This slot might be already taken.");
          }
      }
  };

  if (!patient) return <div>Loading...</div>;

  // --- Sidebar Styles ---
  const sidebarColor = 'white'; 
  const activeTextColor = '#0056b3'; // Blue for active tab

  return (
    <div className="dashboard-layout">
      
      {/* --- SIDEBAR --- */}
      <div className="dashboard-sidebar" style={{ background: sidebarColor, color: '#333', borderRight: '1px solid #eee' }}>
        <div className="dashboard-logo" style={{borderBottom:'1px solid #eee'}}>
          <h2 style={{color: '#0056b3'}}>My Health</h2>
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
              <div className="stat-card profile-card" style={{borderLeft: '5px solid #0056b3'}}>
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
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                  <h3>My Appointments History</h3>
                  {/* Book Button */}
                  <button 
                    onClick={() => setShowBookingForm(!showBookingForm)}
                    style={{background: showBookingForm ? '#dc3545' : '#0056b3', color:'white', border:'none', padding:'8px 15px', borderRadius:'5px', cursor:'pointer'}}
                  >
                    {showBookingForm ? 'Cancel' : '+ Book New'}
                  </button>
              </div>

              {/* Booking Form UI */}
              {showBookingForm && (
                  <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'8px', marginBottom:'20px', border:'1px solid #eee'}}>
                      <h4 style={{marginTop:0}}>📅 Book Appointment</h4>
                      <div className="admin-form"> {/* Reusing existing CSS class */}
                          <div className="form-row">
                              <div className="form-group" style={{width:'100%'}}>
                                  <label>Select Doctor</label>
                                  <select value={newBooking.doctorId} onChange={(e) => setNewBooking({...newBooking, doctorId: e.target.value})} style={{padding:'8px', width:'100%', borderRadius:'4px', border:'1px solid #ddd'}}>
                                      <option value="">-- Select Doctor --</option>
                                      {doctors.map(d => (
                                          <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                                      ))}
                                  </select>
                              </div>
                          </div>
                          <div className="form-row">
                              <div className="form-group"><label>Date</label><input type="date" value={newBooking.date} onChange={e => setNewBooking({...newBooking, date: e.target.value})}/></div>
                              
                              {/* --- MODIFIED: Time Input changed to Dropdown --- */}
                              <div className="form-group">
                                  <label>Time Slot</label>
                                  <select value={newBooking.time} onChange={e => setNewBooking({...newBooking, time: e.target.value})} style={{padding:'8px', width:'100%', borderRadius:'4px', border:'1px solid #ddd'}}>
                                      <option value="">-- Select Time --</option>
                                      {timeSlots.map(slot => (
                                          <option key={slot} value={slot}>{slot}</option>
                                      ))}
                                  </select>
                              </div>
                              {/* ----------------------------------------------- */}

                          </div>
                          <div className="form-group"><label>Reason</label><input type="text" value={newBooking.notes} onChange={e => setNewBooking({...newBooking, notes: e.target.value})}/></div>
                          <button onClick={handleBookAppointment} style={{background:'#28a745', color:'white', border:'none', padding:'10px 20px', borderRadius:'5px', cursor:'pointer', marginTop:'10px'}}>Confirm Booking</button>
                      </div>
                  </div>
              )}

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Doctor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAppointments.length === 0 ? (
                      <tr><td colSpan={4} style={{textAlign:'center', padding:'20px'}}>No Appointments Found</td></tr>
                    ) : (
                      myAppointments.map(appt => (
                        <tr key={appt.id}>
                          <td>{appt.date}</td>
                          <td>{appt.time}</td>
                          <td>{appt.doctor ? appt.doctor.name : 'Unknown'}</td>
                          <td>
                            <span style={{
                                padding: '5px 10px', 
                                borderRadius: '15px', 
                                background: appt.status === 'PENDING' ? '#FFF3CD' : appt.status === 'APPROVED' ? '#D1E7DD' : '#F8D7DA',
                                color: appt.status === 'PENDING' ? '#856404' : appt.status === 'APPROVED' ? '#0F5132' : '#721C24',
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