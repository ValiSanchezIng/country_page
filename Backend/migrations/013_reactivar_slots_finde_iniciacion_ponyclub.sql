-- ============================================================
-- Migracion 013: Reactivar slots S/D 08:00 y 09:00 de iniciacion y ponyclub
-- ------------------------------------------------------------
-- Estado actual en BD (verificado):
--   IDs 438-441 (iniciacion S/D 08-09 y 09-10) -> activo=0
--   IDs 445-448 (ponyclub  S/D 08-09 y 09-10) -> activo=0
--   IDs 453,454,456,457 (10-11) ya estan activo=1 (de la migracion 012)
--
-- Fix: poner activo=1 a esas 8 filas exactas.
-- ============================================================
START TRANSACTION;

UPDATE horarios_clase
SET activo = 1
WHERE id IN (438, 439, 440, 441, 445, 446, 447, 448);

-- Verificacion: deben aparecer 8 filas con activo=1
SELECT hc.id, c.nombre, hc.dia_semana, hc.hora_inicio, hc.hora_fin, hc.activo
FROM horarios_clase hc
JOIN clases c ON c.id = hc.clase_id
WHERE hc.id IN (438, 439, 440, 441, 445, 446, 447, 448)
ORDER BY c.id, FIELD(hc.dia_semana,'S','D'), hc.hora_inicio;

-- Resumen final S/D para iniciacion y ponyclub: cada fila debe mostrar
-- '08:00:00, 09:00:00, 10:00:00'
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
