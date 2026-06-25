import React, { useState, useEffect, useCallback } from 'react';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import axios from 'axios';
import { Clock, AlertTriangle, CheckCircle, XCircle, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import '../../CSS/DisponibilidadHorarios.css';

const API_BASE = 'https://elrefugiocountryclub.com/api/api';

// Componente para gestionar la disponibilidad de las franjas horarias.
// Activar/desactivar una franja afecta TODAS las clases y TODOS los días con
// esa hora de inicio. Es permanente (recurrente) y reversible, y NO toca las
// reservas ya hechas: solo controla qué franjas se ofrecen para nuevas reservas.
const DisponibilidadHorarios = () => {
  const [franjas, setFranjas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingHora, setSavingHora] = useState(null); // hora_inicio que se está guardando

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todas'); // todas | activas | inactivas

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

  // ====== Filtros ======
  const franjasFiltradas = franjas.filter(f => {
    const activa = f.estado === 'activa';
    if (estadoFilter === 'activas' && !activa) return false;
    if (estadoFilter === 'inactivas' && activa) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const hora = String(f.hora_inicio || '').toLowerCase();
      const clases = String(f.clases || '').toLowerCase();
      if (!hora.includes(term) && !clases.includes(term)) return false;
    }
    return true;
  });

  const estadoLabel = estadoFilter === 'todas' ? 'Todas'
    : estadoFilter === 'activas' ? 'Activas' : 'Deshabilitadas';

  return (
    <div className="">
      {/* Header */}
      <div className="dh-header">
        <h2 className="dh-title">
          <Clock size={22} /> Disponibilidad de Horarios
        </h2>
        <p className="dh-desc">
          Activa o desactiva una franja horaria de forma permanente. Al desactivarla,
          deja de ofrecerse para nuevas reservas en todas las clases y días. Las reservas
          ya hechas se mantienen y puedes reactivarla en cualquier momento.
        </p>
      </div>

      {/* Lista de franjas */}
      <div className="dh-lista">
        {/* Filtros integrados en la card */}
        <div className="dh-filtros">
          <div className="dh-search-wrap">
            <Search size={14} className="dh-search-icon" />
            <input
              type="text"
              placeholder="Buscar por hora o clase..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="dh-search-input"
            />
          </div>
          <select
            value={estadoFilter}
            onChange={e => setEstadoFilter(e.target.value)}
            className="dh-filter-select"
          >
            <option value="todas">Todas</option>
            <option value="activas">Activas</option>
            <option value="inactivas">Deshabilitadas</option>
          </select>
        </div>

        {/* Resumen de filtros */}
        <p className="dh-summary">
          Mostrando <strong>{franjasFiltradas.length} franja{franjasFiltradas.length !== 1 ? 's' : ''}</strong>
          {' · '}{estadoLabel}
          {!searchTerm && estadoFilter === 'todas' && (
            <span className="dh-summary-hint"> · Usa los filtros para ajustar la búsqueda</span>
          )}
        </p>

        {loading ? (
          <div className="dh-empty">
            <div>Cargando…</div>
          </div>
        ) : franjasFiltradas.length === 0 ? (
          <div className="dh-empty">
            <AlertTriangle size={40} opacity={0.2} className="dh-empty-icon" />
            <div>{franjas.length === 0 ? 'No hay franjas horarias configuradas.' : 'No hay franjas con los filtros aplicados.'}</div>
          </div>
        ) : (
          <div className="dh-grid">
            {franjasFiltradas.map(f => {
              const activa = f.estado === 'activa';
              const saving = savingHora === f.hora_inicio;
              return (
                <div key={f.hora_inicio} className={`dh-card${activa ? ' is-active' : ''}`}>
                  <div className="dh-card-head">
                    <span className="dh-hora">
                      <Clock size={18} className="dh-hora-icon" /> {f.hora_inicio}
                    </span>
                    <span className={`dh-badge${activa ? ' is-active' : ''}`}>
                      {activa ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {activa ? 'Activa' : 'Deshabilitada'}
                    </span>
                  </div>

                  <div className="dh-clases">
                    {f.clases}
                  </div>
                  <div className="dh-conteo">
                    {f.activos} de {f.total} clase(s) activas en esta franja
                  </div>

                  <button
                    onClick={() => toggleFranja(f)}
                    disabled={saving}
                    className={`dh-btn${activa ? ' is-active' : ''}`}
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
