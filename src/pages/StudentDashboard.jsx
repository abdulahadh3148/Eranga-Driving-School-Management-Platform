import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
  collection, query, where, onSnapshot, addDoc, doc, updateDoc, getDoc, getDocs, orderBy
} from "firebase/firestore";
import { storage } from "../firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  { name: "Vehicle Control", level: 0 },
  { name: "Lane Discipline", level: 0 },
  { name: "Observation / Mirrors", level: 0 },
  { name: "Clutch & Gear Work", level: 0 },
  { name: "Parking", level: 0 },
  { name: "Emergency Stop", level: 0 },
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
  return "Dashboard";
}

// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════════════════════
const css = {
  root: { display: "flex", minHeight: "100vh", background: "#F1F4F9", fontFamily: "'DM Sans','Helvetica Neue',sans-serif", color: "#111c2d" },
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
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');
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
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  // ── Build user object from auth profile ──
  const user = {
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
    outstandingFees: userProfile?.outstandingFees || 0,
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
    const checkDone = () => { loadCounter++; if (loadCounter >= 4) setDataLoading(false); };

    // Bookings
    try {
      const bQ = query(collection(db, "bookings"), where("studentId", "==", currentUser.uid));
      unsubs.push(onSnapshot(bQ, snap => {
        setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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

    // Instructors (one-time)
    (async () => {
      try {
        const iQ = query(collection(db, "users"), where("role", "==", "instructor"));
        const snap = await getDocs(iQ);
        setInstructors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {}
    })();

    // Skills (if stored)
    if (userProfile?.skills) {
      setSkills(userProfile.skills);
    }

    return () => unsubs.forEach(u => u());
  }, [currentUser?.uid]);

  // ── Derived data ──
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const allBookings = bookings.sort((a, b) => new Date(a.date) - new Date(b.date));
  const upcoming = allBookings.filter(b => new Date(b.date) >= today && b.status !== "completed").sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = allBookings.filter(b => new Date(b.date) < today || b.status === "completed").sort((a, b) => new Date(b.date) - new Date(a.date));
  const progress = user.progress;
  const currentStep = DMT_STEPS.find(s => progress < s.val) || DMT_STEPS[DMT_STEPS.length - 1];
  const nextStep = DMT_STEPS[DMT_STEPS.indexOf(currentStep) + 1] || null;
  const displayPackages = packages.length > 0 ? packages : FALLBACK_PACKAGES;

  const handleLogout = async () => {
    try { await logout(); navigate("/login"); } catch (err) { console.error(err); }
  };

  const goTo = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

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
                upcoming={upcoming}
                past={past}
                currentStep={currentStep}
                nextStep={nextStep}
                goTo={goTo}
                skills={skills}
              />
            )}
            {activePage === "My Profile" && <ProfilePage user={user} currentUser={currentUser} userProfile={userProfile} setUserProfile={setUserProfile} goTo={goTo} />}
            {activePage === "Book Session" && (
              <BookSessionPage packages={displayPackages} user={user} currentUser={currentUser} userProfile={userProfile} setUserProfile={setUserProfile} instructors={instructors} goTo={goTo} />
            )}
            {activePage === "My Bookings" && <BookingsPage upcoming={upcoming} past={past} instructors={instructors} />}
            {activePage === "Make Payment" && (
              <MakePaymentPage payments={payments} user={user} currentUser={currentUser} userProfile={userProfile} setUserProfile={setUserProfile} goTo={goTo} />
            )}
            {activePage === "Progress" && <ProgressPage user={user} past={past} skills={skills} />}
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
// DASHBOARD PAGE
// ═════════════════════════════════════════════════════════════════════════════
function DashboardPage({ user, upcoming, past, currentStep, nextStep, goTo, skills }) {
  const progress = user.progress;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Welcome strip */}
      <div style={css.welcomeStrip}>
        <div>
          <div style={css.eyebrow}>Student Portal · {new Date().toLocaleDateString("en-LK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
          <h1 style={css.welcomeTitle}>Welcome back, {user.name.split(" ")[0]}. 👋</h1>
          <p style={css.welcomeSub}>{user.enrolledPackage} Package · {LICENSE_LABELS[user.licenseType] || user.licenseType} · DMT: {user.dmtOffice}</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <ActionBtn onClick={() => goTo("/student/book")} accent>+ Book Session</ActionBtn>
          <ActionBtn onClick={() => goTo("/student/progress")}>View Progress</ActionBtn>
        </div>
      </div>

      {/* Current step alert */}
      <div style={css.stepAlert}>
        <span style={{ fontSize: 28 }}>{currentStep.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: "#0B2545", textTransform: "uppercase", marginBottom: 4 }}>
            Current DMT Step
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111c2d", marginBottom: 4 }}>{currentStep.label}</div>
          <div style={{ fontSize: 12, color: "#505f76" }}>{currentStep.hint}</div>
          {nextStep && (
            <div style={{ fontSize: 11, color: "#737686", marginTop: 6 }}>
              Next → <strong style={{ color: "#505f76" }}>{nextStep.label}</strong>
            </div>
          )}
        </div>
        <div style={css.progressCircle}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#dee2e6" strokeWidth="5" />
            <circle cx="32" cy="32" r="26" fill="none" stroke="#0B2545" strokeWidth="5"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div style={css.progressCircleLabel}>{progress}%</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={css.statsGrid}>
        <StatCard icon="🎓" label="Classes Done" value={`${user.classesCompleted}/${user.classesTotal}`} sub={`${user.classesTotal - user.classesCompleted} remaining`} />
        <StatCard icon="📅" label="Next Lesson" value={upcoming[0] ? `${fmtDate(upcoming[0].date).day} ${fmtDate(upcoming[0].date).month}` : "None"} sub={upcoming[0]?.timeSlot || "Book now"} accent={!!upcoming[0]} />
        <StatCard icon="💳" label="Outstanding" value={fmtLKR(user.outstandingFees)} sub="Contact admin" warn={user.outstandingFees > 0} />
        <StatCard icon="📊" label="Progress" value={`${progress}%`} sub={currentStep.label} />
      </div>

      {/* DMT Progress Tracker */}
      <div style={css.card}>
        <SectionHeader title="DMT License Progress Tracker" sub="Department of Motor Traffic — Sri Lanka Official Flow" />
        <div style={{ overflowX: "auto", paddingBottom: 8 }}>
          <div style={{ display: "flex", gap: 0, minWidth: 560, position: "relative", marginTop: 24 }}>
            <div style={{ position: "absolute", top: 20, left: "7%", right: "7%", height: 2, background: "#dee2e6", zIndex: 0 }} />
            <div style={{ position: "absolute", top: 20, left: "7%", width: `${Math.min(progress, 99)}%`, height: 2, background: "#0B2545", zIndex: 1, transition: "width 1s ease" }} />
            {DMT_STEPS.map((step) => {
              const done = progress >= step.val;
              const active = !done && progress >= step.val - 14;
              return (
                <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, position: "relative", zIndex: 2 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: done ? "#16a34a" : active ? "#16335a" : "#dee2e6",
                    border: `2px solid ${done ? "#16a34a" : active ? "#0B2545" : "#dee2e6"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: done ? 14 : 16,
                    boxShadow: active ? "0 0 0 4px rgba(11,37,69,0.2)" : "none",
                    transition: "all 0.4s",
                  }}>
                    {done ? "✓" : step.icon}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: done ? "#16a34a" : active ? "#0B2545" : "#737686", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center", lineHeight: 1.3, maxWidth: 64 }}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-col layout */}
      <div style={css.twoCol}>
        {/* LEFT: Skills + Feedback */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={css.card}>
            <SectionHeader title="Skill Progress" sub="Updated by instructor after each session" />
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {skills.map(skill => (
                <div key={skill.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#434655" }}>{skill.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: skill.level >= 70 ? "#16a34a" : skill.level >= 50 ? "#0B2545" : "#ba1a1a" }}>{skill.level}%</span>
                  </div>
                  <div style={{ height: 4, background: "#dee2e6", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${skill.level}%`, background: skill.level >= 70 ? "#16a34a" : skill.level >= 50 ? "#0B2545" : "#16335a", borderRadius: 2, transition: "width 0.8s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest instructor feedback */}
          <div style={css.card}>
            <SectionHeader title="Instructor Feedback" sub="From your last 3 sessions" />
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              {past.slice(0, 3).map(b => {
                const { day, month } = fmtDate(b.date);
                return (
                  <div key={b.id} style={{ display: "flex", gap: 14, paddingBottom: 14, borderBottom: "1px solid #dee2e6" }}>
                    <div style={css.dateBox}><span style={css.dateBoxMonth}>{month}</span><span style={css.dateBoxDay}>{day}</span></div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#111c2d", marginBottom: 4 }}>{b.instructorName || b.instructor || "Instructor"}</div>
                      <div style={{ fontSize: 12, color: "#505f76", lineHeight: 1.5 }}>{b.feedback || "Session completed. No additional notes."}</div>
                    </div>
                  </div>
                );
              })}
              {past.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#737686", fontSize: 12 }}>No past sessions yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Upcoming + Quick actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={css.card}>
            <SectionHeader title="Upcoming Sessions" sub={`${upcoming.length} lesson${upcoming.length !== 1 ? "s" : ""} booked`} />
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              {upcoming.length > 0 ? upcoming.slice(0, 3).map(b => {
                const { day, month, weekday } = fmtDate(b.date);
                return (
                  <div key={b.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ ...css.dateBox, background: "#0B2545" }}>
                      <span style={{ ...css.dateBoxMonth, color: "#ffffff" }}>{month}</span>
                      <span style={{ ...css.dateBoxDay, color: "#ffffff" }}>{day}</span>
                      <span style={{ fontSize: 8, color: "#737686", fontWeight: 700 }}>{weekday}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#111c2d" }}>{VEHICLE_LABELS[b.vehicleType || b.vehicleId] || b.vehicleType || b.vehicleId || "Vehicle"}</div>
                      <div style={{ fontSize: 11, color: "#505f76", marginTop: 2 }}>{b.timeSlot} · {b.instructorName || b.instructor || "Instructor"}</div>
                      <div style={{ fontSize: 9, color: "#16a34a", fontWeight: 700, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{b.status}</div>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
                  <p style={{ fontSize: 12, color: "#737686" }}>No upcoming sessions. Book your next lesson!</p>
                </div>
              )}
            </div>
            <button onClick={() => goTo("/student/bookings")} style={{ ...css.ghostBtn, width: "100%", marginTop: 16, textAlign: "center" }} className="ghost-btn">
              View All Bookings
            </button>
          </div>

          {/* Quick actions */}
          <div style={{ ...css.card, background: "#0B2545", border: "none" }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#ffffff", marginBottom: 6 }}>Quick Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              {[
                { label: "+ Book New Session", path: "/student/book" },
                { label: "◎ Make Payment", path: "/student/payment" },
                { label: "▲ View Full Progress", path: "/student/progress" },
                { label: "◌ Notifications", path: "/student/notifications" },
              ].map(a => (
                <button key={a.label} onClick={() => goTo(a.path)} style={css.amberActionBtn} className="amber-action-btn">
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* DMT info card */}
          <div style={{ ...css.card, borderColor: "#dee2e6" }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#737686", marginBottom: 8 }}>Your DMT Office</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#111c2d", marginBottom: 4 }}>{user.dmtOffice} DMT</div>
            <div style={{ fontSize: 12, color: "#505f76", lineHeight: 1.5 }}>
              Theory exam &amp; road test will be conducted at this office.
            </div>
            <a href="https://www.motortraffic.gov.lk" target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-block", marginTop: 12, fontSize: 11, fontWeight: 700, color: "#0B2545", textDecoration: "none" }}>
              DMT e-Services →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PROFILE PAGE
// ═════════════════════════════════════════════════════════════════════════════
function ProfilePage({ user, currentUser, userProfile, setUserProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name, phone: user.phone || '', nic: user.nic || '', dob: user.dob || '', gender: user.gender || '',
    address: user.address || '', emergencyContact: user.emergencyContact || '', licenseType: user.licenseType || 'B_manual', vehiclePreference: user.vehiclePreference || 'toyota_axio',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const rows = [
    ['Full Name', user.name], ['NIC Number', user.nic || '—'], ['Date of Birth', user.dob || '—'], ['Gender', user.gender || '—'],
    ['District', user.district || '—'], ['DMT Office', (user.dmtOffice || '—') + ' DMT'], ['Address', user.address || '—'],
    ['Emergency Contact', user.emergencyContact || '—'], ['License Class', LICENSE_LABELS[user.licenseType] || user.licenseType || '—'],
    ['Training Vehicle', VEHICLE_LABELS[user.vehiclePreference] || user.vehiclePreference || '—'], ['Enrolled Package', user.enrolledPackage || 'None'],
    ['Account Status', user.status === 'approved' ? '✅ Active & Approved' : '⏳ Pending Approval'],
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, form);
      setUserProfile({ ...userProfile, ...form });
      setSuccess('Profile updated successfully!');
      setTimeout(() => { setSuccess(''); setIsEditing(false); }, 1500);
    } catch (err) {
      console.error(err); setError('Failed to update profile.');
    } finally { setLoading(false); }
  };

  if (isEditing) {
    return (
      <div style={{ maxWidth: 640 }}>
        <PageHeader title="Edit Profile" sub="Update your personal information" />
        {error && <div style={css.alertError}><span>⚠️</span> {error}</div>}
        {success && <div style={css.alertSuccess}><span>✅</span> {success}</div>}
        <form onSubmit={handleSubmit} style={{ ...css.card, marginTop: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
            <FormField label="Full Name" name="name" value={form.name} onChange={handleChange} required />
            <FormField label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="07X XXX XXXX" />
            <FormField label="NIC Number" name="nic" value={form.nic} onChange={handleChange} />
            <FormField label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} />
            <div>
              <label style={css.formLabel}>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} style={css.formInput}>
                <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
              </select>
            </div>
            <FormField label="Address" name="address" value={form.address} onChange={handleChange} />
            <FormField label="Emergency Contact" name="emergencyContact" value={form.emergencyContact} onChange={handleChange} />
            <div>
              <label style={css.formLabel}>License Class</label>
              <select name="licenseType" value={form.licenseType} onChange={handleChange} style={css.formInput}>
                {Object.entries(LICENSE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={css.formLabel}>Preferred Vehicle</label>
              <select name="vehiclePreference" value={form.vehiclePreference} onChange={handleChange} style={css.formInput}>
                {Object.entries(VEHICLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
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
    <div style={{ maxWidth: 640 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {rows.map(([label, val]) => (
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
function BookSessionPage({ packages, user, currentUser, userProfile, setUserProfile, instructors, goTo }) {
  const [sessionType, setSessionType] = useState('driving');
  const [instructorId, setInstructorId] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Packages state
  const [enrolling, setEnrolling] = useState(null);

  const isProfileFilled = userProfile?.nic && userProfile?.dob && userProfile?.address && userProfile?.emergencyContact;
  const isApproved = userProfile?.status === 'approved';

  if (!isProfileFilled) {
    return (
      <div style={{ maxWidth: 800 }}>
        <PageHeader title="Profile Incomplete" sub="Please complete your profile to access this feature." />
        <div style={css.card}>
          <p style={{ color: '#ba1a1a', fontWeight: 'bold', marginBottom: 16 }}>You must fill in your NIC, Date of Birth, Address, and Emergency Contact in your profile before you can proceed.</p>
          <button onClick={() => goTo('/student/profile')} style={css.primaryBtn}>Go to Profile</button>
        </div>
      </div>
    );
  }

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

  const handleEnroll = async (pkg) => {
    setEnrolling(pkg.id);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        enrolledPackage: pkg.name,
        packageId: pkg.id,
        classesTotal: pkg.features.some(f => f.includes('25')) ? 25 : pkg.features.some(f => f.includes('18')) ? 18 : 10,
        outstandingFees: (userProfile?.outstandingFees || 0) + pkg.price
      });
      setUserProfile({ ...userProfile, enrolledPackage: pkg.name, packageId: pkg.id });
    } catch (e) {
      console.error(e);
      alert("Failed to enroll");
    } finally {
      setEnrolling(null);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const instructor = instructors.find(i => i.id === instructorId);
      await addDoc(collection(db, 'bookings'), {
        studentId: currentUser.uid,
        studentName: user.name,
        instructorId,
        instructorName: instructor?.name || 'Unassigned',
        date, timeSlot, sessionType,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setSuccess('Session booked successfully!');
      setTimeout(() => { setSuccess(''); setDate(''); setTimeSlot(''); }, 2000);
    } catch (err) { console.error(err); setError('Booking failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      {/* ── Package Selection ── */}
      <div style={{ marginBottom: 40 }}>
        <PageHeader title="Course Packages" sub="Select or view your enrolled course package" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 24 }}>
          {packages.filter(p => p.isActive).map(pkg => {
            const isEnrolled = user.enrolledPackage === pkg.name || userProfile?.packageId === pkg.id;
            return (
              <div key={pkg.id} style={{ ...css.card, position: 'relative', border: isEnrolled ? '2px solid #0B2545' : '1px solid #dee2e6' }}>
                {pkg.popular && <div style={{ position: 'absolute', top: -12, left: 24, background: '#0B2545', color: '#000', fontSize: 10, fontWeight: 900, padding: '4px 12px', borderRadius: 12 }}>POPULAR</div>}
                {isEnrolled && <div style={{ position: 'absolute', top: 12, right: 12, background: '#10b981', color: '#fff', fontSize: 10, fontWeight: 900, padding: '4px 8px', borderRadius: 12 }}>ENROLLED</div>}
                
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111c2d' }}>{pkg.name}</h3>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#0B2545', margin: '12px 0' }}>{fmtLKR(pkg.price)}</div>
                <div style={{ fontSize: 12, color: '#505f76', marginBottom: 20 }}>{pkg.duration} • {pkg.vehicleType}</div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', fontSize: 13, color: '#434655' }}>
                  {(pkg.features || []).map((f, i) => <li key={i} style={{ marginBottom: 8 }}>✓ {f}</li>)}
                </ul>
                <button
                  onClick={() => handleEnroll(pkg)}
                  disabled={isEnrolled || enrolling === pkg.id}
                  style={isEnrolled ? { ...css.primaryBtn, background: '#dee2e6', color: '#737686' } : css.primaryBtn}
                  className={!isEnrolled ? 'accent-btn' : ''}
                >
                  {isEnrolled ? 'Current Package' : enrolling === pkg.id ? 'Enrolling...' : 'Enroll Now'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #dee2e6', margin: '40px 0' }}></div>

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
            <input type="date" style={css.formInput} value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div>
            <label style={css.formLabel}>Time Slot</label>
            <select style={css.formInput} value={timeSlot} onChange={e => setTimeSlot(e.target.value)} required>
              <option value="">Select Time</option>
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading} style={{ ...css.primaryBtn, marginTop: 28, width: 'auto', padding: '0 32px' }} className="accent-btn">
          {loading ? 'Booking...' : 'Confirm Booking'}
        </button>
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
          const { day, month, weekday } = fmtDate(b.date);
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
                    <div style={{ fontSize: 12, color: "#505f76" }}>{b.timeSlot} · {resolveInstructor(b)}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", border: `1px solid ${b.status === "completed" ? "#16a34a" : b.status === "confirmed" ? "#1d4ed8" : "#c3c6d7"}`, color: b.status === "completed" ? "#16a34a" : b.status === "confirmed" ? "#60a5fa" : "#505f76" }}>
                    {b.status}
                  </span>
                </div>
                {b.feedback && (
                  <div style={{ marginTop: 10, padding: "10px 14px", background: "#dee2e6", borderLeft: "3px solid #0B2545", fontSize: 12, color: "#505f76", lineHeight: 1.5 }}>
                    💬 {b.feedback}
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

  const isProfileFilled = userProfile?.nic && userProfile?.dob && userProfile?.address && userProfile?.emergencyContact;
  const isApproved = userProfile?.status === 'approved';

  if (!isProfileFilled) {
    return (
      <div style={{ maxWidth: 800 }}>
        <PageHeader title="Profile Incomplete" sub="Please complete your profile to access this feature." />
        <div style={css.card}>
          <p style={{ color: '#ba1a1a', fontWeight: 'bold', marginBottom: 16 }}>You must fill in your NIC, Date of Birth, Address, and Emergency Contact in your profile before you can proceed.</p>
          <button onClick={() => goTo('/student/profile')} style={css.primaryBtn}>Go to Profile</button>
        </div>
      </div>
    );
  }

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

  const handlePay = async (e) => {
    e.preventDefault();
    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) return setError('Invalid amount');
    if (!reference) return setError('Please enter the reference number');
    if (!receiptFile) return setError('Please upload a receipt photo');

    setLoading(true); setError(''); setSuccess('');
    try {
      // Upload receipt photo to Firebase Storage
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `receipts/${currentUser.uid}_${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, receiptFile);
      const receiptUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'payments'), {
        studentId: currentUser.uid, 
        studentName: user.name, 
        amount: payAmt, 
        method: 'online_transfer',
        reference: reference,
        receiptUrl: receiptUrl,
        status: 'pending', 
        date: new Date().toISOString()
      });
      
      setSuccess('Payment submitted! Awaiting admin approval.');
      setTimeout(() => { 
        setSuccess(''); 
        setAmount(''); 
        setReference('');
        setReceiptFile(null);
        setTab('history'); 
      }, 2500);
    } catch (err) { 
      console.error(err); 
      setError('Payment submission failed.'); 
    }
    finally { setLoading(false); }
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
              <label style={css.formLabel}>Reference Number</label>
              <input type="text" style={css.formInput} value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. REF123456789" required />
            </div>
            <div>
              <label style={css.formLabel}>Receipt Photo</label>
              <input type="file" accept="image/*" style={css.formInput} onChange={e => setReceiptFile(e.target.files[0])} required />
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
                <div style={{ fontSize: 14, fontWeight: 800, color: '#111c2d' }}>{p.method.replace('_', ' ').toUpperCase()} Payment</div>
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
function ProgressPage({ user, past, skills }) {
  const progress = user.progress;
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
