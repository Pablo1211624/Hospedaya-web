import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, saveToken } from '../src/api'

afterEach(() => {
  saveToken(null)
  vi.unstubAllGlobals()
})

describe('api', () => {
  it('sends JSON and the saved bearer token', async () => {
    saveToken('test-token')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: '1' }), { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(api<{ id: string }>('/reservas', 'POST', { alojId: '1' })).resolves.toEqual({ id: '1' })

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/reservas', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ alojId: '1' }),
    }))
  })

  it('clears the session and announces an expired session after a 401', async () => {
    saveToken('expired-token')
    const expired = vi.fn()
    window.addEventListener('session-expired', expired)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Sesión vencida.' }), { status: 401 })))

    await expect(api('/auth/me')).rejects.toThrow('Sesión vencida.')

    expect(sessionStorage.getItem('hospedaya.token')).toBeNull()
    expect(expired).toHaveBeenCalledOnce()
    window.removeEventListener('session-expired', expired)
  })

  it('turns network failures into a user-facing error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    await expect(api('/alojamientos')).rejects.toThrow('No se pudo conectar con el servidor. Intenta nuevamente.')
  })
})
