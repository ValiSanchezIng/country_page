// React hooks are provided by the custom hook `useInstructorDashboard` below
import { Calendar, Users, Clock, Download, Check, X, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import CalendarView from "./instructor/CalendarView"
import { DayClassesModal } from "./instructor/DayClassesModal"
import { AttendanceModal } from "./instructor/atendance-modal"
import { CancelIndividualModal } from "./instructor/CancelIndividualModal"
import HorseSelect from "./instructor/HorseSelect"
import useInstructorDashboard from "./instructor/constants.jsx"
import MetricasCaballos from "./MetricasCaballos"
import CaballosPerfil from "./CaballosPerfil"
import ErrorBoundary from "./ErrorBoundary"
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
    esInstructorAdmin,
    handleSessionSave,
    recargarClases,
  } = useInstructorDashboard()

  const [selectedReserva, setSelectedReserva] = useState(null)
  // Sesión en edición (modal de actividad/observaciones del instructor admin)
  const [sessionEdit, setSessionEdit] = useState(null)

  // Paginación del Historial (50 por página para que cargue rápido)
  const HISTORY_PAGE_SIZE = 50
  const [historyPage, setHistoryPage] = useState(1)
  // Reiniciar a la página 1 al cambiar de vista o filtros
  useEffect(() => { setHistoryPage(1) }, [activeView, searchTerm, filterType, filterStatus])

  const isHistory = activeView === 'history'
  const historyTotalPages = isHistory ? Math.max(1, Math.ceil(filteredClasses.length / HISTORY_PAGE_SIZE)) : 1
  const historyPageSafe = Math.min(historyPage, historyTotalPages)
  const displayedClasses = isHistory
    ? filteredClasses.slice((historyPageSafe - 1) * HISTORY_PAGE_SIZE, historyPageSafe * HISTORY_PAGE_SIZE)
    : filteredClasses

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
          <button
            className={`view-tab ${activeView === 'caballos' ? 'view-tab-active' : ''}`}
            onClick={() => setActiveView('caballos')}
          >
            Caballos
          </button>
          <button
            className={`view-tab ${activeView === 'dashboard' ? 'view-tab-active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            Dashboard
          </button>
          <button className="btn-outline-v2 btn-download">
            <Download size={16} />
            Descargar reporte
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        {activeView !== 'month' && activeView !== 'dashboard' && activeView !== 'caballos' && (
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
        {activeView === 'dashboard' ? (
          <ErrorBoundary><MetricasCaballos /></ErrorBoundary>
        ) : activeView === 'caballos' ? (
          <ErrorBoundary><CaballosPerfil /></ErrorBoundary>
        ) : activeView === 'month' ? (
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
                    {displayedClasses.map((classItem, index) => {
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
                          {esInstructorAdmin ? (
                            <HorseSelect
                              classItem={classItem}
                              onHorseChange={handleHorseChange}
                              obtenerCaballosParaClase={obtenerCaballosParaClase}
                              horsesHash={getHorsesHashForHorario(classItem.date, classItem.time)}
                              disabled={activeView === 'history' || classItem.attendance === 'asistió' || classItem.status === 'completada'}
                            />
                          ) : (
                            <span className="student-name">{classItem.horse || 'Sin asignar'}</span>
                          )}
                          {(classItem.caballo_estatus === 'renta' || classItem.caballo_estatus === 'media_renta') && (
                            <div style={{ marginTop: 4, fontSize: '0.72rem', color: '#b8860b', fontWeight: 600 }}>
                              En renta{classItem.caballo_renta_cliente ? `: ${classItem.caballo_renta_cliente}` : ''}
                            </div>
                          )}
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
                          {/* Sesión: el admin edita actividad/observaciones; el general las ve en sólo lectura */}
                          {esInstructorAdmin ? (
                            <button
                              onClick={() => setSessionEdit({
                                id: classItem.id,
                                actividad: classItem.actividad || '',
                                observaciones: classItem.observaciones || '',
                                student: classItem.student
                              })}
                              style={{ padding: '6px 12px', backgroundColor: '#6b4423', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 6 }}
                            >
                              Sesión
                            </button>
                          ) : (
                            (classItem.actividad || classItem.observaciones) && (
                              <div style={{ fontSize: '0.74rem', color: '#555', marginBottom: 6, maxWidth: 200 }}>
                                {classItem.actividad && <div><strong>Actividad:</strong> {classItem.actividad}</div>}
                                {classItem.observaciones && <div><strong>Obs:</strong> {classItem.observaciones}</div>}
                              </div>
                            )
                          )}
                          {/* La opción de cancelar reservas solo está disponible en el panel de administrador, no en la vista del instructor. */}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación del historial (50 por página) */}
            {isHistory && filteredClasses.length > HISTORY_PAGE_SIZE && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                <button
                  className="btn-outline-v2"
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  disabled={historyPageSafe <= 1}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: historyPageSafe <= 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <span style={{ fontSize: '0.9rem', color: '#6b4423', fontWeight: 600 }}>
                  Página {historyPageSafe} de {historyTotalPages}
                  <span style={{ color: '#999', fontWeight: 400 }}>
                    {' '}· {(historyPageSafe - 1) * HISTORY_PAGE_SIZE + 1}-{Math.min(historyPageSafe * HISTORY_PAGE_SIZE, filteredClasses.length)} de {filteredClasses.length}
                  </span>
                </span>
                <button
                  className="btn-outline-v2"
                  onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                  disabled={historyPageSafe >= historyTotalPages}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: historyPageSafe >= historyTotalPages ? 0.5 : 1 }}
                >
                  Siguiente <ChevronRight size={16} />
                </button>
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

      {/* Modal de edición de sesión (instructor admin): actividad + observaciones */}
      {sessionEdit && (
        <div
          onClick={() => setSessionEdit(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', width: 'min(480px, 92vw)' }}>
            <h2 style={{ marginTop: 0, color: '#6b4423' }}>Sesión de {sessionEdit.student}</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#555', marginBottom: 4 }}>Actividad realizada</label>
              <input
                type="text"
                value={sessionEdit.actividad}
                onChange={(e) => setSessionEdit({ ...sessionEdit, actividad: e.target.value })}
                placeholder="Ej. Trote, salto bajo, doma…"
                style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc' }}
              />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#555', marginBottom: 4 }}>Observaciones</label>
              <textarea
                value={sessionEdit.observaciones}
                onChange={(e) => setSessionEdit({ ...sessionEdit, observaciones: e.target.value })}
                rows={4}
                placeholder="Notas de la clase…"
                style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setSessionEdit(null)} style={{ padding: '0.5rem 1rem', background: '#eee', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
              <button
                onClick={async () => {
                  await handleSessionSave(sessionEdit.id, { actividad: sessionEdit.actividad, observaciones: sessionEdit.observaciones });
                  setSessionEdit(null);
                }}
                style={{ padding: '0.5rem 1rem', background: '#9caf88', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

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