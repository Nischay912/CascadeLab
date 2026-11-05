const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const pdfPath = 'C:\\Users\\ben09\\.gemini\\antigravity\\brain\\bbd6ac31-cb66-4abe-9317-632914d1b4dd\\.user_uploaded\\media_1793883965675_1eb935c1.pdf';
const buf = fs.readFileSync(pdfPath);

const streamMarker = Buffer.from('18 0 obj');
const idx = buf.indexOf(streamMarker);
console.log('Object 18 at index:', idx);

const streamStartMarker = Buffer.from('stream\r\n');
let sStart = buf.indexOf(streamStartMarker, idx);
let offset = 8;
if (sStart === -1) {
  const alt = Buffer.from('stream\n');
  sStart = buf.indexOf(alt, idx);
  offset = 7;
}

const lengthMarker = Buffer.from('/Length 345419');
const streamData = buf.subarray(sStart + offset, sStart + offset + 345419);
console.log('Stream length:', streamData.length);

const decompressed = zlib.inflateSync(streamData);
console.log('Decompressed length:', decompressed.length);
// 640 * 668 * 3 = 1,282,560 bytes!
console.log('Expected raw RGB bytes:', 640 * 668 * 3);

// Create simple PNG with lodepng or uncompressed BMP or PNG
// BMP is trivial to write in pure Node.js!
const width = 640;
const height = 668;
const rowSize = width * 3;
const paddedRowSize = Math.floor((rowSize + 3) / 4) * 4;
const pixelArraySize = paddedRowSize * height;
const fileSize = 54 + pixelArraySize;

const bmpHeader = Buffer.alloc(54);
bmpHeader.write('BM', 0);
bmpHeader.writeUInt32LE(fileSize, 2);
bmpHeader.writeUInt32LE(54, 10);
bmpHeader.writeUInt32LE(40, 14);
bmpHeader.writeInt32LE(width, 18);
bmpHeader.writeInt32LE(-height, 22); // Top-down
bmpHeader.writeUInt16LE(1, 26);
bmpHeader.writeUInt16LE(24, 28);
bmpHeader.writeUInt32LE(0, 30);
bmpHeader.writeUInt32LE(pixelArraySize, 34);

const pixelBuf = Buffer.alloc(pixelArraySize);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const srcIdx = (y * width + x) * 3;
    const destIdx = y * paddedRowSize + x * 3;
    // BMP is BGR
    pixelBuf[destIdx] = decompressed[srcIdx + 2];     // B
    pixelBuf[destIdx + 1] = decompressed[srcIdx + 1]; // G
    pixelBuf[destIdx + 2] = decompressed[srcIdx];     // R
  }
}

const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Convert decompressed RGB to RGBA base64
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = decompressed[i * 3];
    rgba[i * 4 + 1] = decompressed[i * 3 + 1];
    rgba[i * 4 + 2] = decompressed[i * 3 + 2];
    rgba[i * 4 + 3] = 255; // Alpha
  }

  const rgbaBase64 = rgba.toString('base64');

  await page.evaluate(({ width, height, rgbaBase64 }) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const binStr = atob(rgbaBase64);
    const bytes = new Uint8ClampedArray(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    const imgData = new ImageData(bytes, width, height);
    ctx.putImageData(imgData, 0, 0);
    document.body.appendChild(canvas);
  }, { width, height, rgbaBase64 });

  const canvas = page.locator('canvas');
  const pngOutPath = path.resolve(__dirname, 'bmsce_logo.png');
  await canvas.screenshot({ path: pngOutPath, omitBackground: true });
  console.log('Saved perfect PNG logo at:', pngOutPath);
  await browser.close();
})();
