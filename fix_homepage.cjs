const fs = require('fs');
let c = fs.readFileSync('src/pages/public/HomePage.jsx', 'utf8');

// Replace bg-white sections with dark theme
c = c.replace(/bg-white relative z-20/g, 'bg-surface-container relative z-20');
c = c.replace(/bg-white overflow-hidden/g, 'bg-surface-container overflow-hidden');
c = c.replace(/p-xl bg-white rounded-xl/g, 'p-xl bg-surface-container rounded-xl');
c = c.replace(/bg-white\/80 rounded-full/g, 'bg-surface-container/80 rounded-full');
c = c.replace(/className="py-xl px-margin-mobile bg-white"/g, 'className="py-xl px-margin-mobile bg-surface-container"');

// Fix text colors on pricing cards - they may need light text now
c = c.replace(/text-on-tertiary-fixed/g, 'text-on-surface');

fs.writeFileSync('src/pages/public/HomePage.jsx', c);
console.log('Done - HomePage white backgrounds fixed to dark theme');
