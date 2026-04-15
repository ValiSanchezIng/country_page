import express from 'express';
import db from '../server/db.js';

const router = express.Router();

// Helper para mapear nivel de alumno a especialidad de caballo
const mapNivelToEspecialidad = (nivel) => {
  if (!nivel) return null;
  const n = String(nivel).toLowerCase();
  if (n.includes('ponyclub')) return 'iniciacion';
  if (n.includes('inici')) return 'iniciacion';
  if (n.includes('inter')) return 'intermedio';
  if (n.includes('paseo')) return 'paseo';
  if (n.includes('avanz')) return 'salto';
  return null;
};

// =========================
// Caché en memoria simple
// =========================
const cacheStore = new Map(); // key -> { data, expiresAt }
const pendingPromises = new Map(); // key -> Promise compartida

const getCache = (key) => {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = (key, data, ttlMs) => {
  cacheStore.set(key, { data, expiresAt: Date.now() + ttlMs });
};

// Invalidar caché por patrón (nivel, fecha, hora) - elimina todas las variantes con diferentes exclude_reserva_id
const invalidarCachePorPatron = (nivel, fecha, hora) => {
  if (!nivel || !fecha || !hora) {
    // Si no se especifica, limpiar toda la caché
    cacheStore.clear();
    pendingPromises.clear();
    console.log('🗑️ Caché del backend completamente invalidada');
    return;
  }
  const patron = `disp:${(nivel || '').toLowerCase()}|${fecha}|${hora || ''}`;
  let eliminados = 0;
  // Eliminar todas las entradas que empiecen con el patrón
  for (const key of cacheStore.keys()) {
    if (key.startsWith(patron)) {
      cacheStore.delete(key);
      eliminados++;
    }
  }
  for (const key of pendingPromises.keys()) {
    if (key.startsWith(patron)) {
      pendingPromises.delete(key);
    }
  }
  console.log(`🗑️ Caché del backend invalidada para patrón "${patron}": ${eliminados} entradas eliminadas`);
};

// GET - Obtener todos los caballos
router.get('/', async (req, res) => {
  try {
    const [caballos] = await db.query(`
      SELECT 
        c.id,
        c.nombre,
        c.propietario_id,
        c.disponibilidad,
        c.estatus,
        c.especialidad,
        c.descripcion,
        CONCAT(u.nombre, ' ', u.apellido) as propietario_nombre
      FROM caballos c
      LEFT JOIN usuarios u ON c.propietario_id = u.id
      ORDER BY c.nombre ASC
    `);
    
    res.json(caballos);
  } catch (error) {
    console.error('Error al obtener caballos:', error);
    res.status(500).json({ error: 'Error al obtener la lista de caballos' });
  }
});

// GET - Disponibilidad consolidada por nivel/fecha/hora (nuevo endpoint)
// /api/caballos/disponibles?nivel=Intermedio&fecha=YYYY-MM-DD&hora=HH:MM&exclude_reserva_id=123
router.get('/disponibles', async (req, res) => {
  try {
    const { nivel, fecha, hora, exclude_reserva_id, tipo_clase, cliente_id } = req.query;
    const ttlMs = 15 * 1000; // 15s (reducido para reflejar cambios de otros instructores más rápido)

    if (!fecha) {
      return res.status(400).json({ error: 'Parámetro fecha es requerido (YYYY-MM-DD)' });
    }

    // Calcular cooldown de la clase solicitada
    const cooldownClaseSolicitada = tipo_clase ? (
      ['iniciacion', 'paseo', 'ponyclub'].includes(tipo_clase.toLowerCase()) ? 0 :
      tipo_clase.toLowerCase() === 'intermedio' ? 2 :
      ['salto', 'avanzado'].includes(tipo_clase.toLowerCase()) ? 3 : 0
    ) : 3; // Si no se especifica, usar el peor caso (3 horas)

    // Clave de caché (incluir tipo_clase y cliente_id para diferenciar cooldowns y visibilidad de privados)
    const cacheKey = `disp:${(nivel||'').toLowerCase()}|${fecha}|${hora||''}|${tipo_clase||''}|${exclude_reserva_id||''}|${cliente_id||''}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Deduplicación de concurrencia
    if (pendingPromises.has(cacheKey)) {
      const shared = await pendingPromises.get(cacheKey);
      return res.json(shared);
    }

    const especialidad = mapNivelToEspecialidad(nivel);

    // Construir SQL parametrizado
    // Nota: usamos LIKE por si especialidad tiene valores combinados (ej. 'mixto,iniciacion').
    // Además tratamos 'mixto' como comodín: matchea cualquier nivel solicitado.
    const whereEsp = especialidad
      ? `AND (LOWER(c.especialidad) LIKE CONCAT('%', ?, '%') OR LOWER(c.especialidad) = 'mixto')`
      : '';

    // Visibilidad de privados: un caballo con estatus='privado' solo debe aparecer si se
    // indica cliente_id y coincide con su propietario. Sin cliente_id, se ocultan los privados.
    const whereEstatus = cliente_id
      ? `AND (c.estatus <> 'privado' OR c.propietario_id = ?)`
      : `AND c.estatus <> 'privado'`;

    const sql = `
      SELECT c.id, c.nombre, c.especialidad
      FROM caballos c
      WHERE c.disponibilidad = 'disponible'
        ${whereEsp}
        ${whereEstatus}
        AND NOT EXISTS (
          SELECT 1
          FROM caballos_descansos d
          WHERE d.caballo_id = c.id
            AND d.activo = 1
            AND d.fecha_inicio <= ?
            AND (d.fecha_fin IS NULL OR d.fecha_fin >= ?)
        )
        AND NOT EXISTS (
          SELECT 1
          FROM reservas r
          WHERE r.caballo_id = c.id
            AND r.fecha = ?
            AND r.estatus IN ('pendiente','confirmada','completada')
            ${hora ? 'AND ? >= r.hora_inicio AND ? < r.hora_fin' : ''}
            ${exclude_reserva_id ? 'AND r.id <> ?' : ''}
        )
        AND (
          SELECT COUNT(*)
          FROM reservas r2
          JOIN clases cl ON cl.id = r2.clase_id
          WHERE r2.caballo_id = c.id
            AND r2.fecha = ?
            AND r2.estatus IN ('confirmada','completada')
            AND cl.nombre <> 'iniciacion'
        ) < 3
        ${hora ? `AND NOT EXISTS (
          SELECT 1
          FROM reservas r3
          JOIN clases cl3 ON cl3.id = r3.clase_id
          WHERE r3.caballo_id = c.id
            AND r3.fecha = ?
            AND r3.caballo_id IS NOT NULL
            AND r3.estatus IN ('pendiente','confirmada','completada')
            ${exclude_reserva_id ? 'AND r3.id <> ?' : ''}
            AND (
              -- Verificar si la hora de la nueva clase está dentro del período de cooldown de otra clase
              (? >= r3.hora_fin
              AND ? < DATE_ADD(r3.hora_fin, INTERVAL 
                CASE 
                  WHEN LOWER(cl3.nombre) IN ('iniciacion', 'paseo', 'ponyclub') THEN 0
                  WHEN LOWER(cl3.nombre) = 'intermedio' THEN 2
                  WHEN LOWER(cl3.nombre) IN ('salto', 'avanzado') THEN 3
                  ELSE 0
                END HOUR))
              OR
              -- Verificar si otra clase se solapa con el cooldown de la clase solicitada
              -- (asumiendo duración de 1 hora y cooldown según tipo de clase)
              -- El cooldown de la clase solicitada va desde (hora + 1 hora) hasta (hora + 1 hora + cooldown)
              -- Verificamos si la otra clase empieza o termina dentro del cooldown
              (
                (r3.hora_inicio >= DATE_ADD(?, INTERVAL 1 HOUR)
                AND r3.hora_inicio < DATE_ADD(?, INTERVAL ${cooldownClaseSolicitada + 1} HOUR))
                OR
                (r3.hora_fin > DATE_ADD(?, INTERVAL 1 HOUR)
                AND r3.hora_fin <= DATE_ADD(?, INTERVAL ${cooldownClaseSolicitada + 1} HOUR))
                OR
                (r3.hora_inicio < DATE_ADD(?, INTERVAL 1 HOUR)
                AND r3.hora_fin > DATE_ADD(?, INTERVAL ${cooldownClaseSolicitada + 1} HOUR))
              )
            )
        )` : ''}
      ORDER BY c.nombre;
    `;

    const params = [];
    if (especialidad) params.push(especialidad);
    if (cliente_id) params.push(Number(cliente_id));
    // descansos
    params.push(fecha, fecha);
    // reservas del día (ocupación directa)
    params.push(fecha);
    if (hora) {
      const horaFormateada = hora.length === 5 ? `${hora}:00` : hora;
      params.push(horaFormateada, horaFormateada);
    }
    if (exclude_reserva_id) params.push(Number(exclude_reserva_id));
    // carga diaria
    params.push(fecha);
    // cooldown (solo si hay hora)
    if (hora) {
      const horaFormateada = hora.length === 5 ? `${hora}:00` : hora;
      params.push(fecha); // r3.fecha
      if (exclude_reserva_id) params.push(Number(exclude_reserva_id)); // r3.id <> ?
      // Comparaciones de cooldown: hora >= hora_fin AND hora < hora_fin + cooldown
      params.push(horaFormateada, horaFormateada); // 2 veces para las comparaciones del cooldown de otra clase
      // Comparaciones del cooldown de la clase solicitada (cooldown dinámico según tipo_clase):
      // - r3.hora_inicio >= (hora + 1 hora) AND r3.hora_inicio < (hora + 1 hora + cooldown)
      // - r3.hora_fin > (hora + 1 hora) AND r3.hora_fin <= (hora + 1 hora + cooldown)
      // - r3.hora_inicio < (hora + 1 hora) AND r3.hora_fin > (hora + 1 hora + cooldown)
      params.push(horaFormateada, horaFormateada, horaFormateada, horaFormateada, horaFormateada, horaFormateada); // 6 veces para las comparaciones del cooldown de esta clase
    }

    const promise = db.query(sql, params).then(([rows]) => {
      setCache(cacheKey, rows, ttlMs);
      return rows;
    }).finally(() => {
      pendingPromises.delete(cacheKey);
    });

    pendingPromises.set(cacheKey, promise);
    const rows = await promise;
    return res.json(rows);
  } catch (error) {
    console.error('Error en /caballos/disponibles:', error);
    return res.status(500).json({ error: 'Error al obtener caballos disponibles' });
  }
});

// POST - Invalidar caché de caballos disponibles
router.post('/disponibles/invalidar', async (req, res) => {
  try {
    const { nivel, fecha, hora } = req.body;
    invalidarCachePorPatron(nivel, fecha, hora);
    return res.json({ 
      message: 'Caché invalidada exitosamente',
      nivel,
      fecha,
      hora
    });
  } catch (error) {
    console.error('Error al invalidar caché:', error);
    return res.status(500).json({ error: 'Error al invalidar caché' });
  }
});

// GET - Obtener un caballo por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [caballos] = await db.query(`
      SELECT 
        c.id,
        c.nombre,
        c.propietario_id,
        c.disponibilidad,
        c.estatus,
        c.especialidad,
        c.descripcion,
        CONCAT(u.nombre, ' ', u.apellido) as propietario_nombre
      FROM caballos c
      LEFT JOIN usuarios u ON c.propietario_id = u.id
      WHERE c.id = ?
    `, [id]);
    
    if (caballos.length === 0) {
      return res.status(404).json({ error: 'Caballo no encontrado' });
    }
    
    res.json(caballos[0]);
  } catch (error) {
    console.error('Error al obtener caballo:', error);
    res.status(500).json({ error: 'Error al obtener el caballo' });
  }
});

// POST - Crear un nuevo caballo
router.post('/', async (req, res) => {
  try {
    console.log('🐎 Datos recibidos en el backend:', req.body);
    
    const {
      nombre,
      propietario_id,
      disponibilidad = 'disponible',
      estatus = 'publico',
      especialidad = 'mixto',
      descripcion = ''
    } = req.body;
    
    console.log('📋 Especialidad extraída:', especialidad, 'Tipo:', typeof especialidad);

    // Validaciones
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre del caballo es requerido' });
    }

    // Validar que el propietario existe si se proporciona
    if (propietario_id) {
      const [propietario] = await db.query(
        'SELECT id FROM usuarios WHERE id = ?',
        [propietario_id]
      );
      
      if (propietario.length === 0) {
        return res.status(400).json({ error: 'El propietario especificado no existe' });
      }
    }

    // Validar valores de enum
    const disponibilidadesValidas = ['disponible', 'no_disponible'];
    if (!disponibilidadesValidas.includes(disponibilidad)) {
      return res.status(400).json({ error: 'Disponibilidad inválida' });
    }

    const estatusValidos = ['publico', 'privado', 'renta', 'media_renta'];
    if (!estatusValidos.includes(estatus)) {
      return res.status(400).json({ error: 'Estatus inválido' });
    }

    const especialidadesValidas = ['iniciacion', 'paseo', 'intermedio', 'salto'];
    
    // Validar especialidades (puede ser string o array)
    let especialidadFinal = especialidad;
    if (Array.isArray(especialidad)) {
      // Si es array, validar cada especialidad
      for (const esp of especialidad) {
        if (!especialidadesValidas.includes(esp)) {
          return res.status(400).json({ error: `Especialidad inválida: ${esp}` });
        }
      }
      // Convertir array a string separado por comas
      especialidadFinal = especialidad.join(',');
    } else {
      // Si es string, validar directamente
      if (!especialidadesValidas.includes(especialidad)) {
        return res.status(400).json({ error: 'Especialidad inválida' });
      }
    }

    console.log('🔍 Especialidad procesada:', { original: especialidad, final: especialidadFinal });

    // Insertar el nuevo caballo
    const [result] = await db.query(`
      INSERT INTO caballos (
        nombre, 
        propietario_id, 
        disponibilidad, 
        estatus, 
        especialidad, 
        descripcion
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      nombre.trim(),
      propietario_id || null,
      disponibilidad,
      estatus,
      especialidadFinal,
      descripcion.trim()
    ]);

    // Obtener el caballo recién creado
    const [nuevoCaballo] = await db.query(`
      SELECT 
        c.id,
        c.nombre,
        c.propietario_id,
        c.disponibilidad,
        c.estatus,
        c.especialidad,
        c.descripcion,
        CONCAT(u.nombre, ' ', u.apellido) as propietario_nombre
      FROM caballos c
      LEFT JOIN usuarios u ON c.propietario_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);

    res.status(201).json({
      message: 'Caballo creado exitosamente',
      caballo: nuevoCaballo[0]
    });
  } catch (error) {
    console.error('Error al crear caballo:', error);
    res.status(500).json({ error: 'Error al crear el caballo' });
  }
});

// PUT - Actualizar un caballo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      propietario_id,
      disponibilidad,
      estatus,
      especialidad,
      descripcion
    } = req.body;

    // Verificar que el caballo existe
    const [caballoExistente] = await db.query(
      'SELECT id FROM caballos WHERE id = ?',
      [id]
    );

    if (caballoExistente.length === 0) {
      return res.status(404).json({ error: 'Caballo no encontrado' });
    }

    // Validaciones
    if (nombre && nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre no puede estar vacío' });
    }

    // Validar que el propietario existe si se proporciona
    if (propietario_id) {
      const [propietario] = await db.query(
        'SELECT id FROM usuarios WHERE id = ?',
        [propietario_id]
      );
      
      if (propietario.length === 0) {
        return res.status(400).json({ error: 'El propietario especificado no existe' });
      }
    }

    // Validar valores de enum si se proporcionan
    if (disponibilidad) {
      const disponibilidadesValidas = ['disponible', 'no_disponible'];
      if (!disponibilidadesValidas.includes(disponibilidad)) {
        return res.status(400).json({ error: 'Disponibilidad inválida' });
      }
    }

    if (estatus) {
      const estatusValidos = ['publico', 'privado', 'renta', 'media_renta'];
      if (!estatusValidos.includes(estatus)) {
        return res.status(400).json({ error: 'Estatus inválido' });
      }
    }

    if (especialidad) {
      const especialidadesValidas = ['iniciacion', 'paseo', 'intermedio', 'salto'];
      
      // Validar especialidades (puede ser string o array)
      let especialidadFinal = especialidad;
      if (Array.isArray(especialidad)) {
        // Si es array, validar cada especialidad
        for (const esp of especialidad) {
          if (!especialidadesValidas.includes(esp)) {
            return res.status(400).json({ error: `Especialidad inválida: ${esp}` });
          }
        }
        // Convertir array a string separado por comas
        especialidadFinal = especialidad.join(',');
      } else {
        // Si es string, validar directamente
        if (!especialidadesValidas.includes(especialidad)) {
          return res.status(400).json({ error: 'Especialidad inválida' });
        }
      }
    }

    // Construir la query de actualización solo con los campos proporcionados
    const updates = [];
    const values = [];

    if (nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(nombre.trim());
    }
    if (propietario_id !== undefined) {
      updates.push('propietario_id = ?');
      values.push(propietario_id || null);
    }
    if (disponibilidad !== undefined) {
      updates.push('disponibilidad = ?');
      values.push(disponibilidad);
    }
    if (estatus !== undefined) {
      updates.push('estatus = ?');
      values.push(estatus);
    }
    if (especialidad !== undefined) {
      updates.push('especialidad = ?');
      
      // Procesar especialidad (array o string)
      let especialidadFinal = especialidad;
      if (Array.isArray(especialidad)) {
        especialidadFinal = especialidad.join(',');
      }
      
      values.push(especialidadFinal);
    }
    if (descripcion !== undefined) {
      updates.push('descripcion = ?');
      values.push(descripcion.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    values.push(id);

    await db.query(
      `UPDATE caballos SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Obtener el caballo actualizado
    const [caballoActualizado] = await db.query(`
      SELECT 
        c.id,
        c.nombre,
        c.propietario_id,
        c.disponibilidad,
        c.estatus,
        c.especialidad,
        c.descripcion,
        CONCAT(u.nombre, ' ', u.apellido) as propietario_nombre
      FROM caballos c
      LEFT JOIN usuarios u ON c.propietario_id = u.id
      WHERE c.id = ?
    `, [id]);

    res.json({
      message: 'Caballo actualizado exitosamente',
      caballo: caballoActualizado[0]
    });
  } catch (error) {
    console.error('Error al actualizar caballo:', error);
    res.status(500).json({ error: 'Error al actualizar el caballo' });
  }
});

// PATCH - Actualizar solo la disponibilidad de un caballo
router.patch('/:id/disponibilidad', async (req, res) => {
  try {
    const { id } = req.params;
    const { disponibilidad } = req.body;

    // Validar disponibilidad
    const disponibilidadesValidas = ['disponible', 'no_disponible'];
    if (!disponibilidadesValidas.includes(disponibilidad)) {
      return res.status(400).json({ error: 'Disponibilidad inválida' });
    }

    // Verificar que el caballo existe
    const [caballoExistente] = await db.query(
      'SELECT id FROM caballos WHERE id = ?',
      [id]
    );

    if (caballoExistente.length === 0) {
      return res.status(404).json({ error: 'Caballo no encontrado' });
    }

    // Actualizar disponibilidad
    await db.query(
      'UPDATE caballos SET disponibilidad = ? WHERE id = ?',
      [disponibilidad, id]
    );

    res.json({
      message: 'Disponibilidad actualizada exitosamente',
      id,
      disponibilidad
    });
  } catch (error) {
    console.error('Error al actualizar disponibilidad:', error);
    res.status(500).json({ error: 'Error al actualizar la disponibilidad' });
  }
});

// PATCH - Actualizar solo el estatus de un caballo
router.patch('/:id/estatus', async (req, res) => {
  try {
    const { id } = req.params;
    const { estatus } = req.body;

    // Validar estatus
    const estatusValidos = ['publico', 'privado', 'renta', 'media_renta'];
    if (!estatusValidos.includes(estatus)) {
      return res.status(400).json({ error: 'Estatus inválido' });
    }

    // Verificar que el caballo existe
    const [caballoExistente] = await db.query(
      'SELECT id FROM caballos WHERE id = ?',
      [id]
    );

    if (caballoExistente.length === 0) {
      return res.status(404).json({ error: 'Caballo no encontrado' });
    }

    // Actualizar estatus
    await db.query(
      'UPDATE caballos SET estatus = ? WHERE id = ?',
      [estatus, id]
    );

    res.json({
      message: 'Estatus actualizado exitosamente',
      id,
      estatus
    });
  } catch (error) {
    console.error('Error al actualizar estatus:', error);
    res.status(500).json({ error: 'Error al actualizar el estatus' });
  }
});

// DELETE - Eliminar un caballo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el caballo existe
    const [caballoExistente] = await db.query(
      'SELECT id FROM caballos WHERE id = ?',
      [id]
    );

    if (caballoExistente.length === 0) {
      return res.status(404).json({ error: 'Caballo no encontrado' });
    }

    // Verificar si el caballo tiene reservas activas
    const [reservasActivas] = await db.query(`
      SELECT COUNT(*) as total 
      FROM reservas 
      WHERE caballo_id = ? 
      AND fecha >= CURDATE()
      AND estatus != 'cancelada'
    `, [id]);

    if (reservasActivas[0].total > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el caballo porque tiene reservas activas' 
      });
    }

    // Eliminar el caballo
    await db.query('DELETE FROM caballos WHERE id = ?', [id]);

    res.json({
      message: 'Caballo eliminado exitosamente',
      id
    });
  } catch (error) {
    console.error('Error al eliminar caballo:', error);
    res.status(500).json({ error: 'Error al eliminar el caballo' });
  }
});

// GET - Obtener caballos disponibles por especialidad
router.get('/disponibles/:especialidad', async (req, res) => {
  try {
    const { especialidad } = req.params;

    const [caballos] = await db.query(`
      SELECT 
        c.id,
        c.nombre,
        c.propietario_id,
        c.disponibilidad,
        c.estatus,
        c.especialidad,
        c.descripcion,
        CONCAT(u.nombre, ' ', u.apellido) as propietario_nombre
      FROM caballos c
      LEFT JOIN usuarios u ON c.propietario_id = u.id
      WHERE c.disponibilidad = 'disponible'
      AND (c.especialidad = ? OR c.especialidad = 'mixto')
      ORDER BY c.nombre ASC
    `, [especialidad]);
    
    res.json(caballos);
  } catch (error) {
    console.error('Error al obtener caballos disponibles:', error);
    res.status(500).json({ error: 'Error al obtener caballos disponibles' });
  }
});

// GET - Obtener actividades del día de un caballo específico
router.get('/:id/actividades-dia', async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({ error: 'Parámetro fecha es requerido (formato: YYYY-MM-DD)' });
    }

    // Obtener actividades del día para el caballo (excluyendo iniciación)
    const [actividades] = await db.query(`
      SELECT 
        COUNT(*) as actividades_no_iniciacion,
        GROUP_CONCAT(DISTINCT c.nombre) as tipos_clases
      FROM reservas r
      JOIN clases c ON r.clase_id = c.id
      WHERE r.caballo_id = ?
      AND r.fecha = ?
      AND r.estatus IN ('confirmada', 'completada')
      AND LOWER(c.nombre) NOT LIKE '%iniciaci%'
      AND LOWER(c.nombre) NOT LIKE '%ponyclub%'
    `, [id, fecha]);

    const actividadesTotal = await db.query(`
      SELECT COUNT(*) as total_actividades FROM reservas r
      WHERE r.caballo_id = ?
      AND r.fecha = ?
      AND r.estatus IN ('confirmada', 'completada')
    `, [id, fecha]);

    const resultado = {
      caballo_id: parseInt(id),
      fecha: fecha,
      actividades_no_iniciacion: actividades[0]?.actividades_no_iniciacion || 0,
      total_actividades: actividadesTotal[0]?.total_actividades || 0,
      tipos_clases: actividades[0]?.tipos_clases || '',
      necesita_descanso: (actividades[0]?.actividades_no_iniciacion || 0) >= 3
    };

    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener actividades del caballo:', error);
    res.status(500).json({ error: 'Error al obtener actividades del caballo' });
  }
});

// GET - Obtener caballos disponibles filtrados por nivel, fecha y hora
router.get('/disponibles-filtrado', async (req, res) => {
  try {
    const { nivel, fecha, hora } = req.query;
    
    console.log('🔍 Buscando caballos disponibles:', { nivel, fecha, hora });
    
    if (!nivel) {
      return res.status(400).json({ error: 'Parámetro nivel es requerido' });
    }
    
    // Mapear niveles de cliente a especialidades de caballos
    const especialidadesMap = {
      'Iniciación': ['iniciacion', 'mixto'],
      'Intermedio': ['iniciacion', 'intermedio', 'mixto'],
      'Avanzado': ['iniciacion', 'intermedio', 'avanzado', 'mixto']
    };
    
    const especialidades = especialidadesMap[nivel];
    if (!especialidades) {
      return res.status(400).json({ error: 'Nivel no válido' });
    }
    
    // Construir la consulta base
    let query = `
      SELECT 
        c.id,
        c.nombre,
        c.especialidad,
        c.disponibilidad,
        c.estatus,
        CONCAT(u.nombre, ' ', u.apellido) as propietario_nombre
      FROM caballos c
      LEFT JOIN usuarios u ON c.propietario_id = u.id
      WHERE c.estatus = 'activo' 
        AND c.disponibilidad = 'disponible'
        AND c.especialidad IN (${especialidades.map(() => '?').join(',')})
    `;
    
    let params = [...especialidades];
    
    // Si se especifica fecha y hora, filtrar caballos ocupados
    if (fecha && hora) {
      query += `
        AND c.id NOT IN (
          SELECT r.caballo_id 
          FROM reservas r 
          WHERE r.caballo_id IS NOT NULL
            AND r.fecha = ?
            AND r.hora_inicio <= ?
            AND r.hora_fin > ?
            AND r.estatus != 'cancelada'
        )
      `;
      params.push(fecha, hora, hora);
    }
    
    // Si se especifica fecha, filtrar caballos que necesitan descanso (más de 3 actividades no-iniciación)
    if (fecha) {
      query += `
        AND c.id NOT IN (
          SELECT subq.caballo_id
          FROM (
            SELECT 
              r.caballo_id,
              COUNT(*) as actividades
            FROM reservas r
            JOIN clases cl ON r.clase_id = cl.id
            WHERE r.caballo_id IS NOT NULL
              AND r.fecha = ?
              AND r.estatus != 'cancelada'
              AND cl.nombre NOT LIKE '%iniciaci%'
              AND cl.nombre NOT LIKE '%ponyclub%'
            GROUP BY r.caballo_id
            HAVING COUNT(*) >= 3
          ) subq
        )
      `;
      params.push(fecha);
    }
    
    query += ` ORDER BY c.nombre ASC`;
    
    console.log('🗃️ Query SQL:', query);
    console.log('📝 Parámetros:', params);
    
    const [caballos] = await db.query(query, params);
    
    console.log(`✅ Encontrados ${caballos.length} caballos disponibles`);
    res.json(caballos);
    
  } catch (error) {
    console.error('Error al obtener caballos disponibles:', error);
    res.status(500).json({ error: 'Error al obtener caballos disponibles' });
  }
});

export default router;
