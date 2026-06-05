// Configuración de horarios por CLASE (no por nivel de usuario)
// Nota: los lunes NO hay clases y no hay turno de tarde en fin de semana.
// Estos valores son sólo un fallback visual; la verdad la entrega el backend
// (GET /api/horarios/clase, que lee horarios_clase con activo/capacidad).
// Cupos por nivel: Ponyclub=1, Paseo=1, Iniciación=5, Intermedio=5, Avanzado=8.
export const SCHEDULE_CONFIGS_BY_CLASS = {
  iniciacion: {
    duration: 30, // minutos por clase
    weekdays: { // Martes a Viernes (lunes sin clases)
      days: ["Martes", "Miércoles", "Jueves", "Viernes"],
      timeSlots: ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "15:00", "15:30", "16:00", "16:30"],
      capacity: 5,
    },
    saturday: { // Sábado (sólo mañana)
      days: ["Sábado"],
      timeSlots: ["07:30", "08:00", "08:30", "09:00", "09:30"],
      capacity: 5,
    },
    sunday: { // Domingo (sólo mañana)
      days: ["Domingo"],
      timeSlots: ["07:30", "08:00", "08:30", "09:00", "09:30"],
      capacity: 5,
    }
  },
  ponyclub: {
    duration: 30,
    weekdays: {
      days: ["Martes", "Miércoles", "Jueves", "Viernes"],
      timeSlots: ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "15:00", "15:30", "16:00", "16:30"],
      capacity: 1,
    },
    saturday: {
      days: ["Sábado"],
      timeSlots: ["07:30", "08:00", "08:30", "09:00", "09:30"],
      capacity: 1,
    },
    sunday: {
      days: ["Domingo"],
      timeSlots: ["07:30", "08:00", "08:30", "09:00", "09:30"],
      capacity: 1,
    }
  },
  intermedio: {
    duration: 60, // minutos por clase
    weekdays: { // Martes a Viernes
      days: ["Martes", "Miércoles", "Jueves", "Viernes"],
      timeSlots: ["08:00", "09:00", "10:00", "17:00"],
      capacity: 5,
    },
    weekend: { // Sábados y Domingos (sólo mañana)
      days: ["Sábado", "Domingo"],
      timeSlots: ["08:00", "09:00", "10:00"],
      capacity: 5,
    }
  },
  paseo: {
    duration: 60, // minutos por clase
    weekdays: { // Martes a Viernes
      days: ["Martes", "Miércoles", "Jueves", "Viernes"],
      timeSlots: ["08:00", "09:00", "10:00", "11:00", "12:00", "16:00", "17:00"],
      capacity: 1,
    },
    weekend: { // Sábados y Domingos (sólo mañana)
      days: ["Sábado", "Domingo"],
      timeSlots: ["08:00", "09:00", "10:00", "11:00"],
      capacity: 1,
    }
  },
  salto: {
    duration: 60, // minutos por clase
    weekdays: { // Martes a Viernes
      days: ["Martes", "Miércoles", "Jueves", "Viernes"],
      timeSlots: ["08:00", "09:00", "10:00", "17:00"],
      capacity: 8,
    },
    weekend: { // Sábados y Domingos (sólo mañana)
      days: ["Sábado", "Domingo"],
      timeSlots: ["08:00", "09:00", "10:00"],
      capacity: 8,
    }
  },
  avanzado: {
    duration: 60, // minutos por clase
    weekdays: { // Martes a Viernes
      days: ["Martes", "Miércoles", "Jueves", "Viernes"],
      timeSlots: ["08:00", "09:00", "10:00", "17:00"],
      capacity: 8,
    },
    weekend: { // Sábados y Domingos (sólo mañana)
      days: ["Sábado", "Domingo"],
      timeSlots: ["08:00", "09:00", "10:00"],
      capacity: 8,
    }
  }
};

// Configuración legacy por nivel de usuario (mantenida para compatibilidad)
export const SCHEDULE_CONFIGS = {
  Intermedio: {
    days: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    timeSlots: ["16:00", "17:00", "18:00", "19:00"],
    capacity: 2,
  },
  Iniciación: {
    days: ["Sábado", "Domingo"],
    timeSlots: ["10:00", "11:00", "12:00", "13:00", "16:00", "17:00", "18:00", "19:00"],
    capacity: 6,
    specialCapacity: {
      "10:00": 5,
      "13:00": 5,
      "16:00": 5,
      "19:00": 5,
    },
  },
  Avanzado: {
    days: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
    timeSlots: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
    capacity: 6,
  },
}

export const MOCK_BOOKINGS = [
  { id: "b1", userId: "1", userName: "María García", timeSlotId: "Lunes-16:00" },
  { id: "b2", userId: "4", userName: "Pedro López", timeSlotId: "Lunes-16:00" },
  { id: "b3", userId: "1", userName: "María García", timeSlotId: "Miércoles-17:00" },
]