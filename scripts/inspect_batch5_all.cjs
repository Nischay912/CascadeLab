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

function printStreamSummary(idx, name) {
  console.log(`\n================== ${name} (Stream ${idx}) ==================`);
  const s = streams[idx-1];
  if (!s) { console.log('Not found'); return; }
  
  // Look for border rectangle
  const reMatch = s.match(/([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+re/);
  if (reMatch) {
    console.log(`BORDER: x=${reMatch[1]}, y=${reMatch[2]}, w=${reMatch[3]}, h=${reMatch[4]}`);
  } else {
    console.log('BORDER: NONE');
  }

  // Extract lines with text and fonts
  const lines = s.split('\n');
  let currentFont = '';
  lines.forEach(l => {
    const fontM = l.match(/\/(\S+)\s+([0-9\.]+)\s+Tf/);
    if (fontM) currentFont = `${fontM[1]} ${fontM[2]}pt`;
    const tjM = l.match(/\((.*?)\)\s*Tj/);
    if (tjM) {
      console.log(`  [${currentFont}] ${tjM[1]}`);
    }
  });
}

printStreamSummary(4, 'CERTIFICATE');
printStreamSummary(6, 'DECLARATION');
printStreamSummary(7, 'ACKNOWLEDGEMENT');
printStreamSummary(8, 'ABSTRACT');
printStreamSummary(9, 'TABLE OF CONTENTS (PAGE 1)');
printStreamSummary(10, 'TABLE OF CONTENTS (PAGE 2)');
printStreamSummary(11, 'CHAPTER 1 INTRODUCTION (PAGE 1)');
