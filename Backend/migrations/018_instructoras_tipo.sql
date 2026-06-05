-- Migración 018: Tipo de instructora (general vs admin)
-- 'admin'  -> ve todas las reservas y puede editar caballo/actividad/observaciones.
-- 'general'-> ve sólo sus reservas (lectura) y sólo marca asistencia.
-- El administrador asigna el tipo desde el panel de instructoras.
-- NOTA: MySQL estándar (sin ADD COLUMN IF NOT EXISTS).

ALTER TABLE instructoras
  ADD COLUMN tipo_instructor ENUM('general','admin') NOT NULL DEFAULT 'general'
  COMMENT 'general: solo ve sus reservas; admin: ve y edita todas';
