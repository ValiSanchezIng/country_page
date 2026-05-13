-- ============================================================
-- Migracion 011: Fix S/D de iniciacion y ponyclub a 60 min
-- ------------------------------------------------------------
-- Contexto:
--   La migracion 010 cambio iniciacion y ponyclub de 30 a 60 min
--   pero solo reemplazo los slots de L-V. En sabado y domingo
--   esas dos clases siguen con slots de 30 min activos, lo cual
--   ya no concuerda con duracion_min=60.
--
-- Objetivo:
--   - Desactivar slots S/D de iniciacion y ponyclub (eran 30 min)
--   - Insertar 2 slots de 60 min cada dia: 08:00-09:00 y 09:00-10:00
--
-- NO toca: L-V (ya correcto), horarios_personalizados,
--          ni S/D de intermedio/paseo/avanzado (estan correctos en 60 min)
-- ============================================================
START TRANSACTION;

-- 1) Desactivar los slots actuales S/D de iniciacion (id=1) y ponyclub (id=5)
UPDATE horarios_clase
SET activo = 0
WHERE clase_id IN (1, 5)
  AND dia_semana IN ('S','D')
  AND activo = 1;

-- 2) iniciacion (id=1) S/D: 08:00 y 09:00 (cap 2) -> 2 dias x 2 slots = 4 filas
INSERT INTO horarios_clase (clase_id, dia_semana, hora_inicio, hora_fin, capacidad, activo)
SELECT 1, d.dia, h.hi, h.hf, 2, 1
FROM (SELECT 'S' dia UNION SELECT 'D') d
CROSS JOIN (
  SELECT '08:00:00' hi, '09:00:00' hf UNION ALL
  SELECT '09:00:00','10:00:00'
) h;

-- 3) ponyclub (id=5) S/D: 08:00 y 09:00 (cap 2) -> 2 dias x 2 slots = 4 filas
INSERT INTO horarios_clase (clase_id, dia_semana, hora_inicio, hora_fin, capacidad, activo)
SELECT 5, d.dia, h.hi, h.hf, 2, 1
FROM (SELECT 'S' dia UNION SELECT 'D') d
CROSS JOIN (
  SELECT '08:00:00' hi, '09:00:00' hf UNION ALL
  SELECT '09:00:00','10:00:00'
) h;

-- 4) Verificacion: cada fila debe mostrar exactamente '08:00:00, 09:00:00'
--    para iniciacion y ponyclub en S y D
SELECT c.nombre, hc.dia_semana,
       GROUP_CONCAT(hc.hora_inicio ORDER BY hc.hora_inicio SEPARATOR ', ') AS horas
FROM horarios_clase hc
JOIN clases c ON c.id = hc.clase_id
WHERE hc.activo = 1
  AND hc.clase_id IN (1, 5)
  AND hc.dia_semana IN ('S','D')
GROUP BY c.id, c.nombre, hc.dia_semana
ORDER BY c.id, FIELD(hc.dia_semana,'S','D');

-- Si todo se ve bien:
COMMIT;
-- Si algo esta raro:
-- ROLLBACK;
