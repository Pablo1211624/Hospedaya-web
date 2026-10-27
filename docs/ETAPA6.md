# Etapa 6: instalación y datos de demostración

Se actualizó la guía para que el equipo pueda instalar y ejecutar el proyecto con PostgreSQL local o con el servicio Docker incluido. Se documentaron las rutas de la API, las reglas de reservas, el pago ficticio y las tareas pendientes para la fase 3.

## Cambios

- Instrucciones de instalación, configuración y pruebas con los comandos disponibles en el proyecto.
- Separación entre una base nueva, una base ya migrada y una base proveniente de los scripts antiguos.
- Carga opcional con `npm run db:seed`: crea un huésped, un anfitrión y un alojamiento con dos fotos locales y 365 días de disponibilidad.
- La contraseña demo se configura localmente; se valida su longitud y se guarda como hash. Repetir la carga conserva las cuentas y propiedades existentes.
- La compilación del backend ahora también verifica el código de la carga demo.

La carga demo utiliza la base indicada por `DATABASE_URL`. No se ejecuta automáticamente al instalar, iniciar el servidor o aplicar migraciones. No renueva las fechas de una propiedad demo que ya exista.

## Verificación

- Compilación del backend aprobada.
- Carga demo ejecutada dos veces en la base aislada de PostgreSQL 18: dos cuentas y una propiedad, sin duplicados ni cambios de contraseñas.
- Verificación de las dos imágenes y del período disponible de 365 días.
- Rechazo de contraseñas demasiado cortas o mayores de 72 bytes UTF-8, sin crear datos.

Las pruebas funcionales de autenticación, alojamientos y reservas, así como el recorrido de navegador, quedaron documentadas en las etapas anteriores. Docker con PostgreSQL 16 no se ejecutó en esta revisión.

## Uso del equipo

Seguir el [README](../README.md). Se puede registrar un anfitrión y un huésped desde la interfaz sin cargar ejemplos. La base principal no recibió datos demo durante esta etapa.

El siguiente trabajo de la fase 3 contempla contenedores de aplicación, automatización y despliegue público.
