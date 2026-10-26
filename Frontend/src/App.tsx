import { useResource } from './resource'
import { useState, type FormEvent } from 'react'
import { HashRouter, Routes, Route, Link, NavLink, Navigate, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { api, saveToken } from './api'
import { type Aloj, type User, CIUDADES, q, hoy, noches } from './data'
import { SessionProvider } from './session'
import { useSession } from './session-context'
import { ErrorText, Guard, Photo, Sky } from './ui'
import { Reservar, Perfil, EditarReserva } from './guest'
import { Anfitrion, MisAlojs, AlojForm } from './host'

export default function App() {
  return <SessionProvider><HashRouter><Header /><main><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/alojamiento/:id" element={<Detalle />} />
    <Route path="/reservar/:id" element={<Guard><Reservar /></Guard>} />
    <Route path="/login" element={<Auth modo="login" />} />
    <Route path="/registro" element={<Auth modo="registro" />} />
    <Route path="/perfil" element={<Guard><Perfil /></Guard>} />
    <Route path="/perfil/reservas" element={<Guard><Perfil /></Guard>} />
    <Route path="/perfil/reservas/:id" element={<Guard><EditarReserva /></Guard>} />
    <Route path="/anfitrion" element={<Guard host><Anfitrion /></Guard>} />
    <Route path="/anfitrion/alojamientos" element={<Guard host><MisAlojs /></Guard>} />
    <Route path="/anfitrion/alojamientos/nuevo" element={<Guard host><AlojForm /></Guard>} />
    <Route path="/anfitrion/alojamientos/:id" element={<Guard host><AlojForm /></Guard>} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes></main></HashRouter></SessionProvider>
}
function Header() {
  const { user, logout } = useSession(), nav = useNavigate(), loc = useLocation()
  const host = loc.pathname.startsWith('/anfitrion')
  return <header className="top"><Link to="/" className="logo" aria-label="HospedaYa, inicio">✦ HospedaYa</Link><nav aria-label="Principal" className="acciones">
    {user && user.rol !== 'HUESPED' && <><NavLink className="btn suave" to="/anfitrion/alojamientos/nuevo">Añadir alojamiento</NavLink><NavLink className="btn suave" to="/anfitrion/alojamientos">Mis alojamientos</NavLink><Link className="btn" to={host ? '/perfil' : '/anfitrion'}>{host ? 'Modo huésped' : 'Modo anfitrión'}</Link></>}
    {user && <NavLink className="btn suave" to="/perfil">Perfil</NavLink>}
    {user ? <button className="btn suave" onClick={() => { logout(); nav('/') }}>Salir</button> : <Link className="btn" to="/login">Iniciar sesión</Link>}
  </nav></header>
}
function Home() {
  const [dest, setDest] = useState(''), [d, setD] = useState(''), [h, setH] = useState(''), [a, setA] = useState(1), [n, setN] = useState(0)
  const [min, setMin] = useState(''), [max, setMax] = useState(''), [query, setQuery] = useState(''), [error, setError] = useState('')
  const result = useResource<Aloj[]>('/alojamientos' + query)
  const search = (e: FormEvent) => {
    e.preventDefault(); setError('')
    if (!!d !== !!h || (d && (d < hoy() || h <= d))) return setError('Selecciona un rango de fechas válido.')
    if (min && max && +min > +max) return setError('El precio mínimo no puede superar al máximo.')
    const params = new URLSearchParams({ ciudad: dest, huespedes: String(a + n) })
    if (d && h) { params.set('desde', d); params.set('hasta', h) }
    if (min) params.set('precioMin', min); if (max) params.set('precioMax', max)
    setQuery('?' + params); result.reload()
  }
  const qs = new URLSearchParams({ d, h, a: String(a), n: String(n) })
  return <><Sky><div className="hero"><h1>Descubre el mundo con comodidad</h1><form className="buscador" role="search" onSubmit={search}>
    <label className="campo">Destino<input value={dest} onChange={e => setDest(e.target.value)} list="ciudades" placeholder="¿A dónde te gustaría ir?" /><datalist id="ciudades">{CIUDADES.map(c => <option key={c}>{c}</option>)}</datalist></label>
    <label className="campo">Llegada<input type="date" min={hoy()} value={d} onChange={e => setD(e.target.value)} /></label>
    <label className="campo">Salida<input type="date" min={d || hoy()} value={h} onChange={e => setH(e.target.value)} /></label>
    <label className="campo">Adultos<input type="number" min={1} max={100} value={a} onChange={e => setA(+e.target.value)} required /></label>
    <label className="campo">Niños<input type="number" min={0} max={100} value={n} onChange={e => setN(+e.target.value)} required /></label>
    <label className="campo">Precio mín. (Q)<input type="number" min={0} value={min} onChange={e => setMin(e.target.value)} /></label>
    <label className="campo">Precio máx. (Q)<input type="number" min={0} value={max} onChange={e => setMax(e.target.value)} /></label>
    <button className="btn">Buscar</button></form><ErrorText text={error} /></div></Sky>
    <section className="lista"><h2>Alojamientos en Guatemala</h2><ErrorText text={result.error} />{result.loading ? <p role="status">Buscando alojamientos…</p> : <>
      {result.data?.length === 0 && <p>No encontramos alojamientos con esos filtros.</p>}
      <div className="grid">{result.data?.map(x => <Link key={x.id} className="card" to={'/alojamiento/' + x.id + '?' + qs}><Photo url={x.imagenes[0]} alt={x.nombre} /><strong>{x.nombre}</strong><span>{x.ciudad}</span><span>{q(x.precio)} por noche</span></Link>)}</div></>}
    </section></>
}
function Detalle() {
  const { id } = useParams(), [sp] = useSearchParams(), nav = useNavigate()
  const result = useResource<Aloj>('/alojamientos/' + id)
  const [d, setD] = useState(sp.get('d') || ''), [h, setH] = useState(sp.get('h') || ''), [a, setA] = useState(Number(sp.get('a')) || 1), [n, setN] = useState(Number(sp.get('n')) || 0)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  if (result.loading) return <p role="status">Cargando alojamiento…</p>
  if (!result.data || result.error) return <ErrorText text={result.error || 'Alojamiento no encontrado.'} />
  const x = result.data, nn = noches(d, h)
  const check = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const found = await api<Aloj[]>('/alojamientos?' + new URLSearchParams({ desde: d, hasta: h, huespedes: String(a + n) }))
      if (!found.some(item => item.id === id)) throw new Error('No está disponible para esas fechas y cantidad de huéspedes.')
      nav('/reservar/' + id + '?' + new URLSearchParams({ d, h, a: String(a), n: String(n) }))
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <><Sky title={x.nombre}><div className="galeria">{x.imagenes.map((url, i) => <Photo key={url + i} url={url} alt={x.nombre + ', foto ' + (i + 1)} />)}</div></Sky><section className="detalle"><div>
    <h2>{x.nombre}, {x.ciudad}</h2><p>{x.direccion}</p><p>{x.cap} huéspedes · {x.hab} habitaciones · {x.banos} baños</p><p><strong>Anfitrión: {x.host}</strong></p><p>{x.desc}</p><h3>Amenidades</h3><p>{x.amenidades || 'No especificadas.'}</p><h3>Reglas</h3><p>{x.reglas || 'Consulta con el anfitrión.'}</p>
    </div><form className="panel" onSubmit={check}><strong className="tot">{q(x.precio)} por noche</strong><div className="form2">
      <label>Llegada<input type="date" min={hoy()} value={d} onChange={e => setD(e.target.value)} required /></label><label>Salida<input type="date" min={d || hoy()} value={h} onChange={e => setH(e.target.value)} required /></label>
      <label>Adultos<input type="number" min={1} max={x.cap} value={a} onChange={e => setA(+e.target.value)} required /></label><label>Niños<input type="number" min={0} max={x.cap} value={n} onChange={e => setN(+e.target.value)} required /></label></div>
      {nn > 0 && <p>Total estimado: {q(nn * x.precio)}</p>}<ErrorText text={error} /><button className="btn full" disabled={busy || nn <= 0}>{busy ? 'Comprobando…' : 'Reservar'}</button></form></section></>
}
function Auth({ modo }: { modo: 'login' | 'registro' }) {
  const { setUser } = useSession(), nav = useNavigate(), loc = useLocation()
  const [correo, setCorreo] = useState(''), [password, setPassword] = useState(''), [repeat, setRepeat] = useState(''), [nombre, setNombre] = useState(''), [rol, setRol] = useState('HUESPED')
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError('')
    if (modo === 'registro' && password !== repeat) return setError('Las contraseñas no coinciden.')
    setBusy(true)
    try {
      const session = await api<{ token: string; user: User }>('/auth/' + modo, 'POST', { correo: correo.trim(), password, ...(modo === 'registro' ? { nombre, rol } : {}) })
      saveToken(session.token); setUser(session.user); nav((loc.state as { from?: string } | null)?.from || '/')
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <Sky><form className="panel auth" onSubmit={submit}><h1>{modo === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}</h1>
    {modo === 'registro' && <><label>Nombre<input value={nombre} onChange={e => setNombre(e.target.value)} required minLength={2} maxLength={100} /></label><label>Tipo de cuenta<select value={rol} onChange={e => setRol(e.target.value)}><option value="HUESPED">Huésped</option><option value="ANFITRION">Anfitrión (también puede reservar)</option></select></label></>}
    <label>E-mail<input type="email" value={correo} onChange={e => setCorreo(e.target.value)} required autoComplete="email" /></label><label>Contraseña<input type="password" minLength={8} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} required autoComplete={modo === 'login' ? 'current-password' : 'new-password'} /></label>
    {modo === 'registro' && <label>Confirmar contraseña<input type="password" value={repeat} onChange={e => setRepeat(e.target.value)} required autoComplete="new-password" /></label>}
    <ErrorText text={error} /><button className="btn full" disabled={busy}>{busy ? 'Procesando…' : modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</button><p><Link to={modo === 'login' ? '/registro' : '/login'} state={loc.state}>{modo === 'login' ? 'Crear una cuenta' : 'Ya tengo una cuenta'}</Link></p>
  </form></Sky>
}
