import React, { useState, useEffect, useCallback } from 'react';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import axios from 'axios';
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const API_BASE = 'https://elrefugiocountryclub.com/api/api';

// Componente para gestionar la disponibilidad de las franjas horarias.
// Activar/desactivar una franja afecta TODAS las clases y TODOS los días con
// esa hora de inicio. Es permanente (recurrente) y reversible, y NO toca las
// reservas ya hechas: solo controla qué franjas se ofrecen para nuevas reservas.
const DisponibilidadHorarios = () => {
  const [franjas, setFranjas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingHora, setSavingHora] = useState(null); // hora_inicio que se está guardando

  const fetchFranjas = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/horarios/slots`);
      setFranjas(res.data);
    } catch (err) {
      console.error('Error cargando franjas horarias:', err);
      if (!silent) toast.error('Error al cargar las franjas horarias');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFranjas(); }, [fetchFranjas]);

  const refreshSilent = useCallback(() => fetchFranjas(true), [fetchFranjas]);
  useAutoRefresh(refreshSilent, { interval: 30000 });

  const toggleFranja = async (franja) => {
    const habilitarAhora = franja.estado === 'inactiva'; // si está inactiva, la acción es habilitar
    const nuevoActivo = habilitarAhora ? 1 : 0;

    if (!habilitarAhora) {
      const ok = window.confirm(
        `¿Deshabilitar todas las clases de las ${franja.hora_inicio}?\n\n` +
        `Dejarán de aparecer para nuevas reservas en todas las clases y días. ` +
        `Las reservas ya hechas se mantienen. Podrás volver a habilitarlas cuando quieras.`
      );
      if (!ok) return;
    }

    setSavingHora(franja.hora_inicio);
    try {
      const res = await axios.put(`${API_BASE}/horarios/slots/activo`, {
        hora_inicio: franja.hora_inicio,
        activo: nuevoActivo
      });
      toast.success(res.data?.message || 'Franja actualizada');
      fetchFranjas(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar la franja');
    } finally {
      setSavingHora(null);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        marginBottom: '2rem', backgroundColor: '#fff', padding: '1.5rem',
        borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ fontWeight: '800', color: '#2d5016', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={22} /> Disponibilidad de Horarios
        </h2>
        <p style={{ color: '#666', marginTop: '4px', marginBottom: 0 }}>
          Activa o desactiva una franja horaria de forma permanente. Al desactivarla,
          deja de ofrecerse para nuevas reservas en todas las clases y días. Las reservas
          ya hechas se mantienen y puedes reactivarla en cualquier momento.
        </p>
      </div>

      {/* Lista de franjas */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Cargando…</div>
        ) : franjas.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            <AlertTriangle size={32} style={{ color: '#cbd5e0', marginBottom: '0.5rem' }} />
            <div>No hay franjas horarias configuradas.</div>
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem', padding: '1.25rem'
          }}>
            {franjas.map(f => {
              const activa = f.estado === 'activa';
              const saving = savingHora === f.hora_inicio;
              return (
                <div key={f.hora_inicio} style={{
                  border: `2px solid ${activa ? '#d1fae5' : '#fee2e2'}`,
                  backgroundColor: activa ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '10px', padding: '1rem',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={18} style={{ color: '#718096' }} /> {f.hora_inicio}
                    </span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700,
                      backgroundColor: activa ? '#dcfce7' : '#fee2e2',
                      color: activa ? '#166534' : '#991b1b'
                    }}>
                      {activa ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {activa ? 'Activa' : 'Deshabilitada'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#4a5568', textTransform: 'capitalize', minHeight: '2.4em' }}>
                    {f.clases}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#718096' }}>
                    {f.activos} de {f.total} clase(s) activas en esta franja
                  </div>

                  <button
                    onClick={() => toggleFranja(f)}
                    disabled={saving}
                    style={{
                      marginTop: 'auto', padding: '0.65rem 1rem', borderRadius: '8px', border: 'none',
                      cursor: saving ? 'wait' : 'pointer', fontWeight: 700, color: 'white',
                      backgroundColor: activa ? '#e03131' : '#2d5016',
                      opacity: saving ? 0.7 : 1
                    }}
                  >
                    {saving ? 'Guardando…' : activa ? 'Deshabilitar franja' : 'Habilitar franja'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DisponibilidadHorarios;
