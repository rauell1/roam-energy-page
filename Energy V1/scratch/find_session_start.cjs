const fs = require('fs');

const transcriptPath = 'C:\\Users\\royok\\.gemini\\antigravity\\brain\\e2788d19-a15f-455d-bdfa-1ffae49ce490\\.system_generated\\logs\\transcript_full.jsonl';
const fileStream = fs.readFileSync(transcriptPath, 'utf8');
const lines = fileStream.split('\n').filter(Boolean);

console.log(`Total lines: ${lines.length}`);
const start = 785;
const end = Math.min(810, lines.length);
for (let i = start; i < end; i++) {
  try {
    const obj = JSON.parse(lines[i]);
    console.log(`Line ${i+1}: index=${obj.step_index}, type=${obj.type}, source=${obj.source}`);
    const text = obj.content || (obj.tool_calls ? JSON.stringify(obj.tool_calls) : '');
    console.log(text.substring(0, 500));
    console.log('----------------------------------------------------');
  } catch (err) {
    console.log(`Line ${i+1}: Parse error: ${err.message}`);
  }
}
