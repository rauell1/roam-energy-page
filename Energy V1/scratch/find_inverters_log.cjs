const fs = require('fs');

const transcriptPath = 'C:\\Users\\royok\\.gemini\\antigravity\\brain\\e2788d19-a15f-455d-bdfa-1ffae49ce490\\.system_generated\\logs\\transcript_full.jsonl';
const fileStream = fs.readFileSync(transcriptPath, 'utf8');
const lines = fileStream.split('\n').filter(Boolean);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('12kW') || line.includes('18kW') || line.includes('50kW')) {
    console.log(`Found mention of 12kW/18kW/50kW on line ${i+1}`);
    const obj = JSON.parse(line);
    console.log(`Type: ${obj.type}, Source: ${obj.source}`);
    fs.writeFileSync(`C:\\Users\\royok\\.gemini\\antigravity\\brain\\e2788d19-a15f-455d-bdfa-1ffae49ce490\\scratch\\match_inverters_${i+1}.txt`, obj.content || JSON.stringify(obj, null, 2));
    console.log(`Saved line ${i+1} to scratch/match_inverters_${i+1}.txt`);
  }
}
