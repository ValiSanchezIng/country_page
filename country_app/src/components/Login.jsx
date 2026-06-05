import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import image10 from "../img/image_10.jpg";
import logoRefugio from "../img/El_refugio_logo.png";
import { getRedirectRoute } from "../utils/roleRedirect";
import "../CSS/Login.css";

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [estadoMsg, setEstadoMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const user = sessionStorage.getItem('user');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        if (parsedUser && parsedUser.id && parsedUser.nombre) {
          const redirectPath = location.state?.from || getRedirectRoute(parsedUser.rol);
          navigate(redirectPath, { replace: true });
        }
      } catch (error) {
        sessionStorage.clear();
      }
    }
  }, [navigate, location]);

  const validateField = (name, value) => {
    if (name === "password") {
      return value.length >= 4
        ? ""
        : "La contraseña debe tener al menos 4 caracteres";
    }
    return "";
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
    setFocusedField(null);
  };

  const handleFocus = (e) => {
    setFocusedField(e.target.name);
  };

  const handleSubmit = async () => {
    const passwordError = validateField("password", formData.password);
    setErrors({ password: passwordError });
    if (passwordError) return;

    setIsLoading(true);
    try {
      const response = await fetch("https://elrefugiocountryclub.com/api/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          contrasena: formData.password,
        }),
      });

      let data = {};
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error("Servidor no respondió correctamente (no JSON)");
      }

      // Solo se permite el ingreso si el backend devuelve sesión (usuario ACTIVO).
      // Para inactivo/bloqueado/pendiente el backend responde 403 sin `user`.
      const estado = (data.user?.estatus || "").toLowerCase();
      if (response.ok && data.user && estado === "activo") {
        sessionStorage.removeItem("user");
        sessionStorage.setItem("user", JSON.stringify(data.user));
        setShowSuccess(true);
        setEstadoMsg("");
        setTimeout(() => {
          const redirectPath = getRedirectRoute(data.user.rol);
          navigate(redirectPath);
        }, 1000);
      } else {
        // No guardar sesión ni redirigir: cuenta no activa o credenciales inválidas.
        sessionStorage.removeItem("user");
        setShowSuccess(false);
        throw new Error(data.mensaje || data.message || "Usuario o contraseña incorrectos");
      }
    } catch (error) {
      setErrors({
        general:
          error.message.includes("Failed to fetch")
            ? "No se pudo conectar al servidor. Verifica que esté corriendo."
            : error.message,
      });
      setEstadoMsg("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="login-page"
      style={{
        background: `url(${image10}) no-repeat center center`,
        backgroundSize: "cover",
      }}
    >
      <div className="login-container">
        <div className="login-header">
          <img
            src={logoRefugio}
            alt="El Refugio Country Club"
            className="login-logo"
          />
          <h1 className="login-title">Bienvenido</h1>
          <p className="login-subtitle">Ingresa tus datos para continuar</p>
        </div>

        {showSuccess && (
          <div className="login-alert login-alert--success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Inicio de sesión exitoso</span>
          </div>
        )}
        {estadoMsg && (
          <div className="login-alert login-alert--warning">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{estadoMsg}</span>
          </div>
        )}
        {errors.general && (
          <div className="login-alert login-alert--error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{errors.general}</span>
          </div>
        )}

        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          noValidate
        >
          <div className={`login-field ${focusedField === "username" ? "login-field--focused" : ""} ${errors.username ? "login-field--error" : ""} ${formData.username ? "login-field--filled" : ""}`}>
            <label htmlFor="username" className="login-field__label">
              Usuario
            </label>
            <div className="login-field__input-wrap">
              <span className="login-field__icon"><UserIcon /></span>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                inputMode="text"
                value={formData.username}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                required
              />
            </div>
            {errors.username && (
              <p className="login-field__error">{errors.username}</p>
            )}
          </div>

          <div className={`login-field ${focusedField === "password" ? "login-field--focused" : ""} ${errors.password ? "login-field--error" : ""} ${formData.password ? "login-field--filled" : ""}`}>
            <label htmlFor="password" className="login-field__label">
              Contraseña
            </label>
            <div className="login-field__input-wrap">
              <span className="login-field__icon"><LockIcon /></span>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                required
              />
              <button
                type="button"
                className="login-field__toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && (
              <p className="login-field__error">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className={`login-submit ${isLoading ? "login-submit--loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="login-submit__spinner" />
                Ingresando...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>

          <button
            type="button"
            className="login-back"
            onClick={() => navigate("/")}
          >
            <ArrowLeftIcon />
            Volver al inicio
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
