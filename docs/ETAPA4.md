# Etapa 4: reservas

Se incorporan las operaciones para reservar alojamientos, consultar viajes, cambiar fechas y cancelar. El servidor comprueba la disponibilidad y calcula el costo; no confía en precios ni usuarios enviados desde el navegador.

## Reglas

- Las nuevas reservas se confirman directamente, sin procesar pagos.
- Se validan fechas, capacidad y períodos disponibles o bloqueados. Un anfitrión no puede reservar su propio alojamiento.
- Dos solicitudes simultáneas no pueden confirmar el mismo alojamiento en fechas superpuestas. Se usa un bloqueo dentro de la transacción y la restricción de PostgreSQL creada en la primera etapa.
- El día de salida puede ser la llegada de otra reserva.
- Reserva y costo se guardan juntos. Si la operación falla, no queda una reserva parcial.
- Modificar conserva el precio por noche original y recalcula el total. Solo el huésped dueño de la reserva puede modificarla.
- Se permite modificar o cancelar antes del día de llegada, usando la fecha de Guatemala. El huésped o el anfitrión propietario pueden cancelar; otras cuentas no tienen acceso.
- Cancelar libera las fechas. Repetir la cancelación no crea cambios adicionales y no se permite reactivar una reserva cancelada mediante edición.
- Los importes que excedan la capacidad del campo de costo se rechazan con un mensaje, sin guardar datos.
- Los estados visibles Próxima, En curso y Finalizada se calculan por fechas; Cancelada y Pendiente respetan el estado guardado.

## Rutas

| Método | Ruta | Función |
|---|---|---|
| GET | /api/reservas | Reservas del usuario conectado |
| POST | /api/reservas | Crear y confirmar |
| PATCH | /api/reservas/:id | Modificar fechas y huéspedes |
| PATCH | /api/reservas/:id/cancelar | Cancelar sin enviar campos |
| GET | /api/anfitrion/reservas | Reservas recibidas en propiedades propias |

Todas requieren sesión. Crear recibe alojId (ID como cadena), desde, hasta (YYYY-MM-DD), adultos y ninos. Modificar usa los mismos campos excepto alojId. No enviar total, userId, tarjeta ni CVV: se rechazan los campos adicionales.

Las respuestas incluyen la identificación y nombre del alojamiento, huésped, fechas, cantidad de personas, total y estado. Los datos de reservas solo se devuelven a usuarios autorizados.

## Verificación

Se ejecutaron satisfactoriamente la compilación, seis pruebas de validación y las pruebas de integración de reservas, alojamientos y autenticación en PostgreSQL 18.6.

La prueba de reservas cubre solicitudes simultáneas, fechas contiguas, costo exacto, permisos, consultas privadas, conservación del precio original, modificación a fechas ocupadas, cancelación por huésped y anfitrión, liberación de fechas, bloqueos, límite del día de llegada y rechazo de importes excesivos. También prueba directamente que PostgreSQL rechaza una reserva superpuesta.

Las pruebas se realizaron en hospedaya_test; no se cargaron datos en la base hospedaya del equipo.

## Ejecutar las pruebas

Desde Backend:

```sh
npm run build
npm test
```

Para integración, configurar DATABASE_URL hacia una base aislada llamada hospedaya_test con las migraciones aplicadas, y JWT_SECRET en esa terminal:

```sh
npm run test:reservations
npm run test:lodgings
npm run test:auth
```

## Próxima etapa

Conectar el frontend con estas operaciones y revisar el recorrido completo con el pago ficticio. La API de esta etapa no recibe ni almacena datos de tarjetas.
