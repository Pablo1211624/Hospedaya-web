# Etapa 3: alojamientos y disponibilidad

Se incorpora el catálogo y la gestión de alojamientos por parte de sus anfitriones. Cada anfitrión puede crear, editar y desactivar sus propias propiedades y definir cuándo se pueden reservar.

## Cambios

- Catálogo público con filtros de ciudad, cantidad de huéspedes, precio y fechas.
- Detalle del alojamiento con fotos, descripción, capacidad, amenidades y reglas.
- Creación y edición con validación de datos. Las fotos se indican por URL HTTPS o mediante imágenes locales disponibles; no se incluye carga de archivos.
- Consulta privada de los alojamientos propios, incluidos los inactivos.
- Períodos disponibles y bloqueados. Una estadía debe estar cubierta por un período disponible completo; los bloqueos tienen prioridad.
- Desactivación sin borrar reservas ni historial.
- Controles para impedir cambios en propiedades ajenas, bloqueos sobre reservas confirmadas y reducciones de capacidad incompatibles con reservas vigentes.

Los rangos excluyen el día de salida. Por ejemplo, un bloqueo hasta el 4 permite una llegada el día 4. Sin un período disponible, un alojamiento puede aparecer en el catálogo general, pero no en una búsqueda por fechas ni aceptar reservas.

## Ejecución

Desde Backend, con la base de las etapas anteriores configurada:

```sh
npm run build
npm run dev
```

Las rutas de autenticación siguen disponibles. Se añaden:

| Método | Ruta | Función |
|---|---|---|
| GET | /api/alojamientos | Catálogo activo |
| GET | /api/alojamientos/:id | Detalle activo |
| POST | /api/alojamientos | Crear como anfitrión |
| PUT | /api/alojamientos/:id | Editar como propietario |
| DELETE | /api/alojamientos/:id | Desactivar como propietario |
| GET | /api/anfitrion/alojamientos | Listar propiedades propias |
| POST | /api/alojamientos/:id/disponibilidad | Habilitar o bloquear fechas |
| DELETE | /api/alojamientos/:id/disponibilidad/:periodo | Eliminar período |

Filtros del catálogo: ciudad, huespedes, precioMin, precioMax, desde y hasta. Las fechas se envían juntas en formato YYYY-MM-DD.

Crear o editar requiere nombre, ciudad, direccion, desc, precio, cap, hab, banos, amenidades, reglas e imagenes. Amenidades y reglas pueden estar vacías. La primera imagen es la principal. No se envía el propietario: se obtiene de la sesión.

Los períodos reciben desde, hasta y estado (DISPONIBLE o NO_DISPONIBLE). Eliminar un período conserva las reservas confirmadas existentes. Esta etapa no añade reactivación de alojamientos.

## Pruebas

Se verificaron en PostgreSQL 18.6 los permisos, la edición de fotos, filtros, fechas inválidas, cobertura, bloqueos, fechas contiguas, protección de capacidad y conservación de reservas al desactivar. También se repitieron las pruebas de autenticación.

Para repetir la integración, configurar DATABASE_URL hacia una base aislada llamada hospedaya_test con las migraciones aplicadas, y JWT_SECRET en esa misma terminal:

```sh
npm run test:lodgings
npm run test:auth
```

La prueba crea una reserva directamente en la base aislada para comprobar su protección; no depende de las rutas de reservas de la siguiente etapa. No modifica la base hospedaya del equipo.

## Próximo paso

Incorporar las rutas para crear, modificar y cancelar reservas y la consulta de reservas recibidas por el anfitrión. La integración del frontend tendrá su propio commit.
