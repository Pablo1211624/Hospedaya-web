export type User = { id: string; nombre: string; correo: string; rol: 'HUESPED' | 'ANFITRION' | 'ADMINISTRADOR'; biografia: string }
export type Availability = { id: string; desde: string; hasta: string; estado: 'DISPONIBLE' | 'NO_DISPONIBLE' }
export type Aloj = { id: string; nombre: string; ciudad: string; direccion: string; precio: number; cap: number; hab: number; banos: number; desc: string; host: string; hostId: string; estado: string; amenidades: string; reglas: string; imagenes: string[]; disponibilidad: Availability[] }
export type Reserva = { id: string; alojId: string; alojamiento: string; hostId: string; userId: string; desde: string; hasta: string; adultos: number; ninos: number; total: number; estado: string; estadoReserva: string; huesped: string }
export const CIUDADES = ['Ciudad de Guatemala', 'Antigua Guatemala', 'Cobán', 'Amatitlán', 'Fraijanes', 'Villa Nueva', 'Livingston', 'Panajachel']
export const q = (n: number) => n.toLocaleString('es-GT', { style: 'currency', currency: 'GTQ' })
export const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
export const noches = (d: string, h: string) => d && h ? Math.round((+new Date(h) - +new Date(d)) / 864e5) : 0
