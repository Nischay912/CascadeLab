const fs = require('fs');
const zlib = require('zlib');

const data = fs.readFileSync('batch-5.pdf');
console.log('PDF length:', data.length);

// Find all stream / endstream blocks
let pos = 0;
const textBlocks = [];
while (pos < data.length) {
  const streamIdx = data.indexOf('stream', pos);
  if (streamIdx === -1) break;
  
  // check if it's \r\n or \n after 'stream'
  let start = streamIdx + 6;
  if (data[start] === 0x0d && data[start+1] === 0x0a) start += 2;
  else if (data[start] === 0x0a) start += 1;

  const endIdx = data.indexOf('endstream', start);
  if (endIdx === -1) break;

  const streamBuf = data.slice(start, endIdx);
  try {
    const uncompressed = zlib.inflateSync(streamBuf).toString('latin1');
    if (uncompressed.includes('BT') && uncompressed.includes('ET')) {
      textBlocks.push(uncompressed);
    }
  } catch(e) {
    // Not flate or partial
  }
  pos = endIdx + 9;
}

console.log('Total text streams found:', textBlocks.length);

// Let's print the first 5 text blocks to see the structure of pages 1, 2, 3, 4, 5
for (let i = 0; i < Math.min(10, textBlocks.length); i++) {
  console.log(`\n--- STREAM ${i+1} ---`);
  // Extract strings inside (...) Tj or [...] TJ
  const matches = textBlocks[i].match(/\((.*?)\)\s*Tj/g) || [];
  const text = matches.map(m => m.replace(/^\(/, '').replace(/\)\s*Tj$/, '')).join(' ');
  console.log(text.slice(0, 300));
}
