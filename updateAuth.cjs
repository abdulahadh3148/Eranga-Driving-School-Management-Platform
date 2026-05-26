const fs = require('fs');

function convert(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Body and wrappers
  content = content.replace(/background: radial-gradient\([^)]+\);/g, 'background: #0e0c0b;');
  
  // Shapes
  content = content.replace(/background-color: #e0d8d6;/g, 'background-color: #451a03;');
  content = content.replace(/background-color: #e8e0de;/g, 'background-color: #f59e0b;');
  
  // Cards
  content = content.replace(/background-color: #ffffff;/g, 'background-color: #161210;');
  content = content.replace(/background: rgba\(255, 255, 255, 0.85\);/g, 'background: rgba(22, 18, 16, 0.85);');
  
  // Buttons
  content = content.replace(/background-color: #0a0a0a;/g, 'background-color: #f59e0b;');
  content = content.replace(/color: #ffffff;/g, 'color: #1c1917;');
  
  // Text
  content = content.replace(/color: #0a0a0a;/g, 'color: #f5f0eb;');
  content = content.replace(/color: #737373;/g, 'color: #8a7f74;');
  content = content.replace(/color: #737686;/g, 'color: #6b6460;');
  content = content.replace(/color: #b8b2b0;/g, 'color: #8a7f74;');
  content = content.replace(/color: #54647a;/g, 'color: #c9bfb5;');
  
  // Borders
  content = content.replace(/border: 1px solid rgba\(195, 198, 215, 0\.3\);/g, 'border: 1px solid #1e1a18;');
  content = content.replace(/border: 1px solid rgba\(226, 232, 240, 0\.8\);/g, 'border: 1px solid #1e1a18;');
  content = content.replace(/border: 1px solid #c3c6d7;/g, 'border: 1px solid #2a2420;');
  content = content.replace(/border: 1px solid #b8b2b0;/g, 'border: 1px solid #3d3835;');
  content = content.replace(/border-color: #0a0a0a;/g, 'border-color: #f59e0b;');
  content = content.replace(/border-top: 1px solid rgba\(195, 198, 215, 0\.3\);/g, 'border-top: 1px solid #1e1a18;');

  // Backgrounds that need to be secondary
  content = content.replace(/background-color: #c3c6d7;/g, 'background-color: #2a2420;');
  content = content.replace(/background-color: #e5dfdd;/g, 'background-color: #1e1a18;');

  // Active tabs
  content = content.replace(/\.login-tab\.active \{\n  background-color: #ffffff;/g, '.login-tab.active {\n  background-color: #1e1a18;');
  content = content.replace(/\.login-tab\.active \{\n  background-color: #161210;/g, '.login-tab.active {\n  background-color: #1e1a18;');

  // Make sure the shared footer is also styled right
  content = content.replace(/\.shared-footer \{\n  width: 100%;\n  padding: 32px 24px;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  align-items: center;\n  gap: 16px;\n  background-color: #161210;\n\}/g, 
  '.shared-footer {\n  width: 100%;\n  padding: 32px 24px;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  align-items: center;\n  gap: 16px;\n  background-color: #0e0c0b;\n  border-top: 1px solid #1e1a18;\n}');

  // Update inputs
  content = content.replace(/background-color: #161210;/g, 'background-color: #1e1a18;');
  // Revert card background back to 161210
  content = content.replace(/\.login-card \{\n  background-color: #1e1a18;/g, '.login-card {\n  background-color: #161210;');
  content = content.replace(/\.login-tabs \{\n  display: flex;\n  padding: 4px;\n  background-color: #1e1a18;/g, '.login-tabs {\n  display: flex;\n  padding: 4px;\n  background-color: #1a1614;');

  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
}

convert('src/pages/auth/LoginPage.css');
convert('src/pages/auth/RegisterPage.css');
