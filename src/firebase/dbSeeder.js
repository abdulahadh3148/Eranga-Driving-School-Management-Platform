import { db } from './config';
import { doc, writeBatch, collection, getDocs, limit, query } from 'firebase/firestore';

const SEED_INSTRUCTORS = [
  {
    id: 'inst_kamal',
    name: 'Kamal Perera',
    email: 'kamal@eranga.com',
    phone: '+94 77 123 4567',
    vehiclePreference: 'Car (Manual & Auto)',
    rating: 4.9,
    lang: 'Sinhala, English',
    studentsCount: 340,
    role: 'instructor',
    status: 'approved',
    createdAt: new Date().toISOString()
  },
  {
    id: 'inst_nimal',
    name: 'Nimal Fernando',
    email: 'nimal@eranga.com',
    phone: '+94 77 234 5678',
    vehiclePreference: 'Motorcycle',
    rating: 4.8,
    lang: 'Sinhala, Tamil',
    studentsCount: 210,
    role: 'instructor',
    status: 'approved',
    createdAt: new Date().toISOString()
  },
  {
    id: 'inst_chaminda',
    name: 'Chaminda Silva',
    email: 'chaminda@eranga.com',
    phone: '+94 77 345 6789',
    vehiclePreference: 'Heavy Vehicle',
    rating: 4.9,
    lang: 'Sinhala',
    studentsCount: 178,
    role: 'instructor',
    status: 'approved',
    createdAt: new Date().toISOString()
  },
  {
    id: 'inst_lakshmi',
    name: 'Lakshmi Wickramasinghe',
    email: 'lakshmi@eranga.com',
    phone: '+94 77 456 7890',
    vehiclePreference: 'Car & Defensive Driving',
    rating: 4.7,
    lang: 'Tamil, English',
    studentsCount: 265,
    role: 'instructor',
    status: 'approved',
    createdAt: new Date().toISOString()
  },
  {
    id: 'inst_roshan',
    name: 'Roshan Jayawardena',
    email: 'roshan@eranga.com',
    phone: '+94 77 567 8901',
    vehiclePreference: 'Van & Bus',
    rating: 4.8,
    lang: 'Sinhala, English',
    studentsCount: 195,
    role: 'instructor',
    status: 'approved',
    createdAt: new Date().toISOString()
  },
  {
    id: 'inst_dilani',
    name: 'Dilani Kumari',
    email: 'dilani@eranga.com',
    phone: '+94 77 678 9012',
    vehiclePreference: 'Car & Theory',
    rating: 4.9,
    lang: 'Sinhala, Tamil, English',
    studentsCount: 230,
    role: 'instructor',
    status: 'approved',
    createdAt: new Date().toISOString()
  }
];

const SEED_VEHICLES = [
  {
    id: 'veh_aqua',
    name: 'Toyota Aqua',
    type: 'Car',
    category: 'Cars',
    features: ['AC', 'Dual Control', 'Auto'],
    status: 'Available',
    emoji: '🚗',
    numberPlate: 'WP-CAD-5291'
  },
  {
    id: 'veh_civic',
    name: 'Honda Civic',
    type: 'Car',
    category: 'Cars',
    features: ['AC', 'Dual Control', 'Manual'],
    status: 'Available',
    emoji: '🚙',
    numberPlate: 'WP-CBA-9921'
  },
  {
    id: 'veh_prius',
    name: 'Toyota Prius',
    type: 'Car',
    category: 'Cars',
    features: ['AC', 'Dual Control', 'Hybrid'],
    status: 'In Use',
    emoji: '🚘',
    numberPlate: 'WP-CAR-7890'
  },
  {
    id: 'veh_hornet',
    name: 'Honda CB Hornet',
    type: 'Motorcycle',
    category: 'Motorcycles',
    features: ['150cc', 'Disc Brake', 'Training Wheels'],
    status: 'Available',
    emoji: '🏍️',
    numberPlate: 'CP-BFN-2345'
  },
  {
    id: 'veh_pulsar',
    name: 'Bajaj Pulsar',
    type: 'Motorcycle',
    category: 'Motorcycles',
    features: ['135cc', 'Easy Start', 'Beginner Friendly'],
    status: 'Available',
    emoji: '🏍️',
    numberPlate: 'CP-BFP-6789'
  },
  {
    id: 'veh_re',
    name: 'Bajaj RE',
    type: 'Three-Wheeler',
    category: 'Three-Wheelers',
    features: ['Dual Control', 'Easy Handling'],
    status: 'Available',
    emoji: '🛺',
    numberPlate: 'NW-QE-4567'
  },
  {
    id: 'veh_hiace',
    name: 'Toyota HiAce',
    type: 'Van',
    category: 'Heavy',
    features: ['15 Seat', 'AC', 'Dual Control'],
    status: 'Available',
    emoji: '🚐',
    numberPlate: 'NW-PE-8901'
  },
  {
    id: 'veh_canter',
    name: 'Mitsubishi Canter',
    type: 'Lorry',
    category: 'Heavy',
    features: ['3-Ton', 'Manual', 'Training Rig'],
    status: 'Maintenance',
    emoji: '🚛',
    numberPlate: 'WP-LH-2345'
  }
];

const SEED_TESTIMONIALS = [
  {
    id: 'test_samantha',
    name: 'Samantha Perera',
    course: 'Car (Class B)',
    date: 'March 2025',
    rating: 5,
    text: 'Eranga Driving School was amazing! My instructor Kamal sir was patient and explained everything clearly. I passed on my first attempt! Highly recommend to anyone in Kurunegala.',
    image: '/images/student_female_avatar.png',
    location: 'Kurunegala, Sri Lanka'
  },
  {
    id: 'test_pradeep',
    name: 'Pradeep Kumar',
    course: 'Motorcycle (Class A)',
    date: 'January 2025',
    rating: 5,
    text: 'The motorcycle training was thorough and safe. Nimal sir taught me balance and road awareness step by step. The dual-control setup gave me so much confidence.',
    image: '/images/student_male_avatar.png',
    location: 'Peradeniya, Sri Lanka'
  },
  {
    id: 'test_rizana',
    name: 'Fathima Rizana',
    course: 'Car (Standard Package)',
    date: 'April 2025',
    rating: 5,
    text: 'I was nervous about driving but the instructors here made me feel very comfortable. The theory classes were excellent and the dashboard system for tracking my progress was very helpful.',
    image: '/images/student_female_avatar.png',
    location: 'Kurunegala, Sri Lanka'
  },
  {
    id: 'test_lahiru',
    name: 'Lahiru Bandara',
    course: 'Heavy Vehicle (Class CE)',
    date: 'February 2025',
    rating: 4,
    text: 'Professional training for my lorry licence. Chaminda sir knows the routes inside out. Good fleet and very organized scheduling system. Will recommend to my colleagues.',
    image: '/images/student_male_avatar.png',
    location: 'Kurunegala, Sri Lanka'
  },
  {
    id: 'test_ayesha',
    name: 'Ayesha Perera',
    course: 'Car (Premium Package)',
    date: 'May 2025',
    rating: 5,
    text: 'The premium package was worth every rupee. Highway driving, night sessions, defensive driving — all covered perfectly. I feel so confident on the road now.',
    image: '/images/student_female_avatar.png',
    location: 'Kurunegala, Sri Lanka'
  },
  {
    id: 'test_kasun',
    name: 'Kasun Rajapaksha',
    course: 'Three-Wheeler (Class B1)',
    date: 'December 2024',
    rating: 5,
    text: 'Quick and efficient. Got my three-wheeler licence in just two weeks. The instructors are punctual and the vehicles are well-maintained. Great experience overall!',
    image: '/images/student_male_avatar.png',
    location: 'Kurunegala, Sri Lanka'
  }
];

const SEED_PACKAGES = [
  {
    id: 'pkg_basic',
    name: 'Basic Starter',
    price: 15000,
    duration: '4 Weeks',
    vehicleType: 'Car (Manual)',
    isActive: true,
    popular: false,
    features: ['10 Theory Classes', '10 Practical Lessons (1hr each)', 'Written Exam Preparation']
  },
  {
    id: 'pkg_standard',
    name: 'Pro Driver',
    price: 25000,
    duration: '6 Weeks',
    vehicleType: 'Car (Manual/Auto)',
    isActive: true,
    popular: true,
    features: ['15 Theory Classes', '18 Practical Lessons (1hr each)', 'Written Exam Preparation', 'Vehicle for Test Day', 'Highway Driving', 'Free Repeat Lessons (2)']
  },
  {
    id: 'pkg_premium',
    name: 'Ultimate License',
    price: 40000,
    duration: '8 Weeks',
    vehicleType: 'Car + Motorway',
    isActive: true,
    popular: false,
    features: ['20 Theory Classes', '25 Practical Lessons (1hr each)', 'Written Exam Preparation', 'Vehicle for Test Day', 'Highway Driving', 'Night Driving Session', 'Defensive Driving Module', 'Unlimited Repeat Lessons']
  }
];

export async function seedDatabaseIfNeeded() {
  try {
    const batch = writeBatch(db);
    let needsCommit = false;

    // 1. Seed Instructors if no instructors exist
    const instQuery = query(collection(db, 'users'), limit(1));
    const instSnap = await getDocs(instQuery);
    // Since users could be empty, let's check if there's any user doc at all. If empty, seed instructors.
    // To be safer, we check if there is at least one instructor.
    const instCheck = await getDocs(query(collection(db, 'users'), limit(1)));
    if (instCheck.empty) {
      console.log('Seeding default instructors...');
      SEED_INSTRUCTORS.forEach((inst) => {
        const { id, ...data } = inst;
        batch.set(doc(db, 'users', id), data);
      });
      needsCommit = true;
    }

    // 2. Seed Vehicles
    const vehCheck = await getDocs(query(collection(db, 'vehicles'), limit(1)));
    if (vehCheck.empty) {
      console.log('Seeding default vehicles...');
      SEED_VEHICLES.forEach((veh) => {
        const { id, ...data } = veh;
        batch.set(doc(db, 'vehicles', id), data);
      });
      needsCommit = true;
    }

    // 3. Seed Testimonials
    const testCheck = await getDocs(query(collection(db, 'testimonials'), limit(1)));
    if (testCheck.empty) {
      console.log('Seeding default testimonials...');
      SEED_TESTIMONIALS.forEach((t) => {
        const { id, ...data } = t;
        batch.set(doc(db, 'testimonials', id), data);
      });
      needsCommit = true;
    }

    // 4. Seed Packages
    const pkgCheck = await getDocs(query(collection(db, 'packages'), limit(1)));
    if (pkgCheck.empty) {
      console.log('Seeding default packages...');
      SEED_PACKAGES.forEach((pkg) => {
        const { id, ...data } = pkg;
        batch.set(doc(db, 'packages', id), data);
      });
      needsCommit = true;
    }

    if (needsCommit) {
      await batch.commit();
      console.log('Database successfully seeded with default data!');
    } else {
      console.log('Database already has data. Seeding skipped.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
