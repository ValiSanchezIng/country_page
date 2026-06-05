import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const user = sessionStorage.getItem('user');
      console.log('Verificando autenticación:', { user: !!user, path: location.pathname });
      
      if (user) {
        try {
          const parsedUser = JSON.parse(user);
          // Verificar que el usuario tenga los campos necesarios
          if (parsedUser && parsedUser.id && parsedUser.nombre) {
            console.log('Usuario autenticado:', parsedUser.nombre);
            setIsAuthenticated(true);
          } else {
            console.log('Datos de usuario inválidos, limpiando sessionStorage');
            // Si los datos están corruptos, limpiar sessionStorage
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('instructorData');
            sessionStorage.removeItem('userData');
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.log('Error al parsear usuario, limpiando sessionStorage:', error);
          // Si hay error al parsear, limpiar sessionStorage
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('instructorData');
          sessionStorage.removeItem('userData');
          setIsAuthenticated(false);
        }
      } else {
        console.log('No hay usuario en sessionStorage');
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    // Verificar inmediatamente
    checkAuth();

    // Escuchar cambios en sessionStorage (cuando se hace logout desde otra pestaña)
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === null) {
        console.log('Cambio en sessionStorage detectado');
        checkAuth();
      }
    };

    // Escuchar cuando la ventana vuelve a tener foco
    const handleFocus = () => {
      console.log('Ventana recuperó el foco, verificando autenticación');
      checkAuth();
    };

    // Escuchar cambios de visibilidad de la página
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Página visible, verificando autenticación');
        checkAuth();
      }
    };

    // Solución para navegadores: recargar si la página se muestra desde el historial y no hay sesión
    const handlePageShow = (event) => {
      const user = sessionStorage.getItem('user');
      if (!user && event.persisted) {
        // Si no hay sesión y la página viene del historial, recargar
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div>Verificando sesión...</div>
        <div style={{ fontSize: '0.9rem', color: '#999' }}>
          Ruta: {location.pathname}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Usuario no autenticado, redirigiendo a login');
    // Forzar limpieza completa antes de redirigir
    sessionStorage.clear();
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute; 