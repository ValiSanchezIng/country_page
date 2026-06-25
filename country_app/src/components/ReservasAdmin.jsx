import React, { useState, useEffect, useCallback } from "react";
import useAutoRefresh from '../hooks/useAutoRefresh';
import { Loader, ChevronLeft, ChevronRight, Search, CalendarDays } from "lucide-react";
import "../CSS/ReservasAdmin.css";

const ReservasAdmin = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [filtroTiempo, setFiltroTiempo] = useState("dia"); // "dia", "semana", "mes", "personalizado"
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split("T")[0]);
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split("T")[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split("T")[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [claseFilter, setClaseFilter] = useState("");
  const [instructorFilter, setInstructorFilter] = useState("");
  const [caballoFilter, setCaballoFilter] = useState("");
  // Listas completas para los filtros (no dependen de las reservas del periodo)
  const [instructoresList, setInstructoresList] = useState([]);
  const [caballosList, setCaballosList] = useState([]);
  const itemsPerPage = 10;

  // Catálogo fijo de clases (coincide con clases.nombre en la BD)
  const CLASES_CATALOGO = ["iniciacion", "ponyclub", "paseo", "intermedio", "avanzado"];

  // Mostrar notificación
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 4000);
  };

  // Cambiar el estatus de una reserva (incluye cancelar) desde el admin
  const cambiarEstatus = async (id, nuevoEstatus) => {
    const previas = reservas;
    // Actualización optimista
    setReservas(prev => prev.map(r => r.id === id ? { ...r, estatus: nuevoEstatus } : r));
    try {
      const response = await fetch(`https://elrefugiocountryclub.com/api/api/reservas-admin/${id}/estatus`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estatus: nuevoEstatus }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Error al actualizar estatus");
      }
      showNotification(
        nuevoEstatus === "cancelada" ? "Clase cancelada correctamente" : "Estatus actualizado",
        "success"
      );
    } catch (error) {
      console.error("Error al cambiar estatus:", error);
      setReservas(previas); // revertir
      showNotification(error.message || "Error al actualizar estatus", "error");
    }
  };

  // Cargar reservas desde el backend
  const loadReservas = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let url = "https://elrefugiocountryclub.com/api/api/reservas-admin";
      const params = new URLSearchParams();

      if (filtroTiempo === "dia") {
        params.append("fecha", fechaSeleccionada);
      } else if (filtroTiempo === "semana") {
        const fechaBase = new Date(fechaSeleccionada);
        const inicioSemana = new Date(fechaBase);
        inicioSemana.setDate(fechaBase.getDate() - fechaBase.getDay());
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);

        params.append("fecha_inicio", inicioSemana.toISOString().split("T")[0]);
        params.append("fecha_fin", finSemana.toISOString().split("T")[0]);
      } else if (filtroTiempo === "mes") {
        const [year, month] = mesSeleccionado.split("-").map(Number);
        const inicioMes = new Date(year, month - 1, 1);
        const finMes = new Date(year, month, 0); // último día del mes
        params.append("fecha_inicio", inicioMes.toISOString().split("T")[0]);
        params.append("fecha_fin", finMes.toISOString().split("T")[0]);
      } else if (filtroTiempo === "personalizado") {
        params.append("fecha_inicio", fechaInicio);
        params.append("fecha_fin", fechaFin);
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Error al cargar reservas");
      }

      const data = await response.json();
      setReservas(data);
    } catch (error) {
      console.error("Error al cargar reservas:", error);
      if (!silent) showNotification("Error al cargar reservas", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadReservas();
    setCurrentPage(1);
  }, [filtroTiempo, fechaSeleccionada, mesSeleccionado, fechaInicio, fechaFin]);

  // Cargar catálogos completos de instructores y caballos para los filtros (una vez)
  useEffect(() => {
    fetch("https://elrefugiocountryclub.com/api/api/instructoras")
      .then(r => r.ok ? r.json() : [])
      .then(data => setInstructoresList(Array.isArray(data) ? data : []))
      .catch(() => setInstructoresList([]));
    fetch("https://elrefugiocountryclub.com/api/api/caballos")
      .then(r => r.ok ? r.json() : [])
      .then(data => setCaballosList(Array.isArray(data) ? data : []))
      .catch(() => setCaballosList([]));
  }, []);

  // Auto-refresh silencioso cada 30s
  const refreshReservas = useCallback(() => loadReservas(true), [filtroTiempo, fechaSeleccionada, mesSeleccionado, fechaInicio, fechaFin]);
  useAutoRefresh(refreshReservas, { interval: 30000 });

  // Opciones de los filtros: listas COMPLETAS (todas las clases, instructores y caballos),
  // no solo lo que aparece en las reservas del periodo.
  const normalizarNombre = (n = "", a = "") => `${n} ${a}`.replace(/\s+/g, " ").trim();
  const nombreInstructora = (r) => (r.instructora_nombre && r.instructora_apellido)
    ? normalizarNombre(r.instructora_nombre, r.instructora_apellido) : "";
  const clasesUnicas = CLASES_CATALOGO;
  const instructoresUnicos = [...new Set(
    instructoresList
      .map(i => normalizarNombre(i.nombre, i.apellido))
      .filter(Boolean)
  )].sort();
  const caballosUnicos = [...new Set(
    caballosList.map(c => c.nombre).filter(Boolean)
  )].sort();

  // Filtrar reservas
  const filteredReservas = reservas.filter(r => {
    const clienteNombre = r.cliente_nombre && r.cliente_apellido ? `${r.cliente_nombre} ${r.cliente_apellido}` : "";
    const instructoraNombre = nombreInstructora(r);
    const matchesSearch = searchTerm === "" ||
      clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructoraNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.caballo_nombre && r.caballo_nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesEstado = estadoFilter === "" || r.estatus === estadoFilter;
    const matchesClase = claseFilter === "" || r.clase_nombre === claseFilter;
    const matchesInstructor = instructorFilter === "" || instructoraNombre === instructorFilter;
    const matchesCaballo = caballoFilter === "" || r.caballo_nombre === caballoFilter;
    return matchesSearch && matchesEstado && matchesClase && matchesInstructor && matchesCaballo;
  });

  // Calcular paginación sobre filtrados
  const totalPages = Math.ceil(filteredReservas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReservas = filteredReservas.slice(startIndex, endIndex);

  // Calcular metricas (siempre sobre todas las del periodo)
  const totalReservas = reservas.length;
  const confirmadas = reservas.filter(r => r.estatus === "confirmada").length;
  const pendientes = reservas.filter(r => r.estatus === "pendiente").length;
  const completadas = reservas.filter(r => r.estatus === "completada").length;
  const canceladas = reservas.filter(r => r.estatus === "cancelada").length;

  const formatDate = (dateString) => {
    if (!dateString) return "";

    // Extraer solo la parte de la fecha si viene en formato ISO (YYYY-MM-DDTHH:MM:SS.SSSZ)
    const fechaSolo = dateString.split('T')[0];

    // Parsear la fecha en zona horaria local para evitar problemas de conversión UTC
    const [year, month, day] = fechaSolo.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    if (isNaN(date.getTime())) return "Invalid Date";

    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    // timeString viene en formato HH:MM:SS, extraemos HH:MM
    return timeString.substring(0, 5);
  };

  const getEstadoBadgeColor = (estado) => {
    switch(estado) {
      case "confirmada":
        return { border: "#9caf88", color: "#9caf88" };
      case "pendiente":
        return { border: "#d4a574", color: "#d4a574" };
      case "cancelada":
        return { border: "#8b5a2b", color: "#8b5a2b" };
      case "completada":
        return { border: "#9caf88", color: "#9caf88" };
      default:
        return { border: "#c17b4a", color: "#c17b4a" };
    }
  };

  const getRangoSemana = () => {
    const fechaBase = new Date(fechaSeleccionada);
    const inicioSemana = new Date(fechaBase);
    inicioSemana.setDate(fechaBase.getDate() - fechaBase.getDay());
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);

    return `${formatDate(inicioSemana.toISOString().split("T")[0])} - ${formatDate(finSemana.toISOString().split("T")[0])}`;
  };

  const getNombreMes = () => {
    const [year, month] = mesSeleccionado.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  const getResumenRango = () => {
    if (filtroTiempo === "dia") {
      return formatDate(fechaSeleccionada);
    } else if (filtroTiempo === "semana") {
      return getRangoSemana();
    } else if (filtroTiempo === "mes") {
      const [year, month] = mesSeleccionado.split("-").map(Number);
      const inicio = new Date(year, month - 1, 1);
      const fin = new Date(year, month, 0);
      return `${formatDate(inicio.toISOString().split("T")[0])} - ${formatDate(fin.toISOString().split("T")[0])}`;
    } else {
      return `${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`;
    }
  };

  const getPaginationPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    if (currentPage <= 3) { start = 2; end = 4; }
    if (currentPage >= totalPages - 2) { start = totalPages - 3; end = totalPages - 1; }
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="reservas-admin-container">
      {/* Notificación */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="ra-header">
        <div>
          <h2 className="ra-title">
            <CalendarDays size={22} /> Gestión de Reservas
          </h2>
          <p className="ra-desc">
            Consulta y administra las reservas por día, semana, mes o un rango personalizado.
          </p>
        </div>
      </div>

      {/* Metricas */}
      {!loading && reservas.length > 0 && (
        <div className="stats-grid caballos-stats" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          <div className="stat-card">
            <div className="stat-card-topline topline-terracotta"></div>
            <div className="stat-title">Total</div>
            <div className="stat-value">{totalReservas}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-topline topline-sage"></div>
            <div className="stat-title">Confirmadas</div>
            <div className="stat-value">{confirmadas}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-topline topline-light"></div>
            <div className="stat-title">Pendientes</div>
            <div className="stat-value">{pendientes}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-topline topline-sage"></div>
            <div className="stat-title">Completadas</div>
            <div className="stat-value">{completadas}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-topline topline-brown"></div>
            <div className="stat-title">Canceladas</div>
            <div className="stat-value">{canceladas}</div>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="ra-lista">
        {/* Filtros integrados en la card */}
        <div className="ra-filtros">
          <div className="ra-search-wrap">
            <Search size={14} className="ra-search-icon" />
            <input
              type="text"
              className="ra-search-input"
              placeholder="Buscar por cliente, instructora o caballo..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              autoComplete="off"
            />
          </div>

          <div className="ra-period-pills">
            {[
              { value: "dia", label: "Día" },
              { value: "semana", label: "Semana" },
              { value: "mes", label: "Mes" },
              { value: "personalizado", label: "Personalizado" },
            ].map(op => (
              <button
                key={op.value}
                type="button"
                className={`ra-pill${filtroTiempo === op.value ? " is-active" : ""}`}
                onClick={() => setFiltroTiempo(op.value)}
              >
                {op.label}
              </button>
            ))}
          </div>

          {(filtroTiempo === "dia" || filtroTiempo === "semana") && (
            <input
              type="date"
              className="ra-date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              onClick={(e) => { e.preventDefault(); e.target.showPicker(); }}
            />
          )}
          {filtroTiempo === "mes" && (
            <input
              type="month"
              className="ra-date"
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              onClick={(e) => { e.preventDefault(); e.target.showPicker(); }}
            />
          )}
          {filtroTiempo === "personalizado" && (
            <>
              <input
                type="date"
                className="ra-date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                onClick={(e) => { e.preventDefault(); e.target.showPicker(); }}
              />
              <input
                type="date"
                className="ra-date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                onClick={(e) => { e.preventDefault(); e.target.showPicker(); }}
              />
            </>
          )}

          <select className="ra-filter-select" value={estadoFilter} onChange={(e) => { setEstadoFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <select className="ra-filter-select" value={claseFilter} onChange={(e) => { setClaseFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">Todas las clases</option>
            {clasesUnicas.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <select className="ra-filter-select" value={instructorFilter} onChange={(e) => { setInstructorFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">Todas las instructoras</option>
            {instructoresUnicos.map(i => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          <select className="ra-filter-select" value={caballoFilter} onChange={(e) => { setCaballoFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">Todos los caballos</option>
            {caballosUnicos.map(cab => (
              <option key={cab} value={cab}>{cab}</option>
            ))}
          </select>
        </div>

        {/* Resumen de filtros */}
        <p className="ra-summary">
          Mostrando <strong>{filteredReservas.length} reserva{filteredReservas.length !== 1 ? 's' : ''}</strong>
          {' · '}{estadoFilter ? estadoFilter.charAt(0).toUpperCase() + estadoFilter.slice(1) : 'Todos los estados'}
          {' · '}{getResumenRango()}
          {!estadoFilter && !searchTerm && (
            <span className="ra-summary-hint"> · Usa los filtros para ajustar la búsqueda</span>
          )}
        </p>

        {/* Tabla de reservas */}
        <div className="ra-table-wrap">
          <table className="ra-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora Inicio</th>
                <th>Hora Fin</th>
                <th>Cliente</th>
                <th>Instructora</th>
                <th>Caballo</th>
                <th>Clase</th>
                <th>Tipo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="ra-empty-cell">
                    <Loader size={32} className="spin" /> Cargando reservas...
                  </td>
                </tr>
              ) : currentReservas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="ra-empty-cell">
                    <div className="ra-empty-inner">
                      <CalendarDays size={40} opacity={0.2} />
                      <span>
                        {searchTerm || estadoFilter || claseFilter || instructorFilter || caballoFilter
                          ? "No se encontraron reservas con los filtros aplicados."
                          : filtroTiempo === "dia"
                            ? `No hay reservas para el ${formatDate(fechaSeleccionada)}`
                            : filtroTiempo === "semana"
                              ? "No hay reservas para la semana seleccionada"
                              : filtroTiempo === "mes"
                                ? `No hay reservas para ${getNombreMes()}`
                                : "No hay reservas para el rango seleccionado"}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentReservas.map(reserva => {
                  const estadoColor = getEstadoBadgeColor(reserva.estatus);

                  return (
                    <tr key={reserva.id} className="ra-row">
                      <td className="ra-td ra-td-fecha">{formatDate(reserva.fecha)}</td>
                      <td className="ra-td ra-td-hora">{formatTime(reserva.hora_inicio)}</td>
                      <td className="ra-td ra-td-hora">{formatTime(reserva.hora_fin)}</td>
                      <td className="ra-td ra-td-cliente">
                        {reserva.cliente_nombre && reserva.cliente_apellido
                          ? `${reserva.cliente_nombre} ${reserva.cliente_apellido}`
                          : "Sin cliente"}
                      </td>
                      <td className="ra-td ra-td-muted">
                        {reserva.instructora_nombre && reserva.instructora_apellido
                          ? `${reserva.instructora_nombre} ${reserva.instructora_apellido}`
                          : "Sin instructora"}
                      </td>
                      <td className="ra-td ra-td-caballo">
                        {reserva.caballo_nombre || "Sin caballo"}
                      </td>
                      <td className="ra-td">
                        {reserva.clase_nombre
                          ? <span className="ra-clase-badge">{reserva.clase_nombre}</span>
                          : <span className="ra-td-muted">Sin clase</span>}
                      </td>
                      <td className="ra-td">
                        <span className={`ra-tipo-badge ra-tipo-${reserva.tipo || "normal"}`}>
                          {reserva.tipo === "propietario" ? "Propietario" :
                           reserva.tipo === "renta" ? "Renta" :
                           reserva.tipo === "media_renta" ? "Media Renta" :
                           "Normal"}
                        </span>
                      </td>
                      <td className="ra-td">
                        <select
                          value={reserva.estatus}
                          onChange={(e) => cambiarEstatus(reserva.id, e.target.value)}
                          className="ra-status-select"
                          style={{ borderColor: estadoColor.border, color: estadoColor.color }}
                          title="Cambiar estado de la reserva"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmada">Confirmada</option>
                          <option value="completada">Completada</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginacion */}
      {!loading && filteredReservas.length > itemsPerPage && (
        <div className="pagination-container">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} />
            <span>Anterior</span>
          </button>
          <div className="pagination-numbers">
            {getPaginationPages().map((page, idx) => (
              page === "..." ? (
                <span key={`dots-${idx}`} className="pagination-dots">...</span>
              ) : (
                <button
                  key={page}
                  className={currentPage === page ? "pagination-page pagination-page-active" : "pagination-page"}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            ))}
          </div>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <span>Siguiente</span>
            <ChevronRight size={18} />
          </button>
          <div className="pagination-info">
            Mostrando {startIndex + 1} - {Math.min(endIndex, filteredReservas.length)} de {filteredReservas.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservasAdmin;
