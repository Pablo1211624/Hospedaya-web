export type DemoPayment = { num: string; exp: string; cvv: string; nom: string; cp: string };
export const emptyPayment: DemoPayment = { num: '', exp: '', cvv: '', nom: '', cp: '' };
// Format checks only. Never call a payment provider or persist these values.
export function validateDemoPayment(p: DemoPayment, now = new Date()): string {
  if (!/^\d{16}$/.test(p.num.replace(/\s/g, ''))) return 'El número de prueba debe tener 16 dígitos.';
  if (!/^\d{3,4}$/.test(p.cvv)) return 'El CVV de prueba debe tener 3 o 4 dígitos.';
  const match = /^(0[1-9]|1[0-2])\/(\d{4})$/.exec(p.exp);
  if (!match) return 'Indica el vencimiento en formato mm/aaaa.';
  if (+match[2] * 12 + +match[1] < now.getFullYear() * 12 + now.getMonth() + 1) return 'El vencimiento no puede estar en el pasado.';
  if (p.nom.trim().length < 2 || p.nom.trim().length > 100) return 'Indica un nombre de prueba de 2 a 100 caracteres.';
  if (!/^\d{4,10}$/.test(p.cp)) return 'El código postal debe tener entre 4 y 10 dígitos.';
  return '';
}
