/**
 * Scheduling Engine — Pure utility module for batch-based scheduling logic.
 * No Firebase dependency. Accepts data arrays and returns results.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

export const TIME_SLOTS = [
  { id: 'S1', label: '8:00 AM – 9:00 AM',   start: '08:00', end: '09:00' },
  { id: 'S2', label: '9:00 AM – 10:00 AM',  start: '09:00', end: '10:00' },
  { id: 'S3', label: '10:00 AM – 11:00 AM', start: '10:00', end: '11:00' },
  { id: 'S4', label: '11:00 AM – 12:00 PM', start: '11:00', end: '12:00' },
  { id: 'S5', label: '1:00 PM – 2:00 PM',   start: '13:00', end: '14:00' },
  { id: 'S6', label: '2:00 PM – 3:00 PM',   start: '14:00', end: '15:00' },
  { id: 'S7', label: '3:00 PM – 4:00 PM',   start: '15:00', end: '16:00' },
  { id: 'S8', label: '4:00 PM – 5:00 PM',   start: '16:00', end: '17:00' },
];

export const TRAINING_LEVELS = [
  { id: 'L1', label: 'Clutch & Gear Control', order: 1 },
  { id: 'L2', label: 'Forward & Reverse',     order: 2 },
  { id: 'L3', label: 'Turning & Junctions',   order: 3 },
  { id: 'L4', label: 'Hill & Slope Driving',  order: 4 },
  { id: 'L5', label: 'Road Driving',          order: 5 },
  { id: 'L6', label: 'Highway & Night',       order: 6 },
];

export const VEHICLE_TYPES = ['Car', 'Van', 'Bike', 'Heavy'];

export const SCHEDULE_STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Get schedules that occupy a specific date + time slot (excluding cancelled).
 */
function getActiveSchedulesAt(existingSchedules, date, timeSlotId) {
  return existingSchedules.filter(
    (s) => s.date === date && s.timeSlotId === timeSlotId && s.status !== 'cancelled'
  );
}

/**
 * Count how many active (non-cancelled) schedules an instructor has.
 */
function getInstructorWorkload(instructorId, existingSchedules) {
  return existingSchedules.filter(
    (s) => s.instructorId === instructorId && s.status !== 'cancelled'
  ).length;
}

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Returns instructors available at a given date + slot.
 * Filters by vehicle type specialization (if instructor has vehiclePreference).
 * Sorted by lowest workload (fewest existing schedules).
 *
 * @param {Array} instructors        - All instructor records from Firestore
 * @param {Array} existingSchedules  - All schedule documents
 * @param {string} date              - ISO date string, e.g. '2026-06-20'
 * @param {string} timeSlotId        - E.g. 'S1'
 * @param {string} vehicleType       - E.g. 'Car'
 * @returns {Array} Available instructors sorted by workload (ascending)
 */
export function findAvailableInstructors(instructors, existingSchedules, date, timeSlotId, vehicleType) {
  const occupiedAt = getActiveSchedulesAt(existingSchedules, date, timeSlotId);
  const busyInstructorIds = new Set(occupiedAt.map((s) => s.instructorId));

  return instructors
    .filter((inst) => {
      // Must not be double-booked
      if (busyInstructorIds.has(inst.id)) return false;
      // Must be approved/active
      if (inst.status && inst.status !== 'approved' && inst.status !== 'active') return false;
      
      // If instructor has vehicleTypes (new array format) or vehiclePreference (legacy string)
      if (vehicleType) {
        const vType = vehicleType.toLowerCase();
        
        // New array format
        if (inst.vehicleTypes && Array.isArray(inst.vehicleTypes)) {
          if (!inst.vehicleTypes.some(vt => vt.toLowerCase() === vType)) return false;
        } 
        // Legacy string format
        else if (inst.vehiclePreference) {
          const pref = inst.vehiclePreference.toLowerCase();
          if (pref !== 'general' && !pref.includes(vType) && !vType.includes(pref)) {
            return false;
          }
        }
      }
      return true;
    })
    .sort((a, b) => {
      const workloadA = getInstructorWorkload(a.id, existingSchedules);
      const workloadB = getInstructorWorkload(b.id, existingSchedules);
      return workloadA - workloadB;
    });
}

/**
 * Returns vehicles available at a given date + slot, filtered by type.
 *
 * @param {Array} vehicles           - All vehicle records
 * @param {Array} existingSchedules  - All schedule documents
 * @param {string} date              - ISO date string
 * @param {string} timeSlotId        - E.g. 'S1'
 * @param {string} vehicleType       - E.g. 'Car'
 * @returns {Array} Available vehicles of matching type
 */
export function findAvailableVehicles(vehicles, existingSchedules, date, timeSlotId, vehicleType) {
  const occupiedAt = getActiveSchedulesAt(existingSchedules, date, timeSlotId);
  const busyVehicleIds = new Set(occupiedAt.map((s) => s.vehicleId));

  return vehicles.filter((v) => {
    if (busyVehicleIds.has(v.id)) return false;
    // Status must be active (or legacy Available)
    if (v.status !== 'active' && v.status !== 'Available') return false;
    if (vehicleType && v.type !== vehicleType) return false;
    return true;
  });
}

/**
 * Check if a specific student has a conflict at a given date + time slot.
 *
 * @param {string} studentId
 * @param {Array} existingSchedules
 * @param {string} date
 * @param {string} timeSlotId
 * @returns {boolean} true if student already has a batch at that time
 */
export function checkStudentConflict(studentId, existingSchedules, date, timeSlotId) {
  const occupiedAt = getActiveSchedulesAt(existingSchedules, date, timeSlotId);
  return occupiedAt.some(
    (s) => s.students && s.students.some((st) => st.id === studentId)
  );
}

/**
 * Full validation for creating a new batch.
 * Checks instructor, vehicle, and all student conflicts.
 *
 * @param {Object} batchData - { date, timeSlotId, instructorId, vehicleId, students: [{id}] }
 * @param {Array} existingSchedules
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateBatchCreation(batchData, existingSchedules) {
  const errors = [];
  const { date, timeSlotId, instructorId, vehicleId, students } = batchData;

  if (!date) errors.push('Date is required.');
  if (!timeSlotId) errors.push('Time slot is required.');
  if (!instructorId) errors.push('Instructor is required.');
  if (!vehicleId) errors.push('Vehicle is required.');
  if (!students || students.length === 0) errors.push('At least one student is required.');

  if (errors.length > 0) return { valid: false, errors };

  const occupiedAt = getActiveSchedulesAt(existingSchedules, date, timeSlotId);

  // Check instructor conflict
  if (occupiedAt.some((s) => s.instructorId === instructorId)) {
    errors.push('This instructor is already booked at this date and time.');
  }

  // Check vehicle conflict
  if (occupiedAt.some((s) => s.vehicleId === vehicleId)) {
    errors.push('This vehicle is already assigned to another batch at this time.');
  }

  // Check each student
  if (students) {
    students.forEach((student) => {
      if (checkStudentConflict(student.id, existingSchedules, date, timeSlotId)) {
        errors.push(`Student "${student.name || student.id}" already has a session at this time.`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Auto-assigns the best instructor and vehicle for a given slot.
 * Returns the lowest-workload instructor and first available vehicle.
 *
 * @param {Array} existingSchedules
 * @param {string} date
 * @param {string} timeSlotId
 * @param {string} vehicleType
 * @param {Array} instructors
 * @param {Array} vehicles
 * @returns {{ instructor: Object|null, vehicle: Object|null }}
 */
export function autoAssignResources(existingSchedules, date, timeSlotId, vehicleType, instructors, vehicles) {
  const availableInstructors = findAvailableInstructors(instructors, existingSchedules, date, timeSlotId, vehicleType);
  const availableVehicles = findAvailableVehicles(vehicles, existingSchedules, date, timeSlotId, vehicleType);

  return {
    instructor: availableInstructors.length > 0 ? availableInstructors[0] : null,
    vehicle: availableVehicles.length > 0 ? availableVehicles[0] : null,
  };
}

/**
 * Get the time slot object by its ID.
 */
export function getTimeSlotById(slotId) {
  return TIME_SLOTS.find((s) => s.id === slotId) || null;
}

/**
 * Get the training level object by its ID.
 */
export function getTrainingLevelById(levelId) {
  return TRAINING_LEVELS.find((l) => l.id === levelId) || null;
}
