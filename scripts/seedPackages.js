import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import 'dotenv/config'; // Make sure you have dotenv if running standalone

const firebaseConfig = {
  apiKey: "AIzaSyBUT0ozATVCLOR063NbsTzKFUxc5G7LuLg",
  authDomain: "erangadrivingschool.firebaseapp.com",
  projectId: "erangadrivingschool",
  storageBucket: "erangadrivingschool.firebasestorage.app",
  messagingSenderId: "998785584749",
  appId: "1:998785584749:web:95169f408b1c7211bd7964",
  measurementId: "G-534HQ1KDSF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── DATA ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'cat_lv', name: 'Light Vehicles (LV)' },
  { id: 'cat_hv', name: 'Heavy Vehicles (HV)' }
];

const PACKAGES = [
  // --- LIGHT VEHICLES ---
  {
    id: 'pkg_lv_car_man',
    category_id: 'cat_lv',
    name: 'Car Manual',
    price: 11000,
    included_vehicles: ['Car Manual'],
    total_classes: 15,
    duration_days: 30,
    skills: [
      { name: 'Clutch Control', done: false },
      { name: 'Gear Shifting', done: false },
      { name: 'Reverse', done: false },
      { name: 'Parking', done: false }
    ]
  },
  {
    id: 'pkg_lv_car_auto',
    category_id: 'cat_lv',
    name: 'Car Auto',
    price: 13000,
    included_vehicles: ['Car Automatic'],
    total_classes: 12,
    duration_days: 25,
    skills: [
      { name: 'Basic Driving', done: false },
      { name: 'Traffic Handling', done: false },
      { name: 'Parking', done: false }
    ]
  },
  {
    id: 'pkg_lv_3w',
    category_id: 'cat_lv',
    name: 'Three Wheeler',
    price: 6500,
    included_vehicles: ['Three Wheeler'],
    total_classes: 10,
    duration_days: 20,
    skills: [
      { name: 'Basic Handling', done: false },
      { name: 'Balance & Turning', done: false }
    ]
  },
  {
    id: 'pkg_lv_bike',
    category_id: 'cat_lv',
    name: 'Motorcycle',
    price: 5500,
    included_vehicles: ['Motorcycle'],
    total_classes: 10,
    duration_days: 20,
    skills: [
      { name: 'Balance', done: false },
      { name: 'Figure 8', done: false },
      { name: 'Road Rules', done: false }
    ]
  },
  // -- LV Combos --
  {
    id: 'pkg_lv_car_bike',
    category_id: 'cat_lv',
    name: 'Car + Motorcycle',
    price: 15000,
    included_vehicles: ['Car Manual', 'Motorcycle'],
    total_classes: 20,
    duration_days: 45,
    skills: [
      { name: 'Clutch Control (Car)', done: false },
      { name: 'Parking (Car)', done: false },
      { name: 'Figure 8 (Bike)', done: false },
      { name: 'Road Rules', done: false }
    ]
  },
  {
    id: 'pkg_lv_car_3w',
    category_id: 'cat_lv',
    name: 'Car + Three Wheeler',
    price: 16000,
    included_vehicles: ['Car Manual', 'Three Wheeler'],
    total_classes: 22,
    duration_days: 45,
    skills: [
      { name: 'Clutch Control (Car)', done: false },
      { name: 'Parking (Car)', done: false },
      { name: '3W Handling', done: false }
    ]
  },
  {
    id: 'pkg_lv_3w_bike',
    category_id: 'cat_lv',
    name: 'Three Wheeler + Motorcycle',
    price: 10500,
    included_vehicles: ['Three Wheeler', 'Motorcycle'],
    total_classes: 15,
    duration_days: 30,
    skills: [
      { name: '3W Handling', done: false },
      { name: 'Figure 8 (Bike)', done: false }
    ]
  },
  {
    id: 'pkg_lv_car_3w_bike',
    category_id: 'cat_lv',
    name: 'Car + Three Wheeler + Motorcycle',
    price: 20000,
    included_vehicles: ['Car Manual', 'Three Wheeler', 'Motorcycle'],
    total_classes: 30,
    duration_days: 60,
    skills: [
      { name: 'Clutch Control (Car)', done: false },
      { name: 'Parking (Car)', done: false },
      { name: '3W Handling', done: false },
      { name: 'Figure 8 (Bike)', done: false }
    ]
  },
  // -- LV Custom --
  {
    id: 'pkg_lv_car_no_bike_3w',
    category_id: 'cat_lv',
    name: 'Car (No Bike & 3W)',
    price: 11000,
    included_vehicles: ['Car Manual'],
    total_classes: 15,
    duration_days: 30,
    skills: [
      { name: 'Clutch Control', done: false },
      { name: 'Parking', done: false }
    ]
  },
  {
    id: 'pkg_lv_car_no_3w',
    category_id: 'cat_lv',
    name: 'Car (No 3W)', // Same as Car + Bike logically? User just specified names. Let's stick to name.
    price: 15000, // Matching combo price assumption, since no explicit price given, or maybe same as Car + Bike. Let's use 15000.
    included_vehicles: ['Car Manual', 'Motorcycle'],
    total_classes: 20,
    duration_days: 45,
    skills: [
      { name: 'Clutch Control (Car)', done: false },
      { name: 'Figure 8 (Bike)', done: false }
    ]
  },
  {
    id: 'pkg_lv_car_no_bike',
    category_id: 'cat_lv',
    name: 'Car (No Bike)', // Same as Car + 3W logically?
    price: 16000,
    included_vehicles: ['Car Manual', 'Three Wheeler'],
    total_classes: 22,
    duration_days: 45,
    skills: [
      { name: 'Clutch Control (Car)', done: false },
      { name: '3W Handling', done: false }
    ]
  },

  // --- HEAVY VEHICLES ---
  {
    id: 'pkg_hv_heavy',
    category_id: 'cat_hv',
    name: 'Heavy Vehicle',
    price: 13000,
    included_vehicles: ['Lorry / Truck'],
    total_classes: 20,
    duration_days: 60,
    skills: [
      { name: 'Heavy Vehicle Control', done: false },
      { name: 'Wide Turning', done: false },
      { name: 'Load Handling', done: false }
    ]
  },
  {
    id: 'pkg_hv_prime',
    category_id: 'cat_hv',
    name: 'Prime Mover',
    price: 20000,
    included_vehicles: ['Prime Mover'],
    total_classes: 25,
    duration_days: 60,
    skills: [
      { name: 'Trailer Articulation', done: false },
      { name: 'Reversing with Load', done: false }
    ]
  },
  {
    id: 'pkg_hv_heavy_bike',
    category_id: 'cat_hv',
    name: 'Heavy Vehicle + Motorcycle',
    price: 17000,
    included_vehicles: ['Lorry / Truck', 'Motorcycle'],
    total_classes: 25,
    duration_days: 60,
    skills: [
      { name: 'Heavy Vehicle Control', done: false },
      { name: 'Figure 8 (Bike)', done: false }
    ]
  },
  {
    id: 'pkg_hv_heavy_no_bike',
    category_id: 'cat_hv',
    name: 'Heavy Vehicle (No Motorcycle)',
    price: 15000,
    included_vehicles: ['Lorry / Truck'],
    total_classes: 22,
    duration_days: 60,
    skills: [
      { name: 'Heavy Vehicle Control', done: false },
      { name: 'Wide Turning', done: false }
    ]
  }
];


async function clearCollection(colName) {
  const querySnapshot = await getDocs(collection(db, colName));
  let count = 0;
  for (const document of querySnapshot.docs) {
    await deleteDoc(doc(db, colName, document.id));
    count++;
  }
  console.log(`  🗑  Cleared ${colName} (${count} docs)`);
}

async function seed() {
  try {
    console.log('🚀 Starting new combo pricing seed...\n');

    await clearCollection('packages');
    await clearCollection('categories');
    // Also clear old vehicles if any existed as a top level collection, since we don't need it anymore.
    await clearCollection('vehicles');

    console.log('\n📂 Seeding categories...');
    for (const cat of CATEGORIES) {
      await setDoc(doc(db, 'categories', cat.id), cat);
      console.log(`  ✅ ${cat.name}`);
    }

    console.log('\n📦 Seeding packages...');
    for (const pkg of PACKAGES) {
      await setDoc(doc(db, 'packages', pkg.id), pkg);
      console.log(`  ✅ [Rs. ${pkg.price}] ${pkg.name} (${pkg.included_vehicles.join(', ')})`);
    }

    console.log('\n✅ Done! Seeded completely.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();
