const fs = require('fs');

const transcriptPath = 'C:\\Users\\royok\\.gemini\\antigravity\\brain\\e2788d19-a15f-455d-bdfa-1ffae49ce490\\.system_generated\\logs\\transcript_full.jsonl';
const fileStream = fs.readFileSync(transcriptPath, 'utf8');
const lines = fileStream.split('\n').filter(Boolean);

console.log(`Line 2 length: ${lines[1].length}`);
try {
  const obj = JSON.parse(lines[1]);
  console.log(`Type: ${obj.type}, Source: ${obj.source}`);
  console.log('Keys in obj:', Object.keys(obj));
  if (obj.content) {
    console.log(`Content length: ${obj.content.length}`);
    console.log('Content preview:', obj.content.substring(0, 1000));
  } else {
    console.log('No content field');
  }
} catch (err) {
  console.log(`Error: ${err.message}`);
}
