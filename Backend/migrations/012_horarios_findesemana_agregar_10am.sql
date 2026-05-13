-- ============================================================
-- Migracion 012: Agregar slot 10:00-11:00 S/D para iniciacion y ponyclub
-- ------------------------------------------------------------
-- Contexto:
--   La migracion 011 inserto 2 slots S/D (08:00 y 09:00) para
--   iniciacion y ponyclub. Faltaba el slot de 10:00.
--
-- Objetivo:
--   Insertar 10:00-11:00 (cap 2) en S y D para clase_id 1 y 5.
--   Total: 2 clases x 2 dias = 4 filas nuevas.
--
-- NO toca: nada mas (solo INSERT de las 4 filas faltantes)
-- ============================================================
START TRANSACTION;

-- 1) iniciacion (id=1) S y D: 10:00-11:00 (cap 2) -> 2 filas
INSERT INTO horarios_clase (clase_id, dia_semana, hora_inicio, hora_fin, capacidad, activo)
SELECT 1, d.dia, '10:00:00', '11:00:00', 2, 1
FROM (SELECT 'S' dia UNION SELECT 'D') d;

-- 2) ponyclub (id=5) S y D: 10:00-11:00 (cap 2) -> 2 filas
INSERT INTO horarios_clase (clase_id, dia_semana, hora_inicio, hora_fin, capacidad, activo)
SELECT 5, d.dia, '10:00:00', '11:00:00', 2, 1
FROM (SELECT 'S' dia UNION SELECT 'D') d;

-- 3) Verificacion: ahora cada fila debe mostrar
--    '08:00:00, 09:00:00, 10:00:00' para iniciacion y ponyclub en S y D
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
