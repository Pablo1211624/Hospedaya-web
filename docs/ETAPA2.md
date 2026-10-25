# Etapa 2: servidor, inicio de sesión y permisos

Se prepara el servidor para registrar usuarios, iniciar sesión y proteger las operaciones privadas. Esta etapa se puede ejecutar sin los módulos de alojamientos y reservas, que se incorporarán en los siguientes commits.

## Qué incluye

- Conexión con PostgreSQL mediante Prisma y configuración local fuera de Git.
- Registro de huéspedes y anfitriones, con contraseñas almacenadas como hash.
- Inicio de sesión y tokens con duración de dos horas.
- Consulta y actualización del nombre y biografía del usuario conectado.
- Verificación de permisos y del estado activo de la cuenta en cada solicitud privada.
- Validación de datos, mensajes de error y límite de intentos de acceso.
- Comandos para ejecutar, compilar y probar el servidor. El archivo de dependencias también prepara las herramientas de pruebas posteriores.

## Cómo probarlo

Desde Backend, instalar las dependencias con `npm ci`. Configurar `.env` a partir de `.env.example` con la conexión propia y un secreto aleatorio de al menos 32 caracteres. No subir `.env`.

Con la base preparada en la etapa 1:

```sh
npm run build
npm test
npm run dev
```

El servidor atiende en http://localhost:3000. Para comprobar la conexión, abrir http://localhost:3000/api/health.

## Operaciones disponibles en esta etapa

| Operación | Ruta | Datos |
|---|---|---|
| Registro | POST /api/auth/registro | nombre, correo, password, rol (HUESPED o ANFITRION) |
| Inicio de sesión | POST /api/auth/login | correo, password |
| Ver perfil | GET /api/auth/me | Token de sesión |
| Editar perfil | PATCH /api/auth/me | nombre, biografia y token |

Registro e inicio de sesión devuelven el usuario y su token. En las rutas privadas se envía el encabezado `Authorization: Bearer <token>`. Nunca se devuelve el hash de contraseña. El registro público no permite crear administradores ni el perfil permite cambiar de rol.

Los correos se guardan sin espacios externos y en minúsculas. Las contraseñas se conservan tal como se escriben y se rechazan si exceden el límite de bytes del algoritmo de hash.

## Verificaciones realizadas

- Compilación del servidor y generación del cliente Prisma.
- Tres pruebas de validación: correos, contraseñas y campos o roles no permitidos.
- Dos pruebas de integración con PostgreSQL 18.6 que comprueban registro, login, duplicados, hash de contraseñas, perfiles, tokens inválidos o vencidos, roles, cuentas inactivas y límite de intentos.
- Las pruebas de integración utilizaron la base aislada hospedaya_test. No se añadieron usuarios a hospedaya.

Para repetir la integración, usar una base aislada llamada hospedaya_test con las migraciones aplicadas. Configurar DATABASE_URL y JWT_SECRET en esa terminal y ejecutar `npm run test:auth`. El proceso se niega a usar una base con otro nombre. Las pruebas crean cuentas exclusivamente en esa base y no vacían sus tablas.

## Límites de esta etapa

La conexión del frontend y las rutas de alojamientos y reservas se incorporarán después. El middleware de anfitrión verifica el rol; la comprobación de propiedad de cada alojamiento o reserva pertenece a sus respectivos módulos. Los tokens no tienen renovación automática ni revocación central por cierre de sesión; esas mejoras quedan para la revisión de producción.
