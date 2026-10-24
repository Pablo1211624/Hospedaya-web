export type Aloj = { id: number; nombre: string; ciudad: string; precio: number; rating: number; cap: number; hab: number; banos: number; desc: string; host: string; emoji: string }
export type Estado = 'Próxima' | 'En curso' | 'Finalizada' | 'Cancelada'
export type Reserva = { id: number; alojId: number; desde: string; hasta: string; adultos: number; ninos: number; total: number; estado: Estado; huesped: string }

export const CIUDADES = ['Ciudad de Guatemala', 'Antigua Guatemala', 'Cobán', 'Amatitlán', 'Fraijanes', 'Villa Nueva', 'Livingston']

export const ALOJS: Aloj[] = [
  { id: 1, nombre: 'Casa del sol en Cobán', ciudad: 'Cobán', precio: 1500, rating: 4.5, cap: 4, hab: 2, banos: 2, host: 'Marcos', emoji: '🏡', desc: 'Casa accesible y espaciosa, ubicada en el centro. Tiene 2 habitaciones, 2 baños, un parqueo, cocina equipada y patio amplio.' },
  { id: 2, nombre: 'Cabaña en Amatitlán', ciudad: 'Amatitlán', precio: 1200, rating: 4.6, cap: 6, hab: 3, banos: 2, host: 'Marcos', emoji: '🛖', desc: 'Cabaña frente al lago con terraza, parrilla y vista a las montañas.' },
  { id: 3, nombre: 'Casa en Fraijanes', ciudad: 'Fraijanes', precio: 1800, rating: 4.7, cap: 8, hab: 4, banos: 3, host: 'Marcos', emoji: '🌲', desc: 'Casa rodeada de bosque con piscina, chimenea y área de juegos.' },
  { id: 3.5, nombre: 'Casa en la playa', ciudad: 'Livingston', precio: 2200, rating: 4.4, cap: 6, hab: 3, banos: 2, host: 'Marcos', emoji: '🏖️', desc: 'Casa a pasos del mar con hamacas y cocina al aire libre.' },
  { id: 5, nombre: 'Apartamento en la zona 10', ciudad: 'Ciudad de Guatemala', precio: 950, rating: 4.8, cap: 2, hab: 1, banos: 1, host: 'María', emoji: '🏙️', desc: 'Apartamento moderno con vista a la ciudad, ideal para viajes de trabajo.' },
  { id: 6, nombre: 'Casa colonial en Antigua', ciudad: 'Antigua Guatemala', precio: 2000, rating: 4.9, cap: 5, hab: 3, banos: 2, host: 'María', emoji: '⛪', desc: 'Casa colonial restaurada con jardín interior, a dos cuadras del parque central.' },
]

export const RESERVAS: Reserva[] = [
  { id: 1, alojId: 1, desde: '2026-10-22', hasta: '2026-10-25', adultos: 2, ninos: 0, total: 4500, estado: 'En curso', huesped: 'marcos@hospedaya.com' },
  { id: 2, alojId: 2, desde: '2026-08-10', hasta: '2026-08-13', adultos: 2, ninos: 1, total: 3600, estado: 'Finalizada', huesped: 'marcos@hospedaya.com' },
  { id: 3, alojId: 3, desde: '2026-07-01', hasta: '2026-07-04', adultos: 4, ninos: 2, total: 5400, estado: 'Finalizada', huesped: 'marcos@hospedaya.com' },
  { id: 4, alojId: 3.5, desde: '2026-12-20', hasta: '2026-12-24', adultos: 3, ninos: 1, total: 8800, estado: 'Próxima', huesped: 'ana@correo.com' },
]
