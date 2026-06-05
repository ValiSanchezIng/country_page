import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';

// Función helper para obtener fecha en formato YYYY-MM-DD sin problemas de zona horaria
// Usa métodos locales (getFullYear, getMonth, getDate) que no se ven afectados por UTC
const getDateString = (date) => {
  if (!date) return null;
  // Si es un objeto Date, extraer año, mes y día directamente usando métodos locales
  if (date instanceof Date) {
    // Verificar que el Date sea válido
    if (isNaN(date.getTime())) {
      console.error('Fecha inválida:', date);
      return null;
    }
    // Usar métodos locales que no se ven afectados por conversiones UTC
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() devuelve 0-11
    const day = date.getDate();
    
    // Formatear con padding
    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    
    const result = `${year}-${monthStr}-${dayStr}`;
    
    // Debug: verificar que la fecha sea correcta
    console.log('🔍 getDateString:', {
      date,
      year,
      month,
      day,
      result,
      dateString: date.toString(),
      toISOString: date.toISOString(),
      toLocaleDateString: date.toLocaleDateString('es-MX')
    });
    
    return result;
  }
  // Si ya es un string, devolverlo (asumiendo formato YYYY-MM-DD)
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return null;
};

// Componentes del calendario
import { WeeklyCalendar } from './calendario/weekly-calendar';
import { CalendarHeader } from './calendario/calendar-header';
import { BookingModal } from './calendario/booking-modal';
import { SessionUpdateModal } from './calendario/session-update-modal';

// Contexto
// import { BookingProvider, useBookings } from './calendario/lib/booking-context';
import { fetchUserBookings, createBooking, fetchWeekBookings, cancelBooking } from './calendario/booking-api';
import { fetchClasses } from './calendario/booking-classes-api';
import '../CSS/MenuCalendario.css'
import ReservacionTabla from './calendario/reservacion_tabla'
import ChangePasswordModal from './calendario/change-password-modal'

function CalendarContent({ userLevel, userId, userName, userType, onLogout, onChangePassword }) {
  const [userBookings, setUserBookings] = useState([]);
  const [allWeekBookings, setAllWeekBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sessionModal, setSessionModal] = useState({ isOpen: false, type: null });
  const [currentWeek, setCurrentWeek] = useState({ start: null, end: null });
  
  // Función para cargar reservas de una semana específica
  const loadWeekBookings = useCallback(async (weekStart, weekEnd) => {
    try {
      const fechaInicio = getDateString(weekStart);
      const fechaFin = getDateString(weekEnd);
      const weekData = await fetchWeekBookings(fechaInicio, fechaFin, userId);
      setAllWeekBookings(weekData);
      setCurrentWeek({ start: weekStart, end: weekEnd });
    } catch (e) {
      console.error('Error al cargar reservas de la semana:', e);
    }
  }, [userId]);

  useEffect(() => {
    async function loadBookings() {
      setLoading(true);
      try {
        const data = await fetchUserBookings(userId);
        setUserBookings(data);
        
        // Cargar todas las reservas de la semana para calcular disponibilidad
        const today = new Date();
        today.setHours(12, 0, 0, 0); // Establecer a mediodía para evitar problemas de zona horaria
        const weekStart = new Date(today);
        // Calcular el lunes de la semana actual correctamente
        const dayOfWeekToday = today.getDay();
        const daysToMondayToday = dayOfWeekToday === 0 ? 6 : dayOfWeekToday - 1;
        weekStart.setDate(today.getDate() - daysToMondayToday); // Lunes
        weekStart.setHours(12, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Domingo
        weekEnd.setHours(12, 0, 0, 0);
        
        // Usar getDateString en lugar de toISOString para evitar problemas de zona horaria
        const fechaInicio = getDateString(weekStart);
        const fechaFin = getDateString(weekEnd);
        
        const weekData = await fetchWeekBookings(fechaInicio, fechaFin, userId);
        setAllWeekBookings(weekData);
        setCurrentWeek({ start: weekStart, end: weekEnd });
      } catch (e) {
        toast.error('Error al cargar tus reservas');
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [userId]);

  useEffect(() => {
    async function loadClasses() {
      try {
        const data = await fetchClasses();
        setClasses(data);
      } catch (e) {
        toast.error('Error al cargar clases');
      }
    }
    loadClasses();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    try {
      await cancelBooking(bookingId, userId);
      toast.info('Reserva cancelada', {
        position: "top-right",
        autoClose: 3000,
      });
      // Refresca reservas
      const data = await fetchUserBookings(userId);
      setUserBookings(data);
      // Refresca reservas de la semana
      const today = new Date();
      today.setHours(12, 0, 0, 0); // Establecer a mediodía para evitar problemas de zona horaria
      const weekStart = new Date(today);
      // Calcular el lunes de la semana actual correctamente
      const dayOfWeekToday = today.getDay();
      const daysToMondayToday = dayOfWeekToday === 0 ? 6 : dayOfWeekToday - 1;
      weekStart.setDate(today.getDate() - daysToMondayToday);
      weekStart.setHours(12, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(12, 0, 0, 0);
      
      // Usar getDateString en lugar de toISOString para evitar problemas de zona horaria
      const fechaInicio = getDateString(weekStart);
      const fechaFin = getDateString(weekEnd);
      const weekData = await fetchWeekBookings(fechaInicio, fechaFin, userId);
      setAllWeekBookings(weekData);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al cancelar reserva');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  // Mapeo de nivel a nombre de clase permitida
  const nivelToClase = {
    'iniciacion': ['iniciacion'],
    'ponyclub': ['ponyclub'],
    'intermedio': ['intermedio'],
    'avanzado': ['avanzado'], // Solo clase de salto para usuarios avanzados
    'paseo': ['paseo'],
  };

  // Filtra clases según el nivel del usuario (normalizar a minúsculas)
  const userLevelNormalized = userLevel ? userLevel.toLowerCase() : '';
  const allowedClassNames = nivelToClase[userLevelNormalized] || [];
  const allowedClasses = classes.filter(clase => allowedClassNames.includes(clase.nombre));

  // Mantiene la clase seleccionada en el slot
  const [selectedClass, setSelectedClass] = useState(null);

  const handleSlotClick = (slot, clase) => {
    // Restricción para tipo demo: solo fines de semana
    if (userType === 'demo') {
      const dayOfWeek = slot.date ? slot.date.getDay() : -1;
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = domingo, 6 = sábado
        toast.warning('Los usuarios demo solo pueden reservar fines de semana', {
          position: "top-right",
          autoClose: 4000,
        });
        return;
      }
    }

    // Restricción para media_renta: máximo 3 reservas activas
    if (userType === 'media_renta') {
      const reservasActivas = userBookings.filter(b => 
        b.estatus === 'pendiente' || b.estatus === 'confirmada'
      ).length;
      if (reservasActivas >= 3) {
        toast.warning('Has alcanzado el límite de 3 reservas activas', {
          position: "top-right",
          autoClose: 4000,
        });
        return;
      }
    }

    setSelectedSlot(slot);
    setSelectedClass(clase);
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !selectedClass) return;
    
    // VALIDACIÓN DE USUARIO: Verificar que los datos del sessionStorage coincidan con la BD
    try {
      const userLocal = JSON.parse(sessionStorage.getItem('user'));
      const userIdLocal = userLocal?.id;
      const nombreLocal = userLocal?.nombre;

      if (!userIdLocal || !nombreLocal) {
        throw new Error('Datos de sesión incompletos');
      }

      // Consultar el usuario en el backend
      const res = await fetch(`https://elrefugiocountryclub.com/api/api/users/${userIdLocal}`);
      
      console.log('🌐 Response status:', res.status);
      console.log('🌐 Response ok:', res.ok);
      
      // Si el usuario no existe en la BD (404), desloguear
      if (res.status === 404 || !res.ok) {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('user');
        setSessionModal({ isOpen: true, type: 'sessionExpired' });
        return;
      }

      const userBD = await res.json();
      console.log('📦 userBD completo:', userBD);

      // El backend devuelve {usuario: {...}, pagos: [...]}
      const usuarioBD = userBD.usuario;
      
      // Si no existe el objeto usuario, desloguear
      if (!usuarioBD) {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('user');
        setSessionModal({ isOpen: true, type: 'sessionExpired' });
        return;
      }
      
      const nombreBD = usuarioBD?.nombre;
      const tipoNivelBD = usuarioBD?.tipo_nivel;

      // Debug: Ver qué se está comparando
      console.log('🔍 VALIDACIÓN DE USUARIO:');
      console.log('   sessionStorage nombre:', nombreLocal);
      console.log('   BD nombre:', nombreBD);
      console.log('   sessionStorage tipo_nivel:', userLocal?.tipo_nivel);
      console.log('   BD tipo_nivel:', tipoNivelBD);

      // Comparar nombre - si no coincide, desloguear (cambio de usuario)
      if (nombreBD !== nombreLocal) {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('user');
        setSessionModal({ isOpen: true, type: 'sessionExpired' });
        return;
      }

      // Comparar tipo_nivel - si no coincide, actualizar sessionStorage y refrescar
      if (tipoNivelBD !== userLocal?.tipo_nivel) {
        console.log('⚠️ tipo_nivel desactualizado, actualizando sessionStorage...');
        
        // Actualizar sessionStorage con todos los datos frescos del backend
        const usuarioActualizado = {
          id: usuarioBD.id,
          nombre: usuarioBD.nombre,
          rol: usuarioBD.rol,
          estatus: usuarioBD.estatus,
          tipo_cliente: usuarioBD.tipo_cliente,
          tipo_nivel: usuarioBD.tipo_nivel
        };
        
        sessionStorage.setItem('user', JSON.stringify(usuarioActualizado));
        
        setSessionModal({ isOpen: true, type: 'levelUpdate' });
        
        return;
      }
    } catch (error) {
      console.error('Error en validación de usuario:', error);
      
      // Eliminar específicamente el usuario del storage
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('user');
      
      setSessionModal({ isOpen: true, type: 'sessionError' });
      
      return;
    }

    // Extraer la fecha real del slot seleccionado sin problemas de zona horaria
    const slotDate = selectedSlot.date; // Ya viene del WeeklyCalendar
    const fechaISO = getDateString(slotDate);
    
    if (!fechaISO) {
      toast.error('Error al obtener la fecha del slot');
      closeModal();
      return;
    }
    
    const [day, time] = selectedSlot.id.split('-');
    try {
      const reservaCreada = await createBooking({
        cliente_id: userId,
        clase_id: selectedClass.id,
        fecha: fechaISO, // Fecha real calculada del slot
        hora_inicio: time + ':00',
      });
      
      // El email de confirmación se envía automáticamente desde el backend
      
      toast.success(`Reserva confirmada para ${selectedSlot.day} a las ${selectedSlot.time}`, {
        position: "top-right",
        autoClose: 3000,
      });
      
      // Esperar un momento para que el backend procese la reserva
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresca reservas del usuario
      const data = await fetchUserBookings(userId);
      setUserBookings(data);
      
      // Refrescar también las reservas de la semana basándose en la fecha del slot seleccionado
      // Esto asegura que se actualice la semana correcta que se está mostrando en el calendario
      // Usar getDateString para evitar problemas de zona horaria
      const slotDateForWeek = slotDate || new Date();
      const weekStart = new Date(slotDateForWeek);
      // Calcular el lunes de la semana actual
      // Si es domingo (getDay() = 0), retroceder 6 días para llegar al lunes
      // Si es lunes (getDay() = 1), no hacer nada
      // Si es martes (getDay() = 2), retroceder 1 día, etc.
      const dayOfWeek = slotDateForWeek.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Si es domingo, retroceder 6 días
      weekStart.setDate(slotDateForWeek.getDate() - daysToMonday); // Lunes de la semana actual
      weekStart.setHours(12, 0, 0, 0); // Establecer a mediodía para evitar problemas de zona horaria
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Domingo
      weekEnd.setHours(12, 0, 0, 0); // Establecer a mediodía
      
      // Usar getDateString en lugar de toISOString para evitar problemas de zona horaria
      const fechaInicio = getDateString(weekStart);
      const fechaFin = getDateString(weekEnd);
      
      const weekData = await fetchWeekBookings(fechaInicio, fechaFin, userId);
      setAllWeekBookings(weekData);
    } catch (error) {
      // DEBUG: Ver qué está llegando
      console.log('=== ERROR CAPTURADO ===');
      console.log('error completo:', error);
      console.log('error.response:', error.response);
      console.log('error.response?.data:', error.response?.data);
      console.log('error.message:', error.message);
      console.log('======================');
      
      // Manejar errores del backend con mensajes descriptivos
      if (error.response && error.response.data) {
        const { error: errorMsg, razon } = error.response.data;
        
        // Si el error es "Cliente no encontrado", significa que el ID en sessionStorage no existe en la BD
        if (errorMsg === 'Cliente no encontrado') {
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('user');
          closeModal();
          setSessionModal({ isOpen: true, type: 'sessionExpired' });
          return;
        }
        
        // Si hay una razón específica, mostrarla
        if (razon) {
          toast.warning(`${errorMsg}: ${razon}`, {
            position: "top-right",
            autoClose: 5000,
          });
        } else {
          // Mostrar solo el mensaje de error
          toast.error(errorMsg || 'No se pudo crear la reserva', {
            position: "top-right",
            autoClose: 4000,
          });
        }
      } else {
        // Error genérico si no hay respuesta del servidor
        toast.error('No se pudo crear la reserva. Intenta de nuevo.', {
          position: "top-right",
          autoClose: 3000,
        });
      }
      
      // Refrescar los datos de la semana para mostrar información actualizada
      try {
        console.log('🔄 Refrescando datos de la semana después del error de reserva...');
        
        let weekStart, weekEnd;
        if (currentWeek.start && currentWeek.end) {
          // Refrescar la semana que se está mostrando actualmente
          weekStart = new Date(currentWeek.start);
          weekEnd = new Date(currentWeek.end);
          console.log('📅 Refrescando semana actual mostrada:', getDateString(weekStart), getDateString(weekEnd));
        } else {
          // Fallback: refrescar la semana del slot seleccionado
          const slotDateForWeek = selectedSlot.date || new Date();
          weekStart = new Date(slotDateForWeek);
          const dayOfWeek = slotDateForWeek.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          weekStart.setDate(slotDateForWeek.getDate() - daysToMonday);
          weekStart.setHours(12, 0, 0, 0);
          weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(12, 0, 0, 0);
          console.log('📅 Refrescando semana del slot:', getDateString(weekStart), getDateString(weekEnd));
        }
        
        const fechaInicio = getDateString(weekStart);
        const fechaFin = getDateString(weekEnd);
        
        const weekData = await fetchWeekBookings(fechaInicio, fechaFin, userId);
        console.log('📊 Nuevos datos de semana:', weekData);
        setAllWeekBookings(weekData);
        console.log('✅ allWeekBookings actualizado después del error');
      } catch (refreshError) {
        console.error('❌ Error al refrescar datos después del error de reserva:', refreshError);
      }
    }
    closeModal();
  };

  const handleCancel = async () => {
    if (!selectedSlot) return;
    
    // Buscar la reserva del usuario primero en userBookings, luego en allWeekBookings como respaldo
    let booking = userBookings.find((b) => {
      // Solo buscar reservas activas (pendiente o confirmada)
      if (b.estatus !== 'pendiente' && b.estatus !== 'confirmada') {
        return false;
      }
      // Para reservas dummy
      if (b.timeSlotId && typeof b.timeSlotId === 'string') {
        return b.timeSlotId === selectedSlot.id;
      }
      // Para reservas reales: comparar fecha y hora exacta
      if (b.fecha && b.hora_inicio && selectedSlot.date && selectedSlot.time) {
        const fechaReserva = new Date(b.fecha).toISOString().split('T')[0];
        const fechaSlot = selectedSlot.date instanceof Date
          ? selectedSlot.date.toISOString().split('T')[0]
          : selectedSlot.date.split('T')[0];
        return fechaReserva === fechaSlot && b.hora_inicio.slice(0,5) === selectedSlot.time;
      }
      return false;
    });
    
    // Si no se encuentra en userBookings, buscar en allWeekBookings
    if (!booking && selectedSlot.date && selectedSlot.time) {
      const fechaSlot = selectedSlot.date instanceof Date
        ? selectedSlot.date.toISOString().split('T')[0]
        : selectedSlot.date.split('T')[0];
      
      booking = allWeekBookings.find((b) => {
        // Solo buscar reservas activas del usuario
        if (b.cliente_id !== userId || (b.estatus !== 'pendiente' && b.estatus !== 'confirmada')) {
          return false;
        }
        if (b.fecha && b.hora_inicio) {
          const fechaReserva = b.fecha.split('T')[0];
          return fechaReserva === fechaSlot && b.hora_inicio.slice(0,5) === selectedSlot.time;
        }
        return false;
      });
    }
    
    if (booking && booking.id) {
      try {
        await handleCancelBooking(booking.id);
      } catch (error) {
        // El error ya se maneja en handleCancelBooking
        console.error('Error al cancelar reserva:', error);
      }
    } else {
      toast.error('No se encontró la reserva para cancelar', {
        position: "top-right",
        autoClose: 3000,
      });
    }
    closeModal();
  };

  // Determina si el usuario ya reservó ese slot (solo confirmada/pendiente)
  const isBookedByUser = selectedSlot
    ? userBookings.some(b => {
        // Excluir reservas canceladas (incluyendo cancelada_instructor) o completadas
        if (b.estatus === 'cancelada' || b.estatus === 'cancelada_instructor' || b.estatus === 'completada') {
          return false;
        }
        // Para reservas dummy
        if (b.timeSlotId && typeof b.timeSlotId === 'string') {
          return b.timeSlotId === selectedSlot.id;
        }
        // Para reservas reales: comparar fecha y hora exacta
        if (b.fecha && b.hora_inicio && selectedSlot.date && selectedSlot.time) {
          const fechaReserva = new Date(b.fecha).toISOString().split('T')[0];
          const fechaSlot = selectedSlot.date instanceof Date
            ? selectedSlot.date.toISOString().split('T')[0]
            : selectedSlot.date.split('T')[0];
          return fechaReserva === fechaSlot && b.hora_inicio.slice(0,5) === selectedSlot.time;
        }
        return false;
      })
    : false;

  // Determina si el usuario ya tiene reserva ese día (solo confirmada/pendiente)
  // Excepto para propietario, renta y media_renta que pueden tener múltiples reservas por día
  // Para clientes tipo general: si tiene cualquier reserva pendiente o confirmada, deshabilitar todos los slots
  // Excepción: el usuario con id 8 puede tener múltiples reservas (bypass)
  const isExceptionUser = String(userId) === '8';

  const hasBookingForDayComputed = userType === 'general'
    ? userBookings.some(b => b.estatus === 'pendiente' || b.estatus === 'confirmada')
    : selectedSlot && userType !== 'propietario' && userType !== 'renta' && userType !== 'media_renta'
      ? userBookings.some(b => {
          if (b.estatus === 'cancelada' || b.estatus === 'cancelada_instructor' || b.estatus === 'completada') {
            return false;
          }
          if (b.timeSlotId && typeof b.timeSlotId === 'string') {
            return b.timeSlotId.split('-')[0] === selectedSlot.id.split('-')[0];
          }
          if (b.fecha && selectedSlot.date) {
            const fechaReserva = new Date(b.fecha).toISOString().split('T')[0];
            const fechaSlot = selectedSlot.date instanceof Date
              ? selectedSlot.date.toISOString().split('T')[0]
              : selectedSlot.date.split('T')[0];
            return fechaReserva === fechaSlot;
          }
          return false;
        })
      : false;

  const hasBookingForDay = isExceptionUser ? false : hasBookingForDayComputed;

  // Simula la regla de 24h (debería venir del backend)
  // Actualmente es un stub; mantener la computed variable para futuro soporte.
  const hasBookingWithin24hComputed = false;
  // Aplicar excepción para usuario 8: permitir crear reservas aunque tenga reserva dentro de 24h
  const hasBookingWithin24h = isExceptionUser ? false : hasBookingWithin24hComputed;

  return (
    <>
      <CalendarHeader
        clientName={userName}
        level={userLevel}
        onLogout={onLogout}
        onChangePassword={onChangePassword}
      />

      <div className="mc-container">
        <div className="mc-header">
          <h2 className="mc-title">Reserva tu clase</h2>
          <p className="mc-subtitle">Selecciona un horario disponible para reservar tu clase.</p>

          {/* Alerta in-app: reservas dentro de las próximas 2 horas (recordatorio para confirmar) */}
          {(() => {
            const ahora = new Date();
            const proximas = (userBookings || []).filter(b => {
              if (b.estatus !== 'pendiente' && b.estatus !== 'confirmada') return false;
              if (!b.fecha || !b.hora_inicio) return false;
              const fechaStr = new Date(b.fecha).toISOString().split('T')[0];
              const inicio = new Date(`${fechaStr}T${b.hora_inicio.slice(0, 8)}`);
              const diffMin = (inicio - ahora) / 60000;
              return diffMin > 0 && diffMin <= 120;
            });
            if (proximas.length === 0) return null;
            return (
              <div style={{ marginTop: 12, padding: '10px 16px', background: '#fff3cd', borderRadius: 8, border: '2px solid #ffc107' }}>
                <p style={{ margin: 0, fontSize: '0.95em', color: '#856404' }}>
                  ⏰ <strong>Recordatorio:</strong> tienes {proximas.length === 1 ? 'una clase' : `${proximas.length} clases`} en menos de 2 horas
                  {proximas[0].hora_inicio ? ` (próxima a las ${proximas[0].hora_inicio.slice(0, 5)})` : ''}. Confirma tu asistencia o cancela para liberar el espacio.
                </p>
              </div>
            );
          })()}

          {/* Indicador visual de tipo de cliente */}
          {userType && userType !== 'general' && (
            <div style={{ 
              marginTop: 12, 
              padding: '10px 16px', 
              background: 
                userType === 'propietario' ? '#d4edda' :
                userType === 'renta' ? '#d1ecf1' :
                userType === 'media_renta' ? '#fff3cd' :
                userType === 'demo' ? '#f8d7da' : '#f5f1e8',
              borderRadius: 8, 
              border: `2px solid ${
                userType === 'propietario' ? '#28a745' :
                userType === 'renta' ? '#17a2b8' :
                userType === 'media_renta' ? '#ffc107' :
                userType === 'demo' ? '#dc3545' : '#d4c4b0'
              }`,
              display: 'inline-block'
            }}>
              <p style={{ margin: 0, fontSize: '0.95em', fontWeight: 600, color: '#333' }}>
                Tipo de cuenta: <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {userType === 'propietario' ? 'Propietario' :
                   userType === 'renta' ? 'Renta' :
                   userType === 'media_renta' ? 'Media Renta' :
                   userType === 'demo' ? 'Demo' : userType}
                </span>
              </p>
            </div>
          )}
          
          {/* Mostrar contador de reservas para media_renta */}
          {userType === 'media_renta' && (
            <div style={{ marginTop: 8, padding: '8px 16px', background: '#f5f1e8', borderRadius: 8, border: '1px solid #d4c4b0' }}>
              <p style={{ margin: 0, fontSize: '0.95em', color: '#6b4423' }}>
                <strong>Reservas activas:</strong> {userBookings.filter(b => b.estatus === 'pendiente' || b.estatus === 'confirmada').length} / 3
              </p>
            </div>
          )}
          {/* Mensaje informativo para demo */}
          {userType === 'demo' && (
            <div style={{ marginTop: 8, padding: '8px 16px', background: '#fff3cd', borderRadius: 8, border: '1px solid #ffc107' }}>
              <p style={{ margin: 0, fontSize: '0.95em', color: '#856404' }}>
                <strong>Usuario Demo:</strong> Solo puedes reservar clases los fines de semana.
              </p>
            </div>
          )}
        </div>
        {/* Panel lateral / sección con las reservas del usuario (componente separado) */}
        <ReservacionTabla userBookings={userBookings} onCancelBooking={handleCancelBooking} />
        {/* Renderiza una tarjeta de calendario por cada clase permitida */}
        {allowedClasses.map(clase => {
          return (
            <div key={clase.id} style={{ marginBottom: 32, border: '1px solid #ccc', borderRadius: 8, padding: 16 }}>
              <h3 style={{ marginBottom: 8 }}>
                {clase.nombre.charAt(0).toUpperCase() + clase.nombre.slice(1)}
              </h3>
              <WeeklyCalendar
                userLevel={userLevel}
                userId={userId}
                userType={userType}
                onSlotClick={slot => handleSlotClick(slot, clase)}
                userBookings={userBookings}
                allWeekBookings={allWeekBookings}
                className={clase.nombre}
                claseCupoMax={clase.cupo_max}
                claseId={clase.id}
                onWeekChange={loadWeekBookings}
              />
            </div>
          );
        })}
      </div>

      <BookingModal
        slot={selectedSlot}
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isBookedByUser={isBookedByUser}
        hasBookingForDay={hasBookingForDay}
        hasBookingWithin24h={hasBookingWithin24h}
        userName={userName}
      />

      <SessionUpdateModal 
        isOpen={sessionModal.isOpen}
        type={sessionModal.type}
        onClose={() => {
          if (sessionModal.type === 'levelUpdate') {
            window.location.reload();
          } else {
            window.location.href = '/login';
          }
        }}
      />
    </>
  );
}



function MenuCalendario() {
  // Estado del usuario (esto vendría de tu sistema de autenticación)
  // Obtiene los datos reales del usuario desde sessionStorage
  const [userLevel, setUserLevel] = useState(() => {
    const user = sessionStorage.getItem('user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        // Ajusta la clave según cómo guardes el nivel en el objeto usuario
        return parsed.tipo_nivel || parsed.nivel || parsed.level || 'Intermedio';
      } catch {
        return 'Intermedio';
      }
    }
    return 'Intermedio';
  });
  const [userId] = useState(() => {
    // Ajusta la clave según cómo guardes el usuario en sessionStorage
    const user = sessionStorage.getItem('user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        return parsed.id || parsed.userId || 1; // fallback a 1 si no existe
      } catch {
        return 1;
      }
    }
    return 1;
  });
  const [userName] = useState(() => {
    const user = sessionStorage.getItem('user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        return parsed.nombre || parsed.name || 'Usuario';
      } catch {
        return 'Usuario';
      }
    }
    return 'Usuario';
  });
  const [userType] = useState(() => {
    const user = sessionStorage.getItem('user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        return parsed.tipo_cliente || 'general'; // propietario, renta, media_renta, demo, general
      } catch {
        return 'general';
      }
    }
    return 'general';
  });
  const [isChangeOpen, setIsChangeOpen] = useState(false);

  // Monitor de cambios de nivel en tiempo real
    useEffect(() => {
      if (!userId || !sessionStorage.getItem('user')) return;

      const checkUserLevel = async () => {
        if (!sessionStorage.getItem('user')) return;

        try {
          const response = await fetch(`https://elrefugiocountryclub.com/api/api/users/${userId}`);
          if (!response.ok) return;

          const data = await response.json();
          const userDB = data.usuario;
          if (!userDB) return;

          const newLevel = userDB.tipo_nivel;

          if (newLevel && newLevel !== userLevel) {
            const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
            sessionStorage.setItem('user', JSON.stringify({
              ...currentUser,
              id: userDB.id,
              nombre: userDB.nombre,
              rol: userDB.rol,
              estatus: userDB.estatus,
              tipo_cliente: userDB.tipo_cliente,
              tipo_nivel: userDB.tipo_nivel
            }));

            setUserLevel(newLevel);

            toast.info(`Tu nivel ha sido actualizado a: ${newLevel}`, {
              position: "top-center",
              autoClose: 4000,
            });
          }
        } catch (error) {
          // Silencioso
        }
      };

      // Polling cada 30s (solo si la pestaña está visible)
      const intervalId = setInterval(() => {
        if (!document.hidden) checkUserLevel();
      }, 30000);

      // Checar inmediatamente al volver a la pestaña/app
      const handleVisibility = () => {
        if (!document.hidden) checkUserLevel();
      };
      document.addEventListener('visibilitychange', handleVisibility);

      // Checar al hacer focus en la ventana (ej: alt-tab de vuelta)
      const handleFocus = () => checkUserLevel();
      window.addEventListener('focus', handleFocus);

      // Cambios desde otras pestañas
      const handleStorageChange = (e) => {
        if (e.key === 'user') {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed?.tipo_nivel && parsed.tipo_nivel !== userLevel) {
              setUserLevel(parsed.tipo_nivel);
            }
          } catch {}
        }
      };
      window.addEventListener('storage', handleStorageChange);

      return () => {
        clearInterval(intervalId);
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('storage', handleStorageChange);
      };
    }, [userId, userLevel]);

  const handleLogout = () => {
    console.log("Cerrando sesión...");
    // Limpiar datos de sesión
    sessionStorage.clear();
    sessionStorage.clear();
    // Redirigir al login
    window.location.href = "/login";
  };

  return (
    <div className="mc-root">
      <CalendarContent 
        userLevel={userLevel}
        userId={userId}
        userName={userName}
        userType={userType}
        onLogout={handleLogout}
        onChangePassword={() => setIsChangeOpen(true)}
      />
      <ChangePasswordModal 
        isOpen={isChangeOpen} 
        onClose={() => setIsChangeOpen(false)} 
      />
      <ToastContainer />
    </div>
  );
}

export default MenuCalendario;