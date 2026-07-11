import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createSessionProgress } from '../../firebase/helpers';
import './MarkSession.css';

const MarkSession = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [attendance, setAttendance] = useState('present');
  const [skills, setSkills] = useState({
    'Clutch Control': false,
    'Forward Driving': false,
    'Reverse Driving': false,
    'Turning': false,
    'Road Rules': false,
    'Proper Stopping': false,
    'Forward Balance': false,
    'Signal Usage': false,
    'Figure-8 Practice': false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSkillChange = (field) => {
    setSkills((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        studentId,
        instructorId: currentUser.uid,
        sessionId: `session_${Date.now()}`,
        date: new Date().toISOString(),
        attendance,
        skills,
        performance: 'Good', // placeholder, could be extended later
        notes: ''
      };
      await createSessionProgress(payload);
      navigate('/instructor'); // back to instructor dashboard or sessions list
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mark-session-wrapper">
      <h2 className="page-title">Mark Student Session</h2>
      {error && <div className="error-banner">{error}</div>}
      <form className="mark-session-form" onSubmit={handleSubmit}>
        {/* Attendance */}
        <div className="form-group">
          <label>Attendance</label>
          <select value={attendance} onChange={(e) => setAttendance(e.target.value)} disabled={loading}>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        {/* Car Skills */}
        <fieldset className="skill-group">
          <legend>Car Skills</legend>
          <label>
            <input type="checkbox" checked={skills['Clutch Control']} onChange={() => handleSkillChange('Clutch Control')} disabled={loading} />
            Clutch Control
          </label>
          <label>
            <input type="checkbox" checked={skills['Forward Driving']} onChange={() => handleSkillChange('Forward Driving')} disabled={loading} />
            Forward Driving
          </label>
          <label>
            <input type="checkbox" checked={skills['Reverse Driving']} onChange={() => handleSkillChange('Reverse Driving')} disabled={loading} />
            Reverse Driving
          </label>
          <label>
            <input type="checkbox" checked={skills['Turning']} onChange={() => handleSkillChange('Turning')} disabled={loading} />
            Turning
          </label>
          <label>
            <input type="checkbox" checked={skills['Proper Stopping']} onChange={() => handleSkillChange('Proper Stopping')} disabled={loading} />
            Proper Stopping
          </label>
          <label>
            <input type="checkbox" checked={skills['Road Rules']} onChange={() => handleSkillChange('Road Rules')} disabled={loading} />
            Road Rules
          </label>
        </fieldset>

        {/* Bike Skills */}
        <fieldset className="skill-group">
          <legend>Bike Skills</legend>
          <label>
            <input type="checkbox" checked={skills['Forward Balance']} onChange={() => handleSkillChange('Forward Balance')} disabled={loading} />
            Forward Balance
          </label>
          <label>
            <input type="checkbox" checked={skills['Signal Usage']} onChange={() => handleSkillChange('Signal Usage')} disabled={loading} />
            Signal Usage
          </label>
          <label>
            <input type="checkbox" checked={skills['Figure-8 Practice']} onChange={() => handleSkillChange('Figure-8 Practice')} disabled={loading} />
            Figure‑8 Practice
          </label>
        </fieldset>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Saving...' : 'Submit Session'}
        </button>
      </form>
    </div>
  );
};

export default MarkSession;
