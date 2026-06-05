-- Migración 021: Ajustes de espacios por horario (fijo / semanal / por día)
-- El administrador puede aumentar o disminuir el cupo de un horario:
--   tipo='fijo'    -> aplica siempre a (clase, hora_inicio) [dia_semana/fecha NULL]
--   tipo='semanal' -> aplica a un día de la semana concreto (dia_semana)
--   tipo='dia'     -> aplica a una fecha concreta (fecha)
-- Se puede dar un ajuste relativo (delta, ej. +1 / -1) o un valor absoluto (capacidad_abs).
-- El backend resuelve el cupo efectivo: capacidad_abs si no es NULL, si no cupo_base + delta.

CREATE TABLE IF NOT EXISTS capacidad_overrides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clase_id INT NOT NULL,
  tipo ENUM('fijo','semanal','dia') NOT NULL,
  dia_semana ENUM('L','M','X','J','V','S','D') NULL,
  fecha DATE NULL,
  hora_inicio TIME NULL COMMENT 'NULL = aplica a todos los horarios de la clase',
  delta INT NOT NULL DEFAULT 0 COMMENT 'Ajuste relativo al cupo base',
  capacidad_abs INT NULL COMMENT 'Cupo absoluto; si no es NULL ignora delta',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_por INT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_override_clase_activo (clase_id, activo),
  KEY idx_override_fecha (fecha),
  KEY idx_override_dia (dia_semana)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
