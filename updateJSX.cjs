const fs = require('fs');

function updateFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // bg-white -> bg-surface or bg-surface-variant depending on context, but let's just make it bg-surface-variant since it's usually cards
  content = content.replace(/bg-white\b(?!\/)/g, 'bg-surface-variant');
  content = content.replace(/hover:bg-white\b(?!\/)/g, 'hover:bg-surface-variant');

  // Hardcoded hex colors
  content = content.replace(/#e5e5e5/g, '#1e1a18');
  content = content.replace(/#f3f3f3/g, '#1a1614');

  // Some text colors might be black
  content = content.replace(/text-black/g, 'text-white');

  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}

const filesToUpdate = [
  'src/pages/AdminDashboard.jsx',
  'src/pages/BookingPage.jsx',
  'src/pages/LandingPage.jsx'
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    updateFile(file);
  }
});
