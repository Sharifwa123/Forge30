/** The SHARIF TECHNOLOGIES logo, served from pre-sized, sharpened copies so it stays crisp (and readable) at every size and pixel density. */
const SIZES = [96, 128, 192, 256, 384];
export default function Logo({ size, className, priority = false, alt = 'SHARIF TECHNOLOGIES' }: { size: number; className?: string; priority?: boolean; alt?: string }) {
  const srcSet = [...SIZES.map((s) => `/brand/logo-${s}.png ${s}w`), '/brand/sharif-logo.png 500w'].join(', ');
  const src = `/brand/logo-${SIZES.find((s) => s >= size * 2) ?? 384}.png`;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={src} srcSet={srcSet} sizes={`${size}px`} width={size} height={size} alt={alt} decoding="async" loading={priority ? 'eager' : 'lazy'} style={{ borderRadius: '50%', flex: 'none' }} />;
}
