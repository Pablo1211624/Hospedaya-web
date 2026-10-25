import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { auth, publicUser, token } from './auth.js';
import { credentials, registration, profileSchema, HttpError } from './auth-validation.js';

export function createApp(registerFeatures?: (app: express.Express) => void) {
const app = express();
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '32kb' }));
app.use('/api', rateLimit({ windowMs: 60000, limit: 150, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Demasiadas solicitudes. Intenta en un minuto.' } }));
const authLimit = rateLimit({ windowMs: 15 * 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Demasiados intentos. Intenta más tarde.' } });
app.get('/api/health', async (_req, res) => { await db.$queryRaw`SELECT 1`; res.json({ status: 'ok' }); });
app.post('/api/auth/registro', authLimit, async (req, res) => {
  const b = registration.parse(req.body);
  const user = await db.usuario.create({ data: { nombre: b.nombre, correo: b.correo, rol: b.rol, password_hash: await bcrypt.hash(b.password, 12) } });
  res.status(201).json({ token: token(user.id_usuario), user: publicUser(user) });
});
app.post('/api/auth/login', authLimit, async (req, res) => {
  const b = credentials.parse(req.body);
  const user = await db.usuario.findUnique({ where: { correo: b.correo } });
  if (!user || user.estado !== 'ACTIVO' || !await bcrypt.compare(b.password, user.password_hash)) throw new HttpError(401, 'Correo o contraseña incorrectos.');
  res.json({ token: token(user.id_usuario), user: publicUser(user) });
});
app.get('/api/auth/me', auth, (req, res) => res.json(publicUser(req.user!)));
app.patch('/api/auth/me', auth, async (req, res) => {
  const data = profileSchema.parse(req.body);
  const u = await db.usuario.update({ where: { id_usuario: req.user!.id_usuario }, data }); res.json(publicUser(u));
});
registerFeatures?.(app);
// Works from src/ and compiled dist/src/ without depending on the shell directory.
const here = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.resolve(here, here.includes(`${path.sep}dist${path.sep}`) ? '../../uploads' : '../uploads'), { dotfiles: 'deny' }));
app.use((_req, _res, next) => next(new HttpError(404, 'Ruta no encontrada.')));
const errorHandler: express.ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof z.ZodError) return void res.status(400).json({ error: 'Revisa los datos enviados.', detalles: err.issues.map(i => ({ campo: i.path.join('.'), mensaje: i.message })) });
  if (err instanceof HttpError) return void res.status(err.status).json({ error: err.message });
  if (err.code === 'P2002') return void res.status(409).json({ error: 'Ya existe un registro con esos datos.' });
  if (err.code === 'P2004' || err.code === 'P2034') return void res.status(409).json({ error: 'La operación entra en conflicto con los datos actuales. Actualiza e intenta de nuevo.' });
  if (err.type === 'entity.parse.failed') return void res.status(400).json({ error: 'JSON inválido.' });
  if (err.type === 'entity.too.large') return void res.status(413).json({ error: 'Solicitud demasiado grande.' });
  // Do not log request bodies, tokens, credentials or database parameters.
  console.error('Error interno', err.name, err.code ?? '');
  res.status(500).json({ error: 'No se pudo completar la operación.' });
};
app.use(errorHandler);

return app;
}
