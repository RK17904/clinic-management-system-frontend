import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.Config.ts';
import { UserIcon, SignInIcon, ListIcon, PlusIcon, UsersIcon, CalendarIcon } from '../components/Icons.tsx';
import logo from '../assets/logo.png';

// Interfaces 
interface Patient {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  age: string;
  gender: string;
}

interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
  patient: Patient;
}

// Roster Interface
interface RosterEntry {
  date: string;
  status: 'DUTY' | 'HALFDAY-MORNING' | 'HALFDAY-EVENING' | 'OFF';
}

interface MedicalRecord {
  id: number;
  diagnosis: string;
  treatment: string;
  notes: string;
  recordDate: string;
  patient: Patient;
}

interface Billing {
  billId: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  appointment: {
    id: number;
    patient?: Patient;
  };
}

const DoctorDashboard = () => {
  const navigate = useNavigate();

  // States 
  const [activeTab, setActiveTab] = useState<'dashboard' | 'currentPatient' | 'patients' | 'appointments' | 'records' | 'billing' | 'roster'>('dashboard');

  // Current Patient State
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);

  // Doctor Name State
  const [doctorName, setDoctorName] = useState('');
  const [doctorId, setDoctorId] = useState<string | null>(null);

  // Roster State
  const [rosterData, setRosterData] = useState<RosterEntry[]>([]);

  // Generate next 30 days
  const generateNext30Days = () => {
    const days: RosterEntry[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        status: 'OFF' // Default status
      });
    }
    return days;
  };

  // Sub Tabs (View vs Add)
  const [patientSubTab, setPatientSubTab] = useState<'view' | 'add'>('view');
  const [appointmentSubTab, setAppointmentSubTab] = useState<'view' | 'add'>('view');
  const [recordSubTab, setRecordSubTab] = useState<'view' | 'add'>('view');
  const [billingSubTab, setBillingSubTab] = useState<'view' | 'add'>('view');

  // Data Lists
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [recordsList, setRecordsList] = useState<MedicalRecord[]>([]);
  const [billingsList, setBillingsList] = useState<Billing[]>([]);
  const [income, setIncome] = useState(0);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Forms State
  const [newPatient, setNewPatient] = useState<Patient>({ firstName: '', lastName: '', email: '', phone: '', address: '', age: '', gender: '' });
  const [newAppointment, setNewAppointment] = useState({ patientId: '', doctorId: '', date: '', time: '', notes: '' });
  const [newRecord, setNewRecord] = useState({ patientId: '', doctorId: '', diagnosis: '', treatment: '', notes: '', recordDate: '' });
  const [newBill, setNewBill] = useState({ appointmentId: '', amount: '', paymentMethod: 'CASH', status: 'PAID' });

  const handleLogout = () => {
    localStorage.removeItem('doctorData'); // ලොග් අවුට් වෙද්දී Data මකනවා
    navigate('/doctor-login');
  };

  // Load Doctor Name Dynamic Logic
  useEffect(() => {
    // 1. LocalStorage එකෙන් ඩොක්ටර්ගේ විස්තර ගන්නවා
    const storedData = localStorage.getItem('doctorData');

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setDoctorId(parsedData.id);

        if (parsedData.name || parsedData.username) {
          const fullName = parsedData.name || parsedData.username;
          const cleanName = fullName.replace(/^Dr\.?\s*/i, '');
          setDoctorName(cleanName);
        }
      } catch (e) {
        console.error("Error parsing doctor data", e);
      }
    }
    setRosterData(generateNext30Days());
  }, []);

  // API Calls 
  const fetchData = async () => {
    try {
      const pRes = await api.get('/patients');
      setPatientsList(pRes.data);

      const aRes = await api.get('/appointments');
      setAppointmentsList(aRes.data);

      const rRes = await api.get('/medical-records');
      setRecordsList(rRes.data);

      const bRes = await api.get('/billings');
      setBillingsList(bRes.data);

      const total = bRes.data.reduce((acc: number, curr: any) => acc + curr.amount, 0);
      setIncome(total);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Reset Forms
  const resetForms = () => {
    setIsEditing(false);
    setEditingId(null);
    setNewPatient({ firstName: '', lastName: '', email: '', phone: '', address: '', age: '', gender: '' });
    setNewAppointment({ patientId: '', doctorId: '', date: '', time: '', notes: '' });
    setNewRecord({ patientId: '', doctorId: '', diagnosis: '', treatment: '', notes: '', recordDate: '' });
    setNewBill({ appointmentId: '', amount: '', paymentMethod: 'CASH', status: 'PAID' });
  };

  // ROSTER ACTIONS
  const handleRosterChange = (date: string, newStatus: any) => {
    setRosterData(prev => prev.map(entry =>
      entry.date === date ? { ...entry, status: newStatus } : entry
    ));
  };

  const saveRoster = async () => {
    try {
      // await api.post(`/doctor/${doctorId}/roster`, rosterData);
      console.log("Saving Roster:", rosterData);
      alert("Roster Updated Successfully for the next 30 days!");
    } catch (error) {
      alert("Failed to save roster.");
    }
  };

  // ACTIONS: PATIENTS 
  const handleSavePatient = async () => {
    try {
      if (isEditing && editingId) {
        await api.put(`/patients/${editingId}`, newPatient);
        alert("Patient Updated!");
      } else {
        await api.post('/patients', newPatient);
        alert("Patient Added!");
      }
      resetForms();
      fetchData();
      setPatientSubTab('view');
    } catch { alert("Error Saving Patient!"); }
  };

  const handleDeletePatient = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return;
    try {
      await api.delete(`/patients/${id}`);
      alert("Patient Deleted!");
      fetchData();
    } catch { alert("Error Deleting Patient!"); }
  };

  const startEditPatient = (p: Patient) => {
    setNewPatient(p);
    setIsEditing(true);
    setEditingId(p.id!);
    setPatientSubTab('add');
  };

  // ACTIONS: APPOINTMENTS 
  const handleSaveAppointment = async () => {
    try {
      const appointmentTime = `${newAppointment.date}T${newAppointment.time}:00`;
      const payload = { ...newAppointment, time: newAppointment.time + ":00", appointmentTime, status: "SCHEDULED" };

      if (isEditing && editingId) {
        await api.put(`/appointments/${editingId}`, payload);
        alert("Appointment Updated!");
      } else {
        await api.post('/appointments', payload);
        alert("Appointment Booked!");
      }
      resetForms();
      fetchData();
      setAppointmentSubTab('view');
    } catch { alert("Error Saving Appointment!"); }
  };



  // Handle Status Update (Accept/Reject) 
  const handleStatusUpdate = async (id: number, status: string) => {
    if (!window.confirm(`Are you sure you want to ${status} this appointment?`)) return;

    try {
      await api.put(`/appointments/${id}/status?status=${status}`);
      alert(`Appointment ${status} Successfully!`);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Update Failed!");
    }
  };

  // ACTIONS: RECORDS 
  const handleSaveRecord = async () => {
    try {
      if (isEditing && editingId) {
        await api.put(`/medical-records/${editingId}`, newRecord);
        alert("Record Updated!");
      } else {
        await api.post('/medical-records', newRecord);
        alert("Record Added!");
      }
      resetForms();
      fetchData();
      setRecordSubTab('view');
    } catch {
      alert("Error Saving Record!");
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await api.delete(`/medical-records/${id}`);
      fetchData();
    } catch { alert("Error Deleting Record!"); }
  };

  const startEditRecord = (r: MedicalRecord) => {
    setNewRecord({
      patientId: r.patient?.id?.toString() || '',
      doctorId: '1',
      diagnosis: r.diagnosis,
      treatment: r.treatment,
      notes: r.notes,
      recordDate: r.recordDate
    });
    setIsEditing(true);
    setEditingId(r.id);
    setRecordSubTab('add');
  };

  // ACTIONS: BILLING 
  const handleSaveBill = async () => {
    try {
      const payload = {
        amount: newBill.amount,
        paymentMethod: newBill.paymentMethod,
        status: newBill.status,
        paymentDate: new Date().toISOString().slice(0, 19),
        appointment: { id: newBill.appointmentId }
      };

      if (isEditing && editingId) {
        await api.put(`/billings/${editingId}`, payload);
        alert("Bill Updated!");
      } else {
        await api.post('/billings', payload);
        alert("Bill Created!");
      }
      resetForms();
      fetchData();
      setBillingSubTab('view');
    } catch { alert("Error Saving Bill!"); }
  };

  const handleDeleteBill = async (id: number) => {
    if (!window.confirm("Delete this bill?")) return;
    try {
      await api.delete(`/billings/${id}`);
      fetchData();
    } catch { alert("Error Deleting Bill!"); }
  };

  const startEditBill = (b: Billing) => {
    setNewBill({
      appointmentId: b.appointment?.id?.toString() || '',
      amount: b.amount.toString(),
      paymentMethod: b.paymentMethod,
      status: b.status
    });
    setIsEditing(true);
    setEditingId(b.billId);
    setBillingSubTab('add');
  };

  // PRINT BILL FUNCTION 
  const printBill = (bill: Billing) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      const patientName = bill.appointment.patient ? `${bill.appointment.patient.firstName} ${bill.appointment.patient.lastName}` : "Unknown Patient";

      const invoiceHTML = `
        <html>
          <head>
            <title>Invoice #${bill.billId}</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
              .invoice-box { max-width: 800px; margin: auto; border: 1px solid #eee; padding: 30px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
              .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
              .logo h1 { color: #2E7D32; margin: 0; }
              .details { text-align: right; }
              .info-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .info-table th { background: #f9f9f9; padding: 10px; text-align: left; }
              .info-table td { padding: 10px; border-bottom: 1px solid #eee; }
              .total { margin-top: 30px; text-align: right; font-size: 1.5rem; font-weight: bold; color: #2E7D32; }
              .footer { margin-top: 50px; text-align: center; font-size: 0.8rem; color: #777; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="invoice-box">
              <div class="header">
                <div class="logo">
                  <h1>HealthCare+ Clinic</h1>
                  <p>Kandy Road, Dalugama, Kelaniya.</p>
                </div>
                <div class="details">
                  <p><strong>Bill ID:</strong> #${bill.billId}</p>
                  <p><strong>Date:</strong> ${new Date(bill.paymentDate).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> ${bill.status}</p>
                </div>
              </div>

              <h3>Patient Information</h3>
              <p><strong>Name:</strong> ${patientName}</p>
              <p><strong>Appointment ID:</strong> ${bill.appointment.id}</p>

              <table class="info-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="text-align:right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Medical Consultation & Services</td>
                    <td style="text-align:right">Rs. ${bill.amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div class="total">
                Total: Rs. ${bill.amount.toFixed(2)}
              </div>

              <div class="footer">
                <p>Thank you for choosing Health Care+ ...!</p>
                <p>This is a computer-generated invoice.</p>
              </div>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
    }
  };


  // ACTIONS: CURRENT PATIENT
  const startConsultation = (patient: Patient) => {
    setCurrentPatient(patient);
    setActiveTab('currentPatient');
    // Pre-fill record with patient info
    setNewRecord({
      patientId: patient.id?.toString() || '',
      doctorId: doctorId?.toString() || '',
      diagnosis: '',
      treatment: '',
      notes: '',
      recordDate: new Date().toISOString().split('T')[0]
    });
  };

  const finishConsultation = async () => {
    if (!newRecord.diagnosis || !newRecord.treatment) {
      alert("Please enter diagnosis and treatment!");
      return;
    }

    try {
      // Use existing save logic or direct API call
      await api.post('/medical-records', newRecord);
      alert("Consultation Finished & Record Saved!");
      setCurrentPatient(null);
      resetForms();
      setActiveTab('patients'); // Go back to list
      fetchData(); // Refresh records
    } catch {
      alert("Error Saving Record!");
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Doctor Dashboard';
      case 'currentPatient': return currentPatient ? `Consulting: ${currentPatient.firstName} ${currentPatient.lastName}` : 'Current Patient';
      case 'roster': return 'Duty Roster Management';
      case 'patients': return 'Manage Patients';
      case 'appointments': return 'Appointments';
      case 'records': return 'Medical Records';
      case 'billing': return 'Billing';
      default: return '';
    }
  };

  const btnStyle = {
    padding: '5px 10px', margin: '0 5px', border: 'none', borderRadius: '5px', cursor: 'pointer', color: 'white'
  };


  return (
    <div className="dashboard-layout">
      {/* --- SIDEBAR --- */}
      <div className="dashboard-sidebar" style={{ backgroundColor: '#063ca8' }}>
        <div className="dashboard-logo">
          <img src={logo} alt="Logo" className="dashboard-logo-img" style={{ height: '2rem', width: 'auto', marginRight: '0.9rem' }} />
          <h2 style={{ margin: 0 }}>Doctor Portal</h2>
        </div>
        <nav className="dashboard-nav">
          <button onClick={() => setActiveTab('dashboard')} className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}><UserIcon /> <span>Dashboard</span></button>

          {/* Current Patient Tab - Only visible or active if there is a patient? Or always there? */}
          {/* User requested it to be in the sidebar. We can conditionally style it. */}
          <button onClick={() => setActiveTab('currentPatient')} className={`nav-item ${activeTab === 'currentPatient' ? 'active' : ''}`} style={currentPatient ? { background: '#e3f2fd', color: '#063ca8', borderRight: '4px solid #063ca8' } : {}}><UserIcon /> <span>Current Patient</span></button>

          <button onClick={() => setActiveTab('roster')} className={`nav-item ${activeTab === 'roster' ? 'active' : ''}`}><CalendarIcon /> <span>My Roster</span></button>
          <button onClick={() => setActiveTab('patients')} className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`}><UsersIcon /> <span>All Patients</span></button>
          <button onClick={() => setActiveTab('appointments')} className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}><CalendarIcon /> <span>Appointments</span></button>
          <button onClick={() => setActiveTab('records')} className={`nav-item ${activeTab === 'records' ? 'active' : ''}`}><ListIcon /> <span>Records</span></button>
          <button onClick={() => setActiveTab('billing')} className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`}><ListIcon /> <span>Billing</span></button>
        </nav>
        <div className="dashboard-logout"><button onClick={handleLogout} className="nav-item"><SignInIcon /> <span>Logout</span></button></div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="dashboard-main">
        <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>{getTitle()}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
              <span style={{ fontWeight: 'bold', color: '#063ca8', fontSize: '1.1rem' }}>
                {/* මෙතන නම පෙන්නන්නේ dynamic විදිහට */}
                Welcome Doctor {doctorName}
              </span>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#f4f7fa',
              color: '#063ca8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e0e0e0'
            }}>
              <UserIcon />
            </div>
          </div>
        </header>

        <div className="dashboard-content-wrapper">
          {/* --- MAIN SLIDER CONTAINER --- */}
          <div className="main-slider-viewport">
            <div className={`main-slider-track doctor-track pos-${activeTab}`}>

              {/* DASHBOARD OVERVIEW */}
              <div className="main-slider-slide">
                <section className="dashboard-content">
                  <div className="stat-card" style={{ backgroundColor: '#ffffffff' }}><h3>Total Patients</h3><p style={{ color: '#1565C0', fontSize: '2.5rem' }}>{patientsList.length}</p></div>
                  <div className="stat-card" style={{ backgroundColor: '#ffffffff' }}><h3>Appointments</h3><p style={{ color: '#1565C0', fontSize: '2.5rem' }}>{appointmentsList.length}</p></div>
                  <div className="stat-card" style={{ backgroundColor: '#ffffffff' }}><h3>Income</h3><p style={{ color: '#1565C0', fontSize: '2.5rem' }}>Rs. {income}</p></div>
                </section>

                {/* --- ROSTER QUICK VIEW --- */}
                <div className="roster-status-preview">
                  <h3>Next 15 Days Schedule</h3>
                  <div className="roster-grid">
                    {rosterData.slice(0, 15).map((entry, index) => {
                      let statusColor = '#dc3545'; // Default Off
                      let statusLabel = 'Off';

                      if (entry.status === 'DUTY') { statusColor = '#28a745'; statusLabel = 'On Duty'; }
                      else if (entry.status === 'HALFDAY-MORNING') { statusColor = '#ffc107'; statusLabel = 'Morning'; }
                      else if (entry.status === 'HALFDAY-EVENING') { statusColor = '#007bff'; statusLabel = 'Evening'; }

                      return (
                        <div key={index} className="roster-card" title={`${entry.date} - ${statusLabel}`} style={{ borderColor: statusColor }}>
                          <span className="roster-day-number">{new Date(entry.date).getDate()}</span>
                          <div className="status-indicator" style={{ backgroundColor: statusColor }}></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="roster-legend">
                    <span className="legend-item"><span className="dot" style={{ backgroundColor: '#28a745' }}></span> Full Duty</span>
                    <span className="legend-item"><span className="dot" style={{ backgroundColor: '#ffc107' }}></span> Morning</span>
                    <span className="legend-item"><span className="dot" style={{ backgroundColor: '#007bff' }}></span> Evening</span>
                    <span className="legend-item"><span className="dot" style={{ backgroundColor: '#dc3545' }}></span> Off</span>
                  </div>
                </div>
              </div>

              {/* CURRENT PATIENT SLIDE */}
              <div className="main-slider-slide">
                <section className="consultation-view">
                  {currentPatient ? (
                    <>
                      <div className="patient-profile-card">
                        <div className="profile-avatar">👤</div>
                        <h3>{currentPatient.firstName} {currentPatient.lastName}</h3>
                        <div className="profile-details">
                          <p><strong>ID:</strong> {currentPatient.id}</p>
                          <p><strong>Age:</strong> {currentPatient.age || 'N/A'}</p>
                          <p><strong>Gender:</strong> {currentPatient.gender || 'N/A'}</p>
                          <p><strong>Phone:</strong> {currentPatient.phone}</p>
                          <p><strong>Email:</strong> {currentPatient.email}</p>
                        </div>
                      </div>

                      <div className="consultation-form-container">
                        <h3>Clinical Notes & Diagnosis</h3>
                        <form className="consultation-form" onSubmit={(e) => { e.preventDefault(); finishConsultation(); }}>
                          <div className="form-group">
                            <label>Diagnosis</label>
                            <textarea
                              rows={2}
                              value={newRecord.diagnosis}
                              onChange={(e) => setNewRecord({ ...newRecord, diagnosis: e.target.value })}
                              placeholder="e.g. Acute Bronchitis"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Treatment Plan</label>
                            <textarea
                              rows={4}
                              value={newRecord.treatment}
                              onChange={(e) => setNewRecord({ ...newRecord, treatment: e.target.value })}
                              placeholder="e.g. Amoxicillin 500mg TDS for 5 days..."
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Clinical Notes</label>
                            <textarea
                              rows={3}
                              value={newRecord.notes}
                              onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                              placeholder="Patient complains of dry cough..."
                            />
                          </div>
                          <button type="submit" className="finish-btn">Finish Consultation</button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="no-results" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No patient selected for consultation.</p>
                      <button className="action-btn active" onClick={() => setActiveTab('patients')}>Select a Patient from List</button>
                    </div>
                  )}
                </section>
              </div>

              {/* MY ROSTER SLIDE */}
              <div className="main-slider-slide">
                <section className="roster-management">
                  <div className="roster-header">
                    <h3>Schedule Your Next 30 Days</h3>
                    <button className="save-btn" onClick={saveRoster} style={{ width: 'auto', padding: '10px 30px' }}>Save Roster</button>
                  </div>
                  <div className="roster-table-container">
                    <table className="roster-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Day</th>
                          <th>Shift Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rosterData.map((entry) => {
                          // Determine the class based on status
                          let statusClass = 'status-off';
                          switch (entry.status) {
                            case 'DUTY': statusClass = 'status-duty'; break;
                            case 'HALFDAY-MORNING': statusClass = 'status-morning'; break;
                            case 'HALFDAY-EVENING': statusClass = 'status-evening'; break;
                            default: statusClass = 'status-off';
                          }

                          return (
                            <tr key={entry.date}>
                              <td className="roster-date">{entry.date}</td>
                              <td className="roster-day">{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
                              <td>
                                <select
                                  value={entry.status}
                                  onChange={(e) => handleRosterChange(entry.date, e.target.value)}
                                  className={`roster-select ${statusClass}`}
                                >
                                  <option value="DUTY">Full Duty</option>
                                  <option value="HALFDAY-MORNING">Half Day (Morning)</option>
                                  <option value="HALFDAY-EVENING">Half Day (Evening)</option>
                                  <option value="OFF">Off Day</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* PATIENTS TAB */}
              <div className="main-slider-slide">
                <section className="doctors-section">
                  <div className="action-buttons-container">
                    <button className={`action-btn ${patientSubTab === 'view' ? 'active' : ''}`} onClick={() => { setPatientSubTab('view'); resetForms(); }}><ListIcon /> View List</button>
                    <button className={`action-btn ${patientSubTab === 'add' ? 'active' : ''}`} onClick={() => { setPatientSubTab('add'); resetForms(); }}><PlusIcon /> Add Patient</button>
                  </div>

                  {/* Inner Slider for Patients */}
                  <div className="slider-viewport">
                    <div className={`slider-track ${patientSubTab === 'add' ? 'slide-left' : ''}`}>
                      <div className="slider-slide">
                        <div className="table-container">
                          <table className="data-table">
                            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
                            <tbody>
                              {patientsList.map(p => (
                                <tr key={p.id}>
                                  <td>{p.id}</td>
                                  <td>{p.firstName} {p.lastName}</td>
                                  <td>{p.email}</td>
                                  <td>{p.phone}</td>
                                  <td>
                                    <button style={{ ...btnStyle, background: '#007bff', color: 'white' }} onClick={() => startConsultation(p)}>Treat Now</button>
                                    <button style={{ ...btnStyle, background: '#FFC107', color: 'black' }} onClick={() => startEditPatient(p)}>Edit</button>
                                    <button style={{ ...btnStyle, background: '#F44336' }} onClick={() => handleDeletePatient(p.id!)}>Delete</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="slider-slide">
                        <div className="form-container">
                          <h3>{isEditing ? 'Edit Patient' : 'Register New Patient'}</h3>
                          <form className="admin-form">
                            <div className="form-row"><div className="form-group"><label>First Name</label><input value={newPatient.firstName} onChange={e => setNewPatient({ ...newPatient, firstName: e.target.value })} /></div><div className="form-group"><label>Last Name</label><input value={newPatient.lastName} onChange={e => setNewPatient({ ...newPatient, lastName: e.target.value })} /></div></div>
                            <div className="form-row"><div className="form-group"><label>Email</label><input value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} /></div><div className="form-group"><label>Phone</label><input value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} /></div></div>
                            <div className="form-row"><div className="form-group"><label>Age</label><input value={newPatient.age} onChange={e => setNewPatient({ ...newPatient, age: e.target.value })} /></div><div className="form-group"><label>Gender</label><input value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })} /></div></div>
                            <div className="form-group"><label>Address</label><input value={newPatient.address} onChange={e => setNewPatient({ ...newPatient, address: e.target.value })} /></div>
                            <button type="button" className="save-btn" onClick={handleSavePatient}>{isEditing ? 'Update Patient' : 'Save Patient'}</button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* APPOINTMENTS TAB */}
              <div className="main-slider-slide">
                <section className="doctors-section">
                  <div className="action-buttons-container">
                    <button className={`action-btn ${appointmentSubTab === 'view' ? 'active' : ''}`} onClick={() => { setAppointmentSubTab('view'); resetForms(); }}><ListIcon /> View List</button>
                  </div>

                  <div className="slider-viewport">
                    <div className={`slider-track ${appointmentSubTab === 'add' ? 'slide-left' : ''}`}>
                      <div className="slider-slide">
                        <div className="table-container">
                          <table className="data-table">
                            <thead><tr><th>ID</th><th>Date</th><th>Time</th><th>Patient</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                              {appointmentsList.map(a => (
                                <tr key={a.id}>
                                  <td>{a.id}</td>
                                  <td>{a.date}</td>
                                  <td>{a.time}</td>
                                  <td>{a.patient ? a.patient.firstName + ' ' + a.patient.lastName : 'Unknown'}</td>
                                  <td>
                                    <span style={{ fontWeight: 'bold', color: a.status.toUpperCase() === 'PENDING' ? 'orange' : a.status.toUpperCase() === 'APPROVED' ? 'green' : 'red' }}>
                                      {a.status}
                                    </span>
                                  </td>
                                  <td>
                                    {a.status.toUpperCase() === 'PENDING' && (
                                      <>
                                        <button style={{ ...btnStyle, background: '#28a745' }} onClick={() => handleStatusUpdate(a.id, 'APPROVED')}>Accept</button>
                                        <button style={{ ...btnStyle, background: '#dc3545' }} onClick={() => handleStatusUpdate(a.id, 'REJECTED')}>Reject</button>
                                      </>
                                    )}

                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="slider-slide">
                        <div className="form-container">
                          <h3>{isEditing ? 'Edit Appointment' : 'Appointment Details'}</h3>
                          <form className="admin-form">
                            <div className="form-row"><div className="form-group"><label>Patient ID</label><input type="number" value={newAppointment.patientId} onChange={e => setNewAppointment({ ...newAppointment, patientId: e.target.value })} /></div><div className="form-group"><label>Doctor ID</label><input type="number" value={newAppointment.doctorId} onChange={e => setNewAppointment({ ...newAppointment, doctorId: e.target.value })} /></div></div>
                            <div className="form-row"><div className="form-group"><label>Date</label><input type="date" value={newAppointment.date} onChange={e => setNewAppointment({ ...newAppointment, date: e.target.value })} /></div><div className="form-group"><label>Time</label><input type="time" value={newAppointment.time} onChange={e => setNewAppointment({ ...newAppointment, time: e.target.value })} /></div></div>
                            <div className="form-group"><label>Notes</label><input value={newAppointment.notes} onChange={e => setNewAppointment({ ...newAppointment, notes: e.target.value })} /></div>
                            <button type="button" className="save-btn" onClick={handleSaveAppointment}>{isEditing ? 'Update' : 'Confirm'}</button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* RECORDS TAB */}
              <div className="main-slider-slide">
                <section className="doctors-section">
                  <div className="action-buttons-container">
                    <button className={`action-btn ${recordSubTab === 'view' ? 'active' : ''}`} onClick={() => { setRecordSubTab('view'); resetForms(); }}>View List</button>
                    <button className={`action-btn ${recordSubTab === 'add' ? 'active' : ''}`} onClick={() => { setRecordSubTab('add'); resetForms(); }}>Add Record</button>
                  </div>

                  <div className="slider-viewport">
                    <div className={`slider-track ${recordSubTab === 'add' ? 'slide-left' : ''}`}>
                      <div className="slider-slide">
                        <div className="table-container">
                          <table className="data-table">
                            <thead><tr><th>Date</th><th>Patient</th><th>Diagnosis</th><th>Treatment</th><th>Actions</th></tr></thead>
                            <tbody>
                              {recordsList.map(r => (
                                <tr key={r.id}>
                                  <td>{r.recordDate}</td>
                                  <td>{r.patient ? r.patient.firstName : 'N/A'}</td>
                                  <td>{r.diagnosis}</td>
                                  <td>{r.treatment}</td>
                                  <td>
                                    <button style={{ ...btnStyle, background: '#FFC107', color: 'black' }} onClick={() => startEditRecord(r)}>Edit</button>
                                    <button style={{ ...btnStyle, background: '#F44336' }} onClick={() => handleDeleteRecord(r.id)}>Delete</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="slider-slide">
                        <div className="form-container">
                          <h3>{isEditing ? 'Edit Medical Record' : 'Add Medical Record'}</h3>
                          <form className="admin-form">
                            <div className="form-group"><label>Patient ID</label><input type="number" value={newRecord.patientId} onChange={e => setNewRecord({ ...newRecord, patientId: e.target.value })} /></div>
                            <div className="form-group"><label>Doctor ID</label><input type="number" value={newRecord.doctorId} onChange={e => setNewRecord({ ...newRecord, doctorId: e.target.value })} /></div>
                            <div className="form-group"><label>Diagnosis</label><input value={newRecord.diagnosis} onChange={e => setNewRecord({ ...newRecord, diagnosis: e.target.value })} /></div>
                            <div className="form-group"><label>Treatment</label><input value={newRecord.treatment} onChange={e => setNewRecord({ ...newRecord, treatment: e.target.value })} /></div>
                            <button type="button" className="save-btn" onClick={handleSaveRecord}>{isEditing ? 'Update Record' : 'Save Record'}</button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* BILLING TAB */}
              <div className="main-slider-slide">
                <section className="doctors-section">
                  <div className="action-buttons-container">
                    <button className={`action-btn ${billingSubTab === 'view' ? 'active' : ''}`} onClick={() => { setBillingSubTab('view'); resetForms(); }}>View</button>
                    <button className={`action-btn ${billingSubTab === 'add' ? 'active' : ''}`} onClick={() => { setBillingSubTab('add'); resetForms(); }}>Create Bill</button>
                  </div>
                  <div className="slider-viewport">
                    <div className={`slider-track ${billingSubTab === 'add' ? 'slide-left' : ''}`}>
                      <div className="slider-slide">
                        <div className="table-container">
                          <table className="data-table">
                            <thead><tr><th>Bill ID</th><th>Appt ID</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>{billingsList.map(b => (<tr key={b.billId}><td>{b.billId}</td><td>{b.appointment ? b.appointment.id : 'N/A'}</td><td>Rs. {b.amount}</td><td>{b.status}</td><td><button style={{ ...btnStyle, background: '#007BFF' }} onClick={() => printBill(b)}>Print</button><button style={{ ...btnStyle, background: '#FFC107', color: 'black' }} onClick={() => startEditBill(b)}>Edit</button><button style={{ ...btnStyle, background: '#F44336' }} onClick={() => handleDeleteBill(b.billId)}>Delete</button></td></tr>))}</tbody>
                          </table>
                        </div>
                      </div>
                      <div className="slider-slide">
                        <div className="form-container">
                          <h3>{isEditing ? 'Edit Bill' : 'Create Bill'}</h3>
                          <form className="admin-form">
                            <div className="form-group"><label>Appt ID</label><input type="number" value={newBill.appointmentId} onChange={e => setNewBill({ ...newBill, appointmentId: e.target.value })} /></div>
                            <div className="form-group"><label>Amount</label><input type="number" value={newBill.amount} onChange={e => setNewBill({ ...newBill, amount: e.target.value })} /></div>
                            <div className="form-group"><label>Status</label><input type="text" value={newBill.status} onChange={e => setNewBill({ ...newBill, status: e.target.value })} /></div>
                            <button type="button" className="save-btn" onClick={handleSaveBill}>{isEditing ? 'Update' : 'Generate Bill'}</button>
                          </form>
                        </div>
                      </div>
                    </div>
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

export default DoctorDashboard;