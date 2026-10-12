/** Digits for wa.me. Local Ghana numbers (024…, 10 digits starting with 0) become 233…; anything else is used as typed (digits only). */
export function waDigits(n: string): string {
  const d = n.replace(/[^\d]/g, '');
  if (/^0\d{9}$/.test(d)) return '233' + d.slice(1);
  return d;
}
export const waLink = (n: string, text = '') => `https://wa.me/${waDigits(n)}${text ? '?text=' + encodeURIComponent(text) : ''}`;
