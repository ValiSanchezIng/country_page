-- Backup previo a migracion 010 (horarios solo horas completas L-V)
-- Generado: 2026-05-08T20:18:59.211Z
-- DB: country_refugiodb @ 212.227.238.213
-- Tablas respaldadas: clases, horarios_clase
-- Para restaurar: ejecutar este archivo (DROP/RECREATE de las dos tablas)

SET FOREIGN_KEY_CHECKS=0;
START TRANSACTION;

-- ============================================
-- clases
-- ============================================
DROP TABLE IF EXISTS clases;
CREATE TABLE `clases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` enum('iniciacion','intermedio','avanzado','paseo','ponyclub') DEFAULT NULL,
  `duracion_min` int DEFAULT NULL,
  `cupo_max` int DEFAULT NULL,
  `prioridad` int DEFAULT '0',
  `horario_matutino` time DEFAULT NULL,
  `horario_vespertino` time DEFAULT NULL,
  `observaciones` text,
  PRIMARY KEY (`id`),
  KEY `idx_clases_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3;

INSERT INTO `clases` (`id`, `nombre`, `duracion_min`, `cupo_max`, `prioridad`, `horario_matutino`, `horario_vespertino`, `observaciones`) VALUES (1, 'iniciacion', 30, 2, 1, NULL, NULL, 'Clase de iniciación para principiantes - 30 minutos');
INSERT INTO `clases` (`id`, `nombre`, `duracion_min`, `cupo_max`, `prioridad`, `horario_matutino`, `horario_vespertino`, `observaciones`) VALUES (2, 'intermedio', 60, 6, 2, NULL, NULL, 'Clase nivel intermedio - 1 hora');
INSERT INTO `clases` (`id`, `nombre`, `duracion_min`, `cupo_max`, `prioridad`, `horario_matutino`, `horario_vespertino`, `observaciones`) VALUES (3, 'paseo', 60, 6, 3, NULL, NULL, 'Paseo o caminata - 1 hora');
INSERT INTO `clases` (`id`, `nombre`, `duracion_min`, `cupo_max`, `prioridad`, `horario_matutino`, `horario_vespertino`, `observaciones`) VALUES (4, 'avanzado', 60, 6, 4, NULL, NULL, 'Clase nivel avanzado/salto - 1 hora');
INSERT INTO `clases` (`id`, `nombre`, `duracion_min`, `cupo_max`, `prioridad`, `horario_matutino`, `horario_vespertino`, `observaciones`) VALUES (5, 'ponyclub', 30, 2, 5, NULL, NULL, 'Clase Ponyclub para principiantes - 30 minutos (igual que iniciación)');

-- 5 filas en clases

-- ============================================
-- horarios_clase
-- ============================================
DROP TABLE IF EXISTS horarios_clase;
CREATE TABLE `horarios_clase` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clase_id` int NOT NULL,
  `dia_semana` enum('L','M','X','J','V','S','D') COLLATE utf8mb4_general_ci NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `capacidad` int NOT NULL DEFAULT '1',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_slot` (`clase_id`,`dia_semana`,`hora_inicio`,`hora_fin`),
  KEY `idx_horarios_dia_activo` (`dia_semana`,`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=275 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (1, 1, 'L', '07:30:00', '08:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (2, 1, 'L', '08:00:00', '08:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (3, 1, 'L', '08:30:00', '09:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (4, 1, 'L', '09:00:00', '09:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (5, 1, 'L', '09:30:00', '10:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (6, 1, 'L', '10:00:00', '10:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (7, 1, 'L', '15:30:00', '16:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (8, 1, 'L', '16:00:00', '16:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (9, 1, 'M', '07:30:00', '08:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (10, 1, 'M', '08:00:00', '08:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (11, 1, 'M', '08:30:00', '09:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (12, 1, 'M', '09:00:00', '09:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (13, 1, 'M', '09:30:00', '10:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (14, 1, 'M', '10:00:00', '10:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (15, 1, 'M', '15:30:00', '16:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (16, 1, 'M', '16:00:00', '16:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (17, 1, 'X', '07:30:00', '08:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (18, 1, 'X', '08:00:00', '08:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (19, 1, 'X', '08:30:00', '09:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (20, 1, 'X', '09:00:00', '09:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (21, 1, 'X', '09:30:00', '10:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (22, 1, 'X', '10:00:00', '10:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (23, 1, 'X', '15:30:00', '16:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (24, 1, 'X', '16:00:00', '16:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (25, 1, 'J', '07:30:00', '08:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (26, 1, 'J', '08:00:00', '08:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (27, 1, 'J', '08:30:00', '09:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (28, 1, 'J', '09:00:00', '09:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (29, 1, 'J', '09:30:00', '10:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (30, 1, 'J', '10:00:00', '10:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (31, 1, 'J', '15:30:00', '16:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (32, 1, 'J', '16:00:00', '16:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (33, 1, 'V', '07:30:00', '08:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (34, 1, 'V', '08:00:00', '08:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (35, 1, 'V', '08:30:00', '09:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (36, 1, 'V', '09:00:00', '09:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (37, 1, 'V', '09:30:00', '10:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (38, 1, 'V', '10:00:00', '10:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (39, 1, 'V', '15:30:00', '16:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (40, 1, 'V', '16:00:00', '16:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (41, 1, 'S', '07:30:00', '08:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (42, 1, 'S', '08:00:00', '08:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (43, 1, 'S', '08:30:00', '09:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (44, 1, 'S', '09:00:00', '09:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (45, 1, 'S', '09:30:00', '10:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (46, 1, 'D', '07:30:00', '08:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (47, 1, 'D', '08:00:00', '08:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (48, 1, 'D', '08:30:00', '09:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (49, 1, 'D', '09:00:00', '09:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (50, 1, 'D', '09:30:00', '10:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (51, 2, 'L', '08:00:00', '09:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (52, 2, 'L', '09:00:00', '10:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (53, 2, 'L', '10:00:00', '11:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (54, 2, 'L', '17:00:00', '18:00:00', 8, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (55, 2, 'M', '08:00:00', '09:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (56, 2, 'M', '09:00:00', '10:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (57, 2, 'M', '10:00:00', '11:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (58, 2, 'M', '17:00:00', '18:00:00', 8, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (59, 2, 'X', '08:00:00', '09:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (60, 2, 'X', '09:00:00', '10:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (61, 2, 'X', '10:00:00', '11:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (62, 2, 'X', '17:00:00', '18:00:00', 8, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (63, 2, 'J', '08:00:00', '09:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (64, 2, 'J', '09:00:00', '10:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (65, 2, 'J', '10:00:00', '11:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (66, 2, 'J', '17:00:00', '18:00:00', 8, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (67, 2, 'V', '08:00:00', '09:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (68, 2, 'V', '09:00:00', '10:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (69, 2, 'V', '10:00:00', '11:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (70, 2, 'V', '17:00:00', '18:00:00', 8, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (71, 2, 'S', '10:00:00', '11:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (72, 2, 'D', '10:00:00', '11:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (83, 4, 'L', '08:00:00', '09:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (84, 4, 'L', '09:00:00', '10:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (85, 4, 'L', '17:00:00', '18:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (86, 4, 'M', '08:00:00', '09:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (87, 4, 'M', '09:00:00', '10:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (88, 4, 'M', '17:00:00', '18:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (89, 4, 'X', '08:00:00', '09:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (90, 4, 'X', '09:00:00', '10:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (91, 4, 'X', '17:00:00', '18:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (92, 4, 'J', '08:00:00', '09:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (93, 4, 'J', '09:00:00', '10:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (94, 4, 'J', '17:00:00', '18:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (95, 4, 'V', '08:00:00', '09:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (96, 4, 'V', '09:00:00', '10:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (97, 4, 'V', '17:00:00', '18:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (98, 4, 'S', '10:00:00', '11:00:00', 3, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (99, 4, 'D', '10:00:00', '11:00:00', 3, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (100, 3, 'L', '08:00:00', '09:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (101, 3, 'L', '09:00:00', '10:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (102, 3, 'L', '10:00:00', '11:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (103, 3, 'L', '11:00:00', '12:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (104, 3, 'L', '12:00:00', '13:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (105, 3, 'L', '16:00:00', '17:00:00', 7, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (106, 3, 'L', '17:00:00', '18:00:00', 7, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (107, 3, 'M', '08:00:00', '09:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (108, 3, 'M', '09:00:00', '10:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (109, 3, 'M', '10:00:00', '11:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (110, 3, 'M', '11:00:00', '12:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (111, 3, 'M', '12:00:00', '13:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (112, 3, 'M', '16:00:00', '17:00:00', 7, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (113, 3, 'M', '17:00:00', '18:00:00', 7, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (114, 3, 'X', '08:00:00', '09:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (115, 3, 'X', '09:00:00', '10:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (116, 3, 'X', '10:00:00', '11:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (117, 3, 'X', '11:00:00', '12:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (118, 3, 'X', '12:00:00', '13:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (119, 3, 'X', '16:00:00', '17:00:00', 7, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (120, 3, 'X', '17:00:00', '18:00:00', 7, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (121, 3, 'J', '08:00:00', '09:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (122, 3, 'J', '09:00:00', '10:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (123, 3, 'J', '10:00:00', '11:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (124, 3, 'J', '11:00:00', '12:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (125, 3, 'J', '12:00:00', '13:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (126, 3, 'J', '16:00:00', '17:00:00', 7, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (127, 3, 'J', '17:00:00', '18:00:00', 7, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (128, 3, 'V', '08:00:00', '09:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (129, 3, 'V', '09:00:00', '10:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (130, 3, 'V', '10:00:00', '11:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (131, 3, 'V', '11:00:00', '12:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (132, 3, 'V', '12:00:00', '13:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (133, 3, 'V', '16:00:00', '17:00:00', 7, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (134, 3, 'V', '17:00:00', '18:00:00', 7, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (135, 3, 'S', '08:00:00', '09:00:00', 7, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (136, 3, 'S', '09:00:00', '10:00:00', 7, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (137, 3, 'S', '10:00:00', '11:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (138, 3, 'S', '11:00:00', '12:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (139, 3, 'S', '12:00:00', '13:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (140, 3, 'D', '08:00:00', '09:00:00', 7, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (141, 3, 'D', '09:00:00', '10:00:00', 7, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (142, 3, 'D', '10:00:00', '11:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (143, 3, 'D', '11:00:00', '12:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (144, 3, 'D', '12:00:00', '13:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (145, 1, 'L', '15:00:00', '15:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (146, 1, 'M', '15:00:00', '15:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (147, 1, 'X', '15:00:00', '15:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (148, 1, 'J', '15:00:00', '15:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (149, 1, 'V', '15:00:00', '15:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (150, 2, 'L', '15:00:00', '16:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (151, 2, 'M', '15:00:00', '16:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (152, 2, 'X', '15:00:00', '16:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (153, 2, 'J', '15:00:00', '16:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (154, 2, 'V', '15:00:00', '16:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (155, 3, 'L', '15:00:00', '16:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (156, 3, 'M', '15:00:00', '16:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (157, 3, 'X', '15:00:00', '16:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (158, 3, 'J', '15:00:00', '16:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (159, 3, 'V', '15:00:00', '16:00:00', 5, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (160, 4, 'L', '15:00:00', '16:00:00', 3, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (161, 4, 'M', '15:00:00', '16:00:00', 3, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (162, 4, 'X', '15:00:00', '16:00:00', 3, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (163, 4, 'J', '15:00:00', '16:00:00', 3, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (164, 4, 'V', '15:00:00', '16:00:00', 3, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (165, 5, 'L', '07:30:00', '08:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (166, 5, 'L', '08:00:00', '08:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (167, 5, 'L', '08:30:00', '09:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (168, 5, 'L', '09:00:00', '09:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (169, 5, 'L', '09:30:00', '10:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (170, 5, 'L', '10:00:00', '10:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (171, 5, 'L', '15:00:00', '15:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (172, 5, 'L', '15:30:00', '16:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (173, 5, 'L', '16:00:00', '16:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (174, 5, 'M', '07:30:00', '08:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (175, 5, 'M', '08:00:00', '08:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (176, 5, 'M', '08:30:00', '09:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (177, 5, 'M', '09:00:00', '09:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (178, 5, 'M', '09:30:00', '10:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (179, 5, 'M', '10:00:00', '10:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (180, 5, 'M', '15:00:00', '15:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (181, 5, 'M', '15:30:00', '16:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (182, 5, 'M', '16:00:00', '16:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (183, 5, 'X', '07:30:00', '08:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (184, 5, 'X', '08:00:00', '08:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (185, 5, 'X', '08:30:00', '09:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (186, 5, 'X', '09:00:00', '09:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (187, 5, 'X', '09:30:00', '10:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (188, 5, 'X', '10:00:00', '10:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (189, 5, 'X', '15:00:00', '15:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (190, 5, 'X', '15:30:00', '16:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (191, 5, 'X', '16:00:00', '16:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (192, 5, 'J', '07:30:00', '08:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (193, 5, 'J', '08:00:00', '08:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (194, 5, 'J', '08:30:00', '09:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (195, 5, 'J', '09:00:00', '09:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (196, 5, 'J', '09:30:00', '10:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (197, 5, 'J', '10:00:00', '10:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (198, 5, 'J', '15:00:00', '15:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (199, 5, 'J', '15:30:00', '16:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (200, 5, 'J', '16:00:00', '16:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (201, 5, 'V', '07:30:00', '08:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (202, 5, 'V', '08:00:00', '08:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (203, 5, 'V', '08:30:00', '09:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (204, 5, 'V', '09:00:00', '09:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (205, 5, 'V', '09:30:00', '10:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (206, 5, 'V', '10:00:00', '10:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (207, 5, 'V', '15:00:00', '15:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (208, 5, 'V', '15:30:00', '16:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (209, 5, 'V', '16:00:00', '16:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (210, 5, 'S', '07:30:00', '08:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (211, 5, 'S', '08:00:00', '08:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (212, 5, 'S', '08:30:00', '09:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (213, 5, 'S', '09:00:00', '09:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (214, 5, 'S', '09:30:00', '10:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (215, 5, 'D', '07:30:00', '08:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (216, 5, 'D', '08:00:00', '08:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (217, 5, 'D', '08:30:00', '09:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (218, 5, 'D', '09:00:00', '09:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (219, 5, 'D', '09:30:00', '10:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (228, 5, 'L', '18:00:00', '18:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (229, 5, 'L', '17:30:00', '18:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (230, 5, 'L', '17:00:00', '17:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (231, 5, 'L', '16:30:00', '17:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (232, 5, 'M', '18:00:00', '18:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (233, 5, 'M', '17:30:00', '18:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (234, 5, 'M', '17:00:00', '17:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (235, 5, 'M', '16:30:00', '17:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (236, 5, 'X', '18:00:00', '18:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (237, 5, 'X', '17:30:00', '18:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (238, 5, 'X', '17:00:00', '17:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (239, 5, 'X', '16:30:00', '17:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (240, 5, 'J', '18:00:00', '18:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (241, 5, 'J', '17:30:00', '18:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (242, 5, 'J', '17:00:00', '17:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (243, 5, 'J', '16:30:00', '17:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (244, 5, 'V', '18:00:00', '18:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (245, 5, 'V', '17:30:00', '18:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (246, 5, 'V', '17:00:00', '17:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (247, 5, 'V', '16:30:00', '17:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (248, 5, 'S', '18:00:00', '18:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (249, 5, 'S', '17:30:00', '18:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (250, 5, 'S', '17:00:00', '17:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (251, 5, 'S', '16:30:00', '17:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (252, 5, 'D', '18:00:00', '18:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (253, 5, 'D', '17:30:00', '18:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (254, 5, 'D', '17:00:00', '17:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (255, 5, 'D', '16:30:00', '17:00:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (259, 5, 'S', '16:00:00', '16:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (260, 5, 'D', '16:00:00', '16:30:00', 2, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (261, 2, 'L', '16:00:00', '17:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (262, 2, 'M', '16:00:00', '17:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (263, 2, 'X', '16:00:00', '17:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (264, 2, 'J', '16:00:00', '17:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (265, 2, 'V', '16:00:00', '17:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (266, 4, 'L', '16:00:00', '17:00:00', 3, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (267, 4, 'M', '16:00:00', '17:00:00', 3, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (268, 4, 'X', '16:00:00', '17:00:00', 3, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (269, 4, 'J', '16:00:00', '17:00:00', 3, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (270, 4, 'V', '16:00:00', '17:00:00', 3, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (271, 2, 'S', '08:00:00', '09:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (272, 2, 'D', '08:00:00', '09:00:00', 6, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (273, 4, 'S', '08:00:00', '09:00:00', 3, 1);
INSERT INTO `horarios_clase` (`id`, `clase_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `capacidad`, `activo`) VALUES (274, 4, 'D', '08:00:00', '09:00:00', 3, 1);

-- 253 filas en horarios_clase

COMMIT;
SET FOREIGN_KEY_CHECKS=1;
