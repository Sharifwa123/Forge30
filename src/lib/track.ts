export function track(name: string, step?: string) {
  try {
    const body = JSON.stringify({ name, step });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/event', new Blob([body], { type: 'application/json' }));
    else fetch('/api/event', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
  } catch {}
}
