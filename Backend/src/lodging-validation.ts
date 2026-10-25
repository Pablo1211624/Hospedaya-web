import { z } from 'zod';

import { HttpError } from './errors.js';
export { HttpError } from './errors.js';
export const idSchema = z.string().max(19).regex(/^[1-9]\d*$/).refine(v => /^[1-9]\d{0,18}$/.test(v) && BigInt(v) <= 9223372036854775807n, 'ID fuera de rango');
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const d = new Date(v); return !isNaN(+d) && d.toISOString().slice(0, 10) === v;
}, 'Fecha inválida');
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export function dates(desde: string, hasta: string) {
  dateSchema.parse(desde); dateSchema.parse(hasta);
  if (desde < today() || hasta <= desde) throw new HttpError(400, 'Selecciona fechas futuras y una salida posterior a la entrada.');
  const nights = (+new Date(hasta) - +new Date(desde)) / 86400000;
  if (nights > 365) throw new HttpError(400, 'La estadía máxima es de 365 noches.');
  return nights;
}
export const imageSchema = z.string().max(2000).refine(v => /^\/uploads\/alojamientos\/[\w.-]+$/.test(v) || (() => { try { const url = new URL(v); return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password; } catch { return false; } })(), 'Usa una URL HTTPS o una imagen local del alojamiento');
export const lodgingSchema = z.object({
  nombre: z.string().trim().min(3).max(150), ciudad: z.string().trim().min(2).max(100),
  direccion: z.string().trim().min(5).max(255), desc: z.string().trim().min(10).max(5000),
  precio: z.number().positive().max(99999999.99).refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 0.000001, 'Máximo dos decimales'),
  cap: z.number().int().min(1).max(100), hab: z.number().int().min(1).max(100), banos: z.number().int().min(1).max(100),
  amenidades: z.string().trim().max(2000), reglas: z.string().trim().max(2000), imagenes: z.array(imageSchema).min(1).max(10),
}).strict();
export const availabilitySchema = z.object({ desde: dateSchema, hasta: dateSchema,
  estado: z.enum(['DISPONIBLE', 'NO_DISPONIBLE']) }).strict();
