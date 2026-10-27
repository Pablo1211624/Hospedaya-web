import bcrypt from 'bcryptjs';
import { db } from '../src/db.js';
import { today } from '../src/lodging-validation.js';
// Explicit opt-in; never overwrite passwords or properties belonging to existing accounts.
try {
  if (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 12 || Buffer.byteLength(process.env.SEED_PASSWORD, 'utf8') > 72) {
    throw new Error('Define SEED_PASSWORD con al menos 12 caracteres y un máximo de 72 bytes UTF-8.');
  }
  const hash = await bcrypt.hash(process.env.SEED_PASSWORD, 12);
  for (const [nombre, correo, rol] of [['Huésped Demo', 'huesped@demo.hospedaya', 'HUESPED'], ['Anfitrión Demo', 'anfitrion@demo.hospedaya', 'ANFITRION']]) {
    await db.usuario.upsert({ where: { correo }, update: {}, create: { nombre, correo, rol, password_hash: hash } });
  }
  const host = await db.usuario.findUniqueOrThrow({ where: { correo: 'anfitrion@demo.hospedaya' } });
  if (!await db.alojamiento.findFirst({ where: { id_usuario: host.id_usuario } })) {
    const start = new Date(today()); const end = new Date(start); end.setUTCDate(end.getUTCDate() + 365);
    await db.alojamiento.create({ data: { nombre: 'Casa Colonial de demostración', ciudad: 'Antigua Guatemala', direccion: 'Centro de Antigua Guatemala', descripcion: 'Casa de demostración con jardín y cocina equipada.', capacidad: 4, precio_noche: 450, habitaciones: 2, banos: 1, amenidades: 'Wi-Fi, cocina, jardín', reglas: 'No fumar. Respetar el descanso de los vecinos.', id_usuario: host.id_usuario,
      imagen_alojamiento: { create: [{ url_imagen: '/uploads/alojamientos/images.jpg', es_principal: true }, { url_imagen: '/uploads/alojamientos/images2.jpg', orden: 2 }] },
      disponibilidad: { create: { fecha_inicio: start, fecha_fin: end } } } });
  }
  console.log('Datos demo preparados; las cuentas existentes no se modificaron.');
} finally { await db.$disconnect(); }
