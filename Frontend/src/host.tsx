import { useResource } from './resource'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from './api'
import { type Aloj, type Reserva, hoy, q } from './data'
import { ErrorText, Photo, Sky } from './ui'

export function Anfitrion() {
  const result = useResource<Reserva[]>('/anfitrion/reservas'), [tab, setTab] = useState('Próxima'), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const cancel = async (id: string) => {
    if (!window.confirm('¿Cancelar esta reserva recibida?')) return
    setBusy(true); setError('')
    try { await api('/reservas/' + id + '/cancelar', 'PATCH'); result.reload() }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  const rows = result.data?.filter(r => r.estado === tab)
  return <Sky title="Reservas programadas"><div className="panel centro-col ancho"><div className="tabs" role="group" aria-label="Filtrar reservas">{['En curso', 'Próxima', 'Finalizada', 'Cancelada', 'Pendiente'].map(t => <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>)}</div><ErrorText text={error || result.error} />{result.loading && <p role="status">Cargando…</p>}{rows?.length === 0 && <p>No hay reservas en esta categoría.</p>}{rows?.map(r => <div className="fila" key={r.id}><div><strong>{r.alojamiento}</strong><p>{r.huesped} · {r.desde} → {r.hasta}</p><small>{r.adultos + r.ninos} huéspedes · {q(r.total)}</small></div><span>{r.estado}</span>{r.desde > hoy() && ['CONFIRMADA', 'PENDIENTE'].includes(r.estadoReserva) && <button className="btn suave" disabled={busy} onClick={() => cancel(r.id)}>Cancelar</button>}</div>)}</div></Sky>
}
export function MisAlojs() {
  const result = useResource<Aloj[]>('/anfitrion/alojamientos'), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const deactivate = async (a: Aloj) => {
    if (!window.confirm('¿Desactivar "' + a.nombre + '"? Sus reservas existentes se conservarán.')) return
    setBusy(true); setError('')
    try { await api('/alojamientos/' + a.id, 'DELETE'); result.reload() } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <Sky title="Mis alojamientos"><div className="panel centro-col ancho"><Link className="btn" to="/anfitrion/alojamientos/nuevo">Añadir alojamiento</Link><ErrorText text={error || result.error} />{result.loading && <p role="status">Cargando…</p>}{result.data?.length === 0 && <p>Aún no tienes alojamientos publicados.</p>}{result.data?.map(a => <div className="fila" key={a.id}><div><strong>{a.nombre}</strong><p>{a.ciudad} · {q(a.precio)} por noche · {a.estado}</p></div><Link to={'/anfitrion/alojamientos/' + a.id}>Editar y disponibilidad</Link>{a.estado === 'ACTIVO' && <button className="link" disabled={busy} onClick={() => deactivate(a)}>Desactivar</button>}</div>)}</div></Sky>
}
export function AlojForm() {
  const { id } = useParams(), result = useResource<Aloj[]>('/anfitrion/alojamientos')
  if (result.loading) return <p role="status">Cargando…</p>
  if (result.error) return <ErrorText text={result.error} />
  const ex = result.data?.find(a => a.id === id)
  if (id && !ex) return <ErrorText text="Alojamiento no encontrado o sin acceso." />
  return <LodgingEditor key={id || 'nuevo'} ex={ex} reload={result.reload} />
}
function LodgingEditor({ ex, reload }: { ex?: Aloj; reload: () => void }) {
  const nav = useNavigate()
  const [f, setF] = useState({ nombre: ex?.nombre ?? '', ciudad: ex?.ciudad ?? '', direccion: ex?.direccion ?? '', precio: ex?.precio ?? 450, cap: ex?.cap ?? 2, hab: ex?.hab ?? 1, banos: ex?.banos ?? 1, desc: ex?.desc ?? '', amenidades: ex?.amenidades ?? '', reglas: ex?.reglas ?? '' })
  const [images, setImages] = useState(ex?.imagenes.join('\n') ?? '/uploads/alojamientos/images.jpg')
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const item = await api<Aloj>('/alojamientos' + (ex ? '/' + ex.id : ''), ex ? 'PUT' : 'POST', { ...f, imagenes: images.split('\n').map(v => v.trim()).filter(Boolean) })
      if (!ex) { reload(); nav('/anfitrion/alojamientos/' + item.id) }
      else { setMessage('Alojamiento actualizado.'); reload() }
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <Sky title={ex ? 'Editar alojamiento' : 'Añadir alojamiento'}><form className="panel auth wide-form" onSubmit={submit}>
    {ex?.estado === 'INACTIVO' && <p>Este alojamiento está inactivo y ya no aparece en búsquedas.</p>}
    <label>Nombre<input required minLength={3} maxLength={150} value={f.nombre} onChange={e => setF({ ...f, nombre: e.target.value })} /></label>
    <label>Ciudad<input required minLength={2} maxLength={100} value={f.ciudad} onChange={e => setF({ ...f, ciudad: e.target.value })} /></label>
    <label>Dirección<input required minLength={5} maxLength={255} value={f.direccion} onChange={e => setF({ ...f, direccion: e.target.value })} /></label>
    <div className="form2"><label>Precio por noche (Q)<input type="number" step="0.01" min="0.01" max="99999999.99" required value={f.precio} onChange={e => setF({ ...f, precio: +e.target.value })} /></label>
    <label>Capacidad<input type="number" min={1} max={100} required value={f.cap} onChange={e => setF({ ...f, cap: +e.target.value })} /></label>
    <label>Habitaciones<input type="number" min={1} max={100} required value={f.hab} onChange={e => setF({ ...f, hab: +e.target.value })} /></label>
    <label>Baños<input type="number" min={1} max={100} required value={f.banos} onChange={e => setF({ ...f, banos: +e.target.value })} /></label></div>
    <label>Descripción<textarea required minLength={10} maxLength={5000} value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} /></label>
    <label>Amenidades<textarea maxLength={2000} value={f.amenidades} onChange={e => setF({ ...f, amenidades: e.target.value })} /></label>
    <label>Reglas<textarea maxLength={2000} value={f.reglas} onChange={e => setF({ ...f, reglas: e.target.value })} /></label>
    <label>Fotos: una dirección HTTPS por línea (la primera es la principal)<textarea required value={images} onChange={e => setImages(e.target.value)} /></label><p>También puedes usar las imágenes de demostración: /uploads/alojamientos/images.jpg, images2.jpg, images3.jpg e images4.jpg.</p>
    <Photo url={images.split('\n')[0]?.trim()} alt="Vista previa de la foto principal" /><ErrorText text={error} />{message && <p role="status">{message}</p>}<button className="btn" disabled={busy}>{busy ? 'Guardando…' : 'Guardar alojamiento'}</button>
  </form>{ex && <AvailabilityEditor ex={ex} reload={reload} />}</Sky>
}
function AvailabilityEditor({ ex, reload }: { ex: Aloj; reload: () => void }) {
  const [desde, setDesde] = useState(''), [hasta, setHasta] = useState(''), [estado, setEstado] = useState('DISPONIBLE'), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError('')
    try { await api('/alojamientos/' + ex.id + '/disponibilidad', 'POST', { desde, hasta, estado }); setDesde(''); setHasta(''); reload() }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  const remove = async (id: string) => {
    if (!window.confirm('¿Eliminar este período? Las reservas confirmadas se conservan.')) return
    setBusy(true); setError('')
    try { await api('/alojamientos/' + ex.id + '/disponibilidad/' + id, 'DELETE'); reload() }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <div className="panel auth wide-form"><h2>Disponibilidad</h2><p>Habilita un período que cubra toda la estadía. Los bloqueos tienen prioridad. El día de salida queda libre para otra llegada.</p>
    <form className="form" onSubmit={submit}><label>Desde<input type="date" min={hoy()} value={desde} onChange={e => setDesde(e.target.value)} required /></label><label>Hasta<input type="date" min={desde || hoy()} value={hasta} onChange={e => setHasta(e.target.value)} required /></label><label>Tipo<select value={estado} onChange={e => setEstado(e.target.value)}><option value="DISPONIBLE">Habilitar fechas</option><option value="NO_DISPONIBLE">Bloquear fechas</option></select></label><button className="btn" disabled={busy}>Añadir período</button></form>
    <ErrorText text={error} />{ex.disponibilidad.length === 0 && <p>Sin períodos habilitados: este alojamiento todavía no se puede reservar.</p>}{ex.disponibilidad.map(p => <div className="fila" key={p.id}><span>{p.desde} → {p.hasta} · {p.estado}</span><button disabled={busy} onClick={() => remove(p.id)}>Eliminar período</button></div>)}</div>
}
