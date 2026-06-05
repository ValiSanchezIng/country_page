-- Migración 016: Lunes sin clases y sin turno de tarde en fin de semana
-- Reglas de negocio:
--   - Los lunes el establecimiento no labora -> desactivar todos los slots del lunes.
--   - Quitar el turno de la tarde (>= 12:00) los sábados y domingos.
-- Reversible: para reactivar, poner activo = 1 en los mismos slots.

-- Lunes (dia_semana = 'L') sin clases
UPDATE horarios_clase
SET activo = 0
WHERE dia_semana = 'L';

-- Sábado y Domingo: desactivar slots de la tarde (hora_inicio >= 12:00)
UPDATE horarios_clase
SET activo = 0
WHERE dia_semana IN ('S','D')
  AND hora_inicio >= '12:00:00';
