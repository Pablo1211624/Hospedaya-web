import { useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { mediaUrl } from './api'
import { useSession } from './session-context'
export function Sky({ children, title }: { children: ReactNode; title?: string }) { return <section className="sky">{title && <h1>{title}</h1>}{children}</section> }
export function ErrorText({ text }: { text: string }) { return text ? <p role="alert" className="error">{text}</p> : null }
export function Guard({ children, host = false }: { children: ReactNode; host?: boolean }) {
  const { user } = useSession(), loc = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />
  if (host && user.rol === 'HUESPED') return <Sky title="Acceso de anfitrión"><p>Esta sección requiere una cuenta de anfitrión.</p></Sky>
  return children
}
export function Photo({ url, alt }: { url?: string; alt: string }) {
  const [failed, setFailed] = useState<string | undefined>(undefined)
  return url && failed !== url ? <img className="property-photo" src={mediaUrl(url)} alt={alt} onError={() => setFailed(url)} /> : <div className="foto" aria-label={alt}>🏠</div>
}
