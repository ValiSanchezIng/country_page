import React, { useState, useEffect, useCallback } from 'react';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import axios from 'axios';
import { Plus, Trash2, Calendar, Clock, X, SlidersHorizontal, Info, Search, MoreVertical } from 'lucide-react';
import { toast } from 'react-toastify';
import '../../CSS/AjusteEspacios.css';

const API_BASE = 'https://elrefugiocountryclub.com/api/api';

const DIAS = [
  { v: 'L', n: 'Lunes' }, { v: 'M', n: 'Martes' }, { v: 'X', n: 'Miércoles' },
  { v: 'J', n: 'Jueves' }, { v: 'V', n: 'Viernes' }, { v: 'S', n: 'Sábado' }, { v: 'D', n: 'Domingo' },
];
const DIAS_MAP = Object.fromEntries(DIAS.map(d => [d.v, d.n]));
// IDs de clases (de la BD): 1 iniciacion, 2 intermedio, 3 paseo, 4 avanzado, 5 ponyclub
const CLASES = [
  { id: 1, n: 'Iniciación' }, { id: 2, n: 'Intermedio' }, { id: 3, n: 'Paseo' },
  { id: 4, n: 'Avanzado' }, { id: 5, n: 'Ponyclub' },
];
const CLASES_MAP = Object.fromEntries(CLASES.map(c => [c.id, c.n]));

const AjusteEspacios = () => {
  const [overrides, setOverrides] = useState([]);
  const [capacidades, setCapacidades] = useState([]); // cupo base actual por clase
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Filtros tabla
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos'); // todos | fijo | semanal | dia
  const [openMenuId, setOpenMenuId] = useState(null);

  const initialForm = {
    claseId: 1,
    cuando: 'fijo',     // fijo | semanal | dia
    diaSemana: 'M',
    fecha: '',
    todoHorario: true,
    hora: '',
    accion: 'aumentar', // aumentar | reducir | fijar
    cantidad: 1,
  };
  const [form, setForm] = useState(initialForm);
  const upd = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }));

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
      const [ovRes, capRes] = await Promise.all([
        axios.get(`${API_BASE}/horarios/overrides`),
        axios.get(`${API_BASE}/horarios/clases`),
      ]);
      setOverrides(ovRes.data);
      setCapacidades(capRes.data);
    } catch (err) {
      console.error('Error fetching overrides:', err);
      if (!silent) toast.error('Error al cargar los ajustes');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Subir/bajar el cupo BASE de una clase con +/- (cambio permanente).
  const ajustarCupoBase = async (claseId, delta) => {
    const previas = capacidades;
    // Optimista
    setCapacidades(prev => prev.map(c => c.id === claseId ? { ...c, cupo_max: Math.max(0, (c.cupo_max || 0) + delta) } : c));
    try {
      const res = await axios.patch(`${API_BASE}/horarios/clases/${claseId}/capacidad`, { delta });
      setCapacidades(prev => prev.map(c => c.id === claseId ? { ...c, cupo_max: res.data.capacidad } : c));
      const clase = previas.find(c => c.id === claseId);
      const nombre = clase?.nombre ? clase.nombre.charAt(0).toUpperCase() + clase.nombre.slice(1) : 'la clase';
      toast.success(
        `${delta > 0 ? 'Se aumentó' : 'Se disminuyó'} el espacio de ${nombre}: ahora hay ${res.data.capacidad} espacio(s).`
      );
    } catch (err) {
      setCapacidades(previas); // revertir
      toast.error(err.response?.data?.error || 'Error al actualizar el cupo');
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  const refreshSilent = useCallback(() => fetchData(true), [fetchData]);
  useAutoRefresh(refreshSilent, { interval: 30000 });

  const resetForm = () => { setForm(initialForm); setShowForm(false); };

  // Vista previa en lenguaje natural
  const previewTexto = () => {
    const clase = CLASES_MAP[Number(form.claseId)];
    const ambito = form.cuando === 'fijo' ? 'siempre'
      : form.cuando === 'semanal' ? `cada ${DIAS_MAP[form.diaSemana]}`
      : form.fecha ? `el ${form.fecha}` : 'una fecha (elige cuál)';
    const horarioTxt = form.todoHorario ? 'en todos los horarios' : form.hora ? `a las ${form.hora}` : 'a una hora (elige cuál)';
    const accionTxt = form.accion === 'aumentar' ? `+${form.cantidad} espacio(s)`
      : form.accion === 'reducir' ? `−${form.cantidad} espacio(s)`
      : `cupo fijo de ${form.cantidad}`;
    return `${clase} · ${ambito} · ${horarioTxt} → ${accionTxt}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.cuando === 'dia' && !form.fecha) { toast.error('Selecciona una fecha'); return; }
    if (!form.todoHorario && !form.hora) { toast.error("Selecciona un horario o marca 'Todos los horarios'"); return; }
    if (form.cantidad === '' || Number(form.cantidad) < 0) { toast.error('Indica una cantidad válida'); return; }

    const usuario = JSON.parse(sessionStorage.getItem('user') || '{}');
    const payload = {
      clase_id: Number(form.claseId),
      tipo: form.cuando,
      dia_semana: form.cuando === 'semanal' ? form.diaSemana : null,
      fecha: form.cuando === 'dia' ? form.fecha : null,
      hora_inicio: form.todoHorario ? null : form.hora,
      delta: form.accion === 'aumentar' ? Number(form.cantidad) : form.accion === 'reducir' ? -Number(form.cantidad) : 0,
      capacidad_abs: form.accion === 'fijar' ? Number(form.cantidad) : null,
      creado_por: usuario?.id || null,
    };
    try {
      const res = await axios.post(`${API_BASE}/horarios/overrides`, payload);
      toast.success(res.data?.message || 'Ajuste creado');
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear el ajuste');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Quitar este ajuste? El horario volverá a usar su cupo normal.')) return;
    try {
      await axios.delete(`${API_BASE}/horarios/overrides/${id}`);
      toast.success('Ajuste eliminado');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  // Descripción legible de un ajuste guardado
  const ambitoTxt = (o) => o.tipo === 'fijo' ? 'Siempre'
    : o.tipo === 'semanal' ? `Cada ${DIAS_MAP[o.dia_semana] || o.dia_semana}`
    : `El ${o.fecha ? String(o.fecha).split('T')[0] : ''}`;
  const valorBadge = (o) => o.capacidad_abs != null
    ? { txt: `Cupo fijo: ${o.capacidad_abs}`, bg: '#dbeafe', color: '#1e40af' }
    : o.delta > 0
      ? { txt: `+${o.delta} espacio(s)`, bg: '#dcfce7', color: '#166534' }
      : { txt: `${o.delta} espacio(s)`, bg: '#fee2e2', color: '#991b1b' };

  // ====== Filtros lista ======
  const overridesFiltrados = overrides.filter(o => {
    if (tipoFilter !== 'todos' && o.tipo !== tipoFilter) return false;
    if (searchTerm) {
      const clase = (o.clase_nombre || CLASES_MAP[o.clase_id] || '').toLowerCase();
      if (!clase.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });

  const tipoLabel = tipoFilter === 'todos' ? 'Todos'
    : tipoFilter === 'fijo' ? 'Siempre'
    : tipoFilter === 'semanal' ? 'Por día de semana' : 'Fecha específica';

  return (
    <div className="">
      {/* Header */}
      <div className="ae-header">
        <div>
          <h2 className="ae-title">
            <SlidersHorizontal size={22} /> Ajuste de Espacios
          </h2>
          <p className="ae-desc">
            Aumenta o reduce cuántos alumnos caben en una clase: de forma permanente, por día de la semana o para una fecha puntual.
          </p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className={`ae-btn-nuevo${showForm ? ' is-active' : ''}`}
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancelar' : 'Nuevo Ajuste'}
        </button>
      </div>

      {/* Cupos actuales por clase (subir/bajar directo) */}
      <div className="ae-cupos-card">
        <h3 className="ae-cupos-title">Espacios actuales por clase</h3>
        <p className="ae-cupos-desc">
          Cuántos alumnos caben en cada clase. Usa − / + para cambiar el cupo base de forma permanente.
        </p>
        <div className="ae-cupos-grid">
          {capacidades.map(c => (
            <div key={c.id} className="ae-cupo-item">
              <span className="ae-cupo-nombre">{c.nombre}</span>
              <div className="ae-cupo-control">
                <button
                  onClick={() => ajustarCupoBase(c.id, -1)}
                  disabled={(c.cupo_max || 0) <= 0}
                  title="Quitar un espacio"
                  className="ae-cupo-btn ae-cupo-btn-minus"
                >−</button>
                <span className="ae-cupo-value">
                  {c.cupo_max ?? '—'}
                </span>
                <button
                  onClick={() => ajustarCupoBase(c.id, +1)}
                  title="Agregar un espacio"
                  className="ae-cupo-btn ae-cupo-btn-plus"
                >+</button>
              </div>
              <span className="ae-cupo-hint">espacios por horario</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="ae-form-card">
          <h3 className="ae-form-title">
            <Plus size={20} /> Crear Ajuste
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="ae-form-grid">
              {/* Clase */}
              <div>
                <label className="ae-label">Clase</label>
                <select value={form.claseId} onChange={(e) => upd('claseId', e.target.value)} className="ae-input">
                  {CLASES.map(c => <option key={c.id} value={c.id}>{c.n}</option>)}
                </select>
              </div>

              {/* Cuándo aplica */}
              <div>
                <label className="ae-label">
                  <Calendar size={14} className="ae-label-icon" /> ¿Cuándo aplica?
                </label>
                <select value={form.cuando} onChange={(e) => upd('cuando', e.target.value)} className="ae-input">
                  <option value="fijo">Siempre</option>
                  <option value="semanal">Un día de la semana</option>
                  <option value="dia">Una fecha específica</option>
                </select>
              </div>

              {/* Día de la semana (condicional) */}
              {form.cuando === 'semanal' && (
                <div>
                  <label className="ae-label">Día de la semana</label>
                  <select value={form.diaSemana} onChange={(e) => upd('diaSemana', e.target.value)} className="ae-input">
                    {DIAS.map(d => <option key={d.v} value={d.v}>{d.n}</option>)}
                  </select>
                </div>
              )}

              {/* Fecha (condicional) */}
              {form.cuando === 'dia' && (
                <div>
                  <label className="ae-label">Fecha</label>
                  <input type="date" value={form.fecha} onChange={(e) => upd('fecha', e.target.value)} className="ae-input" />
                </div>
              )}

              {/* Acción */}
              <div>
                <label className="ae-label">¿Qué quieres hacer?</label>
                <select value={form.accion} onChange={(e) => { upd('accion', e.target.value); upd('cantidad', e.target.value === 'fijar' ? 5 : 1); }} className="ae-input">
                  <option value="aumentar">Aumentar espacios</option>
                  <option value="reducir">Reducir espacios</option>
                  <option value="fijar">Fijar cupo exacto</option>
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label className="ae-label">{form.accion === 'fijar' ? 'Cupo total' : 'Cantidad de espacios'}</label>
                <input
                  type="number"
                  min={form.accion === 'fijar' ? 0 : 1}
                  value={form.cantidad}
                  onChange={(e) => upd('cantidad', e.target.value === '' ? '' : Number(e.target.value))}
                  className="ae-input"
                />
              </div>
            </div>

            {/* Horario */}
            <div className="ae-horario">
              <label className="ae-label">
                <Clock size={14} className="ae-label-icon" /> Horario
              </label>
              <label className={`ae-todos${form.todoHorario ? ' is-checked' : ''}`}>
                <input type="checkbox" checked={form.todoHorario} onChange={(e) => upd('todoHorario', e.target.checked)} />
                Todos los horarios de la clase
              </label>
              {!form.todoHorario && (
                <input type="time" value={form.hora} onChange={(e) => upd('hora', e.target.value)} className="ae-input ae-input-time" />
              )}
            </div>

            {/* Vista previa */}
            <div className="ae-preview">
              <Info size={18} className="ae-preview-icon" />
              <span className="ae-preview-text">{previewTexto()}</span>
            </div>

            <div className="ae-form-actions">
              <button type="button" onClick={resetForm} className="ae-btn-cancel">
                Cancelar
              </button>
              <button type="submit" className="ae-btn-submit">
                Guardar Ajuste
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      <div className="ae-lista">
        {/* Filtros integrados en la card */}
        <div className="ae-filtros">
          <div className="ae-search-wrap">
            <Search size={14} className="ae-search-icon" />
            <input
              type="text"
              placeholder="Buscar por clase..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="ae-search-input"
            />
          </div>
          <select
            value={tipoFilter}
            onChange={e => setTipoFilter(e.target.value)}
            className="ae-filter-select"
          >
            <option value="todos">Todos</option>
            <option value="fijo">Siempre</option>
            <option value="semanal">Por día de semana</option>
            <option value="dia">Fecha específica</option>
          </select>
        </div>

        {/* Resumen de filtros */}
        <p className="ae-summary">
          Mostrando <strong>{overridesFiltrados.length} ajuste{overridesFiltrados.length !== 1 ? 's' : ''}</strong>
          {' · '}{tipoLabel}
          {!searchTerm && tipoFilter === 'todos' && (
            <span className="ae-summary-hint"> · Usa los filtros para ajustar la búsqueda</span>
          )}
        </p>

        <div className="ae-table-wrap">
          <table className="ae-table">
            <thead>
              <tr>
                <th>Clase</th>
                <th>Aplica</th>
                <th>Horario</th>
                <th>Ajuste</th>
                <th className="ae-th-acciones"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="ae-empty-cell">Cargando…</td>
                </tr>
              ) : overridesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="ae-empty-cell">
                    <div className="ae-empty-inner">
                      <SlidersHorizontal size={40} opacity={0.2} />
                      <span>No hay ajustes activos. Los horarios usan su cupo normal.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                overridesFiltrados.map(o => {
                  const badge = valorBadge(o);
                  return (
                    <tr key={o.id} className="ae-row">
                      <td className="ae-td ae-td-clase">
                        <span className="ae-clase-badge">{o.clase_nombre || `Clase ${o.clase_id}`}</span>
                      </td>
                      <td className="ae-td">{ambitoTxt(o)}</td>
                      <td className="ae-td">
                        {o.hora_inicio ? String(o.hora_inicio).slice(0, 5) : <span className="ae-todos-tag">Todos</span>}
                      </td>
                      <td className="ae-td">
                        <span className="ae-badge" style={{ '--badge-bg': badge.bg, '--badge-color': badge.color }}>
                          {badge.txt}
                        </span>
                      </td>
                      <td className="ae-td-acciones">
                        <div className="ae-menu-wrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === o.id ? null : o.id);
                            }}
                            className="ae-menu-trigger"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenuId === o.id && (
                            <div onClick={e => e.stopPropagation()} className="ae-menu">
                              <button
                                onClick={() => { setOpenMenuId(null); handleDelete(o.id); }}
                                className="ae-menu-item is-danger"
                              >
                                <Trash2 size={15} />
                                Eliminar ajuste
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

export default AjusteEspacios;
