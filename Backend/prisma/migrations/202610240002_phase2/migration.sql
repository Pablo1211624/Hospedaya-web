-- Additive migration. Existing reservations and passwords are preserved.
ALTER TABLE usuario ADD COLUMN biografia TEXT NOT NULL DEFAULT '';
ALTER TABLE alojamiento ADD COLUMN ciudad VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN habitaciones INTEGER NOT NULL DEFAULT 1 CHECK (habitaciones > 0),
  ADD COLUMN banos INTEGER NOT NULL DEFAULT 1 CHECK (banos > 0),
  ADD COLUMN amenidades TEXT NOT NULL DEFAULT '', ADD COLUMN reglas TEXT NOT NULL DEFAULT '';
ALTER TABLE reserva ADD COLUMN adultos INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN ninos INTEGER NOT NULL DEFAULT 0;
UPDATE reserva SET adultos = cantidad_huespedes;
ALTER TABLE reserva ADD CONSTRAINT ck_reserva_huespedes CHECK (adultos > 0 AND ninos >= 0 AND cantidad_huespedes = adultos + ninos);
-- Abort on existing conflicts: never delete or silently cancel historical data.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE reserva ADD CONSTRAINT reserva_sin_superposicion EXCLUDE USING gist
  (id_alojamiento WITH =, daterange(fecha_entrada, fecha_salida, '[)') WITH &&)
  WHERE (estado = 'CONFIRMADA');
CREATE INDEX alojamiento_id_usuario_idx ON alojamiento(id_usuario);
CREATE INDEX alojamiento_ciudad_estado_idx ON alojamiento(ciudad, estado);
CREATE INDEX disponibilidad_id_alojamiento_fecha_inicio_fecha_fin_idx ON disponibilidad(id_alojamiento, fecha_inicio, fecha_fin);
CREATE INDEX imagen_alojamiento_id_alojamiento_idx ON imagen_alojamiento(id_alojamiento);
CREATE INDEX reserva_id_usuario_idx ON reserva(id_usuario);
CREATE INDEX reserva_id_alojamiento_fecha_entrada_fecha_salida_idx ON reserva(id_alojamiento, fecha_entrada, fecha_salida);
CREATE UNIQUE INDEX imagen_principal_unica ON imagen_alojamiento(id_alojamiento) WHERE es_principal;
-- Normalize only when this does not merge two existing users.
DO $$ BEGIN
 IF EXISTS (SELECT lower(trim(correo)) FROM usuario GROUP BY lower(trim(correo)) HAVING count(*) > 1)
 THEN RAISE EXCEPTION 'Hay correos duplicados al normalizarlos; resolver antes de migrar'; END IF;
END $$;
UPDATE usuario SET correo = lower(trim(correo));
CREATE UNIQUE INDEX usuario_correo_normalizado ON usuario(lower(correo));
