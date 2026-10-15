
-- 3. USUARIO
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario BIGSERIAL PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,

    correo VARCHAR(255) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    rol VARCHAR(20) NOT NULL
        CHECK (
            rol IN (
                'HUESPED',
                'ANFITRION',
                'ADMINISTRADOR'
            )
        ),

    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (
            estado IN (
                'ACTIVO',
                'INACTIVO'
            )
        )
);


-- 4. TABLA ALOJAMIENTO

CREATE TABLE IF NOT EXISTS alojamiento (
    id_alojamiento BIGSERIAL PRIMARY KEY,

    nombre VARCHAR(150) NOT NULL,

    descripcion TEXT,

    direccion VARCHAR(255) NOT NULL,

    capacidad INTEGER NOT NULL
        CHECK (capacidad > 0),

    precio_noche NUMERIC(10,2) NOT NULL
        CHECK (precio_noche >= 0),

    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (
            estado IN (
                'ACTIVO',
                'INACTIVO'
            )
        ),

    id_usuario BIGINT NOT NULL,

    CONSTRAINT fk_alojamiento_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT
);


-- 5. IMÁGENES DE ALOJAMIENTO

CREATE TABLE IF NOT EXISTS imagen_alojamiento (
    id_imagen BIGSERIAL PRIMARY KEY,

    url_imagen TEXT NOT NULL,

    es_principal BOOLEAN NOT NULL DEFAULT FALSE,

    orden INTEGER NOT NULL DEFAULT 1
        CHECK (orden > 0),

    id_alojamiento BIGINT NOT NULL,

    CONSTRAINT fk_imagen_airbnb
        FOREIGN KEY (id_alojamiento)
        REFERENCES alojamiento(id_alojamiento)
        ON DELETE CASCADE
);


-- 6. DISPONIBILIDAD

CREATE TABLE IF NOT EXISTS disponibilidad (
    id_disponibilidad BIGSERIAL PRIMARY KEY,

    fecha_inicio DATE NOT NULL,

    fecha_fin DATE NOT NULL,

    estado VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE'
        CHECK (
            estado IN (
                'DISPONIBLE',
                'NO_DISPONIBLE'
            )
        ),

    id_alojamiento BIGINT NOT NULL,

    CONSTRAINT ck_disponibilidad_fechas
        CHECK (fecha_fin > fecha_inicio),

    CONSTRAINT fk_disponibilidad_alojamiento
        FOREIGN KEY (id_alojamiento)
        REFERENCES alojamiento(id_alojamiento)
        ON DELETE CASCADE
);


-- 7. RESERVA

CREATE TABLE IF NOT EXISTS reserva (
    id_reserva BIGSERIAL PRIMARY KEY,

    fecha_entrada DATE NOT NULL,

    fecha_salida DATE NOT NULL,

    cantidad_huespedes INTEGER NOT NULL
        CHECK (cantidad_huespedes > 0),

    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (
            estado IN (
                'PENDIENTE',
                'CONFIRMADA',
                'CANCELADA',
                'FINALIZADA'
            )
        ),

    fecha_creacion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    id_usuario BIGINT NOT NULL,

    id_alojamiento BIGINT NOT NULL,

    CONSTRAINT ck_reserva_fechas
        CHECK (fecha_salida > fecha_entrada),

    CONSTRAINT fk_reserva_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_reserva_alojamiento
        FOREIGN KEY (id_alojamiento)
        REFERENCES alojamiento(id_alojamiento)
        ON DELETE RESTRICT
);


-- 8. COSTO RESERVA


CREATE TABLE IF NOT EXISTS costo_reserva (
    id_costo_reserva BIGSERIAL PRIMARY KEY,

    precio_noche_aplicado NUMERIC(10,2) NOT NULL
        CHECK (precio_noche_aplicado >= 0),

    cantidad_noches INTEGER NOT NULL
        CHECK (cantidad_noches > 0),

    total NUMERIC(12,2) NOT NULL
        CHECK (total >= 0),

    id_reserva BIGINT NOT NULL UNIQUE,

    CONSTRAINT fk_costo_reserva
        FOREIGN KEY (id_reserva)
        REFERENCES reserva(id_reserva)
        ON DELETE CASCADE
);


-- 9. DATOS DE PRUEBA

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
    'huesped@hospedaya.com',
    'HASH_TEMPORAL_HUESPED',
    'HUESPED',
    'ACTIVO'
),
(
    'María López',
    'anfitrion@hospedaya.com',
    'HASH_TEMPORAL_ANFITRION',
    'ANFITRION',
    'ACTIVO'
),
(
    'Administrador',
    'admin@hospedaya.com',
    'HASH_TEMPORAL_ADMIN',
    'ADMINISTRADOR',
    'ACTIVO'
)
ON CONFLICT (correo) DO NOTHING;

-- 10. VERIFICACIÓN


SELECT current_database();

SELECT *
FROM usuario;