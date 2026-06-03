import React from "react";
import LogoutButton from "./LogoutBoton";

// Pantalla de respaldo para rutas inexistentes o roles sin vista asignada.
// Garantiza que el usuario siempre pueda cerrar sesión e ingresar con otra cuenta.
export default function SinVista() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        gap: "1rem",
        textAlign: "center",
        padding: "1.5rem",
        fontFamily: "var(--font-primary)",
      }}
    >
      <h2 style={{ margin: 0, color: "var(--primary-brown, #6b4423)" }}>
        Esta cuenta no tiene una vista asignada
      </h2>
      <p style={{ color: "#6b7280", maxWidth: "420px" }}>
        No encontramos un panel para tu usuario. Cierra sesión e ingresa con otra
        cuenta, o comunícate con el administrador.
      </p>
      <LogoutButton showUserName={false} />
    </div>
  );
}
