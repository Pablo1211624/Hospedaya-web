import type { Prisma } from '../generated/prisma/client.js';
import { HttpError } from './errors.js';
// All availability/price/booking mutations lock this same row first.
export async function lockLodging(tx: Prisma.TransactionClient, id: bigint) {
  await tx.$queryRaw`SELECT id_alojamiento FROM alojamiento WHERE id_alojamiento = ${id} FOR UPDATE`;
  const a = await tx.alojamiento.findUnique({ where: { id_alojamiento: id } });
  if (!a) throw new HttpError(404, 'Alojamiento no encontrado.');
  return a;
}
