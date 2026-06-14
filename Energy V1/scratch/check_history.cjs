const fs = require('fs');

const transcriptPath = 'C:\\Users\\royok\\.gemini\\antigravity\\brain\\e2788d19-a15f-455d-bdfa-1ffae49ce490\\.system_generated\\logs\\transcript_full.jsonl';
const fileStream = fs.readFileSync(transcriptPath, 'utf8');
const lines = fileStream.split('\n').filter(Boolean);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.includes('10001933.A1')) {
    console.log(`Found mention of 10001933.A1 at Line ${i+1}`);
    try {
      const obj = JSON.parse(line);
      fs.writeFileSync(`C:\\Users\\royok\\.gemini\\antigravity\\brain\\e2788d19-a15f-455d-bdfa-1ffae49ce490\\scratch\\match_line_${i+1}.txt`, JSON.stringify(obj, null, 2));
      console.log(`Saved line ${i+1} to scratch/match_line_${i+1}.txt`);
    } catch (err) {
      console.log(`Error parsing line ${i+1}: ${err.message}`);
    }
  }
}
