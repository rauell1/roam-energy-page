const fs = require('fs');

const transcriptPath = 'C:\\Users\\royok\\.gemini\\antigravity\\brain\\e2788d19-a15f-455d-bdfa-1ffae49ce490\\.system_generated\\logs\\transcript_full.jsonl';
const fileStream = fs.readFileSync(transcriptPath, 'utf8');
const lines = fileStream.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      for (const call of obj.tool_calls) {
        if (call.name === 'call_mcp_tool' && call.args.ToolName === 'execute_sql') {
          console.log(`\n--- STEP ${obj.step_index} (${obj.created_at}) ---`);
          console.log(call.args.Arguments.query);
        }
      }
    }
  } catch (err) {
    // ignore parse errors
  }
}
