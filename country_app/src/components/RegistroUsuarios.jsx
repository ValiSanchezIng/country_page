// src/components/GestionUsuarios.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import "../CSS/RegistroUsuarios.css";
import {
  User,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Loader,
  Save,
  Eye,
  EyeOff,
  Copy,
  Edit,
  X,
  Check,
  Search,
} from "lucide-react";
import LogoutButton from "./LogoutBoton";
import useUsuarios from "../hooks/useUsuarios";
import useRoleGuard from "../hooks/useRoleGuard";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ============================
// Componente para fila de usuario (optim
// ============================
const UsuarioRow = React.memo(
  ({
    usuario,
    editValue,
    onEditChange,
    visiblePassword,
    onTogglePassword,
    editingPassword,
    passwordEditValue,
    onPasswordEditChange,
    onStartEditPassword,
    onCancelEditPassword,
    onCopyToClipboard,
    onGuardar,
    loading,
    hasChanges,
    isPasswordInvalid,
  }) => {
    return (
      <tr key={usuario.id}>
        <td>#{usuario.id}</td>
        <td>
          {usuario.nombre} {usuario.apellido}
        </td>
        <td>
          {usuario.correo ? (
            <input
              type="email"
              value={editValue ?? usuario.correo}
              onChange={(e) => onEditChange(usuario.id, e.target.value)}
              className="form-input"
              disabled={loading}
            />
          ) : (
            <span
              style={{
                color: "#dc3545",
                fontWeight: "bold",
                fontSize: "16px",
                fontStyle: "italic",
                textTransform: "uppercase",
                letterSpacing: "1px",
                backgroundColor: "#f8d7da",
                padding: "4px 8px",
                borderRadius: "4px",
                display: "inline-block",
              }}
            >
              Sin correo registrado
            </span>
          )}
        </td>
        <td>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              minWidth: "200px",
            }}
          >
            {/* Username */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#f8f9fa",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #dee2e6",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#6c757d",
                  minWidth: "60px",
                }}
              >
                Usuario:
              </span>
              <code
                style={{
                  flex: 1,
                  fontSize: "13px",
                  color: "#495057",
                  fontFamily: "monospace",
                }}
              >
                {usuario.username || "N/A"}
              </code>
              {usuario.username && (
                <button
                  onClick={() => onCopyToClipboard(usuario.username, "Usuario")}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                  }}
                  title="Copiar usuario"
                >
                  <Copy size={12} />
                </button>
              )}
            </div>

            {/* Password */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#fff3cd",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #ffc107",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#856404",
                  minWidth: "60px",
                }}
              >
                Clave:
              </span>

              {editingPassword ? (
                // Modo edición
                <>
                  <input
                    type="text"
                    value={passwordEditValue || ""}
                    onChange={(e) =>
                      onPasswordEditChange(usuario.id, e.target.value)
                    }
                    style={{
                      flex: 1,
                      fontFamily: "monospace",
                      fontSize: "13px",
                      padding: "4px 8px",
                      backgroundColor: "#fff",
                      border: `2px solid ${passwordEditValue?.length < 8 ? "#dc3545" : "#28a745"}`,
                      borderRadius: "4px",
                      outline: "none",
                    }}
                    placeholder="Nueva contraseña (min. 8)"
                    minLength={8}
                  />
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => onCancelEditPassword(usuario.id)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                      }}
                      title="Cancelar edición"
                    >
                      <X size={12} /> Cancelar
                    </button>
                  </div>
                </>
              ) : (
                // Modo visualización
                <>
                  <code
                    style={{
                      flex: 1,
                      fontSize: "13px",
                      color: "#856404",
                      fontFamily: "monospace",
                    }}
                  >
                    {visiblePassword ? usuario.contrasena || "N/A" : "••••••••"}
                  </code>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {usuario.contrasena && (
                      <>
                        <button
                          onClick={() => onTogglePassword(usuario.id)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#ffc107",
                            color: "#856404",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                          }}
                          title={
                            visiblePassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          {visiblePassword ? (
                            <EyeOff size={12} />
                          ) : (
                            <Eye size={12} />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            onCopyToClipboard(usuario.contrasena, "Contraseña")
                          }
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#ffc107",
                            color: "#856404",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11px",
                          }}
                          title="Copiar contraseña"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          onClick={() =>
                            onStartEditPassword(usuario.id, usuario.contrasena)
                          }
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#17a2b8",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11px",
                          }}
                          title="Editar contraseña"
                        >
                          <Edit size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </td>
        <td>{usuario.rol}</td>
        <td>
          {usuario.rol === "cliente" ? (
            usuario.tipo_nivel ? (
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  background: "rgba(156, 175, 136, 0.15)",
                  color: "#5a7247",
                }}
              >
                {usuario.tipo_nivel === "iniciacion" ? "Iniciación" : usuario.tipo_nivel}
              </span>
            ) : (
              <span style={{ color: "#999", fontStyle: "italic" }}>Sin nivel</span>
            )
          ) : (
            <span style={{ color: "#ccc" }}>—</span>
          )}
        </td>
        <td>
          {new Date(usuario.fecha_registro).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </td>
        <td>
          <button
            className="action-btn btn-success"
            onClick={() => onGuardar(usuario.id)}
            disabled={loading || !hasChanges || isPasswordInvalid}
          >
            <Save size={16} style={{ marginRight: "0.3rem" }} />
            Guardar
          </button>
        </td>
      </tr>
    );
  }
);

// ============================
// Formulario de registro
// ============================
const FormularioUsuario = React.memo(({ onCrearUsuario, loading }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    rol: "cliente",
    edad: "",
    telefono: "",
    tipo_cliente: "",
    nivel: "",
    tipo_nivel: "",
    // Campos específicos para instructoras
    especialidad: "mixto",
  });
  const [errores, setErrores] = useState({});
  const [withoutEmail, setWithoutEmail] = useState(false);
  const [previewCredentials, setPreviewCredentials] = useState({
    username: "",
    password: "",
  });
  const [previewEdited, setPreviewEdited] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const roles = useMemo(
    () => [
      { value: "administrador", label: "Administrador" },
      { value: "cliente", label: "Cliente" },
      { value: "instructora", label: "Instructora" },
      { value: "creadorcuentas", label: "Creador de Cuentas" },
    ],
    []
  );

  const tiposCliente = useMemo(
    () => ["propietario", "demo", "general", "renta", "media_renta"],
    []
  );

  const tiposNivel = useMemo(
    () => ["iniciacion", "ponyclub", "paseo", "intermedio", "avanzado"],
    []
  );

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errores[name]) setErrores((prev) => ({ ...prev, [name]: "" }));
    },
    [errores]
  );

  // Función para generar contraseña segura
  const generateSecurePassword = useCallback(() => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const allChars = uppercase + lowercase + numbers;
    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    for (let i = 0; i < 5; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }, []);

  // Función para generar username de vista previa
  const generatePreviewUsername = useCallback((nombre, apellido) => {
    if (!nombre || !apellido) return "";
    const cleanNombre = nombre
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(" ")[0];
    const cleanApellido = apellido
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(" ")[0];
    return `${cleanNombre}.${cleanApellido}`.substring(0, 15);
  }, []);

  const getRealCredentials = useCallback(
    async (nombre, apellido, customPassword = null) => {
      try {
        const response = await fetch(
          "https://elrefugiocountryclub.com/api/api/users/preview-credentials",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, apellido, customPassword }),
          }
        );
        if (response.ok) {
          const result = await response.json();
          return result.credentials;
        }
      } catch (error) {
        console.error("Error al obtener credenciales reales:", error);
      }
      return null;
    },
    []
  );

  const validarFormulario = useCallback(() => {
    const nuevosErrores = {};
    if (!formData.nombre.trim())
      nuevosErrores.nombre = "El nombre es requerido";
    if (!formData.apellido.trim())
      nuevosErrores.apellido = "El apellido es requerido";

    if (!withoutEmail) {
      if (!formData.email.trim()) {
        nuevosErrores.email = "El email es requerido";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        nuevosErrores.email = "El email no es válido";
      }
    }

    const isWithoutEmail = formData.rol !== "cliente" || withoutEmail;
    if (
      isWithoutEmail &&
      previewCredentials.password &&
      previewCredentials.password.length < 8
    ) {
      nuevosErrores.password = "La contraseña debe tener al menos 8 caracteres";
      toast.error("La contraseña debe tener al menos 8 caracteres", {
        position: "top-right",
        autoClose: 3000,
      });
    }

    // Validación específica para instructoras
    if (formData.rol === "instructora") {
      if (!formData.especialidad) {
        nuevosErrores.especialidad = "La especialidad es requerida";
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }, [formData, withoutEmail, previewCredentials.password]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validarFormulario()) return;

      const isWithoutEmail = formData.rol !== "cliente" || withoutEmail;

      let finalCredentials = null;
      if (isWithoutEmail && formData.nombre && formData.apellido) {
        finalCredentials = await getRealCredentials(
          formData.nombre,
          formData.apellido,
          previewCredentials.password
        );

        if (finalCredentials) {
          setPreviewCredentials(finalCredentials);
          setPreviewEdited(false);
        }
      }

      const dataToSend = {
        ...formData,
        correo: formData.email, // Mapear email a correo para el backend
        withoutEmail: isWithoutEmail,
        ...(finalCredentials?.password && {
          customPassword: finalCredentials.password,
        }),
        ...(formData.rol !== "cliente" && {
          edad: null,
          tipo_cliente: null,
          nivel: null,
          tipo_nivel: null,
        }),
      };

      // Si es sin email, no enviar correo al backend
      if (isWithoutEmail) {
        delete dataToSend.correo;
      }

      const resultado = await onCrearUsuario(dataToSend);
      if (resultado.success) {
        // El backend ya envía el email automáticamente si el usuario tiene correo
        if (formData.email && !withoutEmail) {
          toast.success(
            `✅ Usuario creado exitosamente. Credenciales enviadas por email a ${formData.email}`,
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
        } else if (formData.rol === "cliente" && withoutEmail) {
          toast.success(
            `🔒 Las credenciales NO se enviarán por correo. Debes copiarlas y entregarlas personalmente.`,
            {
              position: "top-right",
              autoClose: 5000,
            }
          );
        } else if (formData.rol !== "cliente" && resultado.credentials) {
          setPreviewCredentials(resultado.credentials);
          setPreviewEdited(false);
          toast.success(
            `🔒 Las credenciales NO se enviarán por correo. Debes copiarlas y entregarlas personalmente.`,
            {
              position: "top-right",
              autoClose: 5000,
            }
          );
        } else {
          toast.success(
            `Usuario creado exitosamente.`,
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
        }

        setFormData({
          nombre: "",
          apellido: "",
          email: "",
          rol: "cliente",
          edad: "",
          telefono: "",
          tipo_cliente: "",
          nivel: "",
          tipo_nivel: "",
          // Campos específicos para instructoras
          especialidad: "mixto",
        });
        setWithoutEmail(false);

        if (!isWithoutEmail) {
          setPreviewCredentials({ username: "", password: "" });
          setPreviewEdited(false);
        }
      } else {
        toast.error(resultado.message || "Error al crear usuario", {
          position: "top-right",
          autoClose: 4000,
        });
      }
    },
    [
      formData,
      withoutEmail,
      previewCredentials.password,
      onCrearUsuario,
      validarFormulario,
    ]
  );

  useEffect(() => {
    const shouldGenerateCredentials =
      formData.rol !== "cliente" || withoutEmail;

    // Solo generar credenciales automáticamente si el usuario NO ha editado
    // manualmente la contraseña de preview (debounce) — prevenir que al
    // borrar el campo se regenere inmediatamente.
    if (
      !previewEdited &&
      shouldGenerateCredentials &&
      formData.nombre &&
      formData.apellido
    ) {
      const updateRealCredentials = async () => {
        try {
          const password =
            previewCredentials.password || generateSecurePassword();
          const realCredentials = await getRealCredentials(
            formData.nombre,
            formData.apellido,
            password
          );
          if (realCredentials) {
            setPreviewCredentials(realCredentials);
            setPreviewEdited(false);
          } else {
            // Fallback en caso de que no se obtengan credenciales reales
            const username = generatePreviewUsername(
              formData.nombre,
              formData.apellido
            );
            setPreviewCredentials({ username, password });
            setPreviewEdited(false);
          }
        } catch (error) {
          console.error("Error al obtener credenciales reales:", error);
          const username = generatePreviewUsername(
            formData.nombre,
            formData.apellido
          );
          const password =
            previewCredentials.password || generateSecurePassword();
          setPreviewCredentials({ username, password });
          setPreviewEdited(false);
        }
      };

  // Aumentar el tiempo de espera para evitar actualizaciones en cada tecla
  // (debounce más largo para que el preview no se actualice constantemente)
      const timeoutId = setTimeout(updateRealCredentials, 500);
      return () => clearTimeout(timeoutId);
    } else if (!shouldGenerateCredentials) {
      setPreviewCredentials({ username: "", password: "" });
      setPreviewEdited(false);
    }
  }, [
    withoutEmail,
    formData.nombre,
    formData.apellido,
    formData.rol,
    generateSecurePassword,
    generatePreviewUsername,
    getRealCredentials,
    previewCredentials.password,
  ]);

  useEffect(() => {
    if (formData.rol !== "cliente") {
      setWithoutEmail(true);
    } else {
      setWithoutEmail(false);
      setPreviewCredentials({ username: "", password: "" });
    }
  }, [formData.rol]);

  return (
    <div className="user-form-section">
      <div className="section-header">
        <h3>
          <UserPlus size={24} /> Registrar Nuevo Usuario
        </h3>
        <p>Complete el formulario para agregar un nuevo usuario al sistema</p>
        <div className="auto-credentials-info">
          <div
            style={{
              background: "rgba(139, 111, 78, 0.1)",
              border: "1px solid rgba(139, 111, 78, 0.3)",
              borderRadius: "8px",
              padding: "12px",
              margin: "10px 0",
              fontSize: "14px",
              color: "#8b6f4e",
            }}
          >
            {formData.rol === "cliente" ? (
              <>
                🔑 <strong>Clientes:</strong> Las credenciales se generan
                automáticamente. Puedes elegir enviarlas por email o copiarlas
                para entregarlas manualmente.
              </>
            ) : (
              <>
                🔑 <strong>Personal interno:</strong> Las credenciales se
                generan automáticamente para que las copies y las entregues. La
                contraseña es editable antes de crear la cuenta.
              </>
            )}
          </div>
        </div>
      </div>

      <form className="user-form-container" onSubmit={handleSubmit}>
        {/* PRIMERO: Seleccionar el rol */}
        <div className="form-group">
          <label htmlFor="rol">Tipo de Usuario *</label>
          <select
            id="rol"
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            className="form-input"
            disabled={loading}
          >
            {roles.map((rol) => (
              <option key={rol.value} value={rol.value}>
                {rol.label}
              </option>
            ))}
          </select>
          <p className="checkbox-description" style={{ marginTop: "5px" }}>
            {formData.rol === "cliente"
              ? "Cliente: Puede tener email para recibir credenciales"
              : "Personal interno: Credenciales para copiar y entregar"}
          </p>
        </div>

        {/* SEGUNDO: Datos personales */}
        {formData.rol === "cliente" ? (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={errores.nombre ? "form-input error" : "form-input"}
                disabled={loading}
                placeholder="Ingrese el nombre"
              />
              {errores.nombre && (
                <span className="error-message">{errores.nombre}</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="apellido">Apellido *</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                className={errores.apellido ? "form-input error" : "form-input"}
                disabled={loading}
                placeholder="Ingrese el apellido"
              />
              {errores.apellido && (
                <span className="error-message">{errores.apellido}</span>
              )}
            </div>
          </div>
        ) : (
          <div className={`form-row-${formData.rol === "instructora" ? "four" : "three"} personal-interno-row`}>
            <div className="form-group">
              <label htmlFor="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={errores.nombre ? "form-input error" : "form-input"}
                disabled={loading}
                placeholder="Ingrese el nombre"
              />
              {errores.nombre && (
                <span className="error-message">{errores.nombre}</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="apellido">Apellido *</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                className={errores.apellido ? "form-input error" : "form-input"}
                disabled={loading}
                placeholder="Ingrese el apellido"
              />
              {errores.apellido && (
                <span className="error-message">{errores.apellido}</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="form-input input-medium input-center"
                placeholder="Ej: 999123456"
                disabled={loading}
              />
            </div>

            {formData.rol === "instructora" && (
              <div className="form-group">
                <label htmlFor="especialidad">Especialidad *</label>
                <select
                  id="especialidad"
                  name="especialidad"
                  value={formData.especialidad}
                  onChange={handleChange}
                  className={errores.especialidad ? "form-input error" : "form-input"}
                  disabled={loading}
                >
                  <option value="mixto">Mixto</option>
                  <option value="iniciacion">Iniciación</option>
                  <option value="ponyclub">Ponyclub</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="paseo">Paseo</option>
                  <option value="salto">Salto</option>
                </select>
                {errores.especialidad && (
                  <span className="error-message">{errores.especialidad}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* <-- ⚠️ INICIO DE LA REORGANIZACIÓN COMPACTA                     */}
        {/* ================================================================= */}
        {formData.rol === "cliente" ? (
          <>
            <div className="form-row-compact">
              <div className="form-group">
                <label htmlFor="edad">Edad</label>
                <input
                  type="number"
                  id="edad"
                  name="edad"
                  value={formData.edad}
                  onChange={handleChange}
                  className="form-input input-small"
                  placeholder="Ej: 25"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="form-input input-medium"
                  placeholder="Ej: 999123456"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email {!withoutEmail && "*"}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errores.email ? "form-input error" : "form-input"}
                  disabled={loading || withoutEmail}
                  placeholder={
                    withoutEmail ? "No se requiere email" : "correo@ejemplo.com"
                  }
                />
                {errores.email && (
                  <span className="error-message">{errores.email}</span>
                )}
                {/* Checkbox para crear sin email - Movido aquí */}
                <div className="checkbox-container" style={{ marginTop: "4px" }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={withoutEmail}
                      onChange={(e) => {
                        setWithoutEmail(e.target.checked);
                        if (!e.target.checked) {
                          setPreviewCredentials({ username: "", password: "" });
                          setPreviewEdited(false);
                        }
                      }}
                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <span>Crear cliente sin correo electrónico</span>
                  </label>
                  <p className="checkbox-description">
                    Las credenciales se mostrarán para copiar y entregar manualmente
                  </p>
                </div>
              </div>
            </div>

            <div className="form-row">
              {/* CAMPO "TIPO DE CLIENTE" */}
              <div className="form-group">
                <label htmlFor="tipo_cliente">Tipo de Cliente</label>
                <select
                  id="tipo_cliente"
                  name="tipo_cliente"
                  value={formData.tipo_cliente}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loading}
                >
                  <option value="">Seleccione un tipo</option>
                  {tiposCliente.map((tipo) => (
                    <option
                      key={tipo}
                      value={tipo}
                      style={{ textTransform: "capitalize" }}
                    >
                      {tipo.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* CAMPO "NIVEL (TIPO NIVEL)" */}
              <div className="form-group">
                <label htmlFor="tipo_nivel">Nivel (Tipo Nivel)</label>
                <select
                  id="tipo_nivel"
                  name="tipo_nivel"
                  value={formData.tipo_nivel}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loading}
                >
                  <option value="">Seleccione un nivel</option>
                  {tiposNivel.map((nivel) => (
                    <option
                      key={nivel}
                      value={nivel}
                      style={{ textTransform: "capitalize" }}
                    >
                      {nivel}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : null}
        {/* ================================================================= */}
        {/* Note: 'Especialidad' ahora se muestra inline en la fila principal */}
        {/* ================================================================= */}
        {/* ================================================================= */}
        {/* <-- ⚠️ FIN DE LA REORGANIZACIÓN COMPACTA                         */}
        {/* ================================================================= */}

        {/* Vista previa de credenciales (sin cambios) */}
        {(withoutEmail || formData.rol !== "cliente") &&
          previewCredentials.username && (
            <div className="credentials-preview">
              <div className="credentials-header">
                <h4 className="credentials-title">
                  ⚠️ Credenciales a crear:
                </h4>
                <button
                  type="button"
                  onClick={async () => {
                    const realCreds = await getRealCredentials(
                      formData.nombre,
                      formData.apellido,
                      previewCredentials.password
                    );
                    const credentialsText = `Username: ${realCreds?.username || previewCredentials.username}\nContraseña: ${realCreds?.password || previewCredentials.password}`;
                    navigator.clipboard.writeText(credentialsText);
                    setCopyMessage("Credenciales copiadas");
                    setTimeout(() => setCopyMessage(""), 2000);
                  }}
                  className="copy-all-btn"
                >
                  📋 Copiar todo
                </button>
              </div>

              {copyMessage && (
                <div className="copy-message">
                  {copyMessage}
                </div>
              )}

              <div className="credentials-content">
                <div className="credentials-field">
                  <div className="field-header">
                    <strong className="field-label">Username:</strong>
                    <span className="field-badge">
                      🔒 automático
                    </span>
                  </div>
                  <div className="field-input">
                    {previewCredentials.username}
                  </div>
                </div>

                <div className="credentials-field">
                  <div className="field-header">
                    <strong className="field-label">Contraseña:</strong>
                    <span className="field-badge">
                      ✏️ editable
                    </span>
                  </div>
                  <input
                    type="text"
                    value={previewCredentials.password}
                    onChange={(e) => {
                      const newPassword = e.target.value;
                      setPreviewCredentials((prev) => ({
                        ...prev,
                        password: newPassword,
                      }));
                      // Marcar que el usuario editó manualmente la contraseña
                      setPreviewEdited(true);
                      if (errores.password && newPassword.length >= 8) {
                        setErrores((prev) => ({ ...prev, password: "" }));
                      }
                    }}
                    className="field-input"
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                  />
                  {previewCredentials.password.length > 0 &&
                    previewCredentials.password.length < 8 && (
                      <p className="field-warning">
                        ⚠️ Contraseña muy corta (
                        {previewCredentials.password.length}/8 caracteres) 
                      </p>
                    )}
                  {previewCredentials.password.length >= 8 && (
                    <p className="field-success">
                      ✓ Contraseña válida ({previewCredentials.password.length}{" "}
                      caracteres)
                    </p>
                  )}
                </div>
              </div>

              {(formData.rol !== "cliente" || withoutEmail) ? (
                <p className="credentials-tip" style={{color:'#b05a00',fontWeight:600, marginBottom:0}}>
                  <span style={{display:'flex',alignItems:'center'}}>
                    <span role="img" aria-label="candado" style={{marginRight:4}}>🔒</span>
                    Estas credenciales <b>NO</b> se enviarán por correo.
                  </span>
                  <span style={{fontWeight:400, fontSize:'1em', marginLeft:24, display:'block', marginTop:2}}>
                    Debes copiarlas y entregarlas personalmente.
                  </span>
                </p>
              ) : (
                <p className="credentials-tip">
                  💡 <strong>RECOMENDACIÓN:</strong> Copia estas credenciales
                  ANTES de crear la cuenta. Una vez registrado el usuario, el
                  formulario se limpiará automáticamente.
                </p>
              )}
            </div>
          )}

        <button
          type="submit"
          className="rustic-button submit-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader className="loading-spinner" size={18} /> 
              {formData.rol !== "cliente" || withoutEmail ? "Verificando credenciales y registrando..." : "Registrando..."}
            </>
          ) : (
            <>
              <UserPlus size={18} /> Registrar Usuario
            </>
          )}
        </button>
      </form>
    </div>
  );
});

// ============================
// Tabla de usuarios con edición de correo
// ============================
const TablaUsuarios = React.memo(({ usuarios, loading, onRecargar }) => {
  const [edits, setEdits] = useState({});
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [editingPasswords, setEditingPasswords] = useState({});
  const [passwordEdits, setPasswordEdits] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const handleChange = useCallback((id, value) => {
    setEdits((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handlePasswordChange = useCallback((id, value) => {
    setPasswordEdits((prev) => ({ ...prev, [id]: value }));
  }, []);

  const actualizarPasswordSilent = useCallback(async (id, password) => {
    try {
      const response = await fetch(
        `https://elrefugiocountryclub.com/api/api/users/update-password/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );
      return response.ok;
    } catch (error) {
      console.error("Error al actualizar contraseña:", error);
      return false;
    }
  }, []);

  const actualizarCorreoSilent = useCallback(async (id, correo) => {
    try {
      const response = await fetch(
        `https://elrefugiocountryclub.com/api/api/users/update-email/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // ==================
          // AQUÍ ESTÁ EL CAMBIO
          // ==================
          body: JSON.stringify({ email: correo }), // Se envía 'email' en lugar de 'correo'
        }
      );
      return response.ok;
    } catch (error) {
      console.error("Error al actualizar correo:", error);
      return false;
    }
  }, []);

  const savePassword = useCallback(
    async (id, silent = false) => {
      const newPassword = passwordEdits[id];

      if (!newPassword || newPassword.trim() === "") {
        if (!silent) {
          toast.error("La contraseña no puede estar vacía", {
            position: "top-right",
            autoClose: 3000,
          });
        }
        return false;
      }

      if (newPassword.length < 8) {
        if (!silent) {
          toast.error("La contraseña debe tener al menos 8 caracteres", {
            position: "top-right",
            autoClose: 3000,
          });
        }
        return false;
      }

      const resultado = await actualizarPasswordSilent(id, newPassword);
      if (resultado) {
        setEditingPasswords((prev) => ({ ...prev, [id]: false }));
        setPasswordEdits((prev) => ({ ...prev, [id]: "" }));
      }
      return resultado;
    },
    [passwordEdits, actualizarPasswordSilent]
  );

  const handleGuardar = useCallback(
    async (id) => {
      const usuario = usuarios.find((u) => u.id === id);

      const passwordInEdit = editingPasswords[id];
      const emailChanged = edits[id] && edits[id] !== usuario?.correo;

      if (emailChanged && (!edits[id] || edits[id].trim() === "")) {
        toast.error("El correo no puede estar vacío", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      let passwordSuccess = false;
      let emailSuccess = false;

      if (passwordInEdit) {
        passwordSuccess = await savePassword(id, true);
        if (!passwordSuccess) return;
      }

      if (emailChanged) {
        emailSuccess = await actualizarCorreoSilent(id, edits[id]);
        if (!emailSuccess) return;
      }

      if (passwordSuccess && emailSuccess) {
        toast.success("Correo y contraseña actualizados correctamente", {
          position: "top-right",
          autoClose: 3000,
        });
      } else if (passwordSuccess) {
        toast.success("Contraseña actualizada correctamente", {
          position: "top-right",
          autoClose: 3000,
        });
      } else if (emailSuccess) {
        toast.success("Correo actualizado correctamente", {
          position: "top-right",
          autoClose: 3000,
        });
      }

      setEdits((prev) => {
        const newEdits = { ...prev };
        delete newEdits[id];
        return newEdits;
      });

      if (onRecargar) {
        await onRecargar();
      }
    },
    [
      usuarios,
      editingPasswords,
      edits,
      onRecargar,
      savePassword,
      actualizarCorreoSilent,
    ]
  );

  const togglePasswordVisibility = useCallback((id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const startEditingPassword = useCallback((id, currentPassword) => {
    setEditingPasswords((prev) => ({ ...prev, [id]: true }));
    setPasswordEdits((prev) => ({ ...prev, [id]: currentPassword }));
    setVisiblePasswords((prev) => ({ ...prev, [id]: true }));
  }, []);

  const cancelEditingPassword = useCallback((id) => {
    setEditingPasswords((prev) => ({ ...prev, [id]: false }));
    setPasswordEdits((prev) => ({ ...prev, [id]: "" }));
  }, []);

  const copyToClipboard = useCallback((text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`, {
      position: "top-right",
      autoClose: 2000,
    });
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) => {
      const campos = [
        u.nombre, u.apellido,
        `${u.nombre || ""} ${u.apellido || ""}`,
        u.correo, u.username, u.rol, u.tipo_nivel,
        String(u.id),
      ];
      return campos.some((c) => (c || "").toString().toLowerCase().includes(q));
    });
  }, [usuarios, searchTerm]);

  const usuariosConCambios = useMemo(() => {
    return usuariosFiltrados.map((usuario) => {
      const emailChanged =
        edits[usuario.id] && edits[usuario.id] !== usuario.correo;
      const passwordChanged =
        editingPasswords[usuario.id] &&
        passwordEdits[usuario.id] &&
        passwordEdits[usuario.id].length >= 8;
      const hasChanges = emailChanged || passwordChanged;
      const isPasswordInvalid =
        editingPasswords[usuario.id] &&
        (!passwordEdits[usuario.id] || passwordEdits[usuario.id].length < 8);

      return {
        ...usuario,
        hasChanges,
        isPasswordInvalid,
      };
    });
  }, [usuariosFiltrados, edits, editingPasswords, passwordEdits]);

  return (
    <div className="user-table-section">
      <div className="section-header">
        <h3>
          <User size={24} /> Usuarios Registrados ({usuariosFiltrados.length}{searchTerm ? ` de ${usuarios.length}` : ""})
        </h3>
        <p>Listado completo de usuarios en el sistema</p>
      </div>

      {/* Buscador de usuarios */}
      <div style={{ position: "relative", margin: "0 0 1rem", maxWidth: 420 }}>
        <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#999", pointerEvents: "none" }} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, correo, usuario, rol o ID..."
          autoComplete="off"
          style={{ width: "100%", padding: "0.55rem 2rem 0.55rem 2.4rem", borderRadius: 8, border: "1px solid #ccc", fontSize: "0.9rem", boxSizing: "border-box" }}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#999", display: "flex" }}
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {usuarios.length === 0 ? (
        <div className="empty-state">
          <User size={48} />
          <p>No hay usuarios registrados</p>
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="empty-state">
          <User size={48} />
          <p>No se encontraron usuarios para "{searchTerm}"</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Email</th>
                <th>Credenciales</th>
                <th>Rol</th>
                <th>Nivel</th>
                <th>Fecha Registro</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuariosConCambios.map((usuario) => (
                <UsuarioRow
                  key={usuario.id}
                  usuario={usuario}
                  editValue={edits[usuario.id]}
                  onEditChange={handleChange}
                  visiblePassword={visiblePasswords[usuario.id]}
                  onTogglePassword={togglePasswordVisibility}
                  editingPassword={editingPasswords[usuario.id]}
                  passwordEditValue={passwordEdits[usuario.id]}
                  onPasswordEditChange={handlePasswordChange}
                  onStartEditPassword={startEditingPassword}
                  onCancelEditPassword={cancelEditingPassword}
                  onCopyToClipboard={copyToClipboard}
                  onGuardar={handleGuardar}
                  loading={loading}
                  hasChanges={usuario.hasChanges}
                  isPasswordInvalid={usuario.isPasswordInvalid}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

// ============================
// Componente principal
// ============================
const GestionUsuarios = React.memo(() => {
  const { usuarios, loading, error, crearUsuario, cargarUsuarios } =
    useUsuarios();
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  useRoleGuard(["creadorcuentas"]);

  const mostrarMensaje = useCallback((texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 5000);
  }, []);

  const handleCrearUsuario = useCallback(
    async (nuevoUsuario) => {
      const resultado = await crearUsuario(nuevoUsuario);
      mostrarMensaje(
        resultado.message,
        resultado.success ? "success" : "error"
      );
      return resultado;
    },
    [crearUsuario, mostrarMensaje]
  );

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("token");
    sessionStorage.clear();
    window.location.href = "/login";
  }, []);

  return (
    <div className="user-management-container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1rem",
        }}
      >
        <LogoutButton
          userName="Admin"
          onLogout={handleLogout}
          size="normal"
          showUserName={true}
        />
      </div>

      <div className="user-management-header">
        <h2>Gestión de Usuarios</h2>
        <p>
          Administre las cuentas de usuario de la plataforma Country Refugio
        </p>
      </div>

      {mensaje.texto && (
        <div className={`alert alert-${mensaje.tipo}`}>
          {mensaje.tipo === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{mensaje.texto}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="user-management-content">
        <FormularioUsuario
          onCrearUsuario={handleCrearUsuario}
          loading={loading}
        />
        <TablaUsuarios
          usuarios={usuarios}
          loading={loading}
          onRecargar={cargarUsuarios}
        />
      </div>
    </div>
  );
});

export default GestionUsuarios;