-- Migración 014: Bloqueos de clases por administrador
-- Permite a un admin bloquear slots de clase (fecha + turno + clase) para impedir
-- NUEVAS reservas. No afecta reservas ya existentes.
--
-- Reglas:
--   - clase_id NULL  => aplica a TODAS las clases de esa fecha + turno
--   - turno = 'mañana' => slots con hora_inicio < 12:00
--   - turno = 'tarde'  => slots con hora_inicio >= 12:00
--   - activo = 0 => bloqueo anulado (soft-delete, reservado para uso futuro)

CREATE TABLE bloqueos_clase (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    clase_id   INT          NULL COMMENT 'FK a clases.id. NULL = aplica a TODAS las clases de esa fecha+turno',
    fecha      DATE         NOT NULL COMMENT 'Día bloqueado',
    turno      ENUM('mañana','tarde') NOT NULL COMMENT 'mañana = hora_inicio < 12:00, tarde = >= 12:00',
    motivo     VARCHAR(255) NULL COMMENT 'Motivo del bloqueo (clima, evento, etc.)',
    creado_por INT          NULL COMMENT 'FK a usuarios.id del admin que creó el bloqueo',
    creado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo     TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '1 = vigente, 0 = anulado (soft-delete)',
    CONSTRAINT fk_bloqueo_clase
        FOREIGN KEY (clase_id) REFERENCES clases (id)
            ON DELETE CASCADE,
    CONSTRAINT fk_bloqueo_creado_por
        FOREIGN KEY (creado_por) REFERENCES usuarios (id)
            ON DELETE SET NULL
)
    COLLATE = utf8mb4_general_ci;

CREATE INDEX idx_bloqueos_fecha_turno ON bloqueos_clase (fecha, turno, activo);
CREATE INDEX idx_bloqueos_clase       ON bloqueos_clase (clase_id, activo);
