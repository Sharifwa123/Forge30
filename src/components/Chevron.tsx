/** The FORGE30 chevron mark: steel/cyan "build" frame over the orange "burn" core. */
export default function Chevron({ width = 48, className }: { width?: number; className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 310" width={width} height={Math.round((width * 310) / 420)} role="img" aria-label="FORGE30 chevron" style={{ flex: 'none' }}>
      <defs>
        <linearGradient id="f30-burn" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FF4500" /><stop offset="100%" stopColor="#FFA500" /></linearGradient>
        <linearGradient id="f30-build" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#00E5FF" /><stop offset="100%" stopColor="#702963" /></linearGradient>
      </defs>
      <polygon points="50,40 210,140 370,40 410,90 210,210 10,90" fill="url(#f30-build)" opacity="0.9" />
      <polygon points="50,130 210,230 370,130 410,180 210,300 10,180" fill="url(#f30-burn)" />
    </svg>
  );
}
