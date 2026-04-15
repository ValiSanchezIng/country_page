import { useState, useEffect, useMemo, useCallback } from "react"
import { obtenerClasesInstructora, actualizarAsistencia, obtenerUsuarioActual, obtenerCaballosPorNivel, obtenerCaballosDisponiblesParaHorario, asignarCaballo, invalidarCacheDisponibles } from "./instructor-api"
import Toast from "./Toast"

export default function InstructorDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [activeView, setActiveView] = useState("today")
  const [selectedClass, setSelectedClass] = useState(null)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [showDateClasses, setShowDateClasses] = useState(false)
  const [dateClasses, setDateClasses] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [instructoraInfo, setInstructoraInfo] = useState(null)
  const [caballosPorNivel, setCaballosPorNivel] = useState({}) // Cache simple por nivel
  const [toast, setToast] = useState(null) // Toast discreto para advertencias

  // Obtener la fecha de hoy solo una vez
  const today = useMemo(() => {
    const fechaHoy = new Date().toISOString().split('T')[0];
    console.log('📅 Fecha de hoy calculada:', fechaHoy);
    return fechaHoy;
  }, []);

  // useEffect para cargar los datos de la instructora al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Obtener el usuario del localStorage
        const usuario = obtenerUsuarioActual()
        
        console.log('🔍 Usuario del localStorage:', usuario)
        
        if (!usuario || !usuario.id) {
          throw new Error('No se encontró información de usuario')
        }
        
        console.log(`📞 Llamando API con usuario_id: ${usuario.id}`)
        
        // Obtener las clases de la instructora
        const { instructora, clases } = await obtenerClasesInstructora(usuario.id)
        
        console.log('📋 Datos recibidos del servidor:', { instructora, clases })
        console.log('🎯 Cantidad de clases:', clases.length)
        console.log('🔍 Clases detalladas:', clases.map(c => ({ 
          id: c.id, 
          date: c.date, 
          status: c.status, 
          student: c.student 
        })))
        
        setInstructoraInfo(instructora)
        setClasses(clases)
        
        // Quitamos el prefetch para evitar N+1 de actividades; todo vendrá de /caballos/disponibles
        
      } catch (err) {
        console.error('Error al cargar datos:', err)
        setError(err.message)
        // Si hay error, cargar datos de ejemplo para desarrollo
        setClasses([
          {
            id: 1,
            type: "Iniciación",
            date: "2025-11-07",
            time: "09:00",
            horse: "Luna",
            student: "Estudiante de ejemplo",
            studentAge: 10,
            status: "confirmada",
            attendance: "pendiente",
            level: "Principiante",
          }
        ])
      } finally {
        setLoading(false)
      }
    }
    
    cargarDatos()
  }, [])

  const todayClasses = classes.filter(c => c.date === today)
  console.log(`📅 Clases de hoy (${today}):`, todayClasses.length, todayClasses.map(c => ({ id: c.id, status: c.status, student: c.student })));
  
  const weekClasses = classes.filter(c => {
    // Comparar fechas directamente como strings (YYYY-MM-DD)
    const [cYear, cMonth, cDay] = c.date.split('-').map(Number);
    const classDate = new Date(cYear, cMonth - 1, cDay);
    
    const [tYear, tMonth, tDay] = today.split('-').map(Number);
    const todayDate = new Date(tYear, tMonth - 1, tDay);
    
    const weekFromNow = new Date(todayDate);
    weekFromNow.setDate(todayDate.getDate() + 7);
    
    return classDate >= todayDate && classDate <= weekFromNow;
  })

  const pastClasses = classes.filter(c => {
    // Comparar fechas directamente como strings (YYYY-MM-DD)
    const [cYear, cMonth, cDay] = c.date.split('-').map(Number);
    const classDate = new Date(cYear, cMonth - 1, cDay);
    
    const [tYear, tMonth, tDay] = today.split('-').map(Number);
    const todayDate = new Date(tYear, tMonth - 1, tDay);
    
    // Si es de un día anterior, incluirla
    if (classDate < todayDate) {
      return true;
    }
    
    // Si es de hoy, verificar si la hora ya pasó
    if (classDate.getTime() === todayDate.getTime() && c.time) {
      const now = new Date();
      const [horaClase, minutoClase] = c.time.split(':').map(Number);
      const horaActual = now.getHours();
      const minutoActual = now.getMinutes();
      
      // Si la hora de la clase ya pasó, incluirla en el historial
      if (horaClase < horaActual || (horaClase === horaActual && minutoClase < minutoActual)) {
        return true;
      }
    }
    
    return false;
  }).sort((a, b) => {
    // Ordenar por fecha descendente
    const [aYear, aMonth, aDay] = a.date.split('-').map(Number);
    const [bYear, bMonth, bDay] = b.date.split('-').map(Number);
    const dateA = new Date(aYear, aMonth - 1, aDay);
    const dateB = new Date(bYear, bMonth - 1, bDay);
    return dateB - dateA;
  })

  // Filtrar clases por vista y excluir canceladas de vistas activas
  const getClassesByView = () => {
    let viewClasses;
    if (activeView === 'today') {
      viewClasses = todayClasses.filter(c => c.status !== 'cancelada');
    } else if (activeView === 'week') {
      viewClasses = weekClasses.filter(c => c.status !== 'cancelada');
    } else if (activeView === 'history') {
      viewClasses = pastClasses; // En historial SÍ mostramos las canceladas
    } else {
      viewClasses = classes.filter(c => c.status !== 'cancelada'); // Vista general sin canceladas
    }
    
    console.log(`📊 ${activeView} view - clases antes del filtro:`, viewClasses.length);
    return viewClasses;
  };

  const filteredClasses = getClassesByView().filter((cls) => {
    const matchesSearch =
      (cls.student || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cls.type || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || cls.type === filterType
    const matchesStatus = filterStatus === "all" || cls.status === filterStatus
    const matches = matchesSearch && matchesType && matchesStatus;
    return matches;
  })
  
  console.log(`✅ Clases filtradas finales (${activeView}):`, filteredClasses.length);

  const handleAttendanceChange = async (id, attendance, nuevoNivel = null) => {
    try {
      console.log(`🎯 Actualizando asistencia: ${attendance} para reserva ${id}`, nuevoNivel ? `con cambio de nivel a: ${nuevoNivel}` : '')
      
      // Mapear los valores del frontend al backend
      const attendanceMap = {
        'asistió': 'presente',
        'faltó': 'ausente', 
        'pendiente': 'pendiente'
      }
      
      const backendAttendance = attendanceMap[attendance] || attendance;
      
      // Obtener la clase actual para guardar el nivel con el que se tomó
      const claseActual = classes.find(c => c.id === id);
      const nivelClase = claseActual?.studentLevel || 'intermedio'; // Nivel con el que se tomó la clase
      
      // Primero actualizar el estado local para respuesta inmediata
      const updatedClass = { 
        ...{}, 
        attendance, 
        status: attendance === 'faltó' ? 'cancelada' : 'completada'
      };
      
      // Si se cambió el nivel, actualizar también en el estado local
      if (nuevoNivel) {
        updatedClass.studentLevel = nuevoNivel;
        updatedClass.level = nuevoNivel; // Mantener compatibilidad
      }
      
      // Si faltó, también quitar el caballo
      if (attendance === 'faltó') {
        updatedClass.horse = null;
        updatedClass.caballo_asignado = null;
      }
      
      setClasses(prev => 
        prev.map(c => 
          c.id === id ? { ...c, ...updatedClass } : c
        )
      )
      setShowAttendanceModal(false)
      
      // Luego actualizar en el backend
      console.log('🔍 DEBUG - Datos a enviar:', { 
        reservaId: id, 
        asistencia: backendAttendance, 
        nivelClase, 
        nuevoNivel 
      });
      await actualizarAsistencia(id, backendAttendance, instructoraInfo?.id, nivelClase, nuevoNivel)
      
      console.log(`✅ Asistencia actualizada correctamente`)
      
    } catch (error) {
      console.error('❌ Error detallado al actualizar asistencia:', error)
      console.log('🔍 Error completo:', error.message, error.status)
      // Revertir el cambio local si falla la API
      setClasses(prev => 
        prev.map(c => 
          c.id === id 
            ? { ...c, attendance: 'pendiente', status: 'confirmada' }  // Revertir estado, mantener caballo original
            : c
        )
      )
      // Aquí podrías mostrar una notificación de error
      alert('Error al actualizar la asistencia. Por favor, inténtalo de nuevo.')
    }
  }

  const handleDateClick = (date, classes) => {
    setSelectedDate(date)
    setDateClasses(classes)
    setShowDateClasses(true)
  }

  const handleClassClickFromModal = (classItem) => {
    setShowDateClasses(false)
    setSelectedClass(classItem)
    setShowAttendanceModal(true)
  }

  // 🚀 Función para obtener caballos OPTIMIZADA con useCallback para evitar re-renderizados
  const obtenerCaballosParaClase = useCallback(async (nivelCliente, classItem = null) => {
    try {
      console.log('🔍 ESTABLE - Obteniendo caballos para:', { nivelCliente, classItem });

      // Si tenemos información de la clase con fecha y hora, usar filtrado por horario
      if (classItem && classItem.date && classItem.time) {
        console.log('🗓️ Aplicando filtrado por horario para:', classItem.date, classItem.time, 'Clase ID:', classItem.id, 'Tipo:', classItem.type);
        const baseDisponibles = await obtenerCaballosDisponiblesParaHorario(nivelCliente, classItem.date, classItem.time, null, classItem.type, classItem.cliente_id || classItem.clienteId);

        // Excluir caballos ya asignados a otras clases en el mismo horario
        const ocupados = classes
          .filter(c => 
            c.id !== classItem.id &&
            c.date === classItem.date &&
            c.time === classItem.time &&
            c.horse
          )
          .map(c => c.horse.toLowerCase());

        if (ocupados.length > 0) {
          return baseDisponibles.filter(caballo => !ocupados.includes((caballo.nombre || '').toLowerCase()));
        }
        return baseDisponibles;
      }
      
      // Si ya tenemos los caballos para este nivel, devolverlos INMEDIATAMENTE
      if (caballosPorNivel[nivelCliente]) {
        console.log('⚡ INMEDIATO: Caballos del cache para nivel:', nivelCliente);
        return caballosPorNivel[nivelCliente];
      }

      // Solo si NO tenemos cache, hacer llamada al servidor
      console.log('🌐 Primera vez: Cargando caballos para nivel:', nivelCliente);
      const fechaHoy = new Date().toISOString().split('T')[0];
      const caballos = await obtenerCaballosPorNivel(nivelCliente, fechaHoy);
      
      // Guardar en cache para que las siguientes sean inmediatas
      setCaballosPorNivel(prev => ({
        ...prev,
        [nivelCliente]: caballos
      }));

      return caballos;
    } catch (error) {
      console.error(`Error al obtener caballos para nivel ${nivelCliente}:`, error);
      return [];
    }
  }, [caballosPorNivel, classes]);

  // Función para manejar el cambio de caballo
  const handleHorseChange = async (classId, caballoData) => {
    try {
      console.log(`🐎 Asignando caballo:`, caballoData, `a clase:`, classId);
      
      // Encontrar la clase para obtener nivel, fecha y hora
      const claseActual = classes.find(c => c.id === classId);
      if (!claseActual) {
        console.warn('Clase no encontrada:', classId);
        return;
      }
      
      // caballoData puede ser un objeto {id, nombre} o solo el nombre
      const caballoId = caballoData.id || caballoData;
      const caballoNombre = caballoData.nombre || caballoData;
      
      // Actualizar estado local inmediatamente para UX
      setClasses(prev => 
        prev.map(c => c.id === classId ? {...c, horse: caballoNombre} : c)
      );
      
      if (caballoNombre === '' || caballoNombre === null) {
        console.log('ℹ️ Removiendo caballo en backend');
        await asignarCaballo(classId, null, instructoraInfo?.id);
      } else if (caballoId && caballoId !== '' && caballoId !== caballoNombre) {
        try {
          await asignarCaballo(classId, caballoId, instructoraInfo?.id);
          console.log(`✅ Caballo asignado correctamente en el backend`);
        } catch (error) {
          console.log('🔍 Error capturado al asignar caballo:', error);
          console.log('🔍 error.errorData:', error.errorData);
          // Si es un error de conflicto (warning), mostrar toast y revertir la asignación
          if (error.errorData && error.errorData.warning && error.errorData.mensaje) {
            console.log('⚠️ Conflicto detectado, revirtiendo asignación y mostrando toast');
            // Revertir el cambio local (quitar el caballo asignado)
            setClasses(prev => 
              prev.map(c => c.id === classId ? {...c, horse: ''} : c)
            );
            // Mostrar toast de advertencia
            console.log('📢 Mostrando toast con mensaje:', error.errorData.mensaje);
            const toastData = { message: error.errorData.mensaje, type: 'warning' };
            console.log('📢 Datos del toast:', toastData);
            setToast(toastData);
            console.log('📢 Toast establecido, estado actualizado');
            // Invalidar caché para actualizar la lista de disponibles
            if (claseActual.studentLevel && claseActual.date && claseActual.time) {
              invalidarCacheDisponibles(claseActual.studentLevel, claseActual.date, claseActual.time).then(() => {
                // Forzar actualización del horsesHash para que HorseSelect recargue los caballos
                setClasses(prev => 
                  prev.map(c => c.id === classId ? {...c, horse: '', _refresh: Date.now()} : c)
                );
              }).catch(err => {
                console.warn('Error al invalidar caché:', err);
                // Aún así forzar actualización
                setClasses(prev => 
                  prev.map(c => c.id === classId ? {...c, horse: '', _refresh: Date.now()} : c)
                );
              });
            }
            return;
          }
          // Si es otro tipo de error, lanzarlo para que se maneje abajo
          console.log('❌ Error no es de conflicto, lanzando error');
          throw error;
        }
      }
      
      // Invalidar caché para que se actualice la disponibilidad inmediatamente
      // Esto permite que otros instructores vean los cambios y que el mismo instructor
      // vea el caballo liberado cuando lo quita
      if (claseActual.studentLevel && claseActual.date && claseActual.time) {
        await invalidarCacheDisponibles(claseActual.studentLevel, claseActual.date, claseActual.time);
      }
      
    } catch (error) {
      console.error('Error al asignar caballo:', error);
      // Revertir cambio local si falla
      setClasses(prev => 
        prev.map(c => c.id === classId ? {...c, horse: c.horse} : c)
      );
      
      // Intentar obtener mensaje del error
      let errorMessage = error.message || 'Error al asignar caballo';
      if (error.errorData) {
        errorMessage = error.errorData.mensaje || error.errorData.error || errorMessage;
      }
      
      setToast({ message: errorMessage, type: 'error' });
    }
  }
  
  // Función helper para calcular hash de caballos asignados en el mismo horario
  const getHorsesHashForHorario = useCallback((date, time) => {
    const caballosEnHorario = classes
      .filter(c => c.date === date && c.time === time && c.horse)
      .map(c => c.horse)
      .sort()
      .join('|');
    return caballosEnHorario;
  }, [classes]);

  // Función para recargar las clases
  const recargarClases = useCallback(async () => {
    try {
      const usuario = obtenerUsuarioActual()
      if (!usuario || !usuario.id) {
        throw new Error('No se encontró información de usuario')
      }
      
      const { instructora, clases } = await obtenerClasesInstructora(usuario.id)
      setInstructoraInfo(instructora)
      setClasses(clases)
    } catch (err) {
      console.error('Error al recargar clases:', err)
      setToast({ message: 'Error al recargar las clases', type: 'error' })
    }
  }, [])

  return {
    searchTerm, setSearchTerm,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    activeView, setActiveView,
    selectedClass, setSelectedClass,
    showAttendanceModal, setShowAttendanceModal,
    selectedDate, setSelectedDate,
    showDateClasses, setShowDateClasses,
    dateClasses, setDateClasses,
    classes, setClasses, filteredClasses,
    handleAttendanceChange,
    handleDateClick,
    handleClassClickFromModal,
    obtenerCaballosParaClase, // Nueva función exportada
    handleHorseChange, // Nueva función exportada
    getHorsesHashForHorario, // Hash de caballos en el mismo horario
    toast, setToast, // Toast para advertencias
    loading, 
    error, 
    instructoraInfo,
    recargarClases, // Función para recargar clases
  }
}
