import { useState, useEffect, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.Config.ts'; // Using the configured API instance
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
  notes?: string; // Added notes field for "Reason for Visit"
  patient: Patient;
  // Added doctor info to interface to allow filtering by ID
  doctor?: { id: number; name: string };
  doctorId?: number | string;
}

// Roster Interface (Frontend use)
interface RosterEntry {
  date: string;
  status: string;
  shiftStatus?: string; // Backend sends shiftStatus
}

interface MedicalRecord {
  id: number;
  diagnosis: string;
  treatment: string;
  notes: string;
  recordDate: string;
  patient: Patient;
  doctor?: { id: number; name: string };
  doctorId?: string | number;
  patientId?: string | number;
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
  doctor?: { id: number; name: string };
  doctorId?: string | number;
}

const DoctorDashboard = () => {
  const navigate = useNavigate();

  // States 
  const [activeTab, setActiveTab] = useState<'dashboard' | 'currentPatient' | 'patients' | 'appointments' | 'records' | 'billing' | 'roster'>('dashboard');

  // Current Patient State
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [historyLimit, setHistoryLimit] = useState<number>(5);
  const [consultationSearchType, setConsultationSearchType] = useState<'id' | 'name' | 'email' | 'phone'>('id');
  const [consultationSearchQuery, setConsultationSearchQuery] = useState('');
  const [consultationError, setConsultationError] = useState<string | null>(null);

  // Doctor Name State
  const [doctorName, setDoctorName] = useState('');
  const [doctorId, setDoctorId] = useState<string | null>(null);

  // Medical Records Explorer States
  const [recordSearchQuery, setRecordSearchQuery] = useState('');
  const [selectedHistoryPatient, setSelectedHistoryPatient] = useState<number | null>(null);

  // Walk-in Patient Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTab, setSearchTab] = useState('name');

  // Patient Detail Modal State
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);

  // Expanded Appointment State for Dropdown
  const [expandedAppointmentId, setExpandedAppointmentId] = useState<number | null>(null);

  // Roster States
  const [rosterData, setRosterData] = useState<RosterEntry[]>([]); // For Roster Management Tab
  const [rosterEntries, setRosterEntries] = useState<any[]>([]); // For Dashboard Overview (Fetched from DB)

  // Generate next 15 days for Dashboard View
  const next15Days = useMemo(() => {
    const days = [];
    for (let i = 0; i < 15; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  // Generate next 30 days for Management Tab
  const generateNext30Days = () => {
    const days: RosterEntry[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      // Format date manually to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      days.push({
        date: dateString,
        status: 'OFF' // Default status
      });
    }
    return days;
  };

  // Sub Tabs (View vs Add)
  const [patientSubTab, setPatientSubTab] = useState<'view' | 'add'>('view');
  const [appointmentSubTab, setAppointmentSubTab] = useState<'view' | 'add'>('view');
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

  // Appointment Filter State
  const [appointmentFilter, setAppointmentFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Forms State
  const [newPatient, setNewPatient] = useState<Patient>({ firstName: '', lastName: '', email: '', phone: '', address: '', age: '', gender: '' });
  const [newAppointment, setNewAppointment] = useState({ patientId: '', doctorId: '', date: '', time: '', notes: '' });
  const [newRecord, setNewRecord] = useState({ patientId: '', doctorId: '', diagnosis: '', treatment: '', notes: '', recordDate: '' });
  const [newBill, setNewBill] = useState({ patientId: '', appointmentId: '', amount: 0, paymentMethod: 'CASH', status: 'PAID' });

  const handleLogout = () => {
    localStorage.removeItem('doctorData');
    navigate('/doctor-login');
  };

  // Load Doctor Name Dynamic Logic
  useEffect(() => {
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
      console.log("Fetching Dashboard Data...");
      const pRes = await api.get('/patients');
      setPatientsList(pRes.data);

      const aRes = await api.get('/appointments');
      setAppointmentsList(aRes.data);

      const rRes = await api.get('/medical-records');
      setRecordsList(rRes.data);

      const bRes = await api.get('/billings');
      setBillingsList(bRes.data);

      // --- Roster Fetching & Sync Logic ---
      if (doctorId) {
        try {
          const rosterResponse = await api.get(`/rosters/doctor/${doctorId}`);
          const fetchedRoster = rosterResponse.data;

          // 1. Send data to small dashboard calendar
          setRosterEntries(fetchedRoster);

          // 2. Fill "My Roster" table with DB data
          const base30Days = generateNext30Days();

          const mergedRoster = base30Days.map(localDay => {
            const found = fetchedRoster.find((dbEntry: any) => dbEntry.date === localDay.date);

            if (found) {
              let mappedStatus = 'OFF';
              if (found.shiftStatus === 'Full Duty') mappedStatus = 'DUTY';
              else if (found.shiftStatus === 'Morning') mappedStatus = 'HALFDAY-MORNING';
              else if (found.shiftStatus === 'Evening') mappedStatus = 'HALFDAY-EVENING';
              else mappedStatus = 'OFF';

              return { ...localDay, status: mappedStatus };
            }
            return localDay;
          });

          setRosterData(mergedRoster);
          console.log("Roster Synced Successfully:", mergedRoster);

        } catch (rosterError) {
          console.error("Error fetching roster:", rosterError);
        }
      }

      // Filter billings for this doctor 
      const myBills = bRes.data.filter((b: any) =>
        (b.doctor && String(b.doctor.id) === String(doctorId)) ||
        (b.doctorId && String(b.doctorId) === String(doctorId)) ||
        (b.appointment?.doctor && String(b.appointment.doctor.id) === String(doctorId))
      );

      const total = myBills.reduce((acc: number, curr: any) => acc + curr.amount, 0);
      setIncome(total);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    if (doctorId) {
      fetchData();
    }
  }, [activeTab, doctorId]);

  // --- FILTERED APPOINTMENTS LOGIC (FIXED) ---
  const filteredAppointments = useMemo(() => {
    return appointmentsList.filter(a => {
      // 1. Filter by Doctor Ownership (CRITICAL FIX)
      // Check if the appointment belongs to the logged-in doctor
      const docIdFromAppt = a.doctor?.id || a.doctorId;

      // If we have a logged-in doctorId, we must match it.
      if (doctorId && docIdFromAppt && String(docIdFromAppt) !== String(doctorId)) {
        return false;
      }

      // 2. Filter by Status (Case Insensitive FIX)
      const s = a.status ? a.status.toUpperCase() : '';

      if (appointmentFilter === 'pending') {
        return s === 'PENDING';
      }
      if (appointmentFilter === 'approved') {
        return ['APPROVED', 'SCHEDULED', 'CONFIRMED'].includes(s);
      }
      if (appointmentFilter === 'rejected') {
        return ['REJECTED', 'CANCELLED'].includes(s);
      }
      return false;
    });
  }, [appointmentsList, appointmentFilter, doctorId]);


  // Last 10 Unique Patients Logic
  const lastTenUniquePatients = useMemo(() => {
    const seenIds = new Set();
    const uniqueList: any[] = [];

    const sortedRecords = [...recordsList]
      .filter(r => String(r.doctor?.id || r.doctorId) === String(doctorId))
      .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());

    for (const record of sortedRecords) {
      const pId = record.patient?.id || record.patientId;
      if (!seenIds.has(pId)) {
        seenIds.add(pId);
        uniqueList.push(record);
      }
      if (uniqueList.length >= 10) break;
    }
    return uniqueList;
  }, [recordsList, doctorId]);

  // Calculate Stats
  const myTreatedPatients = useMemo(() => {
    if (!doctorId || !recordsList || recordsList.length === 0) return 0;

    const myRecords = recordsList.filter(r => {
      const recDocId = r.doctor?.id || r.doctorId;
      return String(recDocId) === String(doctorId);
    });

    const uniqueIds = new Set(myRecords.map(r =>
      String(r.patient?.id || r.patientId)
    ));

    return uniqueIds.size;
  }, [recordsList, doctorId]);

  // Reset Forms
  const resetForms = () => {
    setIsEditing(false);
    setEditingId(null);
    setExpandedAppointmentId(null);
    setNewPatient({ firstName: '', lastName: '', email: '', phone: '', address: '', age: '', gender: '' });
    setNewAppointment({ patientId: '', doctorId: '', date: '', time: '', notes: '' });
    setNewRecord({ patientId: '', doctorId: '', diagnosis: '', treatment: '', notes: '', recordDate: '' });
    setNewBill({ patientId: '', appointmentId: '', amount: 0, paymentMethod: 'CASH', status: 'PAID' });
    setAppointmentFilter('pending'); // Reset filter on form reset
  };

  // Toggle Dropdown Details
  const toggleAppointmentDetails = (id: number) => {
    setExpandedAppointmentId(prev => prev === id ? null : id);
  };

  // ROSTER ACTIONS
  const handleRosterChange = (date: string, newStatus: any) => {
    setRosterData(prev => prev.map(entry =>
      entry.date === date ? { ...entry, status: newStatus } : entry
    ));
  };

  const saveRoster = async () => {
    try {
      const rosterPayload = rosterData.map(r => ({
        date: r.date,
        shiftStatus: r.status === 'OFF' ? 'Off' : r.status === 'DUTY' ? 'Full Duty' : r.status === 'HALFDAY-MORNING' ? 'Morning' : 'Evening',
        doctor: { id: doctorId }
      }));

      console.log("Sending Roster Update:", rosterPayload);

      for (const rosterItem of rosterPayload) {
        await api.post('/rosters', rosterItem);
      }

      alert("Roster Updated Successfully!");
      fetchData();
    } catch (error) {
      console.error("Error saving roster:", error);
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
        let finalAppointmentId = null;

        if (currentPatient?.id) {
          try {
            console.log("Generating Walk-in Appointment for Patient ID:", currentPatient.id);
            const walkInPayload = {
              patientId: currentPatient.id.toString(),
              doctorId: doctorId,
              date: new Date().toISOString().split('T')[0],
              time: new Date().toLocaleTimeString('en-GB', { hour12: false }).substring(0, 5) + ':00',
              status: "COMPLETED",
              notes: "Walk-in consultation (Auto-generated)"
            };

            const apptResponse = await api.post('/appointments', walkInPayload);

            if (apptResponse.data && apptResponse.data.id) {
              finalAppointmentId = apptResponse.data.id;
              console.log("Walk-in Appointment Created via API. ID:", finalAppointmentId);
            }

          } catch (err) {
            console.error("Failed to generate walk-in appointment", err);
            alert("Notice: Could not auto-generate appointment. Bill will be created without an Appointment ID.");
          }
        }

        const recordPayload = {
          patientId: currentPatient?.id?.toString() || newRecord.patientId,
          doctorId: doctorId || newRecord.doctorId,
          diagnosis: newRecord.diagnosis,
          treatment: newRecord.treatment,
          notes: newRecord.notes,
          recordDate: new Date().toISOString().split('T')[0]
        };

        await api.post('/medical-records', recordPayload);
        alert("Medical Record Saved! Proceeding to Billing...");

        setActiveTab('billing');
        setBillingSubTab('add');
        setNewBill({
          patientId: currentPatient?.id?.toString() || '',
          appointmentId: finalAppointmentId ? finalAppointmentId.toString() : '',
          amount: 2000,
          paymentMethod: 'Cash',
          status: 'Pending'
        });
      }
      resetForms();
      fetchData();
    } catch {
      alert("Error Saving Record!");
    }
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
      patientId: b.appointment?.patient?.id?.toString() || '',
      appointmentId: b.appointment?.id?.toString() || '',
      amount: b.amount,
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

  const startConsultation = (patient: Patient) => {
    setCurrentPatient(patient);
    setActiveTab('currentPatient');
    setHistoryLimit(5);
    setNewRecord({
      patientId: patient.id?.toString() || '',
      doctorId: doctorId?.toString() || '',
      diagnosis: '',
      treatment: '',
      notes: '',
      recordDate: new Date().toISOString().split('T')[0]
    });
  };

  // Modal handlers
  const handleViewPatientDetails = (patient: Patient) => {
    setViewingPatient(patient);
  };

  const closePatientModal = () => {
    setViewingPatient(null);
  };

  const handleConsultationSearch = () => {
    setConsultationError(null);
    if (!consultationSearchQuery.trim()) {
      setConsultationError("Please enter search details.");
      return;
    }

    const query = consultationSearchQuery.toLowerCase().trim();
    let found = null;

    if (consultationSearchType === 'id') {
      found = patientsList.find(p => p.id?.toString() === query);
    } else if (consultationSearchType === 'email') {
      found = patientsList.find(p => p.email.toLowerCase() === query);
    } else if (consultationSearchType === 'phone') {
      found = patientsList.find(p => p.phone.includes(query));
    } else if (consultationSearchType === 'name') {
      found = patientsList.find(p =>
        p.firstName.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query) ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(query)
      );
    }

    if (found) {
      startConsultation(found);
      setConsultationSearchQuery('');
    } else {
      setConsultationError("Patient not found. Please check the details.");
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
                  {/* CLICKABLE STAT CARD: PATIENTS */}
                  <div
                    className="stat-card"
                    onClick={() => setActiveTab('patients')}
                    style={{ backgroundColor: '#ffffffff', cursor: 'pointer' }}
                  >
                    <h3>My Treated Patients</h3>
                    <p style={{ color: '#1565C0', fontSize: '2.5rem' }}>{myTreatedPatients}</p>
                    <span style={{ color: '#28a745', fontSize: '0.9rem', fontWeight: 'bold' }}>+2 this week</span>
                  </div>

                  {/* CLICKABLE STAT CARD: APPOINTMENTS */}
                  <div
                    className="stat-card"
                    onClick={() => setActiveTab('appointments')}
                    style={{ backgroundColor: '#ffffffff', cursor: 'pointer' }}
                  >
                    <h3>Appointments</h3>
                    <p style={{ color: '#1565C0', fontSize: '2.5rem' }}>{appointmentsList.length}</p>
                  </div>

                  <div className="stat-card" style={{ backgroundColor: '#ffffffff' }}><h3>Income</h3><p style={{ color: '#1565C0', fontSize: '2.5rem' }}>Rs. {income}</p></div>
                </section>

                {/* --- ROSTER QUICK VIEW (UPDATED) --- */}
                <div className="roster-status-preview">
                  <h3>Next 15 Days Schedule</h3>
                  <div className="roster-grid" style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px 0' }}>
                    {next15Days.map((date, index) => {
                      // Fix Timezone Issue and formatting
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const dateString = `${year}-${month}-${day}`;

                      // Check roster for this date
                      const rosterForDay = rosterEntries.find((r: any) => r.date === dateString);

                      // Determine Status
                      const status = rosterForDay ? rosterForDay.shiftStatus : "Off";

                      // Assign Colors (Using inline styles to match existing design pattern)
                      let cardStyle = {
                        backgroundColor: '#f8f9fa', color: '#6c757d', // Default Gray
                        minWidth: '80px', padding: '10px', borderRadius: '8px', textAlign: 'center' as const, border: '1px solid #eee'
                      };

                      if (status === "Full Duty") cardStyle = { ...cardStyle, backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' }; // Green
                      if (status === "Morning") cardStyle = { ...cardStyle, backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeeba' }; // Yellow
                      if (status === "Evening") cardStyle = { ...cardStyle, backgroundColor: '#d1ecf1', color: '#0c5460', border: '1px solid #bee5eb' }; // Blue

                      return (
                        <div key={index} style={cardStyle}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{date.getDate()}</div>
                          <div style={{ fontSize: '0.65rem', marginTop: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>{status}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="roster-legend" style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666', display: 'flex', gap: '15px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28a745' }}></span> Full Duty</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffc107' }}></span> Morning</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#007bff' }}></span> Evening</span>
                  </div>
                </div>
              </div>

              {/* CURRENT PATIENT SLIDE */}
              <div className="main-slider-slide">
                <section className="consultation-view">

                  {/* --- WALK-IN PATIENT SEARCH --- */}

                  {/* Row 1: Search Box (Inputs Only) */}
                  <div className="search-box-container">
                    <select
                      className="consultation-search-select"
                      value={consultationSearchType}
                      onChange={(e) => setConsultationSearchType(e.target.value as any)}
                    >
                      <option value="id">Find by ID</option>
                      <option value="name">Find by Name</option>
                      <option value="phone">Find by Phone</option>
                      <option value="email">Find by Email</option>
                    </select>
                    <input
                      className="consultation-search-input"
                      type="text"
                      placeholder={`Enter Patient ${consultationSearchType}...`}
                      value={consultationSearchQuery}
                      onChange={(e) => setConsultationSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleConsultationSearch()}
                    />
                    <button className="consultation-search-btn" onClick={handleConsultationSearch}>Find Patient</button>
                  </div>

                  {/* Error Message (Separate Row) */}
                  {consultationError && <div style={{ color: '#d32f2f', marginBottom: '15px', textAlign: 'center' }}>{consultationError}</div>}

                  <div className="consultation-content patient-profile-container">
                    {currentPatient ? (
                      <>
                        <div className="patient-detail-card">
                          <div className="patient-info-left">
                            <h3>{currentPatient.firstName} {currentPatient.lastName}</h3>
                            <p><strong>Email:</strong> {currentPatient.email}</p>
                            <p><strong>Phone:</strong> {currentPatient.phone}</p>
                          </div>
                        </div>

                        <div className="treatment-form-section">
                          <h3>Diagnosis & Treatment</h3>
                          <textarea
                            rows={3}
                            placeholder="Diagnosis"
                            value={newRecord.diagnosis}
                            onChange={(e) => setNewRecord({ ...newRecord, diagnosis: e.target.value })}
                          />
                          <textarea
                            rows={4}
                            placeholder="Treatment Plan"
                            value={newRecord.treatment}
                            onChange={(e) => setNewRecord({ ...newRecord, treatment: e.target.value })}
                          />
                          <button className="finish-btn" onClick={handleSaveRecord}>Finish Consultation & Save Record</button>
                        </div>

                        {/* --- PATIENT HISTORY SECTION (Viva Ready - Using Classes) --- */}
                        <div className="history-section-container">
                          <h3 className="history-title">Previous Medical History</h3>

                          <div className="history-list">
                            {recordsList
                              // 1. Filter by current patient
                              .filter(r => String(r.patient?.id || r.patientId) === String(currentPatient.id))
                              // 2. Sort by Date (Newest first)
                              .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())
                              // 3. Slice based on limit (Starts at 5, increases by 10)
                              .slice(0, historyLimit)
                              .map((rec, idx) => (
                                <div key={rec.id || idx} className="history-card">
                                  {/* Header: Date & ID */}
                                  <div className="history-header">
                                    <span className="history-date">📅 {rec.recordDate}</span>
                                    <span className="history-id-badge">ID: #{rec.id}</span>
                                  </div>

                                  {/* Details */}
                                  <div className="history-details">
                                    <div>
                                      <span className="detail-label">Diagnosis:</span>
                                      {rec.diagnosis}
                                    </div>

                                    <div>
                                      <span className="detail-label">Treatment:</span>
                                      {rec.treatment}
                                    </div>

                                    {rec.notes && (
                                      <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
                                        <span className="detail-label">Note:</span> {rec.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            }

                            {/* Message if empty */}
                            {recordsList.filter(r => String(r.patient?.id || r.patientId) === String(currentPatient.id)).length === 0 && (
                              <div className="no-history-msg">No previous medical history found.</div>
                            )}
                          </div>

                          {/* View More Button */}
                          {recordsList.filter(r => String(r.patient?.id || r.patientId) === String(currentPatient.id)).length > historyLimit && (
                            <div className="view-more-container">
                              <button
                                className="view-more-btn"
                                onClick={() => setHistoryLimit(prev => prev + 10)}
                              >
                                View More History (+10)
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      /* Row 2: Information Section (Only visible when no patient selected) */
                      <div className="consultation-info-box">
                        <p>No patient selected for consultation.</p>
                        <p style={{ fontSize: '0.95rem', color: '#888' }}>You can use the search bar above or select a patient from the 'All Patients' tab.</p>
                        <button className="action-btn" onClick={() => setActiveTab('patients')}>View All Patients</button>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* MY ROSTER SLIDE (Management Tab) */}
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
                    {/* Removed Add Appointment button here if checking/managing existing ones only. Keeps it clean. */}
                  </div>

                  <div className="slider-viewport">
                    <div className={`slider-track ${appointmentSubTab === 'add' ? 'slide-left' : ''}`}>
                      <div className="slider-slide">

                        {/* --- NEW SUB-TABS FOR APPOINTMENT STATUS --- */}
                        <div className="appointment-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                          <button
                            onClick={() => setAppointmentFilter('pending')}
                            style={{
                              padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
                              background: appointmentFilter === 'pending' ? '#ffc107' : '#f8f9fa',
                              color: appointmentFilter === 'pending' ? '#000' : '#666'
                            }}
                          >
                            Pending Requests ({filteredAppointments.filter(a => a.status.toUpperCase() === 'PENDING').length})
                          </button>

                          <button
                            onClick={() => setAppointmentFilter('approved')}
                            style={{
                              padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
                              background: appointmentFilter === 'approved' ? '#28a745' : '#f8f9fa',
                              color: appointmentFilter === 'approved' ? '#fff' : '#666'
                            }}
                          >
                            Approved / Scheduled ({filteredAppointments.filter(a => ['APPROVED', 'SCHEDULED', 'CONFIRMED'].includes(a.status.toUpperCase())).length})
                          </button>

                          <button
                            onClick={() => setAppointmentFilter('rejected')}
                            style={{
                              padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
                              background: appointmentFilter === 'rejected' ? '#dc3545' : '#f8f9fa',
                              color: appointmentFilter === 'rejected' ? '#fff' : '#666'
                            }}
                          >
                            Rejected / Cancelled ({filteredAppointments.filter(a => ['REJECTED', 'CANCELLED'].includes(a.status.toUpperCase())).length})
                          </button>
                        </div>

                        <div className="table-container">
                          <table className="data-table">
                            <thead><tr><th>ID</th><th>Date</th><th>Time</th><th>Patient</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                              {filteredAppointments.length > 0 ? filteredAppointments.map(a => (
                                <Fragment key={a.id}>
                                  <tr>
                                    <td>{a.id}</td>
                                    <td>{a.date}</td>
                                    <td>{a.time}</td>
                                    <td>{a.patient ? a.patient.firstName + ' ' + a.patient.lastName : 'Unknown'}</td>
                                    <td>
                                      <span style={{ fontWeight: 'bold', color: a.status.toUpperCase() === 'PENDING' ? 'orange' : a.status.toUpperCase().includes('REJECT') || a.status.toUpperCase().includes('CANCEL') ? 'red' : 'green' }}>
                                        {a.status}
                                      </span>
                                    </td>
                                    <td>
                                      <button style={{ ...btnStyle, background: '#17a2b8' }} onClick={() => toggleAppointmentDetails(a.id)}>
                                        {expandedAppointmentId === a.id ? 'Hide' : 'Review'}
                                      </button>
                                    </td>
                                  </tr>
                                  {expandedAppointmentId === a.id && (
                                    <tr>
                                      <td colSpan={6} style={{ backgroundColor: '#f9f9f9', padding: '20px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                          <div style={{ padding: '10px', background: '#fff', border: '1px solid #eee', borderRadius: '5px' }}>
                                            <strong>Reason for Visit:</strong> {a.notes || 'No reason provided by patient.'}
                                            <br />
                                            <small>Patient Contact: {a.patient?.phone} | {a.patient?.email}</small>
                                          </div>
                                          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                                            <strong style={{ marginRight: '10px' }}>Actions:</strong>

                                            {/* Logic for Pending Appointments */}
                                            {appointmentFilter === 'pending' && (
                                              <>
                                                <button style={{ ...btnStyle, background: '#28a745' }} onClick={() => handleStatusUpdate(a.id, 'APPROVED')}>Approve</button>
                                                <button style={{ ...btnStyle, background: '#dc3545' }} onClick={() => handleStatusUpdate(a.id, 'REJECTED')}>Reject</button>
                                              </>
                                            )}

                                            {/* Logic for Approved Appointments */}
                                            {appointmentFilter === 'approved' && (
                                              <>
                                                <button style={{ ...btnStyle, background: '#007bff' }} onClick={() => startConsultation(a.patient)}>Start Consultation</button>
                                                <button style={{ ...btnStyle, background: '#ffc107', color: 'black' }} onClick={() => handleStatusUpdate(a.id, 'CANCELLED')}>Cancel Appointment</button>
                                                <button style={{ ...btnStyle, background: '#6c757d' }} onClick={() => handleViewPatientDetails(a.patient)}>View Profile</button>
                                              </>
                                            )}

                                            {/* Logic for Rejected/Cancelled Appointments */}
                                            {appointmentFilter === 'rejected' && (
                                              <>
                                                <button style={{ ...btnStyle, background: '#fd7e14' }} onClick={() => handleStatusUpdate(a.id, 'APPROVED')}>Re-Approve </button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              )) : (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No appointments found in this category.</td></tr>
                              )}
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
                  {/* --- IMPROVED RECORDS EXPLORER --- */}
                  <div className="records-explorer-container">

                    {!selectedHistoryPatient ? (
                      /* View 1: Patient List with Search */
                      <>
                        <div className="records-nav-header">
                          <h3 className="history-title">Medical Records Explorer</h3>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div className="search-box-container" style={{ margin: 0 }}>
                              <input
                                type="text"
                                placeholder="Search Patient Name or ID..."
                                value={recordSearchQuery}
                                onChange={(e) => setRecordSearchQuery(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="table-container">
                          <table className="data-table">
                            <thead>
                              <tr><th>ID</th><th>Patient Name</th><th>Last Treated</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                              {lastTenUniquePatients
                                .filter(r => {
                                  const fullName = `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`.toLowerCase();
                                  return fullName.includes(recordSearchQuery.toLowerCase()) ||
                                    String(r.patient?.id || r.patientId).includes(recordSearchQuery);
                                })
                                .map((r, i) => (
                                  <tr key={i}>
                                    <td>{r.patient?.id || r.patientId}</td>
                                    <td>{r.patient?.firstName} {r.patient?.lastName}</td>
                                    <td>{r.recordDate}</td>
                                    <td>
                                      <button className="view-btn" onClick={() => setSelectedHistoryPatient(r.patient?.id || r.patientId)}>
                                        View All Records
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      /* View 2: Full Medical History for Selected Patient */
                      <div className="detailed-history-view">
                        <div className="records-nav-header">
                          <button className="back-to-list-btn" onClick={() => setSelectedHistoryPatient(null)}>
                            ← Back to Patient List
                          </button>
                          <h3 style={{ color: '#063ca8' }}>Full Medical History (ID: #{selectedHistoryPatient})</h3>
                        </div>

                        <div className="history-list-vertical">
                          {recordsList
                            .filter(r => String(r.patient?.id || r.patientId) === String(selectedHistoryPatient))
                            .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())
                            .map((rec, idx) => (
                              <div key={idx} className="patient-record-card">
                                <div className="history-item-row">
                                  <strong>📅 Date: {rec.recordDate}</strong>
                                  <span className="history-id-badge">Rec ID: #{rec.id}</span>
                                </div>
                                <p><strong>Diagnosis:</strong> {rec.diagnosis}</p>
                                <p><strong>Treatment:</strong> {rec.treatment}</p>
                                {rec.notes && <p style={{ fontSize: '0.9rem', color: '#666' }}><em>Note: {rec.notes}</em></p>}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
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

                          {/* --- ADVANCED TABBED SEARCH FOR BILLING --- */}
                          <div className="advanced-search-container" style={{ marginBottom: '25px', background: '#f8f9fa', padding: '15px', borderRadius: '10px', border: '1px solid #dee2e6' }}>
                            <p style={{ fontWeight: '600', color: '#063ca8', marginBottom: '10px' }}>Find Patient for Billing:</p>

                            {/* Tabs Header */}
                            <div className="search-tabs" style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                              {['ID', 'Name', 'Phone', 'Email'].map((tab) => (
                                <button
                                  key={tab}
                                  type="button"
                                  onClick={() => setSearchTab(tab.toLowerCase())} // Ensure searchTab state exists
                                  style={{
                                    padding: '5px 12px',
                                    fontSize: '0.8rem',
                                    borderRadius: '4px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: searchTab === tab.toLowerCase() ? '#063ca8' : '#e9ecef',
                                    color: searchTab === tab.toLowerCase() ? '#fff' : '#333'
                                  }}
                                >
                                  {tab}
                                </button>
                              ))}
                            </div>

                            {/* Input Area */}
                            <div style={{ position: 'relative' }}>
                              <input
                                type="text"
                                placeholder={`Search by ${searchTab}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                              />

                              {/* Dropdown Results */}
                              {searchTerm && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '200px', overflowY: 'auto', background: 'white', border: '1px solid #dee2e6', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '0 0 8px 8px' }}>
                                  {patientsList
                                    .filter(p => {
                                      const val = searchTerm.toLowerCase();
                                      if (searchTab === 'id') return String(p.id).includes(val);
                                      if (searchTab === 'name') return (p.firstName + ' ' + p.lastName).toLowerCase().includes(val);
                                      if (searchTab === 'phone') return p.phone.includes(val);
                                      if (searchTab === 'email') return p.email.toLowerCase().includes(val);
                                      return false;
                                    })
                                    .map(p => (
                                      <div
                                        key={p.id}
                                        onClick={() => {
                                          setNewBill(prev => ({ ...prev, patientId: p.id?.toString() || '' }));
                                          setSearchTerm('');
                                        }}
                                        style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#f1f5ff'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                                      >
                                        <span>{p.firstName} {p.lastName}</span>
                                        <span style={{ color: '#063ca8', fontSize: '0.8rem' }}>ID: {p.id} | {p.phone}</span>
                                      </div>
                                    ))
                                  }
                                </div>
                              )}
                            </div>
                          </div>

                          <h3>{isEditing ? 'Edit Bill' : 'Create Bill'}</h3>
                          <form className="admin-form">
                            <div className="form-group"><label>Appt ID</label><input type="number" value={newBill.appointmentId} onChange={e => setNewBill({ ...newBill, appointmentId: e.target.value })} /></div>
                            <div className="form-group"><label>Amount</label><input type="number" value={newBill.amount} onChange={e => setNewBill({ ...newBill, amount: Number(e.target.value) })} /></div>
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

        </div >
      </main >

      {/* --- PATIENT DETAIL MODAL --- */}
      {viewingPatient && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '400px', maxWidth: '90%', position: 'relative',
            boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, color: '#063ca8', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Patient Details</h3>
            <div style={{ marginBottom: '20px', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <p><strong>Name:</strong> {viewingPatient.firstName} {viewingPatient.lastName}</p>
              <p><strong>Age:</strong> {viewingPatient.age} years</p>
              <p><strong>Gender:</strong> {viewingPatient.gender}</p>
              <p><strong>Phone:</strong> {viewingPatient.phone}</p>
              <p><strong>Email:</strong> {viewingPatient.email}</p>
              <p><strong>Address:</strong> {viewingPatient.address}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={closePatientModal} style={{ ...btnStyle, background: '#6c757d' }}>Close</button>
              <button onClick={() => { startConsultation(viewingPatient); closePatientModal(); }} style={{ ...btnStyle, background: '#007bff' }}>Start Consultation</button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default DoctorDashboard;