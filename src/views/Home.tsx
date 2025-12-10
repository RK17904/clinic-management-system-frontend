import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, SignInIcon } from '../components/Icons.tsx';
import api from '../api/axios.Config.ts'; 
import logo from '../assets/logo.png';


// Interfaces
interface Doctor {
  id: number;
  name: string;
  specialization: string;
  email: string;
  phone: string;
}

interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
  doctor?: Doctor; 
  patient?: { id: number; firstName: string; lastName: string };
}

const Home = () => {
  const navigate = useNavigate();
  
  // User State
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // Data State
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // INSTANT AUTH CHECK (Runs immediately on load) 
  useEffect(() => {
    const checkAuth = () => {
      try {
        const adminData = localStorage.getItem('adminData');
        const doctorData = localStorage.getItem('doctorData');
        const patientData = localStorage.getItem('patientData');

        if (patientData) {
          const p = JSON.parse(patientData);
          setUserName(p.firstName);
          setUserRole('patient');
          setUserId(p.id);
        } else if (doctorData) {
          const d = JSON.parse(doctorData);
          setUserName(d.name ? d.name.replace(/^Dr\.?\s*/i, '').split(' ')[0] : 'Doctor');
          setUserRole('doctor');
        } else if (adminData) {
          const a = JSON.parse(adminData);
          setUserName(a.name ? a.name.split(' ')[0] : 'Admin');
          setUserRole('admin');
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
        localStorage.clear();
      }
    };
    
    checkAuth();
  }, []);

  //  DATA FETCHING (Runs in background)
  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      
      // Fetch Doctors (Public)
      try {
        const doctorsRes = await api.get('/doctors');
        setDoctors(doctorsRes.data.slice(0, 3)); 
      } catch (e) {
        console.error("Could not fetch doctors. Server might be down.");
      }

      // Fetch Appointments (Only if Patient is logged in)
      if (userRole === 'patient' && userId) {
        try {
          const appRes = await api.get('/appointments');
          const userApps = appRes.data.filter((a: any) => a.patient && a.patient.id === userId);
          setMyAppointments(userApps);
        } catch (e) {
          console.error("Could not fetch appointments");
        }
      }

      setIsLoading(false);
    };

    fetchHomeData();
  }, [userRole, userId]); 

  // Handlers
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUserName(null);
    setUserRole(null);
    setUserId(null);
    setMyAppointments([]);
    navigate('/patient-login');
  };

  // NAVIGATION HANDLER
  const handleMyHealthClick = () => {
    // 1. Check LocalStorage directly to ensure navigation works instantly
    if (localStorage.getItem('patientData')) {
      navigate('/patient-dashboard');
      return;
    }
    if (localStorage.getItem('doctorData')) {
      navigate('/doctor-dashboard');
      return;
    }
    if (localStorage.getItem('adminData')) {
      navigate('/admin-dashboard');
      return;
    }

    // 2. Fallback to login if no token found
    navigate('/patient-login');
  };

  return (
    <div className="home-container">
      
      {/* --- HEADER --- */}
      <header className="home-header">
        <div className="header-logo">
          <img src={logo} alt="Logo" className="header-logo-img" />
          <h2>HealthCare+</h2>
        </div>

        {/* --- CENTER NAVIGATION --- */}
        <nav className="header-nav">
          <button onClick={() => scrollToSection('hero')}>Home</button>
          
          {/* "My Health" -> Redirects to Dashboard */}
          <button onClick={handleMyHealthClick} style={{fontWeight: 'bold', color: '#0056b3'}}>
            My Health
          </button>

          <button onClick={() => scrollToSection('appointments')}>Appointments</button>
          <button onClick={() => scrollToSection('doctors')}>Doctors</button>
          <button onClick={() => scrollToSection('about')}>About Us</button>
          <button onClick={() => scrollToSection('contact')}>Contact Us</button>
        </nav>

        {/* --- RIGHT SIDE: USER NAME --- */}
        <div className="header-user">
          {userName ? (
            <div className="user-profile-badge">
              <span className="welcome-text">Hi, {userName}</span>
              <div className="avatar-circle" onClick={handleMyHealthClick} title="Go to Dashboard">
                <UserIcon />
              </div>
              <button onClick={handleLogout} className="logout-link" title="Logout">
                <SignInIcon />
              </button>
            </div>
          ) : (
            <button className="header-signin-btn" onClick={() => navigate('/patient-login')}>
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      {/* UPDATED: Use string path since image is in public folder */}
      <section id="hero" className="hero-section" style={{backgroundImage: 'url(/loginimage.jpg)'}}>
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>Your Health, Our Priority</h1>
            <p>Experience seamless healthcare with HealthCare+. Get quality medicines, expert consultations, and reliable services delivered to your life.</p>
            <div className="hero-buttons">
              {/* Primary action also goes to Dashboard if logged in, or Login if not */}
              <button className="primary-btn" onClick={handleMyHealthClick}>Book Appointment</button>
              <button className="secondary-btn" onClick={() => scrollToSection('about')}>Learn More</button>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTIONS --- */}
      
      {/* Appointments Section */}
      <section id="appointments" className="content-section">
        <div className="section-container">
          <h2>{userRole === 'patient' && myAppointments.length > 0 ? 'Your Upcoming Appointments' : 'Easy Appointments'}</h2>
          
          <p>
            {userRole === 'patient' && myAppointments.length > 0 
              ? 'Here is a quick look at your scheduled visits.' 
              : 'Book your consultation with top specialists in just a few clicks.'}
          </p>

          <div className="cards-grid">
            {userRole === 'patient' && myAppointments.length > 0 ? (
              myAppointments.map((appt) => (
                <div key={appt.id} className="feature-card" style={{borderTop: '4px solid #0056b3'}}>
                  <h3 style={{color: '#0056b3'}}>{appt.date}</h3>
                  <p style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{appt.time}</p>
                  <p>Dr. {appt.doctor?.name || 'Assigned Doctor'}</p>
                  <span style={{
                    display:'inline-block', 
                    marginTop:'10px', 
                    padding: '4px 10px', 
                    background: appt.status === 'SCHEDULED' ? '#eef2ff' : '#ecfdf5',
                    color: appt.status === 'SCHEDULED' ? '#0056b3' : '#047857',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    {appt.status}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="feature-card">
                  <h3>Find a Doctor</h3>
                  <p>Search by specialization or name to find the right expert for you.</p>
                </div>
                <div className="feature-card">
                  <h3>Select Time</h3>
                  <p>Choose a convenient time slot that fits your busy schedule.</p>
                </div>
                <div className="feature-card">
                  <h3>Get Confirmed</h3>
                  <p>Receive instant confirmation and reminders via email.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section id="doctors" className="content-section alternate-bg">
        <div className="section-container">
          <h2>Our Specialists</h2>
          <p>Meet our team of experienced medical professionals ready to assist you.</p>
          
          <div className="cards-grid">
            {isLoading && doctors.length === 0 ? (
              <p>Loading Specialists...</p>
            ) : doctors.length > 0 ? (
              doctors.map((doc) => (
                <div key={doc.id} className="doctor-card">
                  <div className="doc-avatar">👨‍⚕️</div>
                  <h3>Dr. {doc.name}</h3>
                  <p style={{color: '#0056b3', fontWeight: '500'}}>{doc.specialization}</p>
                  <p style={{fontSize: '0.9rem', color: '#666'}}>{doc.email}</p>
                  <button onClick={handleMyHealthClick}>View Profile</button>
                </div>
              ))
            ) : (
              <p>No doctors available at the moment.</p>
            )}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="content-section">
        <div className="section-container">
          <h2>About HealthCare+</h2>
          <div className="about-content" style={{maxWidth: '800px', margin: '0 auto'}}>
            <p>
              HealthCare+ is dedicated to providing accessible, high-quality medical services to everyone. 
              Founded in 2025, we bridge the gap between patients and doctors through technology.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="content-section footer-section">
        <div className="section-container">
          <h2>Contact Us</h2>
          <div className="contact-grid">
            <div className="contact-item">
              <h4>Email</h4>
              <p>support@healthcareplus.com</p>
            </div>
            <div className="contact-item">
              <h4>Phone</h4>
              <p>+94 11 234 5678</p>
            </div>
            <div className="contact-item">
              <h4>Address</h4>
              <p>123 Wellness Ave, Colombo</p>
            </div>
          </div>
          <div className="footer-copy">
            &copy; 2025 HealthCare+. All rights reserved.
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;