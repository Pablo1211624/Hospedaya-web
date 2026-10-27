# Decisiones de implementación

El alcance se basa en RF01–RF06 de la fase 1, con React, TypeScript, Express, PostgreSQL, Prisma y JWT.

## Ajustes realizados

- Se reemplazaron los arreglos de demostración por la API y se separaron las vistas de huésped, anfitrión, sesión y peticiones.
- Se conservaron paleta, estilos y estructura visual principales. La búsqueda usa controles nativos de fecha y añade precios. Se retiraron los selectores sin persistencia de bebés/mascotas y las reseñas ficticias; la capacidad se expresa como adultos + niños.
- Se añadieron nombre al registro y rol explícito. Ser anfitrión no da acceso a propiedades de terceros.
- Se agregaron ciudad, habitaciones, baños, amenidades, reglas, biografía y desglose de huéspedes sin borrar las tablas existentes.
- Se implementaron períodos de disponibilidad, imágenes por URL, desactivación, perfil persistente y modificación de reservas.
- Se mantuvo el pago como prototipo, según la decisión del equipo. Los datos bancarios no forman parte del contrato de la API.
- Se versionaron las migraciones. Se aplicaron a la base local nueva del equipo en PostgreSQL 18. Las pruebas funcionales se realizaron en una instancia aislada; no se cargaron ejemplos en la base principal.

## Si otro integrante utiliza una base antigua

1. Comparar el esquema real de la BD del equipo con la migración inicial y respaldarlo.
2. Completar campos nuevos de propiedades antiguas y reemplazar cuentas con HASH_TEMPORAL por cuentas válidas mediante registro o un procedimiento acordado.
3. Confirmar como equipo la política de cancelación antes de llegada, la estadía máxima de 365 noches y la confirmación directa.
4. Revisar los ajustes visuales y la gestión de fotos por URL. Carga de archivos sería una ampliación.
5. Seguir el procedimiento de base existente del README; una instalación nueva utiliza directamente las migraciones.

## Verificación realizada

- Backend: compilación TypeScript y generación Prisma.
- Frontend: compilación y linter.
- Pruebas de validación, contrato estricto y formato de pago ficticio.
- Integración con PostgreSQL: autenticación, permisos, costo exacto, concurrencia, fechas contiguas, modificación, cancelación, bloqueos y conservación del historial.
- Prueba E2E aprobada en Chrome: publicación, disponibilidad, registro, pago ficticio, reserva, persistencia tras recarga y cancelación. Se verificó que la petición de reserva no contiene campos de pago y que los valores de prueba no aparecen en almacenamiento del navegador.

La instancia de pruebas local utiliza PostgreSQL 18. El entorno Docker del repositorio continúa en PostgreSQL 16; las migraciones usan funciones compatibles, pero conviene repetir la suite en la versión de entrega.

## Fase 3

Completar contenedores de aplicación, CI/CD, despliegue público, cobertura de pruebas más amplia, auditoría de accesibilidad y rendimiento. Para producción revisar la política de sesión (cookies seguras/revocación), almacenamiento de imágenes, límites/paginación del catálogo, backups, HTTPS y secretos. No se implementaron pasarelas de pago.
