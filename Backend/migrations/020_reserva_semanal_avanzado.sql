-- Migración 020: Permiso de reserva semanal (sólo avanzado)
-- El administrador puede habilitar que un cliente avanzado reserve varias clases
-- en la misma semana (en vez del límite de 1 reserva activa).
-- NOTA: MySQL estándar (sin ADD COLUMN IF NOT EXISTS).

ALTER TABLE usuarios
  ADD COLUMN permite_reserva_semanal TINYINT(1) NOT NULL DEFAULT 0
  COMMENT 'Permite al cliente (avanzado) reservar varias clases en la semana';
