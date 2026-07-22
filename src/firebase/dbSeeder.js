import { db } from './config';
import { doc, writeBatch, collection, getDocs, limit, query } from 'firebase/firestore';

// ─── Counter seeds for ID generation ─────────────────────────────────────────
const SEED_COUNTERS = {
  'EDS': { lastId: 4 },
  'INS': { lastId: 6 },
  'VEH': { lastId: 8 },
  'PKG': { lastId: 3 },
  'SES': { lastId: 4 },
  'PAY': { lastId: 2 },
};

// ─── Students ────────────────────────────────────────────────────────────────
const SEED_STUDENTS = [
  {
    id: 'EDS001',
    name: 'Abdul Rahman',
    email: 'abdul@eranga.com',
    role: 'student',
    phone: '0771234567',
    status: 'L_PERMIT_APPROVED',
    progress: 40,
    currentStep: 'IN_TRAINING',
    outstandingFees: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'EDS002',
    name: 'Kasun Perera',
    email: 'kasun@eranga.com',
    role: 'student',
    phone: '0777654321',
    status: 'L_PERMIT_APPROVED',
    progress: 20,
    currentStep: 'IN_TRAINING',
    outstandingFees: 15000,
    createdAt: new Date().toISOString()
  },
  {
    id: 'EDS003',
    name: 'Samitha Jayaweera',
    email: 'samitha@eranga.com',
    role: 'student',
    phone: '0774567890',
    status: 'L_PERMIT_PENDING',
    progress: 0,
    currentStep: 'L_PERMIT_PENDING',
    outstandingFees: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'EDS004',
    name: 'Nimali Fernando',
    email: 'nimali@eranga.com',
    role: 'student',
    phone: '0779876543',
    status: 'L_PERMIT_PENDING',
    progress: 0,
    currentStep: 'L_PERMIT_PENDING',
    outstandingFees: 0,
    createdAt: new Date().toISOString()
  }
];

// ─── Instructors ─────────────────────────────────────────────────────────────
const SEED_INSTRUCTORS = [
  { id: 'INS001', name: 'Kamal Perera', email: 'kamal@eranga.com', phone: '+94 77 123 4567', vehicleId: 'VEH001', rating: 4.9, role: 'instructor', status: 'approved', createdAt: new Date().toISOString() },
  { id: 'INS002', name: 'Nimal Fernando', email: 'nimal@eranga.com', phone: '+94 77 234 5678', vehicleId: 'VEH004', rating: 4.8, role: 'instructor', status: 'approved', createdAt: new Date().toISOString() },
  { id: 'INS003', name: 'Chaminda Silva', email: 'chaminda@eranga.com', phone: '+94 77 345 6789', vehicleId: 'VEH008', rating: 4.9, role: 'instructor', status: 'approved', createdAt: new Date().toISOString() },
  { id: 'INS004', name: 'Lakshmi Wick.', email: 'lakshmi@eranga.com', phone: '+94 77 456 7890', vehicleId: 'VEH002', rating: 4.7, role: 'instructor', status: 'approved', createdAt: new Date().toISOString() },
  { id: 'INS005', name: 'Roshan Jaya.', email: 'roshan@eranga.com', phone: '+94 77 567 8901', vehicleId: 'VEH007', rating: 4.8, role: 'instructor', status: 'approved', createdAt: new Date().toISOString() },
  { id: 'INS006', name: 'Dilani Kumari', email: 'dilani@eranga.com', phone: '+94 77 678 9012', vehicleId: 'VEH003', rating: 4.9, role: 'instructor', status: 'approved', createdAt: new Date().toISOString() }
];

// ─── Vehicles ────────────────────────────────────────────────────────────────
const SEED_VEHICLES = [
  { id: 'VEH001', name: 'Toyota Aqua', type: 'Car', licensePlate: 'WP-CAD-5291', status: 'Available' },
  { id: 'VEH002', name: 'Honda Civic', type: 'Car', licensePlate: 'WP-CBA-9921', status: 'Available' },
  { id: 'VEH003', name: 'Toyota Prius', type: 'Car', licensePlate: 'WP-CAR-7890', status: 'In Use' },
  { id: 'VEH004', name: 'Honda CB Hornet', type: 'Motorcycle', licensePlate: 'CP-BFN-2345', status: 'Available' },
  { id: 'VEH005', name: 'Bajaj Pulsar', type: 'Motorcycle', licensePlate: 'CP-BFP-6789', status: 'Available' },
  { id: 'VEH006', name: 'Bajaj RE', type: 'Three-Wheeler', licensePlate: 'NW-QE-4567', status: 'Available' },
  { id: 'VEH007', name: 'Toyota HiAce', type: 'Van', licensePlate: 'NW-PE-8901', status: 'Available' },
  { id: 'VEH008', name: 'Mitsubishi Canter', type: 'Lorry', licensePlate: 'WP-LH-2345', status: 'Maintenance' }
];

// ─── Packages ────────────────────────────────────────────────────────────────
// Packages are now loaded from src/data/packages.js - not seeded to Firestore for display

// ─── Sessions (unified — replaces old bookings) ─────────────────────────────
// Uses camelCase fields to match what Admin Scheduling writes
const today = new Date().toISOString().split('T')[0];

const SEED_SESSIONS = [
  {
    id: 'SES001',
    studentId: 'EDS001',
    studentName: 'Abdul Rahman',
    instructorId: 'INS001',
    instructorName: 'Kamal Perera',
    date: today,
    time: '09:00',
    timeSlotId: 'S2',
    vehicleType: 'Car',
    vehicleId: 'VEH001',
    status: 'scheduled',
    attendance: null,
    progress: 'not_started',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'SES002',
    studentId: 'EDS002',
    studentName: 'Kasun Perera',
    instructorId: 'INS001',
    instructorName: 'Kamal Perera',
    date: today,
    time: '09:00',
    timeSlotId: 'S2',
    vehicleType: 'Car',
    vehicleId: 'VEH001',
    status: 'scheduled',
    attendance: null,
    progress: 'not_started',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'SES003',
    studentId: 'EDS001',
    studentName: 'Abdul Rahman',
    instructorId: 'INS002',
    instructorName: 'Nimal Fernando',
    date: today,
    time: '14:00',
    timeSlotId: 'S6',
    vehicleType: 'Motorcycle',
    vehicleId: 'VEH004',
    status: 'scheduled',
    attendance: null,
    progress: 'not_started',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'SES004',
    studentId: 'EDS002',
    studentName: 'Kasun Perera',
    instructorId: 'INS002',
    instructorName: 'Nimal Fernando',
    date: today,
    time: '14:00',
    timeSlotId: 'S6',
    vehicleType: 'Motorcycle',
    vehicleId: 'VEH004',
    status: 'completed',
    attendance: 'present',
    progress: 'completed',
    notes: 'Good clutch control, ready for next level.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ─── Payments ────────────────────────────────────────────────────────────────
const SEED_PAYMENTS = [
  { id: 'PAY001', studentId: 'EDS001', sessionId: 'SES001', packageId: 'PKG002', amount: 25000, paymentDate: new Date().toISOString(), method: 'cash', status: 'paid', invoiceNumber: 'INV-10001', receivedBy: 'ADM001', description: 'Full package payment' },
  { id: 'PAY002', studentId: 'EDS002', sessionId: 'SES002', packageId: 'PKG001', amount: 5000, paymentDate: new Date().toISOString(), method: 'online', status: 'pending', invoiceNumber: 'INV-10002', receivedBy: 'ADM001', description: 'First installment' }
];

// ─── Seeder Function ─────────────────────────────────────────────────────────
export async function seedDatabaseIfNeeded() {
  try {
    const batch = writeBatch(db);
    let needsCommit = false;

    // Check if counters exist — if not, it's a fresh database
    const counterCheck = await getDocs(query(collection(db, 'counters'), limit(1)));
    if (counterCheck.empty) {
      console.log('🌱 Seeding database with unified schema (camelCase, sessions collection)...');

      // 1. Counters
      Object.entries(SEED_COUNTERS).forEach(([prefix, data]) => {
        batch.set(doc(db, 'counters', prefix), data);
      });

      // 2. Students
      SEED_STUDENTS.forEach((student) => {
        const { id, ...data } = student;
        batch.set(doc(db, 'students', id), data);
      });

      // 3. Instructors
      SEED_INSTRUCTORS.forEach((inst) => {
        const { id, ...data } = inst;
        batch.set(doc(db, 'instructors', id), data);
      });

      // 3. Vehicles
      SEED_VEHICLES.forEach((veh) => {
        const { id, ...data } = veh;
        batch.set(doc(db, 'vehicles', id), data);
      });

      // 4. Packages (Skipped - now driven by local data in src/data/packages.js)

      // 5. Sessions (unified — no more separate bookings collection)
      SEED_SESSIONS.forEach((ses) => {
        const { id, ...data } = ses;
        batch.set(doc(db, 'sessions', id), data);
      });

      // 6. Payments
      SEED_PAYMENTS.forEach((pay) => {
        const { id, ...data } = pay;
        batch.set(doc(db, 'payments', id), data);
      });

      needsCommit = true;
    }

    if (needsCommit) {
      await batch.commit();
      console.log('✅ Database seeded successfully with unified schema!');
    } else {
      console.log('ℹ️ Database already has data. Seeding skipped.');
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}
