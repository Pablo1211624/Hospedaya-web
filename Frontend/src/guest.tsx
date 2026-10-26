import { useResource } from './resource'
import { useState, type FormEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from './api'
import { type Aloj, type Reserva, type User, hoy, noches, q } from './data'
import { useSession } from './session-context'
import { ErrorText, Sky } from './ui'
import { emptyPayment, validateDemoPayment } from './payment'

export function Reservar() {
  const { id } = useParams(), [sp] = useSearchParams()
  const result = useResource<Aloj>('/alojamientos/' + id)
  const [p, setP] = useState(emptyPayment), [step, setStep] = useState(1), [error, setError] = useState(''), [busy, setBusy] = useState(false), [confirmed, setConfirmed] = useState<Reserva | null>(null)
  const d = sp.get('d') || '', h = sp.get('h') || '', a = Number(sp.get('a') || 1), n = Number(sp.get('n') || 0)
  if (confirmed) return <Sky title="Reserva confirmada"><div className="panel centro-col"><p role="status">Tu reserva {confirmed.id} quedó registrada. Pago ficticio: no se realizó ningún cobro.</p><p>Total de la reserva: {q(confirmed.total)}</p><Link className="btn" to="/perfil/reservas">Ver mis reservas</Link></div></Sky>
  if (result.loading) return <p role="status">Cargando…</p>
  if (!result.data || result.error) return <ErrorText text={result.error || 'Alojamiento no encontrado.'} />
  const x = result.data
  if (!Number.isInteger(a) || !Number.isInteger(n) || a < 1 || n < 0 || a + n > x.cap || d < hoy() || !Number.isFinite(noches(d, h)) || noches(d, h) <= 0) return <Sky title="Revisa tu reserva"><p>Selecciona fechas y huéspedes válidos.</p><Link to={'/alojamiento/' + id}>Volver al alojamiento</Link></Sky>
  const next = (e: FormEvent) => {
    e.preventDefault()
    const message = validateDemoPayment(p)
    if (message) return setError(message)
    setP(emptyPayment); setError(''); setStep(2)
  }
  const confirm = async () => {
    setBusy(true); setError('')
    try {
      // Deliberately enumerate only booking fields. No payment data enters the API.
      const booking = await api<Reserva>('/reservas', 'POST', { alojId: id, desde: d, hasta: h, adultos: a, ninos: n })
      setP(emptyPayment); setConfirmed(booking)
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <Sky title="Confirma la reserva"><div className="reservar"><div><div className="panel paso act">
    <h2>1. Simulación de pago</h2><p>Prototipo académico. Usa datos ficticios: no se verifica la tarjeta ni se realiza ningún cobro.</p>
    {step === 1 && <form onSubmit={next} className="form" autoComplete="off">
      <label>Número de tarjeta de prueba<input inputMode="numeric" maxLength={19} required value={p.num} onChange={e => setP({ ...p, num: e.target.value })} placeholder="1111 2222 3333 4444" /></label>
      <label>Vencimiento (mm/aaaa)<input maxLength={7} placeholder="12/2030" required value={p.exp} onChange={e => setP({ ...p, exp: e.target.value })} /></label>
      <label>CVV de prueba<input type="password" inputMode="numeric" maxLength={4} required value={p.cvv} onChange={e => setP({ ...p, cvv: e.target.value })} /></label>
      <label>Nombre de prueba<input maxLength={100} required value={p.nom} onChange={e => setP({ ...p, nom: e.target.value })} /></label>
      <label>Código postal<input inputMode="numeric" maxLength={10} required value={p.cp} onChange={e => setP({ ...p, cp: e.target.value })} /></label>
      <ErrorText text={error} /><button className="btn">Siguiente</button></form>}
    </div><div className="panel paso"><h2>2. Confirma la reserva</h2>{step === 2 && <><p>Validación de formato completada. El pago es ficticio y no se cobrará.</p><ErrorText text={error} /><button className="btn" disabled={busy} onClick={confirm}>{busy ? 'Guardando…' : 'Confirmar reserva'}</button></>}</div></div>
    <aside className="panel resumen"><h2>{x.nombre}</h2><p>{d} al {h}</p><p>{a} adultos, {n} niños</p><p>{noches(d, h)} noches × {q(x.precio)}</p><strong>Total estimado: {q(noches(d, h) * x.precio)}</strong><p>El total definitivo se calcula al confirmar. Puedes cancelar antes del día de llegada.</p></aside>
  </div></Sky>
}
export function Perfil() {
  const { user, setUser } = useSession(), loc = useLocation()
  const [nombre, setNombre] = useState(user!.nombre), [bio, setBio] = useState(user!.biografia), [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  const bookings = useResource<Reserva[]>('/reservas')
  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    try { setUser(await api<User>('/auth/me', 'PATCH', { nombre, biografia: bio })); setMessage('Perfil actualizado.') }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  const cancel = async (id: string) => {
    if (!window.confirm('¿Cancelar esta reserva?')) return
    setBusy(true); setError('')
    try { await api('/reservas/' + id + '/cancelar', 'PATCH'); bookings.reload() }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <div className="perfil"><aside className="panel lateral"><h2>Perfil</h2><NavLink end to="/perfil">Sobre mí</NavLink><NavLink to="/perfil/reservas">Mis reservas</NavLink></aside><Sky>
    <ErrorText text={error} />{loc.pathname.endsWith('/reservas') ? <div className="panel centro-col"><h2>Mis reservas</h2><ErrorText text={bookings.error} />{bookings.loading && <p role="status">Cargando…</p>}{bookings.data?.length === 0 && <p>Aún no tienes reservas.</p>}
      {bookings.data?.map(r => <div className="fila" key={r.id}><div><strong>{r.alojamiento}</strong><p>{r.desde} → {r.hasta} · {q(r.total)}</p></div><span>{r.estado}</span>{r.desde > hoy() && ['CONFIRMADA', 'PENDIENTE'].includes(r.estadoReserva) && <><button className="btn suave" disabled={busy} onClick={() => cancel(r.id)}>Cancelar</button>{r.estadoReserva === 'CONFIRMADA' && <Link to={'/perfil/reservas/' + r.id}>Modificar</Link>}</>}</div>)}
    </div> : <form className="panel auth" onSubmit={save}><h2>Sobre mí</h2><p>{user!.correo} · {user!.rol}</p><label>Nombre<input value={nombre} onChange={e => setNombre(e.target.value)} minLength={2} maxLength={100} required /></label><label htmlFor="profile-bio">Biografía</label><textarea id="profile-bio" value={bio} onChange={e => setBio(e.target.value)} maxLength={1000} /><button className="btn" disabled={busy}>Guardar perfil</button>{message && <p role="status">{message}</p>}</form>}
  </Sky></div>
}
export function EditarReserva() {
  const { id } = useParams(), result = useResource<Reserva[]>('/reservas')
  if (result.loading) return <p role="status">Cargando reserva…</p>
  const booking = result.data?.find(r => r.id === id)
  return booking ? <EditBooking key={booking.id} booking={booking} /> : <ErrorText text={result.error || 'Reserva no encontrada.'} />
}
function EditBooking({ booking: r }: { booking: Reserva }) {
  const nav = useNavigate(), [desde, setDesde] = useState(r.desde), [hasta, setHasta] = useState(r.hasta), [adultos, setAdultos] = useState(r.adultos), [ninos, setNinos] = useState(r.ninos), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError('')
    try { await api('/reservas/' + r.id, 'PATCH', { desde, hasta, adultos, ninos }); nav('/perfil/reservas') }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <Sky title="Modificar reserva"><form className="panel auth" onSubmit={submit}><h2>{r.alojamiento}</h2><p>Se conserva el precio por noche original y se recalcula el total según las nuevas fechas.</p><label>Llegada<input type="date" min={hoy()} value={desde} onChange={e => setDesde(e.target.value)} required /></label><label>Salida<input type="date" min={desde} value={hasta} onChange={e => setHasta(e.target.value)} required /></label><label>Adultos<input type="number" min={1} max={100} value={adultos} onChange={e => setAdultos(+e.target.value)} required /></label><label>Niños<input type="number" min={0} max={100} value={ninos} onChange={e => setNinos(+e.target.value)} required /></label><ErrorText text={error} /><button className="btn" disabled={busy}>Guardar cambios</button></form></Sky>
}
