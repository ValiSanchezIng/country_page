-- Migración 019: Actividad de la sesión y control de recordatorio
-- 'actividad'           -> qué actividad realizó el alumno (lo asigna el instructor admin).
-- 'recordatorio_enviado'-> flag para el correo de recordatorio 2h antes (job interno).
-- Los campos 'observaciones' y 'caballo_id' ya existen en reservas.
-- NOTA: MySQL estándar (sin ADD COLUMN IF NOT EXISTS).

ALTER TABLE reservas
  ADD COLUMN actividad VARCHAR(255) NULL COMMENT 'Actividad realizada en la sesión';

ALTER TABLE reservas
  ADD COLUMN recordatorio_enviado TINYINT(1) NOT NULL DEFAULT 0
  COMMENT 'Recordatorio 2h antes ya enviado (1) o no (0)';
