# Etapa 1: preparar la base de datos

Se organizo la creacion de las tablas y sus cambios en migraciones, para que todos los integrantes puedan preparar la misma base de datos.

## Cambios

- Se conservan las seis tablas del proyecto: usuarios, alojamientos, imagenes, disponibilidad, reservas y costos.
- Se agregan ciudad, habitaciones, banos, amenidades y reglas de los alojamientos, biografia del usuario y cantidad de adultos y ninos por reserva.
- Se impide confirmar dos reservas del mismo alojamiento en fechas superpuestas. El dia de salida puede ser el dia de llegada de otra reserva.
- Se agregan controles para evitar correos duplicados y varias fotos principales en un alojamiento.
- Se ajusta el modelo de Prisma para que coincida con estos cambios.

## Verificacion

Se aplicaron las dos migraciones en una base nueva hospedaya con PostgreSQL 18.6. Prisma valido el modelo. Se verificaron las seis tablas, sin registros, y las restricciones de cantidad de huespedes y reservas superpuestas.

Las pruebas de concurrencia de la implementacion completa tambien pasaron previamente en una base aislada. Esas pruebas se incorporaran en su etapa correspondiente.

## Preparar una base nueva

Con las dependencias de Backend instaladas y DATABASE_URL configurada localmente, ejecutar desde Backend:

```sh
npx prisma migrate deploy --config prisma7.config.ts
npx prisma validate --config prisma7.config.ts
```

Si la base ya tiene tablas, no aplicar este procedimiento directamente: primero respaldar y comparar su estructura con la migracion inicial.

La conexion y la contrasena de cada integrante son locales. No incluir archivos .env en Git. Esta etapa no carga datos de prueba ni modifica el frontend o las rutas del backend.
