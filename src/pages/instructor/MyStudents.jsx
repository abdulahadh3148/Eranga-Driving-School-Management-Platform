import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Users, Phone, Search, Eye, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './MyStudents.css';

export default function MyStudents() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const fetchStudents = async () => {
      try {
        const bookQ = query(collection(db, 'bookings'), where('instructorId', '==', currentUser.uid));
        const bookSnap = await getDocs(bookQ);
        
        const studentIds = [...new Set(bookSnap.docs.map(d => d.data().studentId))].filter(Boolean);
        
        if (studentIds.length === 0) {
          setStudents([]);
          setLoading(false);
          return;
        }

        const batchSize = 30;
        const allStudents = [];
        for (let i = 0; i < studentIds.length; i += batchSize) {
          const batch = studentIds.slice(i, i + batchSize);
          const stuQ = query(collection(db, 'users'), where('__name__', 'in', batch));
          const stuSnap = await getDocs(stuQ);
          stuSnap.docs.forEach(d => {
            // Find recent booking to get vehicle & status info if possible
            const studentBookings = bookSnap.docs.filter(b => b.data().studentId === d.id).map(b => b.data());
            const latestBooking = studentBookings.sort((a,b) => new Date(b.date) - new Date(a.date))[0];
            
            allStudents.push({ 
              id: d.id, 
              ...d.data(),
              vehicle: latestBooking?.vehicleType || 'Car',
              status: d.data().role === 'student' ? 'ongoing' : 'completed'
            });
          });
        }
        setStudents(allStudents);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [currentUser]);

  const filteredStudents = students.filter(s => {
    const term = searchTerm.toLowerCase();
    return (s.name || '').toLowerCase().includes(term) || (s.phone || '').includes(term);
  });

  if (loading) {
    return <div className="students-loading">Loading students...</div>;
  }

  return (
    <div className="students-page-wrapper">
      <h1 className="students-page-title">My Students</h1>
      <p className="students-page-subtitle">Quickly view and contact your assigned students.</p>

      {/* Search Bar */}
      <div className="students-search-container">
        <Search size={18} className="students-search-icon" />
        <input 
          type="text" 
          className="students-search-input" 
          placeholder="Search by name or phone number..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {students.length === 0 ? (
        <div className="students-empty">
          <Users size={40} color="#d1d5db" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
          <div>No students assigned yet.</div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="students-empty">
          <div>No students match your search.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredStudents.map(s => (
            <div key={s.id} className="student-page-card" onClick={() => navigate(`/instructor/students/${s.id}`)}>
              {/* Top: Avatar + Name */}
              <div className="student-card-top">
                <div className="student-avatar">
                  {s.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <div className="student-card-name">{s.name || 'Student'}</div>
                  <div className="student-card-package">
                    <Phone size={12} color="#6b7280" /> {s.phone || 'No phone'}
                  </div>
                </div>
              </div>

              {/* Tags Row */}
              <div className="student-tags-row">
                <span className="student-tag tag-gray">{s.packageId || 'Standard Level'}</span>
                <span className="student-tag tag-gray">{s.vehicle || 'Car'}</span>
                <span className={`student-tag ${s.status === 'completed' ? 'tag-completed' : 'tag-ongoing'}`}>
                  {s.status}
                </span>
              </div>

              {/* Actions Row */}
              <div className="student-actions-row" onClick={e => e.stopPropagation()}>
                {s.phone && (
                  <a href={`tel:${s.phone}`} className="student-action-btn btn-call">
                    <Phone size={16} /> Call
                  </a>
                )}
                <button 
                  className="student-action-btn btn-view"
                  onClick={() => navigate(`/instructor/students/${s.id}`)}
                >
                  <Eye size={16} /> View Details
                </button>
                <button 
                  className="student-action-btn btn-view"
                  onClick={() => navigate(`/instructor/schedule`)}
                >
                  <Calendar size={16} /> Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
