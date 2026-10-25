import { test } from 'node:test';
import assert from 'node:assert/strict';
import { credentials, registration, profileSchema } from '../../src/auth-validation.js';

test('normaliza el correo sin modificar la contraseña', () => {
  const parsed = credentials.parse({ correo: '  Persona@Example.COM ', password: ' Pass1234 ' });
  assert.equal(parsed.correo, 'persona@example.com');
  assert.equal(parsed.password, ' Pass1234 ');
});
test('rechaza contraseñas cortas y las que bcrypt truncaría', () => {
  for (const password of ['123', 'a'.repeat(73), 'ñ'.repeat(37)]) {
    assert.equal(credentials.safeParse({ correo: 'a@example.com', password }).success, false);
  }
  assert.equal(credentials.safeParse({ correo: 'a@example.com', password: 'ñ'.repeat(36) }).success, true);
});
test('el registro no permite administradores, IDs ni campos desconocidos', () => {
  const data = { nombre: 'Persona', correo: 'a@example.com', password: 'Password123', rol: 'HUESPED' };
  assert.equal(registration.safeParse(data).success, true);
  assert.equal(registration.safeParse({ ...data, rol: 'ADMINISTRADOR' }).success, false);
  assert.equal(registration.safeParse({ ...data, id_usuario: '1' }).success, false);
  assert.equal(profileSchema.safeParse({ nombre: 'Persona', biografia: '', rol: 'ANFITRION' }).success, false);
});
