import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import {
  BarChart3, TrendingUp, Download, Users, Car, GraduationCap, DollarSign,
  CalendarClock, FileText, Filter, RefreshCw, ArrowUpRight, ArrowDownRight,
  PieChart as PieChartIcon, Activity
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import DatePicker from '../../components/ui/DatePicker';
import {
  getStudentMetrics, getInstructorMetrics, getVehicleMetrics,
  getPaymentMetrics, getScheduleMetrics
} from '../../utils/reportAggregations';
import './Reports.css';

// ─── Custom Recharts Tooltip ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
        padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontSize: 13, fontWeight: 600
      }}>
        <p style={{ color: '#9ca3af', fontSize: 11, marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || '#111' }}>
            {p.name}: <strong>{typeof p.value === 'number' && p.name?.toLowerCase().includes('revenue') 
              ? `Rs. ${p.value.toLocaleString()}` : p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, sub, color, bgColor, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="reports-kpi-card"
    >
      <div className="reports-kpi-icon" style={{ background: bgColor }}>
        <Icon size={18} style={{ color }} />
      </div>
      <span className="reports-kpi-label">{label}</span>
      <span className="reports-kpi-value">{value}</span>
      {sub && <span className="reports-kpi-sub">{sub}</span>}
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminReports() {
  // ── Data State ──
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── UI State ──
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    instructorId: '',
    vehicleId: '',
  });

  // ── Fetch all data with real-time updates ──
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubVehicles = onSnapshot(collection(db, 'vehicles'), snap => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(v => v.status !== 'deleted'));
    });

    const unsubSchedules = onSnapshot(collection(db, 'sessions'), snap => {
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Payments collection (may not exist yet)
    const unsubPayments = onSnapshot(collection(db, 'payments'), snap => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => setPayments([]));

    setLoading(false);

    return () => {
      unsubUsers();
      unsubVehicles();
      unsubSchedules();
      unsubPayments();
    };
  }, []);

  // ── Computed Metrics ──
  const studentMetrics = useMemo(() => getStudentMetrics(users, schedules, filters), [users, schedules, filters]);
  const instructorMetrics = useMemo(() => getInstructorMetrics(users, schedules, filters), [users, schedules, filters]);
  const vehicleMetrics = useMemo(() => getVehicleMetrics(vehicles, schedules, filters), [vehicles, schedules, filters]);
  const paymentMetrics = useMemo(() => getPaymentMetrics(payments, filters), [payments, filters]);
  const scheduleMetrics = useMemo(() => getScheduleMetrics(schedules, filters), [schedules, filters]);

  // ── Instructors list for filter dropdown ──
  const instructorsList = useMemo(() => users.filter(u => u.role === 'instructor'), [users]);

  // ── Export to PDF ──
  const handleExportPDF = useCallback(async () => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text('Driving School — Reports', 14, 22);
    pdf.setFontSize(10);
    pdf.setTextColor(128);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    // KPI Summary Table
    pdf.autoTable({
      startY: 38,
      head: [['Metric', 'Value']],
      body: [
        ['Total Students', String(studentMetrics.total)],
        ['Active Students', String(studentMetrics.active)],
        ['Total Instructors', String(instructorMetrics.total)],
        ['Total Vehicles', String(vehicleMetrics.total)],
        ['Active Vehicles', String(vehicleMetrics.active)],
        ['Total Sessions', String(scheduleMetrics.total)],
        ['Completed Sessions', String(scheduleMetrics.completed)],
        ['Cancelled Sessions', String(scheduleMetrics.cancelled)],
        ['Upcoming Sessions', String(scheduleMetrics.upcoming)],
        ['Total Revenue', `Rs. ${paymentMetrics.totalIncome.toLocaleString()}`],
        ['Pending Payments', `Rs. ${paymentMetrics.pendingAmount.toLocaleString()}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [11, 37, 69] },
    });

    // Schedules detail table
    if (scheduleMetrics.raw.length > 0) {
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.text('Schedule Details', 14, 22);
      pdf.autoTable({
        startY: 30,
        head: [['ID', 'Date', 'Time', 'Instructor', 'Vehicle', 'Students', 'Status']],
        body: scheduleMetrics.raw.slice(0, 50).map(s => [
          s.id, s.date, s.timeSlotLabel || '', s.instructorName || '', s.vehicleName || '',
          String(s.students?.length || 0), s.status
        ]),
        theme: 'striped',
        headStyles: { fillColor: [11, 37, 69] },
        styles: { fontSize: 8 },
      });
    }

    pdf.save('driving-school-report.pdf');
  }, [studentMetrics, instructorMetrics, vehicleMetrics, scheduleMetrics, paymentMetrics]);

  // ── Export to Excel ──
  const handleExportExcel = useCallback(async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // KPI Sheet
    const kpiData = [
      { Metric: 'Total Students', Value: studentMetrics.total },
      { Metric: 'Active Students', Value: studentMetrics.active },
      { Metric: 'Total Instructors', Value: instructorMetrics.total },
      { Metric: 'Total Vehicles', Value: vehicleMetrics.total },
      { Metric: 'Active Vehicles', Value: vehicleMetrics.active },
      { Metric: 'Total Sessions', Value: scheduleMetrics.total },
      { Metric: 'Completed Sessions', Value: scheduleMetrics.completed },
      { Metric: 'Total Revenue', Value: paymentMetrics.totalIncome },
      { Metric: 'Pending Payments', Value: paymentMetrics.pendingAmount },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiData), 'Summary');

    // Schedules Sheet
    if (scheduleMetrics.raw.length > 0) {
      const schedData = scheduleMetrics.raw.map(s => ({
        ID: s.id, Date: s.date, Time: s.timeSlotLabel || '',
        Instructor: s.instructorName || '', Vehicle: s.vehicleName || '',
        Students: s.students?.length || 0, Status: s.status
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(schedData), 'Schedules');
    }

    // Vehicles Sheet
    if (vehicleMetrics.raw.length > 0) {
      const vehData = vehicleMetrics.raw.map(v => ({
        ID: v.id, Name: v.name || '', NumberPlate: v.numberPlate || '',
        Type: v.type || '', Status: v.status || ''
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vehData), 'Vehicles');
    }

    XLSX.writeFile(wb, 'driving-school-report.xlsx');
  }, [studentMetrics, instructorMetrics, vehicleMetrics, scheduleMetrics, paymentMetrics]);

  // ── Clear Filters ──
  const clearFilters = () => setFilters({ startDate: '', endDate: '', instructorId: '', vehicleId: '' });

  // ── Tabs ──
  const TABS = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'students', label: 'Students', icon: GraduationCap },
    { key: 'instructors', label: 'Instructors', icon: Users },
    { key: 'vehicles', label: 'Vehicles', icon: Car },
    { key: 'schedules', label: 'Schedules', icon: CalendarClock },
  ];

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7'];

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="reports-loading">
        <div className="reports-spinner" />
        <p style={{ color: '#9ca3af', fontWeight: 600, fontSize: 14 }}>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="reports-page">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Centralized insights for your driving school performance.</p>
        </div>
      </motion.div>

      {/* ── Filters Bar ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="reports-filters-bar">
        <Filter size={16} style={{ color: '#9ca3af' }} />

        <div className="reports-filter-group">
          <label>From</label>
          <DatePicker value={filters.startDate} onChange={val => setFilters(f => ({ ...f, startDate: val }))} placeholder="Start Date" minYear={2020} maxYear={2035} />
        </div>

        <div className="reports-filter-group">
          <label>To</label>
          <DatePicker value={filters.endDate} onChange={val => setFilters(f => ({ ...f, endDate: val }))} placeholder="End Date" minYear={2020} maxYear={2035} />
        </div>

        <div className="reports-filter-group">
          <label>Instructor</label>
          <select value={filters.instructorId} onChange={e => setFilters(f => ({ ...f, instructorId: e.target.value }))}>
            <option value="">All</option>
            {instructorsList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>

        <div className="reports-filter-group">
          <label>Vehicle</label>
          <select value={filters.vehicleId} onChange={e => setFilters(f => ({ ...f, vehicleId: e.target.value }))}>
            <option value="">All</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.name || v.numberPlate}</option>)}
          </select>
        </div>

        <button className="reports-export-btn" onClick={clearFilters} title="Clear Filters">
          <RefreshCw size={14} /> Clear
        </button>

        <div className="spacer" />

        <button className="reports-export-btn pdf" onClick={handleExportPDF}>
          <Download size={14} /> PDF
        </button>
        <button className="reports-export-btn excel" onClick={handleExportExcel}>
          <Download size={14} /> Excel
        </button>
      </motion.div>

      {/* ── KPI Cards ── */}
      <div className="reports-kpi-grid">
        <KPICard icon={GraduationCap} label="Total Students" value={studentMetrics.total}
          sub={`${studentMetrics.active} active`} color="#2563eb" bgColor="#eff6ff" delay={0.08} />
        <KPICard icon={Users} label="Instructors" value={instructorMetrics.total}
          color="#7c3aed" bgColor="#f5f3ff" delay={0.1} />
        <KPICard icon={Car} label="Vehicles" value={vehicleMetrics.total}
          sub={`${vehicleMetrics.active} active`} color="#059669" bgColor="#ecfdf5" delay={0.12} />
        <KPICard icon={CalendarClock} label="Sessions" value={scheduleMetrics.total}
          sub={`${scheduleMetrics.completed} completed • ${scheduleMetrics.upcoming} upcoming`}
          color="#d97706" bgColor="#fffbeb" delay={0.14} />
        <KPICard icon={DollarSign} label="Total Revenue" value={`Rs. ${paymentMetrics.totalIncome.toLocaleString()}`}
          sub={paymentMetrics.pendingAmount > 0 ? `Rs. ${paymentMetrics.pendingAmount.toLocaleString()} pending` : 'No pending'}
          color="#dc2626" bgColor="#fef2f2" delay={0.16} />
        <KPICard icon={Activity} label="Cancelled" value={scheduleMetrics.cancelled}
          sub="sessions cancelled" color="#6b7280" bgColor="#f3f4f6" delay={0.18} />
      </div>

      {/* ── Tab Bar ── */}
      <div className="reports-tab-bar">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`reports-tab-btn ${activeTab === tab.key ? 'active' : ''}`}>
            <tab.icon size={14} style={{ marginRight: 5, verticalAlign: -2 }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Charts & Tables based on active tab ── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }}>

          {/* ═══ OVERVIEW TAB ═══ */}
          {activeTab === 'overview' && (
            <div className="reports-charts-grid">
              {/* Student Growth Chart */}
              <div className="reports-chart-card">
                <div className="reports-chart-title">
                  <TrendingUp size={16} style={{ color: '#2563eb' }} />
                  Student Registrations
                  <span className="badge">Last 6 months</span>
                </div>
                {studentMetrics.growthChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={studentMetrics.growthChartData}>
                      <defs>
                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="students" stroke="#2563eb" strokeWidth={2.5}
                        fill="url(#colorStudents)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#d1d5db', padding: '3rem 0' }}>
                    <GraduationCap size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ fontSize: 13 }}>No student registration data yet.</p>
                  </div>
                )}
              </div>

              {/* Instructor Workload */}
              <div className="reports-chart-card">
                <div className="reports-chart-title">
                  <BarChart3 size={16} style={{ color: '#7c3aed' }} />
                  Instructor Workload
                  <span className="badge">Top 5</span>
                </div>
                {instructorMetrics.workloadChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={instructorMetrics.workloadChartData} layout="vertical" barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="sessions" fill="#7c3aed" radius={[0, 6, 6, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#d1d5db', padding: '3rem 0' }}>
                    <Users size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ fontSize: 13 }}>No session data for instructors yet.</p>
                  </div>
                )}
              </div>

              {/* Vehicle Usage Pie */}
              <div className="reports-chart-card">
                <div className="reports-chart-title">
                  <PieChartIcon size={16} style={{ color: '#059669' }} />
                  Vehicle Type Usage
                </div>
                {vehicleMetrics.usageChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={vehicleMetrics.usageChartData} cx="50%" cy="50%"
                        innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: '#d1d5db' }}>
                        {vehicleMetrics.usageChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#d1d5db', padding: '3rem 0' }}>
                    <Car size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ fontSize: 13 }}>No vehicle usage data yet.</p>
                  </div>
                )}
              </div>

              {/* Revenue Chart */}
              <div className="reports-chart-card">
                <div className="reports-chart-title">
                  <DollarSign size={16} style={{ color: '#dc2626' }} />
                  Monthly Revenue
                  <span className="badge">Last 6 months</span>
                </div>
                {paymentMetrics.revenueChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={paymentMetrics.revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" fill="#dc2626" radius={[6, 6, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#d1d5db', padding: '3rem 0' }}>
                    <DollarSign size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ fontSize: 13 }}>No payment data recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ STUDENTS TAB ═══ */}
          {activeTab === 'students' && (
            <div className="reports-table-section">
              <div className="reports-table-header">
                <h3>Student Records</h3>
                <span>{studentMetrics.raw.length} records</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentMetrics.raw.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No student records found.</td></tr>
                    ) : (
                      studentMetrics.raw.map(s => (
                        <tr key={s.id}>
                          <td className="mono">{s.id}</td>
                          <td style={{ fontWeight: 600 }}>{s.name || '—'}</td>
                          <td>{s.email || '—'}</td>
                          <td>{s.phone || '—'}</td>
                          <td><span className={`reports-badge ${s.status || ''}`}>{s.status || '—'}</span></td>
                          <td>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ INSTRUCTORS TAB ═══ */}
          {activeTab === 'instructors' && (
            <>
              <div className="reports-charts-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="reports-chart-card">
                  <div className="reports-chart-title">
                    <BarChart3 size={16} style={{ color: '#7c3aed' }} />
                    Sessions per Instructor
                  </div>
                  {instructorMetrics.workloadChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={instructorMetrics.workloadChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="sessions" fill="#7c3aed" radius={[6, 6, 0, 0]} barSize={35} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#d1d5db', padding: '3rem 0' }}>
                      <p style={{ fontSize: 13 }}>No session data yet.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="reports-table-section">
                <div className="reports-table-header">
                  <h3>Instructor Records</h3>
                  <span>{instructorMetrics.raw.length} records</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>License</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {instructorMetrics.raw.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No instructor records found.</td></tr>
                      ) : (
                        instructorMetrics.raw.map(i => (
                          <tr key={i.id}>
                            <td className="mono">{i.id}</td>
                            <td style={{ fontWeight: 600 }}>{i.name || '—'}</td>
                            <td>{i.email || '—'}</td>
                            <td>{i.phone || '—'}</td>
                            <td>{i.licenseNumber || '—'}</td>
                            <td><span className={`reports-badge ${i.status || ''}`}>{i.status || '—'}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ═══ VEHICLES TAB ═══ */}
          {activeTab === 'vehicles' && (
            <>
              <div className="reports-charts-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="reports-chart-card">
                  <div className="reports-chart-title">
                    <PieChartIcon size={16} style={{ color: '#059669' }} />
                    Vehicle Type Distribution
                  </div>
                  {vehicleMetrics.usageChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={vehicleMetrics.usageChartData} cx="50%" cy="50%"
                          innerRadius={50} outerRadius={95} paddingAngle={3} dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}>
                          {vehicleMetrics.usageChartData.map((entry, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#d1d5db', padding: '3rem 0' }}>
                      <p style={{ fontSize: 13 }}>No vehicle usage data yet.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="reports-table-section">
                <div className="reports-table-header">
                  <h3>Vehicle Records</h3>
                  <span>{vehicleMetrics.raw.length} records</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Number Plate</th>
                        <th>Type</th>
                        <th>Transmission</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicleMetrics.raw.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No vehicle records found.</td></tr>
                      ) : (
                        vehicleMetrics.raw.map(v => (
                          <tr key={v.id}>
                            <td className="mono">{v.id}</td>
                            <td style={{ fontWeight: 600 }}>{v.name || '—'}</td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{v.numberPlate || '—'}</td>
                            <td>{v.type || '—'}</td>
                            <td>{v.transmission || '—'}</td>
                            <td><span className={`reports-badge ${v.status || ''}`}>{v.status || '—'}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ═══ SCHEDULES TAB ═══ */}
          {activeTab === 'schedules' && (
            <div className="reports-table-section">
              <div className="reports-table-header">
                <h3>Schedule Records</h3>
                <span>{scheduleMetrics.raw.length} records</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date</th>
                      <th>Time Slot</th>
                      <th>Level</th>
                      <th>Instructor</th>
                      <th>Vehicle</th>
                      <th>Students</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleMetrics.raw.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No schedule records found.</td></tr>
                    ) : (
                      scheduleMetrics.raw.map(s => (
                        <tr key={s.id}>
                          <td className="mono">{s.id}</td>
                          <td style={{ fontWeight: 600 }}>{s.date || '—'}</td>
                          <td>{s.timeSlotLabel || '—'}</td>
                          <td>{s.trainingLevelLabel || '—'}</td>
                          <td>{s.instructorName || '—'}</td>
                          <td>{s.vehicleName || '—'}</td>
                          <td style={{ fontWeight: 700 }}>{s.students?.length || 0}</td>
                          <td><span className={`reports-badge ${s.status || ''}`}>{s.status || '—'}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
