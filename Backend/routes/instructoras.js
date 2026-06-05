import express from 'express';
import db from '../server/db.js';

const router = express.Router();

// Obtener todas las instructoras
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        i.id,
        i.usuario_id,
        i.nombre,
        i.apellido,
        i.num_contacto,
        i.especialidad,
        i.disponibilidad,
        i.tipo_instructor,
        i.fecha_registro,
        u.correo,
        u.estatus
      FROM instructoras i
      LEFT JOIN usuarios u ON i.usuario_id = u.id
      ORDER BY i.nombre, i.apellido
    `);
    
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener instructoras:', err);
    res.status(500).json({ error: 'Error al obtener instructoras' });
  }
});

// Obtener mapeo de instructoras y clases
router.get('/clases-asignadas', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ic.id,
        ic.instructora_id,
        ic.clase_id,
        ic.activo,
        c.nombre as clase_nombre
      FROM instructora_clase ic
      JOIN clases c ON ic.clase_id = c.id
      WHERE ic.activo = 1
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener mapeo de instructoras/clases:', err);
    res.status(500).json({ error: 'Error al obtener mapeo de instructoras/clases' });
  }
});

// Obtener una instructora por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await db.query(`
      SELECT 
        i.id,
        i.usuario_id,
        i.nombre,
        i.apellido,
        i.num_contacto,
        i.especialidad,
        i.disponibilidad,
        i.tipo_instructor,
        i.fecha_registro,
        u.correo,
        u.estatus
      FROM instructoras i
      LEFT JOIN usuarios u ON i.usuario_id = u.id
      WHERE i.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Instructora no encontrada' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al obtener instructora:', err);
    res.status(500).json({ error: 'Error al obtener instructora' });
  }
});

// Obtener mapeo de instructoras y clases
router.get('/clases-asignadas', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ic.id,
        ic.instructora_id,
        ic.clase_id,
        ic.activo,
        c.nombre as clase_nombre
      FROM instructora_clase ic
      JOIN clases c ON ic.clase_id = c.id
      WHERE ic.activo = 1
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener mapeo de instructoras/clases:', err);
    res.status(500).json({ error: 'Error al obtener mapeo de instructoras/clases' });
  }
});

// Obtener clases/reservas de una instructora usando usuario_id
router.get('/clases/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;
  
  console.log(`🔍 Buscando instructora con usuario_id: ${usuario_id}`);
  
  try {
    // Primero obtener la información de la instructora
    const [instructoraRows] = await db.query(`
      SELECT
        i.id as instructora_id,
        i.nombre,
        i.apellido,
        i.tipo_instructor
      FROM instructoras i
      WHERE i.usuario_id = ?
    `, [usuario_id]);
    
    console.log(`👤 Resultados de instructora:`, instructoraRows);
    
    if (instructoraRows.length === 0) {
      console.log(`❌ No se encontró instructora con usuario_id: ${usuario_id}`);
      return res.status(404).json({ error: 'Instructora no encontrada para este usuario' });
    }
    
    const instructora = instructoraRows[0];
    const esInstructorAdmin = instructora.tipo_instructor === 'admin';

    console.log(`📋 Buscando clases para instructora ID: ${instructora.instructora_id} (${instructora.nombre} ${instructora.apellido}) — tipo: ${instructora.tipo_instructor}`);

    // Actualizar clases pasadas de pendiente/confirmada a completada automáticamente (+30 min)
    // El instructor admin las actualiza para todas; el general sólo las suyas.
    if (esInstructorAdmin) {
      await db.query(`
        UPDATE reservas
        SET estatus = 'completada'
        WHERE estatus IN ('pendiente', 'confirmada')
        AND TIMESTAMP(fecha, hora_fin) < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      `);
    } else {
      await db.query(`
        UPDATE reservas
        SET estatus = 'completada'
        WHERE instructora_id = ?
        AND estatus IN ('pendiente', 'confirmada')
        AND TIMESTAMP(fecha, hora_fin) < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      `, [instructora.instructora_id]);
    }

    // El instructor admin ve TODAS las reservas; el general sólo las suyas.
    const filtroInstructora = esInstructorAdmin ? '' : 'WHERE r.instructora_id = ?';
    const paramsClases = esInstructorAdmin ? [] : [instructora.instructora_id];

    const [clasesRows] = await db.query(`
      SELECT
        r.id,
        r.cliente_id as cliente_id,
        r.fecha,
        r.hora_inicio as horario,
        u.nombre as student_nombre,
        u.apellido as student_apellido,
        u.edad as studentAge,
        u.tipo_nivel as student_nivel,
        c.nombre as type,
        cab.nombre as horse,
        r.caballo_id,
        cab.estatus as caballo_estatus,
        CONCAT(ru.nombre, ' ', ru.apellido) as caballo_renta_cliente,
        r.estatus as status,
        r.motivo_cancelacion,
        r.actividad,
        r.observaciones,
        r.instructora_id,
        CONCAT(inst.nombre, ' ', inst.apellido) as instructora_nombre,
        'pendiente' as attendance
      FROM reservas r
      LEFT JOIN clases c ON r.clase_id = c.id
      LEFT JOIN caballos cab ON r.caballo_id = cab.id
      LEFT JOIN usuarios ru ON cab.renta_cliente_id = ru.id
      LEFT JOIN usuarios u ON r.cliente_id = u.id
      LEFT JOIN instructoras inst ON r.instructora_id = inst.id
      ${filtroInstructora}
      ORDER BY r.fecha DESC, r.hora_inicio ASC
    `, paramsClases);

    console.log(`🎯 Encontradas ${clasesRows.length} reservas para la instructora`);
    console.log('📊 Primeras 2 reservas:', clasesRows.slice(0, 2));

    // Formatear los datos para que coincidan con el frontend
    const clasesFormateadas = clasesRows.map(clase => {
      // Formatear la fecha para que sea compatible
      const fecha = clase.fecha ? new Date(clase.fecha).toISOString().split('T')[0] : null;
      // Formatear la hora para mostrar solo HH:MM
      const hora = clase.horario ? clase.horario.slice(0, 5) : '00:00';
      return {
        id: clase.id,
        cliente_id: clase.cliente_id,
        type: clase.type || 'Sin tipo',
        date: fecha,
        time: hora,
        horse: clase.horse || 'Sin asignar',
        student: clase.student_nombre && clase.student_apellido ? 
          `${clase.student_nombre} ${clase.student_apellido}` : 'Sin nombre',
        studentAge: clase.studentAge || 0,
        studentLevel: clase.student_nivel || 'Intermedio', // Nivel del estudiante
        status: clase.status || 'pendiente',
        motivo_cancelacion: clase.motivo_cancelacion || '',
        attendance: clase.attendance || 'pendiente',
        actividad: clase.actividad || '',
        observaciones: clase.observaciones || '',
        caballo_id: clase.caballo_id || null,
        caballo_estatus: clase.caballo_estatus || null,
        caballo_renta_cliente: clase.caballo_renta_cliente || null,
        instructora_id: clase.instructora_id,
        instructora_nombre: clase.instructora_nombre || '',
        level: clase.student_nivel || 'Intermedio' // Mantenemos level para compatibilidad
      };
    });

    res.json({
      instructora: {
        id: instructora.instructora_id,
        nombre: instructora.nombre,
        apellido: instructora.apellido,
        tipo_instructor: instructora.tipo_instructor || 'general'
      },
      clases: clasesFormateadas
    });
    
  } catch (err) {
    console.error('Error al obtener clases de instructora:', err);
    res.status(500).json({ error: 'Error al obtener clases de instructora' });
  }
});

// Obtener ID de instructora por usuario_id
router.get('/by-user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    console.log(`🔍 Buscando instructora_id para usuario_id: ${userId}`);
    
    const [rows] = await db.query(`
      SELECT id as instructora_id, nombre, apellido, tipo_instructor
      FROM instructoras
      WHERE usuario_id = ?
    `, [userId]);
    
    if (rows.length === 0) {
      console.log(`❌ No se encontró instructora para usuario_id: ${userId}`);
      return res.status(404).json({ error: 'Instructora no encontrada para este usuario' });
    }
    
    console.log(`✅ Encontrada instructora:`, rows[0]);
    res.json(rows[0]);
    
  } catch (err) {
    console.error('Error al obtener instructora por usuario:', err);
    res.status(500).json({ error: 'Error al obtener instructora por usuario' });
  }
});

// ENDPOINT TEMPORAL PARA DEBUGGING - Mostrar todas las instructoras y sus reservas
router.get('/debug/all', async (req, res) => {
  try {
    console.log('🔧 DEBUG: Obteniendo todas las instructoras...');
    
    // Mostrar todas las instructoras
    const [instructoras] = await db.query(`
      SELECT 
        i.id as instructora_id,
        i.usuario_id,
        i.nombre,
        i.apellido,
        u.username
      FROM instructoras i
      LEFT JOIN usuarios u ON i.usuario_id = u.id
    `);
    
    console.log('👩‍🏫 Instructoras en la base de datos:', instructoras);
    
    // Mostrar todas las reservas
    const [reservas] = await db.query(`
      SELECT 
        r.id,
        r.instructora_id,
        r.cliente_id,
        r.fecha,
        r.hora_inicio,
        r.estatus,
        u.nombre as cliente_nombre
      FROM reservas r
      LEFT JOIN usuarios u ON r.cliente_id = u.id
      LIMIT 10
    `);
    
    console.log('📅 Primeras 10 reservas en la base de datos:', reservas);
    
    res.json({
      instructoras,
      reservas,
      mensaje: 'Datos de debug - revisar consola del servidor'
    });
    
  } catch (err) {
    console.error('Error en debug:', err);
    res.status(500).json({ error: err.message });
  }
});

// Actualizar asistencia de una reserva
router.put('/reservas/:id/asistencia', async (req, res) => {
  const { id } = req.params;
  const { asistencia } = req.body;
  
  console.log(`🎯 Actualizando asistencia de reserva ${id} a: ${asistencia}`);

  if (!["presente", "ausente", "justificado", "pendiente"].includes(asistencia)) {
    return res.status(400).json({ 
      error: "Valor de asistencia no válido. Opciones: presente, ausente, justificado, pendiente" 
    });
  }

  try {
    // Primero verificar que la reserva existe
    const [reservaCheck] = await db.query("SELECT * FROM reservas WHERE id = ?", [id]);
    if (reservaCheck.length === 0) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    const reserva = reservaCheck[0];

    // Verificar si ya existe un registro de asistencia para esta reserva
    const [existingAsistencia] = await db.query(
      "SELECT * FROM asistencias WHERE reserva_id = ?", 
      [id]
    );

    if (existingAsistencia.length > 0) {
      // Actualizar registro existente
      await db.query(
        "UPDATE asistencias SET asistio = ?, registrado_en = NOW() WHERE reserva_id = ?",
        [asistencia, id]
      );
      console.log(`✅ Asistencia actualizada para reserva ${id}`);
    } else {
      // Crear nuevo registro de asistencia
      await db.query(
        "INSERT INTO asistencias (reserva_id, instructora_id, asistio, registrado_en) VALUES (?, ?, ?, NOW())",
        [id, reserva.instructora_id, asistencia]
      );
      console.log(`✅ Nueva asistencia creada para reserva ${id}`);
    }

    // Si la asistencia se marcó como presente o ausente, cambiar el status a completada
    if (asistencia === 'presente' || asistencia === 'ausente') {
      await db.query(
        "UPDATE reservas SET estatus = 'completada' WHERE id = ?",
        [id]
      );
    }

    res.json({ 
      message: "Asistencia actualizada correctamente", 
      asistencia: asistencia,
      reserva_id: id 
    });
    
  } catch (err) {
    console.error("Error al actualizar asistencia:", err);
    res.status(500).json({ error: err.message });
  }
});

// Crear nueva instructora
// Este endpoint crea tanto el usuario como el registro en instructoras
router.post('/', async (req, res) => {
  const {
    nombre,
    apellido,
    correo,
    telefono,
    disponibilidad,
    customPassword,
    especialidad,
    tipo_instructor
  } = req.body;
  const tipoInstructor = tipo_instructor === 'admin' ? 'admin' : 'general';
  
  // Validar campos requeridos
  if (!nombre || !apellido) {
    return res.status(400).json({ 
      error: 'Faltan datos requeridos: nombre y apellido son obligatorios' 
    });
  }
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. Generar username dinámico
    let baseUsername = `${nombre.toLowerCase()}.${apellido.toLowerCase()}`.replace(/\s+/g, '').slice(0, 20);
    let username = baseUsername;
    let counter = 1;
    
    while (true) {
      const [existingUser] = await connection.query(
        'SELECT id FROM usuarios WHERE username = ?', 
        [username]
      );
      if (existingUser.length === 0) break;
      username = `${baseUsername}${counter}`.slice(0, 20);
      counter++;
    }
    
    // 2. Generar contraseña
    const password = customPassword || Math.random().toString(36).slice(-8);
    
    // 3. Crear usuario con rol 'instructora'
    const [userResult] = await connection.query(
      `INSERT INTO usuarios (nombre, apellido, correo, telefono, username, contrasena, rol, estatus, fecha_registro) 
       VALUES (?, ?, ?, ?, ?, ?, 'instructora', 'activo', NOW())`,
      [nombre, apellido, correo, telefono, username, password]
    );
    
    const usuarioId = userResult.insertId;
    
    // 4. Crear registro en tabla instructoras
    const [instructorResult] = await connection.query(
      `INSERT INTO instructoras (usuario_id, nombre, apellido, num_contacto, especialidad, disponibilidad, tipo_instructor, fecha_registro)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [usuarioId, nombre, apellido, telefono, especialidad || '', disponibilidad || 'disponible', tipoInstructor]
    );
    
    const instructoraId = instructorResult.insertId;
    
    // 5. Sincronizar tabla instructora_clase si hay especialidades
    if (especialidad && especialidad.trim() !== '') {
      const especialidades = especialidad.split(',').map(e => e.trim());
      const claseMapping = {
        'iniciacion': 1,
        'intermedio': 2,
        'paseo': 3,
        'avanzado': 4,
        'ponyclub': 5
      };
      
      for (const esp of especialidades) {
        const claseId = claseMapping[esp.toLowerCase()];
        if (claseId) {
          await connection.query(
            `INSERT INTO instructora_clase (instructora_id, clase_id, activo) 
             VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE activo = 1`,
            [instructoraId, claseId]
          );
        }
      }
    }
    
    await connection.commit();
    
    res.json({
      message: 'Instructora creada correctamente',
      instructora: {
        id: instructoraId,
        usuario_id: usuarioId,
        nombre,
        apellido,
        num_contacto: telefono,
        correo,
        especialidad: especialidad || '',
        disponibilidad: disponibilidad || 'disponible',
        username,
        password
      }
    });
    
  } catch (err) {
    await connection.rollback();
    console.error('Error al crear instructora:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }
    
    res.status(500).json({ error: 'Error al crear instructora' });
  } finally {
    connection.release();
  }
});

// Actualizar instructora completa
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, num_contacto, correo, especialidad, disponibilidad, tipo_instructor } = req.body;
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Obtener usuario_id
    const [instructorRows] = await connection.query(
      'SELECT usuario_id FROM instructoras WHERE id = ?',
      [id]
    );
    
    if (instructorRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Instructora no encontrada' });
    }
    
    const usuarioId = instructorRows[0].usuario_id;
    
    // Actualizar tabla instructoras
    const updateFieldsInstructor = [];
    const updateValuesInstructor = [];
    
    if (nombre !== undefined) {
      updateFieldsInstructor.push('nombre = ?');
      updateValuesInstructor.push(nombre);
    }
    
    if (apellido !== undefined) {
      updateFieldsInstructor.push('apellido = ?');
      updateValuesInstructor.push(apellido);
    }
    
    if (num_contacto !== undefined) {
      updateFieldsInstructor.push('num_contacto = ?');
      updateValuesInstructor.push(num_contacto);
    }
    
    if (especialidad !== undefined) {
      updateFieldsInstructor.push('especialidad = ?');
      updateValuesInstructor.push(especialidad);
    }
    
    if (disponibilidad !== undefined) {
      updateFieldsInstructor.push('disponibilidad = ?');
      updateValuesInstructor.push(disponibilidad);
    }

    if (tipo_instructor !== undefined) {
      updateFieldsInstructor.push('tipo_instructor = ?');
      updateValuesInstructor.push(tipo_instructor === 'admin' ? 'admin' : 'general');
    }

    if (updateFieldsInstructor.length > 0) {
      updateValuesInstructor.push(id);
      await connection.query(
        `UPDATE instructoras SET ${updateFieldsInstructor.join(', ')} WHERE id = ?`,
        updateValuesInstructor
      );
    }
    
    // Actualizar tabla usuarios
    const updateFieldsUsuario = [];
    const updateValuesUsuario = [];
    
    if (nombre !== undefined) {
      updateFieldsUsuario.push('nombre = ?');
      updateValuesUsuario.push(nombre);
    }
    
    if (apellido !== undefined) {
      updateFieldsUsuario.push('apellido = ?');
      updateValuesUsuario.push(apellido);
    }
    
    if (correo !== undefined) {
      updateFieldsUsuario.push('correo = ?');
      updateValuesUsuario.push(correo);
    }
    
    if (num_contacto !== undefined) {
      updateFieldsUsuario.push('telefono = ?');
      updateValuesUsuario.push(num_contacto);
    }
    
    if (updateFieldsUsuario.length > 0) {
      updateValuesUsuario.push(usuarioId);
      await connection.query(
        `UPDATE usuarios SET ${updateFieldsUsuario.join(', ')} WHERE id = ?`,
        updateValuesUsuario
      );
    }
    
    // Sincronizar tabla instructora_clase si se actualizó especialidad
    if (especialidad !== undefined) {
      const claseMapping = {
        'iniciacion': 1,
        'intermedio': 2,
        'paseo': 3,
        'avanzado': 4,
        'ponyclub': 5
      };
      
      // 1. Desactivar todas las clases actuales
      await connection.query(
        'UPDATE instructora_clase SET activo = 0 WHERE instructora_id = ?',
        [id]
      );
      
      // 2. Activar/insertar las clases seleccionadas
      if (especialidad && especialidad.trim() !== '') {
        const especialidades = especialidad.split(',').map(e => e.trim());
        
        for (const esp of especialidades) {
          const claseId = claseMapping[esp.toLowerCase()];
          if (claseId) {
            await connection.query(
              `INSERT INTO instructora_clase (instructora_id, clase_id, activo) 
               VALUES (?, ?, 1)
               ON DUPLICATE KEY UPDATE activo = 1`,
              [id, claseId]
            );
          }
        }
      }
    }
    
    await connection.commit();
    
    res.json({ 
      message: 'Instructora actualizada correctamente',
      id: parseInt(id)
    });
    
  } catch (err) {
    await connection.rollback();
    console.error('Error al actualizar instructora:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El correo ya está en uso' });
    }
    
    res.status(500).json({ error: 'Error al actualizar instructora' });
  } finally {
    connection.release();
  }
});

// Actualizar solo disponibilidad
router.patch('/:id/disponibilidad', async (req, res) => {
  const { id } = req.params;
  const { disponibilidad } = req.body;
  
  if (!disponibilidad) {
    return res.status(400).json({ error: 'El campo disponibilidad es requerido' });
  }
  
  const disponibilidadesValidas = ['disponible', 'no_disponible'];
  if (!disponibilidadesValidas.includes(disponibilidad.toLowerCase())) {
    return res.status(400).json({ 
      error: `Disponibilidad no válida. Valores permitidos: ${disponibilidadesValidas.join(', ')}` 
    });
  }
  
  try {
    const [result] = await db.query(
      'UPDATE instructoras SET disponibilidad = ? WHERE id = ?',
      [disponibilidad.toLowerCase(), id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Instructora no encontrada' });
    }
    
    res.json({ 
      message: 'Disponibilidad actualizada correctamente',
      disponibilidad: disponibilidad.toLowerCase()
    });
  } catch (err) {
    console.error('Error al actualizar disponibilidad:', err);
    res.status(500).json({ error: 'Error al actualizar disponibilidad' });
  }
});

// Eliminar instructora (soft delete - cambiar estatus a inactivo)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Verificar si tiene reservas pendientes (aún sin ocurrir)
    const [activeReservations] = await connection.query(
      `SELECT COUNT(*) as count 
       FROM reservas 
       WHERE instructora_id = ? AND estatus = 'pendiente'`,
      [id]
    );
    
    if (activeReservations[0].count > 0) {
      await connection.rollback();
      return res.status(409).json({ 
        tieneReservasActivas: true,
        count: activeReservations[0].count
      });
    }
    
    // Obtener usuario_id
    const [instructorRows] = await connection.query(
      'SELECT usuario_id FROM instructoras WHERE id = ?',
      [id]
    );
    
    if (instructorRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Instructora no encontrada' });
    }
    
    const usuarioId = instructorRows[0].usuario_id;
    
    // Cambiar disponibilidad a no_disponible
    await connection.query(
      'UPDATE instructoras SET disponibilidad = ? WHERE id = ?',
      ['no_disponible', id]
    );
    
    // Cambiar estatus del usuario a inactivo
    await connection.query(
      'UPDATE usuarios SET estatus = ? WHERE id = ?',
      ['inactivo', usuarioId]
    );
    
    await connection.commit();
    
    res.json({ 
      message: 'Instructora marcada como inactiva correctamente',
      id: parseInt(id)
    });
    
  } catch (err) {
    await connection.rollback();
    console.error('Error al eliminar instructora:', err);
    res.status(500).json({ error: 'Error al eliminar instructora' });
  } finally {
    connection.release();
  }
});

// Obtener reservas pendientes de una instructora con candidatos para reasignar
router.get('/:id/reservas-activas', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Obtener reservas pendientes de la instructora
    const [reservas] = await db.query(`
      SELECT
        r.id,
        r.fecha,
        r.hora_inicio,
        r.hora_fin,
        r.clase_id,
        cl.nombre AS clase_nombre,
        u.nombre  AS cliente_nombre,
        u.apellido AS cliente_apellido
      FROM reservas r
      JOIN clases cl  ON cl.id = r.clase_id
      JOIN usuarios u ON u.id = r.cliente_id
      WHERE r.instructora_id = ? AND r.estatus = 'pendiente'
      ORDER BY r.fecha, r.hora_inicio
    `, [id]);

    if (reservas.length === 0) {
      return res.json([]);
    }

    // 2. Para cada reserva, obtener candidatos válidos con filtros completos de disponibilidad
    const reservasConCandidatos = await Promise.all(reservas.map(async (reserva) => {
      const [candidatos] = await db.query(`
        SELECT
          i.id,
          u.nombre,
          u.apellido
        FROM instructoras i
        JOIN usuarios u        ON u.id  = i.usuario_id
        -- Puede impartir esta clase específica
        JOIN instructora_clase ic ON ic.instructora_id = i.id
                                  AND ic.clase_id = ?
                                  AND ic.activo = 1
        WHERE i.disponibilidad = 'disponible'
          AND i.id <> ?

          -- Respetar horario semanal: si tiene horarios configurados, debe cubrir este día/hora
          AND (
            NOT EXISTS (
              SELECT 1 FROM instructora_horarios ih_check
              WHERE ih_check.instructora_id = i.id AND ih_check.activo = 1
            )
            OR EXISTS (
              SELECT 1 FROM instructora_horarios ih_match
              WHERE ih_match.instructora_id = i.id
                AND ih_match.activo = 1
                AND ih_match.dia_semana = (
                  CASE DAYOFWEEK(?)
                    WHEN 1 THEN 'D' WHEN 2 THEN 'L' WHEN 3 THEN 'M'
                    WHEN 4 THEN 'X' WHEN 5 THEN 'J' WHEN 6 THEN 'V'
                    WHEN 7 THEN 'S'
                  END
                )
                AND ? >= ih_match.hora_inicio AND ? < ih_match.hora_fin
            )
          )

          -- Sin descanso ese día (recurrente por día de semana)
          AND i.id NOT IN (
            SELECT d.instructora_id FROM descansos d
            WHERE d.es_recurrente = 1
              AND d.dia_semana = (
                CASE DAYOFWEEK(?)
                  WHEN 1 THEN 'D' WHEN 2 THEN 'L' WHEN 3 THEN 'M'
                  WHEN 4 THEN 'X' WHEN 5 THEN 'J' WHEN 6 THEN 'V'
                  WHEN 7 THEN 'S'
                END
              )
          )

          -- Sin descanso ese día (por rango de fecha)
          AND i.id NOT IN (
            SELECT d.instructora_id FROM descansos d
            WHERE d.es_recurrente = 0
              AND ? BETWEEN d.fecha_inicio AND d.fecha_fin
          )

        ORDER BY u.nombre, u.apellido
      `, [
        reserva.clase_id,        // JOIN instructora_clase
        id,                      // i.id <> instructora que se va
        reserva.fecha,           // DAYOFWEEK para horario (dia_semana)
        reserva.hora_inicio, reserva.hora_inicio, // >= hora_inicio AND < hora_fin
        reserva.fecha,           // DAYOFWEEK para descanso recurrente
        reserva.fecha,           // descanso por rango de fecha
      ]);

      return { ...reserva, candidatos };
    }));

    res.json(reservasConCandidatos);
  } catch (err) {
    console.error('Error obteniendo reservas activas de instructora:', err);
    res.status(500).json({ error: 'Error al obtener reservas activas' });
  }
});

// Reasignar reservas pendientes a otros instructores
router.post('/:id/reasignar', async (req, res) => {
  const { id } = req.params;
  const { reasignaciones } = req.body; // [{ reserva_id, nuevo_instructora_id }]

  if (!Array.isArray(reasignaciones) || reasignaciones.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de reasignaciones' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const { reserva_id, nuevo_instructora_id } of reasignaciones) {
      if (!reserva_id || !nuevo_instructora_id) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Cada reasignación requiere reserva_id y nuevo_instructora_id' });
      }

      const [result] = await connection.query(
        `UPDATE reservas SET instructora_id = ? WHERE id = ? AND instructora_id = ? AND estatus = 'pendiente'`,
        [nuevo_instructora_id, reserva_id, id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: `No se pudo reasignar la reserva ${reserva_id}` });
      }
    }

    await connection.commit();
    res.json({ message: 'Reservas reasignadas correctamente', count: reasignaciones.length });
  } catch (err) {
    await connection.rollback();
    console.error('Error reasignando reservas:', err);
    res.status(500).json({ error: 'Error al reasignar reservas' });
  } finally {
    connection.release();
  }
});

// =============================================================================
// HORARIOS DE INSTRUCTORAS
// =============================================================================

// Obtener horarios disponibles de una instructora
router.get('/:id/horarios', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await db.query(`
      SELECT id, dia_semana, hora_inicio, hora_fin, activo, creado_en
      FROM instructora_horarios
      WHERE instructora_id = ?
      ORDER BY FIELD(dia_semana, 'L', 'M', 'X', 'J', 'V', 'S', 'D'), hora_inicio
    `, [id]);
    
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener horarios de instructora:', err);
    res.status(500).json({ error: 'Error al obtener horarios' });
  }
});

// Crear horario para una instructora
router.post('/:id/horarios', async (req, res) => {
  const { id } = req.params;
  const { dia_semana, hora_inicio, hora_fin } = req.body;
  
  if (!dia_semana || !hora_inicio || !hora_fin) {
    return res.status(400).json({ 
      error: 'Faltan campos requeridos: dia_semana, hora_inicio, hora_fin' 
    });
  }
  
  try {
    // Verificar que la instructora existe
    const [instructora] = await db.query(
      'SELECT id FROM instructoras WHERE id = ?',
      [id]
    );
    
    if (instructora.length === 0) {
      return res.status(404).json({ error: 'Instructora no encontrada' });
    }
    
    // Verificar que no haya conflicto de horario
    const [conflicto] = await db.query(`
      SELECT id FROM instructora_horarios
      WHERE instructora_id = ?
        AND dia_semana = ?
        AND activo = 1
        AND (
          (? BETWEEN hora_inicio AND hora_fin) OR
          (? BETWEEN hora_inicio AND hora_fin) OR
          (hora_inicio BETWEEN ? AND ?) OR
          (hora_fin BETWEEN ? AND ?)
        )
    `, [id, dia_semana, hora_inicio, hora_fin, hora_inicio, hora_fin, hora_inicio, hora_fin]);
    
    if (conflicto.length > 0) {
      return res.status(400).json({ 
        error: 'Conflicto de horario: ya existe un horario que se solapa' 
      });
    }
    
    const [result] = await db.query(`
      INSERT INTO instructora_horarios (instructora_id, dia_semana, hora_inicio, hora_fin)
      VALUES (?, ?, ?, ?)
    `, [id, dia_semana, hora_inicio, hora_fin]);
    
    res.status(201).json({ 
      message: 'Horario creado correctamente',
      id: result.insertId
    });
    
  } catch (err) {
    console.error('Error al crear horario:', err);
    res.status(500).json({ error: 'Error al crear horario' });
  }
});

// Actualizar horario de instructora
router.put('/:id/horarios/:horarioId', async (req, res) => {
  const { id, horarioId } = req.params;
  const { dia_semana, hora_inicio, hora_fin, activo } = req.body;
  
  try {
    // Verificar que el horario pertenece a la instructora
    const [horario] = await db.query(`
      SELECT id FROM instructora_horarios
      WHERE id = ? AND instructora_id = ?
    `, [horarioId, id]);
    
    if (horario.length === 0) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }
    
    // Si se está actualizando el horario, verificar conflictos
    if (dia_semana || hora_inicio || hora_fin) {
      const dia = dia_semana || horario[0].dia_semana;
      const inicio = hora_inicio || horario[0].hora_inicio;
      const fin = hora_fin || horario[0].hora_fin;
      
      const [conflicto] = await db.query(`
        SELECT id FROM instructora_horarios
        WHERE instructora_id = ?
          AND dia_semana = ?
          AND activo = 1
          AND id != ?
          AND (
            (? BETWEEN hora_inicio AND hora_fin) OR
            (? BETWEEN hora_inicio AND hora_fin) OR
            (hora_inicio BETWEEN ? AND ?) OR
            (hora_fin BETWEEN ? AND ?)
          )
      `, [id, dia, horarioId, inicio, fin, inicio, fin, inicio, fin]);
      
      if (conflicto.length > 0) {
        return res.status(400).json({ 
          error: 'Conflicto de horario: ya existe un horario que se solapa' 
        });
      }
    }
    
    const updates = [];
    const values = [];
    
    if (dia_semana !== undefined) {
      updates.push('dia_semana = ?');
      values.push(dia_semana);
    }
    if (hora_inicio !== undefined) {
      updates.push('hora_inicio = ?');
      values.push(hora_inicio);
    }
    if (hora_fin !== undefined) {
      updates.push('hora_fin = ?');
      values.push(hora_fin);
    }
    if (activo !== undefined) {
      updates.push('activo = ?');
      values.push(activo);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    values.push(horarioId);
    
    await db.query(`
      UPDATE instructora_horarios
      SET ${updates.join(', ')}
      WHERE id = ?
    `, values);
    
    res.json({ message: 'Horario actualizado correctamente' });
    
  } catch (err) {
    console.error('Error al actualizar horario:', err);
    res.status(500).json({ error: 'Error al actualizar horario' });
  }
});

// Eliminar horario de instructora
router.delete('/:id/horarios/:horarioId', async (req, res) => {
  const { id, horarioId } = req.params;
  
  try {
    const [result] = await db.query(`
      DELETE FROM instructora_horarios
      WHERE id = ? AND instructora_id = ?
    `, [horarioId, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }
    
    res.json({ message: 'Horario eliminado correctamente' });
    
  } catch (err) {
    console.error('Error al eliminar horario:', err);
    res.status(500).json({ error: 'Error al eliminar horario' });
  }
});

export default router;
