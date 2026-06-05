-- Migración 015: Cupos por nivel/clase según nuevas reglas de negocio
-- Reglas: Ponyclub=1, Paseo=1, Iniciación=5, Intermedio=5, Avanzado=8.
-- Propietario/Renta no dependen del cupo (bypass en backend).
-- Actualiza tanto clases.cupo_max como horarios_clase.capacidad para que el
-- cupo por slot quede alineado con el cupo de la clase.

-- 1) clases.cupo_max
UPDATE clases SET cupo_max = 5 WHERE nombre = 'iniciacion'; -- id 1
UPDATE clases SET cupo_max = 5 WHERE nombre = 'intermedio';  -- id 2
UPDATE clases SET cupo_max = 1 WHERE nombre = 'paseo';       -- id 3
UPDATE clases SET cupo_max = 8 WHERE nombre = 'avanzado';    -- id 4
UPDATE clases SET cupo_max = 1 WHERE nombre = 'ponyclub';    -- id 5

-- 2) horarios_clase.capacidad (por clase_id) — alinear todos los slots
UPDATE horarios_clase hc
JOIN clases c ON c.id = hc.clase_id
SET hc.capacidad = CASE c.nombre
  WHEN 'iniciacion' THEN 5
  WHEN 'intermedio' THEN 5
  WHEN 'paseo'      THEN 1
  WHEN 'avanzado'   THEN 8
  WHEN 'ponyclub'   THEN 1
  ELSE hc.capacidad
END;
