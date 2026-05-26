import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, addDoc, collection, increment } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, CheckCircle, CheckCircle2,
  Star, Clock, AlertTriangle, Loader2
} from 'lucide-react';

// ─── Theme Constants ───────────────────────────────────────────
const COLORS = {
  bg: 'transparent',
  card: '#0e1420',
  cardBorder: '#1c2540',
  green: '#00e676',
  greenDim: 'rgba(0,230,118,0.12)',
  amber: '#ffab00',
  amberDim: 'rgba(255,171,0,0.12)',
  red: '#ff5252',
  redDim: 'rgba(255,82,82,0.12)',
  text: '#f0f0f0',
  muted: '#5a6a7a',
  inputBg: '#0a0f18',
  inputBorder: '#1c2540',
  ring: '#1a2236',
};

const SKILLS = [
  'Steering', 'Clutch Control', 'Braking', 'Parking',
  'Observation', 'Hill Start', 'Reversing', 'Emergency Stop',
];

// ─── Helpers ───────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');
const formatTime = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

// ─── SVG Progress Ring ─────────────────────────────────────────
function ProgressRing({ percent }) {
  const radius = 54;
  const stroke = 7;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '24px 0 8px' }}>
      <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          stroke={COLORS.ring}
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress ring */}
        <motion.circle
          stroke={COLORS.green}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      {/* Percentage label in center */}
      <div style={{
        marginTop: -(radius + 18),
        fontSize: 22,
        fontWeight: 800,
        color: percent === 100 ? COLORS.green : COLORS.text,
        letterSpacing: '-0.5px',
        height: radius * 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {Math.round(percent)}%
      </div>
      <p style={{ color: COLORS.muted, fontSize: 13, marginTop: 2, fontWeight: 500 }}>
        Skills Completed
      </p>
    </div>
  );
}

// ─── Star Rating ───────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.18 }}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            size={36}
            fill={(hovered || value) >= star ? COLORS.amber : '#2a3040'}
            color={(hovered || value) >= star ? COLORS.amber : '#2a3040'}
            strokeWidth={1.5}
          />
        </motion.button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
export default function ActiveSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('id');
  const { currentUser } = useAuth();

  // ── Data state ──
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Timer state ──
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const intervalRef = useRef(null);

  // ── Skills state ──
  const [checkedSkills, setCheckedSkills] = useState({});

  // ── Feedback state ──
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const MAX_CHARS = 500;

  // ── Submit state ──
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Fetch booking on mount ──
  useEffect(() => {
    if (!currentUser) return;

    if (!bookingId) {
      setError('No session ID provided. Please go back and select a session.');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'bookings', bookingId));
        if (!docSnap.exists()) {
          setError('Session not found. The booking may have been deleted.');
          setLoading(false);
          return;
        }
        const data = docSnap.data();
        if (data.instructorId !== currentUser.uid) {
          setError('Access denied. This session belongs to another instructor.');
          setLoading(false);
          return;
        }
        setBooking({ id: docSnap.id, ...data });
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Failed to load session data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [currentUser, bookingId]);

  // ── Timer logic ──
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const toggleTimer = useCallback(() => {
    if (!running && !timerStarted) {
      setTimerStarted(true);
      setSessionStartTime(new Date());
    }
    setRunning((prev) => !prev);
  }, [running, timerStarted]);

  // ── Skills toggle ──
  const toggleSkill = useCallback((skill) => {
    setCheckedSkills((prev) => ({ ...prev, [skill]: !prev[skill] }));
  }, []);

  const checkedCount = Object.values(checkedSkills).filter(Boolean).length;
  const skillPercent = (checkedCount / SKILLS.length) * 100;
  const canComplete = timerStarted && checkedCount >= 1 && !submitting;

  // ── Complete session ──
  const handleComplete = async () => {
    if (!canComplete || !booking) return;
    setSubmitting(true);

    // Pause the timer
    setRunning(false);

    const completedSkills = SKILLS.filter((s) => checkedSkills[s]);

    try {
      // 1. Update booking document
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'completed',
        instructorNotes: feedback,
        rating: rating,
        skillsChecked: completedSkills,
        duration: seconds,
        completedAt: new Date().toISOString(),
      });

      // 2. Increment student's classesCompleted and progress
      if (booking.studentId) {
        await updateDoc(doc(db, 'users', booking.studentId), {
          classesCompleted: increment(1),
          progress: increment(5),
        });
      }

      // 3. Create notification for the student
      if (booking.studentId) {
        await addDoc(collection(db, 'notifications'), {
          userId: booking.studentId,
          studentId: booking.studentId,
          title: 'Session Completed',
          message: `Your ${booking.sessionType || 'driving'} session on ${booking.date} (${booking.timeSlot}) has been marked as completed. ${rating ? `Rating: ${rating}/5 ⭐` : ''}`,
          body: `Your ${booking.sessionType || 'driving'} session on ${booking.date} has been completed by your instructor.`,
          type: 'booking',
          icon: '🎓',
          isRead: false,
          unread: true,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      }

      setSuccess(true);
      setTimeout(() => navigate('/instructor'), 2500);
    } catch (err) {
      console.error('Error completing session:', err);
      alert('Failed to complete session. Please try again.');
      setSubmitting(false);
    }
  };

  // ── Card style helper ──
  const cardStyle = {
    background: COLORS.card,
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: 16,
    padding: '24px',
  };

  // ═══════════════════════════════════════════════════════════════
  // ─── LOADING STATE ─────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Loader2 size={36} color={COLORS.green} />
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ─── ERROR STATE ──────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  if (error) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            ...cardStyle,
            maxWidth: 420,
            textAlign: 'center',
          }}
        >
          <AlertTriangle size={48} color={COLORS.amber} style={{ margin: '0 auto 16px' }} />
          <h2 style={{ color: COLORS.text, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ color: COLORS.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            {error}
          </p>
          <button
            onClick={() => navigate('/instructor')}
            style={{
              background: COLORS.greenDim,
              color: COLORS.green,
              border: `1px solid ${COLORS.green}33`,
              borderRadius: 12,
              padding: '12px 28px',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ─── SUCCESS STATE ────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  if (success) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{
            ...cardStyle,
            maxWidth: 420,
            textAlign: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 15 }}
          >
            <CheckCircle2 size={64} color={COLORS.green} style={{ margin: '0 auto 20px' }} />
          </motion.div>
          <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Session Completed!
          </h2>
          <p style={{ color: COLORS.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
            {booking?.studentName}'s session has been marked as complete.
            <br />Student progress has been updated.
          </p>
          <p style={{ color: COLORS.muted, fontSize: 13 }}>Redirecting to dashboard…</p>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ─── MAIN RENDER ──────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={{
      background: COLORS.bg,
      minHeight: '100%',
      maxWidth: 560,
      margin: '0 auto',
      padding: '0 0 40px',
    }}>

      {/* ─── 1. SESSION HEADER ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button
            onClick={() => navigate('/instructor')}
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 12,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: COLORS.muted,
              flexShrink: 0,
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{
              color: COLORS.text,
              fontSize: 22,
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.2,
            }}>
              {booking.studentName || 'Student'}
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 6,
              flexWrap: 'wrap',
            }}>
              {/* Session type badge */}
              <span style={{
                background: COLORS.amberDim,
                color: COLORS.amber,
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {booking.sessionType || 'Driving Lesson'}
              </span>
              {/* Status badge */}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: COLORS.greenDim,
                color: COLORS.green,
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 8,
              }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: COLORS.green,
                  display: 'inline-block',
                  animation: 'pulse-dot 1.5s ease-in-out infinite',
                }} />
                In Progress
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pulse keyframes injected via style tag */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 20px rgba(0,230,118,0.15); }
          50% { text-shadow: 0 0 40px rgba(0,230,118,0.3); }
        }
      `}</style>

      {/* ─── 2. SESSION TIMER ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        style={{ ...cardStyle, textAlign: 'center', marginBottom: 20 }}
      >
        {/* Timer display */}
        <div style={{
          fontSize: 56,
          fontWeight: 800,
          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
          color: running ? COLORS.green : COLORS.text,
          letterSpacing: '2px',
          lineHeight: 1,
          marginBottom: 6,
          animation: running ? 'glow 2s ease-in-out infinite' : 'none',
          transition: 'color 0.3s ease',
        }}>
          {formatTime(seconds)}
        </div>

        {/* Start time display */}
        <p style={{
          color: COLORS.muted,
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}>
          <Clock size={14} />
          {sessionStartTime
            ? `Started at ${sessionStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Not started yet'
          }
        </p>

        {/* Start / Pause button */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.03 }}
          onClick={toggleTimer}
          style={{
            background: running ? COLORS.red : COLORS.green,
            color: running ? '#fff' : '#0a0f18',
            border: 'none',
            borderRadius: 14,
            padding: '14px 48px',
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: running
              ? `0 0 24px ${COLORS.red}44`
              : `0 0 24px ${COLORS.green}44`,
            transition: 'box-shadow 0.3s ease',
          }}
        >
          {running ? <Pause size={20} /> : <Play size={20} />}
          {running ? 'Pause' : 'Start'}
        </motion.button>
      </motion.div>

      {/* ─── 3. SKILLS CHECKLIST ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        style={{ ...cardStyle, marginBottom: 20 }}
      >
        <h3 style={{
          color: COLORS.text,
          fontSize: 16,
          fontWeight: 700,
          marginBottom: 16,
          marginTop: 0,
        }}>
          Skills Assessment
        </h3>

        {/* 2×4 Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}>
          {SKILLS.map((skill) => {
            const checked = !!checkedSkills[skill];
            return (
              <motion.button
                key={skill}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSkill(skill)}
                style={{
                  background: checked ? COLORS.greenDim : COLORS.inputBg,
                  border: `1.5px solid ${checked ? COLORS.green : COLORS.inputBorder}`,
                  borderRadius: 12,
                  padding: '14px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.25s ease',
                }}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: checked ? 1 : 0.85,
                    opacity: checked ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <CheckCircle
                    size={20}
                    color={checked ? COLORS.green : COLORS.muted}
                    fill={checked ? COLORS.green : 'transparent'}
                  />
                </motion.div>
                <span style={{
                  color: checked ? COLORS.green : COLORS.muted,
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'color 0.25s ease',
                  textAlign: 'left',
                }}>
                  {skill}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* SVG Progress Ring */}
        <ProgressRing percent={skillPercent} />
      </motion.div>

      {/* ─── 4. FEEDBACK & RATING ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        style={{ ...cardStyle, marginBottom: 20 }}
      >
        <h3 style={{
          color: COLORS.text,
          fontSize: 16,
          fontWeight: 700,
          marginBottom: 16,
          marginTop: 0,
        }}>
          Session Rating
        </h3>

        {/* Star rating */}
        <StarRating value={rating} onChange={setRating} />

        {rating > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center',
              color: COLORS.amber,
              fontSize: 13,
              fontWeight: 600,
              marginTop: 8,
              marginBottom: 0,
            }}
          >
            {rating === 1 && 'Needs Improvement'}
            {rating === 2 && 'Below Average'}
            {rating === 3 && 'Average'}
            {rating === 4 && 'Good Performance'}
            {rating === 5 && 'Excellent!'}
          </motion.p>
        )}

        {/* Feedback textarea */}
        <div style={{ marginTop: 20 }}>
          <label style={{
            display: 'block',
            color: COLORS.muted,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 8,
          }}>
            Instructor Notes
          </label>
          <textarea
            rows={4}
            value={feedback}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) setFeedback(e.target.value);
            }}
            placeholder="Add feedback about the student's performance, areas to improve, observations…"
            style={{
              width: '100%',
              background: COLORS.inputBg,
              border: `1.5px solid ${COLORS.inputBorder}`,
              borderRadius: 12,
              color: COLORS.text,
              fontSize: 14,
              padding: '14px 16px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              boxSizing: 'border-box',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = COLORS.green;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = COLORS.inputBorder;
            }}
          />
          <p style={{
            color: feedback.length >= MAX_CHARS ? COLORS.amber : COLORS.muted,
            fontSize: 12,
            fontWeight: 500,
            textAlign: 'right',
            marginTop: 6,
            transition: 'color 0.2s ease',
          }}>
            {feedback.length}/{MAX_CHARS}
          </p>
        </div>
      </motion.div>

      {/* ─── 5. COMPLETE SESSION BUTTON ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
      >
        <motion.button
          whileTap={canComplete ? { scale: 0.97 } : {}}
          whileHover={canComplete ? { scale: 1.01 } : {}}
          onClick={handleComplete}
          disabled={!canComplete}
          style={{
            width: '100%',
            padding: '18px 24px',
            borderRadius: 16,
            border: 'none',
            background: canComplete ? COLORS.green : `${COLORS.green}22`,
            color: canComplete ? '#0a0f18' : `${COLORS.green}66`,
            fontSize: 16,
            fontWeight: 800,
            cursor: canComplete ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: canComplete ? `0 4px 24px ${COLORS.green}33` : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          {submitting ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{ display: 'flex' }}
              >
                <Loader2 size={20} />
              </motion.span>
              Completing…
            </>
          ) : (
            <>
              <CheckCircle2 size={20} />
              Mark Session Complete
            </>
          )}
        </motion.button>

        {/* Helper text when button is disabled */}
        <AnimatePresence>
          {!canComplete && !submitting && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                color: COLORS.muted,
                fontSize: 12,
                textAlign: 'center',
                marginTop: 10,
                fontWeight: 500,
              }}
            >
              {!timerStarted
                ? 'Start the timer to enable session completion'
                : 'Check at least 1 skill to complete the session'}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
