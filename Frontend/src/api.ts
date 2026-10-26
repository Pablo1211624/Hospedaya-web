const ROOT = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const mediaUrl = (url: string) => url.startsWith('/') ? ROOT.replace(/\/api\/?$/, '') + url : url;
let token = sessionStorage.getItem('hospedaya.token');
export function saveToken(value: string | null) {
  token = value;
  if (value) sessionStorage.setItem('hospedaya.token', value); else sessionStorage.removeItem('hospedaya.token');
}
export const hasToken = () => Boolean(token);
export class ApiError extends Error { status: number; constructor(status: number, message: string) { super(message); this.status = status; } }
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try { response = await fetch(ROOT + path, { method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }); }
  catch { throw new Error('No se pudo conectar con el servidor. Intenta nuevamente.'); }
  if (response.status === 204) return undefined as T;
  let data;
  try { data = await response.json(); }
  catch { throw new ApiError(response.status, 'El servidor devolvió una respuesta inesperada. Intenta nuevamente.'); }
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/login')) { saveToken(null); window.dispatchEvent(new Event('session-expired')); }
    throw new ApiError(response.status, data.detalles?.map((d: { campo: string; mensaje: string }) => `${d.campo}: ${d.mensaje}`).join('. ') || data.error || 'No se pudo completar la operación.');
  }
  return data;
}
