import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Reservar } from '../src/guest'

const lodging = {
  id: '10',
  nombre: 'Casa del lago',
  ciudad: 'Panajachel',
  direccion: 'Calle principal',
  precio: 600,
  cap: 4,
  hab: 2,
  banos: 1,
  desc: 'Casa amplia frente al lago.',
  host: 'Anfitrión',
  hostId: '4',
  estado: 'ACTIVO',
  amenidades: 'Wi-Fi',
  reglas: '',
  imagenes: [],
  disponibilidad: [],
}

afterEach(() => vi.unstubAllGlobals())

describe('Reservar', () => {
  it('sends booking fields only, never the fictitious payment data', async () => {
    const fetchMock = vi.fn((input: string) => {
      if (input.endsWith('/alojamientos/10')) return Promise.resolve(new Response(JSON.stringify(lodging), { status: 200 }))
      return Promise.resolve(new Response(JSON.stringify({
        id: '25', alojId: '10', alojamiento: lodging.nombre, hostId: '4', userId: '7',
        desde: '2099-08-10', hasta: '2099-08-12', adultos: 2, ninos: 0,
        total: 1200, estado: 'Próxima', estadoReserva: 'CONFIRMADA', huesped: 'Huésped',
      }), { status: 201 }))
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/reservar/10?d=2099-08-10&h=2099-08-12&a=2&n=0']}>
        <Routes><Route path="/reservar/:id" element={<Reservar />} /></Routes>
      </MemoryRouter>,
    )

    await screen.findByText('Casa del lago')
    await user.type(screen.getByLabelText('Número de tarjeta de prueba'), '1111 2222 3333 4444')
    await user.type(screen.getByLabelText('Vencimiento (mm/aaaa)'), '12/2099')
    await user.type(screen.getByLabelText('CVV de prueba'), '123')
    await user.type(screen.getByLabelText('Nombre de prueba'), 'Ana Pérez')
    await user.type(screen.getByLabelText('Código postal'), '01010')
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    await user.click(await screen.findByRole('button', { name: 'Confirmar reserva' }))

    await screen.findByText(/Tu reserva 25 quedó registrada/)

    expect(fetchMock).toHaveBeenLastCalledWith('http://localhost:3000/api/reservas', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ alojId: '10', desde: '2099-08-10', hasta: '2099-08-12', adultos: 2, ninos: 0 }),
    }))
  })
})
