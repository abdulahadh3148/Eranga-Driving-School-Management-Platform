import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { fetchStudentProgress } from '../../firebase/helpers';
import './StudentProgress.css';

const ALL_SKILLS = [
  { key: 'clutch_control', label: 'Clutch Control' },
  { key: 'gear_control', label: 'Gear Control' },
  { key: 'forward', label: 'Forward Driving' },
  { key: 'reverse', label: 'Reverse Driving' },
  { key: 'stopping', label: 'Proper Stopping' },
  { key: 'road_rules', label: 'Road Rules' },
  { key: 'figure_8', label: 'Figure-8 Riding' }
];

const StudentProgress = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch student profile
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        if (studentDoc.exists()) {
          setStudent({ id: studentDoc.id, ...studentDoc.data() });
        } else {
          setError('Student not found.');
        }

        // Fetch progress sessions
        const progressData = await fetchStudentProgress(studentId);
        setSessions(progressData);
      } catch (err) {
        console.error(err);
        setError('Failed to load student progress.');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) loadData();
  }, [studentId]);

  if (loading) {
    return <div className="loading-state">Loading progress...</div>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  // Calculate stats
  const totalClasses = sessions.filter(s => s.attendance === 'present').length;
  const totalSessions = sessions.length;

  const calculateProgress = (skillKey) => {
    if (totalSessions === 0) return 0;
    const timesPracticed = sessions.filter(s => s.skills && s.skills[skillKey]).length;
    return Math.round((timesPracticed / totalSessions) * 100);
  };

  return (
    <div className="progress-container">
      <div className="progress-header">
        <Link to={`/admin/students/${studentId}`} className="back-link">
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Profile
        </Link>
        <h2 className="page-title">{student?.name || 'Student'} - Progress Report</h2>
      </div>

      <div className="summary-card">
        <div className="stat-item">
          <span className="stat-value">{totalClasses}</span>
          <span className="stat-label">Total Classes Attended</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{totalSessions}</span>
          <span className="stat-label">Total Sessions Recorded</span>
        </div>
      </div>

      <div className="skills-card">
        <h3 className="card-title">Skills Progress</h3>
        
        {totalSessions === 0 ? (
          <p className="empty-state">No sessions recorded yet.</p>
        ) : (
          <div className="skills-list">
            {ALL_SKILLS.map(skill => {
              const progress = calculateProgress(skill.key);
              return (
                <div key={skill.key} className="skill-item">
                  <div className="skill-info">
                    <span className="skill-name">{skill.label}</span>
                    <span className="skill-percentage">{progress}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProgress;
