-- ============================================================
-- Migracion 010: Horarios solo en horas completas (L-V)
-- ------------------------------------------------------------
-- Objetivo:
--   - Eliminar las medias horas en lunes a viernes
--   - Dejar solo: 08, 09, 10, 11 AM y 15, 16, 17, 18 PM (8 slots)
--   - iniciacion y ponyclub pasan de 30 min a 60 min
--   - Habilitar el slot de 18:00 que faltaba en varias clases
--
-- NO toca: horarios_personalizados, sabado y domingo (S/D)
-- Estrategia: activo=0 en filas obsoletas (no DELETE) para preservar
--             referencias desde reservas. Permite rollback facil.
-- ============================================================
START TRANSACTION;

-- 1) iniciacion y ponyclub pasan a 60 min de duracion
UPDATE clases
SET duracion_min = 60
WHERE nombre IN ('iniciacion','ponyclub');

-- 2) Desactivar TODOS los slots L-V de iniciacion y ponyclub (eran de 30 min)
UPDATE horarios_clase
SET activo = 0
WHERE clase_id IN (1, 5)
  AND dia_semana IN ('L','M','X','J','V');

-- 3) Desactivar el slot 12:00 de paseo en L-V (fuera del rango pedido)
UPDATE horarios_clase
SET activo = 0
WHERE clase_id = 3
  AND dia_semana IN ('L','M','X','J','V')
  AND hora_inicio = '12:00:00';

-- 4) iniciacion (id=1) cap=2  -> 8 slots x 5 dias = 40 filas
INSERT INTO horarios_clase (clase_id, dia_semana, hora_inicio, hora_fin, capacidad, activo)
SELECT 1, d.dia, h.hi, h.hf, 2, 1
FROM (SELECT 'L' dia UNION SELECT 'M' UNION SELECT 'X' UNION SELECT 'J' UNION SELECT 'V') d
CROSS JOIN (
  SELECT '08:00:00' hi, '09:00:00' hf UNION ALL
  SELECT '09:00:00','10:00:00' UNION ALL
  SELECT '10:00:00','11:00:00' UNION ALL
  SELECT '11:00:00','12:00:00' UNION ALL
  SELECT '15:00:00','16:00:00' UNION ALL
  SELECT '16:00:00','17:00:00' UNION ALL
  SELECT '17:00:00','18:00:00' UNION ALL
  SELECT '18:00:00','19:00:00'
) h;

-- 5) ponyclub (id=5) cap=2  -> 8 slots x 5 dias = 40 filas
INSERT INTO horarios_clase (clase_id, dia_semana, hora_inicio, hora_fin, capacidad, activo)
SELECT 5, d.dia, h.hi, h.hf, 2, 1
FROM (SELECT 'L' dia UNION SELECT 'M' UNION SELECT 'X' UNION SELECT 'J' UNION SELECT 'V') d
CROSS JOIN (
  SELECT '08:00:00' hi, '09:00:00' hf UNION ALL
  SELECT '09:00:00','10:00:00' UNION ALL
  SELECT '10:00:00','11:00:00' UNION ALL
  SELECT '11:00:00','12:00:00' UNION ALL
  SELECT '15:00:00','16:00:00' UNION ALL
  SELECT '16:00:00','17:00:00' UNION ALL
  SELECT '17:00:00','18:00:00' UNION ALL
  SELECT '18:00:00','19:00:00'
) h;

-- 6) intermedio (id=2): faltan 11:00 y 18:00 en L-V (cap 6) -> 10 filas
INSERT INTO horarios_clase (clase_id, dia_semana, hora_inicio, hora_fin, capacidad, activo)
SELECT 2, d.dia, h.hi, h.hf, 6, 1
FROM (SELECT 'L' dia UNION SELECT 'M' UNION SELECT 'X' UNION SELECT 'J' UNION SELECT 'V') d
CROSS JOIN (
  SELECT '11:00:00' hi, '12:00:00' hf UNION ALL
  SELECT '18:00:00','19:00:00'
) h;

-- 7) paseo (id=3): falta 18:00 en L-V (cap 7) -> 5 filas
INSERT INTO horarios_clase (clase_id, dia_semana, hora_inicio, hora_fin, capacidad, activo)
SELECT 3, d.dia, '18:00:00', '19:00:00', 7, 1
FROM (SELECT 'L' dia UNION SELECT 'M' UNION SELECT 'X' UNION SELECT 'J' UNION SELECT 'V') d;

-- 8) avanzado (id=4): faltan 10, 11 (cap 6) y 18 (cap 5) en L-V -> 15 filas
INSERT INTO horarios_clase (clase_id, dia_semana, hora_inicio, hora_fin, capacidad, activo)
SELECT 4, d.dia, h.hi, h.hf, h.cap, 1
FROM (SELECT 'L' dia UNION SELECT 'M' UNION SELECT 'X' UNION SELECT 'J' UNION SELECT 'V') d
CROSS JOIN (
  SELECT '10:00:00' hi, '11:00:00' hf, 6 cap UNION ALL
  SELECT '11:00:00','12:00:00', 6 UNION ALL
  SELECT '18:00:00','19:00:00', 5
) h;

-- 9) Verificacion (revisar antes de COMMIT)
--    Cada fila L-V de cada clase debe mostrar exactamente:
--    08:00:00, 09:00:00, 10:00:00, 11:00:00, 15:00:00, 16:00:00, 17:00:00, 18:00:00
SELECT c.nombre, hc.dia_semana,
       GROUP_CONCAT(hc.hora_inicio ORDER BY hc.hora_inicio SEPARATOR ', ') AS horas
FROM horarios_clase hc
JOIN clases c ON c.id = hc.clase_id
WHERE hc.activo = 1 AND hc.dia_semana IN ('L','M','X','J','V')
GROUP BY c.id, c.nombre, hc.dia_semana
ORDER BY c.id, FIELD(hc.dia_semana,'L','M','X','J','V');

-- Si la verificacion se ve bien:
COMMIT;
-- Si algo esta raro:
-- ROLLBACK;

-- ============================================================
-- ROLLBACK manual (si ya se hizo COMMIT y quieres revertir):
-- ============================================================
-- START TRANSACTION;
-- DELETE FROM horarios_clase
--   WHERE id > (SELECT max_id FROM (SELECT MAX(id) AS max_id FROM horarios_clase WHERE id NOT IN (...)) t);
-- (Mejor restaurar desde backup. Antes de aplicar esta migracion,
--  considera: mysqldump country_refugiodb horarios_clase clases > backup_pre_010.sql)
