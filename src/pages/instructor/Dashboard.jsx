import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Car,
  CalendarClock,
  Zap,
  Loader2,
  CalendarOff,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

/* ─── Theme Tokens ────────────────────────────────────────────── */
const T = {
  cardBg: '#0e1420',
  border: '#1c2540',
  textPrimary: '#f0f0f0',
  textMuted: '#5a6a7a',
  green: '#00e676',
  amber: '#ffab00',
  red: '#ff5252',
  radius: 16,
};

/* ─── Reusable tiny helpers ───────────────────────────────────── */
const statusColor = (s) => {
  if (s === 'completed') return '#6b7280';
  if (s === 'confirmed') return T.green;
  return T.amber; // pending or anything else
};

const statusLabel = (s) => {
  if (s === 'completed') return 'Completed';
  if (s === 'confirmed') return 'Confirmed';
  return 'Pending';
};

/** Parse a booking into a sortable timestamp. Handles "HH:MM" and "HH:MM - HH:MM" style timeSlots. */
const bookingToDate = (b) => {
  try {
    const startTime = (b.timeSlot || '00:00').split('-')[0].trim();
    return new Date(`${b.date}T${startTime}`);
  } catch {
    return new Date(`${b.date}T00:00`);
  }
};

/* ─── Animations ──────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' } }),
};

/* ─── Component ───────────────────────────────────────────────── */
export default function InstructorDashboard() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date());

  /* ── Live clock (for countdown) ─────────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Fetch today's bookings ─────────────────────────────────── */
  useEffect(() => {
    if (!currentUser) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        const today = new Date().toISOString().split('T')[0];

        const q = query(
          collection(db, 'bookings'),
          where('instructorId', '==', currentUser.uid),
          where('date', '==', today),
        );

        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => bookingToDate(a) - bookingToDate(b));

        setBookings(data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError("Unable to load today's sessions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [currentUser]);

  /* ── Derived stats ──────────────────────────────────────────── */
  const stats = useMemo(() => {
    const done = bookings.filter((b) => b.status === 'completed').length;
    const remaining = bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length;
    const pendingUpdates = bookings.filter(
      (b) => b.status === 'completed' && (!b.instructorNotes || b.instructorNotes.trim() === ''),
    ).length;
    return { done, remaining, pendingUpdates };
  }, [bookings]);

  /* ── Next upcoming session ──────────────────────────────────── */
  const nextSession = useMemo(() => {
    const upcoming = bookings.filter(
      (b) => (b.status === 'confirmed' || b.status === 'pending') && bookingToDate(b) >= new Date(),
    );
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [bookings]);

  /* ── Countdown string ───────────────────────────────────────── */
  const countdown = useMemo(() => {
    if (!nextSession) return null;
    const diff = bookingToDate(nextSession) - now;
    if (diff <= 0) return 'Starting now';
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }, [nextSession, now]);

  /* ── Greeting ───────────────────────────────────────────────── */
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = userProfile?.name?.split(' ')[0] || 'Instructor';

  /* ─── STYLES ────────────────────────────────────────────────── */
  const s = {
    wrapper: {
      padding: '4px 0',
      maxWidth: 800,
      margin: '0 auto',
    },
    greeting: {
      color: T.textPrimary,
      fontSize: 22,
      fontWeight: 700,
      margin: 0,
    },
    greetingSub: {
      color: T.textMuted,
      fontSize: 14,
      marginTop: 4,
    },

    /* Status Tiles */
    tilesScroll: {
      display: 'flex',
      gap: 12,
      overflowX: 'auto',
      paddingBottom: 4,
      scrollbarWidth: 'none',
      WebkitOverflowScrolling: 'touch',
    },
    tile: (accentColor) => ({
      flex: '1 0 140px',
      minWidth: 140,
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderLeft: `4px solid ${accentColor}`,
      borderRadius: T.radius,
      padding: '18px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }),
    tileIcon: (accentColor) => ({
      width: 36,
      height: 36,
      borderRadius: 10,
      background: `${accentColor}18`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: accentColor,
    }),
    tileNum: {
      fontSize: 28,
      fontWeight: 800,
      color: T.textPrimary,
      lineHeight: 1,
    },
    tileLabel: {
      fontSize: 12,
      fontWeight: 600,
      color: T.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },

    /* Hero Card */
    heroCard: {
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: T.radius,
      padding: '24px 20px',
      position: 'relative',
      overflow: 'hidden',
    },
    heroGlow: {
      position: 'absolute',
      top: -1,
      left: -1,
      right: -1,
      height: 3,
      background: `linear-gradient(90deg, ${T.green}, ${T.green}88, transparent)`,
      borderRadius: `${T.radius}px ${T.radius}px 0 0`,
    },
    heroTitle: {
      fontSize: 13,
      fontWeight: 700,
      color: T.green,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    heroStudentName: {
      fontSize: 22,
      fontWeight: 700,
      color: T.textPrimary,
      margin: 0,
    },
    heroMeta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px 20px',
      marginTop: 12,
    },
    heroMetaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      color: T.textMuted,
    },
    heroCountdown: {
      marginTop: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 14,
      color: T.amber,
      fontWeight: 600,
    },
    startBtn: {
      display: 'block',
      width: '100%',
      marginTop: 20,
      padding: '14px 0',
      background: T.green,
      color: '#0a0f18',
      fontSize: 15,
      fontWeight: 800,
      border: 'none',
      borderRadius: 12,
      cursor: 'pointer',
      textAlign: 'center',
      textDecoration: 'none',
      letterSpacing: 0.5,
      transition: 'opacity .2s',
    },
    heroEmpty: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 0',
      gap: 12,
    },

    /* Schedule List */
    scheduleCard: {
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: T.radius,
      padding: '20px 16px',
    },
    scheduleTitle: {
      fontSize: 15,
      fontWeight: 700,
      color: T.textPrimary,
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 12px',
      borderRadius: 12,
      cursor: 'pointer',
      transition: 'background .2s',
      borderBottom: `1px solid ${T.border}`,
    },
    rowLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      flex: 1,
      minWidth: 0,
    },
    rowTime: {
      fontSize: 13,
      fontWeight: 700,
      color: T.textPrimary,
      minWidth: 56,
      flexShrink: 0,
    },
    rowName: {
      fontSize: 14,
      fontWeight: 600,
      color: T.textPrimary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    badge: (bg) => ({
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      color: '#0a0f18',
      background: bg,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      flexShrink: 0,
    }),
    chevron: {
      color: T.textMuted,
      flexShrink: 0,
      marginLeft: 8,
    },

    /* Error / Loading */
    center: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 0',
      flexDirection: 'column',
      gap: 12,
    },
    errorBox: {
      background: `${T.red}15`,
      border: `1px solid ${T.red}40`,
      borderRadius: 12,
      padding: '14px 18px',
      color: T.red,
      fontSize: 14,
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
  };

  /* ─── RENDER ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={s.center}>
        <Loader2 size={32} color={T.textMuted} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: T.textMuted, fontSize: 14 }}>Loading your dashboard…</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={s.wrapper}>
      {/* ─── Greeting ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} style={{ marginBottom: 24 }}>
        <h1 style={s.greeting}>
          {greeting}, {firstName}
        </h1>
        <p style={s.greetingSub}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* ─── Error Banner ─────────────────────────────────────── */}
      {error && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0.5} style={{ marginBottom: 20 }}>
          <div style={s.errorBox}>
            <AlertCircle size={18} />
            {error}
          </div>
        </motion.div>
      )}

      {/* ─── Status Tiles ─────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1} style={{ marginBottom: 24 }}>
        <div style={s.tilesScroll}>
          {/* Done Today */}
          <div style={s.tile(T.green)}>
            <div style={s.tileIcon(T.green)}>
              <CheckCircle2 size={18} />
            </div>
            <span style={s.tileNum}>{stats.done}</span>
            <span style={s.tileLabel}>Done Today</span>
          </div>

          {/* Remaining */}
          <div style={s.tile(T.amber)}>
            <div style={s.tileIcon(T.amber)}>
              <Clock size={18} />
            </div>
            <span style={s.tileNum}>{stats.remaining}</span>
            <span style={s.tileLabel}>Remaining</span>
          </div>

          {/* Pending Updates */}
          <div style={s.tile(T.red)}>
            <div style={s.tileIcon(T.red)}>
              <AlertCircle size={18} />
            </div>
            <span style={s.tileNum}>{stats.pendingUpdates}</span>
            <span style={s.tileLabel}>Pending Updates</span>
          </div>
        </div>
      </motion.div>

      {/* ─── Next Session Hero ────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2} style={{ marginBottom: 24 }}>
        <div style={s.heroCard}>
          <div style={s.heroGlow} />
          <div style={s.heroTitle}>
            <Zap size={14} /> Next Session
          </div>

          {nextSession ? (
            <>
              <p style={s.heroStudentName}>{nextSession.studentName || 'Student'}</p>

              <div style={s.heroMeta}>
                <span style={s.heroMetaItem}>
                  <Clock size={14} color={T.textMuted} />
                  {nextSession.timeSlot || '—'}
                </span>
                <span style={s.heroMetaItem}>
                  <Car size={14} color={T.textMuted} />
                  {nextSession.vehicleType || nextSession.vehicle || 'Manual'}
                </span>
                <span style={s.heroMetaItem}>
                  <CalendarClock size={14} color={T.textMuted} />
                  {nextSession.sessionType || nextSession.lessonType || 'Driving Lesson'}
                </span>
              </div>

              {countdown && (
                <div style={s.heroCountdown}>
                  <Clock size={15} />
                  {countdown === 'Starting now' ? 'Starting now!' : `Starts in ${countdown}`}
                </div>
              )}

              <Link
                to={`/instructor/active-session?id=${nextSession.id}`}
                style={s.startBtn}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.85)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
              >
                START SESSION
              </Link>
            </>
          ) : (
            <div style={s.heroEmpty}>
              <CalendarOff size={36} color={T.textMuted} />
              <span style={{ color: T.textMuted, fontSize: 14, fontWeight: 500 }}>
                No upcoming sessions scheduled today
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Today's Full Schedule ────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}>
        <div style={s.scheduleCard}>
          <div style={s.scheduleTitle}>
            <CalendarClock size={16} color={T.green} />
            Today's Schedule
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: T.textMuted }}>
              {bookings.length} session{bookings.length !== 1 ? 's' : ''}
            </span>
          </div>

          {bookings.length === 0 ? (
            <div style={{ ...s.heroEmpty, padding: '24px 0' }}>
              <CalendarOff size={28} color={T.textMuted} />
              <span style={{ color: T.textMuted, fontSize: 13 }}>No sessions for today</span>
            </div>
          ) : (
            bookings.map((b, i) => {
              const color = statusColor(b.status);
              const label = statusLabel(b.status);
              const displayTime = (b.timeSlot || '—').split('-')[0].trim();

              return (
                <motion.div
                  key={b.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={3 + i * 0.15}
                  style={{
                    ...s.row,
                    ...(i === bookings.length - 1 ? { borderBottom: 'none' } : {}),
                  }}
                  onClick={() => navigate(`/instructor/sessions?id=${b.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = `${T.border}60`)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={s.rowLeft}>
                    <span style={s.rowTime}>{displayTime}</span>
                    <span style={s.rowName}>{b.studentName || 'Student'}</span>
                  </div>
                  <span style={s.badge(color)}>{label}</span>
                  <ChevronRight size={16} style={s.chevron} />
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
