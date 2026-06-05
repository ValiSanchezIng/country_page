import React, { useState, useEffect, useCallback } from "react";
import useAutoRefresh from '../hooks/useAutoRefresh';
import { Loader, Calendar, ChevronLeft, ChevronRight, Search } from "lucide-react";

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

  // Implementar sticky header para la tabla de reservas (clon + sincronización de anchos)
  useEffect(() => {
    let stickyHeader = null
    const containerSelector = '.reservas-admin-container .table-container'
    const container = document.querySelector(containerSelector)
    if (!container) return

    const table = container.querySelector('.members-table')
    if (!table) return
    const thead = table.querySelector('thead')

    const calculateHeaderPosition = () => {
      const tableRect = table.getBoundingClientRect()
      const theadRect = thead.getBoundingClientRect()
      return { tableRect, theadRect }
    }

    const handleScroll = () => {
      const { tableRect, theadRect } = calculateHeaderPosition()

      if (theadRect.top <= 0 && tableRect.bottom > 100) {
        if (!stickyHeader) {
          stickyHeader = thead.cloneNode(true)
          stickyHeader.style.position = 'fixed'
          stickyHeader.style.top = '0'
          stickyHeader.style.zIndex = '999'
          stickyHeader.style.pointerEvents = 'none' // nunca bloquear clics aunque quede colgado
          stickyHeader.classList.add('sticky-clone')
          stickyHeader.style.display = 'table'

          // copiar anchos iniciales
          const originalThs = thead.querySelectorAll('th')
          const clonedThs = stickyHeader.querySelectorAll('th')
          originalThs.forEach((th, index) => {
            if (clonedThs[index]) {
              const w = th.getBoundingClientRect().width
              clonedThs[index].style.width = `${Math.round(w)}px`
            }
          })

          document.body.appendChild(stickyHeader)
        }

        if (stickyHeader) {
          const rect = table.getBoundingClientRect()
          stickyHeader.style.left = `${Math.round(rect.left)}px`
          stickyHeader.style.width = `${Math.round(rect.width)}px`
          stickyHeader.style.display = 'table-header-group'

          // actualizar anchos
          const originalThs2 = thead.querySelectorAll('th')
          const clonedThs2 = stickyHeader.querySelectorAll('th')
          originalThs2.forEach((th, index) => {
            if (clonedThs2[index]) {
              const w = th.getBoundingClientRect().width
              clonedThs2[index].style.width = `${Math.round(w)}px`
            }
          })
          // sincronizar horizontal
          handleTableScroll()
        }
      } else {
        if (stickyHeader) {
          stickyHeader.remove()
          stickyHeader = null
        }
      }
    }

    const handleTableScroll = () => {
      if (!stickyHeader) return
      const rect = table.getBoundingClientRect()
      // actualizar anchos
      const originalThs = thead.querySelectorAll('th')
      const clonedThs = stickyHeader.querySelectorAll('th')
      originalThs.forEach((th, index) => {
        if (clonedThs[index]) {
          const w = th.getBoundingClientRect().width
          clonedThs[index].style.width = `${Math.round(w)}px`
        }
      })
      // ajustar posicion
      stickyHeader.style.left = `${Math.round(rect.left)}px`
      stickyHeader.style.width = `${Math.round(rect.width)}px`
    }

    const initTimeout = setTimeout(() => {
      handleScroll()
      window.addEventListener('scroll', handleScroll)
      window.addEventListener('resize', handleScroll)
      container.addEventListener('scroll', handleTableScroll)
    }, 100)

    return () => {
      clearTimeout(initTimeout)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      container.removeEventListener('scroll', handleTableScroll)
      if (stickyHeader) stickyHeader.remove()
    }
  }, [loading, reservas])

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

  const getAsistenciaBadgeColor = (asistencia) => {
    switch(asistencia) {
      case "presente":
        return { border: "#9caf88", color: "#9caf88", text: "Asistió" };
      case "ausente":
        return { border: "#c17b4a", color: "#c17b4a", text: "Faltó" };
      case "justificado":
        return { border: "#d4a574", color: "#d4a574", text: "Justificado" };
      default:
        return { border: "#e0e0e0", color: "#999", text: "Pendiente" };
    }
  };

  const formatNivel = (nivel) => {
    if (!nivel) return "-";
    const niveles = {
      'paseo': 'Paseo',
      'iniciacion': 'Iniciación',
      'ponyclub': 'Ponyclub',
      'intermedio': 'Intermedio',
      'avanzado': 'Avanzado'
    };
    return niveles[nivel] || nivel;
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
      
      {/* Header con controles */}
      <div className="controls-container enhanced-controls" style={{ marginBottom: "1.5rem" }}>
        <div className="controls-inner">
          <h2 style={{ margin: 0, color: "var(--primary-brown)" }}>Gestión de Reservas</h2>
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

      {/* Barra de busqueda y filtros */}
      <div className="controls-bar">
        <div className="controls-search">
          <Search size={18} className="controls-search-icon" />
          <input
            type="text"
            className="controls-search-input"
            placeholder="Buscar por cliente, instructora o caballo..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            autoComplete="off"
          />
        </div>
        <div className="controls-filters">
          <div className="controls-filter-item">
            <label className="controls-filter-label">Periodo</label>
            <div className="periodo-pills">
              {[
                { value: "dia", label: "Día" },
                { value: "semana", label: "Semana" },
                { value: "mes", label: "Mes" },
                { value: "personalizado", label: "Personalizado" },
              ].map(op => (
                <button
                  key={op.value}
                  type="button"
                  className={`periodo-pill${filtroTiempo === op.value ? " periodo-pill-active" : ""}`}
                  onClick={() => setFiltroTiempo(op.value)}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>
          {(filtroTiempo === "dia" || filtroTiempo === "semana") && (
            <div className="controls-filter-item">
              <label className="controls-filter-label">Fecha</label>
              <input
                type="date"
                className="controls-filter-select"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                onClick={(e) => { e.preventDefault(); e.target.showPicker(); }}
                style={{ minWidth: "140px", cursor: "pointer" }}
              />
            </div>
          )}
          {filtroTiempo === "mes" && (
            <div className="controls-filter-item">
              <label className="controls-filter-label">Mes</label>
              <input
                type="month"
                className="controls-filter-select"
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                onClick={(e) => { e.preventDefault(); e.target.showPicker(); }}
                style={{ minWidth: "160px", cursor: "pointer" }}
              />
            </div>
          )}
          {filtroTiempo === "personalizado" && (
            <>
              <div className="controls-filter-item">
                <label className="controls-filter-label">Desde</label>
                <input
                  type="date"
                  className="controls-filter-select"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  onClick={(e) => { e.preventDefault(); e.target.showPicker(); }}
                  style={{ minWidth: "140px", cursor: "pointer" }}
                />
              </div>
              <div className="controls-filter-item">
                <label className="controls-filter-label">Hasta</label>
                <input
                  type="date"
                  className="controls-filter-select"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  onClick={(e) => { e.preventDefault(); e.target.showPicker(); }}
                  style={{ minWidth: "140px", cursor: "pointer" }}
                />
              </div>
            </>
          )}
          <div className="controls-filter-item">
            <label className={`controls-filter-label ${estadoFilter ? "label-active" : ""}`}>Estado</label>
            <select className={`controls-filter-select ${estadoFilter ? "filter-active" : ""}`} value={estadoFilter} onChange={(e) => { setEstadoFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          <div className="controls-filter-item">
            <label className={`controls-filter-label ${claseFilter ? "label-active" : ""}`}>Clase</label>
            <select className={`controls-filter-select ${claseFilter ? "filter-active" : ""}`} value={claseFilter} onChange={(e) => { setClaseFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">Todas</option>
              {clasesUnicas.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="controls-filter-item">
            <label className={`controls-filter-label ${instructorFilter ? "label-active" : ""}`}>Instructor</label>
            <select className={`controls-filter-select ${instructorFilter ? "filter-active" : ""}`} value={instructorFilter} onChange={(e) => { setInstructorFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">Todos</option>
              {instructoresUnicos.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          <div className="controls-filter-item">
            <label className={`controls-filter-label ${caballoFilter ? "label-active" : ""}`}>Caballo</label>
            <select className={`controls-filter-select ${caballoFilter ? "filter-active" : ""}`} value={caballoFilter} onChange={(e) => { setCaballoFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">Todos</option>
              {caballosUnicos.map(cab => (
                <option key={cab} value={cab}>{cab}</option>
              ))}
            </select>
          </div>
        </div>
        {filtroTiempo === "semana" && (
          <div style={{ fontSize: "0.8rem", color: "var(--secondary-brown)", fontWeight: "500" }}>
            Semana: {getRangoSemana()}
          </div>
        )}
        {filtroTiempo === "mes" && (
          <div style={{ fontSize: "0.8rem", color: "var(--secondary-brown)", fontWeight: "500", textTransform: "capitalize" }}>
            Mes: {getNombreMes()}
          </div>
        )}
        {filtroTiempo === "personalizado" && (
          <div style={{ fontSize: "0.8rem", color: "var(--secondary-brown)", fontWeight: "500" }}>
            Rango: {formatDate(fechaInicio)} - {formatDate(fechaFin)}
          </div>
        )}
      </div>

      {/* Resumen de filtros */}
      {!loading && (
        <p style={{ margin: '0 0 0.6rem', fontSize: '0.84rem', color: 'var(--charcoal)', lineHeight: 1.5 }}>
          Mostrando <strong>{filteredReservas.length} reserva{filteredReservas.length !== 1 ? 's' : ''}</strong>
          {' · '}{estadoFilter ? estadoFilter.charAt(0).toUpperCase() + estadoFilter.slice(1) : 'Todos los estados'}
          {' · '}{getResumenRango()}
          {!estadoFilter && !searchTerm && (
            <span style={{ fontStyle: 'italic', opacity: 0.6 }}> · Usa los filtros para ajustar la búsqueda</span>
          )}
        </p>
      )}

      {/* Tabla de reservas */}
      {loading ? (
        <div className="loading-container">
          <Loader size={40} className="spin loading-spinner" />
          <div className="loading-text">Cargando reservas...</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="members-table">
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
              {currentReservas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state-cell">
                    {searchTerm || estadoFilter || claseFilter || instructorFilter || caballoFilter
                      ? "No se encontraron reservas con los filtros aplicados."
                      : filtroTiempo === "dia"
                        ? `No hay reservas para el ${formatDate(fechaSeleccionada)}`
                        : filtroTiempo === "semana"
                          ? "No hay reservas para la semana seleccionada"
                          : filtroTiempo === "mes"
                            ? `No hay reservas para ${getNombreMes()}`
                            : "No hay reservas para el rango seleccionado"
                    }
                  </td>
                </tr>
              ) : (
                currentReservas.map(reserva => {
                  const estadoColor = getEstadoBadgeColor(reserva.estatus);
                  
                  return (
                    <tr key={reserva.id}>
                      <td style={{ fontWeight: "600" }}>{formatDate(reserva.fecha)}</td>
                      <td style={{ fontWeight: "600", color: "var(--primary-brown)" }}>
                        {formatTime(reserva.hora_inicio)}
                      </td>
                      <td style={{ fontWeight: "600", color: "var(--primary-brown)" }}>
                        {formatTime(reserva.hora_fin)}
                      </td>
                      <td style={{ color: "var(--charcoal)" }}>
                        {reserva.cliente_nombre && reserva.cliente_apellido 
                          ? `${reserva.cliente_nombre} ${reserva.cliente_apellido}`
                          : "Sin cliente"}
                      </td>
                      <td style={{ color: "var(--stone-gray)" }}>
                        {reserva.instructora_nombre && reserva.instructora_apellido
                          ? `${reserva.instructora_nombre} ${reserva.instructora_apellido}`
                          : "Sin instructora"}
                      </td>
                      <td style={{ fontWeight: "600", color: "var(--primary-brown)" }}>
                        {reserva.caballo_nombre || "Sin caballo"}
                      </td>
                      <td style={{ color: "var(--charcoal)" }}>
                        {reserva.clase_nombre || "Sin clase"}
                      </td>
                      <td style={{ color: "var(--charcoal)" }}>
                        <span style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.85rem",
                          background: reserva.tipo === "propietario" ? "rgba(156, 175, 136, 0.1)" :
                                     reserva.tipo === "renta" ? "rgba(193, 123, 74, 0.1)" :
                                     reserva.tipo === "media_renta" ? "rgba(212, 165, 116, 0.1)" :
                                     "rgba(107, 68, 35, 0.05)",
                          color: reserva.tipo === "propietario" ? "#9caf88" :
                                reserva.tipo === "renta" ? "#c17b4a" :
                                reserva.tipo === "media_renta" ? "#d4a574" :
                                "var(--charcoal)"
                        }}>
                          {reserva.tipo === "propietario" ? "Propietario" :
                           reserva.tipo === "renta" ? "Renta" :
                           reserva.tipo === "media_renta" ? "Media Renta" :
                           "Normal"}
                        </span>
                      </td>
                      <td>
                        <select
                          value={reserva.estatus}
                          onChange={(e) => cambiarEstatus(reserva.id, e.target.value)}
                          className="status-badge"
                          style={{
                            borderColor: estadoColor.border,
                            color: estadoColor.color,
                            padding: "0.4rem 0.6rem",
                            borderRadius: "6px",
                            fontWeight: 600,
                            cursor: "pointer",
                            background: "white"
                          }}
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
      )}

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
