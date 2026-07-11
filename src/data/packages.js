/**
 * SINGLE SOURCE OF TRUTH — Driving School Packages
 *
 * Import this file in ALL pages that need package/pricing data.
 * Do NOT duplicate this data anywhere else.
 */

export const CATEGORIES = [
  { id: 'lv', name: 'Light Vehicle', icon: '🚗', description: 'Cars, motorcycles & three-wheelers' },
  { id: 'hv', name: 'Heavy Vehicle', icon: '🚛', description: 'Bus, lorry & prime mover training' },
];

export const PACKAGES = [
  // ── Light Vehicle ──────────────────────────────────────────────────────────
  { id: 'lv-car-manual',  name: 'Car Manual',                  category: 'lv', price: 11000, sessions: 10 },
  { id: 'lv-car-auto',    name: 'Car Automatic',               category: 'lv', price: 13000, sessions: 10 },
  { id: 'lv-3w',          name: 'Three Wheeler',               category: 'lv', price: 6500,  sessions: 8  },
  { id: 'lv-bike',        name: 'Motorcycle',                  category: 'lv', price: 5500,  sessions: 6  },

  // ── Heavy Vehicle ──────────────────────────────────────────────────────────
  { id: 'hv-bus',         name: 'Bus',                         category: 'hv', price: 15000, sessions: 12 },
  { id: 'hv-lorry',       name: 'Lorry',                       category: 'hv', price: 13000, sessions: 12 },
  { id: 'hv-prime-mover', name: 'Prime Mover',                 category: 'hv', price: 20000, sessions: 12 },
];

/**
 * Get all packages for a given category id ('lv' or 'hv').
 */
export function getPackagesByCategory(categoryId) {
  return PACKAGES.filter(p => p.category === categoryId);
}

/**
 * Get a single package by its id.
 */
export function getPackageById(id) {
  return PACKAGES.find(p => p.id === id) || null;
}

/**
 * Get category object by id.
 */
export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || null;
}

/**
 * Format price as "Rs. X,XXX"
 */
export function formatPrice(price) {
  return `Rs. ${Number(price).toLocaleString()}`;
}
