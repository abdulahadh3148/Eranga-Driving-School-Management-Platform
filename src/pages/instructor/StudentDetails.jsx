import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ArrowLeft, Phone, MapPin, Award } from 'lucide-react';
import './StudentDetails.css';

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [stats, setStats] = useState({ completed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', id));
        if (docSnap.exists()) {
          setStudent({ id: docSnap.id, ...docSnap.data() });
        }

        // Fetch bookings for stats
        const bQ = query(collection(db, 'bookings'), where('studentId', '==', id));
        const bSnap = await getDocs(bQ);
        
        let comp = 0;
        let pend = 0;
        bSnap.forEach(d => {
          const s = d.data().status;
          if (s === 'completed') comp++;
          if (s === 'confirmed' || s === 'pending') pend++;
        });

        setStats({ completed: comp, pending: pend });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [id]);

  if (loading) return <div className="sd-loading">Loading student profile...</div>;

  if (!student) return <div className="sd-loading">Student not found.</div>;

  return (
    <div className="sd-page-wrapper">
      <div className="sd-header">
        <button onClick={() => navigate(-1)} className="sd-back-btn">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="sd-title">Student Profile</h1>
          <p className="sd-subtitle">View details and training progress</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="sd-profile-card">
        <div className="sd-avatar">
          {student.name?.charAt(0).toUpperCase() || 'S'}
        </div>
        <h2 className="sd-name">{student.name || 'Unknown'}</h2>
        <div className="sd-level">{student.packageId || 'Standard Training'}</div>

        <div className="sd-info-grid">
          <div className="sd-info-item">
            <span className="sd-info-label"><Phone size={14} /> Phone</span>
            <span className="sd-info-value">{student.phone || 'N/A'}</span>
          </div>
          <div className="sd-info-item">
            <span className="sd-info-label"><Award size={14} /> Status</span>
            <span className="sd-info-value">{student.role === 'student' ? 'Active' : 'Graduated'}</span>
          </div>
        </div>

        {student.address && (
          <div className="sd-address-row">
            <span className="sd-info-label"><MapPin size={14} /> Address</span>
            <span className="sd-info-value" style={{ fontSize: '0.875rem' }}>{student.address}</span>
          </div>
        )}
      </div>

      {/* Progress Stats */}
      <div className="sd-section-card">
        <h3 className="sd-section-title">Training Progress</h3>
        <div className="sd-stats-row">
          <div className="sd-stat-box">
            <div className="sd-stat-num">{stats.completed}</div>
            <div className="sd-stat-label">Completed</div>
          </div>
          <div className="sd-stat-box pending">
            <div className="sd-stat-num">{stats.pending}</div>
            <div className="sd-stat-label">Remaining</div>
          </div>
        </div>

        <div style={{ background: '#f3f4f6', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
          <div style={{ width: `${student.progress || 0}%`, height: '100%', background: 'linear-gradient(90deg, #22c55e, #16a34a)' }} />
        </div>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, marginTop: '0.5rem', textAlign: 'right' }}>
          {student.progress || 0}% OVERALL
        </div>
      </div>

      {/* Call Button */}
      {student.phone && (
        <a href={`tel:${student.phone}`} className="sd-call-btn">
          <Phone size={20} /> Call {student.name?.split(' ')[0] || 'Student'}
        </a>
      )}
    </div>
  );
}
