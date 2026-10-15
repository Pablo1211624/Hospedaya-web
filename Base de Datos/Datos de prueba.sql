-- 1. USUARIO PRUEBAS
INSERT INTO usuario (
    nombre,
    correo,
    password_hash,
    rol,
    estado
)
VALUES
(
    'Carlos Pérez',
    'carlos@hospedaya.com',
    'HASH_TEMPORAL',
    'HUESPED',
    'ACTIVO'
),
(
    'Sofía Ramírez',
    'sofia@hospedaya.com',
    'HASH_TEMPORAL',
    'HUESPED',
    'ACTIVO'
),
(
    'María López',
    'maria@hospedaya.com',
    'HASH_TEMPORAL',
    'ANFITRION',
    'ACTIVO'
),
(
    'José Hernández',
    'jose@hospedaya.com',
    'HASH_TEMPORAL',
    'ANFITRION',
    'ACTIVO'
),
(
    'Administrador HospedaYa',
    'admin@hospedaya.com',
    'HASH_TEMPORAL',
    'ADMINISTRADOR',
    'ACTIVO'
)
ON CONFLICT (correo) DO NOTHING;


-- 2. ALOJAMIENTOS DE PRUEBA

INSERT INTO alojamiento (
    nombre,
    descripcion,
    direccion,
    capacidad,
    precio_noche,
    estado,
    id_usuario
)
VALUES
(
    'Casa Colonial Antigua',

    'Casa colonial ubicada cerca del centro de Antigua Guatemala.',

    'Antigua Guatemala, Sacatepéquez',

    4,

    450.00,

    'ACTIVO',

    (
        SELECT id_usuario
        FROM usuario
        WHERE correo = 'maria@hospedaya.com'
    )
),
(
    'Apartamento Lago Atitlán',

    'Apartamento con vista al Lago de Atitlán y espacio para familias.',

    'Panajachel, Sololá',

    5,

    650.00,

    'ACTIVO',

    (
        SELECT id_usuario
        FROM usuario
        WHERE correo = 'jose@hospedaya.com'
    )
);


-- 3. IMÁGENES DE LOS ALOJAMIENTOS

INSERT INTO imagen_alojamiento (
    url_imagen,
    es_principal,
    orden,
    id_alojamiento
)
VALUES
(
    '/uploads/alojamientos/images.jpg',

    TRUE,

    1,

    (
        SELECT id_alojamiento
        FROM alojamiento
        WHERE nombre = 'Casa Colonial Antigua'
    )
),
(
    '/uploads/alojamientos/images2.jpg',

    FALSE,

    2,

    (
        SELECT id_alojamiento
        FROM alojamiento
        WHERE nombre = 'Casa Colonial Antigua'
    )
),
(
    '/uploads/alojamientos/images3.jpg',

    TRUE,

    1,

    (
        SELECT id_alojamiento
        FROM alojamiento
        WHERE nombre = 'Apartamento Lago Atitlán'
    )
),
(
    '/uploads/alojamientos/images4.jpg',

    FALSE,

    2,

    (
        SELECT id_alojamiento
        FROM alojamiento
        WHERE nombre = 'Apartamento Lago Atitlán'
    )
);


-- 4. DISPONIBILIDAD


INSERT INTO disponibilidad (
    fecha_inicio,
    fecha_fin,
    estado,
    id_alojamiento
)
VALUES
(
    '2026-10-01',

    '2027-03-31',

    'DISPONIBLE',

    (
        SELECT id_alojamiento
        FROM alojamiento
        WHERE nombre = 'Casa Colonial Antigua'
    )
),
(
    '2026-10-01',

    '2027-03-31',

    'DISPONIBLE',

    (
        SELECT id_alojamiento
        FROM alojamiento
        WHERE nombre = 'Apartamento Lago Atitlán'
    )
);


-- 5. RESERVAS DE PRUEBA

INSERT INTO reserva (
    fecha_entrada,
    fecha_salida,
    cantidad_huespedes,
    estado,
    id_usuario,
    id_alojamiento
)
VALUES
(
    '2026-11-10',

    '2026-11-13',

    2,

    'CONFIRMADA',

    (
        SELECT id_usuario
        FROM usuario
        WHERE correo = 'carlos@hospedaya.com'
    ),

    (
        SELECT id_alojamiento
        FROM alojamiento
        WHERE nombre = 'Casa Colonial Antigua'
    )
),
(
    '2026-12-05',

    '2026-12-07',

    4,

    'PENDIENTE',

    (
        SELECT id_usuario
        FROM usuario
        WHERE correo = 'sofia@hospedaya.com'
    ),

    (
        SELECT id_alojamiento
        FROM alojamiento
        WHERE nombre = 'Apartamento Lago Atitlán'
    )
);


-- 6. COSTOS DE LAS RESERVAS

-- Casa Colonial Antigua
-- Q450 × 3 noches = Q1350

INSERT INTO costo_reserva (
    precio_noche_aplicado,
    cantidad_noches,
    total,
    id_reserva
)
VALUES
(
    450.00,

    3,

    1350.00,

    (
        SELECT id_reserva
        FROM reserva
        WHERE fecha_entrada = '2026-11-10'
          AND id_alojamiento = (
              SELECT id_alojamiento
              FROM alojamiento
              WHERE nombre = 'Casa Colonial Antigua'
          )
    )
);


-- Apartamento Lago Atitlán
-- Q650 × 2 noches = Q1300

INSERT INTO costo_reserva (
    precio_noche_aplicado,
    cantidad_noches,
    total,
    id_reserva
)
VALUES
(
    650.00,

    2,

    1300.00,

    (
        SELECT id_reserva
        FROM reserva
        WHERE fecha_entrada = '2026-12-05'
          AND id_alojamiento = (
              SELECT id_alojamiento
              FROM alojamiento
              WHERE nombre = 'Apartamento Lago Atitlán'
          )
    )
);

-- 7. VALIDAR DATOS DE PRUEBA
SELECT * FROM usuario;

SELECT * FROM alojamiento;

SELECT * FROM imagen_alojamiento;

SELECT * FROM disponibilidad;

SELECT * FROM reserva;

SELECT * FROM costo_reserva;