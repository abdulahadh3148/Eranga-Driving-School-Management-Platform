import fs from 'fs';

const logPath = 'C:\\Users\\abdul\\.gemini\\antigravity\\brain\\b20a3d0e-23bd-4158-8f25-b6b3ab04c1b6\\.system_generated\\logs\\transcript.jsonl';

try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const obj = JSON.parse(line);
    
    if (obj.step_index === 1275) {
      console.log('Step 1275 Content Length:', obj.content.length);
      fs.writeFileSync('c:\\Driving School\\step_1275_content.txt', obj.content, 'utf8');
      console.log('Wrote to c:\\Driving School\\step_1275_content.txt');
      break;
    }
  }
} catch (err) {
  console.error(err);
}
