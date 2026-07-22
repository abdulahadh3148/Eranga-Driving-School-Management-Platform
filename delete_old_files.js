const fs = require('fs');
const path = require('path');

const filesToDelete = [
  'AssignInstructor.jsx',
  'Attendance.jsx',
  'Batches.jsx',
  'CreateSlots.jsx',
  'Scheduling.jsx',
  'Scheduling.css'
];

const adminDir = path.join(__dirname, 'src', 'pages', 'admin');

filesToDelete.forEach(file => {
  const filePath = path.join(adminDir, file);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Successfully deleted: ${file}`);
    } else {
      console.log(`File not found: ${file}`);
    }
  } catch (err) {
    console.error(`Error deleting ${file}:`, err);
  }
});
