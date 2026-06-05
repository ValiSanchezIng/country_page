"use client"

import React, { useState } from 'react'
import Button from './ui/button'
import './css/booking-modal.css'
import { toast } from 'react-toastify'

export function ChangePasswordModal({ isOpen, onClose }) {
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [showOldPass, setShowOldPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!oldPass) {
      toast.error('Debes ingresar tu contraseña actual')
      return
    }
    if (newPass.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }
    if (newPass !== confirmPass) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    // Obtener datos del usuario desde sessionStorage
    const userDataStr = sessionStorage.getItem('user');
    if (!userDataStr) {
      toast.error('No se encontró información del usuario');
      return;
    }

    let userData;
    try {
      userData = JSON.parse(userDataStr);
    } catch (error) {
      toast.error('Error al leer datos del usuario');
      return;
    }

    setLoading(true)
    
    try {
      // Actualizar contraseña enviando la contraseña actual para validación
      const updateResponse = await fetch(`https://elrefugiocountryclub.com/api/api/users/update-password/${userData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: newPass,
          currentPassword: oldPass
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Error al actualizar la contraseña');
      }

      // El backend ya envía el email automáticamente si el usuario tiene correo
      toast.success('Contraseña actualizada correctamente');

      // Limpiar el formulario y cerrar
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
      onClose();

    } catch (error) {
      toast.error(error.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bm-overlay">
      <div className="bm-backdrop" onClick={onClose} />
      <div className="bm-modal">
        <div className="bm-header">
          <h3 className="bm-title">Cambiar contraseña</h3>
          <p className="bm-subtitle">Introduce tu contraseña actual y la nueva.</p>
        </div>

        <div className="bm-body">
          <div className="bm-password-field">
            <label className="bm-label">Contraseña actual</label>
            <div className="bm-password-input-wrapper">
              <input 
                className="bm-password-input" 
                type={showOldPass ? "text" : "password"} 
                value={oldPass} 
                onChange={(e)=>setOldPass(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
              />
              <button
                type="button"
                className="bm-password-toggle"
                onClick={() => setShowOldPass(!showOldPass)}
                aria-label={showOldPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showOldPass ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="bm-password-field">
            <label className="bm-label">Nueva contraseña</label>
            <div className="bm-password-input-wrapper">
              <input 
                className="bm-password-input" 
                type={showNewPass ? "text" : "password"} 
                value={newPass} 
                onChange={(e)=>setNewPass(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                className="bm-password-toggle"
                onClick={() => setShowNewPass(!showNewPass)}
                aria-label={showNewPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showNewPass ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="bm-password-field">
            <label className="bm-label">Confirmar contraseña</label>
            <div className="bm-password-input-wrapper">
              <input 
                className="bm-password-input" 
                type={showConfirmPass ? "text" : "password"} 
                value={confirmPass} 
                onChange={(e)=>setConfirmPass(e.target.value)}
                placeholder="Confirma tu nueva contraseña"
              />
              <button
                type="button"
                className="bm-password-toggle"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                aria-label={showConfirmPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirmPass ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bm-actions">
          <Button variant="outline" onClick={onClose} className="bm-btn bm-btn--outline">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bm-btn bm-btn--primary">{loading ? 'Guardando...' : 'Cambiar contraseña'}</Button>
        </div>
      </div>
    </div>
  )
}

export default ChangePasswordModal
