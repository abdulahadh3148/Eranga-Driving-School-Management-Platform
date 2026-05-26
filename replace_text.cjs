const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

function replaceText(filePath) {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace Kandy -> Kurunegala (respecting case)
    content = content.replace(/Kandy/g, 'Kurunegala');
    content = content.replace(/kandy/g, 'kurunegala');
    
    // Replace dhamsara/dhasara URLs or text if any
    content = content.replace(/dhamsara/gi, 'eranga');
    content = content.replace(/dhasara/gi, 'eranga');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated: ' + filePath);
    }
  }
}

walk('src', replaceText);
