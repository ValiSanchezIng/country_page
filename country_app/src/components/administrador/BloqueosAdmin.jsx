import React, { useState, useEffect, useCallback } from 'react';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import axios from 'axios';
import { Plus, Trash2, Calendar, Clock, X, Ban, AlertTriangle, Search, MoreVertical } from 'lucide-react';
import { toast } from 'react-toastify';
import '../../CSS/BloqueosAdmin.css';

const API_BASE = 'https://elrefugiocountryclub.com/api/api';

// Helper para formatear una fecha YYYY-MM-DD (o ISO) a "lun. 15 may. 2026"
const formatFechaCorta = (fechaStr) => {
  if (!fechaStr) return '';
  const onlyDate = String(fechaStr).split('T')[0];
  const [y, m, d] = onlyDate.split('-').map(Number);
  if (!y || !m || !d) return fechaStr;
  // Construir Date local sin desfase de zona horaria
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-MX', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  });
};

// Hoy (YYYY-MM-DD) en hora local — para filtro "vigentes/pasados" y default del form
const hoyStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

const BloqueosAdmin = () => {
  const [bloqueos, setBloqueos] = useState([]);
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Filtros tabla
  const [filtroVigencia, setFiltroVigencia] = useState('vigentes'); // 'vigentes' | 'pasados' | 'todos'
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  const initialFormState = {
    fecha: '',
    turno: 'mañana',
    todasLasClases: true,   // por defecto, bloquear todas
    claseIdsMarcados: [],   // ids cuando todasLasClases = false
    motivo: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // Cerrar menú de acciones al hacer clic fuera
  useEffect(() => {
    if (openMenuId === null) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuId]);

  // ====== Fetch ======
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        axios.get(`${API_BASE}/bloqueos`),
        axios.get(`${API_BASE}/horarios/clases`)
      ]);
      setBloqueos(bRes.data);
      setClases(cRes.data);
    } catch (err) {
      console.error('Error fetching bloqueos:', err);
      if (!silent) toast.error('Error al cargar bloqueos');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refreshSilent = useCallback(() => fetchData(true), [fetchData]);
  useAutoRefresh(refreshSilent, { interval: 30000 });

  // ====== Form handlers ======
  const resetForm = () => {
    setFormData(initialFormState);
    setShowForm(false);
  };

  const toggleClase = (claseId) => {
    setFormData(prev => {
      const has = prev.claseIdsMarcados.includes(claseId);
      return {
        ...prev,
        claseIdsMarcados: has
          ? prev.claseIdsMarcados.filter(id => id !== claseId)
          : [...prev.claseIdsMarcados, claseId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fecha) { toast.error('Selecciona una fecha'); return; }
    if (!formData.todasLasClases && formData.claseIdsMarcados.length === 0) {
      toast.error('Selecciona al menos una clase, o marca "Todas las clases"');
      return;
    }

    const payload = {
      // [] => modo "Todas" en el backend (inserta 1 fila con clase_id NULL)
      clase_ids: formData.todasLasClases ? [] : formData.claseIdsMarcados,
      fecha: formData.fecha,
      turno: formData.turno,
      motivo: formData.motivo.trim() || null,
      creado_por: null
    };

    try {
      const res = await axios.post(`${API_BASE}/bloqueos`, payload);
      toast.success(res.data?.message || 'Bloqueo creado');
      resetForm();
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al crear bloqueo';
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Quitar este bloqueo? Las clases volverán a estar disponibles para reservar.')) return;
    try {
      await axios.delete(`${API_BASE}/bloqueos/${id}`);
      toast.success('Bloqueo eliminado');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  // ====== Filtros ======
  const today = hoyStr();
  const bloqueosFiltrados = bloqueos.filter(b => {
    const fecha = String(b.fecha || '').split('T')[0];
    if (filtroVigencia === 'vigentes' && fecha < today) return false;
    if (filtroVigencia === 'pasados' && fecha >= today) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const clase = (b.clase_nombre || 'todas las clases').toLowerCase();
      const motivo = (b.motivo || '').toLowerCase();
      if (!clase.includes(term) && !motivo.includes(term)) return false;
    }
    return true;
  });

  const vigenciaLabel = filtroVigencia === 'vigentes' ? 'Vigentes'
    : filtroVigencia === 'pasados' ? 'Pasados' : 'Todos';

  // ====== Render ======
  return (
    <div className="">
      {/* Header */}
      <div className="bloqueos-header">
        <div>
          <h2 className="bloqueos-title">
            <Ban size={22} /> Bloqueos de Clases
          </h2>
          <p className="bloqueos-desc">
            Cierra horarios puntuales (clima, eventos…). Los clientes no podrán reservar. Las reservas ya hechas se mantienen.
          </p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className={`bloqueos-btn-nuevo${showForm ? ' is-active' : ''}`}
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancelar' : 'Nuevo Bloqueo'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bloqueos-form-card">
          <h3 className="bloqueos-form-title">
            <Plus size={20} /> Crear Bloqueo
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="bloqueos-form-grid">
              {/* Fecha */}
              <div>
                <label className="bloqueos-label">
                  <Calendar size={14} className="bloqueos-label-icon" /> Fecha
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  min={today}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="bloqueos-input"
                />
              </div>

              {/* Turno */}
              <div>
                <label className="bloqueos-label">
                  <Clock size={14} className="bloqueos-label-icon" /> Turno
                </label>
                <select
                  required
                  value={formData.turno}
                  onChange={(e) => setFormData(prev => ({ ...prev, turno: e.target.value }))}
                  className="bloqueos-select"
                >
                  <option value="mañana">Mañana (antes de 12:00)</option>
                  <option value="tarde">Tarde (12:00 en adelante)</option>
                </select>
              </div>

              {/* Motivo */}
              <div className="bloqueos-field-full">
                <label className="bloqueos-label">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  value={formData.motivo}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                  placeholder="Ej: clima, evento del club…"
                  maxLength={255}
                  className="bloqueos-input"
                />
              </div>
            </div>

            {/* Clases — checkboxes */}
            <div className="bloqueos-clases">
              <label className="bloqueos-label">
                Clases a bloquear
              </label>

              <label className={`bloqueos-todas${formData.todasLasClases ? ' is-checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={formData.todasLasClases}
                  onChange={(e) => setFormData(prev => ({ ...prev, todasLasClases: e.target.checked }))}
                />
                Todas las clases
              </label>

              <div className={`bloqueos-clases-grid${formData.todasLasClases ? ' is-disabled' : ''}`}>
                {clases.map(c => {
                  const checked = formData.claseIdsMarcados.includes(c.id);
                  return (
                    <label key={c.id} className={`bloqueos-clase-item${checked ? ' is-checked' : ''}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleClase(c.id)} />
                      {c.nombre}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="bloqueos-form-actions">
              <button type="submit" className="bloqueos-btn-submit">
                Crear Bloqueo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      <div className="bloqueos-lista">
        {/* Filtros integrados en la card */}
        <div className="bloqueos-filtros">
          <div className="bloqueos-search-wrap">
            <Search size={14} className="bloqueos-search-icon" />
            <input
              type="text"
              placeholder="Buscar por motivo o clase..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bloqueos-search-input"
            />
          </div>
          <select
            value={filtroVigencia}
            onChange={e => setFiltroVigencia(e.target.value)}
            className="bloqueos-filter-select"
          >
            <option value="vigentes">Vigentes</option>
            <option value="pasados">Pasados</option>
            <option value="todos">Todos</option>
          </select>
        </div>

        {/* Resumen de filtros */}
        <p className="bloqueos-summary">
          Mostrando <strong>{bloqueosFiltrados.length} bloqueo{bloqueosFiltrados.length !== 1 ? 's' : ''}</strong>
          {' · '}{vigenciaLabel}
          {!searchTerm && filtroVigencia === 'vigentes' && (
            <span className="bloqueos-summary-hint"> · Usa los filtros para ajustar la búsqueda</span>
          )}
        </p>

        <div className="bloqueos-table-wrap">
          <table className="bloqueos-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Turno</th>
                <th>Clase</th>
                <th>Motivo</th>
                <th className="bloqueos-th-acciones"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="bloqueos-empty-cell">Cargando…</td>
                </tr>
              ) : bloqueosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="bloqueos-empty-cell">
                    <div className="bloqueos-empty-inner">
                      <AlertTriangle size={40} opacity={0.2} />
                      <span>No hay bloqueos {filtroVigencia === 'vigentes' ? 'vigentes' : filtroVigencia === 'pasados' ? 'pasados' : ''}.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                bloqueosFiltrados.map(b => {
                  const fecha = String(b.fecha || '').split('T')[0];
                  const esPasado = fecha < today;
                  return (
                    <tr key={b.id} className={`bloqueos-row${esPasado ? ' is-past' : ''}`}>
                      <td className="bloqueos-td">
                        <div className="bloqueos-fecha">
                          <Calendar size={14} className="bloqueos-fecha-icon" /> {formatFechaCorta(b.fecha)}
                        </div>
                        {esPasado && <span className="bloqueos-fecha-past-tag">Fecha pasada</span>}
                      </td>
                      <td className="bloqueos-td">
                        <span className={`bloqueos-badge ${b.turno === 'mañana' ? 'is-manana' : 'is-tarde'}`}>
                          {b.turno}
                        </span>
                      </td>
                      <td className="bloqueos-td bloqueos-td-clase">
                        {b.clase_nombre
                          ? <span className="bloqueos-clase-badge">{b.clase_nombre}</span>
                          : <span className="bloqueos-todas-tag">Todas las clases</span>}
                      </td>
                      <td className="bloqueos-td bloqueos-td-motivo">
                        {b.motivo || <span className="bloqueos-motivo-vacio">—</span>}
                      </td>
                      <td className="bloqueos-td-acciones">
                        <div className="bloqueos-menu-wrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === b.id ? null : b.id);
                            }}
                            className="bloqueos-menu-trigger"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenuId === b.id && (
                            <div onClick={e => e.stopPropagation()} className="bloqueos-menu">
                              <button
                                onClick={() => { setOpenMenuId(null); handleDelete(b.id); }}
                                className="bloqueos-menu-item is-danger"
                              >
                                <Trash2 size={15} />
                                Eliminar bloqueo
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BloqueosAdmin;
