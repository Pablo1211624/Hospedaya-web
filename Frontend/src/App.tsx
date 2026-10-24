import { createContext, useContext, useState, type ReactNode, type FormEvent } from 'react'
import { HashRouter, Routes, Route, Link, NavLink, Navigate, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'
import { ALOJS, CIUDADES, RESERVAS, type Aloj, type Reserva } from './data'

type Ctx = {
  user: string | null; setUser: (u: string | null) => void
  host: boolean; setHost: (b: boolean) => void
  alojs: Aloj[]; setAlojs: (a: Aloj[]) => void
  reservas: Reserva[]; setReservas: (r: Reserva[]) => void
}
const App0 = createContext<Ctx>(null!)
const useApp = () => useContext(App0)

const q = (n: number) => `Q${n.toLocaleString('es-GT')}`
const noches = (d: string, h: string) => (d && h ? Math.round((+new Date(h) - +new Date(d)) / 864e5) : 0)
const nombre = (email: string) => { const n = email.split('@')[0]; return n.charAt(0).toUpperCase() + n.slice(1) }
const hoy = new Date().toISOString().slice(0, 10)
// RF03: evita double-booking (rangos superpuestos)
const ocupado = (rs: Reserva[], id: number, d: string, h: string) =>
  rs.some(r => r.alojId === id && r.estado !== 'Cancelada' && d < r.hasta && h > r.desde)

export default function App() {
  const [user, setUser] = useState<string | null>(null)
  const [host, setHost] = useState(false)
  const [alojs, setAlojs] = useState(ALOJS)
  const [reservas, setReservas] = useState(RESERVAS)
  return (
    <App0.Provider value={{ user, setUser, host, setHost, alojs, setAlojs, reservas, setReservas }}>
      <HashRouter>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/alojamiento/:id" element={<Detalle />} />
            <Route path="/reservar/:id" element={<Reservar />} />
            <Route path="/login" element={<Auth modo="login" />} />
            <Route path="/registro" element={<Auth modo="registro" />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/perfil/reservas" element={<Perfil />} />
            <Route path="/anfitrion" element={<Anfitrion />} />
            <Route path="/anfitrion/alojamientos" element={<MisAlojs />} />
            <Route path="/anfitrion/alojamientos/nuevo" element={<AlojForm />} />
            <Route path="/anfitrion/alojamientos/:id" element={<AlojForm />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </HashRouter>
    </App0.Provider>
  )
}

function Header() {
  const { user, setUser, host, setHost } = useApp()
  const nav = useNavigate()
  return (
    <header className="top">
      <Link to="/" className="logo" aria-label="HospedaYa, inicio">✦ HospedaYa</Link>
      <nav aria-label="Principal" className="acciones">
        {user && host && <NavLink className="btn suave" to="/anfitrion/alojamientos/nuevo">Añadir un alojamiento</NavLink>}
        {user && host && <NavLink className="btn suave" to="/anfitrion/alojamientos">Mis alojamientos</NavLink>}
        {user && <button className="btn" onClick={() => { setHost(!host); nav(host ? '/perfil' : '/anfitrion') }}>{host ? 'Modo huésped' : 'Modo anfitrión'}</button>}
        {user && !host && <NavLink className="btn suave" to="/perfil">Perfil</NavLink>}
        {user
          ? <button className="btn suave" onClick={() => { setUser(null); setHost(false); nav('/') }}>Salir</button>
          : <Link className="btn" to="/login">Iniciar sesión</Link>}
      </nav>
    </header>
  )
}

function Sky({ children, title }: { children: ReactNode; title?: string }) {
  return <section className="sky">{title && <h1>{title}</h1>}{children}</section>
}

/* ---------- Home ---------- */
function Home() {
  const { alojs } = useApp()
  const [dest, setDest] = useState('')
  const [d, setD] = useState(''); const [h, setH] = useState('')
  const [a, setA] = useState(1); const [n, setN] = useState(0); const [b, setB] = useState(0); const [m, setM] = useState(0)
  const [open, setOpen] = useState<'' | 'dest' | 'fecha' | 'hues'>('')
  const sug = CIUDADES.filter(c => dest && c.toLowerCase().includes(dest.toLowerCase()) && c !== dest)
  const lista = alojs.filter(x => (!dest || x.ciudad.toLowerCase().includes(dest.toLowerCase())) && a + n <= x.cap)
  const qs = new URLSearchParams({ d, h, a: String(a), n: String(n) }).toString()
  return (
    <>
      <Sky>
        <div className="hero">
          <h1>Descubre el mundo con comodidad</h1>
          <form className="buscador" role="search" onSubmit={e => { e.preventDefault(); setOpen('') }}>
            <div className="campo">
              <label htmlFor="dest">Destino</label>
              <input id="dest" value={dest} placeholder="¿A dónde te gustaría ir?" autoComplete="off"
                onFocus={() => setOpen('dest')} onChange={e => { setDest(e.target.value); setOpen('dest') }} />
              {open === 'dest' && sug.length > 0 && (
                <ul className="pop" role="listbox">{sug.map(c => <li key={c}><button type="button" onClick={() => { setDest(c); setOpen('') }}>{c}</button></li>)}</ul>
              )}
            </div>
            <div className="campo">
              <label htmlFor="fecha">Fecha</label>
              <button id="fecha" type="button" className="campo-btn" onClick={() => setOpen(open === 'fecha' ? '' : 'fecha')}>
                {d ? `${d}${h ? ' → ' + h : ''}` : '¿Cuándo?'}
              </button>
              {open === 'fecha' && <div className="pop cal"><Cal d={d} h={h} set={(x, y) => { setD(x); setH(y) }} /></div>}
            </div>
            <div className="campo">
              <label htmlFor="hues">Huéspedes</label>
              <button id="hues" type="button" className="campo-btn" onClick={() => setOpen(open === 'hues' ? '' : 'hues')}>
                {a + n + b > 0 ? `${a + n + b} huésped(es)${m ? `, ${m} mascota(s)` : ''}` : '¿Cuántos?'}
              </button>
              {open === 'hues' && (
                <div className="pop hues">
                  <Cont t="Adultos" s="De 13 años en adelante" v={a} set={setA} min={1} />
                  <Cont t="Niños" s="De 2 a 12 años" v={n} set={setN} />
                  <Cont t="Bebés" s="Menos de 2 años" v={b} set={setB} />
                  <Cont t="Mascotas" v={m} set={setM} />
                </div>
              )}
            </div>
            <button className="lupa" aria-label="Buscar">🔍</button>
          </form>
        </div>
      </Sky>
      <section className="lista">
        <h2>Alojamientos en Guatemala</h2>
        {lista.length === 0 && <p>No encontramos alojamientos con esos filtros.</p>}
        <div className="grid">
          {lista.map(x => (
            <Link key={x.id} className="card" to={`/alojamiento/${x.id}?${qs}`}>
              <div className="foto" aria-hidden>{x.emoji}</div>
              <strong>{x.nombre}</strong>
              <span>{q(x.precio)} por noche</span>
              <span>★ {x.rating}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}

function Cont({ t, s, v, set, min = 0 }: { t: string; s?: string; v: number; set: (n: number) => void; min?: number }) {
  return (
    <div className="cont">
      <div><strong>{t}</strong>{s && <small>{s}</small>}</div>
      <div className="mm">
        <button type="button" aria-label={`Menos ${t}`} onClick={() => set(Math.max(min, v - 1))}>−</button>
        <output aria-live="polite">{v}</output>
        <button type="button" aria-label={`Más ${t}`} onClick={() => set(v + 1)}>+</button>
      </div>
    </div>
  )
}

function Cal({ d, h, set }: { d: string; h: string; set: (d: string, h: string) => void }) {
  const [mes, setMes] = useState(() => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), 1) })
  const dias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const celdas = [...Array(mes.getDay()).fill(0), ...Array.from({ length: dias }, (_, i) => i + 1)]
  const iso = (n: number) => `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`
  const pick = (n: number) => { const x = iso(n); if (!d || h || x <= d) set(x, ''); else set(d, x) }
  return (
    <div>
      <div className="calh">
        <button type="button" aria-label="Mes anterior" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>‹</button>
        <strong>{mes.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' })}</strong>
        <button type="button" aria-label="Mes siguiente" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="dias">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((x, i) => <span key={i} className="dn">{x}</span>)}
        {celdas.map((n, i) => n === 0 ? <span key={i} /> : (
          <button type="button" key={i} disabled={iso(n) < hoy} aria-pressed={iso(n) === d || iso(n) === h}
            className={iso(n) === d || iso(n) === h ? 'sel' : d && h && iso(n) > d && iso(n) < h ? 'rango' : ''} onClick={() => pick(n)}>{n}</button>
        ))}
      </div>
    </div>
  )
}

/* ---------- Detalle ---------- */
function Detalle() {
  const { id } = useParams(); const { alojs, reservas } = useApp()
  const [sp] = useSearchParams(); const nav = useNavigate()
  const x = alojs.find(z => z.id === Number(id))
  const [d, setD] = useState(sp.get('d') || ''); const [h, setH] = useState(sp.get('h') || '')
  const [a, setA] = useState(Number(sp.get('a')) || 1); const [n, setN] = useState(Number(sp.get('n')) || 0)
  if (!x) return <Navigate to="/" />
  const nn = noches(d, h)
  const err = nn <= 0 && d && h ? 'La salida debe ser después de la llegada.' : a + n > x.cap ? `Capacidad máxima: ${x.cap} personas.` : nn > 0 && ocupado(reservas, x.id, d, h) ? 'El alojamiento no está disponible en esas fechas.' : ''
  const ok = nn > 0 && !err
  return (
    <>
      <Sky title={x.nombre}>
        <div className="galeria" aria-hidden>{[x.emoji, '🛋️', '🍳', '🌿'].map((e, i) => <div key={i} className={i === 0 ? 'g0' : ''}>{e}</div>)}</div>
      </Sky>
      <section className="detalle">
        <div>
          <h2>{x.nombre}, {x.ciudad}</h2>
          <p className="sub">Capacidad para {x.cap} personas · {x.hab} habitaciones · {x.banos} baños</p>
          <p>★ {x.rating} · 20 reseñas</p>
          <hr /><p><span className="avatar" aria-hidden /> <strong>Anfitrión: {x.host}</strong></p><hr />
          <p>{x.desc}</p>
        </div>
        <aside className="panel">
          <strong className="tot">{ok ? `${q(nn * x.precio)} en total` : `${q(x.precio)} por noche`}</strong>
          <div className="form2">
            <label>Llegada<input type="date" min={hoy} value={d} onChange={e => setD(e.target.value)} /></label>
            <label>Salida<input type="date" min={d || hoy} value={h} onChange={e => setH(e.target.value)} /></label>
            <label>Adultos<input type="number" min={1} value={a} onChange={e => setA(+e.target.value)} /></label>
            <label>Niños<input type="number" min={0} value={n} onChange={e => setN(+e.target.value)} /></label>
          </div>
          {err && <p role="alert" className="error">{err}</p>}
          <button className="btn full" disabled={!ok} onClick={() => nav(`/reservar/${x.id}?${new URLSearchParams({ d, h, a: String(a), n: String(n) })}`)}>Reservar</button>
        </aside>
      </section>
    </>
  )
}

/* ---------- Reservar ---------- */
function Reservar() {
  const { id } = useParams(); const { user, alojs, reservas, setReservas } = useApp()
  const [sp] = useSearchParams(); const nav = useNavigate(); const loc = useLocation()
  const [paso, setPaso] = useState(1)
  const [p, setP] = useState({ num: '', exp: '', cvv: '', nom: '', cp: '' })
  const [err, setErr] = useState('')
  const x = alojs.find(z => z.id === Number(id))
  const d = sp.get('d') || '', h = sp.get('h') || '', a = Number(sp.get('a')) || 1, n = Number(sp.get('n')) || 0
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />
  if (!x || noches(d, h) <= 0) return <Navigate to="/" />
  const nn = noches(d, h), total = nn * x.precio
  const siguiente = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\d{16}$/.test(p.num.replace(/\s/g, ''))) return setErr('El número de tarjeta debe tener 16 dígitos.')
    if (!/^\d{3,4}$/.test(p.cvv)) return setErr('CVV inválido.')
    setErr(''); setPaso(2)
  }
  const confirmar = () => {
    if (ocupado(reservas, x.id, d, h)) return setErr('Alguien reservó estas fechas mientras tanto.')
    setReservas([...reservas, { id: Date.now(), alojId: x.id, desde: d, hasta: h, adultos: a, ninos: n, total, estado: 'Próxima', huesped: user }])
    nav('/perfil/reservas')
  }
  return (
    <Sky title="Confirma la reserva">
      <div className="reservar">
        <div>
          <div className={`panel paso ${paso === 1 ? 'act' : ''}`}>
            <h2>1. Añade un método de pago</h2>
            {paso === 1 && (
              <form onSubmit={siguiente} className="form">
                <label>Número de tarjeta<input inputMode="numeric" required value={p.num} onChange={e => setP({ ...p, num: e.target.value })} /></label>
                <label>mm/aaaa<input placeholder="mm/aaaa" required value={p.exp} onChange={e => setP({ ...p, exp: e.target.value })} /></label>
                <label>CVV<input inputMode="numeric" required value={p.cvv} onChange={e => setP({ ...p, cvv: e.target.value })} /></label>
                <label>Nombre del propietario<input required value={p.nom} onChange={e => setP({ ...p, nom: e.target.value })} /></label>
                <label>Código postal<input required value={p.cp} onChange={e => setP({ ...p, cp: e.target.value })} /></label>
                {err && <p role="alert" className="error">{err}</p>}
                <button className="btn">Siguiente</button>
              </form>
            )}
          </div>
          <div className={`panel paso ${paso === 2 ? 'act' : ''}`}>
            <h2>2. Confirma la reserva</h2>
            {paso === 2 && <>
              <p>Pago con tarjeta terminada en {p.num.replace(/\s/g, '').slice(-4)}.</p>
              {err && <p role="alert" className="error">{err}</p>}
              <button className="btn" onClick={confirmar}>Reservar</button>
            </>}
          </div>
        </div>
        <aside className="panel resumen">
          <p><strong>{x.nombre}, {x.ciudad}</strong><br />★ {x.rating} · 20 reseñas</p><hr />
          <p><strong>Fechas</strong><br />{d} al {h}</p><hr />
          <p><strong>Huéspedes</strong><br />{a} adulto(s), {n} niño(s)</p><hr />
          <p><strong>Detalles</strong><br />{nn} noches<br />Costo por noche: {q(x.precio)}<br />Total: {q(total)}</p>
        </aside>
      </div>
    </Sky>
  )
}

/* ---------- Login / Registro ---------- */
function Auth({ modo }: { modo: 'login' | 'registro' }) {
  const { setUser } = useApp(); const nav = useNavigate(); const loc = useLocation()
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [err, setErr] = useState('')
  const from = (loc.state as { from?: string } | null)?.from || '/'
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (pw.length < 8) return setErr('La contraseña debe tener mínimo 8 caracteres.')
    if (modo === 'registro' && pw !== pw2) return setErr('Las contraseñas no coinciden.')
    setUser(email); nav(from)
  }
  return (
    <Sky>
      <form className="panel auth" onSubmit={enviar}>
        <h1>{modo === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}</h1>
        <label>E-mail<input type="email" required placeholder="Indica tu dirección de email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Contraseña<input type="password" required placeholder={modo === 'login' ? 'Introduce tu contraseña' : 'Mín. de 8 caracteres'} value={pw} onChange={e => setPw(e.target.value)} /></label>
        {modo === 'registro' && <label>Confirmar contraseña<input type="password" required placeholder="Vuelve a introducir tu contraseña" value={pw2} onChange={e => setPw2(e.target.value)} /></label>}
        {err && <p role="alert" className="error">{err}</p>}
        <p className="centro">{modo === 'login' ? <>¿No tienes una cuenta? <Link to="/registro" state={loc.state}>Regístrate</Link></> : <>¿Ya tienes una cuenta? <Link to="/login" state={loc.state}>Inicia sesión</Link></>}</p>
        <button className="btn full">{modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</button>
        {modo === 'login' && <small className="centro">Demo: marcos@hospedaya.com con cualquier contraseña de 8+ caracteres</small>}
      </form>
    </Sky>
  )
}

/* ---------- Perfil huésped ---------- */
function Perfil() {
  const { user, alojs, reservas, setReservas } = useApp(); const loc = useLocation()
  const [bio, setBio] = useState('Me gusta viajar y deseo encontrar nuevos lugares para hospedarme.'); const [edit, setEdit] = useState(false)
  if (!user) return <Navigate to="/login" state={{ from: '/perfil' }} replace />
  const mias = reservas.filter(r => r.huesped === user)
  const res = loc.pathname.endsWith('reservas')
  return (
    <div className="perfil">
      <aside className="panel lateral">
        <h2>Perfil</h2>
        <NavLink end to="/perfil">Sobre mí</NavLink>
        <NavLink to="/perfil/reservas">Mis reservas</NavLink>
      </aside>
      <Sky>
        {!res ? (
          <div className="centro-col">
            <h2>Sobre mí <button className="btn suave" onClick={() => setEdit(!edit)}>{edit ? 'Listo' : 'Editar'}</button></h2>
            <div className="panel yo"><span className="avatar grande" aria-hidden /><strong>{nombre(user)}</strong><small>Huésped</small></div>
            <div className="panel"><strong>Biografía</strong>{edit ? <textarea value={bio} onChange={e => setBio(e.target.value)} aria-label="Biografía" /> : <p>Soy {nombre(user)}, {bio.charAt(0).toLowerCase() + bio.slice(1)}</p>}</div>
          </div>
        ) : (
          <div className="centro-col">
            <h2>Mis reservas</h2>
            <div className="panel">
              {mias.length === 0 && <p>Aún no tienes reservas.</p>}
              {mias.map(r => { const al = alojs.find(z => z.id === r.alojId); return (
                <div className="fila" key={r.id}>
                  <div><strong>{al?.nombre}</strong><br /><small>{r.desde} → {r.hasta} · {q(r.total)}</small></div>
                  <span>{r.estado}</span>
                  {r.estado === 'Próxima' && <button className="btn suave" onClick={() => setReservas(reservas.map(z => z.id === r.id ? { ...z, estado: 'Cancelada' } : z))}>Cancelar</button>}
                </div>) })}
            </div>
          </div>
        )}
      </Sky>
    </div>
  )
}

/* ---------- Anfitrión ---------- */
function useHost() {
  const c = useApp()
  const mios = c.alojs.filter(a => c.user && a.host === nombre(c.user))
  return { ...c, mios }
}

function Anfitrion() {
  const { user, mios, reservas, setReservas } = useHost()
  const [tab, setTab] = useState<'En curso' | 'Próxima'>('En curso')
  if (!user) return <Navigate to="/login" replace />
  const rs = reservas.filter(r => mios.some(a => a.id === r.alojId) && r.estado === tab)
  return (
    <Sky title="Reservas programadas">
      <div className="panel centro-col ancho">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'En curso'} onClick={() => setTab('En curso')}>Hoy</button>
          <button role="tab" aria-selected={tab === 'Próxima'} onClick={() => setTab('Próxima')}>Próximas</button>
        </div>
        {rs.length === 0 && <p>No hay reservas.</p>}
        {rs.map(r => <div className="fila" key={r.id}>
          <div><strong>{mios.find(a => a.id === r.alojId)?.nombre}</strong><br /><small>Huésped: {nombre(r.huesped)} · {r.desde} → {r.hasta} · {r.adultos + r.ninos} personas</small></div>
          <span>{r.estado}</span>
          <button className="btn suave" onClick={() => setReservas(reservas.map(z => z.id === r.id ? { ...z, estado: 'Cancelada' } : z))}>Cancelar</button>
        </div>)}
      </div>
    </Sky>
  )
}

function MisAlojs() {
  const { user, mios, alojs, setAlojs } = useHost()
  if (!user) return <Navigate to="/login" replace />
  return (
    <Sky title="Mis alojamientos">
      <div className="panel centro-col ancho">
        {mios.length === 0 && <p>Aún no tienes alojamientos publicados.</p>}
        {mios.map(a => <div className="fila" key={a.id}>
          <div><strong>{a.nombre}</strong><br /><small>{a.ciudad} · {q(a.precio)} por noche</small></div>
          <Link to={`/anfitrion/alojamientos/${a.id}`}>Editar</Link>
          <button className="link" onClick={() => confirm(`¿Eliminar "${a.nombre}"?`) && setAlojs(alojs.filter(z => z.id !== a.id))}>Eliminar</button>
        </div>)}
      </div>
    </Sky>
  )
}

function AlojForm() {
  const { id } = useParams(); const { user, alojs, setAlojs } = useApp(); const nav = useNavigate()
  const ex = alojs.find(a => a.id === Number(id))
  const [f, setF] = useState({ nombre: ex?.nombre ?? '', ciudad: ex?.ciudad ?? CIUDADES[0], precio: ex?.precio ?? 1000, cap: ex?.cap ?? 2, desc: ex?.desc ?? '' })
  if (!user) return <Navigate to="/login" replace />
  if (id && (!ex || ex.host !== nombre(user))) return <Navigate to="/anfitrion/alojamientos" />
  const guardar = (e: FormEvent) => {
    e.preventDefault()
    if (ex) setAlojs(alojs.map(a => a.id === ex.id ? { ...a, ...f } : a))
    else setAlojs([...alojs, { id: Date.now(), ...f, rating: 0, hab: 1, banos: 1, host: nombre(user), emoji: '🏠' }])
    nav('/anfitrion/alojamientos')
  }
  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: ['precio', 'cap'].includes(k) ? +e.target.value : e.target.value })
  return (
    <Sky title={ex ? 'Editar alojamiento' : 'Añadir un alojamiento'}>
      <form className="panel auth" onSubmit={guardar}>
        <label>Nombre<input required value={f.nombre} onChange={set('nombre')} /></label>
        <label>Ciudad<select value={f.ciudad} onChange={set('ciudad')}>{CIUDADES.map(c => <option key={c}>{c}</option>)}</select></label>
        <label>Precio por noche (Q)<input type="number" min={1} required value={f.precio} onChange={set('precio')} /></label>
        <label>Capacidad<input type="number" min={1} required value={f.cap} onChange={set('cap')} /></label>
        <label>Descripción<textarea required value={f.desc} onChange={set('desc')} /></label>
        <button className="btn full">Guardar</button>
      </form>
    </Sky>
  )
}
