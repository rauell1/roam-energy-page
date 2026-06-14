const fs = require('fs');

const transcriptPath = 'C:\\Users\\royok\\.gemini\\antigravity\\brain\\e2788d19-a15f-455d-bdfa-1ffae49ce490\\.system_generated\\logs\\transcript_full.jsonl';
const fileStream = fs.readFileSync(transcriptPath, 'utf8');
const lines = fileStream.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  try {
    const obj = JSON.parse(line);
    const contentStr = JSON.stringify(obj);
    if (contentStr.includes('media__')) {
      console.log(`\n--- STEP ${obj.step_index} (${obj.type}, source: ${obj.source}) ---`);
      // print first 500 characters of content or tool calls to see what's happening
      console.log((obj.content || '').substring(0, 1000));
      if (obj.tool_calls) {
        console.log('Tool calls:', JSON.stringify(obj.tool_calls, null, 2).substring(0, 500));
      }
    }
  } catch (err) {
    // ignore parse errors
  }
}
