import { useEffect, useState } from "react";

// Apartado "Caballos" para los instructores: lista todos los caballos con su perfil
// (disponibilidad, renta/propietario, nivel) y un modal con observaciones y el
// conteo de salidas del día. Solo lectura. Consume /api/caballos y /:id/perfil.
const API_BASE_URL = "https://elrefugiocountryclub.com/api/api";

function estatusBadge(estatus) {
  const map = {
    publico: { label: "Público", color: "#3b7a9c" },
    privado: { label: "Privado", color: "#7d5ba6" },
    renta: { label: "Renta", color: "#b8860b" },
    media_renta: { label: "Media renta", color: "#cd853f" },
  };
  const it = map[estatus] || { label: estatus || "—", color: "#666" };
  return (
    <span style={{ background: it.color, color: "#fff", padding: "2px 8px", borderRadius: 12, fontSize: "0.72rem", fontWeight: 600 }}>
      {it.label}
    </span>
  );
}

export default function CaballosPerfil() {
  const [caballos, setCaballos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [perfilLoading, setPerfilLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/caballos`);
        if (!res.ok) throw new Error("No se pudieron cargar los caballos");
        setCaballos(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const abrirPerfil = async (caballo) => {
    setPerfil({ ...caballo, salidas_dia: null });
    setPerfilLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/caballos/${caballo.id}/perfil`);
      if (res.ok) setPerfil(await res.json());
    } catch {
      /* mantiene los datos base si falla */
    } finally {
      setPerfilLoading(false);
    }
  };

  const filtrados = caballos.filter((c) =>
    (c.nombre || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p style={{ padding: "1rem" }}>Cargando caballos…</p>;
  if (error) return <p style={{ padding: "1rem", color: "#c0392b" }}>{error}</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h2 style={{ color: "#6b4423", marginBottom: "0.75rem" }}>Caballos</h2>
      <input
        type="text"
        placeholder="Buscar caballo…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid #ccc", marginBottom: "1rem", width: "min(320px, 100%)" }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.85rem" }}>
        {filtrados.map((c) => (
          <div
            key={c.id}
            onClick={() => abrirPerfil(c)}
            style={{ background: "#fff", border: "1px solid #e8e0d6", borderRadius: 10, padding: "0.9rem", cursor: "pointer" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <strong style={{ color: "#6b4423" }}>{c.nombre}</strong>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.disponibilidad === "disponible" ? "#2e7d32" : "#c0392b" }} />
            </div>
            <div style={{ marginBottom: 6 }}>{estatusBadge(c.estatus)}</div>
            <div style={{ fontSize: "0.78rem", color: "#666" }}>Nivel: {c.especialidad || "—"}</div>
            {c.propietario_nombre && <div style={{ fontSize: "0.76rem", color: "#666" }}>Propietario: {c.propietario_nombre}</div>}
            {(c.estatus === "renta" || c.estatus === "media_renta") && c.renta_cliente_nombre && (
              <div style={{ fontSize: "0.76rem", color: "#b8860b" }}>Rentado a: {c.renta_cliente_nombre}</div>
            )}
          </div>
        ))}
      </div>

      {perfil && (
        <div onClick={() => setPerfil(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", width: "min(460px, 92vw)" }}>
            <h2 style={{ marginTop: 0, color: "#6b4423" }}>{perfil.nombre}</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
              {estatusBadge(perfil.estatus)}
              <span style={{ fontSize: "0.82rem", color: perfil.disponibilidad === "disponible" ? "#2e7d32" : "#c0392b" }}>
                {perfil.disponibilidad === "disponible" ? "Disponible" : "No disponible"}
              </span>
            </div>
            <p style={{ margin: "4px 0", fontSize: "0.88rem" }}><strong>Salidas hoy:</strong> {perfilLoading ? "…" : (perfil.salidas_dia ?? "—")}
              {perfil.salidas_dia > 2 && <span style={{ color: "#c0392b", fontWeight: 600 }}> ⚠ Ya salió más de 2 veces</span>}
            </p>
            <p style={{ margin: "4px 0", fontSize: "0.88rem" }}><strong>Nivel:</strong> {perfil.especialidad || "—"}</p>
            {perfil.propietario_nombre && <p style={{ margin: "4px 0", fontSize: "0.88rem" }}><strong>Propietario:</strong> {perfil.propietario_nombre}</p>}
            {(perfil.estatus === "renta" || perfil.estatus === "media_renta") && (
              <p style={{ margin: "4px 0", fontSize: "0.88rem", color: "#b8860b" }}>
                <strong>En renta:</strong> {perfil.renta_cliente_nombre || perfil.renta_con || "—"}
              </p>
            )}
            <div style={{ marginTop: 10 }}>
              <strong style={{ fontSize: "0.88rem" }}>Observaciones:</strong>
              <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#555", whiteSpace: "pre-wrap" }}>
                {perfil.descripcion || "Sin observaciones."}
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <button onClick={() => setPerfil(null)} style={{ padding: "0.5rem 1rem", background: "#9caf88", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
