import { db } from './config.js';
import { writeBatch, doc } from 'firebase/firestore';

/**
 * Adds a set of predefined vehicles to the Firestore `vehicles` collection.
 * Run manually with `node src/firebase/addVehicles.js`.
 */
export async function addVehicles() {
  const batch = writeBatch(db);
  const currentYear = new Date().getFullYear();
  const vehicles = [
    // 1️⃣ Car – Toyota Prius – Hybrid – Automatic
    {
      id: 'VEH009',
      name: 'Toyota Prius',
      type: 'Car',
      numberPlate: 'CAA-4587',
      transmission: 'Automatic',
      modelYear: currentYear,
      fuelType: 'Hybrid',
      instructorId: '',
      status: 'active',
    },
    // 2️⃣ Car – Suzuki Alto – Petrol – Manual
    {
      id: 'VEH010',
      name: 'Suzuki Alto',
      type: 'Car',
      numberPlate: 'WP CAB-2389',
      transmission: 'Manual',
      modelYear: currentYear,
      fuelType: 'Petrol',
      instructorId: '',
      status: 'active',
    },
    // 3️⃣ Van – Toyota Hiace – Diesel – Manual
    {
      id: 'VEH011',
      name: 'Toyota Hiace',
      type: 'Van',
      numberPlate: 'NC-7821',
      transmission: 'Manual',
      modelYear: currentYear,
      fuelType: 'Diesel',
      instructorId: '',
      status: 'active',
    },
    // 4️⃣ Bike – Bajaj Pulsar 150 – Petrol
    {
      id: 'VEH012',
      name: 'Bajaj Pulsar 150',
      type: 'Bike',
      numberPlate: 'WP BFH-9123',
      transmission: 'Manual',
      modelYear: currentYear,
      fuelType: 'Petrol',
      instructorId: '',
      status: 'active',
    },
    // 5️⃣ Bike – Honda Dio – Petrol
    {
      id: 'VEH013',
      name: 'Honda Dio',
      type: 'Bike',
      numberPlate: 'CP BHG-3345',
      transmission: 'Manual',
      modelYear: currentYear,
      fuelType: 'Petrol',
      instructorId: '',
      status: 'active',
    },
    // 6️⃣ Car – Honda Civic – Petrol – Automatic
    {
      id: 'VEH014',
      name: 'Honda Civic',
      type: 'Car',
      numberPlate: 'CAA-9912',
      transmission: 'Automatic',
      modelYear: currentYear,
      fuelType: 'Petrol',
      instructorId: '',
      status: 'active',
    },
    // 7️⃣ Van – Nissan Caravan – Diesel – Manual
    {
      id: 'VEH015',
      name: 'Nissan Caravan',
      type: 'Van',
      numberPlate: 'WP NC-5543',
      transmission: 'Manual',
      modelYear: currentYear,
      fuelType: 'Diesel',
      instructorId: '',
      status: 'active',
    },
    // 8️⃣ Bike – Yamaha FZ – Petrol
    {
      id: 'VEH016',
      name: 'Yamaha FZ',
      type: 'Bike',
      numberPlate: 'WP BJR-7788',
      transmission: 'Manual',
      modelYear: currentYear,
      fuelType: 'Petrol',
      instructorId: '',
      status: 'active',
    },
    // 9️⃣ Car – Toyota Axio – Petrol – Automatic
    {
      id: 'VEH017',
      name: 'Toyota Axio',
      type: 'Car',
      numberPlate: 'CBF-6677',
      transmission: 'Automatic',
      modelYear: currentYear,
      fuelType: 'Petrol',
      instructorId: '',
      status: 'active',
    },
    // 🔟 Heavy Vehicle – Isuzu Lorry – Diesel – Manual
    {
      id: 'VEH018',
      name: 'Isuzu Lorry',
      type: 'Heavy',
      numberPlate: 'NW-4321',
      transmission: 'Manual',
      modelYear: currentYear,
      fuelType: 'Diesel',
      instructorId: '',
      status: 'active',
    },
  ];

  vehicles.forEach((v) => {
    const { id, ...data } = v;
    batch.set(doc(db, 'vehicles', id), data);
  });

  try {
    await batch.commit();
    console.log('✅ Vehicles added successfully');
  } catch (err) {
    console.error('❌ Error adding vehicles:', err);
  }
}

(async () => {
  await addVehicles();
})();
