import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import './AdminDashboard.css';

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', id: 'dashboard' },
  { icon: 'school', label: 'Students', id: 'students' },
  { icon: 'badge', label: 'Instructors', id: 'instructors' },
  { icon: 'inventory_2', label: 'Packages', id: 'packages' },
  { icon: 'event_available', label: 'Bookings', id: 'bookings' },
  { icon: 'payments', label: 'Payments', id: 'payments' },
  { icon: 'directions_car', label: 'Vehicles', id: 'vehicles' },
  { icon: 'analytics', label: 'Reports', id: 'reports' },
  { icon: 'notifications', label: 'Notifications', id: 'notifications' },
  { icon: 'settings', label: 'Settings', id: 'settings' },
];

const dashboardStatsData = [
  { label: 'Total Students', value: '1,240', trend: '12% vs last month', icon: 'trending_up', type: 'positive' },
  { label: 'Active Students', value: '850', trend: '5% increase', icon: 'trending_up', type: 'positive' },
  { label: 'Total Bookings', value: '3,120', trend: 'Stable flow', icon: 'horizontal_rule', type: 'neutral' },
  { label: 'Total Revenue', value: 'Rs. 4.2M', trend: 'Rs. 240k this week', icon: 'trending_up', type: 'positive' },
];

const initialRegistrations = [
  {
    name: 'Samantha Perera',
    id: '#ST-9021',
    phone: '+94 77 123 4567',
    email: 'sam@example.com',
    status: 'Pending',
  },
  {
    name: 'Kasun Rajapaksha',
    id: '#ST-9022',
    phone: '+94 71 888 2211',
    email: 'kasun.r@email.com',
    status: 'Pending',
  },
];

const upcomingBookings = [
  {
    student: 'Amal Wickrama',
    date: 'Oct 24, 2023',
    time: '09:00 AM - 11:00 AM',
    vehicle: 'Van #04',
  },
  {
    student: 'Ishani Silva',
    date: 'Oct 24, 2023',
    time: '02:00 PM - 04:00 PM',
    vehicle: 'Car #12',
  },
];

const packagesData = [
  {
    name: 'Standard',
    price: 'Rs. 15,000',
    desc: '15 Lessons • Car or Bike',
    icons: ['directions_car', 'motorcycle'],
  },
  {
    name: 'Premium',
    price: 'Rs. 28,000',
    desc: '30 Lessons • Car + Van',
    icons: ['directions_car', 'airport_shuttle'],
  },
  {
    name: 'Intensive',
    price: 'Rs. 45,000',
    desc: 'Unlimited • Multi-Vehicle',
    icons: ['directions_car', 'airport_shuttle', 'electric_rickshaw'],
  },
];

const fleetData = [
  { icon: 'airport_shuttle', name: 'Vans', count: '6 Students', fill: 75 },
  { icon: 'electric_rickshaw', name: 'Three-wheelers', count: '2 Students', fill: 30 },
  { icon: 'motorcycle', name: 'Bikes', count: '4 Students', fill: 50 },
];

const recentPayments = [
  { name: 'Nimal Perera', pkg: 'Premium Package', amount: 'Rs. 28,000', status: 'Paid', statusType: 'paid' },
  { name: 'Sunil H.', pkg: 'Intensive Package', amount: 'Rs. 15,000', status: 'Bal: Rs. 30k', statusType: 'pending' },
];

const defaultStudents = [
  {
    id: 1,
    name: 'Amal Wickrama',
    email: 'amal.w@email.com',
    regDate: 'Oct 24, 2023',
    status: 'PENDING',
    dob: '1998-05-12',
    nic: '982345678V',
    phone: '077 123 4567',
    address: 'No 45, Galle Road, Colombo',
    emergencyContact: 'Saman - 077 123 4567',
    licenseType: 'Manual (Class B)',
    vehiclePreference: 'Toyota Prius',
    package: 'Premium',
    progress: 60,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCd3VCy3AZwIadqbXHePg3dB1TKQflrC-FltgeWLykmqWKqG629KxgDMRsK_ZLO47zYbvpESck-7qvgar7EXod19IvAmJs1dyVBlU1gWwZOL1CYEkNHLdhkhWfKDElVRYeDA_V64BGu_USE6pOvNbfKM96o76-3so-o8tCHKBKayCs7Oj3xdPXws3Nfr4DiBzpU3QF2V9EzEobfKreUUl8UdJ_B-PXMJYq8a47RH3jd8ys8kMHGHYGU6Vy7z_wY5jE8QhmSS5DiZegd'
  },
  {
    id: 2,
    name: 'Nuwan Silva',
    email: 'nuwan.s@email.com',
    regDate: 'Oct 23, 2023',
    status: 'PENDING',
    dob: '1988-02-15',
    nic: '881233445V',
    phone: '075 554 3322',
    address: 'No 12, Negombo Road, Kurunegala',
    emergencyContact: 'Silva - 075 554 3322',
    licenseType: 'Manual (Class A/B)',
    vehiclePreference: 'Toyota Prius',
    package: 'Intensive',
    progress: 20,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpLqiAkYOCk6DabyhNDM4h2U7ulPaXUNjbTPNCYi_KBucTKDjCQ1cs-H-cF51SDOG9O0fE7jlOwquRQ1hCe-E-E8dIKVfRYQYTer2j-9LhPqMFv3LhBlvBENeIXew1IuMZDi8o064Edb5Iw1thj5DzInY7g5Ea8SnzUhHBLlhcIVMaO9BenF0ob5GQG5mhc08uKEsVi45dGDg-t_WtOy9bTa4Waqbyu62ZKqJcu8BvTN-KU1lzWAQvGEFP4bkmUMNwoTILvHVjPGLc'
  },
  {
    id: 3,
    name: 'Kasuni Perera',
    email: 'kasuni.p@email.com',
    regDate: 'Oct 22, 2023',
    status: 'APPROVED',
    dob: '1995-10-24',
    nic: '954433221V',
    phone: '071 998 7766',
    address: 'No 88, Kurunegala Road, Kiribathgoda',
    emergencyContact: 'Perera - 071 998 7766',
    licenseType: 'Auto (Class B)',
    vehiclePreference: 'Toyota Prius',
    package: 'Premium',
    progress: 85,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUD5oHDsF0NHscXJSNwB3t1BtOIfmoRvbxxQzrz6BVo4YstNyPP5c34zjZqWokwnsBntCwAsEcLDz7dGqv6czXorMLxxY74y5cMZTOyL_q8b5nigZPgB8fKTCfmLByNZxGhNz9c0Q7sdy6NXuZljducrtVmpRe01xqEBChSt8SKZGRIiqa9q-NwyIdza4ns444aYO3k_YhmD8v7FgI2yBN4nuPla1Vyl5o-obDaRK5y4xvquYZKLw2G5dS0u4VCkZ2bMDbzt35_20s'
  }
];

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState('students'); // Start directly on student management to showcase it
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [students, setStudents] = useState(defaultStudents);
  const [selectedStudent, setSelectedStudent] = useState(defaultStudents[0]);
  const [panelOpen, setPanelOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Student List Active Sub-Tab View (Pending vs Active)
  const [studentSubTab, setStudentSubTab] = useState('pending'); // 'pending' or 'active'
  const [activeFilterSelect, setActiveFilterSelect] = useState('All Filters');

  // Modal for Adding Student
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNic, setNewNic] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPackage, setNewPackage] = useState('Premium');
  const [newStatus, setNewStatus] = useState('PENDING');

  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  // Subscribe to students in Firestore
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() });
      });

      const prepared = fetched.map(s => ({
        ...s,
        name: s.name || 'Unknown Student',
        email: s.email || 'no-email@example.com',
        avatar: s.avatar || (s.status && s.status.toLowerCase() === 'approved' 
          ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUD5oHDsF0NHscXJSNwB3t1BtOIfmoRvbxxQzrz6BVo4YstNyPP5c34zjZqWokwnsBntCwAsEcLDz7dGqv6czXorMLxxY74y5cMZTOyL_q8b5nigZPgB8fKTCfmLByNZxGhNz9c0Q7sdy6NXuZljducrtVmpRe01xqEBChSt8SKZGRIiqa9q-NwyIdza4ns444aYO3k_YhmD8v7FgI2yBN4nuPla1Vyl5o-obDaRK5y4xvquYZKLw2G5dS0u4VCkZ2bMDbzt35_20s'
          : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCd3VCy3AZwIadqbXHePg3dB1TKQflrC-FltgeWLykmqWKqG629KxgDMRsK_ZLO47zYbvpESck-7qvgar7EXod19IvAmJs1dyVBlU1gWwZOL1CYEkNHLdhkhWfKDElVRYeDA_V64BGu_USE6pOvNbfKM96o76-3so-o8tCHKBKayCs7Oj3xdPXws3Nfr4DiBzpU3QF2V9EzEobfKreUUl8UdJ_B-PXMJYq8a47RH3jd8ys8kMHGHYGU6Vy7z_wY5jE8QhmSS5DiZegd'),
        nic: s.nic || 'N/A',
        dob: s.dob || 'N/A',
        address: s.address || 'N/A',
        emergencyContact: s.emergencyContact || 'N/A',
        licenseType: s.licenseType || 'Manual (Class B)',
        vehiclePreference: s.vehiclePreference || 'Toyota Prius',
        package: s.package || 'Premium',
        progress: s.progress || 0
      }));

      if (prepared.length > 0) {
        setStudents(prepared);
      } else {
        setStudents(defaultStudents);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync selected student with active student details
  useEffect(() => {
    if (selectedStudent) {
      const updated = students.find(s => s.id === selectedStudent.id);
      if (updated) {
        setSelectedStudent(updated);
      }
    } else if (students.length > 0) {
      setSelectedStudent(students[0]);
    }
  }, [students, selectedStudent?.id]);

  // Add new student logic
  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    if (!newName || !newNic) return;

    const newStudentId = 'manual_' + Date.now();
    const newStudent = {
      name: newName,
      email: newEmail || 'no-email@email.com',
      role: 'student',
      status: newStatus.toLowerCase(),
      progress: newStatus.toLowerCase() === 'approved' ? 20 : 0,
      classesCompleted: 0,
      classesTotal: 18,
      lessonsScheduled: 0,
      outstandingFees: 15000,
      currentStep: 'Medical Check',
      nic: newNic,
      phone: newPhone || 'N/A',
      address: 'Colombo, Sri Lanka',
      emergencyContact: 'Family - ' + (newPhone || 'N/A'),
      licenseType: 'Manual (Class B)',
      vehiclePreference: 'Toyota Prius',
      package: newPackage,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', newStudentId), newStudent);
      setSelectedStudent({ id: newStudentId, ...newStudent });
      setPanelOpen(true);

      if (newStatus.toLowerCase() === 'approved') {
        setStudentSubTab('active');
      } else {
        setStudentSubTab('pending');
      }
    } catch (err) {
      console.error("Error creating student manual profile:", err);
    }

    // Reset Form & Close Modal
    setNewName('');
    setNewNic('');
    setNewEmail('');
    setNewPhone('');
    setNewPackage('Premium');
    setNewStatus('PENDING');
    setAddModalOpen(false);
  };

  // Quick Action: Approve
  const handleApprove = async (id) => {
    if (typeof id === 'string') {
      try {
        const studentRef = doc(db, 'users', id);
        await updateDoc(studentRef, {
          status: 'approved',
          approvedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Error approving student:", err);
      }
    } else {
      const updated = students.map(s => s.id === id ? { ...s, status: 'approved', approvedAt: new Date().toISOString() } : s);
      setStudents(updated);
    }
    // Switch to active tab to show the approved student!
    setStudentSubTab('active');
  };

  // Quick Action: Reject
  const handleReject = async (id) => {
    if (typeof id === 'string') {
      try {
        const studentRef = doc(db, 'users', id);
        await updateDoc(studentRef, {
          status: 'rejected'
        });
      } catch (err) {
        console.error("Error rejecting student:", err);
      }
    } else {
      const updated = students.map(s => s.id === id ? { ...s, status: 'rejected' } : s);
      setStudents(updated);
    }
  };

  // Action: Delete Student
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student profile?")) {
      if (typeof id === 'string') {
        try {
          const studentRef = doc(db, 'users', id);
          await deleteDoc(studentRef);
        } catch (err) {
          console.error("Error deleting student:", err);
        }
      } else {
        const updated = students.filter(s => s.id !== id);
        setStudents(updated);
      }
      setPanelOpen(false);
    }
  };

  // Filter & Search Logic based on current sub-tab
  const filteredStudents = students.filter(s => {
    const name = s.name || '';
    const email = s.email || '';
    const nic = s.nic || '';

    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nic.toLowerCase().includes(searchTerm.toLowerCase());

    const status = s.status ? s.status.toLowerCase() : 'pending';

    if (studentSubTab === 'pending') {
      return matchesSearch && status === 'pending';
    } else {
      return matchesSearch && status === 'approved';
    }
  });

  // Dynamic counts for pagination details matching static guidelines
  const pendingStudentsList = students.filter(s => (s.status ? s.status.toLowerCase() : 'pending') === 'pending');
  const activeStudentsList = students.filter(s => (s.status ? s.status.toLowerCase() : 'pending') === 'approved');

  const pendingCountText = `Showing 1-${pendingStudentsList.length} of ${16 + pendingStudentsList.length} pending students`;
  const activeCountText = `Showing 1-${activeStudentsList.length} of ${848 + activeStudentsList.length} active students`;

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
            zIndex: 45, display: 'block',
          }}
          className="admin-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: '#ffffff' }}>directions_car</span>
            </div>
            <div>
              <h1 style={{ margin: 0 }}>DriveAdmin</h1>
              <p>SaaS Management</p>
            </div>
          </div>
        </div>

        <nav className="admin-nav custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-link ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveNav(item.id);
                setSidebarOpen(false);
              }}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-link">
            <span className="material-symbols-outlined">help</span>
            <span>Support</span>
          </button>
          <button className="admin-nav-link" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        
        {/* ============================================================== */}
        {/* VIEW 1: STUDENT MANAGEMENT (Matches user's third request) */}
        {/* ============================================================== */}
        {activeNav === 'students' && (
          <div>
            {/* Top Navigation */}
            <header className="w-full h-16 bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center px-6 sticky top-0 z-40">
              <div className="flex items-center gap-4 flex-1">
                {/* Hamburger menu for mobile */}
                <button
                  className="admin-action-btn md:hidden"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  style={{ display: 'flex', marginRight: '0.5rem' }}
                >
                  <span className="material-symbols-outlined">menu</span>
                </button>
                <h2 className="admin-header-title">Student Management</h2>
                <div className="relative w-96 ml-8 hidden md:block">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">search</span>
                  <input 
                    className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant font-label-md text-label-md focus:border-primary focus:ring-0 transition-all outline-none" 
                    placeholder="Search by name, NIC, email..." 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <button className="material-symbols-outlined text-secondary hover:text-primary">notifications</button>
                <div className="flex items-center gap-3 border-l border-outline-variant pl-6">
                  <img 
                    alt="Administrator Profile" 
                    className="w-8 h-8 object-cover grayscale" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTcD9uQmva8KvoJqnqN5KSibuxKCp1tJpSmVOLsYB8oRj-ySPs0PDI8DezohlzD1IfZ95jyBVpawAok-gItsaJc2BtNSDSC9KdRBPdb-iQMJ4IXvNQa3mYgrdvDLamFwqUkD9I54u6JmnQex7mxb91KwNV0aheV1OqTjwM3SZc4QUEgI-k3jXaTh0KkcUAVPZ0W2e1vzPICMaEzlpCxW3UXQkMFM9ucAdy5BM0Uc2OEYORTZwb01jx9zl5hDAvpo5ZNx0WGmKkNg-8"
                  />
                  <span className="font-label-md text-label-md font-bold">Admin User</span>
                </div>
              </div>
            </header>

            {/* Dashboard Content */}
            <div className="p-6 max-w-container-max mx-auto">
              
              {/* Tabs & Filter Header */}
              <div className="flex justify-between items-end mb-8 border-b border-outline-variant">
                <div className="flex gap-8">
                  <button 
                    className={`pb-4 font-label-md text-label-md font-bold transition-all ${
                      studentSubTab === 'pending' ? 'tab-active' : 'text-secondary hover:text-primary'
                    }`}
                    onClick={() => setStudentSubTab('pending')}
                  >
                    Pending Students
                  </button>
                  <button 
                    className={`pb-4 font-label-md text-label-md font-bold transition-all ${
                      studentSubTab === 'active' ? 'tab-active' : 'text-secondary hover:text-primary'
                    }`}
                    onClick={() => setStudentSubTab('active')}
                  >
                    Active Students
                  </button>
                </div>
                
                <div className="flex gap-4 pb-3">
                  <div className="relative">
                    <select 
                      className="appearance-none bg-surface-variant border border-outline-variant px-6 py-2 pr-10 font-label-md text-label-md focus:border-primary focus:ring-0 outline-none"
                      value={activeFilterSelect}
                      onChange={(e) => setActiveFilterSelect(e.target.value)}
                    >
                      <option>All Filters</option>
                      <option>Registration Date</option>
                      <option>Program Type</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
                  </div>
                  <button 
                    className="bg-primary text-on-primary px-6 py-2 font-label-md text-label-md font-bold hover:bg-zinc-800 transition-all flex items-center gap-2"
                    onClick={() => setAddModalOpen(true)}
                  >
                    <span className="material-symbols-outlined text-sm">add</span> 
                    Add Student
                  </button>
                </div>
              </div>

              {/* Tab Content: Table */}
              <div className="bg-surface-variant border border-outline-variant">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-container-low">
                        <th className="text-left py-4 px-6 font-label-md text-label-md text-secondary uppercase tracking-wider">Name</th>
                        <th className="text-left py-4 px-6 font-label-md text-label-md text-secondary uppercase tracking-wider">Email</th>
                        <th className="text-left py-4 px-6 font-label-md text-label-md text-secondary uppercase tracking-wider">
                          {studentSubTab === 'pending' ? 'Registration Date' : 'NIC Number'}
                        </th>
                        <th className="text-left py-4 px-6 font-label-md text-label-md text-secondary uppercase tracking-wider">
                          {studentSubTab === 'pending' ? 'Status' : 'Package'}
                        </th>
                        <th className="text-right py-4 px-6 font-label-md text-label-md text-secondary uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <tr 
                            key={student.id} 
                            className="hover:bg-surface-container-low transition-colors group cursor-pointer"
                            onClick={() => {
                              setSelectedStudent(student);
                              setPanelOpen(true);
                            }}
                          >
                            {/* Name Col */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-surface-container flex items-center justify-center grayscale overflow-hidden">
                                  <img alt={student.name} className="object-cover w-full h-full" src={student.avatar}/>
                                </div>
                                <p className="font-label-md text-label-md font-bold text-primary">{student.name}</p>
                              </div>
                            </td>

                            {/* Email Col */}
                            <td className="py-4 px-6 font-label-md text-label-md">{student.email}</td>

                            {/* Reg Date or NIC Col */}
                            <td className="py-4 px-6 font-label-md text-label-md">
                              {studentSubTab === 'pending' ? student.regDate : student.nic}
                            </td>

                            {/* Status or Package Col */}
                            <td className="py-4 px-6">
                              {studentSubTab === 'pending' ? (
                                <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest bg-primary/5 px-2 py-1">
                                  Pending
                                </span>
                              ) : (
                                <span className={`font-label-sm text-label-sm px-3 py-1 uppercase ${
                                  student.package === 'Premium' ? 'bg-primary text-on-primary font-bold' : 
                                  'bg-surface-container text-primary border'
                                }`}>
                                  {student.package}
                                </span>
                              )}
                            </td>

                            {/* Actions Col */}
                            <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end items-center gap-3">
                                {student.status && student.status.toLowerCase() === 'pending' ? (
                                  <>
                                    <button 
                                      style={{ backgroundColor: '#0B2545' }}
                                      className="text-white px-4 py-1.5 font-label-md text-label-md font-bold hover:opacity-90 transition-all"
                                      onClick={() => handleApprove(student.id)}
                                    >
                                      Approve
                                    </button>
                                    <button 
                                      className="border border-outline-variant px-4 py-1.5 font-label-md text-label-md hover:border-primary transition-all bg-surface-variant"
                                      onClick={() => handleReject(student.id)}
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    className="text-primary font-bold font-label-md text-label-md hover:underline"
                                    onClick={() => {
                                      setSelectedStudent(student);
                                      setPanelOpen(true);
                                    }}
                                  >
                                    View Details
                                  </button>
                                )}
                                <button 
                                  className="material-symbols-outlined text-secondary hover:text-error text-xl ml-2"
                                  onClick={() => handleDelete(student.id)}
                                >
                                  delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-secondary font-label-md">
                            No students match your active filters or search terms.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="py-4 px-6 border-t border-outline-variant flex justify-between items-center bg-surface-container-low">
                  <p className="font-label-sm text-label-sm text-secondary">
                    {studentSubTab === 'pending' ? pendingCountText : activeCountText}
                  </p>
                  <div className="flex gap-2">
                    <button className="p-2 border border-outline-variant hover:bg-surface-variant transition-all material-symbols-outlined">chevron_left</button>
                    <button className="p-2 border border-primary bg-primary text-white font-label-md text-label-md px-4">1</button>
                    {studentSubTab === 'active' && (
                      <>
                        <button className="p-2 border border-outline-variant hover:bg-surface-variant transition-all font-label-md text-label-md px-4">2</button>
                        <button className="p-2 border border-outline-variant hover:bg-surface-variant transition-all font-label-md text-label-md px-4">3</button>
                      </>
                    )}
                    <button className="p-2 border border-outline-variant hover:bg-surface-variant transition-all material-symbols-outlined">chevron_right</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sliding Detail Side Panel */}
            <div className={`student-side-panel ${panelOpen ? '' : 'closed'}`}>
              {selectedStudent ? (
                <div className="p-8">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="font-headline-sm text-headline-sm font-bold text-primary">Student Details</h3>
                    <button 
                      className="material-symbols-outlined text-secondary hover:text-primary"
                      onClick={() => setPanelOpen(false)}
                    >
                      close
                    </button>
                  </div>

                  <div className="flex flex-col items-center mb-10">
                    <div className="w-32 h-32 bg-surface-container-high grayscale overflow-hidden mb-4">
                      <img 
                        alt={`${selectedStudent.name} Portrait`} 
                        className="w-full h-full object-cover" 
                        src={selectedStudent.avatar}
                      />
                    </div>
                    <h4 className="font-headline-sm text-headline-sm font-bold text-primary">{selectedStudent.name}</h4>
                    <span className={`px-4 py-1 text-[10px] font-bold uppercase tracking-widest mt-2 ${
                      selectedStudent.status && selectedStudent.status.toLowerCase() === 'approved' ? 'bg-brand-accent text-white' : 'bg-red-600 text-white'
                    }`}>
                      {selectedStudent.status && selectedStudent.status.toLowerCase() === 'approved' ? 'ACTIVE ENROLLMENT' : selectedStudent.status}
                    </span>
                  </div>

                  <div className="space-y-8">
                    <section>
                      <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest border-b border-outline-variant pb-2 mb-4">Personal Identification</p>
                      <div className="grid grid-cols-2 gap-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">NIC Number</p>
                          <p className="font-label-md text-label-md font-bold">{selectedStudent.nic}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Date of Birth</p>
                          <p className="font-label-md text-label-md font-bold">{selectedStudent.dob}</p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest border-b border-outline-variant pb-2 mb-4">Contact Information</p>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Email</p>
                          <p className="font-label-md text-label-md font-bold">{selectedStudent.email}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Residential Address</p>
                          <p className="font-label-md text-label-md font-bold">{selectedStudent.address}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Emergency Contact</p>
                          <p className="font-label-md text-label-md font-bold">{selectedStudent.emergencyContact}</p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest border-b border-outline-variant pb-2 mb-4">Program Progress</p>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">License Type</p>
                            <p className="font-label-md text-label-md font-bold">{selectedStudent.licenseType}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Vehicle Preference</p>
                            <p className="font-label-md text-label-md font-bold">{selectedStudent.vehiclePreference}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Selected Package</p>
                            <p className="font-label-md text-label-md font-bold">{selectedStudent.package}</p>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Training Progress</p>
                            <span className="font-label-md text-label-md font-bold">{selectedStudent.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-surface-container-high">
                            <div 
                              className="h-full bg-primary transition-all duration-500" 
                              style={{ width: `${selectedStudent.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="mt-12 flex gap-4">
                    {selectedStudent.status && selectedStudent.status.toLowerCase() === 'pending' ? (
                      <button 
                        style={{ backgroundColor: '#0B2545' }}
                        className="flex-1 text-white py-3 font-label-md text-label-md font-bold hover:opacity-90 transition-all"
                        onClick={() => handleApprove(selectedStudent.id)}
                      >
                        APPROVE STUDENT
                      </button>
                    ) : (
                      <button 
                        className="flex-1 bg-red-600 text-white py-3 font-label-md text-label-md font-bold hover:bg-red-700 transition-all"
                        onClick={() => handleReject(selectedStudent.id)}
                      >
                        REJECT / SUSPEND
                      </button>
                    )}
                    <button className="flex-1 border border-primary text-primary py-3 font-label-md text-label-md font-bold hover:bg-surface-container-low transition-all">
                      EDIT PROFILE
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-secondary font-label-md">
                  Click on a student row to inspect full details.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: MAIN DASHBOARD OVERVIEW */}
        {/* ============================================================== */}
        {activeNav === 'dashboard' && (
          <div>
            {/* Top Header */}
            <header className="admin-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  className="admin-action-btn"
                  style={{ display: 'none' }}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <span className="material-symbols-outlined">menu</span>
                </button>
                <h2 className="admin-header-title">Admin Dashboard</h2>
              </div>
              <div className="admin-header-actions">
                <div className="admin-header-icon">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <div className="admin-header-icon">
                  <span className="material-symbols-outlined">notifications</span>
                  <span className="admin-notification-dot"></span>
                </div>
                <div className="admin-profile">
                  <img
                    alt="Administrator Profile"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYzeBhgrCRwyx-67h6_El1UjebACgLgD25zK7qKbz_Av_zarlM0kDus_JargG10KZay8I-eIlYTElmgEtvXUeM3yUuyIbjlNRX9jnw8-LBdXx2wa9kg9QtSdWTvJ4VXi-rdzlSC0-NHz-LddoktUZK4OKV2c3HqibqkGWCYnso0mq89ZxJt9RbOHnxtAoHKgco6gdhQvjfOAB7b1o7SCY4giv56uYUnuXLu2J52Q37BZc-eXMFmtV7RVz35Ep_4aD_B0_8jElNiw7P"
                  />
                  <span className="admin-profile-name">Eranga Admin</span>
                </div>
              </div>
            </header>

            <div className="admin-content">
              {/* Stats Row */}
              <section className="admin-stats-grid">
                {dashboardStatsData.map((stat, index) => (
                  <div key={index} className="admin-stat-card admin-animate-in">
                    <div>
                      <p className="admin-stat-label">{stat.label}</p>
                      <h3 className="admin-stat-value font-bold">{stat.value}</h3>
                    </div>
                    <div className={`admin-stat-trend ${stat.type}`}>
                      <span className="material-symbols-outlined">{stat.icon}</span>
                      <span>{stat.trend}</span>
                    </div>
                  </div>
                ))}
              </section>

              {/* Main Grid: 8/4 split */}
              <div className="admin-grid">
                {/* Left Column */}
                <div className="admin-grid-left">
                  {/* New Registrations */}
                  <section className="admin-section admin-animate-in" style={{ animationDelay: '0.2s' }}>
                    <div className="admin-section-header">
                      <h4 className="admin-section-title">New Registrations</h4>
                      <button className="admin-section-link" onClick={() => setActiveNav('students')}>View All</button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {initialRegistrations.map((reg, index) => (
                            <tr key={index}>
                              <td>
                                <p className="admin-td-name">{reg.name}</p>
                                <p className="admin-td-sub">ID: {reg.id}</p>
                              </td>
                              <td>
                                <p className="admin-td-name">{reg.phone}</p>
                                <p className="admin-td-sub">{reg.email}</p>
                              </td>
                              <td>
                                <span className="admin-badge">{reg.status}</span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                  <button className="admin-btn-primary" onClick={() => alert("Approve request registered dynamically!")}>Approve</button>
                                  <button className="admin-btn-outline" onClick={() => alert("Registration request rejected.")}>Reject</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Upcoming Bookings */}
                  <section className="admin-section admin-animate-in" style={{ animationDelay: '0.3s' }}>
                    <div className="admin-section-header">
                      <h4 className="admin-section-title">Upcoming Bookings</h4>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Schedule</th>
                            <th>Vehicle</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {upcomingBookings.map((booking, index) => (
                            <tr key={index}>
                              <td>
                                <p className="admin-td-name">{booking.student}</p>
                              </td>
                              <td>
                                <p className="admin-td-name">{booking.date}</p>
                                <p className="admin-td-sub">{booking.time}</p>
                              </td>
                              <td>
                                <span className="admin-vehicle-badge">{booking.vehicle}</span>
                              </td>
                              <td>
                                <div className="admin-action-btns">
                                  <button className="admin-action-btn approve" onClick={() => alert("Booking Approved!")}>
                                    <span className="material-symbols-outlined">check_circle</span>
                                  </button>
                                  <button className="admin-action-btn reject" onClick={() => alert("Booking Cancelled.")}>
                                    <span className="material-symbols-outlined">cancel</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>

                {/* Right Column */}
                <div className="admin-grid-right">
                  {/* Packages */}
                  <section className="admin-section-padded admin-animate-in" style={{ animationDelay: '0.25s' }}>
                    <div className="admin-packages-header">
                      <h4 className="admin-section-title">Packages</h4>
                      <button className="admin-btn-icon">
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {packagesData.map((pkg, index) => (
                        <div key={index} className="admin-package-card">
                          <div className="admin-package-header">
                            <h5 className="admin-package-name">{pkg.name}</h5>
                            <span className="admin-package-price">{pkg.price}</span>
                          </div>
                          <p className="admin-package-desc">{pkg.desc}</p>
                          <div className="admin-package-icons">
                            {pkg.icons.map((icon, i) => (
                              <span key={i} className="material-symbols-outlined">{icon}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Fleet Status */}
                  <section className="admin-section-padded admin-animate-in" style={{ animationDelay: '0.35s' }}>
                    <h4 className="admin-section-title" style={{ marginBottom: '1.5rem' }}>Fleet Status</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {fleetData.map((fleet, index) => (
                        <div key={index} className="admin-fleet-item">
                          <div className="admin-fleet-icon">
                            <span className="material-symbols-outlined">{fleet.icon}</span>
                          </div>
                          <div className="admin-fleet-info">
                            <div className="admin-fleet-row">
                              <span>{fleet.name}</span>
                              <span className="admin-fleet-count">{fleet.count}</span>
                            </div>
                            <div className="admin-fleet-bar">
                              <div
                                className="admin-fleet-bar-fill"
                                style={{ width: `${fleet.fill}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Recent Payments */}
                  <section className="admin-section admin-animate-in" style={{ animationDelay: '0.4s' }}>
                    <div className="admin-section-header">
                      <h4 className="admin-section-title">Recent Payments</h4>
                    </div>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {recentPayments.map((payment, index) => (
                        <React.Fragment key={index}>
                          <div className="admin-payment-item">
                            <div>
                              <p className="admin-payment-name">{payment.name}</p>
                              <p className="admin-payment-pkg">{payment.pkg}</p>
                            </div>
                            <div>
                              <p className="admin-payment-amount">{payment.amount}</p>
                              <p className={`admin-payment-status ${payment.statusType}`}>
                                {payment.status}
                              </p>
                            </div>
                          </div>
                          {index < recentPayments.length - 1 && <hr className="admin-divider" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Tabs Placeholder */}
        {activeNav !== 'dashboard' && activeNav !== 'students' && (
          <div className="p-12 text-center">
            <h3 className="font-headline-md text-headline-md text-primary mb-4">
              {navItems.find(i => i.id === activeNav)?.label} Management
            </h3>
            <p className="text-secondary font-label-md">This view is currently scheduled for subsequent refinement cycles.</p>
            <button 
              className="mt-6 bg-primary text-on-primary px-6 py-2.5 font-label-md text-label-md font-bold"
              onClick={() => setActiveNav('students')}
            >
              Return to Student Management
            </button>
          </div>
        )}

        {/* Minimalist Background Decoration */}
        <div className="admin-bg-decoration">
          <span className="material-symbols-outlined">directions_car</span>
        </div>
      </main>

      {/* FAB */}
      <button 
        className="admin-fab" 
        title="Add New Student"
        onClick={() => setAddModalOpen(true)}
      >
        <span className="material-symbols-outlined">add</span>
      </button>

      {/* ============================================================== */}
      {/* ADD STUDENT MINIMALIST MODAL */}
      {/* ============================================================== */}
      {addModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-headline-sm text-headline-sm font-bold text-primary">Add New Student</h3>
              <button 
                className="material-symbols-outlined text-secondary hover:text-primary"
                onClick={() => setAddModalOpen(false)}
              >
                close
              </button>
            </div>
            
            <form onSubmit={handleAddStudentSubmit}>
              <div className="admin-form-group">
                <label className="admin-form-label">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Amal Wickrama"
                  className="admin-form-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">NIC Number</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 982345678V"
                  className="admin-form-input"
                  value={newNic}
                  onChange={(e) => setNewNic(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g. amal.w@email.com"
                  className="admin-form-input"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Phone Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. 077 123 4567"
                  className="admin-form-input"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="admin-form-group">
                  <label className="admin-form-label">Program Package</label>
                  <select 
                    className="admin-form-input appearance-none bg-surface-variant"
                    value={newPackage}
                    onChange={(e) => setNewPackage(e.target.value)}
                  >
                    <option>Premium</option>
                    <option>Enrolled</option>
                    <option>Not Enrolled</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Approval Status</label>
                  <select 
                    className="admin-form-input appearance-none bg-surface-variant"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option>PENDING</option>
                    <option>APPROVED</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-actions">
                <button 
                  type="button" 
                  className="admin-btn-outline" 
                  onClick={() => setAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="admin-btn-primary"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
