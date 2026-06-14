const fs = require('fs');
const path = require('path');

const transcriptPath = 'C:\\Users\\royok\\.gemini\\antigravity\\brain\\e2788d19-a15f-455d-bdfa-1ffae49ce490\\.system_generated\\logs\\transcript_full.jsonl';
const fileStream = fs.readFileSync(transcriptPath, 'utf8');
const lines = fileStream.split('\n');

let count = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  try {
    const obj = JSON.parse(line);
    const contentStr = JSON.stringify(obj);
    if (contentStr.includes('10001933.A1')) {
      console.log(`Match ${++count}: Line ${i + 1}, type: ${obj.type}, source: ${obj.source}`);
      if (obj.type === 'USER_INPUT') {
        fs.writeFileSync(`C:\\Users\\royok\\.gemini\\antigravity\\brain\\e2788d19-a15f-455d-bdfa-1ffae49ce490\\scratch\\user_input_${count}.txt`, obj.content || '');
        console.log(`Saved USER_INPUT to scratch/user_input_${count}.txt`);
      } else {
        fs.writeFileSync(`C:\\Users\\royok\\.gemini\\antigravity\\brain\\e2788d19-a15f-455d-bdfa-1ffae49ce490\\scratch\\other_match_${count}.txt`, obj.content || JSON.stringify(obj, null, 2));
        console.log(`Saved other match to scratch/other_match_${count}.txt`);
      }
    }
  } catch (err) {
    // ignore parse errors
  }
}
