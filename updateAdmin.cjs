const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminDashboard.css', 'utf8');

// Backgrounds
content = content.replace(/background-color: #fcfcfc;/g, 'background-color: #0e0c0b;');
content = content.replace(/background: #ffffff;/g, 'background: #161210;');
content = content.replace(/background-color: #ffffff;/g, 'background-color: #161210;');
content = content.replace(/background-color: #f3f3f3;/g, 'background-color: #1a1614;');
content = content.replace(/background-color: #eeeeee;/g, 'background-color: #1e1a18;');
content = content.replace(/background: #eeeeee;/g, 'background: #1e1a18;');
content = content.replace(/background: #fcfcfc;/g, 'background: #0e0c0b;');
content = content.replace(/background: #e8e8e8;/g, 'background: #2a2420;');
content = content.replace(/background: #0a0a0a;/g, 'background: #f59e0b;');
content = content.replace(/background-color: #0a0a0a;/g, 'background-color: #f59e0b;');

// Text
content = content.replace(/color: #0a0a0a;/g, 'color: #f5f0eb;');
content = content.replace(/color: #5e5e5e;/g, 'color: #8a7f74;');
content = content.replace(/color: #ea580c;/g, 'color: #f59e0b;');
content = content.replace(/color: #10b981;/g, 'color: #4ade80;');
content = content.replace(/color: #ba1a1a;/g, 'color: #f87171;');
content = content.replace(/color: #ffffff;/g, 'color: #1c1917;');

// Borders
content = content.replace(/border-right: 1px solid #e5e5e5;/g, 'border-right: 1px solid #1e1a18;');
content = content.replace(/border-top: 1px solid #c4c7c7;/g, 'border-top: 1px solid #2a2420;');
content = content.replace(/border-bottom: 1px solid #e5e5e5;/g, 'border-bottom: 1px solid #1e1a18;');
content = content.replace(/border: 1px solid #e5e5e5;/g, 'border: 1px solid #1e1a18;');
content = content.replace(/border-color: #0a0a0a;/g, 'border-color: #f59e0b;');
content = content.replace(/border-color: #c4c7c7;/g, 'border-color: #2a2420;');
content = content.replace(/border-bottom: 1px solid #c4c7c7;/g, 'border-bottom: 1px solid #2a2420;');
content = content.replace(/border: 1px solid #c4c7c7;/g, 'border: 1px solid #2a2420;');
content = content.replace(/border-top: 1px solid #e5e5e5;/g, 'border-top: 1px solid #1e1a18;');

// Specific overrides
content = content.replace(/\.admin-sidebar \{\n  position: fixed;\n  left: 0;\n  top: 0;\n  height: 100%;\n  width: 256px;\n  background: #161210;/g, 
  '.admin-sidebar {\n  position: fixed;\n  left: 0;\n  top: 0;\n  height: 100%;\n  width: 256px;\n  background: #110f0d;');
  
content = content.replace(/\.admin-header \{\n  height: 64px;\n  background: #161210;/g, 
  '.admin-header {\n  height: 64px;\n  background: #110f0d;');

fs.writeFileSync('src/pages/AdminDashboard.css', content);
console.log('Updated AdminDashboard.css');
