# Contrato de la API — fase 2

Base: `http://localhost:3000/api`. JSON. Rutas privadas usan `Authorization: Bearer <token>`.
Los IDs se representan como cadenas decimales positivas; fechas como YYYY-MM-DD; importes en GTQ como números con hasta dos decimales. PostgreSQL y los cálculos del servidor usan Decimal. Nunca incluir datos de pago.

## Rutas

| Método y ruta | Acceso | Función |
|---|---|---|
| GET /health | Público | Comprueba servidor y conexión a BD |
| POST /auth/registro | Público | nombre, correo, password, rol HUESPED o ANFITRION |
| POST /auth/login | Público | correo, password; devuelve token y usuario |
| GET /auth/me | Sesión | Usuario actual sin hash |
| PATCH /auth/me | Sesión | nombre, biografia |
| GET /alojamientos | Público | Catálogo activo; filtros ciudad, huespedes, precioMin, precioMax, desde, hasta |
| GET /alojamientos/:id | Público | Detalle activo, imágenes y períodos de disponibilidad |
| POST /alojamientos | Anfitrión | Crear propiedad |
| PUT /alojamientos/:id | Propietario | Reemplazar campos editables e imágenes |
| DELETE /alojamientos/:id | Propietario | Desactivar conservando historial |
| POST /alojamientos/:id/disponibilidad | Propietario | desde, hasta, estado DISPONIBLE o NO_DISPONIBLE |
| DELETE /alojamientos/:id/disponibilidad/:periodo | Propietario | Eliminar período; conserva reservas existentes |
| GET /anfitrion/alojamientos | Anfitrión | Propiedades propias activas e inactivas |
| GET /anfitrion/reservas | Anfitrión | Reservas recibidas en propiedades propias |
| GET /reservas | Sesión | Reservas hechas por el usuario |
| POST /reservas | Sesión | Crear y confirmar reserva |
| PATCH /reservas/:id | Huésped propietario | Modificar fechas y huéspedes |
| PATCH /reservas/:id/cancelar | Huésped o anfitrión propietario | Cancelar; sin cuerpo |

## Crear una reserva

```json
{
  "alojId": "1",
  "desde": "2027-02-01",
  "hasta": "2027-02-04",
  "adultos": 2,
  "ninos": 1
}
```

El usuario proviene del JWT. El costo proviene de PostgreSQL. La modificación utiliza los mismos campos excepto alojId; no permite cambiar de propiedad. La respuesta contiene id, alojId, alojamiento, hostId, userId, huesped, desde, hasta, adultos, ninos, total, estado y estadoReserva. Los datos personales de huéspedes solo se exponen en consultas autorizadas.

## Crear o editar alojamiento

Campos: nombre, ciudad, direccion, desc, precio, cap, hab, banos, amenidades, reglas e imagenes (array de 1 a 10 URLs). Todos son obligatorios; amenidades y reglas pueden ser cadenas vacías. La primera imagen es principal. El ID del propietario lo asigna el servidor.

Los filtros desde/hasta se usan juntos. La consulta solo devuelve alojamientos con cobertura explícita y sin bloqueos o reservas confirmadas superpuestas. La consulta no garantiza disponibilidad futura: se revalida al guardar dentro de una transacción.

## Respuestas y errores

- 200: consulta o actualización.
- 201: creación.
- 204: desactivación o eliminación de período.
- 400: datos/formato inválidos o reglas de capacidad.
- 401: falta de sesión, token inválido o cuenta inactiva.
- 403: rol sin permiso.
- 404: recurso inexistente o ajeno.
- 409: correo duplicado, fechas ocupadas o conflicto con el estado actual.
- 413: solicitud demasiado grande.
- 429: límite de solicitudes.
- 500: error interno sin detalles sensibles.

Formato: `{ "error": "Mensaje" }`; validaciones pueden incluir `detalles: [{ campo, mensaje }]`.
Los contratos de escritura rechazan claves desconocidas. No enviar total, userId, tarjeta, CVV ni objetos de pago.
