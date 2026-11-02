import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'

afterEach(() => vi.unstubAllGlobals())

describe('Home', () => {
  it('renders lodgings returned by the catalogue API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      id: '1',
      nombre: 'Casa Antigua',
      ciudad: 'Antigua Guatemala',
      direccion: 'Centro',
      precio: 500,
      cap: 2,
      hab: 1,
      banos: 1,
      desc: 'Una casa cómoda para descansar.',
      host: 'Ana',
      hostId: '2',
      estado: 'ACTIVO',
      amenidades: '',
      reglas: '',
      imagenes: ['/uploads/alojamientos/images.jpg'],
      disponibilidad: [],
    }]), { status: 200 })))

    render(<App />)

    expect(await screen.findByText('Casa Antigua')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Casa Antigua/ })).toHaveTextContent('Antigua Guatemala')
  })

  it('shows an error instead of searching with an invalid price range', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<App />)
    await screen.findByText('No encontramos alojamientos con esos filtros.')

    await user.type(screen.getByLabelText('Precio mín. (Q)'), '800')
    await user.type(screen.getByLabelText('Precio máx. (Q)'), '500')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('El precio mínimo no puede superar al máximo.')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
