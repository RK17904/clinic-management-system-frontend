import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.Config.ts';
import { UserIcon, SignInIcon, ListIcon, CalendarIcon, HomeIcon, PlusIcon } from '../components/Icons.tsx';
import logo from "../assets/logo.png";
import '../App.css';

// Interfaces
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
  // Optional properties for updates
  patientId?: number;
  doctorId?: number;
  doctorName?: string;
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

  // States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'records'>('dashboard');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [myRecords, setMyRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // STATES for Booking 
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [newBooking, setNewBooking] = useState({
    doctorId: '',
    date: '',
    time: '',
    notes: ''
  });

  // Get Today's Date for min attribute (Prevent Past Dates)
  const today = new Date().toISOString().split('T')[0];

  // Generate 15-min Time Slots (9:00 AM to 5:00 PM)
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const h = hour < 10 ? `0${hour}` : hour;
        const m = min === 0 ? '00' : min;
        slots.push(`${h}:${m}`);
      }
    }
    return slots;
  }, []);

  // Logout Function
  const handleLogout = () => {
    localStorage.removeItem('patientData');
    navigate('/patient-login');
  };

  // Data Fetching 
  useEffect(() => {
    const fetchData = async () => {
      const storedData = localStorage.getItem('patientData');
      if (!storedData) {
        navigate('/patient-login');
        return;
      }

      const parsedPatient = JSON.parse(storedData);
      setPatient(parsedPatient);

      try {
        setLoading(true);
        const appRes = await api.get('/appointments');

        // 1. Store ALL appointments for availability checking
        setAllAppointments(appRes.data);

        // 2. Filter for CURRENT patient's history
        const patientAppointments = appRes.data.filter((a: Appointment) => a.patient?.id === parsedPatient.id);
        setMyAppointments(patientAppointments);

        const recRes = await api.get('/medical-records');
        const patientRecords = recRes.data.filter((r: MedicalRecord) => r.patient?.id === parsedPatient.id);
        setMyRecords(patientRecords);

        try {
          const docRes = await api.get('/doctors');
          setDoctors(docRes.data);
        } catch (e) { console.log("Doctors loading failed", e); }

      } catch (err) {
        console.error("Error fetching patient data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Check if a specific slot is booked
  const isSlotBooked = (timeSlot: string) => {
    if (!newBooking.doctorId || !newBooking.date) return false;

    return allAppointments.some(app => {
      const isDoctorMatch = app.doctor?.id === parseInt(newBooking.doctorId);
      const isDateMatch = app.date === newBooking.date;
      const dbTime = app.time.substring(0, 5); // "09:00:00" -> "09:00"
      const isTimeMatch = dbTime === timeSlot;
      const isStatusActive = app.status !== 'Cancelled' && app.status !== 'Rejected';

      return isDoctorMatch && isDateMatch && isTimeMatch && isStatusActive;
    });
  };

  // --- SEPARATION LOGIC ---
  
  // Upcoming = Future Date (or Today) AND Active Status (Not Cancelled/Completed)
  const upcomingAppointments = myAppointments.filter(appt => {
    const isInactive = ['Cancelled', 'Rejected', 'REJECTED', 'COMPLETED'].includes(appt.status);
    const isFuture = appt.date >= today;
    return !isInactive && isFuture;
  });

  // History = Past Date OR Inactive Status
  const historyAppointments = myAppointments.filter(appt => {
    const isInactive = ['Cancelled', 'Rejected', 'REJECTED', 'COMPLETED'].includes(appt.status);
    const isPast = appt.date < today;
    return isInactive || isPast;
  });

  // Handle Booking
  const handleBookAppointment = async () => {
    if (!patient || !newBooking.doctorId || !newBooking.date || !newBooking.time) {
      alert("Please select a doctor, date and time!");
      return;
    }

    try {
      // Create the combined LocalDateTime string (Format: YYYY-MM-DDTHH:mm:ss)
      const combinedAppointmentTime = `${newBooking.date}T${newBooking.time}:00`;

      const payload = {
        patientId: patient.id.toString(),
        doctorId: newBooking.doctorId.toString(),
        date: newBooking.date,
        time: newBooking.time + ":00",
        appointmentTime: combinedAppointmentTime, 
        notes: newBooking.notes,
        status: "Pending"
      };

      console.log("Sending Payload:", payload);

      await api.post('/appointments', payload);
      alert("Appointment Request Sent Successfully!");

      setShowBookingForm(false);
      setNewBooking({ doctorId: '', date: '', time: '', notes: '' });

      // Refresh data
      const appRes = await api.get('/appointments');
      setAllAppointments(appRes.data);
      const patientAppointments = appRes.data.filter((a: Appointment) => a.patient?.id === patient.id);
      setMyAppointments(patientAppointments);

    } catch (error: any) {
      console.error(error);
      if (error.response && error.response.data) {
        alert("Booking Failed: " + (typeof error.response.data === 'string' ? error.response.data : error.response.data.message));
      } else {
        alert("Booking Failed! Please try again.");
      }
    }
  };

  if (!patient) return <div>Loading...</div>;

  // Helper for Status Color
  const getStatusStyle = (status: string) => {
    const s = status.toUpperCase();
    if(s === 'PENDING') return { bg: '#FFF3CD', color: '#856404' };
    if(s === 'APPROVED' || s === 'CONFIRMED' || s === 'SCHEDULED') return { bg: '#D1E7DD', color: '#0F5132' };
    return { bg: '#F8D7DA', color: '#721C24' }; // Rejected/Cancelled
  };

  return (
    <div className="dashboard-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* --- SIDEBAR --- */}
      <div className="dashboard-sidebar">
        <div className="dashboard-logo">
          <img src={logo} alt="Logo" className="dashboard-logo-img" style={{ height: '2rem', width: 'auto', marginRight: '0.9rem' }} />
          <h2>My Health</h2>
        </div>

        <nav className="dashboard-nav">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <UserIcon /> <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
          >
            <CalendarIcon /> <span>My Appointments</span>
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`nav-item ${activeTab === 'records' ? 'active' : ''}`}
          >
            <ListIcon /> <span>Medical Records</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="nav-item"
          >
            <HomeIcon /> <span>Go to Home</span>
          </button>
        </nav>

        <div className="dashboard-logout">
          <button onClick={handleLogout} className="nav-item" >
            <SignInIcon /> <span>Logout</span>
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="dashboard-main" style={{
        height: '100vh',
        overflowY: 'auto',
        flex: 1,
        padding: '20px'
      }}>
        <header className="dashboard-header">
          <h1>Welcome, {patient.firstName} {patient.lastName} 👋</h1>
        </header>

        <div className="dashboard-content-wrapper" style={{ padding: 0, position: 'relative' }}>

          <div className="main-slider-viewport">
            <div className={`main-slider-track pos-${activeTab === 'dashboard' ? 'dashboard' : activeTab === 'appointments' ? 'doctors' : 'patients'}`}>

              {/* DASHBOARD */}
              <div className="main-slider-slide">
                <div className="dashboard-content p-4">
                  <div className="stat-card profile-card" style={{ borderLeft: '5px solid #0056b3' }}>
                    <h3>My Profile</h3>
                    <div>
                      <p><strong>Email:</strong> {patient.email}</p>
                      <p><strong>Phone:</strong> {patient.phone}</p>
                      <p><strong>Age:</strong> {patient.age}</p>
                      <p><strong>Address:</strong> {patient.address}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <h3>Upcoming Appointments</h3>
                    <p>{upcomingAppointments.length}</p>
                  </div>
                </div>
              </div>

              {/* APPOINTMENTS TAB */}
              <div className="main-slider-slide">
                <section className="doctors-section p-4">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="m-0">Appointments</h3>
                    <button
                      className={`btn ${showBookingForm ? 'btn-danger' : 'btn-primary'}`}
                      onClick={() => setShowBookingForm(!showBookingForm)}
                      style={{
                        backgroundColor: showBookingForm ? '#dc3545' : '#0056b3',
                        color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '5px'
                      }}
                    >
                      {showBookingForm ? 'Go Back' : <><PlusIcon /> Book New Appointment</>}
                    </button>
                  </div>

                  {/* BOOKING FORM */}
                  {showBookingForm && (
                    <div className="card shadow-sm mb-4 booking-form-card bg-light border-0" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
                      <div className="card-body p-4">
                        <h4 className="card-title mb-4 text-primary" style={{ color: '#0056b3', marginBottom: '15px' }}>📅 Book New Appointment</h4>

                        <div className="row g-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                          {/* Doctor Select */}
                          <div className="col-md-12" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label fw-bold" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Doctor</label>
                            <select
                              className="form-select"
                              value={newBooking.doctorId}
                              onChange={(e) => {
                                setNewBooking({ ...newBooking, doctorId: e.target.value, time: '' }); 
                              }}
                              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                            >
                              <option value="">-- Choose a Specialist --</option>
                              {doctors.map(d => (
                                <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                              ))}
                            </select>
                          </div>

                          {/* Date Picker (with min=today) */}
                          <div className="col-md-6" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label fw-bold" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date</label>
                            <input
                              type="date"
                              className="form-control"
                              min={today} // Prevent past dates
                              value={newBooking.date}
                              onChange={e => setNewBooking({ ...newBooking, date: e.target.value, time: '' })} 
                              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                            />
                          </div>

                          {/* Time Slot Selection Grid */}
                          {newBooking.doctorId && newBooking.date && (
                            <div className="col-12" style={{ gridColumn: '1 / -1', marginTop: '15px' }}>
                              <label className="form-label fw-bold" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Available Time Slots</label>
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                                gap: '10px'
                              }}>
                                {timeSlots.map(slot => {
                                  const booked = isSlotBooked(slot);
                                  const isSelected = newBooking.time === slot;
                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      disabled={booked}
                                      onClick={() => setNewBooking({ ...newBooking, time: slot })}
                                      style={{
                                        padding: '10px 5px',
                                        borderRadius: '5px',
                                        border: 'none',
                                        cursor: booked ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        backgroundColor: booked ? '#ffcccc' : isSelected ? '#0056b3' : '#d4edda',
                                        color: booked ? '#cc0000' : isSelected ? 'white' : '#155724',
                                        opacity: booked ? 0.7 : 1,
                                        boxShadow: isSelected ? '0 0 5px rgba(0,86,179,0.5)' : 'none'
                                      }}
                                      title={booked ? "Already Booked" : "Available"}
                                    >
                                      {slot}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Reason / Notes */}
                          <div className="col-12" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label fw-bold" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Reason for Visit</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Annual checkup, Flu symptoms..."
                              value={newBooking.notes}
                              onChange={e => setNewBooking({ ...newBooking, notes: e.target.value })}
                              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                            />
                          </div>

                          {/* Confirm Button */}
                          <div className="col-12 text-end mt-4" style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
                            <button
                              className="btn btn-success fw-bold px-4 py-2"
                              onClick={handleBookAppointment}
                              disabled={!newBooking.time} 
                              style={{
                                backgroundColor: !newBooking.time ? '#ccc' : '#28a745',
                                border: 'none', color: 'white', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold',
                                cursor: !newBooking.time ? 'not-allowed' : 'pointer'
                              }}
                            >
                              Confirm Booking
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upcoming Appointments Table */}
                  <h4 style={{ color: '#0056b3', marginTop: '20px', marginBottom: '10px' }}>Upcoming Appointments</h4>
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
                        {upcomingAppointments.length === 0 ? (
                          <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No Upcoming Appointments</td></tr>
                        ) : (
                          upcomingAppointments.map(appt => {
                            const style = getStatusStyle(appt.status);
                            return (
                              <tr key={appt.id}>
                                <td>{appt.date}</td>
                                <td>{appt.time}</td>
                                <td>{appt.doctor ? appt.doctor.name : 'Unknown'}</td>
                                <td>
                                  <span style={{
                                    padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase',
                                    backgroundColor: style.bg, color: style.color
                                  }}>
                                    {appt.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Visual Divider */}
                  <div style={{ margin: '40px 0', borderTop: '2px dashed #eee' }}></div>

                  {/* History Table */}
                  <h4 style={{ color: '#666', marginBottom: '10px' }}>Appointment History</h4>
                  <div className="table-container" style={{opacity: 0.8}}>
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
                        {historyAppointments.length === 0 ? (
                          <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No Appointment History</td></tr>
                        ) : (
                          historyAppointments.map(appt => {
                            const style = getStatusStyle(appt.status);
                            return (
                              <tr key={appt.id}>
                                <td>{appt.date}</td>
                                <td>{appt.time}</td>
                                <td>{appt.doctor ? appt.doctor.name : 'Unknown'}</td>
                                <td>
                                  <span style={{
                                    padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase',
                                    backgroundColor: style.bg, color: style.color
                                  }}>
                                    {appt.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* MEDICAL RECORDS TAB */}
              <div className="main-slider-slide">
                <section className="doctors-section p-4">
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
                          <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No Medical Records Found</td></tr>
                        ) : (
                          myRecords.map(rec => (
                            <tr key={rec.id}>
                              <td>{rec.recordDate}</td>
                              <td>{rec.diagnosis}</td>
                              <td>{rec.treatment}</td>
                              <td style={{ maxWidth: '300px' }}>{rec.notes}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;