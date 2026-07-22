import { db } from './config';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Skill definitions by vehicle type.
 * Used by both instructor UI and admin dashboard.
 */
export const CAR_SKILLS = [
  'Clutch Control',
  'Forward Driving',
  'Reverse Driving',
  'Turning',
  'Road Rules',
  'Proper Stopping'
];

export const BIKE_SKILLS = [
  'Forward Balance',
  'Signal Usage',
  'Figure-8 Practice',
  'Road Rules'
];

export const ALL_SKILLS = [...new Set([...CAR_SKILLS, ...BIKE_SKILLS])];

/**
 * Returns the correct skill list based on vehicle type string.
 */
export function getSkillsForVehicle(vehicleType) {
  if (!vehicleType) return CAR_SKILLS;
  const t = vehicleType.toLowerCase();
  if (t.includes('bike') || t.includes('motorcycle') || t.includes('motor')) {
    return BIKE_SKILLS;
  }
  return CAR_SKILLS;
}

/**
 * Validates a session_progress payload before writing to Firestore.
 * Throws an error string if validation fails.
 */
export function validateSessionProgress(payload) {
  const errors = [];

  if (!payload.studentId) errors.push('studentId is required');
  if (!payload.instructorId) errors.push('instructorId is required');
  if (!payload.sessionId) errors.push('sessionId is required');
  if (!payload.date) errors.push('date is required');

  if (!['present', 'absent'].includes(payload.attendance)) {
    errors.push('attendance must be "present" or "absent"');
  }

  if (!['Good', 'Average', 'Needs Improvement'].includes(payload.performance)) {
    errors.push('performance must be "Good", "Average", or "Needs Improvement"');
  }

  if (!payload.skills || typeof payload.skills !== 'object') {
    errors.push('skills must be an object');
  }

  if (errors.length > 0) {
    throw new Error('Validation failed: ' + errors.join(', '));
  }
}

/**
 * Checks for duplicate session_progress entries.
 * Duplicate = same studentId + sessionId + date.
 */
async function checkDuplicate(studentId, sessionId, date) {
  const q = query(
    collection(db, 'session_progress'),
    where('studentId', '==', studentId),
    where('sessionId', '==', sessionId),
    where('date', '==', date)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

/**
 * Creates a new session_progress document in Firestore.
 * Validates payload and checks for duplicates before writing.
 * Returns the new document ID.
 */
export async function createSessionProgress(payload) {
  // Validate
  validateSessionProgress(payload);

  // Check duplicate
  const isDuplicate = await checkDuplicate(
    payload.studentId,
    payload.sessionId,
    payload.date
  );
  if (isDuplicate) {
    throw new Error('Duplicate session entry: A progress record already exists for this student, session, and date.');
  }

  // Write to Firestore
  const docRef = await addDoc(collection(db, 'session_progress'), {
    studentId: payload.studentId,
    instructorId: payload.instructorId,
    sessionId: payload.sessionId,
    studentPackageId: payload.studentPackageId || null,
    date: payload.date,
    attendance: payload.attendance,
    skills: payload.skills,
    performance: payload.performance,
    notes: payload.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Update student_packages document if provided
  if (payload.studentPackageId) {
    const pkgRef = doc(db, 'student_packages', payload.studentPackageId);
    const pkgSnap = await getDoc(pkgRef);
    if (pkgSnap.exists()) {
      const pkgData = pkgSnap.data();
      let updatedCompletedClasses = pkgData.completed_classes || 0;
      
      // Only increment classes if attendance is present
      if (payload.attendance === 'present') {
        updatedCompletedClasses += 1;
      }
      
      let updatedSkills = pkgData.skills || [];
      // payload.skills is an object { "Skill Name": true/false }
      updatedSkills = updatedSkills.map(skill => {
        if (payload.skills[skill.name]) {
          return { ...skill, done: true };
        }
        return skill;
      });

      await updateDoc(pkgRef, {
        completed_classes: updatedCompletedClasses,
        skills: updatedSkills
      });
    }
  }

  return docRef.id;
}

/**
 * Fetches all session_progress entries for a given student.
 * Used by the Admin dashboard to calculate progress.
 */
export async function fetchStudentProgress(studentId) {
  const q = query(
    collection(db, 'session_progress'),
    where('studentId', '==', studentId)
  );
  const snap = await getDocs(q);
  const sessions = [];
  snap.forEach((doc) => {
    sessions.push({ id: doc.id, ...doc.data() });
  });
  // Sort by date ascending (oldest first) so progress shows chronologically if needed
  sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
  return sessions;
}

/**
 * Predefined training schedules for automatic schedule generation on onboarding.
 */
export const PREDEFINED_SCHEDULES = {
  'Car Manual': [
    { sessionOrder: 1, sessionTitle: 'Basic Controls (Steering, Clutch, Gear)' },
    { sessionOrder: 2, sessionTitle: 'Starting & Stopping' },
    { sessionOrder: 3, sessionTitle: 'Gear Control Practice' },
    { sessionOrder: 4, sessionTitle: 'Road Driving - Level 1' },
    { sessionOrder: 5, sessionTitle: 'Road Driving - Level 2' },
    { sessionOrder: 6, sessionTitle: 'Parking Practice' },
    { sessionOrder: 7, sessionTitle: 'Reverse Driving' },
    { sessionOrder: 8, sessionTitle: 'Traffic Rules Practical' },
  ],
  'Car Auto': [
    { sessionOrder: 1, sessionTitle: 'Basic Controls (Steering, Brakes, Accelerator)' },
    { sessionOrder: 2, sessionTitle: 'Starting & Stopping' },
    { sessionOrder: 3, sessionTitle: 'Road Driving - Level 1' },
    { sessionOrder: 4, sessionTitle: 'Road Driving - Level 2' },
    { sessionOrder: 5, sessionTitle: 'Parking Practice' },
    { sessionOrder: 6, sessionTitle: 'Reverse Driving' },
    { sessionOrder: 7, sessionTitle: 'Traffic Rules Practical' },
  ],
  'Motorcycle': [
    { sessionOrder: 1, sessionTitle: 'Basic Controls (Balance, Brakes)' },
    { sessionOrder: 2, sessionTitle: 'Starting & Stopping' },
    { sessionOrder: 3, sessionTitle: 'Figure 8 Practice' },
    { sessionOrder: 4, sessionTitle: 'Road Driving - Level 1' },
    { sessionOrder: 5, sessionTitle: 'Traffic Rules Practical' },
  ],
  'Three Wheeler': [
    { sessionOrder: 1, sessionTitle: 'Basic Controls' },
    { sessionOrder: 2, sessionTitle: 'Starting & Stopping' },
    { sessionOrder: 3, sessionTitle: 'Figure 8 Practice' },
    { sessionOrder: 4, sessionTitle: 'Road Driving - Level 1' },
    { sessionOrder: 5, sessionTitle: 'Traffic Rules Practical' },
  ],
  'Dual (Car + Bike)': [
    { sessionOrder: 1, sessionTitle: 'Motorcycle: Basic Controls (Balance, Brakes)' },
    { sessionOrder: 2, sessionTitle: 'Motorcycle: Figure 8 Practice' },
    { sessionOrder: 3, sessionTitle: 'Car: Basic Controls (Steering, Clutch, Gear)' },
    { sessionOrder: 4, sessionTitle: 'Car: Starting & Stopping' },
    { sessionOrder: 5, sessionTitle: 'Car: Gear Control Practice' },
    { sessionOrder: 6, sessionTitle: 'Car: Road Driving - Level 1' },
    { sessionOrder: 7, sessionTitle: 'Car: Parking Practice' },
    { sessionOrder: 8, sessionTitle: 'Car & Bike: Traffic Rules Practical' },
  ],
};
