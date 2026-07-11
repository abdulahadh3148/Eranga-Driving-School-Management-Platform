import { TIME_SLOTS } from './schedulingEngine';

/**
 * Generates an automated schedule for a student based on their selected packages and preferences.
 * 
 * @param {Array} selectedPackages - Array of selected vehicle packages, each containing `name` and `sessions` count.
 * @param {Object} preferences - { preferredDays: 'weekdays' | 'weekend', preferredTime: 'morning' | 'evening' }
 * @returns {Array} List of schedule objects { date, timeSlot, timeLabel, vehicleType, status }
 */
export function generateStudentSchedule(selectedPackages, preferences) {
  const { preferredDays, preferredTime } = preferences;

  // Filter time slots based on preference
  const validSlots = TIME_SLOTS.filter(s => {
    if (preferredTime === 'morning') return ['S1', 'S2', 'S3', 'S4'].includes(s.id);
    if (preferredTime === 'evening') return ['S5', 'S6', 'S7', 'S8'].includes(s.id);
    return true;
  });

  // Filter days (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const validDayNums = preferredDays === 'weekdays' ? [1, 2, 3, 4, 5] : [0, 6];

  // Create an interleaved queue of vehicles
  // Example: Car (10), Bike (6) -> [Car, Bike, Car, Bike, Car, Bike, Car, Bike, Car, Bike, Car, Bike, Car, Car, Car, Car]
  const interleavedQueue = [];
  const packageCounts = selectedPackages.map(p => ({ name: p.name, remaining: p.sessions || 10 })); // Default 10 if missing
  
  while (packageCounts.some(p => p.remaining > 0)) {
    for (let p of packageCounts) {
      if (p.remaining > 0) {
        interleavedQueue.push(p.name);
        p.remaining--;
      }
    }
  }

  const schedules = [];
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 1); // Start scheduling from tomorrow

  for (let vehicle of interleavedQueue) {
    // Find next valid date
    while (!validDayNums.includes(currentDate.getDay())) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Pick a random time slot from the valid ones for variety
    const randomSlot = validSlots[Math.floor(Math.random() * validSlots.length)];

    schedules.push({
      date: currentDate.toISOString().split('T')[0],
      timeSlotId: randomSlot.id,
      timeLabel: randomSlot.label,
      vehicleType: vehicle,
      status: 'scheduled'
    });

    // Move to next date so we don't have multiple sessions on the same day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedules;
}
