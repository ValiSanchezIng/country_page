import React, { useState, useEffect, useCallback } from 'react';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import axios from 'axios';
import { Plus, Trash2, Calendar, Clock, X, Ban, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

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

  const initialFormState = {
    fecha: '',
    turno: 'mañana',
    todasLasClases: true,   // por defecto, bloquear todas
    claseIdsMarcados: [],   // ids cuando todasLasClases = false
    motivo: ''
  };
  const [formData, setFormData] = useState(initialFormState);

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
    if (filtroVigencia === 'vigentes') return fecha >= today;
    if (filtroVigencia === 'pasados') return fecha < today;
    return true;
  });

  // ====== Render ======
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '2rem', backgroundColor: '#fff', padding: '1.5rem',
        borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', gap: '1rem', flexWrap: 'wrap'
      }}>
        <div>
          <h2 style={{ fontWeight: '800', color: '#2d5016', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ban size={22} /> Bloqueos de Clases
          </h2>
          <p style={{ color: '#666', marginTop: '4px', marginBottom: 0 }}>
            Cierra horarios puntuales (clima, eventos…). Los clientes no podrán reservar. Las reservas ya hechas se mantienen.
          </p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            backgroundColor: showForm ? '#e03131' : '#2d5016',
            color: 'white', padding: '0.8rem 1.4rem', borderRadius: '8px',
            border: 'none', cursor: 'pointer', fontWeight: '600',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancelar' : 'Nuevo Bloqueo'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '2.5rem',
          border: '1px solid #edf2f7'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> Crear Bloqueo
          </h3>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {/* Fecha */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>
                  <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Fecha
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  min={today}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '2px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Turno */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>
                  <Clock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Turno
                </label>
                <select
                  required
                  value={formData.turno}
                  onChange={(e) => setFormData(prev => ({ ...prev, turno: e.target.value }))}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '2px solid #e2e8f0', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' }}
                >
                  <option value="mañana">Mañana (antes de 12:00)</option>
                  <option value="tarde">Tarde (12:00 en adelante)</option>
                </select>
              </div>

              {/* Motivo */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  value={formData.motivo}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                  placeholder="Ej: clima, evento del club…"
                  maxLength={255}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '2px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Clases — checkboxes */}
            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>
                Clases a bloquear
              </label>

              <label style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem',
                borderRadius: '8px', backgroundColor: formData.todasLasClases ? '#f0fdf4' : '#f8fafc',
                border: `2px solid ${formData.todasLasClases ? '#2d5016' : '#e2e8f0'}`,
                cursor: 'pointer', marginBottom: '0.6rem', fontWeight: 600, color: '#2d3748'
              }}>
                <input
                  type="checkbox"
                  checked={formData.todasLasClases}
                  onChange={(e) => setFormData(prev => ({ ...prev, todasLasClases: e.target.checked }))}
                />
                Todas las clases
              </label>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem',
                opacity: formData.todasLasClases ? 0.45 : 1, pointerEvents: formData.todasLasClases ? 'none' : 'auto'
              }}>
                {clases.map(c => {
                  const checked = formData.claseIdsMarcados.includes(c.id);
                  return (
                    <label key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.8rem',
                      borderRadius: '8px', backgroundColor: checked ? '#fff7ee' : '#f8fafc',
                      border: `2px solid ${checked ? '#c17b4a' : '#e2e8f0'}`,
                      cursor: 'pointer', textTransform: 'capitalize', fontSize: '0.9rem', color: '#2d3748'
                    }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleClase(c.id)} />
                      {c.nombre}
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={resetForm}
                style={{ padding: '0.8rem 1.4rem', borderRadius: '8px', border: '2px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>
                Cancelar
              </button>
              <button type="submit"
                style={{ padding: '0.8rem 1.4rem', borderRadius: '8px', border: 'none', backgroundColor: '#2d5016', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                Crear Bloqueo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros + resumen */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { v: 'vigentes', label: 'Vigentes' },
            { v: 'pasados', label: 'Pasados' },
            { v: 'todos', label: 'Todos' }
          ].map(opt => (
            <button key={opt.v} onClick={() => setFiltroVigencia(opt.v)}
              style={{
                padding: '0.5rem 1rem', borderRadius: '8px',
                border: `2px solid ${filtroVigencia === opt.v ? '#2d5016' : '#e2e8f0'}`,
                backgroundColor: filtroVigencia === opt.v ? '#2d5016' : 'white',
                color: filtroVigencia === opt.v ? 'white' : '#4a5568',
                fontWeight: 600, cursor: 'pointer'
              }}>
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          {bloqueosFiltrados.length} bloqueo{bloqueosFiltrados.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Lista */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Cargando…</div>
        ) : bloqueosFiltrados.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            <AlertTriangle size={32} style={{ color: '#cbd5e0', marginBottom: '0.5rem' }} />
            <div>No hay bloqueos {filtroVigencia === 'vigentes' ? 'vigentes' : filtroVigencia === 'pasados' ? 'pasados' : ''}.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f7fafc', textAlign: 'left' }}>
                  <th style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: '#4a5568' }}>Fecha</th>
                  <th style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: '#4a5568' }}>Turno</th>
                  <th style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: '#4a5568' }}>Clase</th>
                  <th style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: '#4a5568' }}>Motivo</th>
                  <th style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: '#4a5568', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {bloqueosFiltrados.map(b => {
                  const fecha = String(b.fecha || '').split('T')[0];
                  const esPasado = fecha < today;
                  return (
                    <tr key={b.id} style={{ borderTop: '1px solid #edf2f7', opacity: esPasado ? 0.6 : 1 }}>
                      <td style={{ padding: '0.9rem 1rem', color: '#2d3748' }}>{formatFechaCorta(b.fecha)}</td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span style={{
                          display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '999px',
                          backgroundColor: b.turno === 'mañana' ? '#fef3c7' : '#dbeafe',
                          color: b.turno === 'mañana' ? '#92400e' : '#1e40af',
                          fontWeight: 600, fontSize: '0.8rem'
                        }}>
                          {b.turno}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textTransform: 'capitalize', color: '#2d3748' }}>
                        {b.clase_nombre || <em style={{ color: '#666' }}>Todas las clases</em>}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: '#4a5568' }}>{b.motivo || <span style={{ color: '#a0aec0' }}>—</span>}</td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                        <button onClick={() => handleDelete(b.id)} title="Eliminar bloqueo"
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

export default BloqueosAdmin;
