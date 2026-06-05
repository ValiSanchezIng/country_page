import express from 'express';
import axios from 'axios';
import db from '../server/db.js';

const router = express.Router();

// Cancela las reservas activas afectadas por un bloqueo (fecha+turno+clase) y
// envía a cada cliente el correo de cancelación con el motivo. No bloquea la
// respuesta si algún correo falla. claseId = null => aplica a todas las clases.
const cancelarReservasPorBloqueo = async (fechaSQL, turno, claseId, motivo) => {
  // mañana = clases con hora_inicio < 12:00; tarde = hora_inicio >= 12:00
  const horaCmp = turno === 'mañana' ? '< \'12:00:00\'' : '>= \'12:00:00\'';
  const claseClause = claseId === null ? '' : 'AND r.clase_id = ?';
  const params = [fechaSQL];
  if (claseId !== null) params.push(claseId);

  const [reservas] = await db.query(`
    SELECT r.id, r.fecha, r.hora_inicio, r.hora_fin,
           u.nombre, u.apellido, u.correo,
           i.nombre AS inst_nombre, i.apellido AS inst_apellido
    FROM reservas r
    LEFT JOIN usuarios u ON u.id = r.cliente_id
    LEFT JOIN instructoras inst ON inst.id = r.instructora_id
    LEFT JOIN usuarios i ON inst.usuario_id = i.id
    WHERE r.fecha = ?
      AND r.estatus IN ('pendiente','confirmada')
      AND r.hora_inicio ${horaCmp}
      ${claseClause}
  `, params);

  if (reservas.length === 0) return 0;

  const ids = reservas.map(r => r.id);
  const placeholders = ids.map(() => '?').join(',');
  const obs = `\n[Cancelación administrativa]${motivo ? ` Motivo: ${motivo}` : ''}`;
  await db.query(`
    UPDATE reservas
    SET estatus = 'cancelada_instructor',
        caballo_id = NULL,
        observaciones = CONCAT(COALESCE(observaciones, ''), ?)
    WHERE id IN (${placeholders})
  `, [obs, ...ids]);

  for (const r of reservas) {
    if (!r.correo || r.correo.trim() === '') continue;
    const fechaStr = r.fecha instanceof Date ? r.fecha.toISOString().split('T')[0] : String(r.fecha).split('T')[0];
    const instructor = r.inst_nombre ? `${r.inst_nombre} ${r.inst_apellido || ''}`.trim() : null;
    const payload = {
      email: r.correo.trim(),
      nombre: `${r.nombre || ''} ${r.apellido || ''}`.trim(),
      fechaReserva: fechaStr,
      horaInicio: r.hora_inicio ? String(r.hora_inicio).slice(0, 5) : '',
      horaFin: r.hora_fin ? String(r.hora_fin).slice(0, 5) : '',
      instructor,
      motivoCancelacion: motivo || 'La clase fue cancelada por el administrador'
    };
    axios.post('https://elrefugiocountryclub.com/api/api/email/send-cancellation-notification', payload)
      .catch(e => console.error(`⚠️ Error email cancelación bloqueo a ${r.correo}:`, e.message));
  }
  return reservas.length;
};

// Función para formatear fechas para MySQL (mismo helper que descansos.js)
const formatDateForMySQL = (dateString) => {
  if (!dateString) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Formato de fecha inválido');
  }

  return date.toISOString().split('T')[0];
};

const TURNOS_VALIDOS = ['mañana', 'tarde'];

// =============================================================================
// OBTENER BLOQUEOS
// =============================================================================

// GET /api/bloqueos - listar bloqueos con filtros opcionales
//   ?fecha_inicio=YYYY-MM-DD  (incluye bloqueos cuya fecha >= fecha_inicio)
//   ?fecha_fin=YYYY-MM-DD     (incluye bloqueos cuya fecha <= fecha_fin)
//   ?clase_id=N               (filtra por una clase específica)
//   ?solo_activos=1           (excluye bloqueos con activo=0)
router.get('/', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, clase_id, solo_activos } = req.query;

    let whereClause = '1=1';
    const params = [];

    if (solo_activos === '1' || solo_activos === 'true') {
      whereClause += ' AND b.activo = 1';
    }

    if (fecha_inicio) {
      whereClause += ' AND b.fecha >= ?';
      params.push(formatDateForMySQL(fecha_inicio));
    }

    if (fecha_fin) {
      whereClause += ' AND b.fecha <= ?';
      params.push(formatDateForMySQL(fecha_fin));
    }

    if (clase_id) {
      // Incluir bloqueos de "Todas" (clase_id IS NULL) — siempre aplican
      whereClause += ' AND (b.clase_id IS NULL OR b.clase_id = ?)';
      params.push(clase_id);
    }

    const [rows] = await db.query(`
      SELECT
        b.id,
        b.clase_id,
        b.fecha,
        b.turno,
        b.motivo,
        b.creado_por,
        b.creado_en,
        b.activo,
        c.nombre AS clase_nombre,
        u.nombre AS creado_por_nombre,
        u.apellido AS creado_por_apellido
      FROM bloqueos_clase b
      LEFT JOIN clases c ON b.clase_id = c.id
      LEFT JOIN usuarios u ON b.creado_por = u.id
      WHERE ${whereClause}
      ORDER BY b.fecha DESC, b.turno, b.id
    `, params);

    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo bloqueos:', err);
    res.status(500).json({ error: 'Error al obtener bloqueos' });
  }
});

// GET /api/bloqueos/check - verificar si un slot está bloqueado
//   ?fecha=YYYY-MM-DD&turno=mañana|tarde&clase_id=N
router.get('/check', async (req, res) => {
  const { fecha, turno, clase_id } = req.query;

  if (!fecha || !turno) {
    return res.status(400).json({ error: 'Parámetros requeridos: fecha, turno' });
  }
  if (!TURNOS_VALIDOS.includes(turno)) {
    return res.status(400).json({ error: `Turno inválido. Valores permitidos: ${TURNOS_VALIDOS.join(', ')}` });
  }

  try {
    const [rows] = await db.query(`
      SELECT id, motivo, clase_id
      FROM bloqueos_clase
      WHERE activo = 1
        AND fecha = ?
        AND turno = ?
        AND (clase_id IS NULL OR clase_id = ?)
      LIMIT 1
    `, [formatDateForMySQL(fecha), turno, clase_id || null]);

    if (rows.length > 0) {
      res.json({ bloqueado: true, bloqueo: rows[0] });
    } else {
      res.json({ bloqueado: false });
    }
  } catch (err) {
    console.error('Error verificando bloqueo:', err);
    res.status(500).json({ error: 'Error al verificar bloqueo' });
  }
});

// =============================================================================
// CREAR BLOQUEO
// =============================================================================

// POST /api/bloqueos - crear uno o varios bloqueos
// Body: {
//   clase_ids: number[]   // vacío [] => "Todas las clases" (1 fila con clase_id NULL)
//                         // con ids => 1 fila por cada id
//   fecha:    'YYYY-MM-DD'
//   turno:    'mañana' | 'tarde'
//   motivo:   string | null
//   creado_por: number | null
// }
router.post('/', async (req, res) => {
  const { clase_ids, fecha, turno, motivo, creado_por } = req.body;

  // Validaciones básicas
  if (!fecha || !turno) {
    return res.status(400).json({ error: 'Faltan campos requeridos: fecha, turno' });
  }
  if (!TURNOS_VALIDOS.includes(turno)) {
    return res.status(400).json({ error: `Turno inválido. Valores permitidos: ${TURNOS_VALIDOS.join(', ')}` });
  }

  // Normalizar clase_ids: si viene vacío/undefined/null => modo "Todas" => [null]
  let idsToInsert;
  if (!Array.isArray(clase_ids) || clase_ids.length === 0) {
    idsToInsert = [null];
  } else {
    // Validar que todos los ids sean números
    const parsed = clase_ids.map(id => Number(id));
    if (parsed.some(n => !Number.isInteger(n) || n <= 0)) {
      return res.status(400).json({ error: 'clase_ids debe contener solo IDs numéricos válidos' });
    }
    // Quitar duplicados
    idsToInsert = [...new Set(parsed)];
  }

  const fechaSQL = formatDateForMySQL(fecha);

  try {
    // Si hay clase_ids concretos, verificar que existan
    const idsConcretos = idsToInsert.filter(id => id !== null);
    if (idsConcretos.length > 0) {
      const placeholders = idsConcretos.map(() => '?').join(',');
      const [clasesEncontradas] = await db.query(
        `SELECT id FROM clases WHERE id IN (${placeholders})`,
        idsConcretos
      );
      if (clasesEncontradas.length !== idsConcretos.length) {
        const encontrados = new Set(clasesEncontradas.map(r => r.id));
        const faltantes = idsConcretos.filter(id => !encontrados.has(id));
        return res.status(404).json({
          error: `Clase(s) no encontrada(s): ${faltantes.join(', ')}`
        });
      }
    }

    // Chequeo de conflicto: para cada clase a insertar, verificar que no exista
    // un bloqueo activo solapante (mismo fecha+turno cubriendo esa clase).
    // Caso "Todas" (NULL): conflicta si existe CUALQUIER bloqueo activo de ese fecha+turno.
    // Caso clase concreta: conflicta si existe activo para esa clase O un "Todas" del mismo fecha+turno.
    const conflictos = [];
    for (const idCandidato of idsToInsert) {
      let query;
      let params;
      if (idCandidato === null) {
        // "Todas": cualquier bloqueo activo del mismo fecha+turno conflicta
        query = `SELECT id, clase_id FROM bloqueos_clase
                 WHERE activo = 1 AND fecha = ? AND turno = ? LIMIT 1`;
        params = [fechaSQL, turno];
      } else {
        query = `SELECT id, clase_id FROM bloqueos_clase
                 WHERE activo = 1 AND fecha = ? AND turno = ?
                   AND (clase_id IS NULL OR clase_id = ?) LIMIT 1`;
        params = [fechaSQL, turno, idCandidato];
      }
      const [rows] = await db.query(query, params);
      if (rows.length > 0) {
        conflictos.push({ clase_id: idCandidato, conflicto: rows[0] });
      }
    }

    if (conflictos.length > 0) {
      return res.status(400).json({
        error: 'Ya existe un bloqueo activo para esa fecha y turno',
        conflictos
      });
    }

    // Insertar todas las filas (1 por cada id, o 1 con NULL para "Todas")
    const insertedIds = [];
    let reservasCanceladas = 0;
    for (const idCandidato of idsToInsert) {
      const [result] = await db.query(`
        INSERT INTO bloqueos_clase (clase_id, fecha, turno, motivo, creado_por)
        VALUES (?, ?, ?, ?, ?)
      `, [idCandidato, fechaSQL, turno, motivo || null, creado_por || null]);
      insertedIds.push(result.insertId);

      // Cancelar reservas activas afectadas y notificar por correo (no bloquea).
      try {
        reservasCanceladas += await cancelarReservasPorBloqueo(fechaSQL, turno, idCandidato, motivo || null);
      } catch (e) {
        console.error('Error cancelando reservas por bloqueo:', e.message);
      }
    }

    res.json({
      message: insertedIds.length > 1
        ? `${insertedIds.length} bloqueos creados correctamente`
        : 'Bloqueo creado correctamente',
      ids: insertedIds,
      reservas_canceladas: reservasCanceladas
    });
  } catch (err) {
    console.error('Error creando bloqueo:', err);
    res.status(500).json({ error: 'Error al crear bloqueo' });
  }
});

// =============================================================================
// ELIMINAR BLOQUEO
// =============================================================================

// DELETE /api/bloqueos/:id - eliminar un bloqueo (hard-delete, igual que descansos)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM bloqueos_clase WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Bloqueo no encontrado' });
    }
    res.json({ message: 'Bloqueo eliminado correctamente' });
  } catch (err) {
    console.error('Error eliminando bloqueo:', err);
    res.status(500).json({ error: 'Error al eliminar bloqueo' });
  }
});

export default router;
