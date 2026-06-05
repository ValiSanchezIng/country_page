import { useEffect, useRef, useState } from "react";

// Dashboard de métricas de caballos. Consume GET /api/metricas/caballos.
// Reutilizable por el administrador y por todos los instructores (admin y general).
// Animaciones (galope, conteo, barras) hechas con CSS puro: sin dependencias nuevas.
const API_BASE_URL = "https://elrefugiocountryclub.com/api/api";

const COUNT_CARDS = [
  { key: "disponibles", label: "Disponibles", icon: "🐎", color: "#2e7d32", bg: "linear-gradient(135deg,#e8f5e9,#c8e6c9)" },
  { key: "no_disponibles", label: "No disponibles", icon: "🚫", color: "#c0392b", bg: "linear-gradient(135deg,#fdecea,#f8d0cc)" },
  { key: "en_renta", label: "En renta", icon: "💰", color: "#b8860b", bg: "linear-gradient(135deg,#fff8e1,#ffecb3)" },
  { key: "media_renta", label: "Media renta", icon: "🤝", color: "#cd853f", bg: "linear-gradient(135deg,#fbeee0,#f3dcc4)" },
  { key: "con_propietario", label: "Con propietario", icon: "👑", color: "#6b4423", bg: "linear-gradient(135deg,#efe6dc,#e0cdb8)" },
  { key: "publicos", label: "Públicos", icon: "🌐", color: "#3b7a9c", bg: "linear-gradient(135deg,#e3f2fd,#c5e3f6)" },
  { key: "privados", label: "Privados", icon: "🔒", color: "#7d5ba6", bg: "linear-gradient(135deg,#f3e9fb,#e4d2f5)" },
  { key: "no_disponibles_clases", label: "No disp. para clases", icon: "⛔", color: "#a0522d", bg: "linear-gradient(135deg,#f6e7df,#ecd2c5)" },
];

// CSS de las animaciones (se inyecta una sola vez).
const STYLES = `
@keyframes mc-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes mc-fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes mc-pop { 0% { transform: scale(0.6); opacity: 0; } 70% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
@keyframes mc-run-loader { 0% { transform: translateX(-30px) scaleX(-1); } 50% { transform: translateX(30px) scaleX(-1) translateY(-5px); } 100% { transform: translateX(-30px) scaleX(-1); } }
.mc-card { animation: mc-fade-up .5s ease both; transition: transform .2s ease, box-shadow .2s ease; }
.mc-card:hover { transform: translateY(-4px); box-shadow: 0 8px 22px rgba(107,68,35,.18); }
.mc-card:hover .mc-card-icon { animation: mc-bob .6s ease infinite; }
.mc-bar-fill { transition: width 1.1s cubic-bezier(.22,1,.36,1); }
.mc-panel { animation: mc-fade-up .55s ease both; }
.mc-bar-horse { animation: mc-bob .9s ease-in-out infinite; }
`;

// Número que cuenta de 0 al valor con requestAnimationFrame.
function CountUp({ value = 0, duration = 900, style }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const target = Number(value) || 0;
    let startTs = null;
    cancelAnimationFrame(ref.current);
    const step = (ts) => {
      if (startTs === null) startTs = ts;
      const p = Math.min(1, (ts - startTs) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(target * eased));
      if (p < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);
  return <span style={style}>{display}</span>;
}

function BarList({ items, labelKey, valueKey, color = "#9caf88", subKey = null, mounted }) {
  const max = Math.max(1, ...items.map((i) => Number(i[valueKey]) || 0));
  if (items.length === 0) {
    return <p style={{ color: "#999", fontSize: "0.85rem", margin: "0.5rem 0" }}>Sin datos para el rango.</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.6rem" }}>
      {items.slice(0, 12).map((it, idx) => {
        const val = Number(it[valueKey]) || 0;
        const pct = Math.round((val / max) * 100);
        const isLeader = idx === 0 && val > 0;
        return (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 130, fontSize: "0.8rem", color: "#444", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {it[labelKey]}{subKey && it[subKey] ? ` · ${it[subKey]}` : ""}
            </div>
            <div style={{ flex: 1, background: "#f0ece5", borderRadius: 8, height: 20, position: "relative", overflow: "hidden" }}>
              <div
                className="mc-bar-fill"
                style={{
                  width: mounted ? `${pct}%` : "0%",
                  background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                  height: "100%",
                  borderRadius: 8,
                  minWidth: val > 0 ? 6 : 0,
                  transitionDelay: `${idx * 80}ms`,
                  position: "relative",
                }}
              >
                {isLeader && (
                  <span className="mc-bar-horse" style={{ position: "absolute", right: 2, top: -1, fontSize: 16 }}>🐎</span>
                )}
              </div>
            </div>
            <div style={{ width: 28, fontSize: "0.82rem", fontWeight: 700, color: "#333" }}>{val}</div>
          </div>
        );
      })}
    </div>
  );
}

// Gráfica de dona (SVG) animada con leyenda.
function Donut({ segments, mounted, centerValue, centerLabel }) {
  const r = 54;
  const C = 2 * Math.PI * r;
  const totalVal = segments.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1;
  let acc = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: 160, height: 160, flex: "0 0 auto" }}>
        <svg viewBox="0 0 140 140" width="160" height="160">
          <g transform="rotate(-90 70 70)">
            <circle cx="70" cy="70" r={r} fill="none" stroke="#f0ece5" strokeWidth="18" />
            {segments.map((seg, i) => {
              const frac = (Number(seg.value) || 0) / totalVal;
              const segLen = frac * C;
              const start = acc;
              acc += frac;
              return (
                <circle
                  key={seg.label}
                  cx="70" cy="70" r={r}
                  fill="none" stroke={seg.color} strokeWidth="18" strokeLinecap="butt"
                  strokeDasharray={mounted ? `${segLen} ${C - segLen}` : `0 ${C}`}
                  strokeDashoffset={`-${start * C}`}
                  style={{ transition: "stroke-dasharray 1s cubic-bezier(.22,1,.36,1)", transitionDelay: `${i * 140}ms` }}
                />
              );
            })}
          </g>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <CountUp value={centerValue} style={{ fontSize: "1.8rem", fontWeight: 800, color: "#6b4423", lineHeight: 1 }} />
          <span style={{ fontSize: "0.7rem", color: "#888" }}>{centerLabel}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 130 }}>
        {segments.map((seg) => {
          const v = Number(seg.value) || 0;
          const p = totalVal > 0 ? Math.round((v / totalVal) * 100) : 0;
          return (
            <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem" }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: seg.color, flex: "0 0 auto" }} />
              <span style={{ color: "#444", flex: 1 }}>{seg.label}</span>
              <strong style={{ color: "#333" }}>{v}</strong>
              <span style={{ color: "#999", width: 38, textAlign: "right" }}>{p}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Anillo de progreso (SVG) para indicar ocupación/disponibilidad.
function Ring({ value, total, color, caption }) {
  const r = 54;
  const C = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(1, (Number(value) || 0) / total) : 0;
  const [mountedRing, setMountedRing] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setMountedRing(true)));
    return () => cancelAnimationFrame(id);
  }, [value, total]);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: 160, height: 160 }}>
        <svg viewBox="0 0 140 140" width="160" height="160">
          <g transform="rotate(-90 70 70)">
            <circle cx="70" cy="70" r={r} fill="none" stroke="#f0ece5" strokeWidth="16" />
            <circle
              cx="70" cy="70" r={r}
              fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
              strokeDasharray={`${mountedRing ? pct * C : 0} ${C}`}
              style={{ transition: "stroke-dasharray 1.1s cubic-bezier(.22,1,.36,1)" }}
            />
          </g>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 22 }}>🐎</span>
          <CountUp value={Math.round(pct * 100)} style={{ fontSize: "1.6rem", fontWeight: 800, color }} />
          <span style={{ fontSize: "0.7rem", color: "#888" }}>%</span>
        </div>
      </div>
      <span style={{ fontSize: "0.82rem", color: "#555", textAlign: "center" }}>{caption}</span>
    </div>
  );
}

export default function MetricasCaballos() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [mounted, setMounted] = useState(false);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    setMounted(false);
    try {
      const params = new URLSearchParams();
      if (desde) params.append("desde", desde);
      if (hasta) params.append("hasta", hasta);
      const res = await fetch(`${API_BASE_URL}/metricas/caballos?${params.toString()}`);
      if (!res.ok) throw new Error("No se pudieron cargar las métricas");
      setData(await res.json());
      // permitir que las barras animen tras pintar
      requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const conteos = data?.conteos || {};
  const graficas = data?.graficas || {};
  const total = conteos.total || 0;
  const pct = (n) => (total > 0 ? Math.round(((n || 0) / total) * 100) : 0);

  return (
    <div style={{ padding: "1rem" }}>
      <style>{STYLES}</style>

      {/* Encabezado con pista y caballo al galope */}
      <div style={{ position: "relative", marginBottom: "1.25rem", padding: "1.1rem 1.25rem", borderRadius: 14, overflow: "hidden", background: "linear-gradient(135deg,#6b4423,#9caf88)", color: "#fff" }}>
        <h2 style={{ margin: 0, fontSize: "1.4rem", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ animation: "mc-bob 1.4s ease-in-out infinite", display: "inline-block" }}>🐴</span>
          Dashboard de Caballos
        </h2>
        <p style={{ margin: "4px 0 0", opacity: 0.9, fontSize: "0.9rem" }}>
          {total} caballo{total !== 1 ? "s" : ""} en total · vista general del establo
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "2.5rem" }}>
          <div style={{ fontSize: 44, display: "inline-block", animation: "mc-run-loader 1s ease-in-out infinite" }}>🐎</div>
          <p style={{ color: "#6b4423", marginTop: 8 }}>Cargando métricas…</p>
        </div>
      ) : error ? (
        <p style={{ color: "#c0392b" }}>{error}</p>
      ) : (
        <>
          {/* Tarjetas de conteo */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.85rem", marginBottom: "1.5rem" }}>
            {COUNT_CARDS.map((c, i) => (
              <div key={c.key} className="mc-card" style={{ position: "relative", borderRadius: 14, padding: "1rem 1.1rem", background: c.bg, border: "1px solid rgba(0,0,0,.05)", animationDelay: `${i * 70}ms`, overflow: "hidden" }}>
                <div className="mc-card-icon" style={{ position: "absolute", top: 10, right: 12, fontSize: 26, opacity: 0.85 }}>{c.icon}</div>
                <CountUp value={conteos[c.key]} style={{ fontSize: "2rem", fontWeight: 800, color: c.color, lineHeight: 1 }} />
                <div style={{ fontSize: "0.82rem", color: "#555", marginTop: 4, fontWeight: 600 }}>{c.label}</div>
                {/* mini barra de proporción sobre el total */}
                <div style={{ marginTop: 8, height: 5, background: "rgba(0,0,0,.08)", borderRadius: 4, overflow: "hidden" }}>
                  <div className="mc-bar-fill" style={{ width: mounted ? `${pct(conteos[c.key])}%` : "0%", height: "100%", background: c.color, borderRadius: 4, transitionDelay: `${i * 70}ms` }} />
                </div>
                <div style={{ fontSize: "0.7rem", color: "#888", marginTop: 3 }}>{pct(conteos[c.key])}% del total</div>
              </div>
            ))}
          </div>

          {/* Distribución por estatus (dona) + ocupación (anillos) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div className="mc-panel" style={{ background: "#fff", border: "1px solid #e8e0d6", borderRadius: 14, padding: "1.1rem" }}>
              <h3 style={{ margin: "0 0 0.6rem", color: "#6b4423", fontSize: "1rem", display: "flex", alignItems: "center", gap: 6 }}>🍩 Distribución por estatus</h3>
              <Donut
                mounted={mounted}
                centerValue={total}
                centerLabel="caballos"
                segments={[
                  { label: "Públicos", value: conteos.publicos, color: "#3b7a9c" },
                  { label: "Privados", value: conteos.privados, color: "#7d5ba6" },
                  { label: "En renta", value: conteos.en_renta, color: "#b8860b" },
                  { label: "Media renta", value: conteos.media_renta, color: "#cd853f" },
                ]}
              />
            </div>
            <div className="mc-panel" style={{ background: "#fff", border: "1px solid #e8e0d6", borderRadius: 14, padding: "1.1rem", animationDelay: "80ms" }}>
              <h3 style={{ margin: "0 0 0.6rem", color: "#6b4423", fontSize: "1rem", display: "flex", alignItems: "center", gap: 6 }}>🐴 Ocupación del establo</h3>
              <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "1rem" }}>
                <Ring value={conteos.disponibles} total={total} color="#2e7d32" caption={`Disponibles (${conteos.disponibles || 0}/${total})`} />
                <Ring value={total - (conteos.no_disponibles_clases || 0)} total={total} color="#9caf88" caption="Aptos para clases" />
              </div>
            </div>
          </div>

          {/* Filtro de fechas para las gráficas */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "1rem", background: "#faf8f5", border: "1px solid #e8e0d6", borderRadius: 12, padding: "0.85rem 1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "#666", marginBottom: 2 }}>Desde</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "#666", marginBottom: 2 }}>Hasta</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            <button onClick={cargar} style={{ padding: "0.5rem 1.1rem", background: "#9caf88", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
              🐎 Aplicar
            </button>
            {(desde || hasta) && (
              <button onClick={() => { setDesde(""); setHasta(""); setTimeout(cargar, 0); }} style={{ padding: "0.5rem 1rem", background: "#eee", border: "none", borderRadius: 8, cursor: "pointer" }}>
                Limpiar
              </button>
            )}
            <span style={{ fontSize: "0.78rem", color: "#999", marginLeft: "auto" }}>
              {desde || hasta ? `Rango: ${desde || "inicio"} → ${hasta || "hoy"}` : "Todo el histórico"}
            </span>
          </div>

          {/* Gráficas */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: "1.25rem" }}>
            <div className="mc-panel" style={{ background: "#fff", border: "1px solid #e8e0d6", borderRadius: 14, padding: "1.1rem" }}>
              <h3 style={{ margin: 0, color: "#6b4423", fontSize: "1rem", display: "flex", alignItems: "center", gap: 6 }}>🏇 Salen con más frecuencia</h3>
              <BarList items={graficas.frecuencia || []} labelKey="nombre" valueKey="salidas" color="#9caf88" mounted={mounted} />
            </div>
            <div className="mc-panel" style={{ background: "#fff", border: "1px solid #e8e0d6", borderRadius: 14, padding: "1.1rem", animationDelay: "80ms" }}>
              <h3 style={{ margin: 0, color: "#6b4423", fontSize: "1rem", display: "flex", alignItems: "center", gap: 6 }}>📊 Salidas por clase</h3>
              <BarList items={graficas.por_clase || []} labelKey="caballo" valueKey="salidas" subKey="clase" color="#b8860b" mounted={mounted} />
            </div>
            <div className="mc-panel" style={{ background: "#fff", border: "1px solid #e8e0d6", borderRadius: 14, padding: "1.1rem", animationDelay: "160ms" }}>
              <h3 style={{ margin: 0, color: "#6b4423", fontSize: "1rem", display: "flex", alignItems: "center", gap: 6 }}>👑 Caballos con propietario</h3>
              {(graficas.con_propietario || []).length === 0 ? (
                <p style={{ color: "#999", fontSize: "0.85rem" }}>Ninguno.</p>
              ) : (
                <ul style={{ margin: "0.6rem 0 0", padding: 0, listStyle: "none" }}>
                  {graficas.con_propietario.map((c, i) => (
                    <li key={c.id} className="mc-card" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#444", padding: "0.4rem 0.5rem", borderRadius: 8, background: i % 2 ? "#faf8f5" : "transparent", animationDelay: `${i * 50}ms` }}>
                      <span style={{ fontSize: 16 }}>🐴</span>
                      <strong>{c.nombre}</strong>
                      <span style={{ color: "#888" }}>— {c.propietario}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
