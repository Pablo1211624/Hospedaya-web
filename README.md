# HospedaYa

Aplicación académica para publicar, buscar y reservar alojamientos en Guatemala.
Frontend React + TypeScript + Vite; API REST Express + TypeScript; PostgreSQL y Prisma 7.
Los pagos son una simulación de interfaz: las reservas se guardan, pero no se cobra.

## Requisitos

- Node.js 22.12 o superior compatible con las dependencias (verificado con Node 22.15).
- PostgreSQL 16 o superior. `compose.yml` permite levantar PostgreSQL 16 con Docker.
- npm. Ejecutar los comandos desde las carpetas indicadas.
- Puertos de desarrollo: frontend 5173, API 3000, PostgreSQL 5432.

## Instalación en una base NUEVA

Elegir una de estas opciones:

- **PostgreSQL local (verificado con 18):** crear una base vacía llamada `hospedaya` desde pgAdmin o con `CREATE DATABASE hospedaya;`. En `Backend/.env`, usar el usuario y contraseña configurados durante la instalación. Si la base ya está creada y migrada, no hay que crearla otra vez.
- **Docker:** desde la raíz, ejecutar `docker compose up -d`. El archivo incluido usa PostgreSQL 16. No iniciarlo en el puerto 5432 si PostgreSQL local ya lo ocupa.

Docker inicia PostgreSQL; no carga los scripts SQL antiguos. Si Docker ya utiliza un volumen con datos, seguir primero la sección de base existente.

En `Backend/`:
```sh
npm ci
```
Si todavía no existe `.env`, copiar `.env.example` a `.env`; conservar la configuración existente. Ajustar `DATABASE_URL`, `FRONTEND_URL` y un `JWT_SECRET` aleatorio de al menos 32 caracteres. Nunca publicar `.env`. Las credenciales de Compose son solo para desarrollo local.

```sh
npm run db:deploy
npm run build
npm run dev
```

### Datos de demostración opcionales

Se puede empezar con la base vacía y crear las cuentas desde la interfaz. Para cargar ejemplos, configurar `SEED_PASSWORD` en `Backend/.env` (mínimo 12 caracteres, máximo 72 bytes UTF-8) y ejecutar en `Backend/`:

```sh
npm run db:seed
```

Este comando escribe en la base indicada por `DATABASE_URL`. Crea `huesped@demo.hospedaya` y `anfitrion@demo.hospedaya` con esa contraseña y una propiedad disponible durante los siguientes 365 días. Se puede ejecutar nuevamente: no reemplaza contraseñas ni alojamientos de cuentas existentes.

### Iniciar la interfaz

En otra terminal, dentro de `Frontend/`:
```sh
npm ci
npm run dev
```
Abrir http://localhost:5173. Copiar `Frontend/.env.example` a `.env` solo si se necesita configurar otra dirección de API. Las variables Vite son públicas: no colocar secretos en ellas.

Para ejecutar el backend compilado:
```sh
npm run build
npm start
```

## Si la base proviene de los scripts antiguos

Si la base ya usa las migraciones de este repositorio, basta con `npm run db:deploy` para aplicar las pendientes. El procedimiento siguiente es solo para una base antigua sin historial de migraciones.

**No ejecutar reset, db push ni marcar una migración como aplicada sin comparar el esquema.**

1. Hacer respaldo de la BD y trabajar primero sobre una copia.
2. Comparar la copia con `Backend/prisma/migrations/202610240001_initial/migration.sql`: tablas, tipos, claves y restricciones. Algunas versiones anteriores de Prisma usaban el nombre `fk_airbnb_usuario` en lugar de `fk_alojamiento_usuario`; resolver esa diferencia explícitamente.
3. Solo si representa exactamente la migración inicial, registrar esa base:
   `npx prisma migrate resolve --applied 202610240001_initial --config prisma7.config.ts`.
4. Ejecutar `npm run db:deploy` en la copia y revisar los datos. La segunda migración añade campos e índices y rechaza reservas confirmadas superpuestas, imágenes principales duplicadas o correos que colisionen al normalizarse. No borra ni cancela registros para corregirlos.
5. Revisar ciudad, habitaciones y baños de alojamientos antiguos: los nuevos valores son iniciales, no datos verificados.
6. Aplicar el procedimiento a la BD del equipo solamente después de revisar los resultados y el respaldo.

Los archivos de `Base de Datos/` se conservan como entrega histórica. No ejecutar sus inserts después del seed nuevo: tienen contraseñas `HASH_TEMPORAL` y no son una carga idempotente completa.

## Reglas de negocio

- Huésped: reserva y administra únicamente sus reservas y perfil.
- Anfitrión: además puede administrar sus alojamientos y cancelar reservas recibidas antes de la llegada. No puede reservar una propiedad propia.
- Administrador: no se puede crear mediante registro público. Esta entrega no concede un bypass global; sus operaciones de alojamiento también verifican propiedad.
- Una estadía debe quedar cubierta por un período `DISPONIBLE` completo. Un período `NO_DISPONIBLE` tiene prioridad. Sin disponibilidad explícita no se puede reservar.
- Fechas sin hora, con día de negocio de Guatemala. Rango de ocupación `[entrada, salida)`: el día de salida puede ser otra llegada.
- Capacidad = adultos + niños; mínimo un adulto. Estadía máxima: 365 noches.
- Las nuevas reservas se confirman directamente. Solo `CONFIRMADA` bloquea fechas; `PENDIENTE` queda para datos históricos, no se usa en el flujo nuevo.
- “Próxima”, “En curso” y “Finalizada” son etiquetas derivadas de fechas; “Cancelada” y “Pendiente” respetan el estado persistido.
- Modificación y cancelación: antes del día de llegada. Modificar conserva el precio por noche original y recalcula el total.
- Precio, usuario y total se determinan en el servidor. Reserva y costo se guardan en una misma transacción.
- Todas las mutaciones que afectan una propiedad bloquean su fila; una exclusión GiST protege adicionalmente contra superposiciones confirmadas.
- Desactivar un alojamiento lo retira del catálogo y conserva sus reservas. No cancela estadías existentes.
- Fotos mediante URLs HTTPS o archivos ya disponibles en `Backend/uploads/alojamientos/`. Esta entrega no incorpora carga de archivos.
- Sesión JWT de dos horas almacenada en `sessionStorage`; cerrar sesión elimina el token del navegador. No hay refresh tokens ni revocación central en esta entrega.

## Pago ficticio

El formulario verifica únicamente formato: 16 dígitos, CVV de 3–4 dígitos, vencimiento válido no pasado, nombre y código postal numérico. No usa Luhn, bancos, pasarelas ni verificaciones de existencia. Usar datos inventados.

Los datos permanecen solo en el estado temporal del formulario y se limpian al avanzar. No se envían a la API ni se guardan en almacenamiento del navegador o PostgreSQL. La API rechaza campos extra, incluidos tarjeta, CVV y total. El mensaje final distingue la reserva registrada del pago ficticio sin cobro.

## Verificación

En `Backend/`:
```sh
npm test
npm run test:payment
npm run build
```

Para integración, usar una BD **aislada** llamada `hospedaya_test`, con las migraciones aplicadas; configurar `DATABASE_URL` y `JWT_SECRET` en esa terminal. Las pruebas crean registros de prueba y no vacían la BD:
```sh
npm run db:deploy
npm run test:auth
npm run test:lodgings
npm run test:reservations
npm run test:e2e
```
Antes de E2E, ejecutar `npm run build` en Backend e instalar las dependencias de Frontend con `npm ci`. E2E utiliza Chrome instalado, inicia API y Vite automáticamente y requiere los puertos 3000 y 5173 libres. Se puede adaptar el canal de navegador en `Backend/playwright.config.ts`.

En `Frontend/`:
```sh
npm run build
npm run lint
```

Ver [API](docs/API.md) para rutas y contratos, [fase 2](docs/FASE2.md) para decisiones y alcance pendiente y [etapa 6](docs/ETAPA6.md) para el cierre de documentación.

## Estructura

- `Backend/src/`: servidor, autenticación, validación, rutas, transacciones y serialización.
- `Backend/prisma/`: modelo, migraciones y seed.
- `Backend/tests/`: pruebas de reglas, integración con PostgreSQL y E2E.
- `Frontend/src/`: vistas públicas, huésped y anfitrión; sesión; cliente HTTP y pago simulado.
- `Base de Datos/`: scripts históricos de la primera entrega.
