import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
 import Contabilidad from './administrador/ContabilidadLocal';
import LogoutButton from './LogoutBoton';
import ReservasAdmin from './administrador/ReservasAdmin';
import HorariosPersonalizadosAdmin from './administrador/HorariosPersonalizadosAdmin';
import BloqueosAdmin from './administrador/BloqueosAdmin';
import { Search, Calendar, Clock, User, Loader, DollarSign, TrendingUp, TrendingDown, Download, Filter, CalendarCheck, FileText, UserPlus, Ban } from 'lucide-react';
import '../CSS/AdminPanel.css';
import useAutoRefresh from '../hooks/useAutoRefresh';
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('reservas'); // 'reservas' o 'contabilidad'
  // reservations stored as an object keyed by date (yyyy-mm-dd) to match administrador/ReservasAdmin
  const [reservations, setReservations] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const searchRef = useRef(null);

  const activities = ['yoga', 'pilates', 'spinning', 'crossfit', 'zumba'];
  const categories = ['Mensualidades', 'Clases individuales', 'Equipamiento', 'Servicios', 'Mantenimiento', 'Otros'];

  const fetchReservations = useCallback(async () => {
    let mounted = true;
    try {
      const response = await axios.get('https://elrefugiocountryclub.com/api/api/reservas');
      const reservasPorFecha = {};
      response.data.forEach(reserva => {
        let fechaKey = reserva.fecha;
        if (typeof fechaKey === 'string' && fechaKey.includes('T')) {
          fechaKey = fechaKey.split('T')[0];
        } else if (typeof fechaKey === 'string' && fechaKey.length >= 10) {
          fechaKey = fechaKey.substring(0, 10);
        }
        if (!reservasPorFecha[fechaKey]) reservasPorFecha[fechaKey] = [];
        reservasPorFecha[fechaKey].push({
          ...reserva,
          time: reserva.horario,
          actividad: reserva.clase_tipo || reserva.actividad
        });
      });
      if (mounted) setReservations(reservasPorFecha);
    } catch {
      if (mounted) setReservations({});
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);
  const { isRefreshing } = useAutoRefresh(fetchReservations, { interval: 30000 });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString('es-MX');
  };

  const getActivityClass = (actividad) => {
    const classes = {
      yoga: 'activity-yoga',
      pilates: 'activity-pilates',
      spinning: 'activity-spinning',
      crossfit: 'activity-crossfit',
      zumba: 'activity-zumba'
    };
    return classes[actividad] || '';
  };

  const handleStatusChange = (id, newStatus) => {
    setReservations(prev =>
      prev.map(r => r.id === id ? { ...r, estado: newStatus } : r)
    );
    showNotification(`Estado actualizado a ${newStatus}`, 'success');
  };
  const handleLogout = () => {
    console.log('Cerrando sesión...');
    window.location.href = '/login';
    window.location.reload();
  };

  return (
    <div className="admin-container">
      {/* Logout */}
      <div className="admin-logout">
        <LogoutButton onLogout={handleLogout} size="normal" showUserName={true} />
      </div>
    

      {/* Notificación */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="header-title">Panel de Administración</h1>
            <p className="header-subtitle">Gestiona reservas y contabilidad de tu plataforma</p>
          </div>
          {isRefreshing && (
            <div className="refresh-indicator">
              <Loader size={16} className="spin" />
              <span>Actualizando...</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'reservas' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservas')}
        >
          <CalendarCheck size={20} />
          Reservas
        </button>
        <button 
          className={`tab-button ${activeTab === 'contabilidad' ? 'active' : ''}`}
          onClick={() => setActiveTab('contabilidad')}
        >
          <FileText size={20} />
          Contabilidad
        </button>
        <button
          className={`tab-button ${activeTab === 'horarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('horarios')}
        >
          <Clock size={20} />
          Horarios Extras
        </button>
        <button
          className={`tab-button ${activeTab === 'bloqueos' ? 'active' : ''}`}
          onClick={() => setActiveTab('bloqueos')}
        >
          <Ban size={20} />
          Bloqueos
        </button>
      </div>

      {/* CONTENIDO: render components that provide the actual data/views */}
      {activeTab === 'reservas' && (
        <div>
          <ReservasAdmin reservations={reservations} />
        </div>
      )}

      {activeTab === 'horarios' && (
        <HorariosPersonalizadosAdmin />
      )}

      {activeTab === 'bloqueos' && (
        <BloqueosAdmin />
      )}

      {activeTab === 'contabilidad' && (
        <div>
          <Contabilidad />
        </div>
      )}
    </div>
  );
};

export default AdminPanel;