import React, { useState, useEffect, useCallback } from "react";
import useAutoRefresh from '../hooks/useAutoRefresh';
import ReactDOM from "react-dom";
import { Loader, UserPlus, Edit, Trash2, Calendar, Clock, Search, CheckCircle, Coffee, Mail, Phone, Award, MoreVertical, Unlock, SlidersHorizontal, Info, GraduationCap } from "lucide-react";

const InstructorasAdmin = () => {
  const [instructoras, setInstructoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [addInstructorModalOpen, setAddInstructorModalOpen] = useState(false);
  const [editInstructorModalOpen, setEditInstructorModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState(null);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [newInstructor, setNewInstructor] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    especialidad: "",
    tipo_instructor: "general"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("disponible");
  const [creatingInstructor, setCreatingInstructor] = useState(false);
  const [updatingInstructor, setUpdatingInstructor] = useState(false);
  const [createdInstructor, setCreatedInstructor] = useState(null); // Para el paso post-creación
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, instructorId: null });
  const [deletingInstructor, setDeletingInstructor] = useState(false);

  // Estados para el flujo de desactivación + reasignación de reservas
  const [activeReservations, setActiveReservations] = useState([]);
  const [reasignaciones, setReasignaciones] = useState({});
  const [reassigning, setReassigning] = useState(false);
  
  // Estados para gestión de descansos
  const [descansosModalOpen, setDescansosModalOpen] = useState(false);
  const [selectedInstructorDescansos, setSelectedInstructorDescansos] = useState(null);
  const [descansos, setDescansos] = useState([]);
  const [loadingDescansos, setLoadingDescansos] = useState(false);
  const [addDescansoModalOpen, setAddDescansoModalOpen] = useState(false);
  const [editDescansoModalOpen, setEditDescansoModalOpen] = useState(false);
  const [editingDescanso, setEditingDescanso] = useState(null);
  const [newDescanso, setNewDescanso] = useState({
    es_recurrente: false,
    dia_semana: "",
    fecha_inicio: "",
    fecha_fin: "",
    motivo: "",
    tipo: "personal"
  });
  const [descansosActivos, setDescansosActivos] = useState({});

  // Estados para gestión de horarios semanales
  const [horariosSemanalesModalOpen, setHorariosSemanalesModalOpen] = useState(false);
  const [horariosSemanales, setHorariosSemanales] = useState({});
  const [loadingHorariosSemanales, setLoadingHorariosSemanales] = useState(false);

  // Estados para detección de conflictos con clases existentes
  const [clasesInstructor, setClasesInstructor] = useState([]);
  const [classDefinitions, setClassDefinitions] = useState([]);
  const [conflictos, setConflictos] = useState([]);
  const [loadingClasesInstructor, setLoadingClasesInstructor] = useState(false);

  // Estados para gestión de horarios
  const [horariosModalOpen, setHorariosModalOpen] = useState(false);
  const [selectedInstructorHorarios, setSelectedInstructorHorarios] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [addHorarioModalOpen, setAddHorarioModalOpen] = useState(false);
  const [editHorarioModalOpen, setEditHorarioModalOpen] = useState(false);
  const [editingHorario, setEditingHorario] = useState(null);
  const [newHorario, setNewHorario] = useState({
    dia_semana: "",
    hora_inicio: "",
    hora_fin: ""
  });

  // Función para generar horas del día (de 6:00 AM a 8:00 PM)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  // Cargar definiciones de clases (duraciones) desde el backend
  const loadClassDefinitions = async () => {
    try {
      const res = await fetch("https://elrefugiocountryclub.com/api/api/reservas/classes");
      if (!res.ok) return;
      const data = await res.json();
      setClassDefinitions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar definiciones de clases:', err);
    }
  };

  // Cargar clases (reservas) del instructor
  const loadInstructorClases = async () => {
    if (!selectedInstructorHorarios) return;
    setLoadingClasesInstructor(true);
    try {
      const uid = selectedInstructorHorarios.usuario_id || selectedInstructorHorarios.user_id || selectedInstructorHorarios.id;
      const res = await fetch(`https://elrefugiocountryclub.com/api/api/instructoras/clases/${uid}`);
      if (!res.ok) {
        setClasesInstructor([]);
        return;
      }
      const data = await res.json();
      const todas = Array.isArray(data.clases) ? data.clases : (Array.isArray(data) ? data : []);
      // Filtrar solo reservas con estatus 'pendiente' (campo puede ser 'status' o 'estatus')
      const pendientes = todas.filter(c => (c.status === 'pendiente' || c.estatus === 'pendiente'));
      setClasesInstructor(pendientes);
    } catch (err) {
      console.error('Error al cargar clases de la instructora:', err);
      setClasesInstructor([]);
    } finally {
      setLoadingClasesInstructor(false);
    }
  };

  // Detectar conflictos entre el horario propuesto y las clases existentes
  const detectConflicts = (horariosMap = horariosSemanales, clases = clasesInstructor, classDefs = classDefinitions) => {
    const conflicts = [];

    // Si no hay ningún bloque de horario configurado, por regla la instructora está disponible todo el tiempo
    const anyHorario = Object.values(horariosMap).some(arr => Array.isArray(arr) && arr.length > 0);
    if (!anyHorario) {
      setConflictos([]);
      return [];
    }

    const diaMap = {0: 'D', 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S'};
    const diasLong = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

    const toMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const s = String(timeStr).trim().slice(0,5); // normalize to HH:MM
      const parts = s.split(':').map(p => Number(String(p).replace(/[^0-9]/g, '')));
      const h = Number.isFinite(parts[0]) ? parts[0] : 0;
      const m = Number.isFinite(parts[1]) ? parts[1] : 0;
      return h * 60 + m;
    };

    const normalize = (s) => {
      if (!s) return '';
      try {
        return String(s)
          .toLowerCase()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .replace(/[^a-z0-9\s]/g, '')
          .trim();
      } catch (e) {
        return String(s).toLowerCase().trim();
      }
    };

    // Fecha de referencia: hoy (local), formato YYYY-MM-DD
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];

    clases.forEach(clase => {
      try {
        const fecha = clase.date;
        const claseDateStr = fecha ? String(fecha).split('T')[0] : null;
        // Ignorar clases anteriores a hoy
        if (!claseDateStr || claseDateStr < todayStr) return;
        const rawHora = (clase.time || clase.hora_inicio || '00:00');
        const horaInicio = String(rawHora).slice(0,5).trim();
        // Parsear fecha como local YYYY-MM-DD para evitar desplazamientos por zona horaria
        const fechaStr = String(fecha).split('T')[0];
        const [yyyy, mm, dd] = fechaStr.split('-').map(Number);
        const fechaObj = new Date(yyyy, (mm || 1) - 1, dd || 1);
        if (isNaN(fechaObj.getTime())) return;
        const dia = diaMap[fechaObj.getDay()];

        // Log breve para depuración de día y bloques disponibles
        // console.debug(`detectConflicts: fecha=${fechaStr}, dia=${dia}, clasesDia=${(horariosMap[dia]||[]).length}`);

        // Obtener duración de la clase por tipo (buscar con normalización y coincidencia flexible)
        const tipoNorm = normalize(clase.type || clase.type || '');
        let def = classDefs.find(cd => normalize(cd.nombre) === tipoNorm);
        if (!def) {
          // intentar coincidencia por inclusión
          def = classDefs.find(cd => normalize(cd.nombre).includes(tipoNorm) || tipoNorm.includes(normalize(cd.nombre)));
        }
        let durMin = def && (def.duracion_min || def.duracion || def.duracion_min === 0 ? parseInt(def.duracion_min || def.duracion || 0, 10) : NaN);
        if (!durMin || isNaN(durMin)) {
          // fallback heurístico: iniciación suele ser 30min
          if (tipoNorm.includes('inici')) durMin = 30;
          else durMin = 60;
        }

        const startMin = toMinutes(horaInicio);
        const endMin = startMin + parseInt(durMin, 10);

        const horariosDia = horariosMap[dia] || [];

        // Si no hay bloques para ese día → conflicto
        if (!horariosDia || horariosDia.length === 0) {
          const hFinStr = (() => {
            const h = new Date(fecha + 'T' + horaInicio + ':00');
            h.setMinutes(h.getMinutes() + durMin);
            return h.toTimeString().slice(0,5);
          })();
          const diaNombre = diasLong[fechaObj.getDay()];
          conflicts.push({ ...clase, hora_fin: hFinStr, razon: 'No hay bloques de horario para este día', diaNombre });
          return;
        }

        // Preparar datos de bloques para log
        const bloquesInfo = (horariosDia || []).map(h => {
          const bStart = Number.parseInt(String(toMinutes(h.hora_inicio)), 10) || 0;
          const bEnd = Number.parseInt(String(toMinutes(h.hora_fin)), 10) || 0;
          return { raw: `${h.hora_inicio || ''}-${h.hora_fin || ''}`, bStart, bEnd };
        });

        // Normalizar startMin y endMin a enteros antes de cualquier comparación
        const startN = Number.parseInt(String(startMin), 10) || 0;
        const endN = Number.parseInt(String(endMin), 10) || 0;

        // Log de diagnóstico por cada clase evaluada (visible en consola)
        console.log('detectConflicts: evaluando clase', {
          claseId: clase.id || null,
          fecha: fechaStr,
          horaInicio,
          durMin,
          startMin: startN,
          endMin: endN,
          bloques: bloquesInfo
        });

        // Verificar si la clase puede ser cubierta por bloques contiguos (sin huecos)
        // Ordenar bloques por hora de inicio
        const sortedBlocks = [...bloquesInfo].sort((a, b) => a.bStart - b.bStart);
        
        // Función para verificar si hay cobertura continua
        const isCoveredByContiguousBlocks = (start, end, blocks) => {
          let currentCoverage = start;
          
          for (const block of blocks) {
            const bStartN = Number.parseInt(String(block.bStart), 10) || 0;
            const bEndN = Number.parseInt(String(block.bEnd), 10) || 0;
            
            // Si el bloque empieza después del punto actual de cobertura, hay un hueco
            if (bStartN > currentCoverage) {
              break;
            }
            
            // Si el bloque cubre o extiende la cobertura actual
            if (bEndN >= currentCoverage) {
              currentCoverage = bEndN;
            }
            
            // Si ya cubrimos todo el intervalo necesario
            if (currentCoverage >= end) {
              return true;
            }
          }
          
          return currentCoverage >= end;
        };
        
        const contained = isCoveredByContiguousBlocks(startN, endN, sortedBlocks);

        // Log adicional del booleano contained para diagnóstico inmediato
        console.log('detectConflicts: contained?', { claseId: clase.id || null, startN, endN, contained });

        if (!contained) {
          // Preparar chequeo por bloque (muestra por qué no entra) - usar startN y endN parseados
          const bloqueChecks = bloquesInfo.map(b => {
            const bStartN = Number.parseInt(String(b.bStart), 10) || 0;
            const bEndN = Number.parseInt(String(b.bEnd), 10) || 0;
            return {
              raw: b.raw,
              bStart: bStartN,
              bEnd: bEndN,
              contains: (startN >= bStartN && endN <= bEndN)
            };
          });

          // Log claro con detalle por bloque y datos originales de horarios
          console.log('detectConflicts: clase FUERA de bloques', {
            claseId: clase.id || null,
            fecha: fechaStr,
            horaInicio,
            durMin,
            startMin: startN,
            endMin: endN,
            bloqueChecks,
            horariosDiaRaw: horariosDia
          });

          console.log('🚨 AGREGANDO CONFLICTO para clase', clase.id, 'porque contained =', contained);
          const hFin = (() => {
            const h = new Date(fecha + 'T' + horaInicio + ':00');
            h.setMinutes(h.getMinutes() + durMin);
            return h.toTimeString().slice(0,5);
          })();
          const diaNombre = diasLong[fechaObj.getDay()];
          conflicts.push({ ...clase, hora_fin: hFin, razon: 'Fuera de bloques permitidos', diaNombre });
        } else {
          console.log('✅ NO conflicto para clase', clase.id, 'porque contained =', contained);
        }
      } catch (err) {
        console.error('Error evaluando clase para conflictos', clase, err);
      }
    });

    setConflictos(conflicts);
    return conflicts;
  };

  // Función para convertir tiempo a minutos para comparación
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Función para convertir minutos de vuelta a formato HH:MM
  const minutesToTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Función para verificar si una hora está dentro de un rango
  const isTimeInRange = (time, startTime, endTime) => {
    const timeMinutes = timeToMinutes(time);
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  };

  // Abrir modal de horarios semanales
  const openHorariosSemanalesModal = async () => {
    setHorariosSemanalesModalOpen(true);
    setLoadingHorariosSemanales(true);
    
    try {
      const response = await fetch(`https://elrefugiocountryclub.com/api/api/instructoras/${selectedInstructorHorarios.id}/horarios`);
      if (!response.ok) {
        throw new Error("Error al cargar horarios");
      }
      const data = await response.json();
      
      // Organizar horarios por día
      const horariosPorDia = {};
      const dias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
      dias.forEach(dia => {
        horariosPorDia[dia] = data.filter(h => h.dia_semana === dia && h.activo);
      });
      
      setHorariosSemanales(horariosPorDia);
      // Cargar definiciones y clases del instructor para detectar posibles conflictos
      await loadClassDefinitions();
      await loadInstructorClases();
      // Detectar conflictos con el horario recién cargado
      detectConflicts(horariosPorDia);
    } catch (error) {
      console.error("Error al cargar horarios semanales:", error);
      showNotification("Error al cargar horarios semanales", "error");
    } finally {
      setLoadingHorariosSemanales(false);
    }
  };

  // Cerrar modal de horarios semanales
  const closeHorariosSemanalesModal = () => {
    setHorariosSemanalesModalOpen(false);
    setHorariosSemanales({});
    setClasesInstructor([]);
    setConflictos([]);
  };

  // Función auxiliar para fusionar bloques contiguos
  const mergeContiguousBlocks = (horarios) => {
    if (horarios.length === 0) return [];
    
    // Ordenar bloques por hora de inicio
    const sorted = [...horarios].sort((a, b) => {
      const aMin = timeToMinutes(a.hora_inicio);
      const bMin = timeToMinutes(b.hora_inicio);
      return aMin - bMin;
    });
    
    const merged = [];
    let current = { ...sorted[0] };
    
    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      const currentEnd = timeToMinutes(current.hora_fin);
      const nextStart = timeToMinutes(next.hora_inicio);
      
      // Si el siguiente bloque es contiguo o se solapa, fusionar
      if (nextStart <= currentEnd) {
        const nextEnd = timeToMinutes(next.hora_fin);
        const mergedEnd = Math.max(currentEnd, nextEnd);
        current.hora_fin = minutesToTime(mergedEnd);
        // Mantener el ID del primer bloque, marcar como modificado
        if (!current.isNew && !next.isNew) {
          current.isModified = true;
        }
      } else {
        // No son contiguos, guardar el actual e iniciar nuevo
        merged.push(current);
        current = { ...next };
      }
    }
    merged.push(current);
    
    return merged;
  };

  // Función para manejar clics en las celdas de tiempo
  const handleTimeSlotClick = (dia, timeSlot) => {
    const currentHorarios = horariosSemanales[dia] || [];
    
    // Verificar si ya existe un horario que cubra este slot
    const existingHorario = currentHorarios.find(h => 
      isTimeInRange(timeSlot, h.hora_inicio, h.hora_fin)
    );
    
    if (existingHorario) {
      // Quitar solo la hora clickeada, dividiendo el bloque si es necesario
      const slotStart = timeToMinutes(timeSlot);
      const slotEnd = slotStart + 60; // cada celda = 1 hora
      const blockStart = timeToMinutes(existingHorario.hora_inicio);
      const blockEnd = timeToMinutes(existingHorario.hora_fin);

      // Remover el bloque original
      const updatedHorarios = currentHorarios.filter(h => h.id !== existingHorario.id);

      // Crear bloque izquierdo si hay tiempo antes del slot clickeado
      if (blockStart < slotStart) {
        updatedHorarios.push({
          id: `temp_${Date.now()}_${dia}_left`,
          dia_semana: dia,
          hora_inicio: existingHorario.hora_inicio,
          hora_fin: timeSlot,
          activo: true,
          isNew: true
        });
      }

      // Crear bloque derecho si hay tiempo después del slot clickeado
      if (slotEnd < blockEnd) {
        updatedHorarios.push({
          id: `temp_${Date.now()}_${dia}_right`,
          dia_semana: dia,
          hora_inicio: minutesToTime(slotEnd),
          hora_fin: existingHorario.hora_fin,
          activo: true,
          isNew: true
        });
      }

      setHorariosSemanales({
        ...horariosSemanales,
        [dia]: updatedHorarios
      });
    } else {
      // Agregar este bloque de 1 HORA (cada celda = 1 hora completa)
      // Calcular hora de fin: timeSlot + 1 hora
      const startParts = timeSlot.split(':');
      const startHour = parseInt(startParts[0]);
      const endHour = startHour + 1;
      const endTimeStr = `${endHour.toString().padStart(2, '0')}:00`;
      
      const newHorario = {
        id: `temp_${Date.now()}_${dia}`,
        dia_semana: dia,
        hora_inicio: timeSlot,
        hora_fin: endTimeStr,
        activo: true,
        isNew: true
      };
      
      // Agregar el nuevo bloque y fusionar solo los contiguos (sin huecos)
      const withNewBlock = [...currentHorarios, newHorario];
      const mergedHorarios = mergeContiguousBlocks(withNewBlock);
      
      console.log(`📊 Bloques después de fusión en ${dia}:`, mergedHorarios.map(h => `${h.hora_inicio}-${h.hora_fin}`).join(', '));
      
      setHorariosSemanales({
        ...horariosSemanales,
        [dia]: mergedHorarios
      });
    }
  };

  // Guardar cambios de horarios semanales
  const saveHorariosSemanales = async () => {
    try {
      // Antes de guardar, verificar conflictos entre el horario propuesto y las clases existentes
      const currentConflicts = detectConflicts();
      if (currentConflicts && currentConflicts.length > 0) {
        showNotification(`${currentConflicts.length} conflictos detectados. Ajusta el horario antes de guardar.`, "error");
        return;
      }

      setLoadingHorariosSemanales(true);
      
      // Recopilar todos los horarios
      const allHorarios = [];
      Object.values(horariosSemanales).forEach(horariosDia => {
        allHorarios.push(...horariosDia);
      });
      
      // Separar nuevos y existentes
      const existingHorarios = allHorarios.filter(h => !h.isNew);
      const newHorarios = allHorarios.filter(h => h.isNew);
      
      // Eliminar horarios que ya no existen
      const currentIds = existingHorarios.map(h => h.id);
      const originalHorarios = await (await fetch(`https://elrefugiocountryclub.com/api/api/instructoras/${selectedInstructorHorarios.id}/horarios`)).json();
      const toDelete = originalHorarios.filter(h => !currentIds.includes(h.id));
      
      // Ejecutar operaciones
      const deletePromises = toDelete.map(h => 
        fetch(`https://elrefugiocountryclub.com/api/api/instructoras/${selectedInstructorHorarios.id}/horarios/${h.id}`, {
          method: 'DELETE'
        })
      );
      
      const updatePromises = existingHorarios.map(h =>
        fetch(`https://elrefugiocountryclub.com/api/api/instructoras/${selectedInstructorHorarios.id}/horarios/${h.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dia_semana: h.dia_semana,
            hora_inicio: h.hora_inicio,
            hora_fin: h.hora_fin,
            activo: h.activo
          })
        })
      );
      
      const createPromises = newHorarios.map(h =>
        fetch(`https://elrefugiocountryclub.com/api/api/instructoras/${selectedInstructorHorarios.id}/horarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dia_semana: h.dia_semana,
            hora_inicio: h.hora_inicio,
            hora_fin: h.hora_fin
          })
        })
      );
      
      await Promise.all([...deletePromises, ...updatePromises, ...createPromises]);
      
      showNotification("Horarios semanales guardados correctamente", "success");
      closeHorariosSemanalesModal();
      await loadHorarios(selectedInstructorHorarios.id);
      
    } catch (error) {
      console.error("Error al guardar horarios semanales:", error);
      showNotification("Error al guardar horarios semanales", "error");
    } finally {
      setLoadingHorariosSemanales(false);
    }
  };

  // Mostrar notificación
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 4000);
  };

  // Cargar instructoras desde el backend
  const loadInstructoras = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("https://elrefugiocountryclub.com/api/api/instructoras");
      if (!response.ok) {
        throw new Error("Error al cargar instructoras");
      }
      const data = await response.json();
      setInstructoras(data);

      // Cargar descansos activos para cada instructora
      await loadDescansosActivos(data);
    } catch (error) {
      console.error("Error al cargar instructoras:", error);
      if (!silent) showNotification("Error al cargar instructoras", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Cargar descansos activos de todas las instructoras
  const loadDescansosActivos = async (instructorasList) => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const descansosMap = {};
      
      // Consultar para cada instructora si tiene descanso hoy
      await Promise.all(
        instructorasList.map(async (instructora) => {
          try {
            const response = await fetch(
              `https://elrefugiocountryclub.com/api/api/descansos/check/${instructora.id}?fecha=${hoy}`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.en_descanso) {
                descansosMap[instructora.id] = data.descanso;
              }
            }
          } catch (err) {
            console.error(`Error verificando descanso de instructora ${instructora.id}:`, err);
          }
        })
      );
      
      setDescansosActivos(descansosMap);
    } catch (error) {
      console.error("Error al cargar descansos activos:", error);
    }
  };

  useEffect(() => {
    loadInstructoras();
  }, []);

  // Auto-refresh silencioso cada 30s
  const refreshInstructoras = useCallback(() => loadInstructoras(true), []);
  useAutoRefresh(refreshInstructoras, { interval: 30000 });

  // Re-evaluar conflictos cuando cambian los horarios, las clases o las definiciones
  useEffect(() => {
    if (!horariosSemanales || !selectedInstructorHorarios) return;
    detectConflicts(horariosSemanales, clasesInstructor, classDefinitions);
  }, [horariosSemanales, clasesInstructor, classDefinitions, selectedInstructorHorarios]);

  // Cerrar menú dropdown al hacer clic fuera
  useEffect(() => {
    if (openMenuId === null) return;
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  // Filtrado de instructoras (usado en resumen y tabla)
  const filteredInstructoras = instructoras.filter(inst => {
    const matchesSearch = searchTerm === "" ||
      (inst.nombre + " " + (inst.apellido || "")).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inst.correo && inst.correo.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAvailability = availabilityFilter === "" || inst.disponibilidad === availabilityFilter;
    return matchesSearch && matchesAvailability;
  });

  const openAddInstructorModal = () => {
    setNewInstructor({
      nombre: "",
      apellido: "",
      correo: "",
      telefono: "",
      especialidad: "",
      tipo_instructor: "general"
    });
    setAddInstructorModalOpen(true);
  };

  const closeAddInstructorModal = () => {
    setAddInstructorModalOpen(false);
    setCreatedInstructor(null);
    setNewInstructor({
      nombre: "",
      apellido: "",
      correo: "",
      telefono: "",
      especialidad: "",
      tipo_instructor: "general"
    });
  };

  const openEditInstructorModal = (instructor) => {
    setEditingInstructor({
      id: instructor.id,
      nombre: instructor.nombre,
      apellido: instructor.apellido,
      correo: instructor.correo || "",
      num_contacto: instructor.num_contacto || "",
      especialidad: instructor.especialidad,
      tipo_instructor: instructor.tipo_instructor || "general"
    });
    setEditInstructorModalOpen(true);
  };

  const closeEditInstructorModal = () => {
    setEditInstructorModalOpen(false);
    setEditingInstructor(null);
  };

  const openDeleteModal = async (instructor) => {
    setInstructorToDelete(instructor);
    setReasignaciones({});
    setActiveReservations([]);
    setDeleteModalOpen(true);
    setLoadingReservas(true);
    try {
      const res = await fetch(`https://elrefugiocountryclub.com/api/api/instructoras/${instructor.id}/reservas-activas`);
      const reservas = await res.json();
      setActiveReservations(reservas);
    } catch (e) {
      showNotification("Error al cargar reservas pendientes", "error");
    } finally {
      setLoadingReservas(false);
    }
  };

  const closeDeleteModal = () => {
    if (reassigning || deletingInstructor) return;
    setDeleteModalOpen(false);
    setInstructorToDelete(null);
    setActiveReservations([]);
    setReasignaciones({});
  };

  const createNewInstructor = async () => {
    // Validar campos requeridos
    if (!newInstructor.nombre || !newInstructor.apellido || !newInstructor.especialidad) {
      showNotification("Por favor completa todos los campos obligatorios", "error");
      return;
    }

    setCreatingInstructor(true);
    try {
      const response = await fetch("https://elrefugiocountryclub.com/api/api/instructoras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInstructor)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear instructora");
      }

      const data = await response.json();
      showNotification(data.message || "Instructora creada correctamente", "success");
      const created = data.instructora || { id: data.id, nombre: newInstructor.nombre, apellido: newInstructor.apellido };
      setCreatedInstructor(created);
      loadInstructoras();
    } catch (error) {
      console.error("Error al crear instructora:", error);
      showNotification(error.message || "Error al crear instructora", "error");
    } finally {
      setCreatingInstructor(false);
    }
  };

  const updateInstructor = async () => {
    if (!editingInstructor.nombre || !editingInstructor.apellido || !editingInstructor.especialidad) {
      showNotification("Por favor completa todos los campos obligatorios", "error");
      return;
    }

    setUpdatingInstructor(true);
    try {
      const response = await fetch(`https://elrefugiocountryclub.com/api/api/instructoras/${editingInstructor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingInstructor)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar instructora");
      }

      const data = await response.json();
      showNotification(data.message || "Instructora actualizada correctamente", "success");
      closeEditInstructorModal();
      loadInstructoras();
    } catch (error) {
      console.error("Error al actualizar instructora:", error);
      showNotification(error.message || "Error al actualizar instructora", "error");
    } finally {
      setUpdatingInstructor(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!instructorToDelete) return;

    const listaReasignaciones = Object.entries(reasignaciones).map(([reserva_id, nuevo_instructora_id]) => ({
      reserva_id: parseInt(reserva_id),
      nuevo_instructora_id: parseInt(nuevo_instructora_id)
    }));

    const busy = activeReservations.length > 0 ? setReassigning : setDeletingInstructor;
    busy(true);
    try {
      // 1. Reasignar si hay reservas con sustituto asignado
      if (listaReasignaciones.length > 0) {
        const reasignarRes = await fetch(`https://elrefugiocountryclub.com/api/api/instructoras/${instructorToDelete.id}/reasignar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reasignaciones: listaReasignaciones })
        });
        if (!reasignarRes.ok) {
          const err = await reasignarRes.json();
          throw new Error(err.error || "Error al reasignar reservas");
        }
      }

      // 2. Desactivar instructora
      const deleteRes = await fetch(`https://elrefugiocountryclub.com/api/api/instructoras/${instructorToDelete.id}`, {
        method: "DELETE"
      });
      if (!deleteRes.ok) {
        const err = await deleteRes.json();
        throw new Error(err.error || "Error al desactivar instructora");
      }

      showNotification("Instructora desactivada correctamente", "success");
      closeDeleteModal();
      loadInstructoras();
    } catch (error) {
      console.error("Error al desactivar instructora:", error);
      showNotification(error.message || "Error al desactivar instructora", "error");
    } finally {
      setReassigning(false);
      setDeletingInstructor(false);
    }
  };

  // Reactivar instructora (cambiar de no_disponible a disponible)
  const handleReactivateInstructor = async (instructor) => {
    try {
      const response = await fetch(`https://elrefugiocountryclub.com/api/api/instructoras/${instructor.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...instructor,
          disponibilidad: "disponible"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al reactivar instructora");
      }

      const data = await response.json();
      showNotification("Instructora reactivada correctamente", "success");
      loadInstructoras();
    } catch (error) {
      console.error("Error al reactivar instructora:", error);
      showNotification(error.message || "Error al reactivar instructora", "error");
    }
  };

  // Funciones para gestión de descansos
  const openDescansosModal = async (instructor) => {
    setSelectedInstructorDescansos(instructor);
    setDescansosModalOpen(true);
    await loadDescansos(instructor.id);
  };

  const closeDescansosModal = () => {
    setDescansosModalOpen(false);
    setSelectedInstructorDescansos(null);
    setDescansos([]);
  };

  const loadDescansos = async (instructoraId) => {
    setLoadingDescansos(true);
    try {
      const response = await fetch(`https://elrefugiocountryclub.com/api/api/descansos/instructora/${instructoraId}`);
      if (!response.ok) {
        throw new Error("Error al cargar descansos");
      }
      const data = await response.json();
      setDescansos(data);
    } catch (error) {
      console.error("Error al cargar descansos:", error);
      showNotification("Error al cargar descansos", "error");
      setDescansos([]);
    } finally {
      setLoadingDescansos(false);
    }
  };

  const openAddDescansoModal = () => {
    setNewDescanso({
      es_recurrente: false,
      dia_semana: "",
      fecha_inicio: "",
      fecha_fin: "",
      motivo: "",
      tipo: "personal"
    });
    setAddDescansoModalOpen(true);
  };

  const closeAddDescansoModal = () => {
    setAddDescansoModalOpen(false);
    setNewDescanso({
      es_recurrente: false,
      dia_semana: "",
      fecha_inicio: "",
      fecha_fin: "",
      motivo: "",
      tipo: "personal"
    });
  };

  const openEditDescansoModal = (descanso) => {
    setEditingDescanso({
      id: descanso.id,
      es_recurrente: descanso.es_recurrente || false,
      dia_semana: descanso.dia_semana || "",
      fecha_inicio: formatDate(descanso.fecha_inicio),
      fecha_fin: formatDate(descanso.fecha_fin),
      motivo: descanso.motivo,
      tipo: descanso.tipo
    });
    setEditDescansoModalOpen(true);
  };

  const closeEditDescansoModal = () => {
    setEditDescansoModalOpen(false);
    setEditingDescanso(null);
  };

  const createDescanso = async () => {
    if (!newDescanso.motivo) {
      showNotification("Por favor completa el motivo del descanso", "error");
      return;
    }

    // Validaciones según el tipo de descanso
    if (newDescanso.es_recurrente) {
      // Descanso fijo recurrente
      if (!newDescanso.dia_semana) {
        showNotification("Por favor selecciona un día de la semana", "error");
        return;
      }
    } else {
      // Descanso programado
      if (!newDescanso.fecha_inicio || !newDescanso.fecha_fin) {
        showNotification("Por favor completa las fechas de inicio y fin", "error");
        return;
      }

      // Validar que fecha_fin no sea anterior a fecha_inicio
      if (new Date(newDescanso.fecha_fin) < new Date(newDescanso.fecha_inicio)) {
        showNotification("La fecha de fin no puede ser anterior a la fecha de inicio", "error");
        return;
      }
    }

    try {
      const descansoData = {
        instructora_id: selectedInstructorDescansos.id,
        motivo: newDescanso.motivo,
        tipo: newDescanso.tipo,
        es_recurrente: Boolean(newDescanso.es_recurrente),
        ...(newDescanso.es_recurrente ? {
          dia_semana: newDescanso.dia_semana
        } : {
          fecha_inicio: newDescanso.fecha_inicio,
          fecha_fin: newDescanso.fecha_fin
        })
      };

      console.log('Enviando descanso:', descansoData); // Debug

      const response = await fetch("https://elrefugiocountryclub.com/api/api/descansos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(descansoData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear descanso");
      }

      showNotification("Descanso registrado correctamente", "success");
      closeAddDescansoModal();
      await loadDescansos(selectedInstructorDescansos.id);
      // Recargar instructoras para actualizar indicadores
      await loadInstructoras();
    } catch (error) {
      console.error("Error al crear descanso:", error);
      showNotification(error.message || "Error al crear descanso", "error");
    }
  };

  const updateDescanso = async () => {
    if (!editingDescanso.motivo) {
      showNotification("Por favor completa el motivo del descanso", "error");
      return;
    }

    // Validaciones según el tipo de descanso
    if (editingDescanso.es_recurrente) {
      // Descanso fijo recurrente
      if (!editingDescanso.dia_semana) {
        showNotification("Por favor selecciona un día de la semana", "error");
        return;
      }
    } else {
      // Descanso programado
      if (!editingDescanso.fecha_inicio || !editingDescanso.fecha_fin) {
        showNotification("Por favor completa las fechas de inicio y fin", "error");
        return;
      }

      // Validar que fecha_fin no sea anterior a fecha_inicio
      if (new Date(editingDescanso.fecha_fin) < new Date(editingDescanso.fecha_inicio)) {
        showNotification("La fecha de fin no puede ser anterior a la fecha de inicio", "error");
        return;
      }
    }

    try {
      const descansoData = {
        motivo: editingDescanso.motivo,
        tipo: editingDescanso.tipo,
        es_recurrente: editingDescanso.es_recurrente,
        ...(editingDescanso.es_recurrente ? {
          dia_semana: editingDescanso.dia_semana
        } : {
          fecha_inicio: editingDescanso.fecha_inicio,
          fecha_fin: editingDescanso.fecha_fin
        })
      };

      const response = await fetch(`https://elrefugiocountryclub.com/api/api/descansos/${editingDescanso.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(descansoData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar descanso");
      }

      showNotification("Descanso actualizado correctamente", "success");
      closeEditDescansoModal();
      await loadDescansos(selectedInstructorDescansos.id);
      // Recargar instructoras para actualizar indicadores
      await loadInstructoras();
    } catch (error) {
      console.error("Error al actualizar descanso:", error);
      showNotification(error.message || "Error al actualizar descanso", "error");
    }
  };

  const deleteDescanso = async (descansoId) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este descanso?")) {
      return;
    }

    try {
      const response = await fetch(`https://elrefugiocountryclub.com/api/api/descansos/${descansoId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar descanso");
      }

      showNotification("Descanso eliminado correctamente", "success");
      await loadDescansos(selectedInstructorDescansos.id);
      // Recargar instructoras para actualizar indicadores
      await loadInstructoras();
    } catch (error) {
      console.error("Error al eliminar descanso:", error);
      showNotification(error.message || "Error al eliminar descanso", "error");
    }
  };

  // Funciones para gestión de horarios
  const openHorariosModal = async (instructor) => {
    setSelectedInstructorHorarios(instructor);
    setHorariosModalOpen(true);
    await loadHorarios(instructor.id);
  };

  const closeHorariosModal = () => {
    setHorariosModalOpen(false);
    setSelectedInstructorHorarios(null);
    setHorarios([]);
  };

  const loadHorarios = async (instructoraId) => {
    setLoadingHorarios(true);
    try {
      const response = await fetch(`https://elrefugiocountryclub.com/api/api/instructoras/${instructoraId}/horarios`);
      if (!response.ok) {
        throw new Error("Error al cargar horarios");
      }
      const data = await response.json();
      setHorarios(data);
    } catch (error) {
      console.error("Error al cargar horarios:", error);
      showNotification("Error al cargar horarios", "error");
      setHorarios([]);
    } finally {
      setLoadingHorarios(false);
    }
  };

  const openAddHorarioModal = () => {
    setNewHorario({
      dia_semana: "",
      hora_inicio: "",
      hora_fin: ""
    });
    setAddHorarioModalOpen(true);
  };

  // Abrir modal de agregar horario prellenado desde la vista tipo horario
  const openAddHorarioPrefilled = (dia, timeSlot) => {
    const endTime = timeSlot.split(':');
    endTime[1] = (parseInt(endTime[1]) + 30).toString().padStart(2, '0');
    if (endTime[1] === '60') {
      endTime[0] = (parseInt(endTime[0]) + 1).toString().padStart(2, '0');
      endTime[1] = '00';
    }
    setNewHorario({
      dia_semana: dia,
      hora_inicio: timeSlot,
      hora_fin: endTime.join(':')
    });
    setAddHorarioModalOpen(true);
  };

  const closeAddHorarioModal = () => {
    setAddHorarioModalOpen(false);
    setNewHorario({
      dia_semana: "",
      hora_inicio: "",
      hora_fin: ""
    });
  };

  const openEditHorarioModal = (horario) => {
    setEditingHorario({
      id: horario.id,
      dia_semana: horario.dia_semana,
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
      activo: horario.activo
    });
    setEditHorarioModalOpen(true);
  };

  const closeEditHorarioModal = () => {
    setEditHorarioModalOpen(false);
    setEditingHorario(null);
  };

  const createHorario = async () => {
    if (!newHorario.dia_semana || !newHorario.hora_inicio || !newHorario.hora_fin) {
      showNotification("Por favor completa todos los campos", "error");
      return;
    }

    // Validar que hora_fin sea posterior a hora_inicio
    if (newHorario.hora_fin <= newHorario.hora_inicio) {
      showNotification("La hora de fin debe ser posterior a la hora de inicio", "error");
      return;
    }

    try {
      const response = await fetch(`https://elrefugiocountryclub.com/api/api/instructoras/${selectedInstructorHorarios.id}/horarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newHorario)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear horario");
      }

      showNotification("Horario creado correctamente", "success");
      closeAddHorarioModal();
      await loadHorarios(selectedInstructorHorarios.id);
    } catch (error) {
      console.error("Error al crear horario:", error);
      showNotification(error.message || "Error al crear horario", "error");
    }
  };

  const updateHorario = async () => {
    if (!editingHorario.dia_semana || !editingHorario.hora_inicio || !editingHorario.hora_fin) {
      showNotification("Por favor completa todos los campos", "error");
      return;
    }

    // Validar que hora_fin sea posterior a hora_inicio
    if (editingHorario.hora_fin <= editingHorario.hora_inicio) {
      showNotification("La hora de fin debe ser posterior a la hora de inicio", "error");
      return;
    }

    try {
      const response = await fetch(`https://elrefugiocountryclub.com/api/api/instructoras/${selectedInstructorHorarios.id}/horarios/${editingHorario.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dia_semana: editingHorario.dia_semana,
          hora_inicio: editingHorario.hora_inicio,
          hora_fin: editingHorario.hora_fin,
          activo: editingHorario.activo
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar horario");
      }

      showNotification("Horario actualizado correctamente", "success");
      closeEditHorarioModal();
      await loadHorarios(selectedInstructorHorarios.id);
    } catch (error) {
      console.error("Error al actualizar horario:", error);
      showNotification(error.message || "Error al actualizar horario", "error");
    }
  };

  const deleteHorario = async (horarioId) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este horario?")) {
      return;
    }

    try {
      const response = await fetch(`https://elrefugiocountryclub.com/api/api/instructoras/${selectedInstructorHorarios.id}/horarios/${horarioId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar horario");
      }

      showNotification("Horario eliminado correctamente", "success");
      await loadHorarios(selectedInstructorHorarios.id);
    } catch (error) {
      console.error("Error al eliminar horario:", error);
      showNotification(error.message || "Error al eliminar horario", "error");
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "";
    const num = parseFloat(amount);
    if (isNaN(num)) return "";
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
  };

  const renderPortal = (node) => ReactDOM.createPortal(node, document.body);

  return (
    <div className="instructoras-admin-container">
      {/* Notificación */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="inst-header">
        <div>
          <h2 className="inst-title"><GraduationCap size={22} /> Gestión de Instructoras</h2>
          <p className="inst-desc">Administra las instructoras del club, su disponibilidad, horarios y descansos.</p>
        </div>
        <button className="inst-btn-nuevo" onClick={openAddInstructorModal} type="button">
          <UserPlus size={18} /> Nueva Instructora
        </button>
      </div>

      <div className="inst-lista">
        {/* Filtros integrados en la card */}
        <div className="inst-filtros">
          <div className="inst-search-wrap">
            <Search size={14} className="inst-search-icon" />
            <input
              type="text"
              className="inst-search-input"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
          </div>
          <select className="inst-filter-select" value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)}>
            <option value="disponible">Solo disponibles</option>
            <option value="">Todas las instructoras</option>
            <option value="no_disponible">Solo no disponibles</option>
          </select>
        </div>

        {/* Resumen de filtros */}
        <p className="inst-summary">
          Mostrando <strong>{filteredInstructoras.length} instructora{filteredInstructoras.length !== 1 ? 's' : ''}</strong>
          {' · '}{availabilityFilter === 'disponible' ? 'Solo disponibles' : availabilityFilter === 'no_disponible' ? 'Solo no disponibles' : 'Todas'}
          {!availabilityFilter && !searchTerm && (
            <span className="inst-summary-hint"> · Usa los filtros para ajustar la búsqueda</span>
          )}
        </p>

        <div className="inst-table-wrap">
          <table className="inst-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Especialidad</th>
                <th>Disponibilidad</th>
                <th>Fecha Registro</th>
                <th className="inst-th-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="inst-empty-cell">
                    <Loader size={32} className="spin" /> Cargando instructoras...
                  </td>
                </tr>
              ) : (() => {
                const filtered = filteredInstructoras;
                return filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="inst-empty-cell"
                  >
                    {searchTerm || availabilityFilter ? "No se encontraron instructoras con los filtros aplicados." : "No hay instructoras registradas."}
                  </td>
                </tr>
              ) : (
                filtered.map(instructor => (
                  <tr 
                    key={instructor.id}
                    style={{
                      opacity: instructor.disponibilidad === "no_disponible" ? 0.5 : 1,
                      background: instructor.disponibilidad === "no_disponible" ? "#f5f5f5" : "transparent"
                    }}
                  >
                    <td style={{ fontWeight: "600" }}>
                      {instructor.nombre} {instructor.apellido}
                    </td>
                    <td style={{ color: "var(--stone-gray)" }}>{instructor.correo || "Sin correo"}</td>
                    <td style={{ color: "var(--charcoal)" }}>{instructor.num_contacto || "N/A"}</td>
                    <td style={{ fontWeight: "600", color: "var(--primary-brown)" }}>
                      {instructor.especialidad.charAt(0).toUpperCase() + instructor.especialidad.slice(1)}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                        {/* Indicador automático basado en descansos */}
                        {
                          instructor.disponibilidad === "no_disponible" ? (
                            <span className="no-disponible-style">
                              <Clock size={14} /> No disponible
                            </span>
                          ) : descansosActivos[instructor.id] ? (
                            <span 
                              title={`Descanso programado (${descansosActivos[instructor.id].tipo}):\n${descansosActivos[instructor.id].motivo}\nDesde: ${formatDate(descansosActivos[instructor.id].fecha_inicio)}\nHasta: ${formatDate(descansosActivos[instructor.id].fecha_fin)}`}
                              style={{
                                background: "#ff9800",
                                color: "white",
                                padding: "0.4rem 0.8rem",
                                borderRadius: "12px",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                cursor: "help",
                                whiteSpace: "nowrap",
                                border: "2px solid #f57c00"
                              }}
                            >
                              <Clock size={14} />
                              En Descanso
                            </span>
                          ) : (
                            <span 
                              style={{
                                background: "#9caf88",
                                color: "white",
                                padding: "0.4rem 0.8rem",
                                borderRadius: "12px",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                whiteSpace: "nowrap",
                                border: "2px solid #7a9768"
                              }}
                            >
                              ✓ Disponible
                            </span>
                          )
                        }
                      </div>
                    </td>
                    <td>{formatDate(instructor.fecha_registro)}</td>
                    <td>
                      <div className="inst-menu-wrapper">
                        {instructor.disponibilidad === "no_disponible" ? (
                          <button
                            className="inst-action-btn inst-action-reactivar"
                            onClick={() => handleReactivateInstructor(instructor)}
                          >
                            <CheckCircle size={14} /> Reactivar
                          </button>
                        ) : (
                          <>
                            <button
                              className="inst-menu-trigger"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openMenuId === instructor.id) {
                                  setOpenMenuId(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const menuH = 230;
                                  const below = window.innerHeight - rect.bottom;
                                  setMenuPos({
                                    top: below >= menuH ? rect.bottom + 4 : undefined,
                                    bottom: below < menuH ? (window.innerHeight - rect.top + 4) : undefined,
                                    left: Math.min(rect.right - 220, window.innerWidth - 230),
                                    instructorId: instructor.id
                                  });
                                  setOpenMenuId(instructor.id);
                                }
                              }}
                            >
                              <MoreVertical size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              );
              })()}
            </tbody>
          </table>
        </div>
      </div>{/* /inst-lista */}

      {/* Dropdown de acciones como portal */}
      {openMenuId !== null && menuPos.instructorId && (() => {
        const inst = filteredInstructoras.find(i => i.id === menuPos.instructorId) || instructoras.find(i => i.id === menuPos.instructorId);
        if (!inst) return null;
        return renderPortal(
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setOpenMenuId(null)}>
            <div className="inst-menu-dropdown" style={{
              position: 'fixed',
              top: menuPos.top,
              bottom: menuPos.bottom,
              left: menuPos.left,
            }} onClick={e => e.stopPropagation()}>
              <button className="inst-menu-item" onClick={() => { openDescansosModal(inst); setOpenMenuId(null); }}>
                <Calendar size={15} />
                <div className="inst-menu-item-text">
                  <span>Descansos</span>
                  <small>Gestionar días libres</small>
                </div>
              </button>
              <button className="inst-menu-item" onClick={() => { openHorariosModal(inst); setOpenMenuId(null); }}>
                <Clock size={15} />
                <div className="inst-menu-item-text">
                  <span>Horarios</span>
                  <small>Configurar disponibilidad</small>
                </div>
              </button>
              <div className="inst-menu-divider" />
              <button className="inst-menu-item" onClick={() => { openEditInstructorModal(inst); setOpenMenuId(null); }}>
                <Edit size={15} />
                <div className="inst-menu-item-text">
                  <span>Editar</span>
                  <small>Modificar datos personales</small>
                </div>
              </button>
              <button className="inst-menu-item inst-menu-item-danger" onClick={() => { openDeleteModal(inst); setOpenMenuId(null); }}>
                <Trash2 size={15} />
                <div className="inst-menu-item-text">
                  <span>Desactivar</span>
                  <small>Quitar de la lista activa</small>
                </div>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Modal unificado: confirmación + reasignación de reservas (Portal) */}
      {deleteModalOpen && instructorToDelete &&
        renderPortal(
          <div className="modal-overlay" onClick={closeDeleteModal}>
            <div className="modal-content" style={{ maxWidth: "640px", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              <h2 style={{ color: "#dc3545", marginBottom: "0.5rem" }}>Desactivar instructora</h2>
              <p style={{ fontSize: "1rem", marginBottom: "1.25rem", color: "var(--charcoal)" }}>
                ¿Estás seguro de que deseas desactivar a{" "}
                <strong>{instructorToDelete.nombre} {instructorToDelete.apellido}</strong>?
              </p>

              {loadingReservas ? (
                <p style={{ color: "var(--stone-gray)", fontSize: "0.95rem", marginBottom: "1rem" }}>Verificando reservas pendientes...</p>
              ) : activeReservations.length > 0 ? (
                <>
                  <p style={{ color: "#b45309", fontSize: "0.95rem", marginBottom: "1rem", fontWeight: "500" }}>
                    Tiene {activeReservations.length} reserva(s) pendiente(s). Asigna un instructor sustituto para cada una.
                  </p>
                  {activeReservations.map((reserva) => (
                    <div key={reserva.id} style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "1rem",
                      marginBottom: "1rem",
                      background: "#fafaf9"
                    }}>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <strong style={{ color: "var(--charcoal)" }}>
                          {new Date(reserva.fecha).toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}
                        </strong>
                        {" · "}
                        {reserva.hora_inicio?.slice(0, 5)} – {reserva.hora_fin?.slice(0, 5)}
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "var(--stone-gray)", marginBottom: "0.75rem" }}>
                        {reserva.clase_nombre} · {reserva.cliente_nombre} {reserva.cliente_apellido}
                      </div>
                      {reserva.candidatos && reserva.candidatos.length > 0 ? (
                        <select
                          value={reasignaciones[reserva.id] || ""}
                          onChange={e => setReasignaciones(prev => ({ ...prev, [reserva.id]: e.target.value }))}
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            fontSize: "0.95rem",
                            background: "white"
                          }}
                        >
                          <option value="">— Seleccionar instructor sustituto —</option>
                          {reserva.candidatos.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
                          ))}
                        </select>
                      ) : (
                        <p style={{ color: "#dc2626", fontSize: "0.9rem", margin: 0 }}>
                          ⚠ No hay instructores disponibles para este horario.
                        </p>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <p style={{ fontSize: "0.9rem", color: "var(--stone-gray)", marginBottom: "1rem" }}>
                  No tiene reservas pendientes. Esta acción la marcará como inactiva.
                </p>
              )}

              <div className="modal-actions" style={{ marginTop: "1.25rem" }}>
                <button
                  className="btn btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={
                    loadingReservas ||
                    reassigning ||
                    deletingInstructor ||
                    activeReservations.some(r => !r.candidatos?.length || !reasignaciones[r.id])
                  }
                  style={{
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px",
                    cursor: (loadingReservas || reassigning || deletingInstructor) ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <Trash2 size={16} />
                  {(reassigning || deletingInstructor) ? "Procesando..." : activeReservations.length > 0 ? "Confirmar y desactivar" : "Sí, Desactivar"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={closeDeleteModal}
                  disabled={reassigning || deletingInstructor}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Modal de edición de instructora (Portal) */}
      {editInstructorModalOpen && editingInstructor &&
        renderPortal(
          <div className="modal-overlay" onClick={closeEditInstructorModal}>
            <div className="modal-content add-client-modal" onClick={e => e.stopPropagation()}>
              <h2>Editar Instructora</h2>
              <div className="modal-section">
                <h3>Información Personal</h3>
                <div className="modal-field">
                  <label>Nombre *:</label>
                  <input
                    type="text"
                    value={editingInstructor.nombre}
                    onChange={e => setEditingInstructor({ ...editingInstructor, nombre: e.target.value })}
                    placeholder="Nombre de la instructora"
                    autoComplete="off"
                    name="editinstructor-nombre"
                  />
                </div>
                <div className="modal-field">
                  <label>Apellido *:</label>
                  <input
                    type="text"
                    value={editingInstructor.apellido}
                    onChange={e => setEditingInstructor({ ...editingInstructor, apellido: e.target.value })}
                    placeholder="Apellido de la instructora"
                    autoComplete="off"
                    name="editinstructor-apellido"
                  />
                </div>
                <div className="modal-field">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={editingInstructor.correo}
                    onChange={e => setEditingInstructor({ ...editingInstructor, correo: e.target.value })}
                    placeholder="ejemplo@email.com"
                    autoComplete="off"
                    name="editinstructor-email"
                  />
                </div>
                <div className="modal-field">
                  <label>Teléfono:</label>
                  <input
                    type="text"
                    value={editingInstructor.num_contacto}
                    onChange={e => setEditingInstructor({ ...editingInstructor, num_contacto: e.target.value })}
                    placeholder="Teléfono"
                    autoComplete="off"
                    name="editinstructor-telefono"
                  />
                </div>
                <div className="modal-field">
                  <label>Especialidad *:</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
                    {['iniciacion', 'ponyclub', 'intermedio', 'paseo', 'avanzado'].map(esp => {
                      const selectedEspecialidades = editingInstructor.especialidad ? editingInstructor.especialidad.split(',') : [];
                      const isChecked = selectedEspecialidades.includes(esp);
                      
                      return (
                        <label key={esp} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              let newEspecialidades = [...selectedEspecialidades];
                              if (e.target.checked) {
                                if (!newEspecialidades.includes(esp)) {
                                  newEspecialidades.push(esp);
                                }
                              } else {
                                newEspecialidades = newEspecialidades.filter(item => item !== esp);
                              }
                              setEditingInstructor({ ...editingInstructor, especialidad: newEspecialidades.join(',') });
                            }}
                            style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                          />
                          <span style={{ textTransform: 'capitalize' }}>{esp}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="modal-field">
                  <label>Tipo de instructor:</label>
                  <select
                    value={editingInstructor.tipo_instructor || "general"}
                    onChange={e => setEditingInstructor({ ...editingInstructor, tipo_instructor: e.target.value })}
                  >
                    <option value="general">General (sólo ve sus clases y marca asistencia)</option>
                    <option value="admin">Admin (ve todas las reservas y edita caballo/actividad)</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={updateInstructor} type="button" disabled={updatingInstructor}>
                  <Edit size={16} /> {updatingInstructor ? "Actualizando..." : "Actualizar Instructora"}
                </button>
                <button className="btn btn-secondary" onClick={closeEditInstructorModal} type="button">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      
      {/* Modal de alta de instructora (Portal) */}
      {addInstructorModalOpen &&
        renderPortal(
          <div className="modal-overlay" onClick={closeAddInstructorModal}>
            <div className="modal-content add-client-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>

              {/* Paso 1: Formulario de creación */}
              {!createdInstructor ? (
                <>
                  <h2>Agregar Nueva Instructora</h2>

                  <div className="modal-section">
                    <h3>Información Personal</h3>

                    {/* Nombre y Apellido en dos columnas */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="modal-field" style={{ marginBottom: 0 }}>
                        <label>Nombre *:</label>
                        <input
                          type="text"
                          value={newInstructor.nombre}
                          onChange={e => setNewInstructor({ ...newInstructor, nombre: e.target.value })}
                          placeholder="Nombre"
                          autoComplete="off"
                          name="newinstructor-nombre"
                        />
                      </div>
                      <div className="modal-field" style={{ marginBottom: 0 }}>
                        <label>Apellido *:</label>
                        <input
                          type="text"
                          value={newInstructor.apellido}
                          onChange={e => setNewInstructor({ ...newInstructor, apellido: e.target.value })}
                          placeholder="Apellido"
                          autoComplete="off"
                          name="newinstructor-apellido"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-section">
                    <h3>Contacto</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="modal-field" style={{ marginBottom: 0 }}>
                        <label><Mail size={13} style={{ marginRight: 4, verticalAlign: 'middle', opacity: 0.6 }} />Email:</label>
                        <input
                          type="email"
                          value={newInstructor.correo}
                          onChange={e => setNewInstructor({ ...newInstructor, correo: e.target.value })}
                          placeholder="ejemplo@email.com"
                          autoComplete="off"
                          name="newinstructor-email"
                        />
                      </div>
                      <div className="modal-field" style={{ marginBottom: 0 }}>
                        <label><Phone size={13} style={{ marginRight: 4, verticalAlign: 'middle', opacity: 0.6 }} />Teléfono:</label>
                        <input
                          type="text"
                          value={newInstructor.telefono}
                          onChange={e => setNewInstructor({ ...newInstructor, telefono: e.target.value })}
                          placeholder="Teléfono"
                          autoComplete="off"
                          name="newinstructor-telefono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-section" style={{ borderBottom: 'none', marginBottom: 0 }}>
                    <h3><Award size={14} style={{ opacity: 0.7 }} /> Especialidades *</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {['iniciacion', 'ponyclub', 'intermedio', 'paseo', 'avanzado'].map(esp => {
                        const selectedEspecialidades = newInstructor.especialidad ? newInstructor.especialidad.split(',') : [];
                        const isChecked = selectedEspecialidades.includes(esp);

                        return (
                          <label key={esp} className="modal-field" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            margin: 0,
                            padding: '0.55rem 0.75rem',
                            border: isChecked ? '1.5px solid #9caf88' : '1.5px solid rgba(107, 68, 35, 0.12)',
                            borderRadius: '8px',
                            background: isChecked ? 'rgba(156, 175, 136, 0.08)' : 'white',
                            transition: 'all 0.2s ease'
                          }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                let newEspecialidades = [...selectedEspecialidades];
                                if (e.target.checked) {
                                  if (!newEspecialidades.includes(esp)) {
                                    newEspecialidades.push(esp);
                                  }
                                } else {
                                  newEspecialidades = newEspecialidades.filter(item => item !== esp);
                                }
                                setNewInstructor({ ...newInstructor, especialidad: newEspecialidades.join(',') });
                              }}
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                            <span style={{ textTransform: 'capitalize', fontSize: '0.88rem', fontWeight: isChecked ? 600 : 400 }}>{esp}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="modal-field">
                    <label>Tipo de instructor:</label>
                    <select
                      value={newInstructor.tipo_instructor || "general"}
                      onChange={e => setNewInstructor({ ...newInstructor, tipo_instructor: e.target.value })}
                    >
                      <option value="general">General (sólo ve sus clases y marca asistencia)</option>
                      <option value="admin">Admin (ve todas las reservas y edita caballo/actividad)</option>
                    </select>
                  </div>

                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={closeAddInstructorModal} type="button">
                      Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={createNewInstructor} type="button" disabled={creatingInstructor}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <UserPlus size={16} /> {creatingInstructor ? "Agregando..." : "Agregar Instructora"}
                    </button>
                  </div>
                </>
              ) : (
                /* Paso 2: Post-creación - Configurar horario */
                <>
                  <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
                    <CheckCircle size={48} style={{ color: '#9caf88', marginBottom: '0.75rem' }} />
                    <h2 style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '0.5rem' }}>
                      Instructora Creada
                    </h2>
                    <p style={{ color: 'var(--stone-gray)', margin: 0, fontSize: '0.9rem' }}>
                      <strong>{createdInstructor.nombre} {createdInstructor.apellido}</strong> se agregó correctamente.
                    </p>
                  </div>

                  {/* Configurar horario */}
                  <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                    <p style={{ margin: '0 0 0.35rem', fontSize: '0.92rem', color: 'var(--dark-brown)', fontWeight: 600 }}>
                      ¿La instructora tiene un horario específico?
                    </p>
                    <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--stone-gray)', lineHeight: 1.5 }}>
                      Si no se configura, estará disponible para dar clases en cualquier horario.
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        closeAddInstructorModal();
                        const instructor = instructoras.find(i => i.id === createdInstructor.id) || createdInstructor;
                        openHorariosModal(instructor);
                      }}
                      type="button"
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '0.5rem', padding: '0.65rem'
                      }}
                    >
                      <SlidersHorizontal size={15} /> Configurar Horario
                    </button>
                  </div>

                  {/* Nota sobre descansos */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.7rem 1rem',
                    marginBottom: '1rem',
                    borderRadius: '8px',
                    background: 'rgba(107, 68, 35, 0.03)',
                    border: '1px solid rgba(107, 68, 35, 0.06)'
                  }}>
                    <Info size={15} style={{ color: 'var(--stone-gray)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--stone-gray)', lineHeight: 1.45 }}>
                      Los descansos y días libres se configuran desde el menú de acciones de cada instructora.
                    </span>
                  </div>

                  <div className="modal-actions" style={{ justifyContent: 'center' }}>
                    <button className="btn btn-secondary" onClick={closeAddInstructorModal} type="button">
                      Listo
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      
      {/* Modal de gestión de descansos (Portal) */}
      {descansosModalOpen && selectedInstructorDescansos &&
        renderPortal(
          <div className="modal-overlay" onClick={closeDescansosModal}>
            <div className="modal-content add-client-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "800px" }}>
              <h2>Descansos - {selectedInstructorDescansos.nombre} {selectedInstructorDescansos.apellido}</h2>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0 }}>Descansos Registrados</h3>
                <button 
                  className="btn btn-primary" 
                  onClick={openAddDescansoModal}
                  style={{
                    background: "linear-gradient(135deg, #9caf88, #6b8e23)",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <Calendar size={16} /> Agregar Descanso
                </button>
              </div>

              {loadingDescansos ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <Loader size={30} className="spin" style={{ color: "var(--terracotta)" }} />
                  <p>Cargando descansos...</p>
                </div>
              ) : descansos.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "2rem", 
                  background: "#f9f9f9", 
                  borderRadius: "8px",
                  color: "var(--stone-gray)"
                }}>
                  <Calendar size={40} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
                  <p style={{ margin: 0 }}>No hay descansos registrados para esta instructora</p>
                </div>
              ) : (
                <div style={{ 
                  maxHeight: "400px", 
                  overflowY: "auto",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px"
                }}>
                  <table className="members-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Día / Fecha Inicio</th>
                        <th>Fecha Fin / Límite</th>
                        <th>Tipo Descanso</th>
                        <th>Motivo</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {descansos.map((descanso) => {
                        const hoy = new Date();
                        hoy.setHours(0, 0, 0, 0);
                        let isActivo = false;
                        let isPasado = false;
                        
                        if (descanso.es_recurrente) {
                          // Para descansos fijos, siempre están activos (a menos que alcancen el límite)
                          const diaSemanaHoy = ['D', 'L', 'M', 'X', 'J', 'V', 'S'][hoy.getDay()];
                          isActivo = descanso.dia_semana === diaSemanaHoy && 
                                    (descanso.limite_reservas === null || 
                                     (descanso.reservas_realizadas || 0) < descanso.limite_reservas);
                          isPasado = false; // Los descansos fijos no "pasan"
                        } else {
                          // Para descansos programados, verificar fechas
                          const inicio = descanso.fecha_inicio ? new Date(descanso.fecha_inicio) : null;
                          const fin = descanso.fecha_fin ? new Date(descanso.fecha_fin) : null;
                          if (inicio && fin) {
                            inicio.setHours(0, 0, 0, 0);
                            fin.setHours(0, 0, 0, 0);
                            isActivo = hoy >= inicio && hoy <= fin;
                            isPasado = fin < hoy;
                          }
                        }
                        
                        const diasMap = { 'L': 'Lunes', 'M': 'Martes', 'X': 'Miércoles', 'J': 'Jueves', 'V': 'Viernes', 'S': 'Sábado', 'D': 'Domingo' };
                        
                        return (
                          <tr key={descanso.id} style={{ 
                            background: isActivo ? "#fff8e1" : isPasado ? "#f5f5f5" : "white",
                            opacity: isPasado ? 0.7 : 1
                          }}>
                            <td>
                              <span style={{
                                padding: "0.25rem 0.75rem",
                                borderRadius: "12px",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                                background: descanso.es_recurrente ? "#e3f2fd" : "#f3e5f5",
                                color: descanso.es_recurrente ? "#1976d2" : "#7b1fa2"
                              }}>
                                {descanso.es_recurrente ? "🔄 Fijo" : "📅 Programado"}
                              </span>
                            </td>
                            <td style={{ fontWeight: isActivo ? "600" : "normal" }}>
                              {descanso.es_recurrente ? (
                                <span>{diasMap[descanso.dia_semana] || descanso.dia_semana}</span>
                              ) : (
                                <>
                                  {formatDate(descanso.fecha_inicio)}
                                  {isActivo && <span style={{ marginLeft: "0.5rem", color: "#9caf88" }}>●</span>}
                                </>
                              )}
                            </td>
                            <td>
                              {descanso.es_recurrente ? (
                                <span style={{ color: "#666", fontStyle: "italic" }}>Recurrente</span>
                              ) : (
                                formatDate(descanso.fecha_fin)
                              )}
                            </td>
                            <td>
                              <span style={{ 
                                padding: "0.25rem 0.75rem",
                                borderRadius: "12px",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                                background: 
                                  descanso.tipo === "vacaciones" ? "#e3f2fd" :
                                  descanso.tipo === "enfermedad" ? "#ffebee" :
                                  descanso.tipo === "personal" ? "#f3e5f5" : "#e0e0e0",
                                color:
                                  descanso.tipo === "vacaciones" ? "#1976d2" :
                                  descanso.tipo === "enfermedad" ? "#d32f2f" :
                                  descanso.tipo === "personal" ? "#7b1fa2" : "#424242"
                              }}>
                                {descanso.tipo.charAt(0).toUpperCase() + descanso.tipo.slice(1)}
                              </span>
                            </td>
                            <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {descanso.motivo}
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                                {!isPasado && (
                                  <>
                                    <button
                                      onClick={() => openEditDescansoModal(descanso)}
                                      title="Editar"
                                      style={{
                                        background: "linear-gradient(135deg, #c17b4a, #8b5a2b)",
                                        color: "white",
                                        border: "none",
                                        padding: "0.4rem",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center"
                                      }}
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      onClick={() => deleteDescanso(descanso.id)}
                                      title="Eliminar"
                                      style={{
                                        background: "#dc3545",
                                        color: "white",
                                        border: "none",
                                        padding: "0.4rem",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center"
                                      }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: "1.5rem" }}>
                <button className="btn btn-secondary" onClick={closeDescansosModal} type="button">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Modal de agregar descanso (Portal) */}
      {addDescansoModalOpen &&
        renderPortal(
          <div className="modal-overlay" onClick={closeAddDescansoModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
              <h2>Agregar Descanso</h2>
              <div className="modal-section">
                <div className="modal-field">
                  <label>Tipo de Descanso *:</label>
                  <select
                    value={newDescanso.es_recurrente ? "recurrente" : "programado"}
                    onChange={e => setNewDescanso({ 
                      ...newDescanso, 
                      es_recurrente: e.target.value === "recurrente",
                      fecha_inicio: e.target.value === "recurrente" ? "" : newDescanso.fecha_inicio,
                      fecha_fin: e.target.value === "recurrente" ? "" : newDescanso.fecha_fin,
                      dia_semana: e.target.value === "programado" ? "" : newDescanso.dia_semana
                    })}
                  >
                    <option value="programado">📅 Descanso Programado (por fechas)</option>
                    <option value="recurrente">🔄 Descanso Fijo Recurrente (por día de semana)</option>
                  </select>
                </div>

                {newDescanso.es_recurrente ? (
                  <>
                    <div className="modal-field">
                      <label>Día de la Semana *:</label>
                      <select
                        value={newDescanso.dia_semana}
                        onChange={e => setNewDescanso({ ...newDescanso, dia_semana: e.target.value })}
                      >
                        <option value="">Selecciona un día</option>
                        <option value="L">Lunes</option>
                        <option value="M">Martes</option>
                        <option value="X">Miércoles</option>
                        <option value="J">Jueves</option>
                        <option value="V">Viernes</option>
                        <option value="S">Sábado</option>
                        <option value="D">Domingo</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="modal-field">
                      <label>Fecha Inicio *:</label>
                      <input
                        type="date"
                        value={newDescanso.fecha_inicio}
                        onChange={e => setNewDescanso({ ...newDescanso, fecha_inicio: e.target.value })}
                        autoComplete="off"
                      />
                    </div>
                    <div className="modal-field">
                      <label>Fecha Fin *:</label>
                      <input
                        type="date"
                        value={newDescanso.fecha_fin}
                        onChange={e => setNewDescanso({ ...newDescanso, fecha_fin: e.target.value })}
                        autoComplete="off"
                      />
                    </div>
                  </>
                )}
                <div className="modal-field">
                  <label>Tipo *:</label>
                  <select
                    value={newDescanso.tipo}
                    onChange={e => setNewDescanso({ ...newDescanso, tipo: e.target.value })}
                  >
                    <option value="personal">Personal</option>
                    <option value="enfermedad">Enfermedad</option>
                    <option value="vacaciones">Vacaciones</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="modal-field">
                  <label>Motivo *:</label>
                  <textarea
                    value={newDescanso.motivo}
                    onChange={e => setNewDescanso({ ...newDescanso, motivo: e.target.value })}
                    placeholder="Describe el motivo del descanso"
                    rows="3"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                      fontSize: "1rem",
                      fontFamily: "inherit",
                      resize: "vertical"
                    }}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={createDescanso} type="button">
                  <Calendar size={16} /> Registrar Descanso
                </button>
                <button className="btn btn-secondary" onClick={closeAddDescansoModal} type="button">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Modal de gestión de horarios (Portal) */}
      {horariosModalOpen && selectedInstructorHorarios &&
        renderPortal(
          <div className="modal-overlay" onClick={closeHorariosModal}>
            <div className="modal-content add-client-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "800px" }}>
              <h2>Horarios Disponibles - {selectedInstructorHorarios.nombre} {selectedInstructorHorarios.apellido}</h2>
              
              <div className="horarios-modal-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0 }}>Horarios Registrados</h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={openHorariosSemanalesModal}
                    style={{
                      background: "linear-gradient(135deg, #4a90e2, #357abd)",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <Calendar size={16} /> Editar Horarios Semanales
                  </button>
                </div>
              </div>

              {loadingHorarios ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <Loader size={30} className="spin" style={{ color: "var(--terracotta)" }} />
                  <p>Cargando horarios...</p>
                </div>
              ) : horarios.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "2rem", 
                  background: "#f9f9f9", 
                  borderRadius: "8px",
                  color: "var(--stone-gray)"
                }}>
                  <Clock size={40} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
                  <p style={{ margin: 0 }}>No hay horarios registrados para esta instructora</p>
                </div>
              ) : (
                <div style={{
                  overflowX: "auto",
                  overflowY: "auto",
                  maxHeight: "400px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  marginBottom: "1rem"
                }}>
                  <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.75rem",
                    minWidth: "700px"
                  }}>
                    <thead>
                      <tr>
                        <th style={{
                          padding: "0.5rem",
                          border: "1px solid #e0e0e0",
                          background: "#f5f5f5",
                          fontWeight: "600",
                          textAlign: "center",
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                          minWidth: "60px"
                        }}>
                          Hora
                        </th>
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(dia => {
                          const diasMap = { 'L': 'Lun', 'M': 'Mar', 'X': 'Mié', 'J': 'Jue', 'V': 'Vie', 'S': 'Sáb', 'D': 'Dom' };
                          return (
                            <th key={dia} style={{
                              padding: "0.5rem",
                              border: "1px solid #e0e0e0",
                              background: "#f5f5f5",
                              fontWeight: "600",
                              textAlign: "center",
                              position: "sticky",
                              top: 0,
                              zIndex: 1,
                              minWidth: "70px"
                            }}>
                              {diasMap[dia]}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {generateTimeSlots().filter((_, index) => index % 2 === 0).map(timeSlot => (
                        <tr key={timeSlot}>
                          <td style={{
                            padding: "0.25rem",
                            border: "1px solid #e0e0e0",
                            background: "#f9f9f9",
                            fontWeight: "600",
                            textAlign: "center",
                            fontSize: "0.7rem",
                            position: "sticky",
                            left: 0,
                            zIndex: 1
                          }}>
                            {timeSlot}
                          </td>
                          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(dia => {
                            const isSelected = horarios.some(h => h.dia_semana === dia && isTimeInRange(timeSlot, h.hora_inicio, h.hora_fin));

                            return (
                              <td
                                key={`${dia}-${timeSlot}`}
                                style={{
                                  padding: "0.1rem",
                                  border: "1px solid #e0e0e0",
                                  background: isSelected ? "#e3f2fd" : "#ffffff",
                                  cursor: "default",
                                  textAlign: "center",
                                  transition: "all 0.15s",
                                  userSelect: "none",
                                  minWidth: "70px",
                                  maxWidth: "70px"
                                }}
                                title={isSelected ? "Horario registrado (solo lectura)" : "Horario no disponible (solo lectura) - Usa 'Editar Horarios Semanales' para modificar"}
                              >
                                <div style={{
                                  width: "100%",
                                  height: "16px",
                                  borderRadius: "2px",
                                  background: isSelected ? "#2196f3" : "#e0e0e0",
                                  transition: "background-color 0.15s",
                                  border: isSelected ? "1px solid #1976d2" : "1px solid #bdbdbd"
                                }}></div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: "1rem" }}>
                <button className="btn btn-secondary" onClick={closeHorariosModal} type="button">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Modal de agregar horario (Portal) */}
      {addHorarioModalOpen &&
        renderPortal(
          <div className="modal-overlay" onClick={closeAddHorarioModal}>
            <div className="modal-content add-client-modal" onClick={e => e.stopPropagation()}>
              <h2>Agregar Horario Disponible</h2>
              
              <div className="form-group">
                <label>Día de la Semana:</label>
                <select
                  value={newHorario.dia_semana}
                  onChange={(e) => setNewHorario({ ...newHorario, dia_semana: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontFamily: "inherit"
                  }}
                >
                  <option value="">Seleccionar día</option>
                  <option value="L">Lunes</option>
                  <option value="M">Martes</option>
                  <option value="X">Miércoles</option>
                  <option value="J">Jueves</option>
                  <option value="V">Viernes</option>
                  <option value="S">Sábado</option>
                  <option value="D">Domingo</option>
                </select>
              </div>

              <div className="form-group">
                <label>Hora de Inicio:</label>
                <input
                  type="time"
                  value={newHorario.hora_inicio}
                  onChange={(e) => setNewHorario({ ...newHorario, hora_inicio: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div className="form-group">
                <label>Hora de Fin:</label>
                <input
                  type="time"
                  value={newHorario.hora_fin}
                  onChange={(e) => setNewHorario({ ...newHorario, hora_fin: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div className="modal-actions">
                <button className="btn btn-primary" onClick={createHorario} type="button">
                  <Clock size={16} /> Crear Horario
                </button>
                <button className="btn btn-secondary" onClick={closeAddHorarioModal} type="button">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Modal de editar horario (Portal) */}
      {editHorarioModalOpen && editingHorario &&
        renderPortal(
          <div className="modal-overlay" onClick={closeEditHorarioModal}>
            <div className="modal-content add-client-modal" onClick={e => e.stopPropagation()}>
              <h2>Editar Horario Disponible</h2>
              
              <div className="form-group">
                <label>Día de la Semana:</label>
                <select
                  value={editingHorario.dia_semana}
                  onChange={(e) => setEditingHorario({ ...editingHorario, dia_semana: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontFamily: "inherit"
                  }}
                >
                  <option value="L">Lunes</option>
                  <option value="M">Martes</option>
                  <option value="X">Miércoles</option>
                  <option value="J">Jueves</option>
                  <option value="V">Viernes</option>
                  <option value="S">Sábado</option>
                  <option value="D">Domingo</option>
                </select>
              </div>

              <div className="form-group">
                <label>Hora de Inicio:</label>
                <input
                  type="time"
                  value={editingHorario.hora_inicio}
                  onChange={(e) => setEditingHorario({ ...editingHorario, hora_inicio: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div className="form-group">
                <label>Hora de Fin:</label>
                <input
                  type="time"
                  value={editingHorario.hora_fin}
                  onChange={(e) => setEditingHorario({ ...editingHorario, hora_fin: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editingHorario.activo}
                    onChange={(e) => setEditingHorario({ ...editingHorario, activo: e.target.checked })}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Activo
                </label>
              </div>

              <div className="modal-actions">
                <button className="btn btn-primary" onClick={updateHorario} type="button">
                  <Edit size={16} /> Actualizar Horario
                </button>
                <button className="btn btn-secondary" onClick={closeEditHorarioModal} type="button">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Modal de editar descanso (Portal) */}
      {editDescansoModalOpen && editingDescanso &&
        renderPortal(
          <div className="modal-overlay" onClick={closeEditDescansoModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
              <h2>Editar Descanso</h2>
              <div className="modal-section">
                <div className="modal-field">
                  <label>Tipo de Descanso *:</label>
                  <select
                    value={editingDescanso.es_recurrente ? "recurrente" : "programado"}
                    onChange={e => setEditingDescanso({ 
                      ...editingDescanso, 
                      es_recurrente: e.target.value === "recurrente",
                      fecha_inicio: e.target.value === "recurrente" ? "" : editingDescanso.fecha_inicio,
                      fecha_fin: e.target.value === "recurrente" ? "" : editingDescanso.fecha_fin,
                      dia_semana: e.target.value === "programado" ? "" : editingDescanso.dia_semana
                    })}
                  >
                    <option value="programado">📅 Descanso Programado (por fechas)</option>
                    <option value="recurrente">🔄 Descanso Fijo Recurrente (por día de semana)</option>
                  </select>
                </div>

                {editingDescanso.es_recurrente ? (
                  <>
                    <div className="modal-field">
                      <label>Día de la Semana *:</label>
                      <select
                        value={editingDescanso.dia_semana}
                        onChange={e => setEditingDescanso({ ...editingDescanso, dia_semana: e.target.value })}
                      >
                        <option value="">Selecciona un día</option>
                        <option value="L">Lunes</option>
                        <option value="M">Martes</option>
                        <option value="X">Miércoles</option>
                        <option value="J">Jueves</option>
                        <option value="V">Viernes</option>
                        <option value="S">Sábado</option>
                        <option value="D">Domingo</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="modal-field">
                      <label>Fecha Inicio *:</label>
                      <input
                        type="date"
                        value={editingDescanso.fecha_inicio}
                        onChange={e => setEditingDescanso({ ...editingDescanso, fecha_inicio: e.target.value })}
                        autoComplete="off"
                      />
                    </div>
                    <div className="modal-field">
                      <label>Fecha Fin *:</label>
                      <input
                        type="date"
                        value={editingDescanso.fecha_fin}
                        onChange={e => setEditingDescanso({ ...editingDescanso, fecha_fin: e.target.value })}
                        autoComplete="off"
                      />
                    </div>
                  </>
                )}
                <div className="modal-field">
                  <label>Tipo *:</label>
                  <select
                    value={editingDescanso.tipo}
                    onChange={e => setEditingDescanso({ ...editingDescanso, tipo: e.target.value })}
                  >
                    <option value="personal">Personal</option>
                    <option value="enfermedad">Enfermedad</option>
                    <option value="vacaciones">Vacaciones</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="modal-field">
                  <label>Motivo *:</label>
                  <textarea
                    value={editingDescanso.motivo}
                    onChange={e => setEditingDescanso({ ...editingDescanso, motivo: e.target.value })}
                    placeholder="Describe el motivo del descanso"
                    rows="3"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                      fontSize: "1rem",
                      fontFamily: "inherit",
                      resize: "vertical"
                    }}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={updateDescanso} type="button">
                  <Edit size={16} /> Actualizar Descanso
                </button>
                <button className="btn btn-secondary" onClick={closeEditDescansoModal} type="button">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}


      

      {/* Modal de editar horario (Portal) */}
      {editHorarioModalOpen && editingHorario &&
        renderPortal(
          <div className="modal-overlay" onClick={closeEditHorarioModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
              <h2>Editar Horario Disponible</h2>
              <div className="modal-section">
                <div className="modal-field">
                  <label>Día de la Semana *:</label>
                  <select
                    value={editingHorario.dia_semana}
                    onChange={e => setEditingHorario({ ...editingHorario, dia_semana: e.target.value })}
                  >
                    <option value="L">Lunes</option>
                    <option value="M">Martes</option>
                    <option value="X">Miércoles</option>
                    <option value="J">Jueves</option>
                    <option value="V">Viernes</option>
                    <option value="S">Sábado</option>
                    <option value="D">Domingo</option>
                  </select>
                </div>
                <div className="modal-field">
                  <label>Hora de Inicio *:</label>
                  <input
                    type="time"
                    value={editingHorario.hora_inicio}
                    onChange={e => setEditingHorario({ ...editingHorario, hora_inicio: e.target.value })}
                    autoComplete="off"
                  />
                </div>
                <div className="modal-field">
                  <label>Hora de Fin *:</label>
                  <input
                    type="time"
                    value={editingHorario.hora_fin}
                    onChange={e => setEditingHorario({ ...editingHorario, hora_fin: e.target.value })}
                    autoComplete="off"
                  />
                </div>
                <div className="modal-field">
                  <label>Estado:</label>
                  <select
                    value={editingHorario.activo ? "activo" : "inactivo"}
                    onChange={e => setEditingHorario({ ...editingHorario, activo: e.target.value === "activo" })}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={updateHorario} type="button">
                  <Edit size={16} /> Actualizar Horario
                </button>
                <button className="btn btn-secondary" onClick={closeEditHorarioModal} type="button">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}


      {/* Modal de horarios semanales (Portal) */}
      {horariosSemanalesModalOpen && selectedInstructorHorarios &&
        renderPortal(
          <div className="modal-overlay" onClick={closeHorariosSemanalesModal}>
            <div className="modal-content horarios-semanales-modal" onClick={e => e.stopPropagation()}>
              <div className="horarios-semanales-header">
                <h2 style={{ marginBottom: '0.25rem' }}>Horarios Semanales</h2>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--stone-gray)' }}>
                  {selectedInstructorHorarios.nombre} {selectedInstructorHorarios.apellido}
                </p>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginBottom: "0.75rem",
                fontSize: "0.82rem",
                color: "var(--stone-gray)"
              }}>
                <span style={{ opacity: 0.8 }}>Toca las celdas para activar/desactivar disponibilidad</span>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <div style={{ width: "10px", height: "10px", background: "#9caf88", borderRadius: "2px" }}></div>
                    <span>Disponible</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <div style={{ width: "10px", height: "10px", background: "#e8e4df", borderRadius: "2px" }}></div>
                    <span>No disponible</span>
                  </div>
                </div>
              </div>

              {loadingHorariosSemanales ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <Loader size={30} className="spin" style={{ color: "var(--terracotta)" }} />
                  <p>Cargando horarios semanales...</p>
                </div>
              ) : (
                <div className="horarios-grid-wrapper">
                  <table className="horarios-grid-table">
                    <thead>
                      <tr>
                        <th className="horarios-grid-th horarios-grid-corner">
                          <Clock size={12} style={{ opacity: 0.5 }} />
                        </th>
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(dia => {
                          const diasFull = { 'L': 'Lun', 'M': 'Mar', 'X': 'Mié', 'J': 'Jue', 'V': 'Vie', 'S': 'Sáb', 'D': 'Dom' };
                          const diasShort = { 'L': 'L', 'M': 'M', 'X': 'X', 'J': 'J', 'V': 'V', 'S': 'S', 'D': 'D' };
                          return (
                            <th key={dia} className="horarios-grid-th horarios-grid-dia">
                              <span className="dia-full">{diasFull[dia]}</span>
                              <span className="dia-short">{diasShort[dia]}</span>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {generateTimeSlots().filter((_, index) => index % 2 === 0).map(timeSlot => (
                        <tr key={timeSlot}>
                          <td className="horarios-grid-time">
                            {timeSlot}
                          </td>
                          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(dia => {
                            const currentHorarios = horariosSemanales[dia] || [];
                            const isSelected = currentHorarios.some(h =>
                              isTimeInRange(timeSlot, h.hora_inicio, h.hora_fin)
                            );

                            return (
                              <td
                                key={`${dia}-${timeSlot}`}
                                onClick={() => handleTimeSlotClick(dia, timeSlot)}
                                className={`horarios-grid-cell ${isSelected ? 'horarios-grid-cell-active' : ''}`}
                                title={isSelected ? "Disponible - Click para quitar" : "No disponible - Click para agregar"}
                              >
                                <div className="horarios-grid-block" />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Conflictos detectados (si aplica) */}
              {conflictos && conflictos.length > 0 && (
                <div style={{ margin: '0.75rem 0', padding: '0.75rem', border: '1px solid #ffc107', background: '#fff8e1', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, color: '#856404', fontSize: '0.85rem' }}>{conflictos.length} conflictos detectados</div>
                  <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    {conflictos.map(c => (
                      <div key={c.id || `${c.date}-${c.time}`} style={{ padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '0.8rem' }}>
                        <div><strong>{c.date}</strong> {c.diaNombre ? `(${c.diaNombre})` : ''} • {c.time || c.hora_inicio} - {c.hora_fin}</div>
                        <div style={{ color: '#6b4423' }}>{c.student || 'Sin cliente'} • <em>{c.type || 'Sin tipo'}</em></div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 6, fontSize: '0.8rem', color: '#856404' }}>Ajusta los bloques antes de guardar.</div>
                </div>
              )}

              {/* Footer fijo */}
              <div className="horarios-semanales-footer">
                <div className="horarios-semanales-resumen">
                  {Object.values(horariosSemanales).reduce((total, horarios) => total + horarios.length, 0)} bloques configurados
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn btn-secondary"
                    onClick={closeHorariosSemanalesModal}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={saveHorariosSemanales}
                    type="button"
                    disabled={loadingHorariosSemanales}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    {loadingHorariosSemanales ? <Loader size={16} className="spin" /> : <Calendar size={16} />}
                    {loadingHorariosSemanales ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default InstructorasAdmin;
