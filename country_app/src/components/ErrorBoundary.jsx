import React from "react";

// Límite de errores: evita que un fallo de render en un apartado deje TODA la
// página en blanco (lo que obligaba a refrescar para volver a entrar).
// Muestra un mensaje y un botón "Reintentar" que re-monta el contenido.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, attempt: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Queda en consola para diagnóstico.
    console.error("💥 Error en apartado:", error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState((s) => ({ hasError: false, error: null, attempt: s.attempt + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "1.5rem", textAlign: "center", color: "#6b4423" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🐴</div>
          <h3 style={{ margin: "0 0 6px" }}>No se pudo mostrar este apartado</h3>
          <p style={{ color: "#999", fontSize: "0.85rem", maxWidth: 420, margin: "0 auto 14px" }}>
            {this.state.error?.message || "Ocurrió un error inesperado."}
          </p>
          <button
            onClick={this.handleRetry}
            style={{ padding: "0.55rem 1.2rem", background: "#9caf88", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
          >
            Reintentar
          </button>
        </div>
      );
    }
    // `attempt` en la key fuerza re-montar el subárbol al reintentar.
    return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
  }
}

export default ErrorBoundary;
