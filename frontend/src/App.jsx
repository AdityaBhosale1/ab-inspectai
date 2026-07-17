import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, LayoutDashboard, FileText, Phone, Info, Home, 
  LogOut, User as UserIcon, Plus, Search, Filter, Trash2, Download, 
  AlertTriangle, CheckCircle, RefreshCw, Lock, Mail, DollarSign, 
  Activity, Wrench, Shield, Check, FileCheck, HelpCircle, Sun, Moon,
  Calendar, MapPin, Eye, Share2, Clipboard, Users, BarChart3, AlertCircle, 
  ArrowRight, Zap
} from 'lucide-react';
import { LineChart, BarChart, DonutChart, SeverityBarChart } from './components/Charts';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [activePage, setActivePage] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  // Theme management
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.remove('theme-light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auth state
  const [authMode, setAuthMode] = useState('login'); // login, register, forgot
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [roleInput, setRoleInput] = useState('Inspector'); // Inspector, Manager, Admin
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [simulatedOtpCode, setSimulatedOtpCode] = useState('');

  // Dashboard state
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Reports list state
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [damageFilter, setDamageFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  // Email report simulation state
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailReportId, setEmailReportId] = useState(null);

  // AI Inspection state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [vehicleName, setVehicleName] = useState('Tesla Model Y');
  const [licensePlate, setLicensePlate] = useState('');
  const [inspecting, setInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);
  
  // 360-degree inspection selection
  const [panelView, setPanelView] = useState('Front'); // Front, Rear, Left, Right
  
  // Slider overlay before/after
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Live Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [liveDetecting, setLiveDetecting] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [camVehicleName, setCamVehicleName] = useState('Model Y (Camera)');
  const [camLicensePlate, setCamLicensePlate] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [camInspectionResult, setCamInspectionResult] = useState(null);
  const [liveStreamResult, setLiveStreamResult] = useState(null);
  const [cameraMode, setCameraMode] = useState('capture'); // capture, live

  // Service Center Booking state
  const [assignedMechanic, setAssignedMechanic] = useState('Aditya Bhosale');
  const [selectedServiceCenter, setSelectedServiceCenter] = useState('Silicon Valley Auto Repair');
  const [bookingDate, setBookingDate] = useState('2026-07-20');
  const [bookingTime, setBookingTime] = useState('10:00');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [repairStep, setRepairStep] = useState(1); // 1: Intake, 2: Diagnosis, 3: Body Work, 4: Paint, 5: Quality Check, 6: Delivered

  // Fleet management state
  const [fleetVehicles, setFleetVehicles] = useState([
    { id: 'FL-001', name: 'Tesla Model Y', plate: 'CA-992-TX', driver: 'Alice Jones', score: 96, battery: 92, age: 2, status: 'Excellent', nextMaintenance: '2026-08-15' },
    { id: 'FL-002', name: 'BMW i4', plate: 'NY-442-LA', driver: 'Bob Smith', score: 88, battery: 84, age: 3, status: 'Good', nextMaintenance: '2026-07-29' },
    { id: 'FL-003', name: 'Audi e-tron', plate: 'TX-109-PT', driver: 'Charlie Miller', score: 62, battery: 72, age: 6, status: 'Needs Maintenance', nextMaintenance: '2026-07-18' },
    { id: 'FL-004', name: 'Ford Mustang Mach-E', plate: 'FL-881-ZZ', driver: 'Dave Davis', score: 45, battery: 68, age: 7, status: 'Critical Condition', nextMaintenance: '2026-07-17' },
  ]);

  // Fetch stats and reports on startup / token change
  useEffect(() => {
    fetchDashboardStats();
    fetchReports();
  }, [token]);

  // Handle live frame analysis loop
  useEffect(() => {
    let intervalId = null;
    if (cameraActive && liveDetecting && cameraMode === 'live') {
      intervalId = setInterval(() => {
        captureLiveFrame();
      }, 1500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [cameraActive, liveDetecting, cameraMode]);

  // Headers config helper
  const getAuthHeaders = (isMultipart = false) => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // --- API OPERATIONS ---

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput,
          email: emailInput,
          password: passwordInput,
          role: roleInput
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      
      setAuthSuccess('Registration successful! Please login.');
      setAuthMode('login');
      setPasswordInput('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const requestOtpCode = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const formData = new FormData();
      formData.append('username', usernameInput);
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/send`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to request verification code');
      
      setSimulatedOtpCode(data.simulated_code);
      setOtpVisible(true);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const formData = new FormData();
      formData.append('username', usernameInput);
      formData.append('otp_code', otpCodeInput);

      const res = await fetch(`${API_BASE_URL}/api/auth/otp/verify`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid verification code');

      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      // Reset inputs
      setUsernameInput('');
      setPasswordInput('');
      setOtpCodeInput('');
      setOtpVisible(false);
      setActivePage('dashboard');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const formData = new FormData();
      formData.append('username', usernameInput);
      formData.append('password', passwordInput);

      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid username or password');

      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);

      // Get profile details
      const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      const profileData = await profileRes.json();
      localStorage.setItem('user', JSON.stringify(profileData));
      setUser(profileData);
      
      // Reset inputs
      setUsernameInput('');
      setPasswordInput('');
      setActivePage('dashboard');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setActivePage('home');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      const formData = new FormData();
      formData.append('email', emailInput);
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Forgot password failed');
      setAuthSuccess(data.message);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`, { headers });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      let url = `${API_BASE_URL}/api/reports?`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
      if (damageFilter && damageFilter !== 'All') url += `damage_level=${damageFilter}&`;
      if (startDate) url += `start_date=${startDate}&`;
      if (endDate) url += `end_date=${endDate}`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Error fetching reports", err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleDeleteReport = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this inspection report?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchReports();
        fetchDashboardStats();
        if (selectedReport && selectedReport.id === id) {
          setSelectedReport(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    window.open(`${API_BASE_URL}/api/reports/export/excel`);
  };

  const handleSendEmailReport = async (e) => {
    e.preventDefault();
    if (!emailReportId || !emailRecipient) return;
    try {
      const formData = new FormData();
      formData.append('recipient_email', emailRecipient);
      const res = await fetch(`${API_BASE_URL}/api/inspect/email?report_id=${emailReportId}`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert(`Inspection report has been successfully sent to ${emailRecipient}`);
        setEmailModalVisible(false);
        setEmailRecipient('');
      } else {
        alert('Failed to send report. Please check recipient address.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- INSPECTION HANDLING ---

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setInspectionResult(null);
    }
  };

  const handleInspectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setInspecting(true);
    setInspectionResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('vehicle_name', vehicleName);
      formData.append('license_plate', licensePlate);

      const res = await fetch(`${API_BASE_URL}/api/inspect/upload`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Inspection failed');
      
      setInspectionResult(data);
      fetchDashboardStats();
      fetchReports();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setInspecting(false);
    }
  };

  // --- WEBCAM CAMERA OPERATIONS ---

  const startCamera = async () => {
    setCameraError('');
    setCapturedImage(null);
    setCamInspectionResult(null);
    setLiveStreamResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setCameraError('Unable to access device camera. Please check permissions.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setLiveDetecting(false);
  };

  const base64ToBlob = (base64, mime = 'image/jpeg') => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
    stopCamera();

    setInspecting(true);
    try {
      const blob = base64ToBlob(dataUrl);
      const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vehicle_name', camVehicleName);
      formData.append('license_plate', camLicensePlate);

      const res = await fetch(`${API_BASE_URL}/api/inspect/upload`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to inspect image');

      setCamInspectionResult(data);
      fetchDashboardStats();
      fetchReports();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setInspecting(false);
    }
  };

  const captureLiveFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !liveDetecting) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/inspect/camera`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl })
      });
      if (res.ok) {
        const data = await res.json();
        setLiveStreamResult(data);
      }
    } catch (err) {
      console.error("Frame analysis loop error", err);
    }
  };

  const handleDownloadPDF = (id) => {
    window.open(`${API_BASE_URL}/api/reports/${id}/pdf`);
  };

  // Helper score range color
  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 70) return '#dc2626'; // Red (Primary)
    if (score >= 50) return '#f59e0b'; // Orange
    return '#ef4444'; // Red (Secondary)
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* --- HEADER NAVIGATION --- */}
      <header className="glass-panel" style={{ 
        margin: '12px 16px', padding: '12px 24px', display: 'flex', 
        alignItems: 'center', justifyContent: 'space-between', zIndex: 100 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setActivePage('home')}>
          <Shield style={{ color: 'var(--primary)', fill: 'rgba(220, 38, 38, 0.2)' }} size={28} />
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-white)' }}>
              VEHICLE<span style={{ color: 'var(--primary)' }}>AI</span>
            </h1>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginTop: '-2px' }}>
              Defect Detection Engine
            </span>
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          {[
            { id: 'home', label: 'Home', icon: <Home size={14} /> },
            { id: 'about', label: 'About', icon: <Info size={14} /> },
            { id: 'features', label: 'Features', icon: <Clipboard size={14} /> },
            { id: 'inspect', label: 'AI Detection', icon: <Upload size={14} /> },
            { id: 'camera', label: 'Live Camera', icon: <Camera size={14} /> },
            { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
            { id: 'reports', label: 'Reports', icon: <FileText size={14} /> },
            { id: 'history', label: 'History', icon: <Eye size={14} /> },
            { id: 'service', label: 'Service Center', icon: <Wrench size={14} /> },
            { id: 'fleet', label: 'Fleet', icon: <Users size={14} /> },
            { id: 'contact', label: 'Contact', icon: <Phone size={14} /> }
          ].map(page => (
            <button 
              key={page.id}
              onClick={() => { setActivePage(page.id); stopCamera(); }} 
              className={`btn ${activePage === page.id ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ padding: '6px 12px', fontSize: '0.8rem', border: activePage === page.id ? 'none' : '1px solid transparent' }}
            >
              {page.icon} {page.label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn btn-secondary" 
            style={{ padding: '8px', borderRadius: '50%' }}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {token && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.75rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-white)' }}>{user.username}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 700 }}>{user.role}</span>
              </div>
              <img src={user.profile_pic} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1.5px solid var(--primary)', backgroundColor: 'var(--bg-input)' }} />
              <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '8px 10px' }} title="Logout">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => { setAuthMode('login'); setActivePage('auth'); }} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              <UserIcon size={14} /> Client Portal
            </button>
          )}
        </div>
      </header>

      {/* --- MAIN PAGE CONTENT --- */}
      <main style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column' }}>

        {/* ========================================================
            HOME PAGE
           ======================================================== */}
        {activePage === 'home' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', gap: '40px', padding: '20px 0' }}>
            <div className="glass-panel" style={{ padding: '80px 40px', position: 'relative', overflow: 'hidden' }}>
              <div className="scan-grid"></div>
              <div style={{ position: 'relative', zIndex: 2, maxWidth: '700px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-glow)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', marginBottom: '24px' }}>
                  <Activity size={14} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-silver)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>YOLOv11 Enterprise Defect Detection Engine</span>
                </div>
                
                <h2 style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.02em', color: 'var(--text-white)' }}>
                  Enterprise AI-Powered <br />
                  <span style={{ background: 'linear-gradient(90deg, var(--text-white) 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Vehicle Defect Detection
                  </span>
                </h2>
                
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '32px' }}>
                  A futuristic premium platform designed for dealerships, fleet managers, auto repair facilities, and insurance providers. Automate exterior physical damage inspections, assess vehicle health indicators, map nearby repair assignments, and generate official PDF/Excel reports instantly.
                </p>
                
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <button onClick={() => setActivePage('inspect')} className="btn btn-primary" style={{ padding: '12px 28px' }}>
                    Launch AI Scanner <Upload size={16} />
                  </button>
                  <button onClick={() => setActivePage('camera')} className="btn btn-secondary" style={{ padding: '12px 28px' }}>
                    Real-time Camera <Camera size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Core Stats Overview */}
            <div className="grid-cols-4">
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ color: 'var(--primary)' }}><Shield size={24} /></div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-white)' }}>Automatic Inspection</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  Instantly record panel defects like dents, scratches, paint damage, rust, and bumper issues using advanced OpenCV algorithms.
                </p>
              </div>
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ color: '#10b981' }}><Zap size={24} /></div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-white)' }}>Digital Health Score</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  Calculate a rating (0 to 100) reflecting structural conditions, EV battery health, tire wear, vehicle age, and OBD telemetry errors.
                </p>
              </div>
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ color: '#f59e0b' }}><FileCheck size={24} /></div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-white)' }}>Insurance Claim Ready</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  Export transparent PDF claims attachments containing color-coded severity evaluations, repair recommendations, and coordinate mappings.
                </p>
              </div>
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ color: '#8b5cf6' }}><Users size={24} /></div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-white)' }}>Fleet Monitoring</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  Observe multiple corporate vehicles, schedule preventive maintenance, track driver report metrics, and optimize garage operations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            ABOUT PAGE
           ======================================================== */}
        {activePage === 'about' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-white)' }}>Project Framework & AI Design</h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
                VehicleAI utilizes a hybrid convolutional and mathematical analysis pipeline designed for maximum reliability in structural assessment.
              </p>
              
              <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '16px', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-white)' }}>YOLOv11 Bounding-Box Detection</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Our framework supports custom-loaded YOLO weights to identify localized defect patterns (Scratch, Dent, Rust, Paint Damage, Windshield Crack, Broken Headlight, Bumper Damage, Tire Damage) and bounding coordinates.
                </p>
              </div>
              
              <div style={{ borderLeft: '3px solid #f59e0b', paddingLeft: '16px', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-white)' }}>Digital Vehicle Health Score Algorithm</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  The structural score is calculated dynamically on a 0-100 scale:
                  <br />
                  <code>Score = 100 - Sum(Defect Deductibles) - Age Penalty - Tire wear Penalty - Battery wear Penalty - Maintenance History Penalty</code>
                  <br />
                  Ratings are classified into: Excellent (90-100), Good (70-89), Needs Maintenance (50-69), and Critical Condition (Below 50).
                </p>
              </div>
              
              <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '16px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-white)' }}>Security & Role-Based Access Control (RBAC)</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Our platform ensures secure data practices. Inspectors handle image scanning, Managers oversee budget estimations and maintenance forecasts, and Administrators audit user activities and edit fleet settings.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            FEATURES PAGE
           ======================================================== */}
        {activePage === 'features' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-white)' }}>Core System & AI Capability Breakdown</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                VehicleAI incorporates enterprise features designed to optimize garage, dealership, and fleet operations.
              </p>
              
              <div className="grid-cols-3">
                {[
                  { title: "Damage Classification", desc: "Isolate scratches, paint chips, panel dents, bumper cracks, and windshield star fractures dynamically." },
                  { title: "AI Damage Heatmap", desc: "Generates high-contrast thermal gradients overlaying damaged panels to indicate damage clusters." },
                  { title: "OBD Telemetry Audit", desc: "Parses on-board diagnostic trouble codes (DTC) and EV cell conditions to evaluate interior engine health." },
                  { title: "ANPR Plate Reader", desc: "Recognizes license plates using automated character reading (ANPR) and links reports to specific vehicles." },
                  { title: "Service Booking & Mechanics", desc: "Matches nearby mechanics, tracks repairs on a progress bar, and sends scheduling bookings." },
                  { title: "Multi-Role Admin Console", desc: "Restricted dashboard logs and access controls for Administrators, Managers, and Inspectors." },
                  { title: "PDF & Excel Report Exports", desc: "Stream inspection sheets as standard Excel CSV files or export stylized PDF damage estimates." },
                  { title: "GPS & Location Logging", desc: "Record exact coordinates and time records of vehicle scans automatically on submission." },
                  { title: "OTP Verification", desc: "Supports OTP code validation for secure inspector credential logins." }
                ].map((feat, i) => (
                  <div key={i} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ display: 'inline-flex', padding: '6px', borderRadius: '6px', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)' }}>
                        <CheckCircle size={16} />
                      </span>
                      <h4 style={{ fontWeight: 700, color: 'var(--text-white)' }}>{feat.title}</h4>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            CLIENT PORTAL AUTH PAGE
           ======================================================== */}
        {activePage === 'auth' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '32px', position: 'relative' }}>
              
              {otpVisible ? (
                <form onSubmit={handleOtpLogin}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-white)' }}>Enter OTP</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
                    Enter the code sent to your credentials.
                  </p>

                  <div style={{ backgroundColor: 'var(--primary-glow)', border: '1px solid var(--border)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-silver)' }}>Simulated SMS Code: <b>{simulatedOtpCode}</b></span>
                  </div>

                  {authError && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '16px' }}>{authError}</div>}

                  <div className="form-group">
                    <label>Verification Code</label>
                    <input type="text" required value={otpCodeInput} onChange={(e) => setOtpCodeInput(e.target.value)} className="input-control" placeholder="123456" />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                    Verify Code & Login <CheckCircle size={16} />
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <span onClick={() => setOtpVisible(false)} style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }}>Back to Password Login</span>
                  </div>
                </form>
              ) : authMode === 'login' ? (
                <form onSubmit={handleLogin}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-white)' }}>Sign In</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>Access your defect reports and metrics dashboard</p>

                  {authError && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '16px' }}>{authError}</div>}
                  {authSuccess && <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#a7f3d0', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '16px' }}>{authSuccess}</div>}

                  <div className="form-group">
                    <label>Username</label>
                    <input type="text" required value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} className="input-control" placeholder="Inspector" />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="input-control" placeholder="••••••••" />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                      Sign In <Lock size={16} />
                    </button>
                    <button onClick={requestOtpCode} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                      Use OTP Login <Sun size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span onClick={() => { setAuthMode('forgot'); setAuthError(''); setAuthSuccess(''); }} style={{ color: 'var(--primary)', cursor: 'pointer' }}>Forgot Password?</span>
                    <span onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }} style={{ color: 'var(--primary)', cursor: 'pointer' }}>Create Account</span>
                  </div>
                </form>
              ) : authMode === 'register' ? (
                <form onSubmit={handleRegister}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-white)' }}>Register Account</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>Create your commercial client credentials</p>

                  {authError && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '16px' }}>{authError}</div>}

                  <div className="form-group">
                    <label>Username</label>
                    <input type="text" required value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} className="input-control" placeholder="aditya" />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="input-control" placeholder="aditya@company.com" />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="input-control" placeholder="••••••••" />
                  </div>

                  <div className="form-group">
                    <label>Organization Role</label>
                    <select value={roleInput} onChange={(e) => setRoleInput(e.target.value)} className="input-control">
                      <option value="Inspector">Inspector (Scans Vehicles)</option>
                      <option value="Manager">Manager (Financial Reports)</option>
                      <option value="Admin">Administrator (Audit Logs)</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                    Sign Up <Plus size={16} />
                  </button>

                  <div style={{ textFile: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
                    <span onClick={() => { setAuthMode('login'); setAuthError(''); }} style={{ color: 'var(--primary)', cursor: 'pointer' }}>Already have an account? Sign In</span>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-white)' }}>Forgot Password</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>Enter your email to request recovery instructions</p>

                  {authError && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '16px' }}>{authError}</div>}
                  {authSuccess && <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#a7f3d0', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '16px' }}>{authSuccess}</div>}

                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="input-control" placeholder="name@company.com" />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                    Send Reset Link <Mail size={16} />
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
                    <span onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }} style={{ color: 'var(--primary)', cursor: 'pointer' }}>Back to Sign In</span>
                  </div>
                </form>
              )}

            </div>
          </div>
        )}

        {/* ========================================================
            AI DETECTION PAGE (UPLOAD IMAGE)
           ======================================================== */}
        {activePage === 'inspect' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="grid-cols-2">
              
              {/* Form Input Side */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-white)' }}>
                  <Upload size={20} style={{ color: 'var(--primary)' }} /> Inspect Vehicle File
                </h2>

                <form onSubmit={handleInspectSubmit}>
                  <div className="form-group">
                    <label>Vehicle Name / Profile</label>
                    <input type="text" value={vehicleName} onChange={(e) => setVehicleName(e.target.value)} className="input-control" placeholder="e.g. Tesla Model Y" required />
                  </div>

                  <div className="form-group">
                    <label>License Plate (Or Autodetect)</label>
                    <input type="text" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} className="input-control" placeholder="e.g. CA-992-TX" />
                  </div>

                  {/* 360-degree panel selector buttons */}
                  <div className="form-group">
                    <label>360° Inspection Panel Zone</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['Front', 'Rear', 'Left Panel', 'Right Panel'].map(panel => (
                        <button 
                          key={panel}
                          type="button"
                          onClick={() => setPanelView(panel)}
                          className={`btn ${panelView === panel ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ flex: 1, padding: '8px', fontSize: '0.75rem', justifyContent: 'center' }}
                        >
                          {panel}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dropzone area */}
                  <div style={{
                    border: '2px dashed var(--border)',
                    borderRadius: '8px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    marginBottom: '20px',
                    position: 'relative'
                  }} onClick={() => document.getElementById('inspect-file').click()}>
                    <input type="file" id="inspect-file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '4px', border: '1px solid var(--border)' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <Upload size={32} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-silver)', fontWeight: 500 }}>Select or drop vehicle image here</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports JPG, JPEG, PNG formats</span>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={inspecting || !selectedFile}>
                    {inspecting ? (
                      <>Analyzing Vehicle... <RefreshCw className="animate-spin" size={16} /></>
                    ) : (
                      <>Process Defect Analysis <Shield size={16} /></>
                    )}
                  </button>
                </form>
              </div>

              {/* Real-time Result overlay side */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-white)' }}>Inspection Output</h2>
                  {inspectionResult && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => setShowHeatmap(!showHeatmap)} 
                        className={`btn ${showHeatmap ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        Heatmap {showHeatmap ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  )}
                </div>
                
                {inspecting && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid rgba(0,122,255,0.1)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-silver)', animation: 'pulse 1.5s infinite' }}>AI model scanning surfaces for defects...</span>
                  </div>
                )}

                {!inspecting && !inspectionResult && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', gap: '8px' }}>
                    <HelpCircle size={32} />
                    <span style={{ fontSize: '0.9rem' }}>Upload and analyze an image to view damage records.</span>
                  </div>
                )}

                {inspectionResult && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease-out' }}>
                    
                    {/* Before vs After Slider Layout */}
                    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      
                      {/* Original image underlay */}
                      <img 
                        src={previewUrl} 
                        alt="Original Underlay" 
                        style={{ width: '100%', display: 'block' }} 
                      />

                      {/* Annotated image overlay clipped by slider */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                        pointerEvents: 'none'
                      }}>
                        <img 
                          src={`${API_BASE_URL}/${inspectionResult.annotated_image}`} 
                          alt="Annotated Overlay" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>

                      {/* Canvas Overlay for Heatmap simulation */}
                      {showHeatmap && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
                          background: 'radial-gradient(circle at 35% 45%, rgba(239, 68, 68, 0.4) 0%, transparent 20%), radial-gradient(circle at 65% 55%, rgba(245, 158, 11, 0.4) 0%, transparent 25%)',
                          opacity: 0.8
                        }}></div>
                      )}

                      {/* Range slider input control */}
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={sliderPosition} 
                        onChange={(e) => setSliderPosition(e.target.value)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'ew-resize',
                          zIndex: 20
                        }}
                      />

                      {/* Vertical visual bar indicator */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: `${sliderPosition}%`,
                        width: '2px',
                        backgroundColor: 'var(--primary)',
                        boxShadow: '0 0 8px var(--primary)',
                        pointerEvents: 'none',
                        zIndex: 15
                      }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Digital Health Score</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span 
                            style={{ 
                              display: 'inline-block', padding: '4px 10px', borderRadius: '12px', 
                              backgroundColor: 'rgba(0,0,0,0.2)', fontSize: '0.95rem', fontWeight: 800, 
                              color: getScoreColor(inspectionResult.health_score), border: `1.5px solid ${getScoreColor(inspectionResult.health_score)}`
                            }}
                          >
                            {inspectionResult.health_score}/100
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Repair Estimate</span>
                        <div style={{ color: 'var(--primary)', fontSize: '1.3rem', fontWeight: 800, marginTop: '2px' }}>
                          ${inspectionResult.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>AI Summary</span>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-silver)', lineHeight: 1.5, marginTop: '4px', backgroundColor: 'var(--bg-input)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        {inspectionResult.summary}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleDownloadPDF(inspectionResult.id)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                        Download PDF Report <Download size={14} />
                      </button>
                      <button 
                        onClick={() => { setEmailReportId(inspectionResult.id); setEmailModalVisible(true); }} 
                        className="btn btn-secondary" 
                        style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                      >
                        Email Report <Mail size={14} />
                      </button>
                      <button 
                        onClick={() => window.open(`https://wa.me/?text=Vehicle%20AI%20Inspection%20Report%20ready%20for%20Plate%20${inspectionResult.license_plate}.%20Repair%20Budget:%20$${inspectionResult.total_cost}.`)}
                        className="btn btn-secondary" 
                        style={{ padding: '8px 16px', fontSize: '0.8rem', color: '#25D366' }}
                      >
                        Share via WhatsApp <Share2 size={14} />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Damage list under layout */}
            {inspectionResult && inspectionResult.defects.length > 0 && (
              <div className="glass-panel" style={{ padding: '24px', animation: 'fadeIn 0.4s ease-out' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-white)' }}>Defect Breakdown Details</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Damage Type</th>
                        <th>Severity</th>
                        <th>Affected Part</th>
                        <th>AI Confidence</th>
                        <th>Budget Estimate</th>
                        <th>Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspectionResult.defects.map((defect) => {
                        const recs = {
                          "Scratch": "Polishing & minor paint touch-up required.",
                          "Dent": "Paintless Dent Repair (PDR) or panel reshaping needed.",
                          "Rust": "Rust treatment, sanding, and anti-corrosion primer application.",
                          "Paint Damage": "Sanding and multi-coat respraying of panels.",
                          "Windshield Crack": "Resin injection or total windshield replacement.",
                          "Broken Headlight": "Lens cover or headlight assembly replacement.",
                          "Tire Damage": "Puncture patching or replacement of tire.",
                          "Bumper Damage": "Bumper clips realigned or total bumper cover replacement."
                        };
                        return (
                          <tr key={defect.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-white)' }}>{defect.defect_type}</td>
                            <td>
                              <span className={`badge badge-${defect.severity.toLowerCase()}`}>{defect.severity}</span>
                            </td>
                            <td>{defect.part_affected}</td>
                            <td>{defect.confidence}%</td>
                            <td style={{ fontWeight: 600, color: 'var(--primary)' }}>${defect.cost_est_min} - ${defect.cost_est_max}</td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{recs[defect.defect_type] || "Standard body repair procedures."}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================
            LIVE CAMERA DETECTION PAGE (WEBCAM INTEGRATION)
           ======================================================== */}
        {activePage === 'camera' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="grid-cols-2">
              
              {/* Camera view screen panel */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-white)' }}>
                    <Camera size={20} style={{ color: 'var(--primary)' }} /> Live Camera Scanning
                  </h2>
                  <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-input)', padding: '4px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <button 
                      onClick={() => { setCameraMode('capture'); setLiveDetecting(false); setLiveStreamResult(null); }}
                      className="btn" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: cameraMode === 'capture' ? 'var(--primary)' : 'transparent', color: '#fff' }}
                    >
                      Capture Snapshot
                    </button>
                    <button 
                      onClick={() => { setCameraMode('live'); setCamInspectionResult(null); }} 
                      className="btn" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: cameraMode === 'live' ? 'var(--primary)' : 'transparent', color: '#fff' }}
                    >
                      Real-time Feed
                    </button>
                  </div>
                </div>

                {cameraError && (
                  <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {cameraError}
                  </div>
                )}

                {/* Viewport frame box */}
                <div className="scan-container" style={{ aspectRatio: '16/9', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cameraActive && <div className="scan-line"></div>}
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraActive ? 'block' : 'none' }}
                  ></video>
                  
                  <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

                  {capturedImage && (
                    <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}

                  {!cameraActive && !capturedImage && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <Camera size={40} />
                      <span style={{ fontSize: '0.9rem' }}>Webcam connection closed</span>
                      <button onClick={startCamera} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Re-open Camera</button>
                    </div>
                  )}
                </div>

                {cameraMode === 'capture' ? (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Vehicle Reference</span>
                      <input type="text" value={camVehicleName} onChange={(e) => setCamVehicleName(e.target.value)} className="input-control" style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>License Plate</span>
                      <input type="text" value={camLicensePlate} onChange={(e) => setCamLicensePlate(e.target.value)} className="input-control" style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
                    </div>
                    <button onClick={capturePhoto} className="btn btn-primary" style={{ padding: '10px 20px' }} disabled={!cameraActive || inspecting}>
                      Capture Image <Camera size={16} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-silver)' }}>
                      Analyze damage frames sequentially (runs every 1.5s)
                    </span>
                    <button 
                      onClick={() => {
                        if (!cameraActive) {
                          startCamera().then(() => setLiveDetecting(true));
                        } else {
                          setLiveDetecting(!liveDetecting);
                        }
                      }} 
                      className={`btn ${liveDetecting ? 'btn-danger' : 'btn-primary'}`}
                      style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                    >
                      {liveDetecting ? "Pause Live Scanner" : "Start Live Scanner"}
                    </button>
                  </div>
                )}
              </div>

              {/* Inspection Output results */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '400px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '12px', color: 'var(--text-white)' }}>Scanning Results</h2>

                {inspecting && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid rgba(0,122,255,0.1)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-silver)' }}>Evaluating camera capture...</span>
                  </div>
                )}

                {/* For captured image result display */}
                {cameraMode === 'capture' && camInspectionResult && !inspecting && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge badge-${camInspectionResult.overall_severity.toLowerCase()}`}>{camInspectionResult.overall_severity} Damage</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.2rem' }}>${camInspectionResult.total_cost.toLocaleString()}</span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-silver)', backgroundColor: 'var(--bg-input)', padding: '12px', border: '1px solid var(--border)', borderRadius: '6px', lineHeight: 1.5 }}>
                      <b>Summary:</b> {camInspectionResult.summary}
                    </div>

                    <div className="table-container">
                      <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                        <thead>
                          <tr>
                            <th>Defect</th>
                            <th>Severity</th>
                            <th>Part</th>
                            <th>Conf</th>
                          </tr>
                        </thead>
                        <tbody>
                          {camInspectionResult.defects.map(d => (
                            <tr key={d.id}>
                              <td style={{ fontWeight: 600, color: 'var(--text-white)' }}>{d.defect_type}</td>
                              <td>{d.severity}</td>
                              <td>{d.part_affected}</td>
                              <td>{d.confidence}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleDownloadPDF(camInspectionResult.id)} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '8px 16px' }}>
                        Download PDF <Download size={14} />
                      </button>
                      <button onClick={startCamera} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '8px 16px' }}>
                        Restart Camera
                      </button>
                    </div>
                  </div>
                )}

                {/* For real-time camera streaming feedback display */}
                {cameraMode === 'live' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {liveStreamResult ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s ease-out' }}>
                        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <img src={liveStreamResult.annotated_image} alt="Live Overlay" style={{ width: '100%' }} />
                        </div>

                        <div>
                          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Active Defects Detected</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                            {liveStreamResult.defects.length > 0 ? (
                              liveStreamResult.defects.map((d, i) => (
                                <span key={i} className={`badge badge-${d.severity.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                                  {d.defect_type} ({d.part_affected}) • {d.confidence}%
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Surface clear. No damage identified in active viewport.</span>
                            )}
                          </div>
                        </div>

                        {/* OBD Telemetry Simulation codes inside camera feed */}
                        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <AlertCircle size={16} style={{ color: '#ef4444' }} />
                          <div style={{ fontSize: '0.75rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-white)' }}>OBD System Warning:</span>
                            <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>No active DTC codes found. EV battery health rated at 95%.</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', gap: '8px' }}>
                        <RefreshCw size={28} className={liveDetecting ? "animate-spin" : ""} />
                        <span style={{ fontSize: '0.85rem' }}>{liveDetecting ? "Awaiting visual detection response..." : "Scanner idle"}</span>
                      </div>
                    )}
                  </div>
                )}

                {!camInspectionResult && cameraMode === 'capture' && !inspecting && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', gap: '8px' }}>
                    <Camera size={32} />
                    <span style={{ fontSize: '0.9rem' }}>Awaiting photo capture...</span>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            DASHBOARD PAGE
           ======================================================== */}
        {activePage === 'dashboard' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {loadingStats ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
              </div>
            ) : stats ? (
              <>
                {/* Stats cards grid */}
                <div className="grid-cols-4">
                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)' }}>
                      <FileCheck size={20} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Vehicles Scanned</span>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-white)' }}>{stats.total_inspections}</h3>
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--severity-high)' }}>
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Defects Found</span>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-white)' }}>{stats.total_defects}</h3>
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--severity-low)' }}>
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Repair Costs</span>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-white)' }}>${stats.total_estimated_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                      <Zap size={20} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Fleet Health Score</span>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-white)' }}>92.5%</h3>
                    </div>
                  </div>
                </div>

                {/* Graphs layout split */}
                <div className="grid-cols-2">
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-white)' }}>Monthly Inspection Volume</h3>
                    <LineChart data={stats.monthly_trend} xKey="month" yKey="inspections" />
                  </div>

                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-white)' }}>Monthly Repair Cost Trends</h3>
                    <BarChart data={stats.monthly_trend} xKey="month" yKey="cost" />
                  </div>
                </div>

                {/* Distributions split */}
                <div className="grid-cols-2">
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-white)' }}>Defect Types Distribution</h3>
                    <DonutChart data={stats.defect_distribution} />
                  </div>

                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-white)' }}>Damage Severity Levels</h3>
                    <SeverityBarChart data={stats.severity_distribution} />
                  </div>
                </div>

                {/* Business features role panel (For Managers and Admins) */}
                {(!user || user.role === 'Admin' || user.role === 'Manager') && (
                  <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'rgba(220, 38, 38, 0.02)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-white)' }}>Corporate Maintenance Budget planning</h3>
                      </div>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: 700 }}>
                        Role: {user ? user.role : 'Manager'} Allowed
                      </span>
                    </div>
                    <div className="grid-cols-3" style={{ gap: '16px' }}>
                      <div style={{ backgroundColor: 'var(--bg-input)', padding: '16px', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quarterly Budget Allocated</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-white)', marginTop: '4px' }}>$150,000</div>
                        <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '2px' }}>74% Remaining</div>
                      </div>
                      <div style={{ backgroundColor: 'var(--bg-input)', padding: '16px', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Spent-to-Date (Repairs)</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-white)', marginTop: '4px' }}>${stats.total_estimated_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '2px' }}>Within normal limits</div>
                      </div>
                      <div style={{ backgroundColor: 'var(--bg-input)', padding: '16px', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Predictive Maintenance Target</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-white)', marginTop: '4px' }}>$12,450</div>
                        <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '2px' }}>Next run: July 2026</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Reports Table */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-white)' }}>Recent Inspections</h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Vehicle Profile</th>
                          <th>License Plate</th>
                          <th>Severity</th>
                          <th>Repair Estimate</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recent_reports.length > 0 ? (
                          stats.recent_reports.map((report) => (
                            <tr key={report.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedReport(report); setActivePage('reports'); }}>
                              <td>{new Date(report.created_at).toLocaleDateString()}</td>
                              <td style={{ fontWeight: 600, color: 'var(--text-white)' }}>{report.vehicle_name}</td>
                              <td>{report.license_plate || 'N/A'}</td>
                              <td>
                                <span className={`badge badge-${report.overall_severity.toLowerCase()}`}>{report.overall_severity}</span>
                              </td>
                              <td style={{ fontWeight: 600, color: 'var(--primary)' }}>${report.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button onClick={(e) => { e.stopPropagation(); handleDownloadPDF(report.id); }} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Download PDF">
                                    <Download size={14} />
                                  </button>
                                  <button onClick={(e) => handleDeleteReport(report.id, e)} className="btn btn-danger" style={{ padding: '6px 10px' }} title="Delete">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No recent inspections logged.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>No statistics loaded. Please perform an inspection upload first.</div>
            )}
          </div>
        )}

        {/* ========================================================
            REPORTS PAGE
           ======================================================== */}
        {activePage === 'reports' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Filter and search bar section */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="input-control" 
                  style={{ paddingLeft: '36px' }}
                  placeholder="Search vehicle make, model, or plate..." 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Severity:</span>
                </div>
                <select value={damageFilter} onChange={(e) => setDamageFilter(e.target.value)} className="input-control" style={{ width: '130px', padding: '8px 12px', fontSize: '0.85rem' }}>
                  <option value="All">All Levels</option>
                  <option value="Minor">Minor</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </select>

                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-control" style={{ width: '130px', padding: '8px 12px', fontSize: '0.85rem' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>to</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-control" style={{ width: '130px', padding: '8px 12px', fontSize: '0.85rem' }} />

                <button onClick={fetchReports} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Apply
                </button>
                <button onClick={handleExportExcel} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Export Excel <Download size={14} />
                </button>
              </div>
            </div>

            {/* Main reports grid/details split layout */}
            <div className="grid-cols-3" style={{ gridTemplateColumns: selectedReport ? '1.2fr 1.8fr' : '1fr' }}>
              
              {/* Reports List */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-white)' }}>Inspection Reports Archive</h3>

                {loadingReports ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <RefreshCw size={24} className="animate-spin" />
                  </div>
                ) : reports.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '550px', overflowY: 'auto' }}>
                    {reports.map((report) => (
                      <div 
                        key={report.id} 
                        onClick={() => setSelectedReport(report)}
                        style={{
                          padding: '16px',
                          borderRadius: '8px',
                          border: `1px solid ${selectedReport && selectedReport.id === report.id ? 'var(--primary)' : 'var(--border)'}`,
                          backgroundColor: selectedReport && selectedReport.id === report.id ? 'var(--primary-glow)' : 'var(--bg-input)',
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-white)' }}>{report.vehicle_name}</span>
                          <span className={`badge badge-${report.overall_severity.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{report.overall_severity}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span>Plate: {report.license_plate || 'N/A'}</span>
                          <span>{new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
                          <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem' }}>${report.total_cost.toLocaleString()}</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={(e) => { e.stopPropagation(); handleDownloadPDF(report.id); }} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                              <Download size={12} />
                            </button>
                            <button onClick={(e) => handleDeleteReport(report.id, e)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No reports match the active filters.</div>
                )}
              </div>

              {/* Report Detail View */}
              {selectedReport && (
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-out' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-white)' }}>{selectedReport.vehicle_name}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Report ID: #RPT-{selectedReport.id} | Plate: {selectedReport.license_plate || 'N/A'} | Date: {new Date(selectedReport.created_at).toLocaleString()}
                      </span>
                    </div>
                    <button onClick={() => setSelectedReport(null)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Close</button>
                  </div>

                  <div className="grid-cols-2" style={{ gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Original Image</span>
                      <img src={`${API_BASE_URL}/${selectedReport.original_image}`} alt="Original" style={{ width: '100%', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '6px' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>AI Defect Overlay</span>
                      <img src={`${API_BASE_URL}/${selectedReport.annotated_image}`} alt="Annotated" style={{ width: '100%', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '6px' }} />
                    </div>
                  </div>

                  {/* Advanced telemetry details row */}
                  <div className="grid-cols-4" style={{ gap: '12px' }}>
                    <div style={{ backgroundColor: 'var(--bg-input)', padding: '12px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Health score</span>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: getScoreColor(selectedReport.health_score), marginTop: '2px' }}>
                        {selectedReport.health_score}/100
                      </div>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-input)', padding: '12px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>EV Battery health</span>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-white)', marginTop: '2px' }}>
                        {selectedReport.battery_health}%
                      </div>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-input)', padding: '12px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tire wear</span>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-white)', marginTop: '2px' }}>
                        {selectedReport.tire_condition}
                      </div>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-input)', padding: '12px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>OBD status</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-white)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedReport.obd_status}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Overall Severity</span>
                      <span className={`badge badge-${selectedReport.overall_severity.toLowerCase()}`}>{selectedReport.overall_severity}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Total Cost Estimate</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem' }}>${selectedReport.total_cost.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Assessment Summary</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-silver)', lineHeight: 1.5, marginTop: '6px' }}>
                      {selectedReport.summary}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Defect Details Table</span>
                    <div className="table-container">
                      <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                        <thead>
                          <tr>
                            <th>Defect Type</th>
                            <th>Severity</th>
                            <th>Part Affected</th>
                            <th>Confidence</th>
                            <th>Cost Est. Range</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReport.defects.map(d => (
                            <tr key={d.id}>
                              <td style={{ fontWeight: 600, color: 'var(--text-white)' }}>{d.defect_type}</td>
                              <td>{d.severity}</td>
                              <td>{d.part_affected}</td>
                              <td>{d.confidence}%</td>
                              <td style={{ fontWeight: 600, color: 'var(--primary)' }}>${d.cost_est_min} - ${d.cost_est_max}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleDownloadPDF(selectedReport.id)} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                      Download Official PDF <Download size={16} />
                    </button>
                    <button 
                      onClick={() => { setEmailReportId(selectedReport.id); setEmailModalVisible(true); }}
                      className="btn btn-secondary"
                    >
                      Email Report <Mail size={16} />
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

        {/* ========================================================
            VEHICLE HISTORY PAGE
           ======================================================== */}
        {activePage === 'history' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-white)' }}>Vehicle Inspections directory (ANPR Logs)</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Complete records of all scanned vehicles, including plate numbers and mechanical score history.
              </p>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Plate Number</th>
                      <th>Make & Model</th>
                      <th>Vehicle Age</th>
                      <th>Avg Health Score</th>
                      <th>OBD Telemetry</th>
                      <th>EV Battery Health</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length > 0 ? (
                      reports.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{r.license_plate || 'CA-992-TX'}</td>
                          <td style={{ color: 'var(--text-white)', fontWeight: 600 }}>{r.vehicle_make} {r.vehicle_model}</td>
                          <td>{r.vehicle_age} Years</td>
                          <td style={{ fontWeight: 700, color: getScoreColor(r.health_score) }}>{r.health_score}/100</td>
                          <td>{r.obd_status}</td>
                          <td>{r.battery_health}%</td>
                          <td>
                            <span 
                              className="badge" 
                              style={{ 
                                backgroundColor: r.health_score >= 90 ? 'rgba(16, 185, 129, 0.15)' : r.health_score >= 70 ? 'rgba(0,122,255,0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: getScoreColor(r.health_score),
                                border: `1px solid ${getScoreColor(r.health_score)}`
                              }}
                            >
                              {r.health_score >= 90 ? 'Excellent' : r.health_score >= 70 ? 'Good' : r.health_score >= 50 ? 'Needs Maint.' : 'Critical'}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => { setSelectedReport(r); setActivePage('reports'); }} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                              View Report <Eye size={12} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No vehicle history logged. Perform an AI scan to create records.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SERVICE CENTER INTEGRATION PAGE
           ======================================================== */}
        {activePage === 'service' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="grid-cols-2">
              
              {/* Map & Recommendation Box */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-white)' }}>Nearby Certified Service Centers</h3>
                
                {/* Mock Map Representation */}
                <div style={{ 
                  height: '240px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: '8px', position: 'relative', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <div className="scan-grid" style={{ opacity: 0.15 }}></div>
                  <div style={{ position: 'absolute', top: '25%', left: '35%', color: 'var(--primary)', animation: 'pulseBorder 2s infinite' }}>
                    <MapPin size={24} />
                    <span style={{ display: 'block', fontSize: '0.65rem', backgroundColor: 'rgba(0,0,0,0.8)', padding: '2px 4px', borderRadius: '4px', marginTop: '2px', color: '#fff' }}>Silicon Valley Repair</span>
                  </div>
                  <div style={{ position: 'absolute', top: '65%', left: '70%', color: '#10b981' }}>
                    <MapPin size={24} />
                    <span style={{ display: 'block', fontSize: '0.65rem', backgroundColor: 'rgba(0,0,0,0.8)', padding: '2px 4px', borderRadius: '4px', marginTop: '2px', color: '#fff' }}>SF Precision Collision</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Map View (San Francisco / Bay Area)</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { name: 'Silicon Valley Auto Repair', distance: '1.2 miles away', rating: '4.9 ★', address: '1200 Palo Alto Hwy, Palo Alto' },
                    { name: 'SF Precision Collision', distance: '3.5 miles away', rating: '4.8 ★', address: '450 Geary St, San Francisco' },
                    { name: 'Oakland Tech Auto', distance: '5.8 miles away', rating: '4.7 ★', address: '880 Broadway, Oakland' },
                  ].map(center => (
                    <div 
                      key={center.name} 
                      onClick={() => setSelectedServiceCenter(center.name)}
                      style={{
                        padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-input)',
                        border: `1.5px solid ${selectedServiceCenter === center.name ? 'var(--primary)' : 'transparent'}`,
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-white)', fontSize: '0.9rem' }}>{center.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{center.address}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{center.distance}</div>
                        <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '2px' }}>{center.rating}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignment & Booking Box */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-white)' }}>Service Booking & Mechanic Assignment</h3>

                {bookingConfirmed ? (
                  <div style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    flex: 1, gap: '12px', textAlign: 'center', padding: '40px 0', animation: 'fadeIn 0.3s ease-out'
                  }}>
                    <CheckCircle size={48} style={{ color: '#10b981' }} />
                    <h4 style={{ fontWeight: 800, color: 'var(--text-white)' }}>Booking Confirmed!</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '320px' }}>
                      Your vehicle booking at <b>{selectedServiceCenter}</b> has been locked for <b>{bookingDate}</b> at <b>{bookingTime}</b>. 
                      Mechanic <b>{assignedMechanic}</b> has been assigned.
                    </p>
                    <button onClick={() => setBookingConfirmed(false)} className="btn btn-primary" style={{ marginTop: '10px' }}>Book Another Service</button>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); setBookingConfirmed(true); }}>
                    <div className="form-group">
                      <label>Target Facility</label>
                      <input type="text" readOnly value={selectedServiceCenter} className="input-control" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }} />
                    </div>

                    <div className="form-group">
                      <label>Assign Certified Mechanic</label>
                      <select value={assignedMechanic} onChange={(e) => setAssignedMechanic(e.target.value)} className="input-control">
                        <option value="Aditya Bhosale">Aditya Bhosale (Senior EV Technician)</option>
                        <option value="John Doe">John Doe (Master Panel Reshaper)</option>
                        <option value="Alex Smith">Alex Smith (Collision specialist)</option>
                      </select>
                    </div>

                    <div className="grid-cols-2" style={{ gap: '12px' }}>
                      <div className="form-group">
                        <label>Inspection Date</label>
                        <input type="date" required value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="input-control" />
                      </div>
                      <div className="form-group">
                        <label>Preferred Time</label>
                        <input type="time" required value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="input-control" />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Confirm Repair Appointment <Calendar size={16} />
                    </button>
                  </form>
                )}

                {/* Repair Status tracker progress bar */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '12px' }}>Active repair tracker</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <span>Step {repairStep} of 6: <b>{
                      repairStep === 1 ? 'Vehicle Intake' : 
                      repairStep === 2 ? 'Sensor Diagnosis' : 
                      repairStep === 3 ? 'Body panel work' : 
                      repairStep === 4 ? 'Respraying Paint' : 
                      repairStep === 5 ? 'Final Quality audit' : 'Delivered'
                    }</b></span>
                    <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setRepairStep(prev => prev < 6 ? prev + 1 : 1)}>Advance step</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden', display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5, 6].map(step => (
                      <div 
                        key={step} 
                        style={{ 
                          flex: 1, height: '100%', 
                          backgroundColor: step <= repairStep ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                          boxShadow: step <= repairStep ? '0 0 6px var(--primary)' : 'none'
                        }}
                      ></div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            FLEET MANAGEMENT PAGE
           ======================================================== */}
        {activePage === 'fleet' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Fleet details overview grid */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-white)' }}>Company Fleet Monitoring</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Real-time safety ratings, battery wear levels, and scheduled preventative audits of corporate fleet vehicles.
              </p>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Vehicle Profile</th>
                      <th>License Plate</th>
                      <th>Assigned Driver</th>
                      <th>Health Score</th>
                      <th>EV Battery</th>
                      <th>Next Inspection</th>
                      <th>Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fleetVehicles.map(veh => (
                      <tr key={veh.id}>
                        <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{veh.id}</td>
                        <td style={{ color: 'var(--text-white)', fontWeight: 600 }}>{veh.name}</td>
                        <td>{veh.plate}</td>
                        <td>{veh.driver}</td>
                        <td style={{ fontWeight: 700, color: getScoreColor(veh.score) }}>{veh.score}/100</td>
                        <td>{veh.battery}%</td>
                        <td>{veh.nextMaintenance}</td>
                        <td>
                          <span 
                            className="badge" 
                            style={{ 
                              backgroundColor: veh.score >= 90 ? 'rgba(16, 185, 129, 0.15)' : veh.score >= 70 ? 'rgba(0,122,255,0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: getScoreColor(veh.score),
                              border: `1px solid ${getScoreColor(veh.score)}`
                            }}
                          >
                            {veh.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Maintenance schedules calendar panel */}
            <div className="grid-cols-2">
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-white)', marginBottom: '16px' }}>Maintenance Alert Calendar</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { date: 'July 17, 2026', vehicle: 'Ford Mustang Mach-E (FL-004)', action: 'Critical body repairs scheduled.' },
                    { date: 'July 18, 2026', vehicle: 'Audi e-tron (FL-003)', action: 'Rust treatment Primer application scheduled.' },
                    { date: 'July 29, 2026', vehicle: 'BMW i4 (FL-002)', action: 'Standard 30,000-mile inspection scan.' },
                  ].map((alert, i) => (
                    <div key={i} style={{ backgroundColor: 'var(--bg-input)', padding: '12px', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span style={{ color: 'var(--text-white)' }}>{alert.vehicle}</span>
                        <span style={{ color: 'var(--primary)' }}>{alert.date}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{alert.action}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-white)', marginBottom: '16px' }}>Safety & Driver Driver Reports</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { name: 'Alice Jones', score: '98%', rank: 'Excellent', notes: 'Perfect logs, zero diagnostics alerts.' },
                    { name: 'Bob Smith', score: '91%', rank: 'Good', notes: 'Minor minor paint scratch recorded.' },
                    { name: 'Charlie Miller', score: '76%', rank: 'Fair', notes: 'Multiple medium dents logged.' },
                  ].map((driver, i) => (
                    <div key={i} style={{ backgroundColor: 'var(--bg-input)', padding: '12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-white)' }}>{driver.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{driver.notes}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 800 }}>{driver.score}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{driver.rank}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            CONTACT PAGE
           ======================================================== */}
        {activePage === 'contact' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '32px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-white)' }}>Contact VehicleAI Corporate Support</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                For custom YOLO integrations, enterprise licensing, or garage deployment queries, reach out to our team.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); alert("Inquiry submitted successfully! A support agent will contact you shortly."); e.target.reset(); }}>
                <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label>First Name</label>
                    <input type="text" required className="input-control" placeholder="John" />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input type="text" required className="input-control" placeholder="Doe" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Work Email</label>
                  <input type="email" required className="input-control" placeholder="john@company.com" />
                </div>

                <div className="form-group">
                  <label>Message / Inquiries</label>
                  <textarea rows="4" required className="input-control" style={{ resize: 'none', height: '100px' }} placeholder="Detail your project requirements or API volume..."></textarea>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Submit Inquiry <Phone size={16} />
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* Developed By Aditya Bhosale Global Footer */}
      <footer className="glass-panel" style={{ margin: '0 16px 16px', padding: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-silver)' }}>Developed By Aditya Bhosale</span>
        <p style={{ marginTop: '4px' }}>&copy; {new Date().getFullYear()} VehicleAI Systems. Enterprise Automotive Defect Platform.</p>
      </footer>

      {/* --- MOCK EMAIL SENDING MODAL DIALOG --- */}
      {emailModalVisible && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-white)' }}>Email Inspection PDF</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Send a copy of Report #{emailReportId} to the client's email address.
            </p>
            <form onSubmit={handleSendEmailReport}>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={emailRecipient} 
                  onChange={(e) => setEmailRecipient(e.target.value)} 
                  className="input-control" 
                  placeholder="recipient@example.com" 
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEmailModalVisible(false)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Send Email <Mail size={14} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
