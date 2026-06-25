import React, { useState, useEffect } from 'react';
import {
  BarChart2, Users, Clock, AlertTriangle,
  Filter, Award, TrendingUp, CheckCircle,
  Star, Activity, BookOpen, XCircle
} from 'lucide-react';
import '../../CSS/MetricasResumen.css';

const C = {
  green:      '#4a7a2d',
  greenLight: '#f0f4ef',
  greenMid:   '#2d5016',
  brown:      '#8b5a2b',
  brownLight: '#fdf5ec',
  gold:       '#d4a574',
  red:        '#d32f2f',
  redLight:   '#fff2f2',
  bg:         '#f5f5f0',
  white:      '#ffffff',
  border:     '#e8e8e0',
  textMain:   '#1a1a1a',
  textSub:    '#6b6b6b',
  textHint:   '#aaaaaa',
};

const RANGOS = [
  { id: 'este_mes',        label: 'Este mes' },
  { id: 'ultimo_mes',      label: 'Mes anterior' },
  { id: 'ultimos_3_meses', label: 'Ultimos 3 meses' },
  { id: 'todo_historial',  label: 'Historial completo' },
];

const NIVEL_COLORS = ['#4a7a2d', '#8b5a2b', '#d4a574', '#1a5276', '#6c3483'];
const INST_COLORS  = ['#2e7d32', '#c0392b', '#1565c0', '#7b3f00', '#4a148c'];

const KpiCard = ({ icon: Icon, label, value, sub, accent, light }) => (
  <div className="metricas-kpi-card" style={{ '--kpi-accent': accent || C.green, '--kpi-light': light || C.greenLight }}>
    <div className="metricas-kpi-head">
      <div className="metricas-kpi-icon">
        <Icon size={18} color={accent || C.green} />
      </div>
      <span className="metricas-kpi-label">{label}</span>
    </div>
    <div className="metricas-kpi-value">{value}</div>
    {sub && <div className="metricas-kpi-sub">{sub}</div>}
  </div>
);

const SectionCard = ({ title, badge, badgeColor = '#4a7a2d', icon: Icon, children }) => (
  <div className="metricas-section-card">
    <div className="metricas-section-head">
      <div className="metricas-section-titlewrap">
        {Icon && <Icon size={20} color={badgeColor} />}
        <h3 className="metricas-section-title">{title}</h3>
      </div>
      {badge && (
        <span className="metricas-section-badge" style={{ '--badge-bg': `${badgeColor}22`, '--badge-color': badgeColor }}>{badge}</span>
      )}
    </div>
    {children}
  </div>
);

const Avatar = ({ name, bg = '#f0f4ef', fg = '#4a7a2d', size = 38 }) => (
  <div className="metricas-avatar" style={{ '--av-size': `${size}px`, '--av-font': `${size * 0.42}px`, '--av-bg': bg, '--av-fg': fg }}>
    {(name || '?')[0].toUpperCase()}
  </div>
);

const MetricasResumen = () => {
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState(null);
  const [error,    setError]    = useState(null);
  const [rango,    setRango]    = useState('este_mes');
  const [fechas,   setFechas]   = useState({ inicio: '', fin: '' });

  useEffect(() => { calcularRango(rango); }, [rango]);
  useEffect(() => { if (fechas.inicio && fechas.fin) fetchMetricas(); }, [fechas]);

  const calcularRango = (tipo) => {
    const hoy = new Date();
    let inicio, fin;
    switch (tipo) {
      case 'este_mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fin    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        break;
      case 'ultimo_mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        fin    = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        break;
      case 'ultimos_3_meses':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1);
        fin    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        break;
      case 'todo_historial':
        inicio = new Date(2024, 0, 1);
        fin    = hoy;
        break;
      default: return;
    }
    setFechas({ inicio: inicio.toISOString().split('T')[0], fin: fin.toISOString().split('T')[0] });
  };

  const fetchMetricas = async () => {
    try {
      setLoading(true);
      const url = `https://elrefugiocountryclub.com/api/api/reservas-admin/analytics/detailed?fecha_inicio=${fechas.inicio}&fecha_fin=${fechas.fin}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error('Error al obtener metricas');
      setMetricas(await r.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setFechas(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setRango('personalizado');
  };

  const totalClasesRealizadas = metricas?.metricas_por_clase?.reduce((acc, c) => acc + (Number(c.total) || 0), 0) ?? 0;
  const totalFaltas           = metricas?.metricas_por_clase?.reduce((acc, c) => acc + (Number(c.cancelaciones) || 0), 0) ?? 0;
  const totalTodo             = totalClasesRealizadas + totalFaltas;
  const tasaGlobalRaw         = totalTodo > 0 ? (totalClasesRealizadas / totalTodo) * 100 : 0;
  const tasaGlobal            = tasaGlobalRaw % 1 === 0 ? tasaGlobalRaw.toFixed(0) : tasaGlobalRaw.toFixed(1);

  if (loading && !metricas) return (
    <div className="metricas-loading">
      <div className="metricas-dots">
        {[0, 1, 2].map(i => <div key={i} className="metricas-dot" />)}
      </div>
      <p className="metricas-loading-text">Cargando metricas del club...</p>
    </div>
  );

  if (error) return (
    <div className="metricas-error">
      <XCircle size={40} />
      <p>{error}</p>
    </div>
  );

  return (
    <div className="">

      {/* Overlay de carga al cambiar filtros */}
      {loading && metricas && (
        <div className="metricas-overlay">
          <div className="metricas-overlay-box">
            <div className="metricas-dots">
              {[0, 1, 2].map(i => <div key={i} className="metricas-dot" />)}
            </div>
            <div className="metricas-overlay-title">Actualizando datos...</div>
            <div className="metricas-overlay-sub">Calculando metricas del periodo</div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="metricas-filter-bar">
        <div className="metricas-filter-brand">
          <div className="metricas-filter-brand-icon">
            <Activity size={22} color={C.green} />
          </div>
          <div>
            <div className="metricas-filter-title">Metricas del Club</div>
            <div className="metricas-filter-period">
              {fechas.inicio && fechas.fin ? `${fechas.inicio} al ${fechas.fin}` : 'Selecciona un periodo'}
            </div>
          </div>
        </div>

        <div className="metricas-range-group">
          {RANGOS.map(r => (
            <button key={r.id} onClick={() => setRango(r.id)} className={`metricas-range-btn${rango === r.id ? ' is-active' : ''}`}>{r.label}</button>
          ))}
        </div>

        <div className="metricas-date-group">
          <Filter size={14} color={C.textHint} />
          <input type="date" name="inicio" value={fechas.inicio} onChange={handleDateChange} className="metricas-date-input" />
          <span className="metricas-date-sep">a</span>
          <input type="date" name="fin"    value={fechas.fin}   onChange={handleDateChange} className="metricas-date-input" />
        </div>
      </div>

      {metricas && (
        <div className="metricas-content">

          {/* KPIs */}
          <div className="metricas-kpi-grid">
            <KpiCard icon={CheckCircle}   label="Clases Realizadas"    value={totalClasesRealizadas} sub="Completadas en el periodo"      accent={C.green}   light={C.greenLight} />
            <KpiCard icon={AlertTriangle} label="Inasistencias"        value={totalFaltas}           sub="Faltas totales sin aviso"        accent={C.red}     light={C.redLight} />
            <KpiCard icon={TrendingUp}    label="Tasa de Asistencia"   value={`${tasaGlobal}%`}      sub="Del total de clases agendadas"  accent={C.brown}   light={C.brownLight} />
            <KpiCard icon={Clock}         label="Horario mas Demandado" value={metricas.horario_estrella?.hora_inicio?.substring(0,5) ?? '--:--'} sub={`${metricas.horario_estrella?.total ?? 0} reservas acumuladas`} accent="#1565c0" light="#e3f2fd" />
          </div>

          {/* Tabla por nivel */}
          <SectionCard title="Rendimiento por Nivel de Clase" badge={`${metricas.metricas_por_clase?.length} niveles`} icon={BookOpen}>
            <div className="metricas-nivel-wrapper">
              <table className="metricas-nivel-table">
                <thead>
                  <tr className="metricas-nivel-thead-row">
                    {['Nivel', 'Alumna Estrella', 'Mas Inasistencias', 'Horario mas Demandado', 'Clases Realizadas'].map((h, i) => (
                      <th key={i} className={`metricas-nivel-th${i === 4 ? ' is-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metricas.metricas_por_clase?.map((clase, idx) => {
                    const total  = Number(clase.total)        || 0;
                    const faltas = Number(clase.cancelaciones) || 0;
                    const suma   = total + faltas;
                    const tasa   = suma > 0 ? Math.round((total / suma) * 100) : 0;
                    const barColor = tasa >= 80 ? C.green : tasa >= 50 ? C.gold : C.red;

                    return (
                      <tr key={idx} className="nivel-row">
                        <td className="metricas-nivel-td-nivel" style={{ '--nivel-color': NIVEL_COLORS[idx % NIVEL_COLORS.length] }}>
                          <span className="metricas-nivel-name">{clase.nombre}</span>
                        </td>
                        <td className="metricas-nivel-td">
                          {clase.mejor_cliente
                            ? <div className="metricas-star-row">
                                <Avatar name={clase.mejor_cliente.nombre} />
                                <div>
                                  <div className="metricas-star-name">{clase.mejor_cliente.nombre}</div>
                                  <div className="metricas-star-sub">{clase.mejor_cliente.total} clases</div>
                                </div>
                              </div>
                            : <span className="metricas-muted">-</span>}
                        </td>
                        <td className="metricas-nivel-td">
                          {clase.peores_clientes?.length > 0
                            ? <div className="metricas-worst-list">
                                {clase.peores_clientes.map((pc, pi) => (
                                  <div key={pi} className="metricas-worst-row">
                                    <Avatar name={pc.nombre} bg={C.redLight} fg={C.red} size={32} />
                                    <div>
                                      <div className="metricas-worst-name">{pc.nombre}</div>
                                      <div className="metricas-worst-sub">{pc.total} {Number(pc.total) === 1 ? 'inasistencia' : 'inasistencias'}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            : <span className="metricas-muted">Sin registros</span>}
                        </td>
                        <td className="metricas-nivel-td">
                          <div className="metricas-horario-cell">
                            <span className="metricas-horario-chip">
                              {clase.horario_top?.hora_inicio?.substring(0,5) ?? '--:--'}
                            </span>
                            <span className="metricas-horario-sub">{clase.horario_top?.total ?? 0} reservas</span>
                          </div>
                        </td>
                        <td className="metricas-nivel-td-total">
                          <div className="metricas-total-wrap">
                            <span className="metricas-total-value">{total}</span>
                            <div className="metricas-total-sub">Asistencia {tasa}%</div>
                            <div className="metricas-bar-track">
                              <div className="metricas-bar-fill" style={{ '--bar-w': `${tasa}%`, '--bar-color': barColor }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Ranking de jinetes + Desempenyo instructoras */}
          <div className="metricas-ranking-grid">

            {/* Top 5 Jinetes */}
            <SectionCard title="Alumnas más Constantes" badge="Top 5 del periodo" badgeColor={C.green} icon={Star}>
              <div className="metricas-fieles-list">
                {metricas.clientes_fieles?.map((c, i) => (
                  <div key={i} className={`metricas-fiel-row${i === 0 ? ' is-first' : ''}`}>
                    <div className="metricas-fiel-rank">{i + 1}</div>
                    <div className="metricas-fiel-name">{c.nombre} {c.apellido}</div>
                    <div className="metricas-fiel-badge">{c.total} clases</div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Instructoras */}
            <SectionCard title="Desempeno de Instructoras" badge="Productividad" badgeColor={C.brown} icon={Users}>
              <div className="metricas-inst-list">
                {metricas.metricas_instructores?.map((inst, idx) => {
                  const maxClases = metricas.metricas_instructores[0]?.total_clases || 1;
                  const pct       = Math.round((inst.total_clases / maxClases) * 100);
                  const color     = INST_COLORS[idx % INST_COLORS.length];
                  const esActivo  = inst.disponibilidad === 'disponible';
                  const esDescanso = inst.disponibilidad === 'descanso';
                  const chipColor  = esActivo ? color : esDescanso ? '#f57f17' : '#9e9e9e';
                  const avatarBg   = esActivo ? `${color}22` : '#eeeeee';
                  const avatarFg   = esActivo ? color : '#9e9e9e';

                  return (
                    <div key={idx} className="metricas-inst-card" style={{
                      '--chip-color': chipColor,
                      '--chip-bg': `${chipColor}18`,
                      '--chip-border': `${chipColor}44`,
                      '--inst-bg': esActivo ? '#fafaf8' : esDescanso ? '#fffde7' : '#f0f0f0',
                      '--inst-name-color': esActivo ? C.textMain : '#9e9e9e',
                    }}>
                      <div className="metricas-inst-head">
                        <div className="metricas-inst-headleft">
                          <Avatar name={inst.nombre} bg={avatarBg} fg={avatarFg} size={34} />
                          <div>
                            <div className="metricas-inst-namerow">
                              <span className={`metricas-inst-name${(!esActivo && !esDescanso) ? ' is-inactive' : ''}`}>{inst.nombre}</span>
                              {!esActivo && (
                                <span className="metricas-inst-status" style={{
                                  '--status-bg': esDescanso ? '#fff8e1' : '#eeeeee',
                                  '--status-color': esDescanso ? '#e65100' : '#757575',
                                  '--status-border': esDescanso ? '#ffcc02' : '#bdbdbd',
                                }}>
                                  {esDescanso ? '⏸ En descanso' : '✕ Inactivo'}
                                </span>
                              )}
                            </div>
                            <div className="metricas-inst-niveles">
                              {inst.niveles?.map((niv, ni) => (
                                <span key={ni} className="metricas-inst-nivel-chip">{niv.nombre} <span className="metricas-inst-nivel-count">({niv.total})</span></span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="metricas-inst-headright">
                          <div className="metricas-inst-total">{inst.total_clases}</div>
                          <div className="metricas-inst-total-label">clases dadas</div>
                        </div>
                      </div>
                      <div className="metricas-inst-barrow">
                        <div className="metricas-inst-bar-track">
                          <div className="metricas-inst-bar-fill" style={{ '--bar-w': `${pct}%` }} />
                        </div>
                        <span className="metricas-inst-bar-label">{pct}% vs. líder</span>
                      </div>
                      {inst.mejor_alumna && (
                        <div className="metricas-inst-alumna">
                          Alumna frecuente: <strong>{inst.mejor_alumna.nombre} {inst.mejor_alumna.apellido}</strong> ({inst.mejor_alumna.total} clases)
                        </div>
                      )}
                    </div>
                  );
                })}
                {!metricas.metricas_instructores?.length && (
                  <div className="metricas-inst-empty">Sin datos en este periodo.</div>
                )}
              </div>
            </SectionCard>

          </div>
        </div>
      )}
    </div>
  );
};

export default MetricasResumen;
