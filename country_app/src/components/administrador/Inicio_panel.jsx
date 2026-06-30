import { useState, useEffect, useRef } from "react"
import "../../CSS/Contabilidad.css"
import {
    Users, Clock, AlertTriangle, ArrowRight, TrendingUp, TrendingDown,
    LayoutGrid, CalendarDays, GraduationCap, CalendarCheck, BarChart3
} from "lucide-react"
import caballoIcon from "../../img/caballo-icon.png"

const METRICS_URL = "https://elrefugiocountryclub.com/api/api/metricas/inicio"

/* =============================================================
   MINI-GRÁFICAS INTERACTIVAS DEL PANEL DE INICIO
   SVG / CSS ligero, sin librerías externas. Tooltips al pasar el
   cursor + animación de entrada. Los datos provienen del backend.
   ============================================================= */

// Tooltip flotante reutilizable (posicionado dentro del contenedor de la gráfica)
const ChartTooltip = ({ tip }) => (
  <div className="chart-tip" style={{ left: tip.x, top: tip.y }}>
    <span className="chart-tip-label">{tip.label}</span>
    <span className="chart-tip-value">{tip.value}</span>
  </div>
)

// Donut de distribución (estados de clientes)
const MiniDonut = ({ segments, centerValue, centerLabel }) => {
    const total = segments.reduce((s, d) => s + d.value, 0) || 1
    const radius = 44
    const stroke = 16
    const circ = 2 * Math.PI * radius
    const ref = useRef(null)
    const [tip, setTip] = useState(null)
    const show = (e, s) => {
        const rect = ref.current.getBoundingClientRect()
        setTip({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            label: s.label,
            value: `${s.value} (${Math.round((s.value / total) * 100)}%)`,
        })
    }
    let offset = 0
    return (
        <div className="mini-donut-wrap" ref={ref} onMouseLeave={() => setTip(null)}>
            <svg viewBox="0 0 120 120" className="mini-chart-donut" role="img">
                <g transform="rotate(-90 60 60)">
                    <circle cx="60" cy="60" r={radius} fill="none" stroke="#efe7dc" strokeWidth={stroke} />
                    {segments.map((s, i) => {
                        const len = (s.value / total) * circ
                        const el = (
                            <circle
                                key={i}
                                className="donut-seg"
                                cx="60" cy="60" r={radius}
                                fill="none" stroke={s.color} strokeWidth={stroke}
                                strokeDasharray={`${len} ${circ - len}`}
                                strokeDashoffset={-offset}
                                onMouseEnter={(e) => show(e, s)}
                                onMouseMove={(e) => show(e, s)}
                            />
                        )
                        offset += len
                        return el
                    })}
                </g>
                <text x="60" y="57" textAnchor="middle" className="mini-donut-num">{centerValue ?? total}</text>
                <text x="60" y="75" textAnchor="middle" className="mini-donut-cap">{centerLabel ?? 'total'}</text>
            </svg>
            {tip && <ChartTooltip tip={tip} />}
        </div>
    )
}

// Anillo de ocupación / gauge (disponibilidad de caballos)
const MiniGauge = ({ value, color, disponibles, total }) => {
    const radius = 44
    const stroke = 16
    const circ = 2 * Math.PI * radius
    const len = (Math.min(Math.max(value, 0), 100) / 100) * circ
    const ref = useRef(null)
    const [tip, setTip] = useState(null)
    const show = (e) => {
        const rect = ref.current.getBoundingClientRect()
        setTip({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            label: 'Disponibles',
            value: `${disponibles} de ${total}`,
        })
    }
    return (
        <div className="mini-donut-wrap" ref={ref} onMouseLeave={() => setTip(null)}>
            <svg viewBox="0 0 120 120" className="mini-chart-donut" role="img">
                <g transform="rotate(-90 60 60)">
                    <circle cx="60" cy="60" r={radius} fill="none" stroke="#efe7dc" strokeWidth={stroke} />
                    <circle
                        className="donut-seg"
                        cx="60" cy="60" r={radius}
                        fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
                        strokeDasharray={`${len} ${circ - len}`}
                        onMouseEnter={show}
                        onMouseMove={show}
                    />
                </g>
                <text x="60" y="57" textAnchor="middle" className="mini-donut-num">{value}%</text>
                <text x="60" y="75" textAnchor="middle" className="mini-donut-cap">disp.</text>
            </svg>
            {tip && <ChartTooltip tip={tip} />}
        </div>
    )
}

// Barras verticales (reservas por día, clases por instructora)
const MiniBars = ({ data, color }) => {
    const max = Math.max(...data.map(d => d.value), 1)
    const ref = useRef(null)
    const [tip, setTip] = useState(null)
    const show = (e, d) => {
        const rect = ref.current.getBoundingClientRect()
        setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: d.label, value: d.value })
    }
    return (
        <div className="mini-bars" ref={ref} onMouseLeave={() => setTip(null)}>
            {data.map((d, i) => (
                <div
                    className="mini-bar-col"
                    key={i}
                    onMouseEnter={(e) => show(e, d)}
                    onMouseMove={(e) => show(e, d)}
                >
                    <div className="mini-bar-track">
                        <div
                            className="mini-bar-fill"
                            style={{ height: `${Math.max((d.value / max) * 100, 4)}%`, background: color, animationDelay: `${i * 55}ms` }}
                        />
                    </div>
                    <span className="mini-bar-label">{d.label}</span>
                </div>
            ))}
            {tip && <ChartTooltip tip={tip} />}
        </div>
    )
}

// Barras horizontales tipo ranking (caballos más usados)
const MiniHBars = ({ data, color }) => {
    const max = Math.max(...data.map(d => d.value), 1)
    const ref = useRef(null)
    const [tip, setTip] = useState(null)
    const show = (e, d) => {
        const rect = ref.current.getBoundingClientRect()
        setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: d.label, value: d.value })
    }
    return (
        <div className="mini-hbars" ref={ref} onMouseLeave={() => setTip(null)}>
            {data.map((d, i) => (
                <div
                    className="mini-hbar-row"
                    key={i}
                    onMouseEnter={(e) => show(e, d)}
                    onMouseMove={(e) => show(e, d)}
                >
                    <span className="mini-hbar-label">{d.label}</span>
                    <div className="mini-hbar-track">
                        <div
                            className="mini-hbar-fill"
                            style={{ width: `${(d.value / max) * 100}%`, background: color, animationDelay: `${i * 55}ms` }}
                        />
                    </div>
                    <span className="mini-hbar-val">{d.value}</span>
                </div>
            ))}
            {tip && <ChartTooltip tip={tip} />}
        </div>
    )
}

// Área de tendencia (evolución de reservas)
const MiniArea = ({ data, color }) => {
    const w = 200, h = 70, pad = 8
    const values = data.map(d => d.value)
    const max = Math.max(...values, 1)
    const min = Math.min(...values, 0)
    const ref = useRef(null)
    const [tip, setTip] = useState(null)
    const pts = data.map((d, i) => {
        const x = pad + (i * (w - 2 * pad)) / (data.length - 1 || 1)
        const y = h - pad - ((d.value - min) / (max - min || 1)) * (h - 2 * pad)
        return { x, y, d }
    })
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${h} L${pts[0].x.toFixed(1)},${h} Z`
    const gid = `miniArea-${color.replace('#', '')}`
    const show = (e, p) => {
        const rect = ref.current.getBoundingClientRect()
        setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: p.d.label, value: p.d.value })
    }
    return (
        <div className="mini-area-wrap" ref={ref} onMouseLeave={() => setTip(null)}>
            <svg viewBox={`0 0 ${w} ${h}`} className="mini-chart-area" preserveAspectRatio="none" role="img">
                <defs>
                    <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={area} fill={`url(#${gid})`} className="area-fill" />
                <path
                    d={line}
                    className="area-line"
                    fill="none"
                    stroke={color}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength="1"
                    vectorEffect="non-scaling-stroke"
                />
                {pts.map((p, i) => (
                    <circle
                        key={i}
                        className="area-pt"
                        cx={p.x} cy={p.y} r="6"
                        fill="transparent"
                        onMouseEnter={(e) => show(e, p)}
                        onMouseMove={(e) => show(e, p)}
                    />
                ))}
                {pts.map((p, i) => (
                    <circle key={`d${i}`} cx={p.x} cy={p.y} r="2.6" fill={color} className="area-dot" />
                ))}
            </svg>
            {tip && <ChartTooltip tip={tip} />}
        </div>
    )
}

// Estado vacío / cargando para una gráfica
const ChartEmpty = ({ loading }) => (
    <div className="chart-empty">{loading ? 'Cargando…' : 'Sin datos'}</div>
)

const firstName = (full) => (full || '').trim().split(/\s+/)[0] || full

/* =============================================================
   PANEL DE INICIO
   Bienvenida + KPIs + alertas de pago + resumen por área.
   ============================================================= */
const InicioPanel = ({
    headerRef,
    currentUser,
    totalUsers = 0,
    availableHorses = 0,
    totalHorses = 0,
    clientsGrowthPct = 0,
    activeUsers = 0,
    blockedUsers = 0,
    pendingUsers = 0,
    overdueCount = 0,
    soonCount = 0,
    setActiveTab = () => {},
    setShowOverdueFilter = () => {},
}) => {
    // Métricas reales para las gráficas del "Resumen por área"
    const [metrics, setMetrics] = useState(null)
    const [loadingMetrics, setLoadingMetrics] = useState(true)

    useEffect(() => {
        let alive = true
        fetch(METRICS_URL)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (alive && d) setMetrics(d) })
            .catch(() => {})
            .finally(() => { if (alive) setLoadingMetrics(false) })
        return () => { alive = false }
    }, [])

    // --- Datos derivados de las métricas reales ---
    const reservasData = (metrics?.reservas_semana || []).map(r => ({ label: r.dia, value: r.total }))
    const instructorasData = (metrics?.instructoras || []).map(i => ({ label: firstName(i.nombre), value: i.total }))
    const tendenciaData = (metrics?.tendencia || []).map(t => ({ label: t.mes, value: t.total }))
    const rankingData = (metrics?.caballos_ranking || []).map(c => ({ label: c.nombre, value: c.salidas }))
    const disp = metrics?.disponibilidad || { disponibles: 0, total: 0 }
    const dispPct = disp.total > 0 ? Math.round((disp.disponibles / disp.total) * 100) : 0

    const hasValues = (arr) => arr.some(d => d.value > 0)

    // Tarjetas del "Resumen por área" (todas con datos reales)
    const insights = [
        {
            key: 'clientes', label: 'Clientes', icon: Users,
            caption: `${activeUsers} activos · ${blockedUsers} bloqueados · ${pendingUsers} pendientes`,
            chart: (
                <div className="mini-chart-with-legend">
                    <MiniDonut
                        centerValue={totalUsers}
                        centerLabel="clientes"
                        segments={[
                            { label: 'Activos', value: activeUsers, color: '#9caf88' },
                            { label: 'Bloqueados', value: blockedUsers, color: '#c17b4a' },
                            { label: 'Pendientes', value: pendingUsers, color: '#e0a458' },
                        ]}
                    />
                    <ul className="mini-legend">
                        <li><span className="mini-dot" style={{ background: '#9caf88' }} />Activos</li>
                        <li><span className="mini-dot" style={{ background: '#c17b4a' }} />Bloqueados</li>
                        <li><span className="mini-dot" style={{ background: '#e0a458' }} />Pendientes</li>
                    </ul>
                </div>
            ),
        },
        {
            key: 'reservas', label: 'Reservas', icon: CalendarDays,
            caption: 'Reservas de los últimos 7 días',
            chart: hasValues(reservasData)
                ? <MiniBars color="#6b4423" data={reservasData} />
                : <ChartEmpty loading={loadingMetrics} />,
        },
        {
            key: 'instructoras', label: 'Instructoras', icon: GraduationCap,
            caption: 'Clases impartidas este mes',
            chart: instructorasData.length && hasValues(instructorasData)
                ? <MiniBars color="#c17b4a" data={instructorasData} />
                : <ChartEmpty loading={loadingMetrics} />,
        },
        {
            key: 'disponibilidad', label: 'Disponibilidad', icon: CalendarCheck,
            caption: 'Disponibilidad de caballos',
            chart: disp.total > 0
                ? (
                    <div className="mini-chart-with-legend">
                        <MiniGauge value={dispPct} color="#9caf88" disponibles={disp.disponibles} total={disp.total} />
                        <ul className="mini-legend">
                            <li><span className="mini-dot" style={{ background: '#9caf88' }} />Disponibles: {disp.disponibles}</li>
                            <li><span className="mini-dot" style={{ background: '#efe7dc' }} />Ocupados: {disp.total - disp.disponibles}</li>
                        </ul>
                    </div>
                )
                : <ChartEmpty loading={loadingMetrics} />,
        },
        {
            key: 'metricas', label: 'Métricas', icon: BarChart3,
            caption: 'Tendencia de reservas (6 meses)',
            chart: hasValues(tendenciaData)
                ? <MiniArea color="#6b4423" data={tendenciaData} />
                : <ChartEmpty loading={loadingMetrics} />,
        },
        {
            key: 'metricascab', label: 'Métricas Caballos', icon: BarChart3,
            caption: 'Caballos más utilizados',
            chart: rankingData.length && hasValues(rankingData)
                ? <MiniHBars color="#9caf88" data={rankingData} />
                : <ChartEmpty loading={loadingMetrics} />,
        },
    ]

    return (
        <div className="tab-content tab-content-visible">
            {/* Bienvenida */}
            <div ref={headerRef} className="home-welcome">
                <div className="home-welcome-text">
                    <h2 className="home-welcome-title">
                        ¡Hola, {currentUser?.nombre || 'Admin'}!
                    </h2>
                    <p className="home-welcome-sub">Este es el resumen general de tu club.</p>
                </div>
            </div>

            {/* KPIs principales (datos reales) */}
            <div className="home-top-row">
                {[
                    {
                        key: 'clientes', accent: 'total', icon: Users,
                        value: totalUsers, label: 'Clientes totales',
                        badge: `${clientsGrowthPct >= 0 ? '+' : ''}${clientsGrowthPct}%`,
                        badgeSub: 'vs. mes anterior',
                        trendDir: clientsGrowthPct < 0 ? 'down' : 'up',
                        onClick: () => setActiveTab('clientes'),
                    },
                    {
                        key: 'caballos', accent: 'horses', iconImg: caballoIcon,
                        value: availableHorses, label: 'Caballos disponibles',
                        badge: `${totalHorses > 0 ? Math.round((availableHorses / totalHorses) * 100) : 0}%`,
                        badgeSub: `de ${totalHorses} totales`,
                        trendDir: 'neutral',
                        onClick: () => setActiveTab('caballos'),
                    },
                    {
                        key: 'vencidos', accent: 'overdue', icon: AlertTriangle,
                        value: overdueCount, label: 'Pagos vencidos',
                        badge: `${totalUsers > 0 ? Math.round((overdueCount / totalUsers) * 100) : 0}%`,
                        badgeSub: 'de clientes',
                        trendDir: 'neutral',
                        onClick: () => { setActiveTab('clientes'); setShowOverdueFilter(true); },
                    },
                    {
                        key: 'proximos', accent: 'soon', icon: Clock,
                        value: soonCount, label: 'Próximos a vencer',
                        badge: `${totalUsers > 0 ? Math.round((soonCount / totalUsers) * 100) : 0}%`,
                        badgeSub: 'de clientes',
                        trendDir: 'neutral',
                        onClick: () => setActiveTab('clientes'),
                    },
                ].map(k => {
                    const KIcon = k.icon
                    return (
                        <button
                            key={k.key}
                            className={`kpi-card kpi-card-${k.accent}`}
                            onClick={k.onClick}
                            type="button"
                        >
                            <div className="kpi-icon">
                                {k.iconImg
                                    ? <img src={k.iconImg} alt="" className="kpi-icon-img" />
                                    : <KIcon size={22} />}
                            </div>
                            <div className="kpi-body">
                                <span className="kpi-number">{k.value}</span>
                                <span className="kpi-label">{k.label}</span>
                                <span className="kpi-desc">{k.desc}</span>
                            </div>
                            <div className="kpi-trend">
                                <span className="kpi-trend-badge">
                                    {k.trendDir === 'up' && <TrendingUp size={13} />}
                                    {k.trendDir === 'down' && <TrendingDown size={13} />}
                                    {k.badge}
                                </span>
                                <span className="kpi-trend-sub">{k.badgeSub}</span>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Resumen por área (gráficas con datos reales) */}
            <h3 className="home-section-title"><LayoutGrid size={16} /> Resumen por área</h3>
            <div className="home-insights-grid">
                {insights.map(item => {
                    const ItemIcon = item.icon
                    return (
                        <button
                            key={item.key}
                            className="home-insight-card"
                            onClick={() => setActiveTab(item.key)}
                            type="button"
                        >
                            <div className="home-insight-head">
                                <span className="home-insight-icon"><ItemIcon size={18} /></span>
                                <span className="home-insight-title">{item.label}</span>
                                <ArrowRight size={16} className="home-insight-arrow" />
                            </div>
                            <div className="home-insight-chart">{item.chart}</div>
                            <p className="home-insight-caption">{item.caption}</p>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default InicioPanel
