import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SessionContext } from '../src/session-context'
import { Guard } from '../src/ui'

const guest = { id: '1', nombre: 'Ana', correo: 'ana@test.com', rol: 'HUESPED' as const, biografia: '' }
const host = { ...guest, rol: 'ANFITRION' as const }

function renderGuard(user: typeof guest | typeof host | null, hostOnly = false) {
  render(
    <SessionContext.Provider value={{ user, loading: false, setUser: () => {}, logout: () => {} }}>
      <MemoryRouter initialEntries={['/anfitrion']}>
        <Routes>
          <Route path="/anfitrion" element={<Guard host={hostOnly}><p>Contenido privado</p></Guard>} />
          <Route path="/login" element={<p>Inicio de sesión</p>} />
        </Routes>
      </MemoryRouter>
    </SessionContext.Provider>,
  )
}

describe('Guard', () => {
  it('redirects an anonymous visitor to login', () => {
    renderGuard(null)
    expect(screen.getByText('Inicio de sesión')).toBeInTheDocument()
  })

  it('denies a guest access to host-only content', () => {
    renderGuard(guest, true)
    expect(screen.getByText('Esta sección requiere una cuenta de anfitrión.')).toBeInTheDocument()
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
  })

  it('allows a host into host-only content', () => {
    renderGuard(host, true)
    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })
})
