import { createContext, useContext } from 'react'
import type { User } from './data'
type Session = { user: User | null; loading: boolean; setUser: (u: User | null) => void; logout: () => void }
export const SessionContext = createContext<Session>(null!)
export const useSession = () => useContext(SessionContext)
