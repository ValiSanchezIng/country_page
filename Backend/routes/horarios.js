import express from 'express';
const router = express.Router();
import db from '../server/db.js';

// GET /api/horarios/clase/:nombreClase - Obtener horarios por clase desde horarios_clase
router.get('/clase/:nombreClase', async (req, res) => {
  const { nombreClase } = req.params;
  
  try {
    // Obtener horarios agrupados por día de la semana
    const [rows] = await db.execute(
      `SELECT
        hc.id,
        hc.dia_semana,
        hc.hora_inicio,
        hc.hora_fin,
        hc.capacidad,
        c.nombre as clase_nombre,
        c.id as clase_id,
        c.duracion_min,
        c.cupo_max
       FROM horarios_clase hc
       INNER JOIN clases c ON hc.clase_id = c.id
       WHERE c.nombre = ? AND hc.activo = 1
       ORDER BY 
         FIELD(hc.dia_semana, 'L', 'M', 'X', 'J', 'V', 'S', 'D'),
         hc.hora_inicio ASC`,
      [nombreClase.toLowerCase()]
    );
    
    // El cupo depende SÓLO de los espacios configurados (hc.capacidad), no del
    // número de instructoras disponibles. La asignación de instructora se hace
    // aparte al reservar y ya no recorta el cupo del slot.

    // ===================== FILTRO POR HORARIO DE INSTRUCTORES =====================
    // Solo se muestran los horarios en los que HAY un instructor (que imparte esta
    // clase y está disponible) trabajando en ese día/hora. Ej.: si Tammara da
    // ponyclub de 16:00 a 19:00, los slots de la mañana no aparecen.
    let filteredRows = rows;
    if (rows.length > 0) {
      const claseId = rows[0].clase_id;
      const [bloquesTrabajo] = await db.execute(`
        SELECT ih.dia_semana, ih.hora_inicio, ih.hora_fin
        FROM instructora_horarios ih
        INNER JOIN instructora_clase ic
          ON ic.instructora_id = ih.instructora_id AND ic.clase_id = ? AND ic.activo = 1
        INNER JOIN instructoras i
          ON i.id = ih.instructora_id
        WHERE ih.activo = 1 AND i.disponibilidad = 'disponible'
      `, [claseId]);

      // Solo filtramos si existe configuración de horarios laborales para la clase;
      // si no hay datos (config incompleta), no ocultamos todo (red de seguridad).
      if (bloquesTrabajo.length > 0) {
        const cubierto = (slot) => bloquesTrabajo.some(b =>
          b.dia_semana === slot.dia_semana &&
          String(b.hora_inicio) <= String(slot.hora_inicio) &&
          String(b.hora_fin) >= String(slot.hora_fin)
        );
        filteredRows = rows.filter(cubierto);
      }
    }

    // Mapear día de semana a nombre completo
    const dayMap = {
      'L': 'Lunes',
      'M': 'Martes',
      'X': 'Miércoles',
      'J': 'Jueves',
      'V': 'Viernes',
      'S': 'Sábado',
      'D': 'Domingo'
    };
    
    // Agrupar horarios por día y formatear (solo los slots cubiertos por instructores)
    const horariosPorDia = filteredRows.reduce((acc, row) => {
      const dia = dayMap[row.dia_semana];
      if (!acc[dia]) {
        acc[dia] = [];
      }
      
      // El cupo del slot es el configurado en horarios_clase.capacidad.
      const capacidad = row.capacidad;

      acc[dia].push({
        id: row.id,
        hora_inicio: row.hora_inicio.substring(0, 5), // HH:MM
        hora_fin: row.hora_fin.substring(0, 5),
        capacidad: capacidad,
        duracion_min: row.duracion_min
      });
      return acc;
    }, {});
    
    res.json({
      clase: nombreClase.toLowerCase(),
      duracion: rows[0]?.duracion_min || 60,
      horarios: horariosPorDia
    });
  } catch (err) {
    console.error('Error obteniendo horarios de clase:', err);
    res.status(500).json({ error: "Error obteniendo horarios de clase" });
  }
});

// GET /api/horarios - Obtener horarios dinámicamente desde la base de datos
router.get('/', async (req, res) => {
  const { dia_semana } = req.query;
  try {
    const [rows] = await db.execute(
      "SELECT id, hora, turno, dia_semana FROM horarios WHERE dia_semana = ? ORDER BY hora ASC",
      [dia_semana]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo horarios" });
  }
});

// POST /api/horarios - Crear nuevo horario
router.post('/', async (req, res) => {
  const { hora, turno, dia_semana } = req.body;
  
  if (!hora || !turno || !dia_semana) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  
  try {
    // Validar que no exista el mismo horario para el mismo día
    const [existing] = await db.execute(
      "SELECT id FROM horarios WHERE hora = ? AND dia_semana = ?",
      [hora, dia_semana]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'El horario ya existe para este día' });
    }
    
    const [result] = await db.execute(
      "INSERT INTO horarios (hora, turno, dia_semana, disponible, created_at) VALUES (?, ?, ?, 1, NOW())",
      [hora, turno, dia_semana]
    );
    
    res.status(201).json({
      id: result.insertId,
      hora,
      turno,
      dia_semana,
      disponible: 1,
      message: 'Horario creado exitosamente'
    });
  } catch (err) {
    console.error('Error creando horario:', err);
    res.status(500).json({ error: "Error en el servidor creando horario" });
  }
});

// PUT /api/horarios/:id - Actualizar horario
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { hora, turno, dia_semana, disponible } = req.body;
  
  try {
    // Verificar que el horario existe
    const [existing] = await db.execute("SELECT * FROM horarios WHERE id = ?", [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }
    
    const updates = [];
    const params = [];
    
    if (hora) {
      updates.push("hora = ?");
      params.push(hora);
    }
    if (turno) {
      updates.push("turno = ?");
      params.push(turno);
    }
    if (dia_semana) {
      updates.push("dia_semana = ?");
      params.push(dia_semana);
    }
    if (disponible !== undefined) {
      updates.push("disponible = ?");
      params.push(disponible);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    updates.push("updated_at = NOW()");
    params.push(id);
    
    await db.execute(
      `UPDATE horarios SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
    
    // Obtener el horario actualizado
    const [updated] = await db.execute("SELECT * FROM horarios WHERE id = ?", [id]);
    
    res.json({
      ...updated[0],
      message: 'Horario actualizado exitosamente'
    });
  } catch (err) {
    console.error('Error actualizando horario:', err);
    res.status(500).json({ error: "Error en el servidor actualizando horario" });
  }
});

// DELETE /api/horarios/:id - Eliminar/desactivar horario
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verificar que el horario existe
    const [existing] = await db.execute("SELECT * FROM horarios WHERE id = ?", [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }
    
    // Verificar si hay reservas activas para este horario
    const [reservasActivas] = await db.execute(`
      SELECT COUNT(*) as total 
      FROM reservas r
      JOIN horarios h ON r.horario = TIME_FORMAT(h.hora, '%H:%i')
      WHERE h.id = ? AND r.estado = 'confirmada' AND r.fecha >= CURDATE()
    `, [id]);
    
    if (reservasActivas[0].total > 0) {
      // Si hay reservas activas, solo marcar como no disponible
      await db.execute(
        "UPDATE horarios SET disponible = 0, updated_at = NOW() WHERE id = ?",
        [id]
      );
      
      res.json({
        message: 'Horario desactivado (hay reservas activas)',
        horario_id: id,
        reservas_existentes: reservasActivas[0].total
      });
    } else {
      // Si no hay reservas, eliminar completamente
      await db.execute("DELETE FROM horarios WHERE id = ?", [id]);
      
      res.json({
        message: 'Horario eliminado exitosamente',
        horario_id: id
      });
    }
  } catch (err) {
    console.error('Error eliminando horario:', err);
    res.status(500).json({ error: "Error en el servidor eliminando horario" });
  }
});

// GET /api/horarios/disponibles/:fecha - Obtener horarios disponibles para una fecha específica
router.get('/disponibles/:fecha', async (req, res) => {
  const { fecha } = req.params;
  
  try {
    const fechaObj = new Date(fecha);
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasSemana[fechaObj.getDay()];
    
    // Obtener horarios del día con disponibilidad
    const [horariosDisponibles] = await db.execute(`
      SELECT h.*, 
             COALESCE(ocupados.total, 0) as ocupados,
             (6 - COALESCE(ocupados.total, 0)) as lugares_disponibles
      FROM horarios h
      LEFT JOIN (
        SELECT horario, COUNT(*) as total
        FROM reservas r
        JOIN clases c ON r.clase_id = c.id
        WHERE r.fecha = ? AND r.estado = 'confirmada' AND c.tipo != 'salto'
        GROUP BY horario
      ) ocupados ON TIME_FORMAT(h.hora, '%H:%i') = ocupados.horario
      WHERE h.dia_semana = ? AND h.disponible = 1
      HAVING lugares_disponibles > 0
      ORDER BY h.hora
    `, [fecha, diaSemana]);
    
    res.json(horariosDisponibles);
  } catch (err) {
    console.error('Error obteniendo horarios disponibles:', err);
    res.status(500).json({ error: "Error en el servidor obteniendo horarios disponibles" });
  }
});

// GET /api/horarios/estadisticas - Obtener estadísticas de horarios
router.get('/estadisticas', async (req, res) => {
  try {
    // Estadísticas generales
    const [totalHorarios] = await db.execute(
      "SELECT COUNT(*) as total FROM horarios WHERE disponible = 1"
    );
    
    const [horariosPorTurno] = await db.execute(`
      SELECT turno, COUNT(*) as cantidad 
      FROM horarios 
      WHERE disponible = 1 
      GROUP BY turno
    `);
    
    const [horariosPorDia] = await db.execute(`
      SELECT dia_semana, COUNT(*) as cantidad 
      FROM horarios 
      WHERE disponible = 1 
      GROUP BY dia_semana 
      ORDER BY FIELD(dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')
    `);
    
    res.json({
      total_horarios: totalHorarios[0].total,
      por_turno: horariosPorTurno,
      por_dia: horariosPorDia
    });
  } catch (err) {
    console.error('Error obteniendo estadísticas de horarios:', err);
    res.status(500).json({ error: "Error en el servidor obteniendo estadísticas" });
  }
});

// GET /api/horarios/ocupacion/:fecha - Obtener ocupación de horarios para una fecha
router.get('/ocupacion/:fecha', async (req, res) => {
  const { fecha } = req.params;
  
  try {
    const fechaObj = new Date(fecha);
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasSemana[fechaObj.getDay()];
    
    const [ocupacion] = await db.execute(`
      SELECT 
        h.id,
        h.hora,
        h.turno,
        h.dia_semana,
        COALESCE(reservas.total, 0) as ocupadas,
        6 as capacidad_maxima,
        (6 - COALESCE(reservas.total, 0)) as disponibles,
        ROUND((COALESCE(reservas.total, 0) / 6) * 100, 2) as porcentaje_ocupacion
      FROM horarios h
      LEFT JOIN (
        SELECT horario, COUNT(*) as total
        FROM reservas r
        JOIN clases c ON r.clase_id = c.id
        WHERE r.fecha = ? AND r.estado = 'confirmada' AND c.tipo != 'salto'
        GROUP BY horario
      ) reservas ON TIME_FORMAT(h.hora, '%H:%i') = reservas.horario
      WHERE h.dia_semana = ? AND h.disponible = 1
      ORDER BY h.hora
    `, [fecha, diaSemana]);
    
    res.json({
      fecha,
      dia_semana: diaSemana,
      horarios: ocupacion
    });
  } catch (err) {
    console.error('Error obteniendo ocupación de horarios:', err);
    res.status(500).json({ error: "Error en el servidor obteniendo ocupación" });
  }
});
router.get('/ocupacion/:fecha', async (req, res) => {
  const { fecha } = req.params;    try {    const fechaObj = new Date(fecha);    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];    const diaSemana = diasSemana[fechaObj.getDay()];        const [ocupacion] = await db.execute(`      SELECT         h.id,        h.hora,        h.turno,        h.dia_semana,        COALESCE(reservas.total, 0) as ocupadas,        6 as capacidad_maxima,        (6 - COALESCE(reservas.total, 0)) as disponibles,        ROUND((COALESCE(reservas.total, 0) / 6) * 100, 2) as porcentaje_ocupacion      FROM horarios h      LEFT JOIN (        SELECT horario, COUNT(*) as total        FROM reservas r        JOIN clases c ON r.clase_id = c.id        WHERE r.fecha = ? AND r.estado = 'confirmada' AND c.tipo != 'salto'        GROUP BY horario      ) reservas ON TIME_FORMAT(h.hora, '%H:%i') = reservas.horario      WHERE h.dia_semana = ? AND h.disponible = 1      ORDER BY h.hora    `, [fecha, diaSemana]);        res.json({      fecha,      dia_semana: diaSemana,      horarios: ocupacion    });  } catch (err) {    console.error('Error obteniendo ocupación de horarios:', err);    res.status(500).json({ error: "Error en el servidor obteniendo ocupación" });  }});

// =============================================================================
// FRANJAS HORARIAS (activar / desactivar de forma permanente y recurrente)
// =============================================================================

// GET /api/horarios/slots - Listar franjas horarias agrupadas por hora de inicio
// Devuelve, por cada hora de inicio, cuántas filas de horarios_clase existen
// y cuántas están activas (en todas las clases/días). Sirve para mostrar el
// estado de cada franja en el panel admin y poder activarla/desactivarla.
router.get('/slots', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        TIME_FORMAT(hc.hora_inicio, '%H:%i') AS hora_inicio,
        COUNT(*) AS total,
        SUM(CASE WHEN hc.activo = 1 THEN 1 ELSE 0 END) AS activos,
        GROUP_CONCAT(DISTINCT c.nombre ORDER BY c.nombre SEPARATOR ', ') AS clases
      FROM horarios_clase hc
      INNER JOIN clases c ON hc.clase_id = c.id
      GROUP BY TIME_FORMAT(hc.hora_inicio, '%H:%i')
      ORDER BY MIN(hc.hora_inicio) ASC
    `);

    // Normalizar a números (mysql2 puede devolver SUM/COUNT como string)
    const franjas = rows.map(r => {
      const total = Number(r.total);
      const activos = Number(r.activos);
      return {
        hora_inicio: r.hora_inicio,
        total,
        activos,
        inactivos: total - activos,
        // 'activa' si al menos una fila sigue activa; 'inactiva' si todas están en 0
        estado: activos > 0 ? 'activa' : 'inactiva',
        clases: r.clases
      };
    });

    res.json(franjas);
  } catch (err) {
    console.error('Error obteniendo franjas horarias:', err);
    res.status(500).json({ error: 'Error obteniendo franjas horarias' });
  }
});

// PUT /api/horarios/slots/activo - Activar/desactivar TODAS las clases de una franja
// Body: { hora_inicio: 'HH:MM', activo: 0 | 1 }
// Afecta todas las filas de horarios_clase con esa hora de inicio (todas las
// clases y todos los días). Es reversible y NO toca reservas ya existentes:
// solo controla la visibilidad/disponibilidad para nuevas reservas.
router.put('/slots/activo', async (req, res) => {
  const { hora_inicio, activo } = req.body;

  if (!hora_inicio || !/^\d{2}:\d{2}$/.test(hora_inicio)) {
    return res.status(400).json({ error: 'hora_inicio inválida (formato esperado HH:MM)' });
  }
  if (activo !== 0 && activo !== 1 && activo !== '0' && activo !== '1') {
    return res.status(400).json({ error: 'activo debe ser 0 o 1' });
  }

  const activoVal = Number(activo) === 1 ? 1 : 0;

  try {
    const [result] = await db.execute(
      `UPDATE horarios_clase
         SET activo = ?
       WHERE TIME_FORMAT(hora_inicio, '%H:%i') = ?`,
      [activoVal, hora_inicio]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `No existen clases en la franja ${hora_inicio}` });
    }

    res.json({
      message: activoVal === 1
        ? `Franja ${hora_inicio} habilitada (${result.affectedRows} clase(s))`
        : `Franja ${hora_inicio} deshabilitada (${result.affectedRows} clase(s))`,
      hora_inicio,
      activo: activoVal,
      afectadas: result.affectedRows
    });
  } catch (err) {
    console.error('Error actualizando franja horaria:', err);
    res.status(500).json({ error: 'Error actualizando franja horaria' });
  }
});

// GET /api/horarios/clases - Obtener todas las clases disponibles
router.get('/clases', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, nombre, duracion_min, cupo_max FROM clases ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo clases:', err);
    res.status(500).json({ error: "Error obteniendo clases" });
  }
});

// PATCH /api/horarios/clases/:id/capacidad - Cambiar el cupo BASE de una clase.
// Actualiza clases.cupo_max y todos sus horarios_clase.capacidad de una vez.
// Body: { capacidad: number }  ó  { delta: number } (ajuste relativo)
router.patch('/clases/:id/capacidad', async (req, res) => {
  const { id } = req.params;
  let { capacidad, delta } = req.body;

  try {
    const [claseRows] = await db.query('SELECT cupo_max FROM clases WHERE id = ?', [id]);
    if (claseRows.length === 0) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    // Calcular el nuevo cupo (absoluto o por delta), nunca menor que 0.
    let nuevoCupo;
    if (capacidad !== undefined && capacidad !== null && capacidad !== '') {
      nuevoCupo = Number(capacidad);
    } else if (delta !== undefined && delta !== null && delta !== '') {
      nuevoCupo = Number(claseRows[0].cupo_max || 0) + Number(delta);
    } else {
      return res.status(400).json({ error: 'Indica capacidad o delta' });
    }
    if (Number.isNaN(nuevoCupo)) {
      return res.status(400).json({ error: 'Valor de capacidad inválido' });
    }
    nuevoCupo = Math.max(0, Math.round(nuevoCupo));

    await db.query('UPDATE clases SET cupo_max = ? WHERE id = ?', [nuevoCupo, id]);
    await db.query('UPDATE horarios_clase SET capacidad = ? WHERE clase_id = ?', [nuevoCupo, id]);

    res.json({ message: 'Cupo actualizado', clase_id: Number(id), capacidad: nuevoCupo });
  } catch (err) {
    console.error('Error actualizando cupo de clase:', err);
    res.status(500).json({ error: 'Error al actualizar el cupo de la clase' });
  }
});

// GET /api/horarios/personalizados - Obtener todos los horarios personalizados (Admin)
router.get('/personalizados-all', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        hp.id,
        hp.cliente_id,
        hp.instructora_id,
        hp.clase_id,
        hp.tipo,
        hp.fecha,
        hp.dia_semana,
        TIME_FORMAT(hp.hora_inicio, '%H:%i') as hora_inicio,
        TIME_FORMAT(hp.hora_fin, '%H:%i') as hora_fin,
        hp.activo,
        c.nombre as clase_nombre,
        i.nombre as instructora_nombre,
        i.apellido as instructora_apellido,
        i.disponibilidad as instructora_disponibilidad,
        u.nombre as cliente_nombre,
        u.apellido as cliente_apellido
      FROM horarios_personalizados hp
      INNER JOIN clases c ON hp.clase_id = c.id
      INNER JOIN instructoras i ON hp.instructora_id = i.id
      INNER JOIN usuarios u ON hp.cliente_id = u.id
      ORDER BY hp.creado_en DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo todos los horarios personalizados:', err);
    res.status(500).json({ error: "Error obteniendo horarios personalizados" });
  }
});

// POST /api/horarios/personalizados - Crear nuevo horario personalizado
router.post('/personalizados', async (req, res) => {
  const { cliente_id, instructora_id, clase_id, tipo, fecha, dia_semana, hora_inicio, hora_fin } = req.body;
  
  try {
    const [result] = await db.execute(
      `INSERT INTO horarios_personalizados 
       (cliente_id, instructora_id, clase_id, tipo, fecha, dia_semana, hora_inicio, hora_fin) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [cliente_id, instructora_id, clase_id, tipo, fecha || null, dia_semana || null, hora_inicio, hora_fin]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Error creando horario personalizado:', err);
    res.status(500).json({ error: "Error creando horario personalizado" });
  }
});

// PUT /api/horarios/personalizados/:id - Actualizar horario personalizado
router.put('/personalizados/:id', async (req, res) => {
  const { id } = req.params;
  const { cliente_id, instructora_id, clase_id, tipo, fecha, dia_semana, hora_inicio, hora_fin } = req.body;
  
  try {
    await db.execute(
      `UPDATE horarios_personalizados 
       SET cliente_id = ?, instructora_id = ?, clase_id = ?, tipo = ?, fecha = ?, dia_semana = ?, hora_inicio = ?, hora_fin = ?
       WHERE id = ?`,
      [cliente_id, instructora_id, clase_id, tipo, fecha || null, dia_semana || null, hora_inicio, hora_fin, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error actualizando horario personalizado:', err);
    res.status(500).json({ error: "Error actualizando horario personalizado" });
  }
});

// DELETE /api/horarios/personalizados/:id - Eliminar horario personalizado
router.delete('/personalizados/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM horarios_personalizados WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error eliminando horario personalizado:', err);
    res.status(500).json({ error: "Error eliminando horario personalizado" });
  }
});

// GET /api/horarios/personalizados/:userId - Obtener horarios personalizados de un cliente
router.get('/personalizados/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.execute(`
      SELECT 
        hp.id,
        hp.cliente_id,
        hp.instructora_id,
        hp.clase_id,
        hp.tipo,
        hp.fecha,
        hp.dia_semana,
        TIME_FORMAT(hp.hora_inicio, '%H:%i') as hora_inicio,
        TIME_FORMAT(hp.hora_fin, '%H:%i') as hora_fin,
        c.nombre as clase_nombre,
        c.duracion_min,
        i.nombre as instructora_nombre,
        i.apellido as instructora_apellido,
        i.disponibilidad as instructora_disponibilidad
      FROM horarios_personalizados hp
      INNER JOIN clases c ON hp.clase_id = c.id
      INNER JOIN instructoras i ON hp.instructora_id = i.id
      WHERE hp.cliente_id = ? AND hp.activo = 1
    `, [userId]);
    
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo horarios personalizados:', err);
    res.status(500).json({ error: "Error obteniendo horarios personalizados" });
  }
});

// =============================================================================
// AJUSTES DE ESPACIOS (capacidad_overrides) — fijo / semanal / por día
// =============================================================================

// GET /api/horarios/overrides - listar ajustes activos con nombre de clase
router.get('/overrides', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT co.*, c.nombre AS clase_nombre
      FROM capacidad_overrides co
      LEFT JOIN clases c ON c.id = co.clase_id
      WHERE co.activo = 1
      ORDER BY co.creado_en DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo overrides de capacidad:', err);
    res.status(500).json({ error: 'Error obteniendo ajustes de espacios' });
  }
});

// POST /api/horarios/overrides - crear un ajuste de espacios
// Body: { clase_id, tipo: 'fijo'|'semanal'|'dia', dia_semana?, fecha?, hora_inicio?,
//         delta?, capacidad_abs?, creado_por? }
router.post('/overrides', async (req, res) => {
  const { clase_id, tipo, dia_semana, fecha, hora_inicio, delta, capacidad_abs, creado_por } = req.body;

  if (!clase_id || !tipo) {
    return res.status(400).json({ error: 'Faltan campos requeridos: clase_id, tipo' });
  }
  if (!['fijo', 'semanal', 'dia'].includes(tipo)) {
    return res.status(400).json({ error: "tipo inválido (fijo | semanal | dia)" });
  }
  if (tipo === 'semanal' && !dia_semana) {
    return res.status(400).json({ error: 'tipo semanal requiere dia_semana' });
  }
  if (tipo === 'dia' && !fecha) {
    return res.status(400).json({ error: 'tipo dia requiere fecha' });
  }
  if ((delta === undefined || delta === null || delta === '') && (capacidad_abs === undefined || capacidad_abs === null || capacidad_abs === '')) {
    return res.status(400).json({ error: 'Indica un delta (ej. +1 / -1) o un cupo absoluto' });
  }

  try {
    const [result] = await db.query(`
      INSERT INTO capacidad_overrides
        (clase_id, tipo, dia_semana, fecha, hora_inicio, delta, capacidad_abs, creado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      clase_id, tipo,
      tipo === 'semanal' ? dia_semana : null,
      tipo === 'dia' ? fecha : null,
      hora_inicio || null,
      delta === '' || delta === undefined || delta === null ? 0 : Number(delta),
      capacidad_abs === '' || capacidad_abs === undefined || capacidad_abs === null ? null : Number(capacidad_abs),
      creado_por || null
    ]);
    res.json({ message: 'Ajuste de espacios creado', id: result.insertId });
  } catch (err) {
    console.error('Error creando override de capacidad:', err);
    res.status(500).json({ error: 'Error al crear el ajuste de espacios' });
  }
});

// DELETE /api/horarios/overrides/:id - desactivar (soft-delete) un ajuste
router.delete('/overrides/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE capacidad_overrides SET activo = 0 WHERE id = ?`, [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ajuste no encontrado' });
    }
    res.json({ message: 'Ajuste eliminado' });
  } catch (err) {
    console.error('Error eliminando override de capacidad:', err);
    res.status(500).json({ error: 'Error al eliminar el ajuste de espacios' });
  }
});

export default router;