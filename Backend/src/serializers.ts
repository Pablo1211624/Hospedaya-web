import type { Prisma } from '../generated/prisma/client.js';
import { temporalState } from './domain.js';
export { lodgingDTO, lodgingInclude } from './lodging-serializer.js';
export const reservationInclude = { costo_reserva: true, alojamiento: { select: { nombre: true, id_usuario: true } }, usuario: { select: { nombre: true } } } satisfies Prisma.reservaInclude;
export function reservationDTO(r: Prisma.reservaGetPayload<{ include: typeof reservationInclude }>) {
  const desde = r.fecha_entrada.toISOString().slice(0, 10), hasta = r.fecha_salida.toISOString().slice(0, 10);
  return { id: String(r.id_reserva), alojId: String(r.id_alojamiento), alojamiento: r.alojamiento.nombre,
    hostId: String(r.alojamiento.id_usuario), userId: String(r.id_usuario), huesped: r.usuario.nombre,
    desde, hasta, adultos: r.adultos, ninos: r.ninos, total: Number(r.costo_reserva?.total ?? 0),
    estado: temporalState(r.estado, desde, hasta), estadoReserva: r.estado };
}
