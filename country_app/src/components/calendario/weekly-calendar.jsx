import { TimeSlotCard } from './time-slot-card';
// import { useBookings } from './lib/booking-context';
import { getCurrentWeek, formatDayLabel } from './utils/week';
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState, useEffect, useRef } from 'react'
import './css/weekly-calendar.css'
import { DateTime } from 'luxon'

// === Interruptor reversible: SOLO_SLOTS_UNA_HORA ===
// Cuando es true, el calendario solo genera slots de 1 hora a partir de los horarios GENERALES.
// Los slots de media hora solo aparecen para el usuario que tiene un horario PERSONALIZADO de
// media hora (la excepción). Para REVERTIR este comportamiento, cambiar a false.
const SOLO_SLOTS_UNA_HORA = true;

// === Interruptor reversible: DESCONTAR_INSTRUCTORAS_EN_OTRA_CLASE ===
// Cuando es true, un slot se bloquea si todas las instructoras disponibles a esa hora ya están
// dando OTRA clase distinta (una instructora no puede impartir dos clases a la vez). Si están
// dando ESTA misma clase, no cuenta (el alumno se suma a su grupo). Para REVERTIR, cambiar a false.
const DESCONTAR_INSTRUCTORAS_EN_OTRA_CLASE = true;

// Determina si un horario dura exactamente 1 hora (60 min) a partir de hora_inicio/hora_fin "HH:MM".
const esSlotDeUnaHora = (h) => {
  if (!h || !h.hora_inicio || !h.hora_fin) return true; // sin datos suficientes: no filtrar
  const [hi, mi] = h.hora_inicio.split(':').map(Number);
  const [hf, mf] = h.hora_fin.split(':').map(Number);
  return ((hf * 60 + mf) - (hi * 60 + mi)) === 60;
};

// Función helper para obtener fecha en formato YYYY-MM-DD sin problemas de zona horaria
const getDateString = (date) => {
  if (!date) return null;
  // Si es un objeto Date, extraer año, mes y día directamente sin conversiones de zona horaria
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  // Si ya es un string, devolverlo
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return null;
};


export function WeeklyCalendar({ userLevel, userId, userType, onSlotClick, userBookings = [], allWeekBookings = [], className, claseCupoMax, claseId, onWeekChange }) {
  // ⚠️ IMPORTANTE: Todos los hooks deben estar al inicio, antes de cualquier return condicional
  
  // Estados para horarios dinámicos desde la base de datos
  const [dynamicSchedule, setDynamicSchedule] = useState(null);
  const [personalSchedule, setPersonalSchedule] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [scheduleError, setScheduleError] = useState(null);
  const [instructorAvailabilityMap, setInstructorAvailabilityMap] = useState({});
  
  // fecha base para la semana mostrada (permite navegar semanas)
  const [currentDate, setCurrentDate] = useState(new Date());
  const lastWeekRef = useRef(null);
  
  // Cargar horarios desde la base de datos
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!className) {
        setScheduleError('No se especificó clase');
        setLoadingSchedule(false);
        return;
      }
      
      try {
        setLoadingSchedule(true);
        const response = await fetch(`https://elrefugiocountryclub.com/api/api/horarios/clase/${className}`);
        if (!response.ok) {
          throw new Error('Error al cargar horarios desde la base de datos');
        }
        const data = await response.json();
        setDynamicSchedule(data);
        setScheduleError(null);

        // Cargar horarios personalizados si hay un userId
        if (userId) {
          try {
            const pResponse = await fetch(`https://elrefugiocountryclub.com/api/api/horarios/personalizados/${userId}`);
            if (pResponse.ok) {
              const pData = await pResponse.json();
              setPersonalSchedule(pData);
            }
          } catch (pErr) {
            console.error('Error cargando horarios personalizados:', pErr);
          }
        }
      } catch (error) {
        console.error('Error cargando horarios:', error);
        setScheduleError(error.message);
        setDynamicSchedule(null);
      } finally {
        setLoadingSchedule(false);
      }
    };
    
    fetchSchedule();
  }, [className, userId]);
  
  // Notificar cuando cambie la semana
  useEffect(() => {
    if (onWeekChange) {
      const weekStart = new Date(currentDate);
      // Calcular el lunes de la semana actual correctamente
      const dayOfWeek = currentDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Si es domingo, retroceder 6 días
      weekStart.setDate(currentDate.getDate() - daysToMonday); // Lunes
      weekStart.setHours(12, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Domingo
      weekEnd.setHours(12, 0, 0, 0);
      
      // Solo llamar si la semana cambió
      const weekKey = `${weekStart.getTime()}-${weekEnd.getTime()}`;
      if (lastWeekRef.current !== weekKey) {
        lastWeekRef.current = weekKey;
        onWeekChange(weekStart, weekEnd);
      }
    }
  }, [currentDate, onWeekChange]);

  // Consultar disponibilidad de instructoras para los slots de la semana
  useEffect(() => {
    const fetchInstructorAvailability = async () => {
      if (!dynamicSchedule || !claseId) return;

      // Construir lista de slots para la semana
      const weekDates = getCurrentWeek(currentDate, 1);
      const dayNameToDate = {};
      weekDates.forEach(d => {
        const name = format(d, 'EEEE', { locale: es });
        const cap = name.charAt(0).toUpperCase() + name.slice(1);
        dayNameToDate[cap] = d;
      });

      const slotsToCheck = [];
      Object.keys(dynamicSchedule.horarios || {}).forEach((dayName) => {
        const date = dayNameToDate[dayName];
        if (!date) return;
        const dateStr = getDateString(date);
        const horariosDelDia = dynamicSchedule.horarios[dayName] || [];
        horariosDelDia.forEach(h => {
          slotsToCheck.push({ fecha: dateStr, hora: h.hora_inicio });
        });
      });

      if (slotsToCheck.length === 0) {
        setInstructorAvailabilityMap({});
        return;
      }

      try {
        const res = await fetch('https://elrefugiocountryclub.com/api/api/reservas/instructor-availability/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clase_id: claseId, slots: slotsToCheck })
        });
        if (!res.ok) throw new Error('Error al consultar disponibilidad de instructoras');
        const data = await res.json();
        const map = {};
        (data.results || []).forEach(r => {
          const key = `${r.fecha}|${r.hora}`;
          map[key] = r.disponibles;
        });
        setInstructorAvailabilityMap(map);
      } catch (err) {
        console.error('Error cargando disponibilidad de instructoras:', err);
        setInstructorAvailabilityMap({});
      }
    };

    fetchInstructorAvailability();
  }, [dynamicSchedule, currentDate, claseId]);

  // Cargar bloqueos administrativos vigentes para la semana visible
  // (NO depende de claseId — los bloqueos "Todas las clases" deben aplicar también)
  const [bloqueos, setBloqueos] = useState([]);
  useEffect(() => {
    const fetchBloqueos = async () => {
      const weekDates = getCurrentWeek(currentDate, 1);
      if (!weekDates || weekDates.length === 0) return;
      const fechaInicio = getDateString(weekDates[0]);
      const fechaFin = getDateString(weekDates[weekDates.length - 1]);
      try {
        const res = await fetch(
          `https://elrefugiocountryclub.com/api/api/bloqueos?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&solo_activos=1`
        );
        if (!res.ok) throw new Error('Error al cargar bloqueos');
        const data = await res.json();
        setBloqueos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error cargando bloqueos:', err);
        setBloqueos([]);
      }
    };
    fetchBloqueos();
  }, [currentDate]);

  // Ya no necesitamos cargar capacidades ajustadas por fecha
  // El endpoint /api/horarios/clase ya devuelve la capacidad ajustada según descansos fijos
  
  // Renders condicionales DESPUÉS de todos los hooks
  if (loadingSchedule) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>Cargando horarios...</div>
      </div>
    );
  }
  
  if (!dynamicSchedule || !dynamicSchedule.horarios) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#d32f2f' }}>
        <div>No se pudieron cargar los horarios desde la base de datos.</div>
        {scheduleError && <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{scheduleError}</div>}
      </div>
    );
  }

  // mapear los días configurados a las fechas reales de la semana actualmente seleccionada
  const weekDates = getCurrentWeek(currentDate, 1) // semana empezando el lunes
  const dayNameToDate = {}
  weekDates.forEach(d => {
    // obtener nombre del día con primera letra en mayúscula para coincidir con config.days
    const name = format(d, 'EEEE', { locale: es })
    const cap = name.charAt(0).toUpperCase() + name.slice(1)
    dayNameToDate[cap] = d
  })
  
  // Función para obtener los timeSlots correctos según el día (desde DB)
  const getTimeSlotsForDay = (dayName, realDate) => {
    const slotsMap = new Set();
    
    // 1. Horarios Generales (solo de 1 hora cuando SOLO_SLOTS_UNA_HORA está activo).
    //    Los slots de media hora del propio usuario se agregan en el paso 2 (personalizados).
    const horariosDelDia = dynamicSchedule.horarios[dayName];
    if (horariosDelDia && Array.isArray(horariosDelDia)) {
      horariosDelDia.forEach(h => {
        if (SOLO_SLOTS_UNA_HORA && !esSlotDeUnaHora(h)) return;
        slotsMap.add(h.hora_inicio);
      });
    }
    
    // 2. Horarios Personalizados
    if (realDate && personalSchedule.length > 0) {
      const slotDateStr = getDateString(realDate);
      const dayMapShort = {
        'Lunes': 'L', 'Martes': 'M', 'Miércoles': 'X', 'Jueves': 'J',
        'Viernes': 'V', 'Sábado': 'S', 'Domingo': 'D'
      };
      const diaCorto = dayMapShort[dayName];

      personalSchedule.forEach(hp => {
        if (hp.clase_nombre.toLowerCase() !== className.toLowerCase()) return;
        
        if (hp.tipo === 'fecha_especifica') {
          if (hp.fecha.split('T')[0] === slotDateStr) slotsMap.add(hp.hora_inicio);
        } else if (hp.tipo === 'recurrente') {
          if (hp.dia_semana === diaCorto) slotsMap.add(hp.hora_inicio);
        }
      });
    }
    
    return Array.from(slotsMap).sort();
  };
  
  // Función para obtener la capacidad correcta según el día y hora específica (desde DB)
  // La capacidad ya viene ajustada desde el backend según descansos fijos
  const getCapacityForSlot = (dayName, time, realDate) => {
    // Si es personalizado, capacidad = 1 (según requerimiento)
    const slotDateStr = realDate ? getDateString(realDate) : null;
    const dayMapShort = {
      'Lunes': 'L', 'Martes': 'M', 'Miércoles': 'X', 'Jueves': 'J',
      'Viernes': 'V', 'Sábado': 'S', 'Domingo': 'D'
    };
    const diaCorto = dayMapShort[dayName];

    const isPersonalized = personalSchedule.some(hp => {
      if (hp.clase_nombre.toLowerCase() !== className.toLowerCase()) return false;
      if (hp.hora_inicio !== time) return false;
      if (hp.tipo === 'fecha_especifica') {
        return hp.fecha.split('T')[0] === slotDateStr;
      } else if (hp.tipo === 'recurrente') {
        return hp.dia_semana === diaCorto;
      }
      return false;
    });

    if (isPersonalized) return 1;

    if (!dayNameToDate[dayName]) return claseCupoMax || 6;
    
    // Obtener capacidad desde la BD (ya viene ajustada para iniciación según descansos)
    const horariosDelDia = dynamicSchedule.horarios[dayName];
    if (horariosDelDia && Array.isArray(horariosDelDia)) {
      const horario = horariosDelDia.find(h => h.hora_inicio === time);
      if (horario && horario.capacidad) {
        return horario.capacidad; // Esta capacidad ya está ajustada para iniciación
      }
    }
    
    // Fallback a cupo máximo de la clase o 6
    return claseCupoMax || 6;
  };
  
  // bookings: solo las del usuario, para marcar los slots reservados
  const generateTimeSlots = (day, realDate) => {
    const slots = [];
    const timeSlots = getTimeSlotsForDay(day, realDate);
    const now = DateTime.now().setZone('America/Cancun');
    const slotDateStr = getDateString(realDate);

    const dayMapShort = {
      'Lunes': 'L', 'Martes': 'M', 'Miércoles': 'X', 'Jueves': 'J',
      'Viernes': 'V', 'Sábado': 'S', 'Domingo': 'D'
    };
    const diaCorto = dayMapShort[day];
    
    timeSlots.forEach((time) => {
      const slotId = `${day}-${time}`;
      
      // Obtener capacidad específica para este slot (ajustada para iniciación)
      const capacity = getCapacityForSlot(day, time, realDate);

      // Si es personalizado, marcarlo para visualización
      const matchingPersonalized = personalSchedule.find(hp => {
        if (hp.clase_nombre.toLowerCase() !== className.toLowerCase()) return false;
        if (hp.hora_inicio !== time) return false;
        if (hp.tipo === 'fecha_especifica') {
          return hp.fecha.split('T')[0] === slotDateStr;
        } else if (hp.tipo === 'recurrente') {
          return hp.dia_semana === diaCorto;
        }
        return false;
      });
      const isPersonalized = !!matchingPersonalized;
      const personalizedInstructorUnavailable = isPersonalized && matchingPersonalized.instructora_disponibilidad !== 'disponible';

      // Consultar disponibilidad de instructoras para este slot (siempre que exista el mapa)
      const availabilityKey = `${slotDateStr}|${time}`;
      const instructorasDisponibles = instructorAvailabilityMap[availabilityKey];

      // Descontar instructoras que ya están dando OTRA clase distinta (no iniciación/ponyclub) en
      // este mismo horario: no pueden impartir dos clases a la vez. Si están dando ESTA misma clase,
      // no se descuentan (el alumno se suma a su grupo hasta el cupo del horario).
      let ocupadasEnOtraClase = 0;
      if (DESCONTAR_INSTRUCTORAS_EN_OTRA_CLASE && Array.isArray(allWeekBookings)) {
        const idsOcupadas = new Set();
        allWeekBookings.forEach(b => {
          if (!b.fecha || !b.hora_inicio || !b.clase_nombre) return;
          if (b.fecha.split('T')[0] !== slotDateStr) return;
          if (b.hora_inicio.slice(0, 5) !== time) return;
          if (b.estatus !== 'pendiente' && b.estatus !== 'confirmada') return;
          const claseB = b.clase_nombre.toLowerCase();
          if (claseB === className.toLowerCase()) return;          // misma clase: no bloquea (agrupa)
          if (['iniciacion', 'ponyclub'].includes(claseB)) return; // iniciación/ponyclub no bloquean
          idsOcupadas.add(`${b.instructora_nombre || ''} ${b.instructora_apellido || ''}`.trim());
        });
        ocupadasEnOtraClase = idsOcupadas.size;
      }

      // Determinar bloqueo y capacidad efectiva basada en disponibilidad de instructoras
      let blockedByInstructor = false;
      let effectiveCapacity = capacity;

      if (typeof instructorasDisponibles === 'number') {
        const disponiblesReales = instructorasDisponibles - ocupadasEnOtraClase;
        if (disponiblesReales <= 0) {
          blockedByInstructor = true;
          effectiveCapacity = 0;
        } else if (isPersonalized) {
          // Reservas personalizadas: el cupo sigue limitado por instructoras (slot 1:1).
          effectiveCapacity = Math.min(capacity, disponiblesReales);
        } else {
          effectiveCapacity = capacity;
        }
      }
      
      // Calcular la hora de inicio del slot usando Luxon con zona horaria de Cancún
      const [hours, minutes] = time.split(':').map(Number);
      const slotStartTime = DateTime.fromJSDate(realDate)
        .setZone('America/Cancun')
        .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
      
      // Calcular duración de la clase (desde BD)
      const classDuration = dynamicSchedule.duracion || 60;
      const slotEndTime = slotStartTime.plus({ minutes: classDuration });
      
      // 🕐 FILTRO 1: Detectar si el slot ya pasó completamente
      const hasPassed = slotEndTime < now;
      
      // ⏰ FILTRO 2: Calcular si está dentro de las próximas 2 horas o ya está en curso
      // Plazo de reserva: mañana (< 12:00) cierra a las 9 PM del día anterior; tarde (≥ 12:00) cierra a la 1 PM del mismo día
      const esMañana = hours < 12;
      let isWithin2Hours;
      if (esMañana) {
        const limiteReserva = slotStartTime.minus({ days: 1 }).set({ hour: 21, minute: 0, second: 0, millisecond: 0 });
        isWithin2Hours = now > limiteReserva;
      } else {
        const limiteReserva = slotStartTime.set({ hour: 13, minute: 0, second: 0, millisecond: 0 });
        isWithin2Hours = now > limiteReserva;
      }
      const deadlineMessage = isWithin2Hours
        ? (esMañana ? 'Cierre 9:00 PM día anterior' : 'Cierre 1:00 PM mismo día')
        : null;

      // Filtrar reservas del usuario para este slot (ocupado si no está cancelada o cancelada por instructor)
      const slotBookings = userBookings.filter((b) => {
        // Excluir reservas canceladas (tanto por cliente como por instructor)
        if (b.estatus === 'cancelada' || b.estatus === 'cancelada_instructor') {
          return false;
        }
        if (b.timeSlotId && typeof b.timeSlotId === 'string') {
          return b.timeSlotId === slotId;
        }
        if (b.fecha && b.hora_inicio && b.clase_nombre && slotDateStr) {
          const reservaDateStr = b.fecha.split('T')[0];
          return (
            reservaDateStr === slotDateStr &&
            b.hora_inicio.slice(0,5) === time &&
            b.clase_nombre === className
          );
        }
        return false;
      });

      // Calcular reservas TOTALES ocupadas (solo 'pendiente' y 'confirmada') para el slot, ignorando las demás
      // Para slots personalizados: cada cliente tiene su propio cupo (capacity=1) independiente;
      // solo contar las reservas del propio usuario para no chocar con los personalizados de otros clientes.
      const totalBookingsForSlot = allWeekBookings.filter((b) => {
        if (b.fecha && b.hora_inicio && b.clase_nombre && slotDateStr) {
          const reservaDateStr = b.fecha.split('T')[0];
          const matchesSlot = (
            reservaDateStr === slotDateStr &&
            b.hora_inicio.slice(0,5) === time &&
            b.clase_nombre === className
          );
          const esEstatusValido = (b.estatus === 'pendiente' || b.estatus === 'confirmada');

          if (isPersonalized) {
            return matchesSlot && esEstatusValido && b.cliente_id === userId;
          }

          // Solo contar si el estatus es 'pendiente' o 'confirmada'
          return matchesSlot && esEstatusValido;
        }
        return false;
      }).length;

      // Buscar si el usuario tiene una reserva completada o cancelada en este slot
      let userStatus = null;
      let instructoraNombre = null;
      let motivoCancelacion = null;
      if (slotBookings.length > 0) {
        // Tomar la reserva más reciente (por id más alto)
        const userBooking = slotBookings.reduce((a, b) => (a.id > b.id ? a : b));
        userStatus = userBooking.estatus;
        instructoraNombre = userBooking.instructora_nombre || null;
        motivoCancelacion = userBooking.motivo_cancelacion || null;
      }

      const hour = parseInt(time.split(":")[0], 10);
      const isBlocked = userLevel === "Iniciación" && hour >= 17;

      // Bloqueo administrativo: ¿hay un bloqueo activo para esta fecha + turno + (clase o todas)?
      const turnoSlot = hours < 12 ? 'mañana' : 'tarde';
      const matchingBloqueo = bloqueos.find(b => {
        const bFecha = String(b.fecha || '').split('T')[0];
        if (bFecha !== slotDateStr) return false;
        if (b.turno !== turnoSlot) return false;
        return b.clase_id == null || b.clase_id === claseId;
      });
      const isAdminBlocked = !!matchingBloqueo;
      const blockMessage = isAdminBlocked
        ? (matchingBloqueo.motivo ? `Clases canceladas: ${matchingBloqueo.motivo}` : 'Clases canceladas')
        : null;

      // NO bloquear si está cancelada por instructor - la reserva se elimina y el slot queda disponible
      slots.push({
        id: slotId,
        day,
        date: realDate,
        time,
        capacity: effectiveCapacity,
        instructorasDisponibles: typeof instructorasDisponibles === 'number' ? instructorasDisponibles : null,
        blockedByInstructor,
        bookings: slotBookings,
        totalBooked: totalBookingsForSlot,
        isBlocked: blockedByInstructor || isBlocked || isWithin2Hours || hasPassed || isAdminBlocked, // Bloquear si: sin instructoras, iniciación tarde, <2h, ya pasó, bloqueo admin
        isWithin2Hours, // Flag específico para mensaje de plazo
        deadlineMessage, // Mensaje explicando qué plazo cerró
        hasPassed, // Flag específico para mensaje "clase finalizada"
        isAdminBlocked, // Flag: bloqueo administrativo (admin cerró este turno)
        blockMessage, // Mensaje del bloqueo admin (con motivo si lo tiene)
        userStatus, // nuevo: estatus de la reserva del usuario (si existe)
        instructoraNombre,
        motivoCancelacion, // motivo de cancelación si existe
        isPersonalized, // Flag para destacar visualmente
        personalizedInstructorUnavailable // Flag: instructor del horario personalizado no disponible
      });
    });
    return slots;
  };

  // Obtener todos los días únicos (generales + personalizados)
  const getAllDaysForClass = () => {
    const days = new Set();
    if (dynamicSchedule && dynamicSchedule.horarios) {
      Object.keys(dynamicSchedule.horarios).forEach(d => days.add(d));
    }
    
    // Añadir días con horarios personalizados
    const dayMapLong = {
      'L': 'Lunes', 'M': 'Martes', 'X': 'Miércoles', 'J': 'Jueves',
      'V': 'Viernes', 'S': 'Sábado', 'D': 'Domingo'
    };
    
    personalSchedule.forEach(hp => {
      if (hp.clase_nombre.toLowerCase() === className.toLowerCase()) {
        if (hp.tipo === 'recurrente' && hp.dia_semana) {
          days.add(dayMapLong[hp.dia_semana]);
        } else if (hp.tipo === 'fecha_especifica' && hp.fecha) {
          const dateStr = hp.fecha.split('T')[0];
          // Buscar qué día de la semana actual corresponde a esa fecha
          for (const [dayName, d] of Object.entries(dayNameToDate)) {
            if (getDateString(d) === dateStr) {
              days.add(dayName);
            }
          }
        }
      }
    });

    const order = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return order.filter(d => days.has(d));
  };

  const slotsByDay = getAllDaysForClass().map((day) => {
    const date = dayNameToDate[day];
    const todayStart = startOfDay(new Date());
    const isPast = date ? isBefore(date, todayStart) : false;
    
    // Bloquear entre semana para usuarios demo
    const dayOfWeek = date ? date.getDay() : -1;
    const isWeekdayForDemo = userType === 'demo' && dayOfWeek !== 0 && dayOfWeek !== 6;
    
    return {
      day,
      date,
      slots: generateTimeSlots(day, date).map((slot) => ({
        ...slot,
        isBlocked: Boolean(slot.isBlocked) || isPast || isWeekdayForDemo,
      })),
    };
  });

  return (
    <div className="wc-root">
      {/* Controles de navegación de semana */}
      
      {/* Leyenda: explicación visual rápida de los estados posibles */}
      <div className="wc-legend">
        <div className="wc-legend-item">
          <div className="wc-legend-box wc-legend-box--available"></div>
          <span className="wc-legend-text">Disponible</span>
        </div>

        <div className="wc-legend-item">
          <div className="wc-legend-box wc-legend-box--user"></div>
          <span className="wc-legend-text">Tu reserva</span>
        </div>
        
        <div className="wc-legend-item">
          <div className="wc-legend-box wc-legend-box--full"></div>
          <span className="wc-legend-text">Completo</span>
        </div>

        <div className="wc-legend-item">
          <div className="wc-legend-box wc-legend-box--deadline"></div>
          <span className="wc-legend-text">Plazo cerrado</span>
        </div>

        <div className="wc-legend-item">
          <div className="wc-legend-box" style={{ border: '2px dashed #c17b4a', backgroundColor: '#fff9f0' }}></div>
          <span className="wc-legend-text">Horario extra</span>
        </div>
       
      </div>

      {/* Grid del calendario: una columna por día en pantallas grandes, auto-fit en pantallas pequeñas */}
      <div className="wc-grid">
        {slotsByDay.map(({ day, date, slots }) => (
          <div key={day} className="wc-day">
            {/* Header del día: título, fecha y flechas de navegación por semana */}
            <div className="wc-day-header">
              <button
                className="wc-day-arrow wc-day-arrow--side wc-day-arrow--left"
                aria-label={`Semana anterior ${day}`}
                onClick={() => setCurrentDate((d) => addDays(d, -7))}
              >
                ◀
              </button>

              <div className="wc-day-header-main">
                <h3 className="wc-day-title">{day}</h3>
                {date && (
                  <div className="wc-day-date">{format(date, "d 'de' MMMM", { locale: es })}</div>
                )}
              </div>

              <button
                className="wc-day-arrow wc-day-arrow--side wc-day-arrow--right"
                aria-label={`Semana siguiente ${day}`}
                onClick={() => setCurrentDate((d) => addDays(d, 7))}
              >
                ▶
              </button>
            </div>

            {/* Grid de franjas para el día (2 columnas) */}
            <div className="wc-day-grid">
              {(() => {
                let morningHeaderInserted = false;
                let afternoonHeaderInserted = false;
                return slots.flatMap((slot) => {
                // Determina si el slot ya está reservado por este usuario (solo confirmada/pendiente)
                // Usar allWeekBookings en lugar de slot.bookings para tener acceso a cliente_id
                // Usar función helper para evitar problemas de zona horaria
                const slotDateStr = getDateString(slot.date);
                const isBookedByUser = allWeekBookings.some((b) => {
                  if (!b.fecha || !b.hora_inicio || !slotDateStr) return false;
                  
                  const reservaDateStr = b.fecha.split('T')[0];
                  const matchesSlot = (
                    reservaDateStr === slotDateStr &&
                    b.hora_inicio.slice(0,5) === slot.time &&
                    b.clase_nombre === className
                  );
                  
                  return matchesSlot && b.cliente_id === userId && (b.estatus === 'confirmada' || b.estatus === 'pendiente');
                });
                
                const card = (
                  <TimeSlotCard
                    key={slot.id}
                    time={slot.time}
                    capacity={slot.capacity}
                    bookedCount={slot.totalBooked}
                    isBookedByUser={isBookedByUser}
                    isBlocked={slot.isBlocked || false}
                    isWithin2Hours={slot.isWithin2Hours || false}
                    deadlineMessage={slot.deadlineMessage || null}
                    hasPassed={slot.hasPassed || false}
                    isAdminBlocked={slot.isAdminBlocked || false}
                    blockMessage={slot.blockMessage || null}
                    userStatus={slot.userStatus}
                    instructoraNombre={slot.instructoraNombre}
                    motivoCancelacion={slot.motivoCancelacion}
                    isPersonalized={slot.isPersonalized}
                    personalizedInstructorUnavailable={slot.personalizedInstructorUnavailable}
                    onClick={() => onSlotClick(slot)}
                  />
                );
                const items = [];
                const slotHour = parseInt(slot.time);
                if (slotHour < 12 && !morningHeaderInserted) {
                  morningHeaderInserted = true;
                  items.push(<div key="wc-morning-header" className="wc-group-header">Clases de mañana · reservas hasta las 9:00 PM del día anterior</div>);
                } else if (slotHour >= 12 && !afternoonHeaderInserted) {
                  afternoonHeaderInserted = true;
                  items.push(<div key="wc-afternoon-header" className="wc-group-header">Clases de tarde · reservas hasta la 1:00 PM del mismo día</div>);
                }
                items.push(card);
                return items;
              }); })()}
            </div>
          </div>
        ))}
      </div>

      {/* Notas informativas condicionales según el nivel del usuario */}
      
      {userLevel === "Iniciación" && (
        <div className="wc-notes wc-notes--iniciacion">
          <p className="wc-note-text"><span className="wc-note-strong">Nota:</span> Los horarios a partir de las 17:00 están bloqueados para el nivel Iniciación.</p>
        </div>
      )}
    </div>
  );
}