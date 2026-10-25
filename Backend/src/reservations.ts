import { Router } from 'express';
import { db } from './db.js';
import { auth, hostOnly } from './auth.js';
import { bookingSchema, dates, HttpError, idSchema, today } from './domain.js';
import { reservationDTO, reservationInclude } from './serializers.js';
import type { Prisma } from '../generated/prisma/client.js';

import { lockLodging } from './lodging-lock.js';
function validateTotal(total: { greaterThan: (value: string) => boolean }) {
  if (total.greaterThan('9999999999.99')) throw new HttpError(400, 'El costo total supera el máximo permitido. Reduce la duración de la estadía.');
}
export async function checkAvailability(tx: Prisma.TransactionClient, id: bigint, start: Date, end: Date, except?: bigint) {
  const allowed = await tx.disponibilidad.findFirst({ where: { id_alojamiento: id, estado: 'DISPONIBLE', fecha_inicio: { lte: start }, fecha_fin: { gte: end } } });
  const blocked = await tx.disponibilidad.findFirst({ where: { id_alojamiento: id, estado: 'NO_DISPONIBLE', fecha_inicio: { lt: end }, fecha_fin: { gt: start } } });
  const overlap = await tx.reserva.findFirst({ where: { id_alojamiento: id, estado: 'CONFIRMADA', fecha_entrada: { lt: end }, fecha_salida: { gt: start }, ...(except ? { id_reserva: { not: except } } : {}) } });
  if (!allowed || blocked || overlap) throw new HttpError(409, 'El alojamiento no está disponible en esas fechas.');
}
export const reservations = Router();
reservations.use(auth);
reservations.get('/', async (req, res) => {
  const rows = await db.reserva.findMany({ where: { id_usuario: req.user!.id_usuario }, include: reservationInclude, orderBy: { fecha_entrada: 'desc' } });
  res.json(rows.map(reservationDTO));
});
reservations.post('/', async (req, res) => {
  const b = bookingSchema.parse(req.body), nights = dates(b.desde, b.hasta);
  const result = await db.$transaction(async tx => {
    const a = await lockLodging(tx, BigInt(b.alojId));
    if (a.estado !== 'ACTIVO') throw new HttpError(409, 'El alojamiento está inactivo.');
    if (a.id_usuario === req.user!.id_usuario) throw new HttpError(400, 'No puedes reservar tu propio alojamiento.');
    if (b.adultos + b.ninos > a.capacidad) throw new HttpError(400, 'La cantidad de huéspedes supera la capacidad.');
    await checkAvailability(tx, a.id_alojamiento, new Date(b.desde), new Date(b.hasta));
    validateTotal(a.precio_noche.mul(nights));
    return tx.reserva.create({ data: { id_usuario: req.user!.id_usuario, id_alojamiento: a.id_alojamiento,
      fecha_entrada: new Date(b.desde), fecha_salida: new Date(b.hasta), cantidad_huespedes: b.adultos + b.ninos,
      adultos: b.adultos, ninos: b.ninos, estado: 'CONFIRMADA', costo_reserva: { create: {
        precio_noche_aplicado: a.precio_noche, cantidad_noches: nights, total: a.precio_noche.mul(nights) } } }, include: reservationInclude });
  });
  res.status(201).json(reservationDTO(result));
});
reservations.patch('/:id', async (req, res) => {
  const id = BigInt(idSchema.parse(req.params.id));
  const b = bookingSchema.omit({ alojId: true }).parse(req.body), nights = dates(b.desde, b.hasta);
  const original = await db.reserva.findUnique({ where: { id_reserva: id } });
  if (!original || original.id_usuario !== req.user!.id_usuario) throw new HttpError(404, 'Reserva no encontrada.');
  const result = await db.$transaction(async tx => {
    const a = await lockLodging(tx, original.id_alojamiento);
    const r = await tx.reserva.findUniqueOrThrow({ where: { id_reserva: id }, include: { costo_reserva: true } });
    if (r.estado !== 'CONFIRMADA' || r.fecha_entrada.toISOString().slice(0, 10) <= today()) throw new HttpError(409, 'Solo puedes modificar reservas confirmadas antes del día de llegada.');
    if (a.estado !== 'ACTIVO' || b.adultos + b.ninos > a.capacidad) throw new HttpError(409, 'Alojamiento inactivo o capacidad insuficiente.');
    await checkAvailability(tx, a.id_alojamiento, new Date(b.desde), new Date(b.hasta), id);
    const price = r.costo_reserva?.precio_noche_aplicado ?? a.precio_noche;
    validateTotal(price.mul(nights));
    return tx.reserva.update({ where: { id_reserva: id }, data: { fecha_entrada: new Date(b.desde), fecha_salida: new Date(b.hasta), adultos: b.adultos, ninos: b.ninos,
      cantidad_huespedes: b.adultos + b.ninos, costo_reserva: { upsert: { create: { precio_noche_aplicado: price, cantidad_noches: nights, total: price.mul(nights) }, update: { cantidad_noches: nights, total: price.mul(nights) } } } }, include: reservationInclude });
  });
  res.json(reservationDTO(result));
});
reservations.patch('/:id/cancelar', async (req, res) => {
  if (Object.keys(req.body ?? {}).length) throw new HttpError(400, 'Esta operación no recibe campos.');
  const id = BigInt(idSchema.parse(req.params.id));
  const original = await db.reserva.findUnique({ where: { id_reserva: id } });
  if (!original) throw new HttpError(404, 'Reserva no encontrada.');
  const result = await db.$transaction(async tx => {
    const a = await lockLodging(tx, original.id_alojamiento);
    const r = await tx.reserva.findUniqueOrThrow({ where: { id_reserva: id } });
    if (r.id_usuario !== req.user!.id_usuario && a.id_usuario !== req.user!.id_usuario) throw new HttpError(404, 'Reserva no encontrada.');
    if (r.estado === 'CANCELADA') return tx.reserva.findUniqueOrThrow({ where: { id_reserva: id }, include: reservationInclude });
    if (!['CONFIRMADA', 'PENDIENTE'].includes(r.estado) || r.fecha_entrada.toISOString().slice(0, 10) <= today()) throw new HttpError(409, 'Solo puedes cancelar antes del día de llegada.');
    return tx.reserva.update({ where: { id_reserva: id }, data: { estado: 'CANCELADA' }, include: reservationInclude });
  });
  res.json(reservationDTO(result));
});

export const reservationHosts = Router();
reservationHosts.use(auth, hostOnly);
reservationHosts.get('/reservas', async (req, res) => res.json((await db.reserva.findMany({ where: { alojamiento: { id_usuario: req.user!.id_usuario } }, include: reservationInclude, orderBy: { fecha_entrada: 'asc' } })).map(reservationDTO)));
