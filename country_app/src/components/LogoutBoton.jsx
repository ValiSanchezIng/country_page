import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import './instructor/LogoutBar.css';

const LogoutButton = ({ 
  userName = "Usuario", 
  onLogout, 
  showUserName = true,
}) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);

    console.log('Cerrando sesión y limpiando datos...');
    
    // ✅ Limpiar datos de sesión completamente
    sessionStorage.clear(); // Limpia todo el sessionStorage
    sessionStorage.clear(); // Limpia también sessionStorage por si acaso

    // ✅ Llamar función de logout si existe
    if (onLogout) {
      onLogout();
    }

    // ✅ Forzar recarga completa de la página para asegurar limpieza
    console.log('Redirigiendo al login...');
    window.location.href = '/login';
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        flexWrap: 'nowrap'
      }}>
        {showUserName && (
          <span className="logoutbar-user">
            {userName}
          </span>
        )}

        <button
          onClick={handleLogoutClick}
          style={{
            background: 'var(--cream-overlay)',
            border: '2px solid rgba(255,255,255,0.3)',
            color: 'var(--primary-brown)',
            padding: '0.4rem 0.8rem',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--medium-shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-primary)',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.6)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'var(--cream-overlay)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          <LogOut size={18} />
          <span>Salir</span>
        </button>
      </div>

      {/* 🔥 Modal de confirmación */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: 'var(--radius-xl)',
            maxWidth: '400px',
            width: '90%',
            boxShadow: 'var(--medium-shadow)',
            fontFamily: 'var(--font-primary)'
          }}>
            <h3 style={{ margin: 0, color: 'var(--primary-brown)', fontSize: '1.2rem', fontWeight: 'bold' }}>
              Confirmar Cierre de Sesión
            </h3>
            <p style={{ marginTop: '0.5rem', color: 'var(--charcoal)', fontSize: '0.95rem' }}>
              ¿Estás seguro de que quieres cerrar sesión?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button 
                onClick={cancelLogout}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmLogout}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--primary-brown)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  boxShadow: 'var(--medium-shadow)'
                }}
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogoutButton;
