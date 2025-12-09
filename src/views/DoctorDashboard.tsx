import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; 
import { UserIcon, SignInIcon, ListIcon, PlusIcon, UsersIcon, CalendarIcon } from '../components/Icons.tsx';
import logo from '../assets/logo.png'; // Added logo import for consistency

// --- Interfaces ---
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

  // --- States ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'appointments' | 'records' | 'billing'>('dashboard');
  
  // --- NEW: Doctor Name State ---
  const [doctorName, setDoctorName] = useState('');

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
    localStorage.removeItem('doctorData');
    navigate('/doctor-login');
  };

  // --- NEW: Load Doctor Name on Mount ---
  useEffect(() => {
    const storedData = localStorage.getItem('doctorData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        // Assuming your backend sends a 'name' field like "Chamath Ravindu"
        if (parsedData.name) {
          // Removes 'Dr.' if present and takes the first word
          const firstName = parsedData.name.replace(/^Dr\.?\s*/i, '').split(' ')[0];
          setDoctorName(firstName);
        }
      } catch (e) {
        console.error("Error parsing doctor data", e);
      }
    }
  }, []);

  // --- API Calls (Fetch Data) ---
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

  // --- Helper: Reset Forms ---
  const resetForms = () => {
      setIsEditing(false);
      setEditingId(null);
      setNewPatient({ firstName: '', lastName: '', email: '', phone: '', address: '', age: '', gender: '' });
      setNewAppointment({ patientId: '', doctorId: '', date: '', time: '', notes: '' });
      setNewRecord({ patientId: '', doctorId: '', diagnosis: '', treatment: '', notes: '', recordDate: '' });
      setNewBill({ appointmentId: '', amount: '', paymentMethod: 'CASH', status: 'PAID' });
  };

  // --- ACTIONS: PATIENTS ---
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
      if(!window.confirm("Are you sure you want to delete this patient?")) return;
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

  // --- ACTIONS: APPOINTMENTS ---
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

  const handleDeleteAppointment = async (id: number) => {
      if(!window.confirm("Cancel this appointment?")) return;
      try {
          await api.delete(`/appointments/${id}`);
          fetchData();
      } catch { alert("Error Deleting Appointment!"); }
  };

  const startEditAppointment = (a: Appointment) => {
      setNewAppointment({
          patientId: a.patient?.id?.toString() || '',
          doctorId: '1', 
          date: a.date,
          time: a.time,
          notes: ''
      });
      setIsEditing(true);
      setEditingId(a.id);
      setAppointmentSubTab('add');
  };

  // --- ACTIONS: RECORDS ---
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
      if(!window.confirm("Delete this record?")) return;
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

  // --- ACTIONS: BILLING ---
  const handleSaveBill = async () => {
      try {
          const payload = { 
              amount: newBill.amount, 
              paymentMethod: newBill.paymentMethod, 
              status: newBill.status, 
              paymentDate: new Date().toISOString().slice(0, 19), 
              appointment: { id: newBill.appointmentId } 
          };
          
          if(isEditing && editingId) {
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
      if(!window.confirm("Delete this bill?")) return;
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

  const printBill = (bill: Billing) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      const patientName = bill.appointment.patient ? `${bill.appointment.patient.firstName} ${bill.appointment.patient.lastName}` : "Unknown Patient";
      const invoiceHTML = `<html><body><h1>Invoice #${bill.billId}</h1><p>Patient: ${patientName}</p><p>Amount: ${bill.amount}</p><script>window.print();</script></body></html>`;
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
    }
  };

  const getTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Doctor Dashboard';
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

  // --- Render ---
  return (
    <div className="dashboard-layout">
      <div className="dashboard-sidebar" style={{ backgroundColor: '#063ca8' }}>
        <div className="dashboard-logo">
            {/* Added Logo here for consistency */}
            <img src={logo} alt="Logo" className="dashboard-logo-img" style={{height:'2rem', width:'auto', marginRight:'0.9rem'}} />
            <h2 style={{margin:0}}>Doctor Portal</h2>
        </div>
        <nav className="dashboard-nav">
          <button onClick={() => setActiveTab('dashboard')} className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} style={activeTab === 'dashboard' ? { color: '#fafffaff' } : {}}><UserIcon /> <span>Dashboard</span></button>
          <button onClick={() => setActiveTab('patients')} className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`} style={activeTab === 'patients' ? { color: '#ffffffff' } : {}}><UsersIcon /> <span>Patients</span></button>
          <button onClick={() => setActiveTab('appointments')} className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`} style={activeTab === 'appointments' ? { color: '#f8f8f8ff' } : {}}><CalendarIcon /> <span>Appointments</span></button>
          <button onClick={() => setActiveTab('records')} className={`nav-item ${activeTab === 'records' ? 'active' : ''}`} style={activeTab === 'records' ? { color: '#feffffff' } : {}}><ListIcon /> <span>Records</span></button>
          <button onClick={() => setActiveTab('billing')} className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`} style={activeTab === 'billing' ? { color: '#ffffffff' } : {}}><ListIcon /> <span>Billing</span></button>
        </nav>
        <div className="dashboard-logout"><button onClick={handleLogout} className="nav-item"><SignInIcon /> <span>Logout</span></button></div>
      </div>

      <main className="dashboard-main">
        {/* --- UPDATED HEADER WITH DOCTOR NAME --- */}
        <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{margin: 0}}>{getTitle()}</h1>
            
            {/* Right Side: Doctor Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{textAlign: 'right', lineHeight: '1.2'}}>
                    <span style={{display: 'block', fontSize: '0.8rem', color: '#888'}}>Welcome,</span>
                    <span style={{fontWeight: 'bold', color: '#063ca8', fontSize: '1.1rem'}}>
                        Dr. {doctorName || 'Doctor'}
                    </span>
                </div>
                <div style={{
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: '#E8F5E9', 
                    color: '#063ca8',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid #C8E6C9'
                }}>
                    <UserIcon />
                </div>
            </div>
        </header>

        <div className="dashboard-content-wrapper">
          <div className="main-slider-viewport">
            <div className={`main-slider-track doctor-track pos-${activeTab}`}>

              {/* 1. DASHBOARD */}
              <div className="main-slider-slide">
                <section className="dashboard-content">
                  <div className="stat-card" style={{backgroundColor: '#E8F5E9'}}><h3>Total Patients</h3><p style={{color: '#2E7D32', fontSize: '2.5rem'}}>{patientsList.length}</p></div>
                  <div className="stat-card" style={{backgroundColor: '#E8F5E9'}}><h3>Appointments</h3><p style={{color: '#1565C0', fontSize: '2.5rem'}}>{appointmentsList.length}</p></div>
                  <div className="stat-card" style={{backgroundColor: '#E8F5E9'}}><h3>Income</h3><p style={{color: '#2E7D32', fontSize: '2.5rem'}}>Rs. {income}</p></div>
                </section>
              </div>

              {/* 2. PATIENTS */}
              <div className="main-slider-slide">
                <section className="doctors-section">
                  <div className="action-buttons-container">
                    <button className={`action-btn ${patientSubTab === 'view' ? 'active' : ''}`} onClick={() => {setPatientSubTab('view'); resetForms();}}><ListIcon /> View List</button>
                    <button className={`action-btn ${patientSubTab === 'add' ? 'active' : ''}`} onClick={() => {setPatientSubTab('add'); resetForms();}}><PlusIcon /> Add Patient</button>
                  </div>
                  <div className="slider-viewport">
                    <div className={`slider-track ${patientSubTab === 'add' ? 'slide-left' : ''}`}>
                        <div className="slider-slide">
                            <div className="table-container">
                                <table className="data-table">
                                    <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
                                    <tbody>{patientsList.map(p => (<tr key={p.id}><td>{p.id}</td><td>{p.firstName} {p.lastName}</td><td>{p.email}</td><td>{p.phone}</td><td><button style={{...btnStyle, background:'#FFC107', color:'black'}} onClick={() => startEditPatient(p)}>Edit</button><button style={{...btnStyle, background:'#F44336'}} onClick={() => handleDeletePatient(p.id!)}>Delete</button></td></tr>))}</tbody>
                                </table>
                            </div>
                        </div>
                        <div className="slider-slide">
                            <div className="form-container">
                                <h3>{isEditing ? 'Edit Patient' : 'Register New Patient'}</h3>
                                <form className="admin-form">
                                    <div className="form-row"><div className="form-group"><label>First Name</label><input value={newPatient.firstName} onChange={e => setNewPatient({...newPatient, firstName: e.target.value})}/></div><div className="form-group"><label>Last Name</label><input value={newPatient.lastName} onChange={e => setNewPatient({...newPatient, lastName: e.target.value})}/></div></div>
                                    <div className="form-row"><div className="form-group"><label>Email</label><input value={newPatient.email} onChange={e => setNewPatient({...newPatient, email: e.target.value})}/></div><div className="form-group"><label>Phone</label><input value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})}/></div></div>
                                    <div className="form-row"><div className="form-group"><label>Age</label><input value={newPatient.age} onChange={e => setNewPatient({...newPatient, age: e.target.value})}/></div><div className="form-group"><label>Gender</label><input value={newPatient.gender} onChange={e => setNewPatient({...newPatient, gender: e.target.value})}/></div></div>
                                    <div className="form-group"><label>Address</label><input value={newPatient.address} onChange={e => setNewPatient({...newPatient, address: e.target.value})}/></div>
                                    <button type="button" className="save-btn" onClick={handleSavePatient}>{isEditing ? 'Update Patient' : 'Save Patient'}</button>
                                </form>
                            </div>
                        </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* 3. APPOINTMENTS */}
              <div className="main-slider-slide">
                <section className="doctors-section">
                  <div className="action-buttons-container">
                    <button className={`action-btn ${appointmentSubTab === 'view' ? 'active' : ''}`} onClick={() => {setAppointmentSubTab('view'); resetForms();}}><ListIcon /> View List</button>
                    <button className={`action-btn ${appointmentSubTab === 'add' ? 'active' : ''}`} onClick={() => {setAppointmentSubTab('add'); resetForms();}}><PlusIcon /> Book Appointment</button>
                  </div>
                  <div className="slider-viewport">
                    <div className={`slider-track ${appointmentSubTab === 'add' ? 'slide-left' : ''}`}>
                        <div className="slider-slide">
                            <div className="table-container">
                                <table className="data-table">
                                    <thead><tr><th>ID</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
                                    <tbody>{appointmentsList.map(a => (<tr key={a.id}><td>{a.id}</td><td>{a.date}</td><td>{a.time}</td><td>{a.status}</td><td><button style={{...btnStyle, background:'#FFC107', color:'black'}} onClick={() => startEditAppointment(a)}>Edit</button><button style={{...btnStyle, background:'#F44336'}} onClick={() => handleDeleteAppointment(a.id)}>Delete</button></td></tr>))}</tbody>
                                </table>
                            </div>
                        </div>
                        <div className="slider-slide">
                            <div className="form-container">
                                <h3>{isEditing ? 'Edit Appointment' : 'Book Appointment'}</h3>
                                <form className="admin-form">
                                    <div className="form-row"><div className="form-group"><label>Patient ID</label><input type="number" value={newAppointment.patientId} onChange={e => setNewAppointment({...newAppointment, patientId: e.target.value})}/></div><div className="form-group"><label>Doctor ID</label><input type="number" value={newAppointment.doctorId} onChange={e => setNewAppointment({...newAppointment, doctorId: e.target.value})}/></div></div>
                                    <div className="form-row"><div className="form-group"><label>Date</label><input type="date" value={newAppointment.date} onChange={e => setNewAppointment({...newAppointment, date: e.target.value})}/></div><div className="form-group"><label>Time</label><input type="time" value={newAppointment.time} onChange={e => setNewAppointment({...newAppointment, time: e.target.value})}/></div></div>
                                    <div className="form-group"><label>Notes</label><input value={newAppointment.notes} onChange={e => setNewAppointment({...newAppointment, notes: e.target.value})}/></div>
                                    <button type="button" className="save-btn" onClick={handleSaveAppointment}>{isEditing ? 'Update' : 'Confirm'}</button>
                                </form>
                            </div>
                        </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* 4. RECORDS */}
              <div className="main-slider-slide">
                <section className="doctors-section">
                  <div className="action-buttons-container">
                    <button className={`action-btn ${recordSubTab === 'view' ? 'active' : ''}`} onClick={() => {setRecordSubTab('view'); resetForms();}}>View List</button>
                    <button className={`action-btn ${recordSubTab === 'add' ? 'active' : ''}`} onClick={() => {setRecordSubTab('add'); resetForms();}}>Add Record</button>
                  </div>
                  <div className="slider-viewport">
                    <div className={`slider-track ${recordSubTab === 'add' ? 'slide-left' : ''}`}>
                        <div className="slider-slide">
                            <div className="table-container">
                                <table className="data-table">
                                    <thead><tr><th>Date</th><th>Patient</th><th>Diagnosis</th><th>Treatment</th><th>Actions</th></tr></thead>
                                    <tbody>{recordsList.map(r => (<tr key={r.id}><td>{r.recordDate}</td><td>{r.patient ? r.patient.firstName : 'N/A'}</td><td>{r.diagnosis}</td><td>{r.treatment}</td><td><button style={{...btnStyle, background:'#FFC107', color:'black'}} onClick={() => startEditRecord(r)}>Edit</button><button style={{...btnStyle, background:'#F44336'}} onClick={() => handleDeleteRecord(r.id)}>Delete</button></td></tr>))}</tbody>
                                </table>
                            </div>
                        </div>
                        <div className="slider-slide">
                            <div className="form-container">
                                <h3>{isEditing ? 'Edit Medical Record' : 'Add Medical Record'}</h3>
                                <form className="admin-form">
                                    <div className="form-group"><label>Patient ID</label><input type="number" value={newRecord.patientId} onChange={e => setNewRecord({...newRecord, patientId: e.target.value})} /></div>
                                    <div className="form-group"><label>Doctor ID</label><input type="number" value={newRecord.doctorId} onChange={e => setNewRecord({...newRecord, doctorId: e.target.value})} /></div>
                                    <div className="form-group"><label>Diagnosis</label><input value={newRecord.diagnosis} onChange={e => setNewRecord({...newRecord, diagnosis: e.target.value})} /></div>
                                    <div className="form-group"><label>Treatment</label><input value={newRecord.treatment} onChange={e => setNewRecord({...newRecord, treatment: e.target.value})} /></div>
                                    <button type="button" className="save-btn" onClick={handleSaveRecord}>{isEditing ? 'Update Record' : 'Save Record'}</button>
                                </form>
                            </div>
                        </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* 5. BILLING */}
              <div className="main-slider-slide">
                <section className="doctors-section">
                  <div className="action-buttons-container">
                    <button className={`action-btn ${billingSubTab === 'view' ? 'active' : ''}`} onClick={() => {setBillingSubTab('view'); resetForms();}}>View</button>
                    <button className={`action-btn ${billingSubTab === 'add' ? 'active' : ''}`} onClick={() => {setBillingSubTab('add'); resetForms();}}>Create Bill</button>
                  </div>
                  <div className="slider-viewport">
                    <div className={`slider-track ${billingSubTab === 'add' ? 'slide-left' : ''}`}>
                        <div className="slider-slide">
                            <div className="table-container">
                                <table className="data-table">
                                    <thead><tr><th>Bill ID</th><th>Appt ID</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
                                    <tbody>{billingsList.map(b => (<tr key={b.billId}><td>{b.billId}</td><td>{b.appointment ? b.appointment.id : 'N/A'}</td><td>Rs. {b.amount}</td><td>{b.status}</td><td><button style={{...btnStyle, background:'#007BFF'}} onClick={() => printBill(b)}>Print</button><button style={{...btnStyle, background:'#FFC107', color:'black'}} onClick={() => startEditBill(b)}>Edit</button><button style={{...btnStyle, background:'#F44336'}} onClick={() => handleDeleteBill(b.billId)}>Delete</button></td></tr>))}</tbody>
                                </table>
                            </div>
                        </div>
                        <div className="slider-slide">
                            <div className="form-container">
                                <h3>{isEditing ? 'Edit Bill' : 'Create Bill'}</h3>
                                <form className="admin-form">
                                    <div className="form-group"><label>Appointment ID</label><input type="number" value={newBill.appointmentId} onChange={e=>setNewBill({...newBill, appointmentId: e.target.value})}/></div>
                                    <div className="form-group"><label>Amount</label><input type="number" value={newBill.amount} onChange={e=>setNewBill({...newBill, amount: e.target.value})}/></div>
                                    <div className="form-group"><label>Status</label><input type="text" value={newBill.status} onChange={e=>setNewBill({...newBill, status: e.target.value})}/></div>
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