import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { HttpError } from './errors.js';

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
export function token(id: bigint) { return jwt.sign({}, secret!, { subject: id.toString(), expiresIn: '2h', issuer: 'hospedaya', audience: 'hospedaya-web', algorithm: 'HS256' }); }
export type SessionUser = { id_usuario: bigint; nombre: string; correo: string; rol: string; biografia: string };
declare global { namespace Express { interface Request { user?: SessionUser } } }
export const auth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Inicia sesión para continuar.');
    let payload: jwt.JwtPayload;
    try {
      const verified = jwt.verify(header.slice(7), secret!, { algorithms: ['HS256'], issuer: 'hospedaya', audience: 'hospedaya-web' });
      if (typeof verified === 'string' || !verified.sub || !/^[1-9]\d{0,18}$/.test(verified.sub) || BigInt(verified.sub) > 9223372036854775807n) throw new Error();
      payload = verified;
    } catch { throw new HttpError(401, 'La sesión no es válida o ha vencido.'); }
    const user = await db.usuario.findUnique({ where: { id_usuario: BigInt(payload.sub!) }, select: { id_usuario: true, nombre: true, correo: true, rol: true, biografia: true, estado: true } });
    if (!user || user.estado !== 'ACTIVO') throw new HttpError(401, 'La cuenta no está activa.');
    req.user = user; next();
  } catch (err) { next(err); }
};
export const hostOnly: RequestHandler = (req, _res, next) => {
  if (!['ANFITRION', 'ADMINISTRADOR'].includes(req.user?.rol ?? '')) return next(new HttpError(403, 'Se requiere una cuenta de anfitrión.'));
  next();
};
export const publicUser = (u: SessionUser) => ({ id: String(u.id_usuario), nombre: u.nombre, correo: u.correo, rol: u.rol, biografia: u.biografia });
