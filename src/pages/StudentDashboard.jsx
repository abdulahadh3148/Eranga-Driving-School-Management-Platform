/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
  collection, query, where, onSnapshot, addDoc, doc, updateDoc, getDocs
} from "firebase/firestore";
import { storage } from "../firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getMockTest, ROAD_SIGNS } from "../utils/mockTestData";
import LearnerProgressDashboard from "../components/LearnerProgressDashboard";
import SetupWizard from "./student/SetupWizard";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// ── DMT Steps ─────────────────────────────────────────────────────────────────
const DMT_STEPS = [
  { key: "medical",     label: "Medical Cert",     icon: "🏥", val: 14, hint: "RMV registered doctor · Form B · ~Rs. 700" },
  { key: "application", label: "DMT Application",  icon: "📋", val: 28, hint: "Form A + NIC + photos · Rs. 1,500 at DMT" },
  { key: "theory",      label: "Theory Exam",       icon: "📝", val: 43, hint: "30 MCQ · Pass: 23/30 · Book via DMT e-services" },
  { key: "permit",      label: "Learner's Permit",  icon: "🪪", val: 57, hint: "Valid 3 months · L-board required on vehicle" },
  { key: "training",    label: "Road Training",     icon: "🚗", val: 71, hint: "Min. 3 months practical with instructor" },
  { key: "road_test",   label: "DMT Road Test",     icon: "🛣️", val: 86, hint: "Circuit test by DMT examiner" },
  { key: "license",     label: "License Issued",    icon: "🏆", val: 100, hint: "Printed & dispatched by DMT · 2–3 weeks" },
];

const LICENSE_LABELS = {
  B_manual: "Class B — Manual",
  B_auto: "Class B — Auto",
  A_motor: "Class A — Motorbike",
  AB_dual: "Class A+B — Dual",
  C_lorry: "Class C — Lorry",
  G_three_wheel: "Class G — Three-Wheeler",
};

const VEHICLE_LABELS = {
  toyota_axio: "Toyota Axio",
  suzuki_alto: "Suzuki Alto",
  suzuki_swift: "Suzuki Swift",
  toyota_aqua: "Toyota Aqua",
  honda_cb: "Honda CB 125R",
  bajaj_tuk: "Bajaj RE",
};

const SKILLS_DEFAULT = [
  { name: "Clutch Control", level: 0 },
  { name: "Gear Control", level: 0 },
  { name: "Reverse", level: 0 },
  { name: "Road Rules", level: 0 },
  { name: "Stopping", level: 0 },
  { name: "Bike 8", level: 0 },
];

const TIME_SLOTS = [
  "07:00 AM - 08:00 AM",
  "08:00 AM - 09:00 AM",
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "14:00 PM - 15:00 PM",
  "15:00 PM - 16:00 PM",
];

const FALLBACK_PACKAGES = [
  { id: "pkg1", name: "Basic Course", price: 15000, duration: "4 Weeks", vehicleType: "Car", features: ["Theory Classes", "10 Practical Lessons", "Exam Prep"], isActive: true },
  { id: "pkg2", name: "Standard Course", price: 25000, duration: "6 Weeks", vehicleType: "Car", features: ["Theory Classes", "18 Practical Lessons", "Exam Prep", "Vehicle for Test"], popular: true, isActive: true },
  { id: "pkg3", name: "Premium Course", price: 40000, duration: "8 Weeks", vehicleType: "Car + Highway", features: ["Theory Classes", "25 Practical Lessons", "Exam Prep", "Vehicle for Test", "Highway Driving"], isActive: true },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(ds) {
  try {
    const d = new Date(ds);
    return { day: d.getDate(), month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(), weekday: d.toLocaleString("en-US", { weekday: "short" }) };
  } catch { return { day: "--", month: "---", weekday: "---" }; }
}
function fmtLKR(n) { return "Rs. " + Number(n || 0).toLocaleString("en-LK"); }

// ── Nav links ─────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Dashboard",       path: "/student",               icon: "▦" },
  { label: "My Profile",      path: "/student/profile",       icon: "◉" },
  { label: "Book Session",    path: "/student/book",           icon: "＋" },
  { label: "My Bookings",     path: "/student/bookings",       icon: "◷" },
  { label: "Make Payment",    path: "/student/payment",        icon: "◎" },
  { label: "Mock Test",       path: "/student/mock-test",      icon: "✍" },
  { label: "Progress",        path: "/student/progress",       icon: "▲" },
  { label: "Notifications",   path: "/student/notifications",  icon: "◌" },
];

// ── Map path to label ────────────────────────────────────────────────────────
function pathToLabel(pathname) {
  const match = NAV_LINKS.find(l => l.path === pathname);
  if (match) return match.label;
  if (pathname.startsWith("/student/enroll") || pathname.startsWith("/student/packages")) return "Book Session";
  if (pathname.startsWith("/student/payment-history")) return "Make Payment";
  if (pathname.startsWith("/student/edit-profile")) return "My Profile";
  if (pathname.startsWith("/student/mock-test")) return "Mock Test";
  return "Dashboard";
}

// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════════════════════
const css = {
  root: { display: "flex", minHeight: "100vh", background: "#F1F4F9", fontFamily: "var(--font-body)", color: "#111c2d" },
  sidebar: { width: 220, background: "#f0f3ff", borderRight: "1px solid #dee2e6", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 200, transition: "transform 0.25s ease" },
  sidebarLogo: { display: "flex", alignItems: "center", gap: 12, padding: "24px 20px 20px", borderBottom: "1px solid #dee2e6" },
  logoMark: { width: 36, height: 36, background: "#0B2545", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, color: "#ffffff", flexShrink: 0 },
  logoName: { fontSize: 13, fontWeight: 900, color: "#111c2d", letterSpacing: "0.06em" },
  logoSub: { fontSize: 8, fontWeight: 700, color: "#737686", letterSpacing: "0.14em", marginTop: 2 },
  sideNav: { flex: 1, overflowY: "auto", padding: "12px 0" },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", width: "100%", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", position: "relative", textAlign: "left" },
  navItemActive: { background: "#e7eeff" },
  navIcon: { fontSize: 14, width: 20, textAlign: "center", color: "#737686", flexShrink: 0 },
  navLabel: { fontSize: 12, fontWeight: 600, color: "#505f76", letterSpacing: "0.02em" },
  navActiveBar: { position: "absolute", right: 0, top: "20%", bottom: "20%", width: 3, background: "#0B2545" },
  badge: { marginLeft: "auto", background: "#16335a", color: "#fff", fontSize: 9, fontWeight: 800, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  sidebarFooter: { padding: "16px 20px", borderTop: "1px solid #dee2e6" },
  avatarRow: { display: "flex", gap: 10, alignItems: "center", marginBottom: 12 },
  avatar: { width: 36, height: 36, borderRadius: "50%", background: "#0B2545", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#ffffff", flexShrink: 0 },
  logoutBtn: { width: "100%", padding: "8px", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent", border: "1px solid #dee2e6", color: "#737686", cursor: "pointer", fontFamily: "inherit" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 190 },
  mainWrap: { marginLeft: 220, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" },
  topbar: { height: 56, background: "#f0f3ff", borderBottom: "1px solid #dee2e6", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 },
  hamburger: { background: "none", border: "none", color: "#505f76", fontSize: 20, cursor: "pointer", display: "none", fontFamily: "inherit", padding: 4 },
  notifBtn: { position: "relative", background: "none", border: "none", color: "#505f76", fontSize: 18, cursor: "pointer", padding: 4 },
  notifDot: { position: "absolute", top: -2, right: -2, width: 16, height: 16, background: "#16335a", borderRadius: "50%", fontSize: 8, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
  main: { flex: 1, padding: "28px 28px 40px", overflowY: "auto" },
  fadeIn: { transition: "opacity 0.4s ease" },
  welcomeStrip: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, paddingBottom: 24, borderBottom: "1px solid #dee2e6" },
  eyebrow: { fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#0B2545", display: "block", marginBottom: 8 },
  welcomeTitle: { fontSize: "clamp(22px,3.5vw,32px)", fontWeight: 900, color: "#111c2d", margin: 0, letterSpacing: "-0.02em" },
  welcomeSub: { fontSize: 13, color: "#737686", margin: "6px 0 0" },
  stepAlert: { background: "#ffffff", border: "1px solid #dee2e6", borderLeft: "3px solid #0B2545", padding: "20px 24px", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" },
  progressCircle: { position: "relative", flexShrink: 0 },
  progressCircleLabel: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#111c2d" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 },
  statCard: { background: "#ffffff", border: "1px solid #dee2e6", padding: "20px", display: "flex", flexDirection: "column", gap: 12 },
  card: { background: "#ffffff", border: "1px solid #dee2e6", padding: "24px" },
  twoCol: { display: "grid", gridTemplateColumns: "minmax(0,3fr) minmax(0,2fr)", gap: 20, alignItems: "start" },
  dateBox: { width: 44, height: 52, background: "#dee2e6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  dateBoxMonth: { fontSize: 8, fontWeight: 800, textTransform: "uppercase", color: "#505f76", letterSpacing: "0.08em" },
  dateBoxDay: { fontSize: 18, fontWeight: 900, color: "#111c2d", lineHeight: 1.1 },
  ghostBtn: { background: "transparent", border: "1px solid #dee2e6", color: "#737686", padding: "10px 20px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" },
  amberActionBtn: { background: "rgba(0,0,0,0.2)", border: "1px solid rgba(0,0,0,0.3)", color: "#ffffff", padding: "10px 16px", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", textAlign: "left" },
  primaryBtn: { padding: "12px 28px", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", background: "#0B2545", color: "#ffffff", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" },
  formLabel: { display: "block", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#737686", marginBottom: 8 },
  formInput: { width: "100%", padding: "10px 14px", fontSize: 13, fontWeight: 600, background: "#dee2e6", border: "1px solid #dee2e6", color: "#111c2d", fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
  alertError: { display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "#fef2f2", border: "1px solid #ba1a1a", color: "#ba1a1a", fontSize: 13, fontWeight: 600, marginTop: 16 },
  alertSuccess: { display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "#f0fdf4", border: "1px solid #16a34a", color: "#16a34a", fontSize: 13, fontWeight: 600, marginTop: 16 },
  pkgBadgeGreen: { fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", background: "#16a34a", color: "#16a34a", padding: "6px 14px", marginBottom: 16, display: "inline-block", width: "fit-content" },
  pkgBadgeAmber: { fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", background: "#e7eeff", color: "#0B2545", padding: "6px 14px", marginBottom: 16, display: "inline-block", width: "fit-content" },
  td: { padding: "12px 16px", fontSize: 12, color: "#505f76" },
};

const GLOBAL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F1F4F9; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #f0f3ff; }
  ::-webkit-scrollbar-thumb { background: #dee2e6; border-radius: 2px; }
  .nav-item:hover { background: #e7eeff !important; }
  .nav-item:hover span[style*="color:#505f76"] { color: #111c2d !important; }
  .nav-item:hover span[style*="color:#737686"] { color: #505f76 !important; }
  .ghost-btn:hover { background: #dee2e6 !important; color: #111c2d !important; border-color: #c3c6d7 !important; }
  .accent-btn:hover { background: #2563eb !important; }
  .amber-action-btn:hover { background: rgba(0,0,0,0.4) !important; }
  .logout-btn:hover { border-color: #16335a !important; color: #ba1a1a !important; }
  select { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236b6460'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 10px center; background-size: 16px; padding-right: 32px !important; }
  select option { background: #dee2e6; color: #111c2d; }
  input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
  @media (max-width: 900px) {
    aside { transform: translateX(-100%) !important; }
    aside[style*="translateX(0)"] { transform: translateX(0) !important; }
    div[style*="marginLeft:220"] { margin-left: 0 !important; }
    button[style*="display:none"] { display: flex !important; }
    div[style*="minWidth:560"] { min-width: 480px; }
  }
  @media (max-width: 680px) {
    div[style*="gridTemplateColumns:minmax(0,3fr)"] { grid-template-columns: 1fr !important; }
    div[style*="gridTemplateColumns:repeat(auto-fit,minmax(160px"] { grid-template-columns: repeat(2,1fr) !important; }
  }
`;


export default function StudentDashboard() {
  const { currentUser, userProfile, setUserProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const activePage = pathToLabel(location.pathname);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ── Firestore state ──
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [packages, setPackages] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [skills, setSkills] = useState(SKILLS_DEFAULT);
  const [mockResults, setMockResults] = useState([]);
  const [studentSchedules, setStudentSchedules] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const displayPackages = packages.length > 0 ? packages : FALLBACK_PACKAGES;
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
  
  // Calculate outstanding fees based on total_price saved during setup
  const totalCourseFee = userProfile?.total_price || 0;
  const calculatedOutstandingFees = userProfile?.setup_completed 
    ? Math.max(0, totalCourseFee - totalPaid) 
    : (userProfile?.outstandingFees || 0);

  // ── Build user object from auth profile ──
  const user = {
    id: userProfile?.id || "",
    name: userProfile?.name || currentUser?.displayName || "Student",
    email: userProfile?.email || currentUser?.email || "",
    nic: userProfile?.nic || "",
    dob: userProfile?.dob || "",
    gender: userProfile?.gender || "",
    district: userProfile?.district || "",
    dmtOffice: userProfile?.dmtOffice || "Colombo",
    address: userProfile?.address || "",
    emergencyContact: userProfile?.emergencyContact || "",
    licenseType: userProfile?.licenseType || "B_manual",
    vehiclePreference: userProfile?.vehiclePreference || "toyota_axio",
    enrolledPackage: userProfile?.packageId || userProfile?.enrolledPackage || "None",
    progress: userProfile?.progress || 0,
    classesCompleted: userProfile?.classesCompleted || 0,
    classesTotal: userProfile?.classesTotal || 14,
    lessonsScheduled: userProfile?.lessonsScheduled || 0,
    outstandingFees: calculatedOutstandingFees,
    currentStep: userProfile?.currentStep || "medical",
    hasSubmittedApplication: userProfile?.hasSubmittedApplication || false,
    status: userProfile?.status || "pending",
    notifications: notifications.filter(n => n.unread !== false).length,
    phone: userProfile?.phone || "",
  };

  // ── Firestore listeners ──
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubs = [];
    let loadCounter = 0;
    const checkDone = () => { loadCounter++; if (loadCounter >= 6) setDataLoading(false); };

    // Sessions (formerly bookings)
    try {
      const bQ = query(collection(db, "sessions"), where("studentId", "==", currentUser.uid));
      unsubs.push(onSnapshot(bQ, snap => {
        setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        checkDone();
      }, () => checkDone()));
    } catch { checkDone(); }

    // Auto-generated student schedules
    try {
      const schQ = query(collection(db, "student_schedules"), where("studentId", "==", currentUser.uid));
      unsubs.push(onSnapshot(schQ, snap => {
        setStudentSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        checkDone();
      }, () => checkDone()));
    } catch { checkDone(); }

    // Payments
    try {
      const pQ = query(collection(db, "payments"), where("studentId", "==", currentUser.uid));
      unsubs.push(onSnapshot(pQ, snap => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        checkDone();
      }, () => checkDone()));
    } catch { checkDone(); }

    // Notifications
    try {
      const nQ = query(collection(db, "notifications"), where("studentId", "==", currentUser.uid));
      unsubs.push(onSnapshot(nQ, snap => {
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        checkDone();
      }, () => checkDone()));
    } catch { checkDone(); }

    // Packages
    try {
      const pkQ = query(collection(db, "packages"), where("isActive", "==", true));
      unsubs.push(onSnapshot(pkQ, snap => {
        setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        checkDone();
      }, () => checkDone()));
    } catch { checkDone(); }

    // Mock Test Results
    try {
      const mrQ = query(collection(db, "mock_test_results"), where("studentId", "==", currentUser.uid));
      unsubs.push(onSnapshot(mrQ, snap => {
        setMockResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        checkDone();
      }, () => checkDone()));
    } catch { checkDone(); }

    // Instructors (one-time)
    (async () => {
      try {
        const iQ = query(collection(db, "users"), where("role", "==", "instructor"));
        const snap = await getDocs(iQ);
        setInstructors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Failed to load instructors", e);
      }
    })();

    // Skills (if stored)
    if (userProfile?.skills) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSkills(userProfile.skills);
    }

    return () => unsubs.forEach(u => u());
  }, [currentUser?.uid]);

  // ── Derived data ──
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const allBookingsData = [...bookings, ...studentSchedules];
  const allBookings = allBookingsData.sort((a, b) => new Date(a?.date || 0) - new Date(b?.date || 0));
  const upcoming = allBookings.filter(b => new Date(b?.date || 0) >= today && b?.status !== "completed").sort((a, b) => new Date(a?.date || 0) - new Date(b?.date || 0));
  const past = allBookings.filter(b => new Date(b?.date || 0) < today || b?.status === "completed").sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0));
  const progress = user?.progress || 0;
  const currentStep = DMT_STEPS.find(s => progress < s.val) || DMT_STEPS[DMT_STEPS.length - 1];
  const nextStep = DMT_STEPS[DMT_STEPS.indexOf(currentStep) + 1] || null;

  const handleLogout = async () => {
    try { await logout(); navigate("/login", { replace: true }); } catch (err) { console.error(err); }
  };

  const goTo = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  if (userProfile && userProfile.setup_completed === false) {
    return <SetupWizard />;
  }

  return (
    <div style={css.root}>
      <style>{GLOBAL_CSS}</style>

      {/* ── Sidebar ── */}
      <aside style={{ ...css.sidebar, transform: sidebarOpen || window.innerWidth > 900 ? "translateX(0)" : "translateX(-100%)" }}>
        <div style={css.sidebarLogo}>
          <div style={css.logoMark}>E</div>
          <div>
            <div style={css.logoName}>ERANGA</div>
            <div style={css.logoSub}>DRIVING SCHOOL</div>
          </div>
        </div>

        <nav style={css.sideNav}>
          {NAV_LINKS.map(link => {
            const active = activePage === link.label;
            return (
              <button
                key={link.label}
                onClick={() => goTo(link.path)}
                style={{ ...css.navItem, ...(active ? css.navItemActive : {}) }}
                className="nav-item"
              >
                <span style={css.navIcon}>{link.icon}</span>
                <span style={css.navLabel}>{link.label}</span>
                {link.label === "Notifications" && user.notifications > 0 && (
                  <span style={css.badge}>{user.notifications}</span>
                )}
                {active && <span style={css.navActiveBar} />}
              </button>
            );
          })}
        </nav>

        <div style={css.sidebarFooter}>
          <div style={css.avatarRow}>
            <div style={css.avatar}>{user.name.charAt(0)}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#111c2d" }}>{user.name.split(" ")[0]}</div>
              <div style={{ fontSize: 10, color: "#505f76", marginTop: 2 }}>{user.enrolledPackage} Package</div>
            </div>
          </div>
          <button onClick={handleLogout} style={css.logoutBtn} className="logout-btn">Logout</button>
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && <div style={css.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ── */}
      <div style={css.mainWrap}>
        {/* Topbar */}
        <header style={css.topbar}>
          <button style={css.hamburger} onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111c2d", letterSpacing: "0.04em" }}>
            {activePage}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={() => goTo("/student/notifications")} style={css.notifBtn}>
              ◌
              {user.notifications > 0 && <span style={css.notifDot}>{user.notifications}</span>}
            </button>
            <div style={css.avatar}>{user.name.charAt(0)}</div>
          </div>
        </header>

        {/* Page content */}
        <main style={css.main}>
          <div style={{ ...css.fadeIn, opacity: mounted ? 1 : 0 }}>
            {activePage === "Dashboard" && (
              <DashboardPage
                user={user}
                userProfile={userProfile}
                upcoming={upcoming}
                past={past}
                currentStep={currentStep}
                nextStep={nextStep}
                goTo={goTo}
                skills={skills}
                mockResults={mockResults}
              />
            )}
            {activePage === "My Profile" && <ProfilePage user={user} currentUser={currentUser} userProfile={userProfile} setUserProfile={setUserProfile} goTo={goTo} packages={displayPackages} totalPaid={totalPaid} />}
            {activePage === "Book Session" && (
              <BookSessionPage packages={displayPackages} user={user} currentUser={currentUser} userProfile={userProfile} setUserProfile={setUserProfile} instructors={instructors} goTo={goTo} totalPaid={totalPaid} />
            )}
            {activePage === "My Bookings" && <BookingsPage upcoming={upcoming} past={past} instructors={instructors} />}
            {activePage === "Make Payment" && (
              <MakePaymentPage payments={payments} user={user} currentUser={currentUser} userProfile={userProfile} setUserProfile={setUserProfile} goTo={goTo} />
            )}
            {activePage === "Mock Test" && (
              <MockTestPage currentUser={currentUser} mockResults={mockResults} />
            )}
            {activePage === "Progress" && <LearnerProgressDashboard user={user} past={past} mockResults={mockResults} goTo={goTo} />}
            {activePage === "Notifications" && <NotificationsPage notifications={notifications} />}
          </div>
        </main>
      </div>
      
      {/* ── Chatbot ── */}
      <FloatingChatbot />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE — STEP-BY-STEP JOURNEY
// ═════════════════════════════════════════════════════════════════════════════
function DashboardPage({ user, userProfile, upcoming, past, goTo, skills, mockResults }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const handleMedicalUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError('');
    setUploadSuccess('');

    // Validation
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError("Invalid file format. Please upload PDF, JPG, or PNG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("File size exceeds 2MB limit.");
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `medical/${user.id}_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      // Write to student_medical collection
      await addDoc(collection(db, "student_medical"), {
        student_id: user.id,
        file_url: downloadUrl,
        status: 'uploaded',
        uploaded_at: new Date().toISOString()
      });

      // Update user profile
      await updateDoc(doc(db, "users", user.id), {
        medical_status: 'uploaded',
        medical_url: downloadUrl
      });

      setUploadSuccess("Medical certificate uploaded successfully.");
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Step Status Computation ──
  const medicalRaw = userProfile?.medical_status || 'not_started';
  const medicalDone = medicalRaw === 'approved';
  const medicalUploaded = medicalRaw === 'uploaded' || medicalRaw === 'pending';

  const permitRaw = medicalDone ? (userProfile?.permit_status || 'not_started') : 'locked';
  const permitDone = permitRaw === 'approved';

  const totalClasses = user.classesTotal || 14;
  const completedClasses = user.classesCompleted || 0;
  const practiceRaw = permitDone ? (completedClasses >= totalClasses ? 'completed' : (completedClasses > 0 ? 'in_progress' : 'not_started')) : 'locked';
  const practiceDone = practiceRaw === 'completed';

  const totalFee = userProfile?.total_price || 0;
  const approvedPayments = 0; // from payments prop — handled in parent
  const paymentDone = totalFee > 0 && user.outstandingFees <= 0;

  const trialRaw = (practiceDone && paymentDone) ? (userProfile?.trial_status || 'not_started') : 'locked';
  const trialDone = trialRaw === 'completed';

  // Step objects
  const STEPS = [
    { key: 'medical',  label: 'Medical Certificate', icon: '🏥', status: medicalDone ? 'completed' : medicalUploaded ? 'in_progress' : 'not_started' },
    { key: 'permit',   label: 'L Permit',             icon: '🪪', status: permitDone ? 'completed' : permitRaw === 'uploaded' ? 'in_progress' : permitRaw },
    { key: 'practice', label: 'Driving Practice',      icon: '🚗', status: practiceRaw },
    { key: 'trial',    label: 'Trial Exam',            icon: '🏆', status: trialDone ? 'completed' : trialRaw },
  ];

  const completedSteps = STEPS.filter(s => s.status === 'completed').length;
  const journeyPct = Math.round((completedSteps / STEPS.length) * 100);

  const statusBadge = (status) => {
    const map = {
      completed:   { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0', label: '✓ Completed' },
      in_progress: { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe', label: '● In Progress' },
      not_started: { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb', label: '○ Not Started' },
      locked:      { bg: '#f3f4f6', color: '#9ca3af', border: '#e5e7eb', label: '🔒 Locked' },
    };
    const s = map[status] || map.locked;
    return (
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', padding: '4px 12px', background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Welcome Strip ── */}
      <div style={css.welcomeStrip}>
        <div>
          <div style={css.eyebrow}>Student Portal · {new Date().toLocaleDateString('en-LK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <h1 style={css.welcomeTitle}>Welcome back, {user.name.split(' ')[0]}. 👋</h1>
          <p style={css.welcomeSub}>
            <span style={{ fontWeight: 800, color: '#0B2545' }}>ID: {user.id || 'Pending'}</span> · {user.enrolledPackage || 'No Package'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <ActionBtn onClick={() => goTo('/student/payment')} accent>◎ Make Payment</ActionBtn>
          <ActionBtn onClick={() => goTo('/student/progress')}>View Progress</ActionBtn>
        </div>
      </div>

      {/* ── Overall Progress Bar ── */}
      <div style={css.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#111c2d' }}>Your Journey</div>
            <div style={{ fontSize: 12, color: '#737686', marginTop: 2 }}>{completedSteps} of {STEPS.length} steps completed</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0B2545' }}>{journeyPct}%</div>
        </div>
        <div style={{ height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${journeyPct}%`, background: 'linear-gradient(90deg, #0B2545, #2563eb)', borderRadius: 99, transition: 'width 1s ease' }} />
        </div>
      </div>

      {/* ── 2-Column Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)', gap: 20, alignItems: 'start' }}>

        {/* ═══ LEFT COLUMN — Step Timeline ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STEPS.map((step, idx) => {
            const isLocked = step.status === 'locked';
            const isDone = step.status === 'completed';
            const isActive = step.status === 'in_progress' || step.status === 'not_started';
            const isLast = idx === STEPS.length - 1;

            return (
              <div key={step.key} style={{ display: 'flex', gap: 0 }}>
                {/* Timeline Column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48, flexShrink: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: isDone ? '#16a34a' : isActive ? '#0B2545' : '#d1d5db',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isDone ? 16 : 18, color: '#fff',
                    boxShadow: isActive ? '0 0 0 4px rgba(11,37,69,0.12)' : 'none',
                    transition: 'all 0.3s', flexShrink: 0
                  }}>
                    {isDone ? '✓' : step.icon}
                  </div>
                  {!isLast && (
                    <div style={{ width: 2, flex: 1, minHeight: 20, background: isDone ? '#16a34a' : '#d1d5db', transition: 'background 0.3s' }} />
                  )}
                </div>

                {/* Step Card */}
                <div style={{
                  flex: 1, background: isLocked ? '#f9fafb' : '#fff', border: `1px solid ${isDone ? '#a7f3d0' : isActive ? '#bfdbfe' : '#e5e7eb'}`,
                  borderRadius: 12, padding: '20px 24px', marginBottom: isLast ? 0 : 16,
                  opacity: isLocked ? 0.6 : 1, transition: 'all 0.3s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: isLocked ? '#9ca3af' : '#111c2d' }}>
                      Step {idx + 1}: {step.label}
                    </div>
                    {statusBadge(step.status)}
                  </div>

                  {/* ── Step 1: Medical ── */}
                  {step.key === 'medical' && (
                    <div style={{ marginTop: 12 }}>
                      {uploadError && <div style={{ padding: '10px', background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', borderRadius: 6, fontSize: 12, marginBottom: 10 }}>{uploadError}</div>}
                      {uploadSuccess && <div style={{ padding: '10px', background: '#f0fdf4', border: '1px solid #4ade80', color: '#15803d', borderRadius: 6, fontSize: 12, marginBottom: 10 }}>{uploadSuccess}</div>}

                      {medicalDone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8 }}>
                          <span style={{ fontSize: 24 }}>✅</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>Medical certificate approved</div>
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>You can proceed to the next step</div>
                          </div>
                          {userProfile?.medical_url && (
                            <a href={userProfile.medical_url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: '#fff', border: '1px solid #a7f3d0', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#065f46', textDecoration: 'none' }}>View File</a>
                          )}
                        </div>
                      ) : medicalUploaded ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8 }}>
                          <span style={{ fontSize: 24 }}>📄</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>Document uploaded — awaiting admin approval</div>
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>We will verify your document shortly</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {userProfile?.medical_url && (
                              <a href={userProfile.medical_url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#1e40af', textDecoration: 'none' }}>View</a>
                            )}
                            <label style={{ cursor: uploading ? 'not-allowed' : 'pointer', padding: '6px 12px', background: '#1e40af', border: '1px solid #1e40af', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#fff', opacity: uploading ? 0.7 : 1 }}>
                              {uploading ? 'Uploading...' : 'Re-upload'}
                              <input type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={handleMedicalUpload} disabled={uploading} />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 24 }}>🏥</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#111c2d' }}>Upload Medical Certificate</div>
                              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Please upload a valid Form B medical certificate issued by an RMV registered doctor.</div>
                              <ul style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, paddingLeft: 16 }}>
                                <li>Accepted formats: PDF, JPG, PNG</li>
                                <li>Maximum file size: 2MB</li>
                              </ul>
                              
                              <div style={{ marginTop: 12 }}>
                                <label style={{ cursor: uploading ? 'not-allowed' : 'pointer', display: 'inline-block', padding: '8px 16px', background: '#0B2545', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#fff', opacity: uploading ? 0.7 : 1 }}>
                                  {uploading ? 'Uploading...' : 'Select File & Upload'}
                                  <input type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={handleMedicalUpload} disabled={uploading} />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Step 2: L Permit ── */}
                  {step.key === 'permit' && !isLocked && (
                    <div style={{ marginTop: 12 }}>
                      {permitDone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8 }}>
                          <span style={{ fontSize: 24 }}>✅</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>Learner permit verified</div>
                            {userProfile?.permit_number && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Permit #: {userProfile.permit_number}</div>}
                          </div>
                        </div>
                      ) : permitRaw === 'uploaded' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8 }}>
                          <span style={{ fontSize: 24 }}>📄</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>Permit uploaded — awaiting verification</div>
                            {userProfile?.permit_url && <a href={userProfile.permit_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#2563eb', marginTop: 4, display: 'inline-block' }}>View document →</a>}
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '16px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                          ⚠️ Upload your learner permit to proceed. Contact admin if you need assistance.
                        </div>
                      )}
                    </div>
                  )}
                  {step.key === 'permit' && isLocked && (
                    <div style={{ marginTop: 12, padding: '12px 16px', background: '#f3f4f6', borderRadius: 8, fontSize: 12, color: '#9ca3af' }}>
                      🔒 Complete the Medical step first to unlock this step.
                    </div>
                  )}

                  {/* ── Step 3: Practice ── */}
                  {step.key === 'practice' && !isLocked && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Attendance Stats */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        <div style={{ padding: '14px', background: '#eff6ff', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 22, fontWeight: 900, color: '#0B2545' }}>{completedClasses}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Completed</div>
                        </div>
                        <div style={{ padding: '14px', background: '#fef3c7', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 22, fontWeight: 900, color: '#92400e' }}>{Math.max(0, totalClasses - completedClasses)}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Remaining</div>
                        </div>
                        <div style={{ padding: '14px', background: '#ecfdf5', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 22, fontWeight: 900, color: '#065f46' }}>{totalClasses}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Total</div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Practice Progress</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#0B2545' }}>{totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0}%</span>
                        </div>
                        <div style={{ height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${totalClasses > 0 ? (completedClasses / totalClasses) * 100 : 0}%`, background: completedClasses >= totalClasses ? '#16a34a' : '#0B2545', borderRadius: 99, transition: 'width 0.8s ease' }} />
                        </div>
                      </div>

                      {/* Skill Progress */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skill Tracking</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          {skills.map(skill => (
                            <div key={skill.name} style={{ padding: '10px 14px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{skill.name}</span>
                                <span style={{ fontSize: 11, fontWeight: 800, color: skill.level >= 70 ? '#16a34a' : skill.level >= 40 ? '#d97706' : '#9ca3af' }}>{skill.level}%</span>
                              </div>
                              <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2 }}>
                                <div style={{ height: '100%', width: `${skill.level}%`, background: skill.level >= 70 ? '#16a34a' : skill.level >= 40 ? '#d97706' : '#d1d5db', borderRadius: 2, transition: 'width 0.8s ease' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Schedule button */}
                      <button onClick={() => goTo('/student/bookings')} style={{ ...css.ghostBtn, textAlign: 'center' }} className="ghost-btn">
                        View Full Schedule →
                      </button>
                    </div>
                  )}
                  {step.key === 'practice' && isLocked && (
                    <div style={{ marginTop: 12, padding: '12px 16px', background: '#f3f4f6', borderRadius: 8, fontSize: 12, color: '#9ca3af' }}>
                      🔒 Complete the L Permit step first to unlock practice sessions.
                    </div>
                  )}

                  {/* ── Step 4: Trial ── */}
                  {step.key === 'trial' && !isLocked && (
                    <div style={{ marginTop: 12 }}>
                      {trialDone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8 }}>
                          <span style={{ fontSize: 28 }}>🎉</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#065f46' }}>Congratulations! Trial passed!</div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>You have completed your driving course</div>
                          </div>
                        </div>
                      ) : trialRaw === 'scheduled' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8 }}>
                          <span style={{ fontSize: 24 }}>📅</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>Trial scheduled</div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Date: {userProfile?.trial_date || 'TBA'}</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '16px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                          ⏳ Trial will be scheduled by admin once all requirements are met.
                        </div>
                      )}
                    </div>
                  )}
                  {step.key === 'trial' && isLocked && (
                    <div style={{ marginTop: 12, padding: '12px 16px', background: '#f3f4f6', borderRadius: 8, fontSize: 12, color: '#9ca3af' }}>
                      🔒 {!practiceDone && !paymentDone ? 'Complete practice sessions and clear all payments' : !practiceDone ? 'Complete all practice sessions' : 'Clear all outstanding payments'} to unlock the Trial.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══ RIGHT COLUMN — Payment + Quick Actions ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 80 }}>
          {/* Payment Summary */}
          <div style={{ ...css.card, borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#111c2d' }}>💳 Payment Summary</div>
              {paymentDone ? (
                <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: 4 }}>FULLY PAID</span>
              ) : (
                <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', borderRadius: 4 }}>BALANCE DUE</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Total Course Fee</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#111c2d' }}>{fmtLKR(totalFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Amount Paid</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>{fmtLKR(Math.max(0, totalFee - user.outstandingFees))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: user.outstandingFees > 0 ? '#dc2626' : '#6b7280' }}>Outstanding Balance</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: user.outstandingFees > 0 ? '#dc2626' : '#16a34a' }}>{fmtLKR(user.outstandingFees)}</span>
              </div>
            </div>

            {user.outstandingFees > 0 && (
              <button onClick={() => goTo('/student/payment')} style={{ ...css.primaryBtn, width: '100%', textAlign: 'center', marginTop: 16, borderRadius: 8 }} className="accent-btn">
                Make Payment →
              </button>
            )}
          </div>

          {/* Upcoming Sessions */}
          <div style={{ ...css.card, borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111c2d', marginBottom: 14 }}>📅 Upcoming Sessions</div>
            {upcoming.length > 0 ? upcoming.slice(0, 4).map(b => {
              const { day, month, weekday } = fmtDate(b?.date);
              return (
                <div key={b.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ ...css.dateBox, background: '#0B2545', borderRadius: 8 }}>
                    <span style={{ ...css.dateBoxMonth, color: '#93c5fd' }}>{month}</span>
                    <span style={{ ...css.dateBoxDay, color: '#fff' }}>{day}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#111c2d' }}>{b.vehicleType || 'Vehicle'}</div>
                    <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{b.timeLabel || b.time || b.timeSlotId || ''} · {weekday}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', background: '#ecfdf5', color: '#065f46', borderRadius: 4, textTransform: 'uppercase' }}>{b.status}</span>
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 12 }}>No upcoming sessions</div>
            )}
            <button onClick={() => goTo('/student/bookings')} style={{ ...css.ghostBtn, width: '100%', textAlign: 'center', marginTop: 12, borderRadius: 6 }} className="ghost-btn">
              View All Bookings
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{ ...css.card, background: '#0B2545', border: 'none', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#93c5fd', marginBottom: 12 }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '+ Book Session', path: '/student/book' },
                { label: '◎ Make Payment', path: '/student/payment' },
                { label: '✍ Mock Test', path: '/student/mock-test' },
                { label: '◌ Notifications', path: '/student/notifications' },
              ].map(a => (
                <button key={a.label} onClick={() => goTo(a.path)} style={{ ...css.amberActionBtn, borderRadius: 6 }} className="amber-action-btn">
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PROFILE PAGE
// ═════════════════════════════════════════════════════════════════════════════
function ProfilePage({ user, currentUser, userProfile, setUserProfile, packages = [], totalPaid = 0 }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name, 
    phone: user.phone || '', 
    nic: user.nic || '', 
    dob: user.dob || '', 
    gender: user.gender || '',
    email: user.email || '',
    address: user.address || '', 
    
    learnerPermit: userProfile?.learnerPermit || '',
    licenseType: userProfile?.licenseType || '',
    drivingExperience: userProfile?.drivingExperience || '',
    
    emergencyName: userProfile?.emergencyName || '',
    emergencyRelationship: userProfile?.emergencyRelationship || '',
    emergencyPhone: userProfile?.emergencyPhone || '',
    
    district: userProfile?.district || user.district || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const rows = [
    ['Student ID', user.id || '—'], 
    ['Account Status', user.status === 'approved' ? '✅ Active & Approved' : '⏳ Pending Approval'],
    ['Full Name', user.name], 
    ['NIC Number', user.nic || '—'], 
    ['Date of Birth', user.dob || '—'], 
    ['Gender', user.gender || '—'],
    ['Mobile Number', user.phone || '—'],
    ['Email', user.email || '—'],
    ['Address', user.address || '—'],
    ['District', user.district || '—'], 
    ['Learner Permit No.', user.learnerPermit || '—'],
    ['License Class', LICENSE_LABELS[user.licenseType] || user.licenseType || '—'],
    ['Driving Experience', user.drivingExperience || '—'],
    ['Emergency Contact', `${user.emergencyName || ''} (${user.emergencyRelationship || ''}) - ${user.emergencyPhone || ''}`], 
    ['Enrolled Package', user.enrolledPackage || 'None'],
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const userRef = doc(db, 'users', userProfile.id);
      
      // Keep existing total_price and selected_vehicles, just update fees if needed
      const currentCourseFee = userProfile?.total_price || 0;
      const newOutstandingFees = Math.max(0, currentCourseFee - totalPaid);

      const updateData = {
        ...form,
        outstandingFees: newOutstandingFees
      };
      
      await updateDoc(userRef, updateData);
      setUserProfile({ ...userProfile, ...updateData });
      setSuccess('Profile updated successfully!');
      setTimeout(() => { setSuccess(''); setIsEditing(false); }, 1500);
    } catch (err) {
      console.error(err); setError('Failed to update profile.');
    } finally { setLoading(false); }
  };

  if (isEditing) {
    return (
      <div style={{ maxWidth: 800 }}>
        <PageHeader title="Edit Profile" sub="Update your personal information" />
        {error && <div style={css.alertError}><span>⚠️</span> {error}</div>}
        {success && <div style={css.alertSuccess}><span>✅</span> {success}</div>}
        <form onSubmit={handleSubmit} style={{ ...css.card, marginTop: 24 }}>
          
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0B2545', borderBottom: '1px solid #dee2e6', paddingBottom: 8, marginBottom: 16 }}>Personal & Contact</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20, marginBottom: 32 }}>
            <FormField label="Full Name" name="name" value={form.name} onChange={handleChange} required />
            <FormField label="NIC Number" name="nic" value={form.nic} onChange={handleChange} required />
            <FormField label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} required />
            <div>
              <label style={css.formLabel}>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} style={css.formInput} required>
                <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
              </select>
            </div>
            <FormField label="Mobile Number" name="phone" value={form.phone} onChange={handleChange} placeholder="07X XXX XXXX" required />
            <FormField label="Email" name="email" value={form.email} onChange={handleChange} />
            <FormField label="Address" name="address" value={form.address} onChange={handleChange} required />
            <FormField label="District" name="district" value={form.district} onChange={handleChange} placeholder="e.g. Kurunegala" />
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0B2545', borderBottom: '1px solid #dee2e6', paddingBottom: 8, marginBottom: 16 }}>License & Package</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20, marginBottom: 32 }}>
            <FormField label="Learner Permit No." name="learnerPermit" value={form.learnerPermit} onChange={handleChange} />
            <div>
              <label style={css.formLabel}>License Type</label>
              <select name="licenseType" value={form.licenseType} onChange={handleChange} style={css.formInput} required>
                <option value="">Select Type</option>
                <option value="Light Vehicle">Light Vehicle (A, B, B1)</option>
                <option value="Heavy Vehicle">Heavy Vehicle (C, CE)</option>
              </select>
            </div>
            <div>
              <label style={css.formLabel}>Driving Experience</label>
              <select name="drivingExperience" value={form.drivingExperience} onChange={handleChange} style={css.formInput} required>
                <option value="">Select</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Experienced">Experienced</option>
              </select>
            </div>
            <div>
              <label style={css.formLabel}>Selected Vehicles (Read-Only)</label>
              <div style={{ ...css.formInput, background: '#f0f3ff', color: '#505f76', padding: '10px 14px' }}>
                {user.enrolledPackage || 'None'}
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0B2545', borderBottom: '1px solid #dee2e6', paddingBottom: 8, marginBottom: 16 }}>Emergency Contact</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20, marginBottom: 32 }}>
            <FormField label="Contact Name" name="emergencyName" value={form.emergencyName} onChange={handleChange} required />
            <FormField label="Relationship" name="emergencyRelationship" value={form.emergencyRelationship} onChange={handleChange} required />
            <FormField label="Phone Number" name="emergencyPhone" value={form.emergencyPhone} onChange={handleChange} required />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
            <button type="submit" disabled={loading} style={css.primaryBtn} className="accent-btn">{loading ? 'Saving…' : 'Save Changes'}</button>
            <button type="button" onClick={() => setIsEditing(false)} style={css.ghostBtn} className="ghost-btn">Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader title="My Profile" sub="Your registration details" />
        <button onClick={() => setIsEditing(true)} style={{...css.ghostBtn, border: '1px solid #dee2e6'}} className="ghost-btn">✎ Edit Profile</button>
      </div>
      <div style={{ ...css.card, marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #dee2e6' }}>
          <div style={{ ...css.avatar, width: 56, height: 56, fontSize: 24 }}>{user.name.charAt(0)}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#111c2d' }}>{user.name}</div>
            <div style={{ fontSize: 12, color: '#505f76', marginTop: 2 }}>{user.email}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0 40px' }}>
          {rows.map(([label, val], idx) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e7eeff', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#737686', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#434655', textAlign: 'right', maxWidth: '60%' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}





// ═════════════════════════════════════════════════════════════════════════════
// BOOK SESSION PAGE
// ═════════════════════════════════════════════════════════════════════════════
function BookSessionPage({ packages, user, currentUser, userProfile, totalPaid = 0, setUserProfile, instructors, goTo }) {
  const [sessionType, setSessionType] = useState('driving');
  const [instructorId, setInstructorId] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isApproved = ['L_PERMIT_APPROVED', 'IN_TRAINING', 'PRACTICE_COMPLETED', 'TRIAL_PENDING'].includes(userProfile?.status);

  if (!isApproved) {
    return (
      <div style={{ maxWidth: 800 }}>
        <PageHeader title="L Permit Required" sub="Your L Permit is pending admin approval." />
        <div style={css.card}>
          <p style={{ color: '#ba1a1a', fontWeight: 'bold' }}>You cannot book practical driving sessions until an administrator has approved your L Permit.</p>
        </div>
      </div>
    );
  }

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const instructor = instructors.find(i => i.id === instructorId);
      
      // Add to 'sessions' collection (camelCase fields)
      await addDoc(collection(db, 'sessions'), {
        studentId: currentUser.uid,
        studentName: user.name,
        instructorId: instructorId,
        instructorName: instructor?.name || 'Unassigned',
        date: date,
        time: timeSlot,
        timeSlotId: timeSlot,
        sessionType: sessionType,
        status: 'scheduled',
        attendance: null,
        progress: 'not_started',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setSuccess('Session booked successfully!');
      setTimeout(() => { setSuccess(''); setDate(''); setTimeSlot(''); }, 2000);
    } catch (err) { console.error(err); setError('Booking failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 800 }}>

      {/* ── Book a Session ── */}
      <PageHeader title="Book a Session" sub="Schedule your next driving lesson or theory class" />
      {error && <div style={css.alertError}><span>⚠️</span> {error}</div>}
      {success && <div style={css.alertSuccess}><span>✅</span> {success}</div>}
      
      <form onSubmit={handleBook} style={{ ...css.card, marginTop: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
          <div>
            <label style={css.formLabel}>Session Type</label>
            <select style={css.formInput} value={sessionType} onChange={e => setSessionType(e.target.value)}>
              <option value="driving">Practical Driving</option>
              <option value="theory">Theory Class</option>
              <option value="exam_prep">Exam Prep</option>
            </select>
          </div>
          <div>
            <label style={css.formLabel}>Instructor</label>
            <select style={css.formInput} value={instructorId} onChange={e => setInstructorId(e.target.value)} required>
              <option value="">Select Instructor</option>
              {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label style={css.formLabel}>Date</label>
            <div className="student-calendar-wrapper">
              <style>{`
                .student-calendar-wrapper .react-datepicker-wrapper,
                .student-calendar-wrapper .react-datepicker__input-container { width: 100%; display: block; }
                .student-calendar-wrapper .react-datepicker__input-container input { width: 100%; }
                .student-calendar-wrapper .react-datepicker {
                  font-family: inherit !important;
                  border: 1px solid #dee2e6 !important;
                  border-radius: 0 !important;
                }
                .student-calendar-wrapper .react-datepicker__header {
                  background: #0B2545 !important;
                  border-bottom: none !important;
                  border-radius: 0 !important;
                  padding: 12px 10px 8px !important;
                }
                .student-calendar-wrapper .react-datepicker__current-month {
                  color: #fff !important; font-weight: 800 !important; font-size: 13px !important;
                }
                .student-calendar-wrapper .react-datepicker__day-name {
                  color: rgba(255,255,255,0.7) !important; font-weight: 700 !important; font-size: 10px !important;
                }
                .student-calendar-wrapper .react-datepicker__day {
                  font-size: 12px !important; font-weight: 600 !important; border-radius: 0 !important;
                  transition: all 0.15s !important;
                }
                .student-calendar-wrapper .react-datepicker__day:hover {
                  background: rgba(11,37,69,0.1) !important; border-radius: 0 !important;
                }
                .student-calendar-wrapper .react-datepicker__day--selected {
                  background: #0B2545 !important; color: #fff !important; font-weight: 800 !important;
                }
                .student-calendar-wrapper .react-datepicker__day--today {
                  font-weight: 900 !important; color: #0B2545 !important; border: 2px solid #0B2545 !important;
                }
                .student-calendar-wrapper .react-datepicker__day--today.react-datepicker__day--selected {
                  color: #fff !important;
                }
                .student-calendar-wrapper .react-datepicker__navigation-icon::before {
                  border-color: #fff !important;
                }
              `}</style>
              <DatePicker
                selected={date ? new Date(date + 'T00:00:00') : null}
                onChange={(d) => {
                  if (d) {
                    const offset = d.getTimezoneOffset();
                    const local = new Date(d.getTime() - (offset * 60 * 1000));
                    setDate(local.toISOString().split('T')[0]);
                  } else {
                    setDate('');
                  }
                }}
                customInput={<input style={css.formInput} />}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select a date"
                minDate={new Date()}
                required
              />
            </div>
          </div>
          <div>
            <label style={css.formLabel}>Time Slot</label>
            <select style={css.formInput} value={timeSlot} onChange={e => setTimeSlot(e.target.value)} required>
              <option value="">Select Time</option>
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        
        {(!user.enrolledPackage || user.enrolledPackage === 'None') ? (
          <div style={{...css.alertError, marginTop: 24}}>
            <span>⚠️</span> You must enroll in a package above before you can book a session.
          </div>
        ) : (
          <button type="submit" disabled={loading} style={{ ...css.primaryBtn, marginTop: 28, width: 'auto', padding: '0 32px' }} className="accent-btn">
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        )}
      </form>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BOOKINGS PAGE
// ═════════════════════════════════════════════════════════════════════════════
function BookingsPage({ upcoming, past, instructors }) {
  const [tab, setTab] = useState("upcoming");
  const list = tab === "upcoming" ? upcoming : past;

  const resolveInstructor = (b) => b.instructorName || b.instructor || instructors.find(i => i.id === b.instructorId)?.name || "Instructor";

  return (
    <div>
      <PageHeader title="My Bookings" sub="All your driving session bookings" />
      <div style={{ display: "flex", gap: 0, marginTop: 24, marginBottom: 20, border: "1px solid #dee2e6", width: "fit-content" }}>
        {["upcoming", "past"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 28px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", border: "none", cursor: "pointer", background: tab === t ? "#0B2545" : "transparent", color: tab === t ? "#ffffff" : "#737686", fontFamily: "inherit" }}>
            {t === "upcoming" ? "Upcoming" : "History"}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {list.length === 0 ? (
          <div style={{ ...css.card, textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
            <p style={{ color: "#737686", fontSize: 13 }}>No {tab} sessions found.</p>
          </div>
        ) : list.map(b => {
          const { day, month, weekday } = fmtDate(b?.date);
          return (
            <div key={b.id} style={{ ...css.card, display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ ...css.dateBox, background: b.status === "completed" ? "#16a34a" : b.status === "confirmed" ? "#1e3a5f" : "#dee2e6", flexShrink: 0 }}>
                <span style={{ ...css.dateBoxMonth }}>{month}</span>
                <span style={{ ...css.dateBoxDay }}>{day}</span>
                <span style={{ fontSize: 8, color: "#505f76", fontWeight: 700 }}>{weekday}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111c2d", marginBottom: 4 }}>
                      {VEHICLE_LABELS[b.vehicleType || b.vehicleId] || b.vehicleType || b.vehicleId || "Vehicle"} — Practical Lesson
                    </div>
                    <div style={{ fontSize: 12, color: "#505f76" }}>{b.time || b.timeSlotId} · {resolveInstructor(b)}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", border: `1px solid ${b.status === "completed" ? "#16a34a" : b.status === "scheduled" ? "#1d4ed8" : "#c3c6d7"}`, color: b.status === "completed" ? "#16a34a" : b.status === "scheduled" ? "#60a5fa" : "#505f76" }}>
                    {b.status}
                  </span>
                </div>
                {b.notes && (
                  <div style={{ marginTop: 10, padding: "10px 14px", background: "#dee2e6", borderLeft: "3px solid #0B2545", fontSize: 12, color: "#505f76", lineHeight: 1.5 }}>
                    💬 {b.notes}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAKE PAYMENT PAGE
// ═════════════════════════════════════════════════════════════════════════════
function MakePaymentPage({ payments, user, currentUser, userProfile, setUserProfile, goTo }) {
  const [tab, setTab] = useState('new'); // 'new' or 'history'
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentFor, setPaymentFor] = useState('Package Fee');
  const [otherDescription, setOtherDescription] = useState('');

  const isApproved = userProfile?.status === 'approved';

  if (!isApproved) {
    return (
      <div style={{ maxWidth: 800 }}>
        <PageHeader title="Pending Approval" sub="Your account is pending admin approval." />
        <div style={css.card}>
          <p style={{ color: '#ba1a1a', fontWeight: 'bold' }}>You cannot access this feature until an administrator has approved your profile.</p>
        </div>
      </div>
    );
  }

  // Helper: upload with timeout so it never hangs forever
  const uploadWithTimeout = (storageRef, file, timeoutMs = 10000) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Upload timed out')), timeoutMs);
      uploadBytes(storageRef, file)
        .then(snap => { clearTimeout(timer); resolve(snap); })
        .catch(err  => { clearTimeout(timer); reject(err);  });
    });
  };

  const handlePay = async (e) => {
    e.preventDefault();
    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) return setError('Invalid amount');
    if (paymentFor === 'Others' && !otherDescription.trim()) return setError('Please specify the payment reason');
    if (!reference) return setError('Please enter the reference number');
    if (!receiptFile) return setError('Please upload a receipt photo');

    setLoading(true); setError(''); setSuccess('');
    try {
      // Try to upload receipt; if Storage isn't configured, fall back gracefully
      let receiptUrl = '';
      try {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `receipts/${currentUser.uid}_${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        await uploadWithTimeout(storageRef, receiptFile, 10000);
        receiptUrl = await getDownloadURL(storageRef);
      } catch (uploadErr) {
        console.warn('Receipt upload failed, submitting without image URL:', uploadErr.message);
        // Continue — the reference number acts as proof of payment
      }

      const finalPaymentFor = paymentFor === 'Others' ? `Others - ${otherDescription.trim()}` : paymentFor;

      await addDoc(collection(db, 'payments'), {
        studentId: currentUser.uid,
        student_id: currentUser.uid,
        studentName: user.name,
        amount: payAmt,
        method: 'online_transfer',
        reference: reference,
        receiptUrl: receiptUrl,
        status: 'pending',
        date: new Date().toISOString(),
        payment_date: new Date().toISOString(),
        paymentFor: finalPaymentFor,
        description: paymentFor === 'Others' ? otherDescription.trim() : ''
      });

      setSuccess('Payment submitted! Awaiting admin approval.');
      setTimeout(() => {
        setSuccess('');
        setAmount('');
        setReference('');
        setReceiptFile(null);
        setPaymentFor('Package Fee');
        setOtherDescription('');
        setTab('history');
      }, 2500);
    } catch (err) {
      console.error(err);
      setError('Payment submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <PageHeader title="Payments & Billing" sub="Make a payment or view your transaction history" />
      
      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid #dee2e6', paddingBottom: 12 }}>
        <button onClick={() => setTab('new')} style={{ ...css.ghostBtn, background: tab === 'new' ? '#e7eeff' : 'transparent', color: tab === 'new' ? '#0B2545' : '#505f76' }}>Make Payment</button>
        <button onClick={() => setTab('history')} style={{ ...css.ghostBtn, background: tab === 'history' ? '#e7eeff' : 'transparent', color: tab === 'history' ? '#0B2545' : '#505f76' }}>Payment History</button>
      </div>

      {tab === 'new' ? (
        <div style={css.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #e7eeff' }}>
            <div>
              <div style={{ fontSize: 13, color: '#505f76', marginBottom: 4 }}>Outstanding Balance</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#111c2d' }}>{fmtLKR(user.outstandingFees)}</div>
            </div>
            <div style={{ ...css.avatar, width: 48, height: 48, background: '#16335a' }}>💳</div>
          </div>
          {error && <div style={css.alertError}><span>⚠️</span> {error}</div>}
          {success && <div style={css.alertSuccess}><span>✅</span> {success}</div>}
          <form onSubmit={handlePay} style={{ display: 'grid', gap: 20 }}>
            <div>
              <label style={css.formLabel}>Amount (LKR)</label>
              <input type="number" style={css.formInput} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
            <div>
              <label style={css.formLabel}>Payment Method</label>
              <input type="text" style={css.formInput} value="Online Bank Transfer" disabled />
            </div>
            <div>
              <label style={css.formLabel}>Payment For</label>
              <select 
                style={css.formInput} 
                value={paymentFor} 
                onChange={e => setPaymentFor(e.target.value)}
                required
              >
                <option value="Package Fee">Package Fee</option>
                <option value="Medical Certificate">Medical Certificate</option>
                <option value="DMT Application">DMT Application</option>
                <option value="Others">Others</option>
              </select>
            </div>
            {paymentFor === 'Others' && (
              <div>
                <label style={css.formLabel}>Specify Reason</label>
                <input 
                  type="text" 
                  style={css.formInput} 
                  value={otherDescription} 
                  onChange={e => setOtherDescription(e.target.value)} 
                  placeholder="e.g. Extra driving hours, Book/Study materials" 
                  required 
                />
              </div>
            )}
            <div>
              <label style={css.formLabel}>Reference Number</label>
              <input type="text" style={css.formInput} value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. REF123456789" required />
            </div>
            <div>
              <label style={css.formLabel}>Receipt Photo</label>
              <input 
                key={receiptFile ? 'loaded' : 'empty'}
                type="file" 
                accept="image/*" 
                style={css.formInput} 
                onChange={e => setReceiptFile(e.target.files[0])} 
                required 
              />
            </div>
            <button type="submit" disabled={loading} style={{ ...css.primaryBtn, marginTop: 8 }} className="accent-btn">
              {loading ? 'Submitting...' : 'Submit Payment Details'}
            </button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#737686', border: '1px dashed #dee2e6', borderRadius: 16 }}>No payments found.</div>
          ) : payments.map(p => (
            <div key={p.id} style={{ ...css.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#111c2d' }}>
                  {p.paymentFor ? p.paymentFor : `${p.method.replace('_', ' ').toUpperCase()} Payment`}
                </div>
                <div style={{ fontSize: 11, color: '#505f76', marginTop: 4 }}>{fmtDate(p.date).day} {fmtDate(p.date).month} • Ref: {p.reference || p.id.slice(0, 6)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>+ {fmtLKR(p.amount)}</div>
                <div style={{ fontSize: 10, color: '#737686', marginTop: 4, textTransform: 'uppercase', fontWeight: 800 }}>{p.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



// ═════════════════════════════════════════════════════════════════════════════
// PROGRESS PAGE
// ═════════════════════════════════════════════════════════════════════════════
function ProgressPage({ user, past, skills, mockResults }) {
  const progress = user.progress;
  const passedMockTests = mockResults?.filter(r => r.passed)?.length || 0;
  const mockProgress = Math.min(100, Math.round((passedMockTests / 10) * 100));

  return (
    <div>
      <PageHeader title="Progress Tracker" sub="Your full DMT journey — auto-updated after each instructor session" />
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 24 }}>
        {/* Big progress */}
        <div style={{ ...css.card, display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#dee2e6" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="#0B2545" strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - progress / 100)}`}
                strokeLinecap="round" transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dashoffset 1.2s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: "#111c2d" }}>{progress}%</span>
              <span style={{ fontSize: 9, color: "#505f76", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Complete</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#111c2d", marginBottom: 6 }}>DMT License Journey</div>
            <div style={{ fontSize: 13, color: "#505f76", lineHeight: 1.6 }}>
              Classes completed: <strong style={{ color: "#111c2d" }}>{user.classesCompleted}/{user.classesTotal}</strong><br />
              Outstanding fees: <strong style={{ color: user.outstandingFees > 0 ? "#ba1a1a" : "#16a34a" }}>{fmtLKR(user.outstandingFees)}</strong><br />
              Current step: <strong style={{ color: "#0B2545" }}>{DMT_STEPS.find(s => user.progress < s.val)?.label || "Complete"}</strong>
            </div>
          </div>
        </div>

        {/* Mock Test Progress */}
        <div style={{ ...css.card, display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap", borderLeft: "4px solid #16a34a" }}>
          <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#dee2e6" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#16a34a" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - mockProgress / 100)}`}
                strokeLinecap="round" transform="rotate(-90 50 50)"
                style={{ transition: "stroke-dashoffset 1.2s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#111c2d" }}>{mockProgress}%</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#111c2d", marginBottom: 6 }}>Mock Test Progress</div>
            <div style={{ fontSize: 13, color: "#505f76", lineHeight: 1.6 }}>
              Tests Passed: <strong style={{ color: passedMockTests >= 10 ? "#16a34a" : "#111c2d" }}>{passedMockTests} / 10</strong><br />
              <span style={{ fontSize: 11, color: "#737686" }}>
                {passedMockTests >= 10 ? "🎉 You are fully prepared for the Theory Exam!" : "Keep practicing to reach 100% readiness for your DMT Theory Exam."}
              </span>
            </div>
          </div>
        </div>

        {/* Steps detail */}
        <div style={css.card}>
          <SectionHeader title="Step-by-Step Breakdown" sub="Sri Lanka DMT official process" />
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 0 }}>
            {DMT_STEPS.map((step, i) => {
              const done = progress >= step.val;
              const active = !done && progress >= step.val - 14;
              return (
                <div key={step.key} style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: i < DMT_STEPS.length - 1 ? "1px solid #e7eeff" : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: done ? "#16a34a" : active ? "#16335a" : "#dee2e6", border: `2px solid ${done ? "#16a34a" : active ? "#0B2545" : "#dee2e6"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {done ? "✓" : step.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: done ? "#16a34a" : active ? "#0B2545" : "#505f76" }}>{step.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: done ? "#16a34a" : active ? "#0B2545" : "#c3c6d7" }}>
                        {done ? "Done" : active ? "Active" : "Pending"}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#737686", marginTop: 4 }}>{step.hint}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Skills */}
        <div style={css.card}>
          <SectionHeader title="Skill Assessment" sub="Instructor-rated after each session" />
          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
            {skills.map(skill => (
              <div key={skill.name} style={{ padding: 16, background: "#dee2e6", border: "1px solid #dee2e6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#434655" }}>{skill.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: skill.level >= 70 ? "#16a34a" : skill.level >= 50 ? "#0B2545" : "#ba1a1a" }}>{skill.level}%</span>
                </div>
                <div style={{ height: 6, background: "#dee2e6", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${skill.level}%`, background: skill.level >= 70 ? "#16a34a" : skill.level >= 50 ? "#0B2545" : "#16335a", borderRadius: 3, transition: "width 1s ease" }} />
                </div>
                <div style={{ fontSize: 10, color: "#737686", marginTop: 6 }}>
                  {skill.level >= 70 ? "✅ Good" : skill.level >= 50 ? "⚠️ Needs practice" : "❌ Focus area"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS PAGE
// ═════════════════════════════════════════════════════════════════════════════
function NotificationsPage({ notifications }) {
  const fallbackNotifs = [
    { icon: "📋", title: "Welcome", body: "Welcome to Eranga Driving School! Your dashboard is ready.", time: "Just now", unread: true },
  ];
  const notifs = notifications.length > 0 ? notifications : fallbackNotifs;
  const unreadCount = notifs.filter(n => n.unread !== false).length;

  return (
    <div>
      <PageHeader title="Notifications" sub={`${unreadCount} unread`} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        {notifs.map((n, i) => (
          <div key={n.id || i} style={{ ...css.card, display: "flex", gap: 14, alignItems: "flex-start", borderLeft: `3px solid ${n.unread !== false ? "#0B2545" : "#dee2e6"}`, background: n.unread !== false ? "#dee2e6" : "#ffffff" }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{n.icon || "🔔"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: n.unread !== false ? "#111c2d" : "#505f76" }}>{n.title}</span>
                <span style={{ fontSize: 10, color: "#737686", whiteSpace: "nowrap", marginLeft: 12 }}>{n.time || n.createdAt || ""}</span>
              </div>
              <p style={{ fontSize: 12, color: "#505f76", margin: "6px 0 0", lineHeight: 1.5 }}>{n.body || n.message || ""}</p>
            </div>
            {n.unread !== false && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0B2545", flexShrink: 0, marginTop: 4 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MICRO COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════
function StatCard({ icon, label, value, sub, accent, warn }) {
  return (
    <div style={{ ...css.statCard, borderColor: accent ? "#0B2545" : warn ? "#ba1a1a" : "#dee2e6", background: accent ? "#e7eeff" : warn ? "#fef2f2" : "#ffffff" }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#737686", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: accent ? "#0B2545" : warn ? "#ba1a1a" : "#111c2d", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 10, color: "#737686", marginTop: 4 }}>{sub}</div>
      </div>
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ borderBottom: "1px solid #dee2e6", paddingBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#111c2d", letterSpacing: "-0.01em" }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: "#737686", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function PageHeader({ title, sub }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#0B2545", marginBottom: 6 }}>Student Portal</div>
      <h1 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 900, color: "#111c2d", margin: 0, letterSpacing: "-0.02em" }}>{title}</h1>
      {sub && <p style={{ fontSize: 13, color: "#737686", margin: "6px 0 0" }}>{sub}</p>}
    </div>
  );
}

function ActionBtn({ children, onClick, accent }) {
  return (
    <button onClick={onClick} style={{ padding: "12px 22px", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", border: accent ? "none" : "1px solid #c3c6d7", background: accent ? "#0B2545" : "transparent", color: accent ? "#ffffff" : "#434655", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }} className={accent ? "accent-btn" : "ghost-btn"}>
      {children}
    </button>
  );
}

function FormField({ label, name, type = "text", value, onChange, placeholder, required, min }) {
  return (
    <div>
      <label style={css.formLabel}>{label}</label>
      <input
        name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder} required={required} min={min}
        style={css.formInput}
      />
    </div>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// MOCK TEST PAGE
// ═════════════════════════════════════════════════════════════════════════════
function MockTestPage({ currentUser, mockResults }) {
  const [view, setView] = useState('list'); // 'list' | 'active' | 'review'
  const [activeTestNum, setActiveTestNum] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(40 * 60); // 40 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewData, setReviewData] = useState(null);

  // Timer countdown
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // Auto-submit when time is up
   
  useEffect(() => {
    if (timerActive && timeLeft === 0 && view === 'active') {
      handleSubmitTest();
    }
  }, [timeLeft]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const getDifficultyLabel = (testNum) => {
    if (testNum <= 3) return { label: 'Easy', color: '#16a34a', bg: '#f0fdf4' };
    if (testNum <= 7) return { label: 'Medium', color: '#d97706', bg: '#fffbeb' };
    return { label: 'Hard', color: '#dc2626', bg: '#fef2f2' };
  };

  const getTestResult = (testNum) => {
    return mockResults.find(r => r.testId === `mock_test_${testNum}`);
  };

  const startTest = (testNum) => {
    const testQs = getMockTest(testNum);
    setActiveTestNum(testNum);
    setQuestions(testQs);
    setAnswers({});
    setCurrentQ(0);
    setTimeLeft(40 * 60);
    setTimerActive(true);
    setView('active');
  };

  const selectAnswer = (qIndex, optionIndex) => {
    setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
  };

  async function handleSubmitTest() {
    setTimerActive(false);
    setSubmitting(true);

    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct) score++;
    });

    const passed = score >= 30; // 75% pass mark (30/40)

    try {
      await addDoc(collection(db, 'mock_test_results'), {
        studentId: currentUser.uid,
        testId: `mock_test_${activeTestNum}`,
        score,
        total: 40,
        passed,
        completedAt: new Date().toISOString(),
        timeTaken: (40 * 60) - timeLeft
      });
    } catch (err) {
      console.error('Failed to save mock test result:', err);
    }

    setReviewData({ score, total: 40, passed, questions, answers });
    setSubmitting(false);
    setView('review');
  };

  const backToList = () => {
    setView('list');
    setActiveTestNum(null);
    setQuestions([]);
    setAnswers({});
    setReviewData(null);
  };

  // ── TEST LIST VIEW ──
  if (view === 'list') {
    return (
      <div style={{ maxWidth: 900 }}>
        <PageHeader title="Mock Driving Tests" sub="Practice for your DMT theory exam with 10 structured mock tests" />

        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
          <div style={{ ...css.statCard, borderLeft: '3px solid #0B2545' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: '#737686', textTransform: 'uppercase' }}>Total Tests</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#111c2d' }}>10</div>
          </div>
          <div style={{ ...css.statCard, borderLeft: '3px solid #16a34a' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: '#737686', textTransform: 'uppercase' }}>Completed</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#16a34a' }}>{mockResults.length}</div>
          </div>
          <div style={{ ...css.statCard, borderLeft: '3px solid #d97706' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: '#737686', textTransform: 'uppercase' }}>Passed</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#d97706' }}>{mockResults.filter(r => r.passed).length}</div>
          </div>
          <div style={{ ...css.statCard, borderLeft: '3px solid #2563eb' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: '#737686', textTransform: 'uppercase' }}>Best Score</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#2563eb' }}>
              {mockResults.length > 0 ? `${Math.max(...mockResults.map(r => r.score))}/40` : '—'}
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div style={{ ...css.stepAlert, marginBottom: 24, borderLeftColor: '#2563eb' }}>
          <span style={{ fontSize: 28 }}>📝</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: '#0B2545', textTransform: 'uppercase', marginBottom: 4 }}>
              Exam Format
            </div>
            <div style={{ fontSize: 13, color: '#505f76', lineHeight: 1.5 }}>
              Each test has <strong>40 questions</strong> (20 Theory + 20 Road Signs) · <strong>40 minutes</strong> time limit · Pass mark: <strong>30/40 (75%)</strong>
            </div>
          </div>
        </div>

        {/* Test Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(testNum => {
            const diff = getDifficultyLabel(testNum);
            const result = getTestResult(testNum);
            return (
              <div key={testNum} style={{ ...css.card, padding: 0, overflow: 'hidden', transition: 'box-shadow 0.2s', cursor: 'pointer' }}
                   onClick={() => startTest(testNum)}
                   onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(11,37,69,0.12)'}
                   onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                {/* Card Header */}
                <div style={{ background: '#0B2545', padding: '20px 20px 16px', color: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7 }}>Mock Test</span>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', padding: '3px 10px', background: diff.bg, color: diff.color, borderRadius: 4 }}>
                      {diff.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>#{String(testNum).padStart(2, '0')}</div>
                </div>
                {/* Card Body */}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: '#505f76' }}>
                      <span style={{ marginRight: 12 }}>📖 20 Theory</span>
                      <span>🚦 20 Signs</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#737686' }}>⏱ 40 min</span>
                  </div>

                  {result ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: result.passed ? '#f0fdf4' : '#fef2f2', border: `1px solid ${result.passed ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: result.passed ? '#16a34a' : '#dc2626' }}>
                          {result.passed ? '✅ PASSED' : '❌ FAILED'}
                        </div>
                        <div style={{ fontSize: 10, color: '#737686', marginTop: 2 }}>
                          {new Date(result.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: result.passed ? '#16a34a' : '#dc2626' }}>
                        {result.score}/40
                      </div>
                    </div>
                  ) : (
                    <button style={{ ...css.primaryBtn, width: '100%', textAlign: 'center', padding: '10px 0' }} className="accent-btn">
                      Start Test →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── ACTIVE TEST SESSION VIEW ──
  if (view === 'active') {
    const q = questions[currentQ];
    if (!q) return null;
    const answeredCount = Object.keys(answers).length;
    const isUrgent = timeLeft <= 5 * 60; // less than 5 min

    return (
      <div style={{ maxWidth: 1000 }}>
        {/* Top Bar with Timer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: '#0B2545', textTransform: 'uppercase' }}>Mock Test #{String(activeTestNum).padStart(2, '0')}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#111c2d' }}>Question {currentQ + 1} of 40</div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'center', padding: '8px 20px', background: isUrgent ? '#fef2f2' : '#e7eeff', border: `2px solid ${isUrgent ? '#dc2626' : '#0B2545'}`, borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: isUrgent ? '#dc2626' : '#737686', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Time Left</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: isUrgent ? '#dc2626' : '#0B2545', fontFamily: 'monospace' }}>{formatTime(timeLeft)}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#737686', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Answered</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a' }}>{answeredCount}/40</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>
          {/* Question Card */}
          <div style={{ ...css.card, padding: 0 }}>
            {/* Question type badge */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 12px', background: q.type === 'theory' ? '#e7eeff' : '#fef3c7', color: q.type === 'theory' ? '#0B2545' : '#92400e', borderRadius: 4 }}>
                {q.type === 'theory' ? '📖 Theory Question' : '🚦 Road Sign Question'}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#737686' }}>Q{currentQ + 1}</span>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Road sign SVG if symbol question */}
              {q.type === 'symbol' && q.symbolType && ROAD_SIGNS[q.symbolType] && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, padding: 20, background: '#f8f9fc', border: '1px dashed #dee2e6', borderRadius: 12 }}>
                  <div style={{ width: 120, height: 120 }}>
                    {React.cloneElement(ROAD_SIGNS[q.symbolType], { width: 120, height: 120 })}
                  </div>
                </div>
              )}

              {/* Question text */}
              <p style={{ fontSize: 16, fontWeight: 700, color: '#111c2d', lineHeight: 1.6, marginBottom: 24 }}>
                {q.question}
              </p>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.options.map((opt, oi) => {
                  const isSelected = answers[currentQ] === oi;
                  return (
                    <button
                      key={oi}
                      onClick={() => selectAnswer(currentQ, oi)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 18px', border: `2px solid ${isSelected ? '#0B2545' : '#dee2e6'}`,
                        background: isSelected ? '#e7eeff' : '#ffffff',
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        transition: 'all 0.15s', borderRadius: 0
                      }}
                    >
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 900,
                        background: isSelected ? '#0B2545' : '#dee2e6',
                        color: isSelected ? '#ffffff' : '#505f76'
                      }}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? '#0B2545' : '#505f76' }}>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <button
                onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0}
                style={{ ...css.ghostBtn, opacity: currentQ === 0 ? 0.4 : 1 }}
                className="ghost-btn"
              >
                ← Previous
              </button>
              {currentQ < 39 ? (
                <button onClick={() => setCurrentQ(currentQ + 1)} style={css.primaryBtn} className="accent-btn">
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmitTest}
                  disabled={submitting}
                  style={{ ...css.primaryBtn, background: '#16a34a' }}
                >
                  {submitting ? 'Submitting...' : '✓ Submit Test'}
                </button>
              )}
            </div>
          </div>

          {/* Right Sidebar: Question Navigator */}
          <div style={{ ...css.card, padding: 16, position: 'sticky', top: 80 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#737686', marginBottom: 12 }}>
              Question Navigator
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {questions.map((_, idx) => {
                const isAnswered = answers[idx] !== undefined;
                const isCurrent = idx === currentQ;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQ(idx)}
                    style={{
                      width: '100%', aspectRatio: '1', border: isCurrent ? '2px solid #0B2545' : '1px solid #dee2e6',
                      background: isCurrent ? '#0B2545' : isAnswered ? '#e7eeff' : '#ffffff',
                      color: isCurrent ? '#ffffff' : isAnswered ? '#0B2545' : '#737686',
                      fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid #dee2e6' }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 10, color: '#505f76' }}>
                <span>🔵 Current</span>
                <span>🟦 Answered</span>
                <span>⬜ Unanswered</span>
              </div>
            </div>

            {/* Submit button in sidebar too */}
            <button
              onClick={handleSubmitTest}
              disabled={submitting || answeredCount === 0}
              style={{ ...css.primaryBtn, width: '100%', marginTop: 12, textAlign: 'center', background: answeredCount >= 40 ? '#16a34a' : '#0B2545', opacity: answeredCount === 0 ? 0.5 : 1 }}
              className="accent-btn"
            >
              {submitting ? 'Submitting...' : `Submit (${answeredCount}/40)`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── REVIEW VIEW ──
  if (view === 'review' && reviewData) {
    const { score, total, passed } = reviewData;
    const percentage = Math.round((score / total) * 100);

    return (
      <div style={{ maxWidth: 900 }}>
        <PageHeader title="Test Results" sub={`Mock Test #${String(activeTestNum).padStart(2, '0')} — Review`} />

        {/* Score Card */}
        <div style={{ ...css.card, padding: 0, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ background: passed ? '#16a34a' : '#dc2626', padding: '32px 28px', color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: 60, fontWeight: 900, letterSpacing: '-0.04em' }}>{score}/{total}</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              {passed ? '🎉 PASSED' : '😞 FAILED'}
            </div>
            <div style={{ fontSize: 13, marginTop: 8, opacity: 0.8 }}>
              {percentage}% · Pass mark: 75% (30/40)
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
            <div style={{ padding: '16px 20px', textAlign: 'center', borderRight: '1px solid #dee2e6' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#737686', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Correct</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a' }}>{score}</div>
            </div>
            <div style={{ padding: '16px 20px', textAlign: 'center', borderRight: '1px solid #dee2e6' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#737686', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Wrong</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#dc2626' }}>{total - score}</div>
            </div>
            <div style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#737686', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Skipped</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#d97706' }}>{total - Object.keys(reviewData.answers).length}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={backToList} style={css.ghostBtn} className="ghost-btn">← Back to Tests</button>
          <button onClick={() => startTest(activeTestNum)} style={css.primaryBtn} className="accent-btn">🔄 Retake Test</button>
        </div>

        {/* Detailed Question Review */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviewData.questions.map((q, idx) => {
            const studentAns = reviewData.answers[idx];
            const isCorrect = studentAns === q.correct;
            const wasSkipped = studentAns === undefined;

            return (
              <div key={idx} style={{ ...css.card, borderLeft: `4px solid ${isCorrect ? '#16a34a' : wasSkipped ? '#d97706' : '#dc2626'}`, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f3ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', padding: '3px 10px', background: q.type === 'theory' ? '#e7eeff' : '#fef3c7', color: q.type === 'theory' ? '#0B2545' : '#92400e', textTransform: 'uppercase' }}>
                      {q.type === 'theory' ? 'Theory' : 'Road Sign'} · Q{idx + 1}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: isCorrect ? '#16a34a' : wasSkipped ? '#d97706' : '#dc2626' }}>
                      {isCorrect ? '✅ Correct' : wasSkipped ? '⏭ Skipped' : '❌ Wrong'}
                    </span>
                  </div>

                  {/* Show SVG sign if symbol question */}
                  {q.type === 'symbol' && q.symbolType && ROAD_SIGNS[q.symbolType] && (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0', padding: 12, background: '#f8f9fc', borderRadius: 8 }}>
                      <div style={{ width: 80, height: 80 }}>
                        {React.cloneElement(ROAD_SIGNS[q.symbolType], { width: 80, height: 80 })}
                      </div>
                    </div>
                  )}

                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111c2d', lineHeight: 1.5, marginBottom: 12 }}>{q.question}</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {q.options.map((opt, oi) => {
                      const isStudentChoice = studentAns === oi;
                      const isCorrectOpt = q.correct === oi;
                      let bg = '#ffffff'; let border = '#dee2e6'; let color = '#505f76';
                      if (isCorrectOpt) { bg = '#f0fdf4'; border = '#16a34a'; color = '#16a34a'; }
                      else if (isStudentChoice && !isCorrect) { bg = '#fef2f2'; border = '#dc2626'; color = '#dc2626'; }
                      return (
                        <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: `1px solid ${border}`, background: bg }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color }}>{String.fromCharCode(65 + oi)}.</span>
                          <span style={{ fontSize: 12, color, fontWeight: isCorrectOpt || isStudentChoice ? 700 : 400 }}>{opt}</span>
                          {isCorrectOpt && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: '#16a34a' }}>✓ CORRECT</span>}
                          {isStudentChoice && !isCorrect && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: '#dc2626' }}>✗ YOUR ANSWER</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation */}
                <div style={{ padding: '12px 20px', background: '#f8f9fc', fontSize: 12, color: '#505f76', lineHeight: 1.5 }}>
                  💡 <strong>Explanation:</strong> {q.explanation}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <button onClick={backToList} style={{ ...css.primaryBtn, padding: '14px 40px' }} className="accent-btn">← Back to All Tests</button>
        </div>
      </div>
    );
  }

  return null;
}



// ═════════════════════════════════════════════════════════════════════════════
// FLOATING CHATBOT
// ═════════════════════════════════════════════════════════════════════════════
function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hi! I'm the driving school assistant. How can I help?" }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    
    // Simple mock logic
    setTimeout(() => {
      const lower = newMsg.text.toLowerCase();
      let reply = "I'm not sure. Please contact our front desk at 011-123-4567.";
      if (lower.includes('permit') || lower.includes('medical')) reply = "You need a medical certificate to apply for your learner's permit.";
      if (lower.includes('fee') || lower.includes('cost') || lower.includes('pay')) reply = "You can view your outstanding fees and make a payment in the 'Make Payment' section.";
      if (lower.includes('book') || lower.includes('class') || lower.includes('lesson')) reply = "You can book theory or practical sessions in the 'Book Session' tab.";
      
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 600);
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{ width: 60, height: 60, borderRadius: 30, background: '#0B2545', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 24, boxShadow: '0 8px 32px rgba(11,37,69,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          💬
        </button>
      ) : (
        <div style={{ width: 320, height: 440, background: '#f0f3ff', border: '1px solid #dee2e6', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.5)' }}>
          {/* Header */}
          <div style={{ background: '#e7eeff', padding: '16px 20px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 16, background: '#0B2545', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#111c2d' }}>Assistant</div>
                <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>Online</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: '#737686', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>
          
          {/* Messages */}
          <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <div style={{ background: m.sender === 'user' ? '#0B2545' : '#e7eeff', color: m.sender === 'user' ? '#ffffff' : '#434655', padding: '10px 14px', borderRadius: 16, borderBottomRightRadius: m.sender === 'user' ? 4 : 16, borderBottomLeftRadius: m.sender === 'bot' ? 4 : 16, fontSize: 13, lineHeight: 1.4 }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: 16, borderTop: '1px solid #dee2e6', display: 'flex', gap: 12 }}>
            <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." style={{ flex: 1, background: '#e7eeff', border: '1px solid #dee2e6', padding: '10px 16px', borderRadius: 20, color: '#111c2d', fontSize: 13, outline: 'none' }} />
            <button type="submit" style={{ background: '#0B2545', color: '#ffffff', border: 'none', width: 40, height: 40, borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>↗</button>
          </form>
        </div>
      )}
    </div>
  );
}
