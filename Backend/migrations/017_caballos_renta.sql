-- Migración 017: Tracking de renta de caballos
-- El administrador puede colocar un caballo en renta, indicar a quién se le rentó
-- (renta_cliente_id -> usuarios.id) y el período (fecha inicio/fin = días de renta).
-- El estatus 'renta'/'media_renta' ya existe en caballos.estatus.
-- NOTA: el servidor es MySQL estándar (no soporta ADD COLUMN IF NOT EXISTS).

ALTER TABLE caballos
  ADD COLUMN renta_cliente_id INT NULL COMMENT 'Cliente al que se rentó el caballo';

ALTER TABLE caballos
  ADD COLUMN renta_fecha_inicio DATE NULL COMMENT 'Inicio del período de renta';

ALTER TABLE caballos
  ADD COLUMN renta_fecha_fin DATE NULL COMMENT 'Fin del período de renta';

CREATE INDEX idx_caballos_renta_cliente ON caballos (renta_cliente_id);
