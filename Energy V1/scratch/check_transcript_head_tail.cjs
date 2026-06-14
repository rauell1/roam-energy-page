const fs = require('fs');

const transcriptPath = 'C:\\Users\\royok\\.gemini\\antigravity\\brain\\e2788d19-a15f-455d-bdfa-1ffae49ce490\\.system_generated\\logs\\transcript_full.jsonl';
const fileStream = fs.readFileSync(transcriptPath, 'utf8');
const lines = fileStream.split('\n').filter(Boolean);

console.log(`Total lines: ${lines.length}`);
console.log('\n--- FIRST 2 LINES ---');
for (let i = 0; i < Math.min(2, lines.length); i++) {
  try {
    const obj = JSON.parse(lines[i]);
    console.log(`Line ${i+1}: index=${obj.step_index}, type=${obj.type}, source=${obj.source}`);
    console.log((obj.content || '').substring(0, 300));
  } catch (err) {
    console.log(`Line ${i+1}: Parse error: ${err.message}`);
  }
}

console.log('\n--- LAST 2 LINES ---');
for (let i = Math.max(0, lines.length - 2); i < lines.length; i++) {
  try {
    const obj = JSON.parse(lines[i]);
    console.log(`Line ${i+1}: index=${obj.step_index}, type=${obj.type}, source=${obj.source}`);
    console.log((obj.content || '').substring(0, 300));
  } catch (err) {
    console.log(`Line ${i+1}: Parse error: ${err.message}`);
  }
}
