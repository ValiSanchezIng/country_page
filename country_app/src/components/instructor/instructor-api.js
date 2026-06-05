// API service para el panel de instructoras
const API_BASE_URL = 'https://elrefugiocountryclub.com/api/api';

// Caché corta + de-duplicación de la lista de caballos.
// Evita que muchas filas/HorseSelect disparen decenas o cientos de peticiones
// simultáneas a /api/caballos (lo que saturaba el navegador con
// ERR_INSUFFICIENT_RESOURCES). Las llamadas concurrentes comparten una sola
// petición y el resultado se reutiliza durante CABALLOS_TTL ms.
const CABALLOS_TTL = 10000; // 10s
let _caballosCache = { ts: 0, data: null, promise: null };

const getCaballosList = async () => {
  const ahora = Date.now();
  if (_caballosCache.data && (ahora - _caballosCache.ts) < CABALLOS_TTL) {
    return _caballosCache.data;
  }
  if (_caballosCache.promise) {
    // Ya hay una petición en vuelo: reutilizarla en vez de lanzar otra.
    return _caballosCache.promise;
  }
  _caballosCache.promise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/caballos`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();
      _caballosCache = { ts: Date.now(), data, promise: null };
      return data;
    } catch (err) {
      _caballosCache.promise = null; // permitir reintento en el próximo llamado
      throw err;
    }
  })();
  return _caballosCache.promise;
};

/**
 * Obtiene las clases/reservas de una instructora usando el usuario_id
 * @param {number} usuarioId - ID del usuario de la tabla usuarios
 * @returns {Promise<{instructora: Object, clases: Array}>}
 */
export const obtenerClasesInstructora = async (usuarioId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/instructoras/clases/${usuarioId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener clases de instructora:', error);
    throw error;
  }
};

/**
 * Actualiza la asistencia de una reserva
 * @param {number} reservaId - ID de la reserva
 * @param {string} asistencia - 'presente', 'ausente', 'justificado', 'pendiente'
 * @param {number} instructoraId - ID de la instructora (opcional)
 * @param {string} nivelClase - Nivel con el que se tomó la clase (para historial)
 * @param {string} nuevoNivel - Nuevo nivel del cliente (si se cambió)
 * @returns {Promise<Object>}
 */
// Ahora acepta instructoraId para evitar un fetch extra
export const actualizarAsistencia = async (reservaId, asistencia, instructoraId = null, nivelClase = null, nuevoNivel = null) => {
  try {
    console.log('🔍 DEBUG - Actualizando asistencia:', { reservaId, asistencia, nivelClase, nuevoNivel });

    // Si no viene instructoraId desde el front, recuperar desde usuario actual (fallback)
    if (!instructoraId) {
      const usuario = obtenerUsuarioActual();
      if (!usuario || !usuario.id) {
        throw new Error('No se encontró información de usuario');
      }
      const instructoraResponse = await fetch(`${API_BASE_URL}/instructoras/by-user/${usuario.id}`);
      if (!instructoraResponse.ok) {
        throw new Error(`Error obteniendo instructora: ${instructoraResponse.status}`);
      }
      const instructoraData = await instructoraResponse.json();
      instructoraId = instructoraData.id || instructoraData.instructora_id;
    }

    console.log('🏫 Instructora ID a usar:', instructoraId);

    const bodyData = { 
      asistio: asistencia === 'presente',
      instructora_id: instructoraId, // Enviar instructora_id directo para evitar GET previo
      observaciones: asistencia === 'ausente' ? 'Marcado por instructora' : ''
    };

    // Agregar nivel de la clase si se proporciona
    if (nivelClase) {
      bodyData.nivel_clase = nivelClase;
    }

    // Agregar nuevo nivel si se cambió
    if (nuevoNivel) {
      bodyData.nuevo_nivel = nuevoNivel;
    }

    const response = await fetch(`${API_BASE_URL}/reservas/instructor/${reservaId}/attendance`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyData),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al actualizar asistencia:', error);
    throw error;
  }
};

/**
 * Actualiza el caballo asignado a una reserva
 * @param {number} reservaId - ID de la reserva
 * @param {number} caballoId - ID del caballo
 * @returns {Promise<Object>}
 */
export const actualizarCaballoReserva = async (reservaId, caballoId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reservas/${reservaId}/caballo`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ caballo_id: caballoId }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al actualizar caballo:', error);
    throw error;
  }
};

/**
 * Obtiene la lista de caballos disponibles
 * @returns {Promise<Array>}
 */
export const obtenerCaballos = async () => {
  try {
    return await getCaballosList();
  } catch (error) {
    console.error('Error al obtener caballos:', error);
    throw error;
  }
};

/**
 * Asigna un caballo a una reserva
 * @param {number} reservaId - ID de la reserva
 * @param {number} caballoId - ID del caballo
 * @returns {Promise<Object>}
 */
// Ahora acepta instructoraId para evitar un fetch extra
export const asignarCaballo = async (reservaId, caballoId, instructoraId = null, extra = {}) => {
  try {
    console.log('🐴 Asignando caballo:', { reservaId, caballoId, extra });

    if (!instructoraId) {
      const usuario = obtenerUsuarioActual();
      if (!usuario || !usuario.id) {
        throw new Error('No se encontró información de usuario');
      }
      const instructoraResponse = await fetch(`${API_BASE_URL}/instructoras/by-user/${usuario.id}`);
      if (!instructoraResponse.ok) {
        throw new Error('No se pudo obtener información del instructor');
      }
      const instructoraData = await instructoraResponse.json();
      instructoraId = instructoraData.id || instructoraData.instructora_id;
    }

    // Construir payload: caballo + (opcional) actividad y observaciones de la sesión.
    const payload = {
      caballo_id: caballoId,
      instructora_id: instructoraId,
    };
    if (extra.actividad !== undefined) payload.actividad = extra.actividad;
    if (extra.observaciones !== undefined) payload.observaciones = extra.observaciones;

    // Ahora hacer la asignación con el instructor_id correcto usando el endpoint existente
    const response = await fetch(`${API_BASE_URL}/reservas/instructor/${reservaId}/assign-horse`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('🔍 Error del backend al asignar caballo:', errorData);
      // Crear un error que incluya la respuesta para que el frontend pueda acceder a errorData
      const error = new Error(errorData.error || 'Error al asignar caballo');
      error.response = response;
      error.errorData = errorData;
      console.log('🔍 Error creado con errorData:', error.errorData);
      throw error;
    }

    const data = await response.json();
    console.log('✅ Caballo asignado exitosamente:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error al asignar caballo:', error);
    throw error;
  }
};

/**
 * Actualiza sólo la actividad y observaciones de una reserva (sin tocar el caballo).
 */
export const actualizarSesion = async (reservaId, instructoraId, { actividad, observaciones }) => {
  const response = await fetch(`${API_BASE_URL}/reservas/instructor/${reservaId}/session`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instructora_id: instructoraId, actividad, observaciones }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al actualizar la sesión');
  }
  return response.json();
};

/**
 * Obtiene caballos para múltiples clases de una vez (optimizado)
 * @param {Array} clases - Array de clases con información de nivel, fecha, hora, id
 * @returns {Promise<Object>} Objeto con caballos disponibles por clase
 */
export const obtenerCaballosParaTodasLasClases = async (clases) => {
  try {
    console.log('🚀 Optimización: Cargando caballos para todas las clases de una vez');
    
    if (!clases || clases.length === 0) {
      return {};
    }
    
    // Obtener niveles únicos
    const nivelesUnicos = [...new Set(clases.map(c => c.studentLevel).filter(Boolean))];
    console.log('📚 Niveles únicos encontrados:', nivelesUnicos);
    
    // Obtener fechas únicas
    const fechasUnicas = [...new Set(clases.map(c => c.date).filter(Boolean))];
    console.log('📅 Fechas únicas encontradas:', fechasUnicas);
    
    // Obtener todos los caballos por nivel (una llamada por nivel único)
    const caballosPorNivel = {};
    for (const nivel of nivelesUnicos) {
      const fechaHoy = new Date().toISOString().split('T')[0];
      caballosPorNivel[nivel] = await obtenerCaballosPorNivel(nivel, fechaHoy);
    }
    
    // Obtener reservas para todas las fechas únicas
    const reservasPorFecha = {};
    for (const fecha of fechasUnicas) {
      try {
        const response = await fetch(`${API_BASE_URL}/reservas/admin/all?fecha=${fecha}`);
        if (response.ok) {
          reservasPorFecha[fecha] = await response.json();
        } else {
          reservasPorFecha[fecha] = [];
        }
      } catch (error) {
        console.warn(`Error al obtener reservas para ${fecha}:`, error);
        reservasPorFecha[fecha] = [];
      }
    }
    
    // Procesar cada clase para filtrar caballos
    const resultado = {};
    for (const clase of clases) {
      if (!clase.studentLevel) continue;
      
      const todosCaballos = caballosPorNivel[clase.studentLevel] || [];
      
      if (!clase.date || !clase.time) {
        // Sin filtrado por horario
        resultado[clase.id] = todosCaballos;
        continue;
      }
      
      // Filtrar por horario para esta clase específica
      const reservas = reservasPorFecha[clase.date] || [];
      const caballosOcupados = new Set();
      
      for (const reserva of reservas) {
        // Excluir la clase actual del filtrado
        if (reserva.id == clase.id) continue;
        
        if (reserva.caballo_nombre && 
            reserva.estatus !== 'cancelada' &&
            hayConflictoHorario(clase.time, reserva.hora_inicio, reserva.hora_fin)) {
          
          const caballoEncontrado = todosCaballos.find(c => c.nombre === reserva.caballo_nombre);
          if (caballoEncontrado) {
            caballosOcupados.add(caballoEncontrado.id);
          }
        }
      }
      
      resultado[clase.id] = todosCaballos.filter(caballo => !caballosOcupados.has(caballo.id));
    }
    
    console.log('✅ Caballos cargados para todas las clases:', Object.keys(resultado));
    return resultado;
    
  } catch (error) {
    console.error('Error al cargar caballos para todas las clases:', error);
    return {};
  }
};
// Caché en memoria para deduplicar por (nivel, fecha, hora)
const __dispCache = new Map(); // key -> { data, expiresAt }
const __dispPending = new Map(); // key -> Promise
const __cacheGet = (key) => {
  const entry = __dispCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    __dispCache.delete(key);
    return null;
  }
  return entry.data;
};
const __cacheSet = (key, data, ttlMs = 15000) => { // 15s (reducido para reflejar cambios de otros instructores más rápido)
  __dispCache.set(key, { data, expiresAt: Date.now() + ttlMs });
};

// Función para invalidar caché cuando se asigna/quita un caballo
export const invalidarCacheDisponibles = async (nivel, fecha, hora) => {
  if (!nivel || !fecha || !hora) {
    // Si no se especifica, limpiar toda la caché
    __dispCache.clear();
    __dispPending.clear();
    // También invalidar el caché del backend (en paralelo, no esperar)
    fetch(`${API_BASE_URL}/caballos/disponibles/invalidar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nivel: null, fecha: null, hora: null })
    }).catch(error => {
      console.warn('Error al invalidar caché del backend:', error);
    });
    return;
  }
  const cacheKey = `${(nivel || '').toLowerCase()}|${fecha || ''}|${hora || ''}`;
  __dispCache.delete(cacheKey);
  __dispPending.delete(cacheKey);
  console.log('🗑️ Caché del frontend invalidada para:', cacheKey);
  
  // También invalidar el caché del backend (en paralelo, no esperar para no bloquear)
  fetch(`${API_BASE_URL}/caballos/disponibles/invalidar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nivel, fecha, hora })
  }).then(response => {
    if (response.ok) {
      console.log('🗑️ Caché del backend invalidada para:', { nivel, fecha, hora });
    }
  }).catch(error => {
    console.warn('Error al invalidar caché del backend:', error);
  });
};

export const obtenerCaballosDisponiblesParaHorario = async (nivelCliente, fecha, hora, claseActualId = null, tipoClase = null, clienteId = null) => {
  try {
    const cacheKey = `${(nivelCliente || '').toLowerCase()}|${fecha || ''}|${hora || ''}|${tipoClase || ''}|${clienteId || ''}`; // incluir tipo de clase y cliente_id en la clave
    const cached = __cacheGet(cacheKey);
    if (cached) return cached;
    if (__dispPending.has(cacheKey)) return await __dispPending.get(cacheKey);

    // Nuevo endpoint consolidado en backend (sin exclude para maximizar reutilización)
    const url = new URL(`${API_BASE_URL}/caballos/disponibles`);
    if (nivelCliente) url.searchParams.set('nivel', nivelCliente);
    if (fecha) url.searchParams.set('fecha', fecha);
    if (hora) url.searchParams.set('hora', hora);
    if (tipoClase) url.searchParams.set('tipo_clase', tipoClase);
    if (clienteId) url.searchParams.set('cliente_id', clienteId);

    const promise = fetch(url.toString(), { method: 'GET' })
      .then(async (resp) => {
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        __cacheSet(cacheKey, data);
        return data;
      })
      .finally(() => {
        __dispPending.delete(cacheKey);
      });

    __dispPending.set(cacheKey, promise);
    return await promise;
  } catch (error) {
    console.error('Error al filtrar caballos por horario:', error);
    // En caso de error, devolver todos los caballos por nivel
    return await obtenerCaballosPorNivel(nivelCliente, fecha || new Date().toISOString().split('T')[0]);
  }
};

/**
 * Verifica si hay conflicto de horario entre dos rangos
 * @param {string} hora - Hora de la nueva clase (HH:MM)
 * @param {string} horaInicio - Hora inicio de reserva existente (HH:MM:SS)
 * @param {string} horaFin - Hora fin de reserva existente (HH:MM:SS)
 * @returns {boolean}
 */
const hayConflictoHorario = (hora, horaInicio, horaFin) => {
  if (!hora || !horaInicio || !horaFin) return false;
  
  // Normalizar formatos (quitar segundos si los hay)
  const horaClase = hora.substring(0, 5); // HH:MM
  const inicioReserva = horaInicio.substring(0, 5); // HH:MM
  const finReserva = horaFin.substring(0, 5); // HH:MM
  
  // Verificar si la hora de la clase está dentro del rango de la reserva
  return horaClase >= inicioReserva && horaClase < finReserva;
};

/**
 * Obtiene caballos filtrados por especialidad según el nivel del cliente
 * También filtra caballos que necesitan descanso (ya trabajaron 3 veces en actividades no-iniciación)
 * @param {string} nivelCliente - Nivel del cliente ('Iniciación', 'Intermedio', 'Avanzado')
 * @param {string} fecha - Fecha en formato YYYY-MM-DD para verificar descansos
 * @returns {Promise<Array>}
 */
export const obtenerCaballosPorNivel = async (nivelCliente, fecha = null) => {
  try {
    // Usar fecha actual si no se proporciona
    if (!fecha) {
      const hoy = new Date();
      fecha = hoy.toISOString().split('T')[0];
    }

    const caballos = await getCaballosList();

    // Normalizar el nivel del cliente a formato estándar
    const nivelNormalizado = nivelCliente.toLowerCase();
    
    // Mapeo de nivel de cliente a especialidad de caballo (todo en minúsculas)
    const mapeoEspecialidad = {
      'iniciación': 'iniciacion',
      'iniciacion': 'iniciacion',
      'intermedio': 'intermedio',
      'paseo': 'paseo',
      'avanzado': 'salto'
    };

    const especialidadBuscada = mapeoEspecialidad[nivelNormalizado];
    
    if (!especialidadBuscada) {
      console.warn(`Nivel de cliente no reconocido: ${nivelCliente}`);
      return caballos; // Devolver todos si no se reconoce el nivel
    }

    // Filtrar caballos que tengan la especialidad requerida
    let caballosFiltrados = caballos.filter(caballo => {
      if (!caballo.especialidad) return false;
      return caballo.especialidad.toLowerCase().includes(especialidadBuscada);
    });

    // Si no es iniciación, verificar el descanso (obtener actividades del día para cada caballo)
    if (especialidadBuscada !== 'iniciacion') {
      try {
        const caballosConDescanso = await Promise.all(
          caballosFiltrados.map(async (caballo) => {
            try {
              const actividadesResponse = await fetch(`${API_BASE_URL}/caballos/${caballo.id}/actividades-dia?fecha=${fecha}`);
              if (actividadesResponse.ok) {
                const data = await actividadesResponse.json();
                const actividadesNoIniciacion = data.actividades_no_iniciacion || 0;
                
                return {
                  ...caballo,
                  actividadesHoy: actividadesNoIniciacion,
                  necesitaDescanso: actividadesNoIniciacion >= 3
                };
              }
              return { ...caballo, necesitaDescanso: false };
            } catch (error) {
              console.warn(`Error verificando actividades para caballo ${caballo.nombre}:`, error);
              return { ...caballo, necesitaDescanso: false };
            }
          })
        );

        // Filtrar caballos que no necesitan descanso
        caballosFiltrados = caballosConDescanso.filter(caballo => !caballo.necesitaDescanso);
        
        console.log(`🐎 Caballos después del filtro de descanso:`, caballosFiltrados.length);
        caballosConDescanso.forEach(caballo => {
          if (caballo.necesitaDescanso) {
            console.log(`😴 ${caballo.nombre} necesita descanso (trabajó ${caballo.actividadesHoy} veces)`);
          }
        });
      } catch (error) {
        console.warn('Error verificando descansos, mostrando todos los caballos:', error);
      }
    }

    console.log(`🐎 Caballos filtrados para nivel ${nivelCliente} (busca "${especialidadBuscada}"):`, caballosFiltrados.length);
    console.log('📋 Caballos disponibles:', caballosFiltrados.map(c => `${c.nombre} (${c.especialidad})`));
    return caballosFiltrados;
    
  } catch (error) {
    console.error('Error al obtener caballos por nivel:', error);
    throw error;
  }
};

/**
 * Obtiene el usuario actual del sessionStorage
 * @returns {Object|null}
 */
export const obtenerUsuarioActual = () => {
  try {
    const usuario = sessionStorage.getItem('user');
    return usuario ? JSON.parse(usuario) : null;
  } catch (error) {
    console.error('Error al obtener usuario del sessionStorage:', error);
    return null;
  }
};

/**
 * Nuevo helper: caballos disponibles consolidados
 * Wrapper explícito si quieres llamarlo directo
 */
export const obtenerCaballosDisponibles = async ({ nivel, fecha, hora, excludeReservaId }) => {
  return obtenerCaballosDisponiblesParaHorario(nivel, fecha, hora, excludeReservaId || null);
};

/**
 * Cancelar todas las reservas de un día (instructora)
 * @param {number} instructoraId - ID de la instructora
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} motivo - Motivo de la cancelación (opcional)
 * @returns {Promise<Object>}
 */
export const cancelarReservasDia = async (instructoraId, fecha, motivo = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reservas/instructor/cancel-day`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructora_id: instructoraId,
        fecha: fecha,
        motivo: motivo
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al cancelar reservas del día');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al cancelar reservas del día:', error);
    throw error;
  }
};

/**
 * Cancelar reservas desde cierta hora en adelante (instructora)
 * @param {number} instructoraId - ID de la instructora
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} horaInicio - Hora de inicio en formato HH:MM
 * @param {string} motivo - Motivo de la cancelación (opcional)
 * @returns {Promise<Object>}
 */
export const cancelarReservasDesdeHora = async (instructoraId, fecha, horaInicio, motivo = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reservas/instructor/cancel-from-time`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructora_id: instructoraId,
        fecha: fecha,
        hora_inicio: horaInicio,
        motivo: motivo
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al cancelar reservas desde hora');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al cancelar reservas desde hora:', error);
    throw error;
  }
};

/**
 * Cancelar una reserva individual (instructora)
 * @param {number} reservaId - ID de la reserva
 * @param {number} clienteId - ID del cliente
 * @param {string} motivo - Motivo de la cancelación (requerido)
 * @returns {Promise<Object>}
 */
export const cancelarReservaIndividual = async (reservaId, clienteId, motivo) => {
  if (!motivo || motivo.trim() === '') {
    throw new Error('El motivo de cancelación es requerido');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/reservas/${reservaId}/cancel/${clienteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        motivo_cancelacion: motivo.trim()
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al cancelar la reserva');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al cancelar reserva individual:', error);
    throw error;
  }
};