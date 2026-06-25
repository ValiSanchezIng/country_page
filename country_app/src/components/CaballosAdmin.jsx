import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Loader, UserPlus, Trash2, Edit, ChevronLeft, ChevronRight, Search, MoreVertical, PawPrint } from "lucide-react";
import "../CSS/CaballosAdmin.css";

const CaballosAdmin = () => {
  const [caballos, setCaballos] = useState([]);
  const [propietarios, setPropietarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addHorseModalOpen, setAddHorseModalOpen] = useState(false);
  const [editHorseModalOpen, setEditHorseModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [newHorse, setNewHorse] = useState({
    nombre: "",
    propietario_id: "",
    disponibilidad: "disponible",
    estatus: "publico",
    especialidad: [],
    descripcion: "",
    renta_cliente_id: "",
    renta_fecha_inicio: "",
    renta_fecha_fin: ""
  });
  const [editingHorse, setEditingHorse] = useState(null);
  const [creatingHorse, setCreatingHorse] = useState(false);
  const [updatingHorse, setUpdatingHorse] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [deletingHorseId, setDeletingHorseId] = useState(null);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [horseToDelete, setHorseToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [disponibilidadFilter, setDisponibilidadFilter] = useState("");
  const [estatusFilter, setEstatusFilter] = useState("");
  const [especialidadFilter, setEspecialidadFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  // Cerrar menú de acciones al hacer clic fuera
  useEffect(() => {
    if (openMenuId === null) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuId]);

  // Función para mostrar notificaciones
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 4000);
  };

  // Funciones para manejar especialidades múltiples
  const especialidadesDisponibles = ['iniciacion', 'paseo', 'intermedio', 'avanzado', 'salto'];
  
  const parseEspecialidades = (especialidadString) => {
    if (!especialidadString) return [];
    // 'mixto' es un valor legacy que significa "sirve para todos los niveles";
    // al editar se muestra como los 4 niveles marcados.
    if (especialidadString.trim().toLowerCase() === 'mixto') {
      return [...especialidadesDisponibles];
    }
    return especialidadString.split(',').map(e => e.trim()).filter(e => e !== '');
  };

  const handleEspecialidadToggle = (especialidad, isNewHorse = true) => {
    const currentEspecialidades = isNewHorse ? newHorse.especialidad : editingHorse.especialidad;
    const newEspecialidades = currentEspecialidades.includes(especialidad)
      ? currentEspecialidades.filter(e => e !== especialidad)
      : [...currentEspecialidades, especialidad];
    
    if (isNewHorse) {
      setNewHorse({ ...newHorse, especialidad: newEspecialidades });
    } else {
      setEditingHorse({ ...editingHorse, especialidad: newEspecialidades });
    }
  };

  // Cargar lista de caballos desde el endpoint
  useEffect(() => {
    loadCaballos();
    loadPropietarios();
  }, []);

  const loadPropietarios = async () => {
    try {
      const response = await fetch("https://elrefugiocountryclub.com/api/api/reservas/propietarios");
      if (response.ok) {
        const data = await response.json();
        setPropietarios(data);
      } else {
        console.error("Error al cargar propietarios");
        setPropietarios([]);
      }
    } catch (error) {
      console.error("Error al cargar propietarios:", error);
      setPropietarios([]);
    }
  };

  const loadCaballos = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://elrefugiocountryclub.com/api/api/caballos");
      if (response.ok) {
        const data = await response.json();
        setCaballos(data);
      } else {
        showNotification("Error al cargar los caballos", "error");
        setCaballos([]);
      }
    } catch (error) {
      console.error("Error al cargar caballos:", error);
      showNotification("Error de conexión al cargar caballos", "error");
      setCaballos([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddHorseModal = () => {
    setNewHorse({
      nombre: "",
      propietario_id: "",
      disponibilidad: "disponible",
      estatus: "publico",
      especialidad: [],
      descripcion: "",
      renta_cliente_id: "",
      renta_fecha_inicio: "",
      renta_fecha_fin: ""
    });
    setAddHorseModalOpen(true);
  };

  const closeAddHorseModal = () => {
    setAddHorseModalOpen(false);
    setNewHorse({
      nombre: "",
      propietario_id: "",
      disponibilidad: "disponible",
      estatus: "publico",
      especialidad: [],
      descripcion: "",
      renta_cliente_id: "",
      renta_fecha_inicio: "",
      renta_fecha_fin: ""
    });
  };

  const openEditHorseModal = (caballo) => {
    const toDateInput = (v) => (v ? String(v).split('T')[0] : "");
    setEditingHorse({
      ...caballo,
      propietario_id: caballo.propietario_id || "",
      especialidad: parseEspecialidades(caballo.especialidad),
      descripcion: caballo.descripcion ?? "",
      renta_cliente_id: caballo.renta_cliente_id || "",
      renta_fecha_inicio: toDateInput(caballo.renta_fecha_inicio),
      renta_fecha_fin: toDateInput(caballo.renta_fecha_fin)
    });
    setEditHorseModalOpen(true);
  };

  const closeEditHorseModal = () => {
    setEditHorseModalOpen(false);
    setEditingHorse(null);
  };

  const updateHorse = async () => {
    if (updatingHorse) return;
    setUpdatingHorse(true);
    
    try {
      // Validaciones
      if (!editingHorse.nombre || editingHorse.nombre.trim() === "") {
        showNotification("Por favor completa el nombre del caballo", "error");
        setUpdatingHorse(false);
        return;
      }

      // Preparar datos para enviar
      const horseData = {
        nombre: editingHorse.nombre.trim(),
        propietario_id: editingHorse.propietario_id ? parseInt(editingHorse.propietario_id) : null,
        disponibilidad: editingHorse.disponibilidad,
        estatus: editingHorse.estatus,
        especialidad: editingHorse.especialidad, // Enviar como array
        descripcion: (editingHorse.descripcion ?? '').trim(),
        renta_cliente_id: editingHorse.renta_cliente_id ? parseInt(editingHorse.renta_cliente_id) : null,
        renta_fecha_inicio: editingHorse.renta_fecha_inicio || null,
        renta_fecha_fin: editingHorse.renta_fecha_fin || null
      };

      const response = await fetch(`https://elrefugiocountryclub.com/api/api/caballos/${editingHorse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(horseData),
      });

      if (response.ok) {
        showNotification("Caballo actualizado correctamente", "success");
        closeEditHorseModal();
        loadCaballos(); // Recargar la lista
      } else {
        const error = await response.json();
        showNotification("Error al actualizar caballo: " + (error?.error ?? "Error desconocido"), "error");
      }
    } catch (error) {
      console.error("Error al actualizar caballo:", error);
      showNotification("Error de conexión. Inténtalo de nuevo.", "error");
    } finally {
      setUpdatingHorse(false);
    }
  };

  const openConfirmDeleteModal = (caballo) => {
    setHorseToDelete(caballo);
    setConfirmDeleteModalOpen(true);
  };

  const closeConfirmDeleteModal = () => {
    setHorseToDelete(null);
    setConfirmDeleteModalOpen(false);
  };

  const deleteHorse = async () => {
    if (!horseToDelete) return;
    
    setDeletingHorseId(horseToDelete.id);
    try {
      const response = await fetch(`https://elrefugiocountryclub.com/api/api/caballos/${horseToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showNotification("Caballo dado de baja correctamente", "success");
        closeConfirmDeleteModal();
        loadCaballos(); // Recargar la lista
        setCurrentPage(1); // Resetear a la primera página
      } else {
        const error = await response.json();
        showNotification("Error al dar de baja: " + (error?.error ?? "Error desconocido"), "error");
      }
    } catch (error) {
      console.error("Error al eliminar caballo:", error);
      showNotification("Error de conexión. Inténtalo de nuevo.", "error");
    } finally {
      setDeletingHorseId(null);
    }
  };

  const createNewHorse = async () => {
    if (creatingHorse) return;
    setCreatingHorse(true);
    
    try {
      // Validaciones
      if (!newHorse.nombre || newHorse.nombre.trim() === "") {
        showNotification("Por favor completa el nombre del caballo", "error");
        setCreatingHorse(false);
        return;
      }

      // Preparar datos para enviar
      const horseData = {
        nombre: newHorse.nombre.trim(),
        propietario_id: newHorse.propietario_id ? parseInt(newHorse.propietario_id) : null,
        disponibilidad: newHorse.disponibilidad,
        estatus: newHorse.estatus,
        especialidad: newHorse.especialidad, // Enviar como array
        descripcion: (newHorse.descripcion ?? '').trim(),
        renta_cliente_id: newHorse.renta_cliente_id ? parseInt(newHorse.renta_cliente_id) : null,
        renta_fecha_inicio: newHorse.renta_fecha_inicio || null,
        renta_fecha_fin: newHorse.renta_fecha_fin || null
      };

      console.log('🐎 Enviando datos del caballo:', horseData);

      const response = await fetch("https://elrefugiocountryclub.com/api/api/caballos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(horseData),
      });

      if (response.ok) {
        const result = await response.json();
        showNotification("Caballo agregado correctamente", "success");
        closeAddHorseModal();
        // Recargar la lista y luego ir a la última página
        const updatedCaballos = [...caballos, result];
        setCaballos(updatedCaballos);
        const newTotalPages = Math.ceil(updatedCaballos.length / itemsPerPage);
        setCurrentPage(newTotalPages);
        // También recargar desde el servidor para asegurar consistencia
        loadCaballos();
      } else {
        const error = await response.json();
        console.error('❌ Error del servidor:', error);
        showNotification("Error al agregar caballo: " + (error?.error ?? error?.message ?? "Error desconocido"), "error");
      }
    } catch (error) {
      console.error("Error al crear caballo:", error);
      showNotification("Error de conexión. Inténtalo de nuevo.", "error");
    } finally {
      setCreatingHorse(false);
    }
  };

  const renderPortal = (node) => ReactDOM.createPortal(node, document.body);

  // Filtrar caballos
  const filteredCaballos = caballos.filter(c => {
    const matchesSearch = searchTerm === "" ||
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.propietario_nombre && c.propietario_nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDisponibilidad = disponibilidadFilter === "" || c.disponibilidad === disponibilidadFilter;
    const matchesEstatus = estatusFilter === "" || c.estatus === estatusFilter;
    const matchesEspecialidad = especialidadFilter === "" ||
      (Array.isArray(c.especialidad) ? c.especialidad.includes(especialidadFilter) :
       c.especialidad && c.especialidad.toLowerCase().includes(especialidadFilter.toLowerCase()));
    return matchesSearch && matchesDisponibilidad && matchesEstatus && matchesEspecialidad;
  });

  // Calcular paginación sobre filtrados
  const totalPages = Math.ceil(filteredCaballos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCaballos = filteredCaballos.slice(startIndex, endIndex);

  // Calcular metricas (siempre sobre todos)
  const totalCaballos = caballos.length;
  const disponibles = caballos.filter(c => c.disponibilidad === "disponible").length;
  const noDisponibles = caballos.filter(c => c.disponibilidad === "no_disponible").length;
  const publicos = caballos.filter(c => c.estatus === "publico").length;
  const privados = caballos.filter(c => c.estatus === "privado").length;
  const renta = caballos.filter(c => c.estatus === "renta").length;
  const mediaRenta = caballos.filter(c => c.estatus === "media_renta").length;

  return (
    <div className="caballos-admin-container">
      <div className="ca-header">
        <div>
          <h2 className="ca-title">
            <PawPrint size={22} /> Gestión de Caballos
          </h2>
          <p className="ca-desc">
            Administra los caballos del club: disponibilidad, estatus, especialidades y rentas.
          </p>
        </div>
        <button className="ca-btn-nuevo" onClick={openAddHorseModal} type="button">
          <UserPlus size={20} /> Nuevo Caballo
        </button>
      </div>

      {/* Metricas */}
      {!loading && caballos.length > 0 && (
        <div className="stats-grid caballos-stats">
          <div className="stat-card">
            <div className="stat-card-topline topline-sage"></div>
            <div className="stat-title">Total</div>
            <div className="stat-value">{totalCaballos}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-topline topline-sage"></div>
            <div className="stat-title">Disponibles</div>
            <div className="stat-value">{disponibles}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-topline topline-brown"></div>
            <div className="stat-title">No Disponibles</div>
            <div className="stat-value">{noDisponibles}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-topline topline-terracotta"></div>
            <div className="stat-title">Publicos</div>
            <div className="stat-value">{publicos}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-topline topline-light"></div>
            <div className="stat-title">Privados</div>
            <div className="stat-value">{privados}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-topline topline-terracotta"></div>
            <div className="stat-title">Renta</div>
            <div className="stat-value">{renta}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-topline topline-light"></div>
            <div className="stat-title">Media Renta</div>
            <div className="stat-value">{mediaRenta}</div>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="ca-lista">
        {/* Filtros integrados en la card */}
        <div className="ca-filtros">
          <div className="ca-search-wrap">
            <Search size={14} className="ca-search-icon" />
            <input
              type="text"
              className="ca-search-input"
              placeholder="Buscar por nombre o propietario..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              autoComplete="off"
            />
          </div>
          <select className="ca-filter-select" value={disponibilidadFilter} onChange={(e) => { setDisponibilidadFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">Toda disponibilidad</option>
            <option value="disponible">Disponible</option>
            <option value="no_disponible">No disponible</option>
          </select>
          <select className="ca-filter-select" value={estatusFilter} onChange={(e) => { setEstatusFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">Todos los estatus</option>
            <option value="publico">Publico</option>
            <option value="privado">Privado</option>
            <option value="renta">Renta</option>
            <option value="media_renta">Media Renta</option>
          </select>
          <select className="ca-filter-select" value={especialidadFilter} onChange={(e) => { setEspecialidadFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">Todas las especialidades</option>
            <option value="iniciacion">Iniciacion</option>
            <option value="paseo">Paseo</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
            <option value="salto">Salto</option>
          </select>
        </div>

        {/* Resumen de filtros */}
        <p className="ca-summary">
          Mostrando <strong>{filteredCaballos.length} caballo{filteredCaballos.length !== 1 ? 's' : ''}</strong>
          {' · '}{disponibilidadFilter ? (disponibilidadFilter === 'disponible' ? 'Disponibles' : 'No disponibles') : 'Toda disponibilidad'}
          {' · '}{estatusFilter ? estatusFilter.charAt(0).toUpperCase() + estatusFilter.slice(1).replace('_', ' ') : 'Todos los estatus'}
          {' · '}{especialidadFilter ? especialidadFilter.charAt(0).toUpperCase() + especialidadFilter.slice(1) : 'Todas las especialidades'}
          {!disponibilidadFilter && !estatusFilter && !especialidadFilter && !searchTerm && (
            <span className="ca-summary-hint"> · Usa los filtros para ajustar la búsqueda</span>
          )}
        </p>

        <div className="ca-table-wrap">
          <table className="ca-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Propietario</th>
                <th>Disponibilidad</th>
                <th>Estatus</th>
                <th>Especialidad</th>
                <th>Descripción</th>
                <th className="ca-th-acciones"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="ca-empty-cell">
                    <Loader size={32} className="spin" /> Cargando caballos...
                  </td>
                </tr>
              ) : currentCaballos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="ca-empty-cell">
                    <div className="ca-empty-inner">
                      <PawPrint size={40} opacity={0.2} />
                      <span>
                        {searchTerm || disponibilidadFilter || estatusFilter || especialidadFilter
                          ? "No se encontraron caballos con los filtros aplicados."
                          : "No hay caballos registrados."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentCaballos.map(caballo => (
                  <tr key={caballo.id} className="ca-row">
                    <td className="ca-td ca-td-nombre">{caballo.nombre}</td>
                    <td className="ca-td ca-td-muted">
                      {caballo.propietario_nombre || <span className="ca-sin">Sin propietario</span>}
                    </td>
                    <td className="ca-td">
                      <select
                        className="ca-status-select"
                        value={caballo.disponibilidad}
                        onChange={async (e) => {
                          const newDisponibilidad = e.target.value;
                          try {
                            const response = await fetch(
                              `https://elrefugiocountryclub.com/api/api/caballos/${caballo.id}/disponibilidad`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ disponibilidad: newDisponibilidad }),
                              }
                            );

                            if (response.ok) {
                              setCaballos(prev => prev.map(c =>
                                c.id === caballo.id ? {...c, disponibilidad: newDisponibilidad} : c
                              ));
                              showNotification("Disponibilidad actualizada correctamente", "success");
                            } else {
                              const error = await response.json();
                              showNotification("Error al actualizar: " + (error?.error ?? "Error desconocido"), "error");
                            }
                          } catch (error) {
                            console.error("Error al actualizar disponibilidad:", error);
                            showNotification("Error de conexión", "error");
                          }
                        }}
                        style={{
                          borderColor: caballo.disponibilidad === "disponible" ? "#9caf88" : "#8b5a2b",
                          color: caballo.disponibilidad === "disponible" ? "#9caf88" : "#8b5a2b",
                        }}
                      >
                        <option value="disponible">Disponible</option>
                        <option value="no_disponible">No disponible</option>
                      </select>
                    </td>
                    <td className="ca-td">
                      <select
                        className="ca-status-select"
                        value={caballo.estatus}
                        onChange={async (e) => {
                          const newEstatus = e.target.value;
                          try {
                            const response = await fetch(
                              `https://elrefugiocountryclub.com/api/api/caballos/${caballo.id}/estatus`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ estatus: newEstatus }),
                              }
                            );

                            if (response.ok) {
                              setCaballos(prev => prev.map(c =>
                                c.id === caballo.id ? {...c, estatus: newEstatus} : c
                              ));
                              showNotification("Estatus actualizado correctamente", "success");
                            } else {
                              const error = await response.json();
                              showNotification("Error al actualizar: " + (error?.error ?? "Error desconocido"), "error");
                            }
                          } catch (error) {
                            console.error("Error al actualizar estatus:", error);
                            showNotification("Error de conexión", "error");
                          }
                        }}
                        style={{ borderColor: "#c17b4a", color: "#c17b4a" }}
                      >
                        <option value="publico">Público</option>
                        <option value="privado">Privado</option>
                        <option value="renta">Renta</option>
                        <option value="media_renta">Media Renta</option>
                      </select>
                    </td>
                    <td className="ca-td">
                      <div className="ca-esp-list">
                        {parseEspecialidades(caballo.especialidad).map(esp => (
                          <span key={esp} className="ca-esp-badge">{esp}</span>
                        ))}
                        {parseEspecialidades(caballo.especialidad).length === 0 && (
                          <span className="ca-sin">Sin especialidades</span>
                        )}
                      </div>
                    </td>
                    <td className="ca-td ca-td-desc">{caballo.descripcion || "—"}</td>
                    <td className="ca-td-acciones">
                      <div className="ca-menu-wrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === caballo.id ? null : caballo.id);
                          }}
                          className="ca-menu-trigger"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenuId === caballo.id && (
                          <div onClick={e => e.stopPropagation()} className="ca-menu">
                            <button
                              onClick={() => { setOpenMenuId(null); openEditHorseModal(caballo); }}
                              className="ca-menu-item"
                            >
                              <Edit size={15} className="ca-menu-item-icon-edit" />
                              Editar caballo
                            </button>
                            <div className="ca-menu-divider" />
                            <button
                              onClick={() => { setOpenMenuId(null); openConfirmDeleteModal(caballo); }}
                              disabled={deletingHorseId === caballo.id}
                              className="ca-menu-item is-danger"
                            >
                              <Trash2 size={15} />
                              {deletingHorseId === caballo.id ? "Eliminando..." : "Dar de baja"}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {!loading && filteredCaballos.length > itemsPerPage && (
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={currentPage === page ? "pagination-page pagination-page-active" : "pagination-page"}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
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
            Mostrando {startIndex + 1} - {Math.min(endIndex, filteredCaballos.length)} de {filteredCaballos.length}
          </div>
        </div>
      )}
      
      {/* Modal de confirmación de eliminación (Portal) */}
      {confirmDeleteModalOpen && horseToDelete &&
        renderPortal(
          <div className="modal-overlay" onClick={closeConfirmDeleteModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
              <h2 style={{ color: "#8b5a2b" }}>¿Confirmar Baja de Caballo?</h2>
              <div style={{ padding: "1.5rem 0" }}>
                <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
                  ¿Estás seguro de que deseas dar de baja al caballo <strong>{horseToDelete.nombre}</strong>?
                </p>
                <p style={{ color: "var(--stone-gray)", fontSize: "0.95rem" }}>
                  Esta acción no se puede deshacer. El caballo será eliminado permanentemente del sistema.
                </p>
                {horseToDelete.propietario_nombre && (
                  <p style={{ color: "var(--terracotta)", fontSize: "0.95rem", marginTop: "1rem" }}>
                    <strong>Propietario:</strong> {horseToDelete.propietario_nombre}
                  </p>
                )}
              </div>
              <div className="modal-actions">
                <button 
                  className="btn" 
                  onClick={deleteHorse} 
                  type="button"
                  disabled={deletingHorseId !== null}
                  style={{
                    background: "linear-gradient(135deg, #8b5a2b, #6b4423)",
                    color: "white"
                  }}
                >
                  <Trash2 size={16} /> {deletingHorseId ? "Eliminando..." : "Sí, Dar de Baja"}
                </button>
                <button 
                  className="btn" 
                  onClick={closeConfirmDeleteModal} 
                  type="button"
                  disabled={deletingHorseId !== null}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      
      {/* Modal de edición de caballo (Portal) */}
      {editHorseModalOpen && editingHorse &&
        renderPortal(
          <div className="modal-overlay" onClick={closeEditHorseModal}>
            <div className="modal-content add-horse-modal" onClick={e => e.stopPropagation()}>
              <h2>Editar Caballo</h2>
              <div className="modal-section">
                <h3>Información del Caballo</h3>
                <div className="modal-field">
                  <label>Nombre *:</label>
                  <input
                    type="text"
                    value={editingHorse.nombre}
                    onChange={e => setEditingHorse({ ...editingHorse, nombre: e.target.value })}
                    placeholder="Nombre del caballo"
                    autoComplete="off"
                    name="edithorse-nombre"
                  />
                </div>
                <div className="modal-field">
                  <label>Propietario - Opcional:</label>
                  <select
                    value={editingHorse.propietario_id || ""}
                    onChange={e => setEditingHorse({ ...editingHorse, propietario_id: e.target.value })}
                    name="edithorse-propietario"
                    autoComplete="off"
                  >
                    <option value="">Sin propietario</option>
                    {propietarios.map(prop => (
                      <option key={prop.id} value={prop.id}>
                        {prop.nombre} {prop.apellido} - ID: {prop.id}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: "var(--stone-gray)", fontSize: "0.85rem", marginTop: "0.3rem", display: "block" }}>
                    Solo aplica para caballos con propietarios específicos
                  </small>
                </div>
                <div className="modal-field">
                  <label>Disponibilidad:</label>
                  <select
                    value={editingHorse.disponibilidad}
                    onChange={e => setEditingHorse({ ...editingHorse, disponibilidad: e.target.value })}
                    name="edithorse-disponibilidad"
                    autoComplete="off"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="no_disponible">No disponible</option>
                  </select>
                </div>
                <div className="modal-field">
                  <label>Estatus:</label>
                  <select
                    value={editingHorse.estatus}
                    onChange={e => setEditingHorse({ ...editingHorse, estatus: e.target.value })}
                    name="edithorse-estatus"
                    autoComplete="off"
                  >
                    <option value="publico">Público</option>
                    <option value="privado">Privado</option>
                    <option value="renta">Renta</option>
                    <option value="media_renta">Media Renta</option>
                  </select>
                </div>
                {(editingHorse.estatus === "renta" || editingHorse.estatus === "media_renta") && (
                  <div className="modal-field" style={{ border: "1px solid #e8e0d6", borderRadius: 8, padding: "0.75rem", background: "#faf8f5" }}>
                    <label style={{ fontWeight: 600 }}>Datos de renta</label>
                    <div style={{ marginTop: "0.5rem" }}>
                      <label>Rentado a:</label>
                      <select
                        value={editingHorse.renta_cliente_id || ""}
                        onChange={e => setEditingHorse({ ...editingHorse, renta_cliente_id: e.target.value })}
                      >
                        <option value="">Sin asignar</option>
                        {propietarios.map(prop => (
                          <option key={prop.id} value={prop.id}>{prop.nombre} {prop.apellido} - ID: {prop.id}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                      <div>
                        <label>Inicio:</label>
                        <input type="date" value={editingHorse.renta_fecha_inicio || ""}
                          onChange={e => setEditingHorse({ ...editingHorse, renta_fecha_inicio: e.target.value })} />
                      </div>
                      <div>
                        <label>Fin:</label>
                        <input type="date" value={editingHorse.renta_fecha_fin || ""}
                          onChange={e => setEditingHorse({ ...editingHorse, renta_fecha_fin: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}
                <div className="modal-field">
                  <label>Especialidades:</label>
                  <div className="especialidades-checkbox-container" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                    gap: '0.5rem',
                    marginTop: '0.5rem'
                  }}>
                    {especialidadesDisponibles.map(esp => (
                      <label key={esp} className="especialidad-checkbox-label" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: editingHorse.especialidad.includes(esp) ? '#e8f5e8' : '#fff'
                      }}>
                        <input
                          type="checkbox"
                          checked={editingHorse.especialidad.includes(esp)}
                          onChange={() => handleEspecialidadToggle(esp, false)}
                        />
                        <span style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>
                          {esp}
                        </span>
                      </label>
                    ))}
                  </div>
                  <small style={{ color: "var(--stone-gray)", fontSize: "0.85rem", marginTop: "0.3rem", display: "block" }}>
                    Selecciona una o más especialidades para este caballo
                  </small>
                </div>
                <div className="modal-field">
                  <label>Descripción:</label>
                  <textarea
                    value={editingHorse.descripcion}
                    onChange={e => setEditingHorse({ ...editingHorse, descripcion: e.target.value })}
                    placeholder="Descripción del caballo"
                    name="edithorse-descripcion"
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={updateHorse} type="button" disabled={updatingHorse}>
                  <Edit size={16} /> {updatingHorse ? "Actualizando..." : "Actualizar Caballo"}
                </button>
                <button className="btn btn-secondary" onClick={closeEditHorseModal} type="button">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      
      {/* Modal de alta de caballo (Portal) */}
      {addHorseModalOpen &&
        renderPortal(
          <div className="modal-overlay" onClick={closeAddHorseModal}>
            <div className="modal-content add-horse-modal" onClick={e => e.stopPropagation()}>
              <h2>Agregar Nuevo Caballo</h2>
              <div className="modal-section">
                <h3>Información del Caballo</h3>
                <div className="modal-field">
                  <label>Nombre *:</label>
                  <input
                    type="text"
                    value={newHorse.nombre}
                    onChange={e => setNewHorse({ ...newHorse, nombre: e.target.value })}
                    placeholder="Nombre del caballo"
                    autoComplete="off"
                    name="newhorse-nombre"
                  />
                </div>
                <div className="modal-field">
                  <label>Propietario - Opcional:</label>
                  <select
                    value={newHorse.propietario_id || ""}
                    onChange={e => setNewHorse({ ...newHorse, propietario_id: e.target.value })}
                    name="newhorse-propietario"
                    autoComplete="off"
                  >
                    <option value="">Sin propietario</option>
                    {propietarios.map(prop => (
                      <option key={prop.id} value={prop.id}>
                        {prop.nombre} {prop.apellido} - ID: {prop.id}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: "var(--stone-gray)", fontSize: "0.85rem", marginTop: "0.3rem", display: "block" }}>
                    Solo aplica para caballos con propietarios específicos
                  </small>
                </div>
                <div className="modal-field">
                  <label>Disponibilidad:</label>
                  <select
                    value={newHorse.disponibilidad}
                    onChange={e => setNewHorse({ ...newHorse, disponibilidad: e.target.value })}
                    name="newhorse-disponibilidad"
                    autoComplete="off"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="no_disponible">No disponible</option>
                  </select>
                </div>
                <div className="modal-field">
                  <label>Estatus:</label>
                  <select
                    value={newHorse.estatus}
                    onChange={e => setNewHorse({ ...newHorse, estatus: e.target.value })}
                    name="newhorse-estatus"
                    autoComplete="off"
                  >
                    <option value="publico">Público</option>
                    <option value="privado">Privado</option>
                    <option value="renta">Renta</option>
                    <option value="media_renta">Media Renta</option>
                  </select>
                </div>
                {(newHorse.estatus === "renta" || newHorse.estatus === "media_renta") && (
                  <div className="modal-field" style={{ border: "1px solid #e8e0d6", borderRadius: 8, padding: "0.75rem", background: "#faf8f5" }}>
                    <label style={{ fontWeight: 600 }}>Datos de renta</label>
                    <div style={{ marginTop: "0.5rem" }}>
                      <label>Rentado a:</label>
                      <select
                        value={newHorse.renta_cliente_id || ""}
                        onChange={e => setNewHorse({ ...newHorse, renta_cliente_id: e.target.value })}
                      >
                        <option value="">Sin asignar</option>
                        {propietarios.map(prop => (
                          <option key={prop.id} value={prop.id}>{prop.nombre} {prop.apellido} - ID: {prop.id}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                      <div>
                        <label>Inicio:</label>
                        <input type="date" value={newHorse.renta_fecha_inicio || ""}
                          onChange={e => setNewHorse({ ...newHorse, renta_fecha_inicio: e.target.value })} />
                      </div>
                      <div>
                        <label>Fin:</label>
                        <input type="date" value={newHorse.renta_fecha_fin || ""}
                          onChange={e => setNewHorse({ ...newHorse, renta_fecha_fin: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}
                <div className="modal-field">
                  <label>Especialidades:</label>
                  <div className="especialidades-checkbox-container" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                    gap: '0.5rem',
                    marginTop: '0.5rem'
                  }}>
                    {especialidadesDisponibles.map(esp => (
                      <label key={esp} className="especialidad-checkbox-label" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: newHorse.especialidad.includes(esp) ? '#e8f5e8' : '#fff'
                      }}>
                        <input
                          type="checkbox"
                          checked={newHorse.especialidad.includes(esp)}
                          onChange={() => handleEspecialidadToggle(esp, true)}
                        />
                        <span style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>
                          {esp}
                        </span>
                      </label>
                    ))}
                  </div>
                  <small style={{ color: "var(--stone-gray)", fontSize: "0.85rem", marginTop: "0.3rem", display: "block" }}>
                    Selecciona una o más especialidades para este caballo
                  </small>
                </div>
                <div className="modal-field">
                  <label>Descripción:</label>
                  <textarea
                    value={newHorse.descripcion}
                    onChange={e => setNewHorse({ ...newHorse, descripcion: e.target.value })}
                    placeholder="Descripción del caballo"
                    name="newhorse-descripcion"
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={createNewHorse} type="button" disabled={creatingHorse}>
                  <UserPlus size={16} /> {creatingHorse ? "Agregando..." : "Agregar Caballo"}
                </button>
                <button className="btn btn-secondary" onClick={closeAddHorseModal} type="button">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      
      {/* NOTIFICACIÓN (Portal) */}
      {notification.show &&
        renderPortal(
          <div className={`notification ${notification.type}`}>
            <div className="notification-content">
              <span className="notification-message">{notification.message}</span>
              <button 
                className="notification-close" 
                onClick={() => setNotification({ show: false, message: "", type: "" })}
              >
                ×
              </button>
            </div>
          </div>
        )}
    </div>
  );
};

export default CaballosAdmin;
