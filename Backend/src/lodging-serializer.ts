import type { Prisma } from '../generated/prisma/client.js';
export const lodgingInclude = { usuario: { select: { nombre: true } }, imagen_alojamiento: { orderBy: { orden: 'asc' as const } }, disponibilidad: true } satisfies Prisma.alojamientoInclude;
export function lodgingDTO(a: Prisma.alojamientoGetPayload<{ include: typeof lodgingInclude }>) {
  return { id: String(a.id_alojamiento), nombre: a.nombre, ciudad: a.ciudad, direccion: a.direccion,
    desc: a.descripcion ?? '', precio: Number(a.precio_noche), cap: a.capacidad, hab: a.habitaciones, banos: a.banos,
    host: a.usuario.nombre, hostId: String(a.id_usuario), estado: a.estado, amenidades: a.amenidades, reglas: a.reglas,
    imagenes: a.imagen_alojamiento.map(i => i.url_imagen), disponibilidad: a.disponibilidad.map(d => ({
      id: String(d.id_disponibilidad), desde: d.fecha_inicio.toISOString().slice(0, 10), hasta: d.fecha_fin.toISOString().slice(0, 10), estado: d.estado })) };
}
