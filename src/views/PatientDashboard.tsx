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

// --- MODERN UI COMPONENTS (Internal) ---

const HealthTipCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const tips = [
    {
      icon: '🍎',
      title: 'Eat Balanced',
      text: 'Incorporate fruits and vegetables into every meal for better immunity.',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    },
    {
      icon: '💧',
      title: 'Stay Hydrated',
      text: 'Drink at least 8 glasses of water daily to keep your energy levels high.',
      gradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    },
    {
      icon: '🏃',
      title: 'Get Moving',
      text: 'A 30-minute walk today can improve your heart health and mood.',
      gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)'
    },
    {
      icon: '🧠',
      title: 'Mindfulness',
      text: 'Take 5 minutes to practice deep breathing to reduce stress.',
      gradient: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)'
    }
  ];

  // Auto-swap tips every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [tips.length]);

  const tip = tips[currentIndex];

  return (
    <>
      <div 
        key={currentIndex} 
        className="health-tip-card"
        style={{
          background: tip.gradient
        }}
      >
        <div style={{ fontSize: '2.5rem' }}>{tip.icon}</div>
        <div>
          <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{tip.title}</h4>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>
            {tip.text}
          </p>
        </div>
      </div>
    </>
  );
};

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
  
  // Filtering State
  const [filterSpecialty, setFilterSpecialty] = useState<string>('');

  // Calendar View State (for the custom date picker)
  const [calendarView, setCalendarView] = useState(new Date());

  // Feedback State
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-clear feedback after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Get Today's Date String (Local Time) to prevent timezone bugs
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const today = getTodayString();

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

  // --- FILTER & SORT LOGIC ---
  const uniqueSpecialties = useMemo(() => {
    const specs = new Set(doctors.map(d => d.specialization).filter(Boolean));
    return Array.from(specs).sort();
  }, [doctors]);

  const filteredAndSortedDoctors = useMemo(() => {
    let result = [...doctors];

    // Filter by Specialty
    if (filterSpecialty) {
      result = result.filter(d => d.specialization === filterSpecialty);
    }

    // Always Sort A-Z by default for consistency
    result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [doctors, filterSpecialty]);


  // --- CUSTOM CALENDAR LOGIC ---
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const startDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleMonthChange = (offset: number) => {
    setCalendarView(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const handleDateClick = (day: number) => {
    const year = calendarView.getFullYear();
    const month = String(calendarView.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateString = `${year}-${month}-${d}`;

    // Prevent selecting past dates
    if (dateString < today) return;

    setNewBooking({ ...newBooking, date: dateString, time: '' });
  };

  // Handle Booking
  const handleBookAppointment = async () => {
    if (!patient || !newBooking.doctorId || !newBooking.date || !newBooking.time) {
      setFeedback({ message: "Please select a doctor, date and time!", type: 'error' });
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
      
      // Success Feedback
      setFeedback({ message: "Appointment Request Sent Successfully!", type: 'success' });

      setShowBookingForm(false);
      setNewBooking({ doctorId: '', date: '', time: '', notes: '' });

      // Refresh data
      const appRes = await api.get('/appointments');
      setAllAppointments(appRes.data);
      const patientAppointments = appRes.data.filter((a: Appointment) => a.patient?.id === patient.id);
      setMyAppointments(patientAppointments);

    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response && error.response.data 
        ? (typeof error.response.data === 'string' ? error.response.data : error.response.data.message)
        : "Booking Failed! Please try again.";
        
      setFeedback({ message: "Booking Failed: " + errorMsg, type: 'error' });
    }
  };

  if (!patient) return <div>Loading...</div>;

  // Helper for Status Color
  const getStatusStyle = (status: string) => {
    const s = status.toUpperCase();
    if(s === 'PENDING') return { bg: '#FFF3CD', color: '#856404' };
    if(s === 'APPROVED' || s === 'CONFIRMED' || s === 'SCHEDULED' || s === 'COMPLETED') return { bg: '#D1E7DD', color: '#0F5132' };
    return { bg: '#F8D7DA', color: '#721C24' }; // Rejected/Cancelled
  };

  // Calendar render helpers
  const currentMonthDays = daysInMonth(calendarView);
  const startDay = startDayOfMonth(calendarView);
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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
          {/* Enhanced Header with Date */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Welcome, {patient.firstName} {patient.lastName} 👋</h1>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </header>

        <div className="dashboard-content-wrapper" style={{ padding: 0, position: 'relative' }}>

          <div className="main-slider-viewport">
            <div className={`main-slider-track pos-${activeTab === 'dashboard' ? 'dashboard' : activeTab === 'appointments' ? 'doctors' : 'patients'}`}>

              {/* --- DASHBOARD TAB (Redesigned) --- */}
              <div className="main-slider-slide">
                <div className="dashboard-content p-4" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

                  {/* 2. Main Content Split */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px' }}>
                    
                    {/* Left Col: Next Appointment Highlight */}
                    <div className="next-appointment-card">
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <h3 style={{ margin: 0, color: '#0056b3' }}>📅 Next Appointment</h3>
                          {upcomingAppointments.length > 0 && (
                            <span style={{ background: '#e6f0ff', color: '#0056b3', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Confirmed</span>
                          )}
                       </div>

                       {upcomingAppointments.length > 0 ? (
                         <div>
                            <div style={{ marginBottom: '15px' }}>
                               <h2 style={{ margin: '0 0 5px 0', fontSize: '1.4rem' }}>{upcomingAppointments[0].doctor?.name}</h2>
                               <p style={{ margin: 0, color: '#666' }}>{upcomingAppointments[0].doctor?.specialization}</p>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                              <div style={{ background: '#f8f9fa', padding: '10px 15px', borderRadius: '8px', flex: 1 }}>
                                <small style={{ color: '#888', display: 'block', marginBottom: '4px' }}>Date</small>
                                <strong>{upcomingAppointments[0].date}</strong>
                              </div>
                              <div style={{ background: '#f8f9fa', padding: '10px 15px', borderRadius: '8px', flex: 1 }}>
                                <small style={{ color: '#888', display: 'block', marginBottom: '4px' }}>Time</small>
                                <strong>{upcomingAppointments[0].time}</strong>
                              </div>
                            </div>

                            <button 
                              onClick={() => setActiveTab('appointments')}
                              style={{ width: '100%', padding: '12px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              Manage Appointment
                            </button>
                         </div>
                       ) : (
                         <div style={{ textAlign: 'center', padding: '20px 0' }}>
                           <p style={{ color: '#888', marginBottom: '20px' }}>No upcoming appointments scheduled.</p>
                           <button 
                              onClick={() => { setActiveTab('appointments'); setShowBookingForm(true); }}
                              style={{ padding: '10px 20px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                           >
                              Book Now
                           </button>
                         </div>
                       )}
                    </div>

                    {/* Right Col: Profile & Health Tips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                       {/* Profile Mini Card */}
                       <div className="profile-mini-card">
                          <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>My Profile</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 20px', fontSize: '0.95rem' }}>
                             <span style={{ color: '#888' }}>Email:</span> <span>{patient.email}</span>
                             <span style={{ color: '#888' }}>Phone:</span> <span>{patient.phone}</span>
                             <span style={{ color: '#888' }}>Address:</span> <span>{patient.address}</span>
                          </div>
                       </div>

                       {/* Auto-Swapping Health Tip Banner */}
                       <HealthTipCarousel />
                    </div>

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
                      {showBookingForm ? 'Cancel Booking' : <><PlusIcon /> Book New Appointment</>}
                    </button>
                  </div>
                  
                  {/* FEEDBACK BANNER */}
                  {feedback && (
                    <div className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}>
                      <span style={{ fontWeight: 500 }}>{feedback.message}</span>
                      <button 
                        onClick={() => setFeedback(null)} 
                        className="btn-close-feedback"
                      >
                        &times;
                      </button>
                    </div>
                  )}

                  {/* BOOKING FORM */}
                  {showBookingForm && (
                    <div className="booking-form-card">
                      <div className="card-body p-4">
                        <h4 className="card-title mb-4 text-primary" style={{ color: '#0056b3', marginBottom: '15px' }}>📅 Book New Appointment</h4>

                        <div className="booking-grid">
                          
                          {/* Filter Controls (Row 1) */}
                          <div className="filter-container">
                            <div className="filter-row">
                                <div className="filter-group">
                                    <label className="filter-label">Filter by Specialty</label>
                                    <select
                                        className="booking-select"
                                        value={filterSpecialty}
                                        onChange={(e) => setFilterSpecialty(e.target.value)}
                                    >
                                        <option value="">All Specialties</option>
                                        {uniqueSpecialties.map(spec => (
                                        <option key={spec} value={spec}>{spec}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                          </div>

                          {/* Doctor Select - Full Width */}
                          <div className="grid-col-full">
                            <label className="form-label-bold">Select Doctor</label>
                            <select
                              className="booking-select"
                              value={newBooking.doctorId}
                              onChange={(e) => {
                                setNewBooking({ ...newBooking, doctorId: e.target.value, time: '' }); 
                              }}
                            >
                              <option value="">-- Choose a Specialist --</option>
                              {filteredAndSortedDoctors.length > 0 ? (
                                filteredAndSortedDoctors.map(d => (
                                    <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                                ))
                              ) : (
                                <option disabled>No doctors found matching filters</option>
                              )}
                            </select>
                          </div>

                          {/* Custom Inline Calendar - Full Width */}
                          <div className="grid-col-full">
                            <label className="form-label-bold">Select Date</label>
                            
                            <div className="inline-calendar">
                              <div className="calendar-nav">
                                <button 
                                  onClick={() => handleMonthChange(-1)}
                                  type="button"
                                  className="calendar-nav-btn"
                                >
                                  &lt; Prev
                                </button>
                                <span className="calendar-month-title">
                                  {calendarView.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>
                                <button 
                                  onClick={() => handleMonthChange(1)}
                                  type="button"
                                  className="calendar-nav-btn"
                                >
                                  Next &gt;
                                </button>
                              </div>

                              <div className="calendar-grid-header">
                                {/* Weekday Headers */}
                                {weekDays.map(day => (
                                  <div key={day}>
                                    {day}
                                  </div>
                                ))}
                              </div>

                              <div className="calendar-grid-days">
                                {/* Empty Slots for Start of Month */}
                                {Array.from({ length: startDay }).map((_, i) => (
                                  <div key={`empty-${i}`} />
                                ))}

                                {/* Days */}
                                {Array.from({ length: currentMonthDays }).map((_, i) => {
                                  const day = i + 1;
                                  const year = calendarView.getFullYear();
                                  const month = String(calendarView.getMonth() + 1).padStart(2, '0');
                                  const dStr = String(day).padStart(2, '0');
                                  const dateStr = `${year}-${month}-${dStr}`;
                                  
                                  const isSelected = newBooking.date === dateStr;
                                  const isToday = dateStr === today;
                                  const isPast = dateStr < today;

                                  let btnClass = "calendar-day-btn";
                                  if (isSelected) btnClass += " selected";
                                  else if (isToday) btnClass += " today";

                                  return (
                                    <button
                                      key={day}
                                      type="button"
                                      disabled={isPast}
                                      onClick={() => handleDateClick(day)}
                                      className={btnClass}
                                    >
                                      {day}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* Selected Date Indicator */}
                            {newBooking.date && (
                                <div style={{ marginTop: '10px', textAlign: 'right', fontSize: '0.9rem', color: '#0056b3', fontWeight: 'bold' }}>
                                    Selected: {newBooking.date}
                                </div>
                            )}
                          </div>

                          {/* Time Slot Selection Grid - Only shows when Doctor & Date are selected */}
                          {newBooking.doctorId && newBooking.date && (
                            <div className="grid-col-full">
                              <label className="form-label-bold">Available Time Slots</label>
                              <div className="time-slot-grid">
                                {timeSlots.map(slot => {
                                  const booked = isSlotBooked(slot);
                                  const isSelected = newBooking.time === slot;
                                  let slotClass = "time-slot-btn";
                                  if (booked) slotClass += " booked";
                                  else if (isSelected) slotClass += " selected";
                                  else slotClass += " available";

                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      disabled={booked}
                                      onClick={() => setNewBooking({ ...newBooking, time: slot })}
                                      className={slotClass}
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
                          <div className="grid-col-full">
                            <label className="form-label-bold">Reason for Visit</label>
                            <input
                              type="text"
                              className="booking-input"
                              placeholder="e.g. Annual checkup, Flu symptoms..."
                              value={newBooking.notes}
                              onChange={e => setNewBooking({ ...newBooking, notes: e.target.value })}
                            />
                          </div>

                          {/* Confirm Button */}
                          <div className="grid-col-full" style={{ textAlign: 'right', marginTop: '1rem' }}>
                            <button
                              className="btn-book-confirm"
                              onClick={handleBookAppointment}
                              disabled={!newBooking.time} 
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
                            
                            // LOGIC: If date is in past AND was approved/scheduled/confirmed -> Show as COMPLETED
                            let displayStatus = appt.status;
                            const isPast = appt.date < today;
                            const isApproved = ['APPROVED', 'CONFIRMED', 'SCHEDULED'].includes(appt.status.toUpperCase());
                            
                            if (isPast && isApproved) {
                                displayStatus = 'COMPLETED';
                            }

                            const style = getStatusStyle(displayStatus);
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
                                    {displayStatus}
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