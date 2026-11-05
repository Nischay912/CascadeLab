const fs = require('fs');
const zlib = require('zlib');

const data = fs.readFileSync('batch-5.pdf');

function extractStreams() {
  let pos = 0;
  const streams = [];
  while (pos < data.length) {
    const streamIdx = data.indexOf('stream', pos);
    if (streamIdx === -1) break;
    let start = streamIdx + 6;
    if (data[start] === 0x0d && data[start+1] === 0x0a) start += 2;
    else if (data[start] === 0x0a) start += 1;
    const endIdx = data.indexOf('endstream', start);
    if (endIdx === -1) break;
    const streamBuf = data.slice(start, endIdx);
    try {
      const uncomp = zlib.inflateSync(streamBuf).toString('latin1');
      if (uncomp.includes('BT') && uncomp.includes('ET')) {
        streams.push(uncomp);
      }
    } catch(e) {}
    pos = endIdx + 9;
  }
  return streams;
}

const streams = extractStreams();
const s12 = streams[11]; // Stream 12 (Page 2)
console.log('=== EXACT STREAM 12 CONTENT ===');
console.log(s12);
