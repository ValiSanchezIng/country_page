-- ============================================================
-- 009_agregar_horarios_intermedio_avanzado.sql
-- Fecha: 2026-05-01
-- Descripción:
--   1) Agrega slot de 16:00 entre semana (L-V) para intermedio y
--      avanzado (rellena el hueco entre 15:00 y 17:00).
--   2) Agrega slot de 08:00 los fines de semana (S y D) para
--      intermedio y avanzado (antes solo había 10:00).
-- Capacidades: las del slot vecino más cercano (15:00 entre semana,
--              10:00 los findes).
-- Total: 14 filas nuevas.
-- ============================================================

-- 1) 16:00 L-V intermedio (clase_id=2, cap 6)
INSERT INTO horarios_clase (clase_id, dia_semana, hora_inicio, hora_fin, capacidad, activo) VALUES
  (2, 'L', '16:00:00', '17:00:00', 6, 1),
  (2, 'M', '16:00:00', '17:00:00', 6, 1),
  (2, 'X', '16:00:00', '17:00:00', 6, 1),
  (2, 'J', '16:00:00', '17:00:00', 6, 1),
  (2, 'V', '16:00:00', '17:00:00', 6, 1);

-- 2) 16:00 L-V avanzado (clase_id=4, cap 3)
INSERT INTO horarios_clase (clase_id, dia_semana, hora_inicio, hora_fin, capacidad, activo) VALUES
  (4, 'L', '16:00:00', '17:00:00', 3, 1),
  (4, 'M', '16:00:00', '17:00:00', 3, 1),
  (4, 'X', '16:00:00', '17:00:00', 3, 1),
  (4, 'J', '16:00:00', '17:00:00', 3, 1),
  (4, 'V', '16:00:00', '17:00:00', 3, 1);

-- 3) 08:00 S y D intermedio (clase_id=2, cap 6)
INSERT INTO horarios_clase (clase_id, dia_semana, hora_inicio, hora_fin, capacidad, activo) VALUES
  (2, 'S', '08:00:00', '09:00:00', 6, 1),
  (2, 'D', '08:00:00', '09:00:00', 6, 1);

-- 4) 08:00 S y D avanzado (clase_id=4, cap 3)
INSERT INTO horarios_clase (clase_id, dia_semana, hora_inicio, hora_fin, capacidad, activo) VALUES
  (4, 'S', '08:00:00', '09:00:00', 3, 1),
  (4, 'D', '08:00:00', '09:00:00', 3, 1);

-- ============================================================
-- Verificación
-- ============================================================
-- SELECT c.nombre, hc.dia_semana, hc.hora_inicio, hc.capacidad
-- FROM horarios_clase hc
-- JOIN clases c ON hc.clase_id = c.id
-- WHERE c.nombre IN ('intermedio','avanzado') AND hc.activo = 1
-- ORDER BY c.nombre,
--          FIELD(hc.dia_semana,'L','M','X','J','V','S','D'),
--          hc.hora_inicio;
