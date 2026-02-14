import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, SignInIcon, DoctorIcon, PlusIcon, ListIcon, UsersIcon, CalendarIcon } from '../components/Icons.tsx';
import api from '../api/axios.Config.ts';

// types
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
  date?: string;
}

interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
}

//  Bar Chart
const EnhancedBarChart = ({ data, color }: { data: { label: string; value: number }[], color: string }) => {
  const maxValue = Math.max(...data.map(d => d.value), 5); // minimum scale of 5
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div style={{ width: '100%', padding: '25px 15px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', height: '180px', position: 'relative', alignItems: 'flex-end', gap: '20px', paddingLeft: '35px', paddingRight: '10px' }}>

        {/* Y-Axis Grid & Labels */}
        <div style={{ position: 'absolute', top: 0, left: '35px', right: '10px', bottom: 0, zIndex: 0, pointerEvents: 'none' }}>
          {gridLines.map((tick, i) => (
            <div key={i} style={{
              position: 'absolute',
              bottom: `${tick * 100}%`,
              width: '100%',
              borderBottom: '1px dashed #e5e7eb'
            }}>
              <span style={{
                position: 'absolute',
                left: '-35px',
                bottom: '-8px',
                fontSize: '0.7rem',
                color: '#9ca3af',
                width: '30px',
                textAlign: 'right'
              }}>
                {Math.round(tick * maxValue)}
              </span>
            </div>
          ))}
        </div>

        {/* Bars */}
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', zIndex: 1, position: 'relative' }}>
            <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <div
                style={{
                  width: '60%',
                  maxWidth: '50px',
                  height: `${(d.value / maxValue) * 100}%`,
                  background: `linear-gradient(180deg, ${color} 0%, ${color}DD 100%)`,
                  borderRadius: '8px 8px 0 0',
                  transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  position: 'relative',
                  minHeight: '6px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  cursor: 'pointer'
                }}
                title={`${d.label}: ${d.value}`}
              >
                {/* Floating Value Label */}
                <div style={{
                  position: 'absolute', top: '-28px', left: '50%', transform: 'translateX(-50%)',
                  background: '#1f2937', color: '#fff', padding: '3px 8px', borderRadius: '6px',
                  fontSize: '0.75rem', fontWeight: '600', opacity: d.value > 0 ? 1 : 0,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  transition: 'opacity 0.3s'
                }}>
                  {d.value}
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', marginTop: '12px', color: '#4b5563', fontWeight: '600', textAlign: 'center' }}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Donut Chart
const EnhancedDonutChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  let cumulativePercent = 0;

  if (total === 0) return <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontStyle: 'italic' }}>No Data Available</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '25px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>

      {/* SVG Donut */}
      <div style={{ position: 'relative', width: '200px', height: '200px', marginBottom: '25px' }}>
        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', overflow: 'visible' }}>
          {data.map((d, i) => {
            const percent = d.value / total;
            const r = 40;
            const circumference = 2 * Math.PI * r;
            const dashArray = `${percent * circumference} ${circumference}`;
            const offset = -(cumulativePercent * circumference);
            cumulativePercent += percent;

            return (
              <circle
                key={i}
                r={r} cx="50" cy="50"
                fill="transparent"
                stroke={d.color}
                strokeWidth="10"
                strokeDasharray={dashArray}
                strokeDashoffset={offset}
                strokeLinecap={percent > 0.05 ? "round" : "butt"}
                style={{ transition: 'all 0.8s ease', cursor: 'pointer', filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))' }}
              >
                <title>{d.label}: {d.value} ({Math.round(percent * 100)}%)</title>
              </circle>
            );
          })}
        </svg>
        {/* Center Text */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center', pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#111827', display: 'block', lineHeight: '1' }}>{total}</span>
          <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', marginTop: '5px', display: 'block' }}>Doctors</span>
        </div>
      </div>

      {/* Detailed Legend Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', width: '100%' }}>
        {data.map((d, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: '0.8rem', background: '#f9fafb', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f3f4f6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: d.color, borderRadius: '50%', flexShrink: 0 }}></span>
              <span style={{ color: '#4b5563', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }} title={d.label}>{d.label}</span>
            </div>
            <span style={{ fontWeight: '700', color: '#111827' }}>{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Line Chart 
const EnhancedLineChart = ({ dataPoints, labels, color }: { dataPoints: number[], labels: string[], color: string }) => {
  const max = Math.max(...dataPoints, 5);
  const hexColor = color.replace('#', '');

  // SVG Points for the line
  const points = dataPoints.map((val, i) => {
    const x = (i / (dataPoints.length - 1)) * 100;
    const y = 100 - (val / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  // Points for closing the area at the bottom
  const areaPoints = `${points} 100,100 0,100`;

  return (
    <div style={{ width: '100%', padding: '25px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
      <div style={{ width: '100%', height: '180px', position: 'relative' }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id={`grad-${hexColor}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <g key={y}>
              <line x1="0" y1={y} x2="100" y2={y} stroke="#f3f4f6" strokeWidth="0.5" />
            </g>
          ))}

          {/* Area Fill */}
          <polygon points={areaPoints} fill={`url(#grad-${hexColor})`} />

          {/* The Line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            points={points}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Dots */}
          {dataPoints.map((val, i) => {
            const x = (i / (dataPoints.length - 1)) * 100;
            const y = 100 - (val / max) * 100;
            return (
              <g key={i} className="chart-dot-group">
                <circle
                  cx={x} cy={y} r="3"
                  fill="#fff" stroke={color} strokeWidth="2"
                  style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                />
                <title>{labels[i]}: {val} Patients</title>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '0.75rem', color: '#6b7280', fontWeight: '600', padding: '0 5px', borderTop: '1px solid #f3f4f6', paddingTop: '10px' }}>
        {labels.map((lbl, i) => <span key={i}>{lbl}</span>)}
      </div>
    </div>
  );
};


const AdminDashboard = () => {
  const navigate = useNavigate();

  // states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'doctors' | 'patients' | 'appointments'>('dashboard');
  const [doctorSubTab, setDoctorSubTab] = useState<'view' | 'add'>('view');

  // Admin Name State
  const [adminName, setAdminName] = useState('');

  // Data State 
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);

  // Doctor Form State 
  const [newDoctor, setNewDoctor] = useState<Doctor>({
    name: '', specialization: '', email: '', phone: '', experience: '', password: ''
  });

  const handleLogout = () => {
    localStorage.removeItem('adminData');
    navigate('/admin-login');
  };

  // Load Admin Name 
  useEffect(() => {
    const storedData = localStorage.getItem('adminData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (parsedData.name) {
          const firstName = parsedData.name.split(' ')[0];
          setAdminName(firstName);
        } else if (parsedData.email) {
          const nameFromEmail = parsedData.email.split('@')[0];
          setAdminName(nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
        }
      } catch (e) {
        console.error("Error parsing admin data", e);
      }
    }
  }, []);

  // api call
  const fetchDoctors = async () => {
    try { const res = await api.get('/doctors'); setDoctorsList(res.data); } catch (err) { console.error(err); }
  };

  const fetchPatients = async () => {
    try { const res = await api.get('/patients'); setPatientsList(res.data); } catch (err) { console.error(err); }
  };

  const fetchAppointments = async () => {
    try { const res = await api.get('/appointments'); setAppointmentsList(res.data); } catch (err) { console.error(err); }
  };

  // Add doctor function
  const handleAddDoctor = async () => {
    try {
      if (!newDoctor.name || !newDoctor.email || !newDoctor.password) {
        alert("Please fill in required fields!");
        return;
      }

      await api.post('/doctors', newDoctor);
      alert("Doctor Added Successfully!");

      // Clear form
      setNewDoctor({ name: '', specialization: '', email: '', phone: '', experience: '', password: '' });
      fetchDoctors();
      setDoctorSubTab('view');

    } catch (error) {
      console.error("Error adding doctor:", error);
      alert("Failed to add doctor!");
    }
  };

  // Fetch data (on load)
  useEffect(() => {
    fetchDoctors();
    fetchPatients();
    fetchAppointments();
  }, []);


  // Doctor Specializations for Donut Chart
  const specializationStats = useMemo(() => {
    const stats: Record<string, number> = {};
    doctorsList.forEach(doc => {
      const spec = doc.specialization || 'General';
      stats[spec] = (stats[spec] || 0) + 1;
    });

    // Vibrant Palette for different slices
    const colors = ['#4f46e5', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

    return Object.keys(stats).map((key, index) => ({
      label: key,
      value: stats[key],
      color: colors[index % colors.length]
    }));
  }, [doctorsList]);

  // Appointment Status for Bar Chart
  const appointmentStats = useMemo(() => {
    let confirmed = 0;
    let pending = 0;
    let cancelled = 0;

    appointmentsList.forEach(app => {
      const rawStatus = app.status ? app.status.toLowerCase() : 'pending';
      if (rawStatus.includes('confirm') || rawStatus.includes('accept') || rawStatus.includes('schedul')) {
        confirmed++;
      }
      else if (rawStatus.includes('cancel') || rawStatus.includes('reject') || rawStatus.includes('decline')) {
        cancelled++;
      }
      else {
        pending++;
      }
    });

    return [
      { label: 'Confirmed', value: confirmed },
      { label: 'Pending', value: pending },
      { label: 'Cancelled', value: cancelled }
    ];
  }, [appointmentsList]);

  // Patient Growth Stats for Line Chart
  const patientGrowthStats = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleString('default', { month: 'short' }));
    }

    const counts = new Array(6).fill(0);
    patientsList.forEach(p => {
      let date;
      if (p.date) {
        date = new Date(p.date);
      } else {
        date = new Date();
      }

      const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      if (monthDiff >= 0 && monthDiff < 6) {
        const index = 5 - monthDiff;
        counts[index]++;
      }
    });

    return { labels: months, dataPoints: counts };
  }, [patientsList]);


  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Admin Dashboard';
      case 'doctors': return 'Manage Doctors';
      case 'patients': return 'Patient Directory';
      case 'appointments': return 'All Appointments';
      default: return '';
    }
  };

  return (
    <div className="dashboard-layout">
      {/* --- SIDEBAR --- */}
      <div className="dashboard-sidebar">
        <div className="dashboard-logo">
          <h2>HealthCare+</h2>
        </div>

        <nav className="dashboard-nav">
          <button onClick={() => setActiveTab('dashboard')} className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <UserIcon /> <span>Dashboard</span>
          </button>

          <button onClick={() => setActiveTab('doctors')} className={`nav-item ${activeTab === 'doctors' ? 'active' : ''}`}>
            <DoctorIcon /> <span>Manage Doctors</span>
          </button>

          <button onClick={() => setActiveTab('patients')} className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`}>
            <UsersIcon /> <span>View Patients</span>
          </button>

          <button onClick={() => setActiveTab('appointments')} className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}>
            <CalendarIcon /> <span>Appointments</span>
          </button>
        </nav>

        <div className="dashboard-logout">
          <button onClick={handleLogout} className="nav-item">
            <SignInIcon /> <span>Logout</span>
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="dashboard-main">
        <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>{getTitle()}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>Welcome,</span>
              <span style={{ fontWeight: 'bold', color: '#063ca8', fontSize: '1.1rem' }}>
                {adminName || 'Admin'}
              </span>
            </div>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', background: '#f4f7fa',
              color: '#063ca8', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0e0e0'
            }}>
              <UserIcon />
            </div>
          </div>
        </header>

        <div className="dashboard-content-wrapper">

          <div className="main-slider-viewport">
            <div className={`main-slider-track pos-${activeTab}`}>

              {/* --- DASHBOARD --- */}
              <div className="main-slider-slide">
                <section className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                  {/* Top Stats Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    <div className="stat-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Total Patients</h3>
                        <UsersIcon />
                      </div>
                      <p>{patientsList.length}</p>
                    </div>
                    <div className="stat-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Doctors</h3>
                        <DoctorIcon />
                      </div>
                      <p>{doctorsList.length}</p>
                    </div>
                    <div className="stat-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Appointments</h3>
                        <CalendarIcon />
                      </div>
                      <p>{appointmentsList.length}</p>
                    </div>
                  </div>

                  {/* Charts Section */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', marginBottom: '40px' }}>

                    {/* Chart 1: Doctor Specialization */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ marginBottom: '15px', color: '#374151', fontSize: '1.1rem', fontWeight: '600' }}>Doctor Specializations</h4>
                      <EnhancedDonutChart data={specializationStats} />
                    </div>

                    {/* Chart 2: Appointment Status */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ marginBottom: '15px', color: '#374151', fontSize: '1.1rem', fontWeight: '600' }}>Appointments Status</h4>
                      <EnhancedBarChart data={appointmentStats} color="#3b82f6" />
                    </div>

                    {/* Chart 3: Patient Growth (Dynamic) */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ marginBottom: '15px', color: '#374151', fontSize: '1.1rem', fontWeight: '600' }}>Patient Growth Trend</h4>
                      <EnhancedLineChart
                        dataPoints={patientGrowthStats.dataPoints}
                        labels={patientGrowthStats.labels}
                        color="#10b981"
                      />
                    </div>

                  </div>

                </section>
              </div>

              {/* --- MANAGE DOCTORS --- */}
              <div className="main-slider-slide">
                <section className="doctors-section">
                  <div className="action-buttons-container">
                    <button className={`action-btn ${doctorSubTab === 'view' ? 'active' : ''}`} onClick={() => setDoctorSubTab('view')}>
                      <ListIcon /> View Doctors
                    </button>
                    <button className={`action-btn ${doctorSubTab === 'add' ? 'active' : ''}`} onClick={() => setDoctorSubTab('add')}>
                      <PlusIcon /> Add Doctor
                    </button>
                  </div>

                  <div className="slider-viewport">
                    <div className={`slider-track ${doctorSubTab === 'add' ? 'slide-left' : ''}`}>
                      {/* List */}
                      <div className="slider-slide">
                        <div className="table-container">
                          <table className="data-table">
                            <thead>
                              <tr><th>ID</th><th>Name</th><th>Specialization</th><th>Email</th><th>Phone</th><th>Exp</th></tr>
                            </thead>
                            <tbody>
                              {doctorsList.map((d) => (
                                <tr key={d.id}>
                                  <td>{d.id}</td><td>{d.name}</td><td>{d.specialization}</td><td>{d.email}</td><td>{d.phone}</td><td>{d.experience}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Add Form */}
                      <div className="slider-slide">
                        <div className="form-container">
                          <h3>Register New Doctor</h3>
                          <form className="admin-form">
                            <div className="form-row">
                              <div className="form-group"><label>Doctor Name</label><input type="text" value={newDoctor.name} onChange={e => setNewDoctor({ ...newDoctor, name: e.target.value })} /></div>
                              <div className="form-group"><label>Specialization</label><input type="text" value={newDoctor.specialization} onChange={e => setNewDoctor({ ...newDoctor, specialization: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                              <div className="form-group"><label>Email</label><input type="email" value={newDoctor.email} onChange={e => setNewDoctor({ ...newDoctor, email: e.target.value })} /></div>
                              <div className="form-group"><label>Phone</label><input type="text" value={newDoctor.phone} onChange={e => setNewDoctor({ ...newDoctor, phone: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                              <div className="form-group"><label>Experience</label><input type="text" value={newDoctor.experience} onChange={e => setNewDoctor({ ...newDoctor, experience: e.target.value })} /></div>
                              <div className="form-group"><label>Password</label><input type="password" value={newDoctor.password} onChange={e => setNewDoctor({ ...newDoctor, password: e.target.value })} /></div>
                            </div>
                            <button type="button" className="save-btn" onClick={handleAddDoctor}>Save Doctor</button>
                          </form>
                        </div>
                      </div>

                    </div>
                  </div>
                </section>
              </div>

              {/* --- PATIENT DIRECTORY --- */}
              <div className="main-slider-slide">
                <section className="doctors-section">
                  <div className="table-container">
                    <table className="data-table">
                      <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th></tr></thead>
                      <tbody>
                        {patientsList.map((p) => (
                          <tr key={p.id}><td>{p.id}</td><td>{p.firstName} {p.lastName}</td><td>{p.email}</td><td>{p.phone}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* --- ALL APPOINTMENTS --- */}
              <div className="main-slider-slide">
                <section className="doctors-section">
                  <div className="table-container">
                    <table className="data-table">
                      <thead><tr><th>ID</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
                      <tbody>
                        {appointmentsList.map((a) => (
                          <tr key={a.id}><td>{a.id}</td><td>{a.date}</td><td>{a.time}</td><td>{a.status}</td></tr>
                        ))}
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

export default AdminDashboard;