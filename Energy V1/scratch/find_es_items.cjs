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
    if (contentStr.includes('ES Items')) {
      console.log(`\n--- Match at Line ${i + 1}, type: ${obj.type}, source: ${obj.source} ---`);
      // Write the content to a text file for viewing
      fs.writeFileSync(`C:\\Users\\royok\\.gemini\\antigravity\\brain\\e2788d19-a15f-455d-bdfa-1ffae49ce490\\scratch\\es_items_match_${i+1}.txt`, obj.content || JSON.stringify(obj, null, 2));
      console.log(`Saved match to scratch/es_items_match_${i+1}.txt`);
    }
  } catch (err) {
    // ignore
  }
}
