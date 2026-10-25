import { Router } from 'express';
import { z } from 'zod';
import { db } from './db.js';
import { auth, hostOnly } from './auth.js';
import { availabilitySchema, dateSchema, dates, today, HttpError, idSchema, lodgingSchema } from './lodging-validation.js';
import { lodgingDTO, lodgingInclude } from './lodging-serializer.js';
import { lockLodging } from './lodging-lock.js';

export const lodgings = Router();
const filters = z.object({ ciudad: z.string().max(100).optional(), huespedes: z.coerce.number().int().min(1).max(100).optional(),
  precioMin: z.coerce.number().min(0).optional(), precioMax: z.coerce.number().min(0).optional(), desde: dateSchema.optional(), hasta: dateSchema.optional() }).strict();
lodgings.get('/', async (req, res) => {
  const q = filters.parse(req.query);
  if (!!q.desde !== !!q.hasta) throw new HttpError(400, 'Indica ambas fechas.');
  if (q.precioMin !== undefined && q.precioMax !== undefined && q.precioMin > q.precioMax) throw new HttpError(400, 'Rango de precios inválido.');
  if (q.desde && q.hasta) dates(q.desde, q.hasta);
  const start = q.desde ? new Date(q.desde) : undefined, end = q.hasta ? new Date(q.hasta) : undefined;
  const rows = await db.alojamiento.findMany({ where: { estado: 'ACTIVO', ciudad: q.ciudad ? { contains: q.ciudad, mode: 'insensitive' } : undefined,
    capacidad: q.huespedes ? { gte: q.huespedes } : undefined, precio_noche: { gte: q.precioMin, lte: q.precioMax },
    ...(start && end ? { AND: [
      { disponibilidad: { some: { estado: 'DISPONIBLE', fecha_inicio: { lte: start }, fecha_fin: { gte: end } } } },
      { disponibilidad: { none: { estado: 'NO_DISPONIBLE', fecha_inicio: { lt: end }, fecha_fin: { gt: start } } } },
      { reserva: { none: { estado: 'CONFIRMADA', fecha_entrada: { lt: end }, fecha_salida: { gt: start } } } },
    ] } : {}) }, include: lodgingInclude, orderBy: { id_alojamiento: 'desc' } });
  res.json(rows.map(lodgingDTO));
});
lodgings.get('/:id', async (req, res) => {
  const a = await db.alojamiento.findUnique({ where: { id_alojamiento: BigInt(idSchema.parse(req.params.id)), estado: 'ACTIVO' }, include: lodgingInclude });
  if (!a) throw new HttpError(404, 'Alojamiento no encontrado.');
  res.json(lodgingDTO(a));
});
lodgings.use(auth, hostOnly);
function data(b: z.infer<typeof lodgingSchema>) {
  return { nombre: b.nombre, ciudad: b.ciudad, direccion: b.direccion, descripcion: b.desc, capacidad: b.cap, precio_noche: b.precio,
    habitaciones: b.hab, banos: b.banos, amenidades: b.amenidades, reglas: b.reglas };
}
const images = (urls: string[]) => urls.map((url_imagen, i) => ({ url_imagen, es_principal: i === 0, orden: i + 1 }));
lodgings.post('/', async (req, res) => {
  const b = lodgingSchema.parse(req.body);
  const a = await db.alojamiento.create({ data: { ...data(b), id_usuario: req.user!.id_usuario, imagen_alojamiento: { create: images(b.imagenes) } }, include: lodgingInclude });
  res.status(201).json(lodgingDTO(a));
});
lodgings.put('/:id', async (req, res) => {
  const id = BigInt(idSchema.parse(req.params.id)), b = lodgingSchema.parse(req.body);
  const result = await db.$transaction(async tx => {
    const a = await lockLodging(tx, id);
    if (a.id_usuario !== req.user!.id_usuario) throw new HttpError(404, 'Alojamiento no encontrado.');
    const oversized = await tx.reserva.findFirst({ where: { id_alojamiento: id, estado: 'CONFIRMADA', fecha_salida: { gt: new Date(today()) }, cantidad_huespedes: { gt: b.cap } } });
    if (oversized) throw new HttpError(409, 'La capacidad no puede ser menor que la de una reserva vigente.');
    await tx.imagen_alojamiento.deleteMany({ where: { id_alojamiento: id } });
    return tx.alojamiento.update({ where: { id_alojamiento: id }, data: { ...data(b), imagen_alojamiento: { create: images(b.imagenes) } }, include: lodgingInclude });
  });
  res.json(lodgingDTO(result));
});
lodgings.delete('/:id', async (req, res) => {
  const id = BigInt(idSchema.parse(req.params.id));
  await db.$transaction(async tx => {
    const a = await lockLodging(tx, id);
    if (a.id_usuario !== req.user!.id_usuario) throw new HttpError(404, 'Alojamiento no encontrado.');
    await tx.alojamiento.update({ where: { id_alojamiento: id }, data: { estado: 'INACTIVO' } });
  });
  res.status(204).end();
});
lodgings.post('/:id/disponibilidad', async (req, res) => {
  const id = BigInt(idSchema.parse(req.params.id)), b = availabilitySchema.parse(req.body);
  dates(b.desde, b.hasta);
  const result = await db.$transaction(async tx => {
    const a = await lockLodging(tx, id);
    if (a.id_usuario !== req.user!.id_usuario) throw new HttpError(404, 'Alojamiento no encontrado.');
    if (b.estado === 'NO_DISPONIBLE') {
      const booked = await tx.reserva.findFirst({ where: { id_alojamiento: id, estado: 'CONFIRMADA', fecha_entrada: { lt: new Date(b.hasta) }, fecha_salida: { gt: new Date(b.desde) } } });
      if (booked) throw new HttpError(409, 'El bloqueo coincide con una reserva confirmada.');
    }
    return tx.disponibilidad.create({ data: { id_alojamiento: id, fecha_inicio: new Date(b.desde), fecha_fin: new Date(b.hasta), estado: b.estado } });
  });
  res.status(201).json({ id: String(result.id_disponibilidad), ...b });
});
lodgings.delete('/:id/disponibilidad/:periodo', async (req, res) => {
  const id = BigInt(idSchema.parse(req.params.id)), periodo = BigInt(idSchema.parse(req.params.periodo));
  await db.$transaction(async tx => {
    const a = await lockLodging(tx, id);
    if (a.id_usuario !== req.user!.id_usuario) throw new HttpError(404, 'Alojamiento no encontrado.');
    const p = await tx.disponibilidad.findFirst({ where: { id_disponibilidad: periodo, id_alojamiento: id } });
    if (!p) throw new HttpError(404, 'Período no encontrado.');
    // Existing confirmed reservations remain valid even if the host closes future sales.
    await tx.disponibilidad.delete({ where: { id_disponibilidad: periodo } });
  });
  res.status(204).end();
});
export const hosts = Router();
hosts.use(auth, hostOnly);
hosts.get('/alojamientos', async (req, res) => res.json((await db.alojamiento.findMany({ where: { id_usuario: req.user!.id_usuario }, include: lodgingInclude })).map(lodgingDTO)));
