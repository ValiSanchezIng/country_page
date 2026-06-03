// React hooks are provided by the custom hook `useInstructorDashboard` below
import { Calendar, Users, Clock, Download, Check, X, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import CalendarView from "./instructor/CalendarView"
import { DayClassesModal } from "./instructor/DayClassesModal"
import { AttendanceModal } from "./instructor/atendance-modal"
import { CancelIndividualModal } from "./instructor/CancelIndividualModal"
import HorseSelect from "./instructor/HorseSelect"
import useInstructorDashboard from "./instructor/constants.jsx"
import LogoutButton from "./LogoutBoton"
import Toast from "./instructor/Toast"
import "./instructor/instructor.css"

export default function InstructorClases() {
  const {
    searchTerm, setSearchTerm,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    activeView, setActiveView,
    classes, setClasses,
    selectedClass, setSelectedClass,
    showAttendanceModal, setShowAttendanceModal,
    selectedDate,
    showDateClasses, setShowDateClasses,
    dateClasses, filteredClasses,
    handleAttendanceChange,
    handleDateClick,
    handleClassClickFromModal,
    obtenerCaballosParaClase,
    handleHorseChange,
    getHorsesHashForHorario,
    toast,
    setToast,
    loading,
    error,
    instructoraInfo,
    recargarClases,
  } = useInstructorDashboard()

  const [selectedReserva, setSelectedReserva] = useState(null)

  // Mostrar loading
  if (loading) {
    return (
      <div className="dashboard-container-v2" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <div>
          <p>Cargando datos de la instructora...</p>
        </div>
      </div>
    )
  }

  // Mostrar error
  if (error) {
    return (
      <div className="dashboard-container-v2" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3>Error al cargar los datos</h3>
          <p>{error}</p>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Si este no es tu panel, cierra sesión e ingresa con otro usuario.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Reintentar
            </button>
            <LogoutButton showUserName={false} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+Pro:wght@400;600;700&display=swap" rel="stylesheet" />
      
      <div className="dashboard-container-v2">
        {/* Header */}
        <div className="header-v2">
          <div className="header-content">
            <div className="avatar-instructor">
              <Users size={32} />
            </div>
            <div>
              <h1 className="header-title">Panel del Instructor</h1>
              <p className="header-subtitle">
                {instructoraInfo ? 
                  `${instructoraInfo.nombre} ${instructoraInfo.apellido}` : 
                  'Cargando...'
                }
              </p>
            </div>
          </div>
          
          {/* Botón de cerrar sesión colocado antes de descargar reporte */}
          <LogoutButton showUserName={false} />
        </div>

        {/* Tabs de vista */}
        <div className="view-tabs">
          
          <button 
            className={`view-tab ${activeView === 'today' ? 'view-tab-active' : ''}`}
            onClick={() => setActiveView('today')}
          >
            Clases de hoy
          </button>
          <button 
            className={`view-tab ${activeView === 'week' ? 'view-tab-active' : ''}`}
            onClick={() => setActiveView('week')}
          >
            Semana
          </button>
          <button 
            className={`view-tab ${activeView === 'month' ? 'view-tab-active' : ''}`}
            onClick={() => setActiveView('month')}
          >
            Mes
          </button>
          <button 
            className={`view-tab ${activeView === 'history' ? 'view-tab-active' : ''}`}
            onClick={() => setActiveView('history')}
          >
            Historial
          </button>
          <button className="btn-outline-v2 btn-download">
            <Download size={16} />
            Descargar reporte
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        {activeView !== 'month' && (
          <div className="search-bar-v2">
            <div className="search-input-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                className="search-input-v2"
                placeholder="Buscar por alumno o tipo de clase..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filters-row">
              <select 
                className="filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Todas las clases</option>
                <option value="Iniciación">Iniciación</option>
                <option value="Ponyclub">Ponyclub</option>
                <option value="Salto">Salto</option>
                <option value="Paseo">Paseo</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
              <select 
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="confirmada">Confirmada</option>
                <option value="pendiente">Pendiente</option>
                <option value="completada">Completada</option>
              </select>
            </div>
          </div>
        )}

        {/* Contenido según la vista activa */}
        {activeView === 'month' ? (
          <CalendarView classes={classes} onDateClick={handleDateClick} />
        ) : (
          <div className="classes-section-v2">
            <div className="classes-header-v2">
              <div className="classes-title-wrapper">
                <Calendar size={20} className="title-icon" />
                <h2 className="classes-title-v2">
                  {activeView === 'today' ? 'Clases de hoy' : 
                  activeView === 'week' ? 'Esta semana' : 'Historial de clases'}
                </h2>
                <span className="classes-count">{filteredClasses.length} clases</span>
              </div>
            </div>

            {filteredClasses.length === 0 ? (
              <div className="empty-state">
                <Users size={64} />
                <p>No hay clases para mostrar</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="classes-table">
                  <thead>
                    <tr>
                      {activeView !== 'today' && <th>Fecha</th>}
                      <th>Hora</th>
                      <th>Tipo</th>
                      <th>Alumno</th>
                      <th>Edad</th>
                      <th>Caballo</th>
                      <th>Estado</th>
                      <th>Asistencia</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClasses.map((classItem, index) => {
                      // Función para obtener colores del estado (colores más saturados para mejor visibilidad)
                      const getEstadoBadgeColor = (estado) => {
                        switch(estado) {
                          case "confirmada":
                            return { border: "#7a9d6a", color: "#7a9d6a" }; // Verde más oscuro
                          case "pendiente":
                            return { border: "#c8965a", color: "#c8965a" }; // Beige más oscuro/naranja
                          case "cancelada":
                            return { border: "#6b4423", color: "#6b4423" }; // Marrón más oscuro
                          case "completada":
                            return { border: "#7a9d6a", color: "#7a9d6a" }; // Verde más oscuro
                          default:
                            return { border: "#b8653a", color: "#b8653a" }; // Terracotta más oscuro
                        }
                      };
                      
                      const estadoColor = getEstadoBadgeColor(classItem.status);
                      const isEven = index % 2 === 0;
                      
                      return (
                      <tr 
                        key={classItem.id}
                        style={{
                          backgroundColor: isEven ? 'white' : '#f5f1e8'
                        }}
                      >
                        {activeView !== 'today' && (
                          <td>
                            <span style={{ fontWeight: '600' }}>
                              {(() => {
                                // Crear fecha asegurándonos de que use la zona horaria local
                                const [year, month, day] = classItem.date.split('-');
                                const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                return date.toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short'
                                });
                              })()}
                            </span>
                          </td>
                        )}
                        <td>
                          <div className="time-cell">
                            <Clock size={16} />
                            {classItem.time}
                          </div>
                        </td>
                        <td>
                          <span className="type-badge">{classItem.type}</span>
                        </td>
                        <td>
                          <span className="student-name">{classItem.student}</span>
                        </td>
                        <td>{classItem.studentAge} años</td>
                        <td>
                          <HorseSelect
                            classItem={classItem}
                            onHorseChange={handleHorseChange}
                            obtenerCaballosParaClase={obtenerCaballosParaClase}
                            horsesHash={getHorsesHashForHorario(classItem.date, classItem.time)}
                            disabled={activeView === 'history' || classItem.attendance === 'asistió' || classItem.status === 'completada'}
                          />
                        </td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              borderColor: estadoColor.border,
                              color: estadoColor.color,
                              padding: "0.4rem 0.8rem",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "default",
                              textAlign: "center"
                            }}
                          >
                            {classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <button 
                            className={`btn-attendance ${
                              classItem.attendance === 'asistió' ? 'attendance-asistio' : 
                              classItem.attendance === 'faltó' ? 'attendance-falto' : ''
                            }`}
                            onClick={() => {
                              if (activeView !== 'history') {
                                setSelectedClass(classItem)
                                setShowAttendanceModal(true)
                              }
                            }}
                            disabled={activeView === 'history'}
                          >
                            {classItem.attendance === 'asistió' ? (
                              <>
                                <Check size={16} />
                                Asistió
                              </>
                            ) : classItem.attendance === 'faltó' ? (
                              <>
                                <X size={16} />
                                Faltó
                              </>
                            ) : (
                              'Marcar'
                            )}
                          </button>
                        </td>
                        <td>
                          {(() => {
                            const status = classItem.status?.toLowerCase();
                            // Verificar si puede cancelar: debe ser pendiente o confirmada Y tener instructoraInfo
                            // El backend devuelve instructora.id (no instructora_id)
                            const puedeCancelar = (status === 'pendiente' || status === 'confirmada') && instructoraInfo?.id;
                            return puedeCancelar ? (
                              <button
                                onClick={() => {
                                  const [year, month, day] = classItem.date.split('-');
                                  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                  setSelectedReserva({
                                    ...classItem,
                                    date: date,
                                    cliente_id: classItem.cliente_id
                                  });
                                }}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#A63924',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8b2e1f'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#A63924'}
                              >
                                <X size={14} />
                                Cancelar
                              </button>
                            ) : null;
                          })()}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {showAttendanceModal && selectedClass && (
        <AttendanceModal
          classData={selectedClass}
          onClose={() => setShowAttendanceModal(false)}
          onAttendanceChange={handleAttendanceChange}
        />
      )}

      {selectedReserva && (
        <CancelIndividualModal
          reserva={selectedReserva}
          onClose={() => setSelectedReserva(null)}
          onCancelSuccess={() => {
            setSelectedReserva(null)
            recargarClases()
          }}
        />
      )}

      {showDateClasses && selectedDate && (() => {
        const instructoraIdValue = instructoraInfo?.instructora_id || instructoraInfo?.id;
        return (
        <DayClassesModal
          date={selectedDate}
          classes={dateClasses}
          onClose={() => setShowDateClasses(false)}
          onClassClick={handleClassClickFromModal}
          instructoraId={instructoraIdValue}
          onCancelSuccess={async (result) => {
            // Recargar las clases después de cancelar
            await recargarClases()
            // Mostrar mensaje de éxito
            setToast({ 
              message: result.message || `Se cancelaron ${result.canceladas || 1} reserva(s) correctamente`, 
              type: 'success' 
            })
          }}
        />
        );
      })()}

      {/* Toast discreto para advertencias */}
      {toast && (
        <>
          {console.log('🎨 Renderizando Toast con:', toast)}
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => {
              console.log('🔴 Cerrando toast');
              setToast(null);
            }}
          />
        </>
      )}
    </>
  )
}