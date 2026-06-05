import React, { useState, useEffect, useCallback } from 'react';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import axios from 'axios';
import { Plus, Trash2, Calendar, Clock, X, SlidersHorizontal, Info } from 'lucide-react';
import { toast } from 'react-toastify';

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

const inputStyle = {
  width: '100%', padding: '0.8rem', borderRadius: '8px', border: '2px solid #e2e8f0',
  outline: 'none', boxSizing: 'border-box', backgroundColor: 'white'
};
const labelStyle = { display: 'block', marginBottom: '0.6rem', fontWeight: 600, color: '#4a5568', fontSize: '0.9rem' };

const AjusteEspacios = () => {
  const [overrides, setOverrides] = useState([]);
  const [capacidades, setCapacidades] = useState([]); // cupo base actual por clase
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

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

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '2rem', backgroundColor: '#fff', padding: '1.5rem',
        borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', gap: '1rem', flexWrap: 'wrap'
      }}>
        <div>
          <h2 style={{ fontWeight: 800, color: '#2d5016', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SlidersHorizontal size={22} /> Ajuste de Espacios
          </h2>
          <p style={{ color: '#666', marginTop: '4px', marginBottom: 0 }}>
            Aumenta o reduce cuántos alumnos caben en una clase: de forma permanente, por día de la semana o para una fecha puntual.
          </p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            backgroundColor: showForm ? '#e03131' : '#2d5016',
            color: 'white', padding: '0.8rem 1.4rem', borderRadius: '8px',
            border: 'none', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancelar' : 'Nuevo Ajuste'}
        </button>
      </div>

      {/* Cupos actuales por clase (subir/bajar directo) */}
      <div style={{
        backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        padding: '1.5rem', marginBottom: '2rem'
      }}>
        <h3 style={{ margin: '0 0 0.3rem', color: '#2d3748', fontSize: '1.05rem' }}>Espacios actuales por clase</h3>
        <p style={{ margin: '0 0 1.2rem', color: '#666', fontSize: '0.9rem' }}>
          Cuántos alumnos caben en cada clase. Usa − / + para cambiar el cupo base de forma permanente.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {capacidades.map(c => (
            <div key={c.id} style={{
              border: '2px solid #e2e8f0', borderRadius: '10px', padding: '1rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem'
            }}>
              <span style={{ fontWeight: 700, color: '#2d5016', textTransform: 'capitalize' }}>{c.nombre}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <button
                  onClick={() => ajustarCupoBase(c.id, -1)}
                  disabled={(c.cupo_max || 0) <= 0}
                  title="Quitar un espacio"
                  style={{
                    width: 38, height: 38, borderRadius: '8px', border: '2px solid #e2e8f0',
                    backgroundColor: 'white', cursor: (c.cupo_max || 0) <= 0 ? 'not-allowed' : 'pointer',
                    fontSize: '1.3rem', color: '#e03131', fontWeight: 700, opacity: (c.cupo_max || 0) <= 0 ? 0.4 : 1
                  }}
                >−</button>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2d3748', minWidth: 32, textAlign: 'center' }}>
                  {c.cupo_max ?? '—'}
                </span>
                <button
                  onClick={() => ajustarCupoBase(c.id, +1)}
                  title="Agregar un espacio"
                  style={{
                    width: 38, height: 38, borderRadius: '8px', border: '2px solid #e2e8f0',
                    backgroundColor: 'white', cursor: 'pointer', fontSize: '1.3rem', color: '#2d5016', fontWeight: 700
                  }}
                >+</button>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#a0aec0' }}>espacios por horario</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '2.5rem', border: '1px solid #edf2f7'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> Crear Ajuste
          </h3>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {/* Clase */}
              <div>
                <label style={labelStyle}>Clase</label>
                <select value={form.claseId} onChange={(e) => upd('claseId', e.target.value)} style={inputStyle}>
                  {CLASES.map(c => <option key={c.id} value={c.id}>{c.n}</option>)}
                </select>
              </div>

              {/* Cuándo aplica */}
              <div>
                <label style={labelStyle}>
                  <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> ¿Cuándo aplica?
                </label>
                <select value={form.cuando} onChange={(e) => upd('cuando', e.target.value)} style={inputStyle}>
                  <option value="fijo">Siempre</option>
                  <option value="semanal">Un día de la semana</option>
                  <option value="dia">Una fecha específica</option>
                </select>
              </div>

              {/* Día de la semana (condicional) */}
              {form.cuando === 'semanal' && (
                <div>
                  <label style={labelStyle}>Día de la semana</label>
                  <select value={form.diaSemana} onChange={(e) => upd('diaSemana', e.target.value)} style={inputStyle}>
                    {DIAS.map(d => <option key={d.v} value={d.v}>{d.n}</option>)}
                  </select>
                </div>
              )}

              {/* Fecha (condicional) */}
              {form.cuando === 'dia' && (
                <div>
                  <label style={labelStyle}>Fecha</label>
                  <input type="date" value={form.fecha} onChange={(e) => upd('fecha', e.target.value)} style={inputStyle} />
                </div>
              )}

              {/* Acción */}
              <div>
                <label style={labelStyle}>¿Qué quieres hacer?</label>
                <select value={form.accion} onChange={(e) => { upd('accion', e.target.value); upd('cantidad', e.target.value === 'fijar' ? 5 : 1); }} style={inputStyle}>
                  <option value="aumentar">Aumentar espacios</option>
                  <option value="reducir">Reducir espacios</option>
                  <option value="fijar">Fijar cupo exacto</option>
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label style={labelStyle}>{form.accion === 'fijar' ? 'Cupo total' : 'Cantidad de espacios'}</label>
                <input
                  type="number"
                  min={form.accion === 'fijar' ? 0 : 1}
                  value={form.cantidad}
                  onChange={(e) => upd('cantidad', e.target.value === '' ? '' : Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Horario */}
            <div style={{ marginTop: '1.5rem' }}>
              <label style={labelStyle}>
                <Clock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Horario
              </label>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem',
                borderRadius: '8px', backgroundColor: form.todoHorario ? '#f0fdf4' : '#f8fafc',
                border: `2px solid ${form.todoHorario ? '#2d5016' : '#e2e8f0'}`,
                cursor: 'pointer', marginBottom: '0.6rem', fontWeight: 600, color: '#2d3748', width: 'fit-content'
              }}>
                <input type="checkbox" checked={form.todoHorario} onChange={(e) => upd('todoHorario', e.target.checked)} />
                Todos los horarios de la clase
              </label>
              {!form.todoHorario && (
                <input type="time" value={form.hora} onChange={(e) => upd('hora', e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
              )}
            </div>

            {/* Vista previa */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginTop: '1.5rem',
              backgroundColor: '#f7fafc', border: '1px dashed #cbd5e0', borderRadius: 8, padding: '0.8rem 1rem'
            }}>
              <Info size={18} style={{ color: '#2d5016' }} />
              <span style={{ fontSize: '0.9rem', color: '#2d3748' }}>{previewTexto()}</span>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={resetForm}
                style={{ padding: '0.8rem 1.4rem', borderRadius: '8px', border: '2px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>
                Cancelar
              </button>
              <button type="submit"
                style={{ padding: '0.8rem 1.4rem', borderRadius: '8px', border: 'none', backgroundColor: '#2d5016', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                Guardar Ajuste
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resumen */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.6rem' }}>
        <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.05rem' }}>Ajustes activos</h3>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          {overrides.length} ajuste{overrides.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Lista */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Cargando…</div>
        ) : overrides.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            <SlidersHorizontal size={32} style={{ color: '#cbd5e0', marginBottom: '0.5rem' }} />
            <div>No hay ajustes activos. Los horarios usan su cupo normal.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f7fafc', textAlign: 'left' }}>
                  <th style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: '#4a5568' }}>Clase</th>
                  <th style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: '#4a5568' }}>Aplica</th>
                  <th style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: '#4a5568' }}>Horario</th>
                  <th style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: '#4a5568' }}>Ajuste</th>
                  <th style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: '#4a5568', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {overrides.map(o => {
                  const badge = valorBadge(o);
                  return (
                    <tr key={o.id} style={{ borderTop: '1px solid #edf2f7' }}>
                      <td style={{ padding: '0.9rem 1rem', textTransform: 'capitalize', color: '#2d3748', fontWeight: 600 }}>
                        {o.clase_nombre || `Clase ${o.clase_id}`}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: '#4a5568' }}>{ambitoTxt(o)}</td>
                      <td style={{ padding: '0.9rem 1rem', color: '#4a5568' }}>
                        {o.hora_inicio ? String(o.hora_inicio).slice(0, 5) : <em style={{ color: '#a0aec0' }}>Todos</em>}
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span style={{
                          display: 'inline-block', padding: '0.2rem 0.7rem', borderRadius: '999px',
                          backgroundColor: badge.bg, color: badge.color, fontWeight: 600, fontSize: '0.8rem'
                        }}>
                          {badge.txt}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                        <button onClick={() => handleDelete(o.id)} title="Eliminar ajuste"
                          style={{ background: 'none', border: 'none', color: '#e03131', cursor: 'pointer', padding: '0.4rem' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AjusteEspacios;
