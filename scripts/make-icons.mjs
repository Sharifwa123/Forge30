// Browser/app icons: the FORGE30 chevron on a dark tile.
import sharp from 'sharp'; import { writeFileSync } from 'node:fs';
const svg = (r) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="a" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#FF4500"/><stop offset="100%" stop-color="#FFA500"/></linearGradient><linearGradient id="b" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#00E5FF"/><stop offset="100%" stop-color="#702963"/></linearGradient></defs><rect width="512" height="512" rx="${r}" fill="#0b1226"/><g transform="translate(46 117) scale(1.1)"><polygon points="50,40 210,140 370,40 410,90 210,210 10,90" fill="url(#b)" opacity="0.95"/><polygon points="50,130 210,230 370,130 410,180 210,300 10,180" fill="url(#a)"/></g></svg>`;

await sharp(Buffer.from(svg(96))).resize(192, 192).png().toFile('src/app/icon.png');
await sharp(Buffer.from(svg(0))).resize(180, 180).png().toFile('src/app/apple-icon.png');
