const fs = require('fs');

const transcriptPath = 'C:\\Users\\royok\\.gemini\\antigravity\\brain\\e2788d19-a15f-455d-bdfa-1ffae49ce490\\.system_generated\\logs\\transcript_full.jsonl';
const fileStream = fs.readFileSync(transcriptPath, 'utf8');
const lines = fileStream.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  try {
    const obj = JSON.parse(line);
    // Look for step 560's tool response/output
    if (obj.step_index === 561 || (obj.step_index === 560 && obj.type === 'PLANNER_RESPONSE') || line.includes('560') && line.includes('result')) {
      console.log(`\n--- STEP ${obj.step_index} (${obj.type}) ---`);
      console.log(JSON.stringify(obj, null, 2).substring(0, 1500));
    }
  } catch (err) {
    // ignore
  }
}
