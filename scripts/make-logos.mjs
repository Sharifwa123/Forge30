// Re-creates the pre-sized logo files from public/brand/sharif-logo.png (the supplied 500px original).
// Each size is resampled once with Lanczos and lightly sharpened, so small renders stay crisp instead of being downscaled by the browser.
import sharp from 'sharp';
const src = 'public/brand/sharif-logo.png';
for (const s of [96, 128, 192, 256, 384, 136, 84]) {
  await sharp(src).resize(s, s, { kernel: 'lanczos3', fit: 'fill' }).sharpen({ sigma: 0.7, m1: 0.8, m2: 1.4 }).png({ compressionLevel: 9 }).toFile(`public/brand/logo-${s}.png`);
}
console.log('ok');
