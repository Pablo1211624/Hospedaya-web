import { z } from 'zod';
import { idSchema, dateSchema, today } from './lodging-validation.js';
export * from './lodging-validation.js';
export { credentials, registration, profileSchema } from './auth-validation.js';
export const bookingSchema = z.object({ alojId: idSchema, desde: dateSchema, hasta: dateSchema,
  adultos: z.number().int().min(1).max(100), ninos: z.number().int().min(0).max(100) }).strict();
export function temporalState(estado: string, desde: string, hasta: string): string {
  if (estado === 'CANCELADA') return 'Cancelada';
  if (estado === 'PENDIENTE') return 'Pendiente';
  if (estado === 'FINALIZADA' || hasta <= today()) return 'Finalizada';
  return desde <= today() ? 'En curso' : 'Próxima';
}
