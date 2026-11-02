import { describe, expect, it } from 'vitest'
import { validateDemoPayment } from '../src/payment'

const payment = {
  num: '1111 2222 3333 4444',
  exp: '12/2030',
  cvv: '123',
  nom: 'Ana Pérez',
  cp: '01010',
}

describe('validateDemoPayment', () => {
  const now = new Date('2030-02-01T12:00:00')

  it('accepts correctly formatted fictitious payment data', () => {
    expect(validateDemoPayment(payment, now)).toBe('')
  })

  it('rejects a card number without 16 digits', () => {
    expect(validateDemoPayment({ ...payment, num: '1234' }, now)).toBe('El número de prueba debe tener 16 dígitos.')
  })

  it('rejects an expired date', () => {
    expect(validateDemoPayment({ ...payment, exp: '12/2029' }, now)).toBe('El vencimiento no puede estar en el pasado.')
  })

  it('rejects an invalid postal code', () => {
    expect(validateDemoPayment({ ...payment, cp: 'abc' }, now)).toBe('El código postal debe tener entre 4 y 10 dígitos.')
  })
})
