import React, { useState, useEffect, useRef, useCallback } from 'react';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import axios from 'axios';
import { Plus, Trash2, Calendar, Clock, User, CheckCircle, XCircle, Edit2, Save, X, Search, MoreVertical } from 'lucide-react';
import { toast } from 'react-toastify';
import '../../CSS/HorariosPersonalizadosAdmin.css';

// Combobox: input con búsqueda + lista desplegable filtrable
const SearchableSelect = ({ value, onChange, options, placeholder, disabled, required }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Texto que muestra el input: si hay valor seleccionado muestra su label, si está abierto muestra lo que se escribe
  const selectedLabel = options.find(o => String(o.value) === String(value))?.label || '';

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  // Cierra el dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (opt) => {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  };

  const handleInputClick = () => {
    if (!disabled) { setOpen(true); setQuery(''); }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setOpen(true);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="hp-select">
      {/* Input visible */}
      <div className="hp-select-input-wrap">
        <Search size={15} className="hp-select-search-icon" />
        <input
          type="text"
          required={required && !value}
          readOnly={disabled}
          value={open ? query : selectedLabel}
          onClick={handleInputClick}
          onChange={handleInputChange}
          placeholder={disabled ? 'Primero seleccione clase' : placeholder}
          className={`hp-select-input${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}`}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="hp-select-clear"
          >
            <X size={15} />
          </button>
        )}
      </div>
      {/* Dropdown */}
      {open && !disabled && (
        <div className="hp-select-dropdown">
          {filtered.length === 0 ? (
            <div className="hp-select-empty">Sin resultados</div>
          ) : (
            filtered.map(opt => (
              <div
                key={opt.value}
                onMouseDown={() => handleSelect(opt)}
                className={`hp-select-option${String(opt.value) === String(value) ? ' is-selected' : ''}`}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
      {/* Hidden input para required nativo del form */}
      {required && <input type="hidden" value={value} required={!value} onChange={() => {}} />}
    </div>
  );
};

const HorariosPersonalizadosAdmin = () => {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingIds, setEditingIds] = useState([]); // IDs del grupo que se edita
  
  // Data for selects
  const [clientes, setClientes] = useState([]);
  const [instructoras, setInstructoras] = useState([]);
  const [clases, setClases] = useState([]);
  const [instructoraClases, setInstructoraClases] = useState([]);

  // Form state
  const initialFormState = {
    cliente_id: '',
    instructora_id: '',
    clase_id: '',
    tipo: 'fecha_especifica',
    fecha: '',
    dias_semana: ['L'],
    hora_inicio: '10:30',
    hora_fin: '11:30'
  };

  const [formData, setFormData] = useState(initialFormState);

  // Filtros de tabla
  const [hpSearchTerm, setHpSearchTerm] = useState('');
  const [hpTipoFilter, setHpTipoFilter] = useState('vigentes');
  const [hpSortBy, setHpSortBy] = useState('cliente');
  const [hpOpenMenuId, setHpOpenMenuId] = useState(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (hpOpenMenuId === null) return;
    const close = () => setHpOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [hpOpenMenuId]);

  // Conteo filtrado para el resumen
  const hpFilteredCount = (() => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return horarios.filter(hp => {
      // Filtro tipo
      if (hpTipoFilter === 'vigentes') {
        if (!(hp.tipo === 'recurrente' || (hp.fecha && new Date(hp.fecha) >= hoy))) return false;
      } else if (hpTipoFilter === 'pasados') {
        if (!(hp.tipo === 'fecha_especifica' && hp.fecha && new Date(hp.fecha) < hoy)) return false;
      } else if (hpTipoFilter === 'recurrente') {
        if (hp.tipo !== 'recurrente') return false;
      } else if (hpTipoFilter === 'fecha_especifica') {
        if (hp.tipo !== 'fecha_especifica') return false;
      }
      // Filtro búsqueda
      if (hpSearchTerm) {
        const term = hpSearchTerm.toLowerCase();
        const cliente = `${hp.cliente_nombre || ''} ${hp.cliente_apellido || ''}`.toLowerCase();
        const instructora = `${hp.instructora_nombre || ''} ${hp.instructora_apellido || ''}`.toLowerCase();
        if (!cliente.includes(term) && !instructora.includes(term)) return false;
      }
      return true;
    }).length;
  })();

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [hRes, cRes, iRes, clRes, icRes] = await Promise.all([
        axios.get('https://elrefugiocountryclub.com/api/api/horarios/personalizados-all'),
        axios.get('https://elrefugiocountryclub.com/api/api/users/all'),
        axios.get('https://elrefugiocountryclub.com/api/api/instructoras'),
        axios.get('https://elrefugiocountryclub.com/api/api/horarios/clases'),
        axios.get('https://elrefugiocountryclub.com/api/api/instructoras/clases-asignadas')
      ]);
      setHorarios(hRes.data);
      setClientes(cRes.data.filter(u => u.rol === 'cliente' && u.estatus?.toLowerCase() !== 'bloqueado'));
      setInstructoras(iRes.data.filter(i => i.disponibilidad === 'disponible'));
      setClases(clRes.data);
      setInstructoraClases(icRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (!silent) toast.error('Error al cargar datos');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh silencioso cada 30s
  const refreshHorarios = useCallback(() => fetchData(true), []);
  useAutoRefresh(refreshHorarios, { interval: 30000 });

  const handleEdit = (grupo) => {
    // grupo puede ser un registro individual o un grupo con _ids y _dias
    const ids = grupo._ids || [grupo.id];
    const dias = grupo._dias || (grupo.dia_semana ? [grupo.dia_semana] : ['L']);
    setEditingId(grupo.id);
    setEditingIds(ids);
    setFormData({
      cliente_id: grupo.cliente_id,
      instructora_id: grupo.instructora_id,
      clase_id: grupo.clase_id,
      tipo: grupo.tipo,
      fecha: grupo.fecha ? grupo.fecha.split('T')[0] : '',
      dias_semana: dias,
      hora_inicio: grupo.hora_inicio,
      hora_fin: grupo.hora_fin
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClaseChange = (val) => {
    const claseSeleccionada = clases.find(c => c.id === parseInt(val));
    
    let duracion = 60;
    if (claseSeleccionada) {
      if (['iniciacion', 'ponyclub'].includes(claseSeleccionada.nombre.toLowerCase())) {
        duracion = 30;
      } else {
        duracion = claseSeleccionada.duracion_min || 60;
      }
    }

    setFormData(prev => {
      const newHoraInicio = prev.hora_inicio || '10:30';
      const [h, m] = newHoraInicio.split(':').map(Number);
      const end = new Date();
      end.setHours(h, m + duracion, 0);
      const horaFinString = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
      
      // Validar si la instructora actual puede dar esta nueva clase
      let nuevaInstructoraId = prev.instructora_id;
      if (prev.instructora_id) {
        const puedeDarClase = instructoraClases.some(ic => 
          ic.instructora_id === parseInt(prev.instructora_id) && 
          ic.clase_id === parseInt(val)
        );
        if (!puedeDarClase) {
          nuevaInstructoraId = ''; // Resetear si no es válida
        }
      }

      return {
        ...prev,
        clase_id: val,
        instructora_id: nuevaInstructoraId,
        hora_fin: horaFinString
      };
    });
  };

  const handleHoraInicioChange = (val) => {
    setFormData(prev => {
      const [h, m] = val.split(':').map(Number);
      
      // Determinar duración actual basada en la diferencia
      const [startH, startM] = prev.hora_inicio.split(':').map(Number);
      const [endH, endM] = prev.hora_fin.split(':').map(Number);
      const duracionActual = (endH * 60 + endM) - (startH * 60 + startM);
      const duracionUsar = duracionActual > 0 ? duracionActual : 60;

      const end = new Date();
      end.setHours(h, m + duracionUsar, 0);
      const horaFinString = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
      
      return {
        ...prev,
        hora_inicio: val,
        hora_fin: horaFinString
      };
    });
  };

  const handleDuracionManual = (minutos) => {
    setFormData(prev => {
      const [h, m] = prev.hora_inicio.split(':').map(Number);
      const end = new Date();
      end.setHours(h, m + parseInt(minutos), 0);
      const horaFinString = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
      
      return {
        ...prev,
        hora_fin: horaFinString
      };
    });
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setEditingIds([]);
    setShowForm(false);
  };

  const handleClienteChange = (clienteId) => {
    const clienteSeleccionado = clientes.find(c => String(c.id) === String(clienteId));
    const tipoNivel = clienteSeleccionado?.tipo_nivel?.toLowerCase();
    
    // Buscar clase cuyo nombre coincida con el tipo_nivel del cliente
    const claseMatch = tipoNivel
      ? clases.find(c => c.nombre.toLowerCase() === tipoNivel)
      : null;

    setFormData(prev => ({ ...prev, cliente_id: clienteId }));
    
    if (claseMatch) {
      // Reutilizar handleClaseChange para calcular hora_fin y filtrar instructoras
      handleClaseChange(String(claseMatch.id));
    }
  };

  const handleDiaToggle = (dia) => {
    setFormData(prev => {
      const current = prev.dias_semana;
      if (current.includes(dia)) {
        // No permitir deseleccionar el último día
        if (current.length === 1) return prev;
        return { ...prev, dias_semana: current.filter(d => d !== dia) };
      } else {
        return { ...prev, dias_semana: [...current, dia] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        if (editingIds.length > 1 || (formData.tipo === 'recurrente' && formData.dias_semana.length > 1)) {
          // Grupo multi-día: borrar todos los viejos y crear nuevos por cada día seleccionado
          await Promise.all(editingIds.map(id =>
            axios.delete(`https://elrefugiocountryclub.com/api/api/horarios/personalizados/${id}`)
          ));
          const dias = formData.tipo === 'recurrente' ? formData.dias_semana : [null];
          await Promise.all(dias.map(dia => {
            const payload = { ...formData, dia_semana: dia };
            return axios.post('https://elrefugiocountryclub.com/api/api/horarios/personalizados', payload);
          }));
          toast.success('Horario actualizado correctamente');
        } else {
          // Edición simple vía PUT
          const payload = { ...formData, dia_semana: formData.dias_semana[0] };
          await axios.put(`https://elrefugiocountryclub.com/api/api/horarios/personalizados/${editingId}`, payload);
          toast.success('Horario actualizado correctamente');
        }
      } else {
        const dias = formData.tipo === 'recurrente' ? formData.dias_semana : [null];
        await Promise.all(
          dias.map(dia => {
            const payload = { ...formData, dia_semana: dia };
            return axios.post('https://elrefugiocountryclub.com/api/api/horarios/personalizados', payload);
          })
        );
        const count = dias.length;
        toast.success(count > 1 ? `${count} horarios creados correctamente` : 'Horario personalizado creado');
      }
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error saving schedule:', err);
      toast.error(editingId ? 'Error al actualizar' : 'Error al crear');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este horario personalizado?')) return;
    try {
      await axios.delete(`https://elrefugiocountryclub.com/api/api/horarios/personalizados/${id}`);
      toast.success('Horario eliminado');
      fetchData();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const dayMapLong = {
    'L': 'Lunes', 'M': 'Martes', 'X': 'Miércoles', 'J': 'Jueves',
    'V': 'Viernes', 'S': 'Sábado', 'D': 'Domingo'
  };

  return (
    <div className="">
      <div className="hp-header">
        <div>
          <h2 className="hp-section-title">Gestión de Horarios Especiales</h2>
          <p className="hp-section-subtitle">Configura excepciones y horarios personalizados para clientes específicos</p>
        </div>
        <button
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
          className={`hp-btn-toggle${showForm ? ' is-cancel' : ''}`}
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancelar' : 'Nuevo Horario Extra'}
        </button>
      </div>

      {showForm && (
        <div className="hp-form-card">
          <h3 className="hp-form-title">
            {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
            {editingId ? 'Editar Horario Especial' : 'Crear Nuevo Horario Especial'}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="hp-form-grid">
              <div className="form-group">
                <label className="hp-label">Cliente</label>
                <SearchableSelect
                  required
                  value={formData.cliente_id}
                  onChange={handleClienteChange}
                  placeholder="Buscar cliente..."
                  options={clientes.map(c => ({ value: c.id, label: `${c.nombre} ${c.apellido} (${c.username})` }))}
                />
              </div>

              <div className="form-group">
                <label className="hp-label">Clase</label>
                <select
                  required
                  value={formData.clase_id}
                  onChange={(e) => handleClaseChange(e.target.value)}
                  className="hp-input"
                >
                  <option value="">Seleccione clase...</option>
                  {clases.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="hp-label">Instructora</label>
                <SearchableSelect
                  required
                  disabled={!formData.clase_id}
                  value={formData.instructora_id}
                  onChange={(val) => setFormData(prev => ({ ...prev, instructora_id: val }))}
                  placeholder="Buscar instructora..."
                  options={instructoras
                    .filter(i => instructoraClases.some(ic => ic.instructora_id === i.id && ic.clase_id === parseInt(formData.clase_id)))
                    .map(i => ({ value: i.id, label: `${i.nombre} ${i.apellido}` }))
                  }
                />
                {formData.clase_id && instructoras.filter(i => instructoraClases.some(ic => ic.instructora_id === i.id && ic.clase_id === parseInt(formData.clase_id))).length === 0 && (
                  <p className="hp-warning">No hay instructoras disponibles para esta clase</p>
                )}
              </div>

              <div className="form-group">
                <label className="hp-label">Duración Sugerida</label>
                <select
                  onChange={(e) => handleDuracionManual(e.target.value)}
                  className="hp-input hp-input-muted"
                  value={(parseInt(formData.hora_fin.split(':')[0]) * 60 + parseInt(formData.hora_fin.split(':')[1])) - (parseInt(formData.hora_inicio.split(':')[0]) * 60 + parseInt(formData.hora_inicio.split(':')[1]))}
                >
                  <option value="30">Media Hora (30 min)</option>
                  <option value="60">Una Hora (60 min)</option>
                  <option value="90">Hora y Media (90 min)</option>
                  <option value="120">Dos Horas (120 min)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="hp-label">Tipo de Horario</label>
                <div className="hp-tipo-group">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, tipo: 'fecha_especifica'})}
                    className={`hp-tipo-btn${formData.tipo === 'fecha_especifica' ? ' is-active' : ''}`}
                  >
                    Fecha Única
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, tipo: 'recurrente'})}
                    className={`hp-tipo-btn${formData.tipo === 'recurrente' ? ' is-active' : ''}`}
                  >
                    Cada Semana
                  </button>
                </div>
              </div>

              {formData.tipo === 'fecha_especifica' ? (
                <div className="form-group">
                  <label className="hp-label">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    className="hp-input"
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="hp-label">
                    Días de la Semana
                    {!editingId && (
                      <span className="hp-label-hint">
                        (puedes seleccionar varios)
                      </span>
                    )}
                  </label>
                  <div className="hp-dias-group">
                    {Object.entries(dayMapLong).map(([key, label]) => {
                      const isSelected = formData.dias_semana.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleDiaToggle(key)}
                          title={label}
                          className={`hp-dia-btn${isSelected ? ' is-active' : ''}`}
                        >
                          {key}
                        </button>
                      );
                    })}
                  </div>
                  {!editingId && formData.dias_semana.length > 1 && (
                    <p className="hp-dias-info">
                      ✓ Se crearán {formData.dias_semana.length} horarios: {formData.dias_semana.map(d => dayMapLong[d]).join(', ')}
                    </p>
                  )}
                </div>
              )}

              <div className="hp-hora-row">
                <div className="hp-hora-col">
                  <label className="hp-label">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={formData.hora_inicio}
                    onChange={(e) => handleHoraInicioChange(e.target.value)}
                    className="hp-input"
                  />
                </div>
                <div className="hp-hora-col">
                  <label className="hp-label">Hora Fin</label>
                  <input
                    type="time"
                    required
                    value={formData.hora_fin}
                    onChange={(e) => setFormData({...formData, hora_fin: e.target.value})}
                    className="hp-input"
                  />
                </div>
              </div>
            </div>

            <div className="hp-form-actions">
              <button type="submit" className="hp-btn-submit">
                {editingId ? <Save size={20} /> : <CheckCircle size={20} />}
                {editingId ? 'Actualizar Horario' : 'Confirmar y Guardar'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="hp-btn-discard">
                  Descartar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="hp-list">
        {/* Filtros integrados en la card */}
        <div className="hp-filters">
          <div className="hp-search-wrap">
            <Search size={14} className="hp-search-icon" />
            <input
              type="text"
              placeholder="Buscar cliente o instructora..."
              value={hpSearchTerm}
              onChange={e => setHpSearchTerm(e.target.value)}
              className="hp-search-input"
            />
          </div>
          <select
            value={hpTipoFilter}
            onChange={e => setHpTipoFilter(e.target.value)}
            className="hp-filter-select"
          >
            <option value="">Todos</option>
            <option value="vigentes">Vigentes</option>
            <option value="recurrente">Recurrentes</option>
            <option value="fecha_especifica">Fecha única</option>
            <option value="pasados">Pasados</option>
          </select>
          <select
            value={hpSortBy}
            onChange={e => setHpSortBy(e.target.value)}
            className="hp-filter-select"
          >
            <option value="cliente">Por cliente</option>
            <option value="instructora">Por instructora</option>
            <option value="clase">Por clase</option>
          </select>
        </div>

        {/* Resumen de filtros */}
        <p className="hp-summary">
          Mostrando <strong>{hpFilteredCount} horario{hpFilteredCount !== 1 ? 's' : ''}</strong>
          {' · '}{hpTipoFilter === 'vigentes' ? 'Vigentes' : hpTipoFilter === 'recurrente' ? 'Recurrentes' : hpTipoFilter === 'fecha_especifica' ? 'Fecha única' : hpTipoFilter === 'pasados' ? 'Pasados' : 'Todos'}
          {' · '}{hpSortBy === 'cliente' ? 'Por cliente' : hpSortBy === 'instructora' ? 'Por instructora' : 'Por clase'}
          {!hpTipoFilter && !hpSearchTerm && (
            <span className="hp-summary-hint"> · Usa los filtros para ajustar la búsqueda</span>
          )}
        </p>

        <div className="hp-table-wrap">
          <table className="hp-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Clase</th>
                <th>Instructora</th>
                <th>Periodicidad</th>
                <th>Horario</th>
                <th className="hp-th-actions"></th>
              </tr>
            </thead>
            <tbody>
              {horarios.length === 0 ? (
                <tr>
                  <td colSpan="6" className="hp-empty-cell">
                    <div className="hp-empty-inner">
                      <Calendar size={48} opacity={0.2} />
                      <span>No hay horarios personalizados configurados</span>
                    </div>
                  </td>
                </tr>
              ) : (() => {
                // Agrupar horarios recurrentes con mismo cliente+instructora+clase+hora en una sola fila
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const diasOrden = ['L','M','X','J','V','S','D'];
                const grupos = [];
                const usados = new Set();

                // Filtrar por tipo/vigencia
                const horariosBase = horarios.filter(hp => {
                  if (hpTipoFilter === 'vigentes') {
                    return hp.tipo === 'recurrente' || (hp.fecha && new Date(hp.fecha) >= hoy);
                  }
                  if (hpTipoFilter === 'pasados') {
                    return hp.tipo === 'fecha_especifica' && hp.fecha && new Date(hp.fecha) < hoy;
                  }
                  if (hpTipoFilter === 'recurrente') return hp.tipo === 'recurrente';
                  if (hpTipoFilter === 'fecha_especifica') return hp.tipo === 'fecha_especifica';
                  return true;
                });

                // Filtrar por búsqueda
                const horariosFiltered = horariosBase.filter(hp => {
                  if (!hpSearchTerm) return true;
                  const term = hpSearchTerm.toLowerCase();
                  const cliente = `${hp.cliente_nombre || ''} ${hp.cliente_apellido || ''}`.toLowerCase();
                  const instructora = `${hp.instructora_nombre || ''} ${hp.instructora_apellido || ''}`.toLowerCase();
                  return cliente.includes(term) || instructora.includes(term);
                });

                horariosFiltered.forEach(hp => {
                  if (usados.has(hp.id)) return;
                  if (hp.tipo === 'recurrente') {
                    const hermanos = horariosFiltered.filter(h =>
                      !usados.has(h.id) &&
                      h.tipo === 'recurrente' &&
                      h.cliente_id === hp.cliente_id &&
                      h.instructora_id === hp.instructora_id &&
                      h.clase_id === hp.clase_id &&
                      h.hora_inicio === hp.hora_inicio &&
                      h.hora_fin === hp.hora_fin
                    );
                    hermanos.forEach(h => usados.add(h.id));
                    const diasOrdenados = hermanos
                      .map(h => h.dia_semana)
                      .sort((a, b) => diasOrden.indexOf(a) - diasOrden.indexOf(b));
                    grupos.push({ ...hp, _ids: hermanos.map(h => h.id), _dias: diasOrdenados });
                  } else {
                    usados.add(hp.id);
                    grupos.push({ ...hp, _ids: [hp.id], _dias: [hp.dia_semana] });
                  }
                });

                // Ordenar
                grupos.sort((a, b) => {
                  if (hpSortBy === 'cliente') {
                    return `${a.cliente_nombre} ${a.cliente_apellido}`.localeCompare(`${b.cliente_nombre} ${b.cliente_apellido}`);
                  }
                  if (hpSortBy === 'instructora') {
                    return `${a.instructora_nombre} ${a.instructora_apellido}`.localeCompare(`${b.instructora_nombre} ${b.instructora_apellido}`);
                  }
                  if (hpSortBy === 'clase') {
                    return (a.clase_nombre || '').localeCompare(b.clase_nombre || '');
                  }
                  return 0;
                });

                if (grupos.length === 0) {
                  return (
                    <tr>
                      <td colSpan="6" className="hp-noresults-cell">
                        No se encontraron horarios con los filtros aplicados.
                      </td>
                    </tr>
                  );
                }

                return grupos.map(grupo => {
                  const esPasado = grupo.tipo === 'fecha_especifica' && grupo.fecha && new Date(grupo.fecha) < hoy;
                  return (
                  <tr key={grupo._ids.join('-')} className={`hp-row${esPasado ? ' is-past' : ''}`}>
                    <td className="hp-td">
                      <div className="hp-cliente-name">{grupo.cliente_nombre} {grupo.cliente_apellido}</div>
                      <div className="hp-cliente-id">#{grupo.cliente_id}</div>
                    </td>
                    <td className="hp-td">
                      <span className="hp-clase-badge">
                        {grupo.clase_nombre}
                      </span>
                    </td>
                    <td className="hp-td">
                      <div className="hp-instr-cell">
                        <div className={`hp-instr-avatar${grupo.instructora_disponibilidad !== 'disponible' ? ' is-unavailable' : ''}`}>
                          {grupo.instructora_disponibilidad !== 'disponible' ? <XCircle size={14} /> : <User size={14} />}
                        </div>
                        <div className="hp-instr-info">
                          <span className={`hp-instr-name${grupo.instructora_disponibilidad !== 'disponible' ? ' is-unavailable' : ''}`}>{grupo.instructora_nombre} {grupo.instructora_apellido}</span>
                          {grupo.instructora_disponibilidad !== 'disponible' && (
                            <span className="hp-instr-unavailable-tag">Instructora no disponible</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hp-td">
                      {grupo.tipo === 'recurrente' ? (
                        <div className="hp-dias-badges">
                          {grupo._dias.map(d => {
                            const nombres = { L: 'Lunes', M: 'Martes', X: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado', D: 'Domingo' };
                            return (
                              <span key={d} className="hp-dia-badge">{nombres[d] || d}</span>
                            );
                          })}
                        </div>
                      ) : (
                        <div>
                          <div className={`hp-fecha${esPasado ? ' is-past' : ''}`}>
                            <Calendar size={14} className="hp-fecha-icon" /> {new Date(grupo.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          {esPasado && (
                            <span className="hp-fecha-past-tag">Fecha pasada</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="hp-td">
                      <div className="hp-horario-badge">
                        {grupo.hora_inicio} - {grupo.hora_fin}
                      </div>
                    </td>
                    <td className="hp-td-actions">
                      <div className="hp-menu-wrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const menuKey = grupo._ids.join('-');
                            setHpOpenMenuId(hpOpenMenuId === menuKey ? null : menuKey);
                          }}
                          className="hp-menu-trigger"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {hpOpenMenuId === grupo._ids.join('-') && (
                          <div onClick={e => e.stopPropagation()} className="hp-menu">
                            <button
                              onClick={() => { handleEdit(grupo); setHpOpenMenuId(null); }}
                              className="hp-menu-item"
                            >
                              <Edit2 size={15} className="hp-menu-item-icon-edit" />
                              Editar horario
                            </button>
                            <div className="hp-menu-divider" />
                            <button
                              onClick={async () => {
                                setHpOpenMenuId(null);
                                const msg = grupo._ids.length > 1
                                  ? `¿Eliminar los ${grupo._ids.length} horarios de este grupo (${grupo._dias.map(d => dayMapLong[d]).join(', ')})?`
                                  : '¿Eliminar este horario personalizado?';
                                if (!window.confirm(msg)) return;
                                try {
                                  await Promise.all(grupo._ids.map(id =>
                                    axios.delete(`https://elrefugiocountryclub.com/api/api/horarios/personalizados/${id}`)
                                  ));
                                  toast.success(grupo._ids.length > 1 ? `${grupo._ids.length} horarios eliminados` : 'Horario eliminado');
                                  fetchData();
                                } catch {
                                  toast.error('Error al eliminar');
                                }
                              }}
                              className="hp-menu-item is-danger"
                            >
                              <Trash2 size={15} />
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HorariosPersonalizadosAdmin;
