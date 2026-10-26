import { useEffect, useState, type ReactNode } from 'react'
import { api, hasToken, saveToken } from './api'
import type { User } from './data'
import { SessionContext as Context } from './session-context'
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null), [loading, setLoading] = useState(hasToken), [error, setError] = useState('')
  useEffect(() => {
    const expired = () => { setUser(null); setError('Tu sesión venció. Vuelve a iniciar sesión.') }
    window.addEventListener('session-expired', expired)
    if (hasToken()) void api<User>('/auth/me').then(setUser).catch(e => setError(e.message)).finally(() => setLoading(false))
    return () => window.removeEventListener('session-expired', expired)
  }, [])
  const logout = () => { saveToken(null); setUser(null); setError('') }
  return <Context.Provider value={{ user, setUser, loading, logout }}>{error && <p role="alert" className="error notice">{error} <button onClick={() => setError('')}>Cerrar</button></p>}{loading ? <p role="status">Comprobando sesión…</p> : children}</Context.Provider>
}
