# Etapa 5: conectar la interfaz con el servidor
(revisado con ayuda del equipo de frontend, que dió el visto bueno para hacer el commit)

Las pantallas dejan de utilizar arreglos de demostración y pasan a consultar y guardar los datos mediante la API de las etapas anteriores.

## Funcionalidades

- Registro e inicio de sesión reales, recuperación de sesión al recargar y acceso según el rol.
- Catálogo con búsqueda por ciudad, fechas, cantidad de huéspedes y precio.
- Detalle con fotografías, descripción, amenidades y reglas del alojamiento.
- Creación y edición de alojamientos, períodos disponibles o bloqueados y desactivación desde la cuenta anfitriona.
- Creación, consulta, modificación y cancelación de reservas; consulta de reservas recibidas por el anfitrión.
- Perfil y biografía guardados en la base de datos.
- Indicadores de carga, mensajes de error de la API y botones deshabilitados mientras se guarda.

Se conservaron la paleta y los estilos principales. Se reemplazaron las  imágenes temporales de ejemplo representadas por emojis que habia puesto el equipo de frontend por fotos y se retiraron calificaciones ficticias. Las fechas usan controles nativos y la cantidad de personas se expresa como adultos y niños, de acuerdo con el contrato del servidor.

## Pago ficticio

Se conserva el formulario de tarjeta como prototipo académico. Avisa que deben usarse datos inventados y comprueba únicamente formato: número de 16 dígitos, CVV de 3 o 4, vencimiento válido, nombre y código postal.

No consulta bancos ni comprueba que la tarjeta exista. Los datos se mantienen solo en el estado temporal del formulario y se borran al avanzar al paso de confirmación. No se envían en la petición de reserva ni se guardan en localStorage, sessionStorage o PostgreSQL.

La reserva sí se registra en la base de datos. La confirmación aclara que el pago es ficticio y no se realizó ningún cobro.

Si el inge pide que esto sea completamente funcional se podría hacer en un futuro, pero el equipo consideró que estaba fuera de alcance y no es necesario.

## Ejecutar

Desde Backend, con .env y las migraciones configuradas:

```sh
npm run build
npm run dev
```

En otra terminal, desde Frontend:

```sh
npm ci
npm run dev
```

Abrir http://localhost:5173. Si la API utiliza otra dirección, copiar Frontend/.env.example a .env y ajustar VITE_API_URL. Esta variable es pública; no colocar contraseñas en el frontend.

Para probar manualmente, registrar un anfitrión, publicar un alojamiento y habilitar sus fechas. Cerrar sesión y registrar un huésped para reservarlo. La base del equipo no se llenó automáticamente con ejemplos.

## Pruebas

Compilar y revisar el frontend:

```sh
npm run build
npm run lint
```

Desde Backend, comprobar el formato del pago:

```sh
npm run test:payment
```

Para el recorrido automatizado, usar DATABASE_URL apuntando a la base aislada hospedaya_test con las migraciones aplicadas, y JWT_SECRET en esa terminal. Con Chrome instalado y los puertos 3000 y 5173 libres, ejecutar desde Backend:

```sh
npm run build
npm run test:e2e
```

Playwright inicia y detiene la API y Vite. Se comprueban publicación, disponibilidad, reserva con pago ficticio, modificación, persistencia tras recargar, cancelación, perfil, login incorrecto/correcto y acceso restringido del huésped. También se verifican errores de conexión, sesión inválida y ausencia de desbordamiento horizontal en las vistas móviles revisadas.

La prueba inspecciona el cuerpo de la solicitud de reserva para comprobar que contiene únicamente alojamiento, fechas y huéspedes; también comprueba que los valores de tarjeta de prueba no estén en el almacenamiento del navegador.

## Próximo paso

Cerrar la documentación general, preparar los datos de demostración opcionales y verificar las instrucciones de instalación. Docker de aplicación, despliegue público y CI/CD corresponden a la fase 3 del curso.
