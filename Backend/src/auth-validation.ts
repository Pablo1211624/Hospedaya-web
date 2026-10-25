import { z } from 'zod';
export { HttpError } from './errors.js';

export const credentials = z.object({
  correo: z.string().trim().toLowerCase().pipe(z.email().max(255)),
  // bcrypt only uses the first 72 bytes. Reject longer Unicode passwords too.
  password: z.string().min(8).max(72).refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'La contraseña supera el tamaño permitido'),
}).strict();
export const registration = credentials.extend({
  nombre: z.string().trim().min(2).max(100),
  rol: z.enum(['HUESPED', 'ANFITRION']),
});
export const profileSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  biografia: z.string().trim().max(1000),
}).strict();
