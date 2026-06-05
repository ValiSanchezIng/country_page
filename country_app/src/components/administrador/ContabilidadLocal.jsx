import { useState, useEffect, useRef, useCallback } from "react"
import ReactDOM from "react-dom"
import "../../CSS/Contabilidad.css"
import LogoutButton from '../LogoutBoton'
import { UserPlus, Eye, XCircle, CheckCircle, Loader, Search, History, AlertTriangle, Clock, AlertCircle, Edit } from "lucide-react"
import useRoleGuard from '../../hooks/useRoleGuard';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const MembershipAdminDashboardLocal = () => {
  useRoleGuard(['admin', 'contabilidad']);

  const [members, setMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [addClientModalOpen, setAddClientModalOpen] = useState(false)
  const [paymentHistoryModalOpen, setPaymentHistoryModalOpen] = useState(false)
  const [editPaymentModalOpen, setEditPaymentModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [originalMember, setOriginalMember] = useState(null)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [editingPayment, setEditingPayment] = useState(null)
  const [newPayment, setNewPayment] = useState({
    monto: "",
    fecha_pago: "",
    concepto: "",
    estatus_pago: "pagado",
    observaciones: "",
  })
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })
  const [creatingClient, setCreatingClient] = useState(false)
  const [paymentCounts, setPaymentCounts] = useState({})
  const [paymentStatus, setPaymentStatus] = useState({})
  const [withoutEmail, setWithoutEmail] = useState(false)
  const [previewCredentials, setPreviewCredentials] = useState({ username: "", password: "" })
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false)
  const [copyMessage, setCopyMessage] = useState("")
  const [userCreatedSuccessfully, setUserCreatedSuccessfully] = useState(false)
  const [newClient, setNewClient] = useState({
    nombre: "",
    apellido: "",
    email: "",
    monto: "",
    fecha_pago: "",
    proxima_fecha: "",
    metodo_pago: "efectivo",
  })

  // Refs para controlar foco y autofill
  const searchRef = useRef(null)
  const editFirstInputRef = useRef(null)
  const addFirstInputRef = useRef(null)

  const capitalizeStatus = (status) => {
    if (!status) return "Activo"
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  // Función para obtener icono y estilo de alerta de pago
  const getPaymentAlert = (memberId) => {
    const status = paymentStatus[memberId]
    if (!status) return null
    
    switch (status.estado_pago) {
      case 'vencido':
        return {
          icon: <AlertTriangle size={14} />,
          className: 'payment-alert payment-alert-overdue',
          title: `Pago vencido. Venció: ${status.proxima_fecha}`,
          text: 'VENCIDO'
        }
      case 'proximo_vencer':
        return {
          icon: <Clock size={14} />,
          className: 'payment-alert payment-alert-due-soon',
          title: `Próximo a vencer en ${status.dias_restantes} días. Vence: ${status.proxima_fecha}`,
          text: `${status.dias_restantes}d`
        }
      default:
        return null
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0]
  }

  // Funciones para generar credenciales en frontend (solo para vista previa)
  const generateSecurePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const allChars = uppercase + lowercase + numbers;
    
    let password = '';
    // Asegurar al menos 1 mayúscula, 1 minúscula y 1 número
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    
    // Completar con caracteres aleatorios hasta llegar a 8
    for (let i = 3; i < 8; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mezclar los caracteres
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const normalizeText = (text, maxLength = 10) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .substring(0, maxLength);
  };

  const getFirstWord = (text) => {
    const firstWord = text.trim().split(/\s+/)[0];
    return normalizeText(firstWord, 8);
  };

  const generatePreviewUsername = (nombre, apellido) => {
    if (!nombre.trim() || !apellido.trim()) return '';
    
    const primerNombre = getFirstWord(nombre);
    const primerApellido = getFirstWord(apellido);
    
    let baseUsername = `${primerNombre}.${primerApellido}`;
    
    if (baseUsername.length < 4) {
      baseUsername = primerNombre + primerApellido;
    }
    
    if (baseUsername.length > 15) {
      const apellidoTruncado = primerApellido.substring(0, 15 - primerNombre.length - 1);
      baseUsername = `${primerNombre}.${apellidoTruncado}`;
    }
    
    return baseUsername;
  };

  // Función para obtener las credenciales reales del servidor (con verificación de duplicados)
  const getRealCredentials = async (nombre, apellido, customPassword = null) => {
    try {
      const response = await fetch("https://elrefugiocountryclub.com/api/api/users/preview-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, apellido, customPassword }),
      })
      
      if (response.ok) {
        const result = await response.json()
        return result.credentials
      }
    } catch (error) {
      console.error("Error obteniendo credenciales reales:", error)
    }
    return null
  }

  // Función para formatear números con separadores de miles
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return ""
    const num = parseFloat(amount)
    if (isNaN(num)) return ""
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }

  // Función para mostrar notificaciones
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" })
    }, 4000) // Ocultar después de 4 segundos
  }

  // Función para cargar conteo de pagos
  const loadPaymentCounts = useCallback(async () => {
    try {
      const response = await fetch("https://elrefugiocountryclub.com/api/api/users/payment-counts")
      if (response.ok) {
        const counts = await response.json()
        const countsMap = {}
        counts.forEach(item => {
          countsMap[item.id_usuario] = item.total_pagos
        })
        setPaymentCounts(countsMap)
      }
    } catch (error) {
      console.error("Error cargando conteo de pagos:", error)
    }
  }, [])

  // Función para cargar estado de pagos (vencidos, próximos a vencer)
  const loadPaymentStatus = useCallback(async () => {
    try {
      const response = await fetch("https://elrefugiocountryclub.com/api/api/users/payment-status")
      if (response.ok) {
        const status = await response.json()
        const statusMap = {}
        status.forEach(item => {
          statusMap[item.id] = {
            estado_pago: item.estado_pago,
            dias_restantes: item.dias_restantes,
            proxima_fecha: item.proxima_fecha
          }
        })
        setPaymentStatus(statusMap)
      }
    } catch (error) {
      console.error("Error cargando estado de pagos:", error)
    }
  }, [])

  // Función que refresca todos los datos de contabilidad
  const refreshAllData = useCallback(async () => {
    await Promise.all([refreshUsersList(true), loadPaymentCounts(), loadPaymentStatus()])
  }, [refreshUsersList, loadPaymentCounts, loadPaymentStatus])

  useEffect(() => {
    refreshUsersList()
    loadPaymentCounts()
    loadPaymentStatus()
  }, [])

  const anyModalOpen = modalOpen || addClientModalOpen || paymentHistoryModalOpen || editPaymentModalOpen
  useAutoRefresh(refreshAllData, { interval: 30000, enabled: !anyModalOpen })

  // Generar credenciales de vista previa cuando cambian nombre/apellido
  useEffect(() => {
    if (withoutEmail && newClient.nombre && newClient.apellido) {
      // Usar credenciales reales del servidor
      const updateRealCredentials = async () => {
        try {
          const password = previewCredentials.password || generateSecurePassword();
          const realCredentials = await getRealCredentials(newClient.nombre, newClient.apellido, password);
          if (realCredentials) {
            setPreviewCredentials(realCredentials);
          }
        } catch (error) {
          console.error('Error al obtener credenciales reales:', error);
          // Fallback a credenciales de vista previa
          const username = generatePreviewUsername(newClient.nombre, newClient.apellido);
          const password = previewCredentials.password || generateSecurePassword();
          setPreviewCredentials({ username, password });
        }
      };
      updateRealCredentials();
    } else if (!withoutEmail) {
      setPreviewCredentials({ username: "", password: "" });
    }
  }, [withoutEmail, newClient.nombre, newClient.apellido]);

  // Obtener usuario actual del sessionStorage
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  }, []);

  // Bloquear scroll cuando un modal está abierto
  useEffect(() => {
    const anyModalOpen = modalOpen || addClientModalOpen || paymentHistoryModalOpen
    if (anyModalOpen) document.body.classList.add("no-scroll")
    else document.body.classList.remove("no-scroll")
    return () => document.body.classList.remove("no-scroll")
  }, [modalOpen, addClientModalOpen, paymentHistoryModalOpen])

  // Cerrar con ESC
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (modalOpen) closeModal()
        if (addClientModalOpen) closeAddClientModal()
        if (paymentHistoryModalOpen) closePaymentHistoryModal()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [modalOpen, addClientModalOpen, paymentHistoryModalOpen])

  const normalize = (str) => (str || "").toLowerCase().replace(/\s+/g, "")
  const filteredMembers = members
    .filter((member) => member.rol === "cliente")
    .filter(
      (member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (statusFilter === "" || normalize(member.status) === normalize(statusFilter)),
    )

  const openModal = (member) => {
    setSelectedMember(member)
    setOriginalMember({ ...member })
    // Quitar foco del buscador (evita que el navegador “recuerde” y escriba algo)
    searchRef.current?.blur()
    setModalOpen(true)
    // Enfocar el primer input del modal
    setTimeout(() => editFirstInputRef.current?.focus(), 0)
  }

  const closeModal = () => {
    setSelectedMember(null)
    setOriginalMember(null)
    setModalOpen(false)
  }

  const openAddClientModal = () => {
    setNewClient({
      nombre: "",
      apellido: "",
      email: "",
      monto: "",
      fecha_pago: "",
      proxima_fecha: "",
      metodo_pago: "efectivo",
    })
    setWithoutEmail(false)
    setPreviewCredentials({ username: "", password: "" })
    setUserCreatedSuccessfully(false)
    searchRef.current?.blur() // Quitar foco del buscador
    setAddClientModalOpen(true)
    setTimeout(() => addFirstInputRef.current?.focus(), 0)
  }

  const closeAddClientModal = () => {
    setAddClientModalOpen(false)
    setWithoutEmail(false)
    setPreviewCredentials({ username: "", password: "" })
    setUserCreatedSuccessfully(false)
    setNewClient({
      nombre: "",
      apellido: "",
      email: "",
      monto: "",
      fecha_pago: "",
      proxima_fecha: "",
      metodo_pago: "efectivo",
    })
  }

  const openPaymentHistoryModal = async (member) => {
    setSelectedMember(member)
    setNewPayment({
      monto: "",
      fecha_pago: "",
      concepto: "",
      estatus_pago: "pagado",
      observaciones: "",
    })
    
    // Cargar historial de pagos
    try {
      const response = await fetch(`https://elrefugiocountryclub.com/api/api/users/payment-history/${member.id}`)
      if (response.ok) {
        const history = await response.json()
        setPaymentHistory(history)
      } else {
        setPaymentHistory([])
      }
    } catch (error) {
      console.error("Error cargando historial:", error)
      setPaymentHistory([])
    }
    
    setPaymentHistoryModalOpen(true)
  }

  const closePaymentHistoryModal = () => {
    setPaymentHistoryModalOpen(false)
    setSelectedMember(null)
    setPaymentHistory([])
    setNewPayment({
      monto: "",
      fecha_pago: "",
      concepto: "",
      estatus_pago: "pagado",
      observaciones: "",
    })
  }

  // Funciones para el modal de edición de pagos
  const openEditPaymentModal = (payment) => {
    setEditingPayment({
      ...payment,
      fecha_pago: formatDate(payment.fecha_pago)
    })
    setEditPaymentModalOpen(true)
  }

  const closeEditPaymentModal = () => {
    setEditPaymentModalOpen(false)
    setEditingPayment(null)
  }

  const updatePayment = async () => {
    try {
      if (!editingPayment.monto || !editingPayment.fecha_pago || !editingPayment.concepto) {
        showNotification("Por favor completa todos los campos requeridos", "error")
        return
      }

      const response = await fetch(`https://elrefugiocountryclub.com/api/api/users/payment/${editingPayment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monto: editingPayment.monto,
          fecha_pago: editingPayment.fecha_pago,
          concepto: editingPayment.concepto,
          estatus_pago: editingPayment.estatus_pago || "pagado",
          observaciones: editingPayment.observaciones || null,
        }),
      })

      if (response.ok) {
        // Recargar el historial de pagos
        await openPaymentHistoryModal(selectedMember)
        
        // Actualizar conteos y estados
        loadPaymentCounts()
        loadPaymentStatus()
        
        // Mostrar notificación y cerrar modal
        showNotification("Pago actualizado correctamente", "success")
        closeEditPaymentModal()
      } else {
        const error = await response.json()
        showNotification("Error al actualizar pago: " + (error?.error ?? "Error desconocido"), "error")
      }
    } catch (error) {
      console.error("Error actualizando pago:", error)
      showNotification("Error al actualizar pago", "error")
    }
  }

  const addNewPayment = async () => {
    try {
      if (!newPayment.monto || !newPayment.fecha_pago || !newPayment.concepto) {
        showNotification("Por favor completa todos los campos requeridos del pago", "error")
        return
      }

      const paymentData = {
        cliente_id: selectedMember.id,
        monto: parseFloat(newPayment.monto),
        fecha_pago: newPayment.fecha_pago,
        concepto: newPayment.concepto,
        estatus_pago: newPayment.estatus_pago || "pagado",
        observaciones: newPayment.observaciones || null
      }

      const response = await fetch("https://elrefugiocountryclub.com/api/api/users/add-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      })

      if (response.ok) {
        // Recargar historial de pagos
        const historyResponse = await fetch(`https://elrefugiocountryclub.com/api/api/users/payment-history/${selectedMember.id}`)
        if (historyResponse.ok) {
          const history = await historyResponse.json()
          setPaymentHistory(history)
        }
        
        // Actualizar lista de usuarios
        refreshUsersList()
        
        // Actualizar conteo de pagos
        loadPaymentCounts()
        loadPaymentStatus()
        
        // Mostrar notificación de éxito
        showNotification("Pago agregado correctamente", "success")
        
        // Cerrar modal después de un breve delay
        setTimeout(() => {
          closePaymentHistoryModal()
        }, 1500)
        
      } else {
        const error = await response.json()
        showNotification("Error al agregar pago: " + (error?.error ?? "Error desconocido"), "error")
      }
    } catch (error) {
      showNotification("Error de conexión. Inténtalo de nuevo.", "error")
    }
  }

  const createNewClient = async () => {
    if (creatingClient) return;
    setCreatingClient(true);
    try {
      if (!newClient.nombre || !newClient.apellido) {
        showNotification("Por favor completa el nombre y apellido del cliente", "error")
        return;
      }
      
      // Validación específica para usuarios con email
      if (!withoutEmail) {
        if (!newClient.email) {
          showNotification("Por favor completa el email del cliente", "error")
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(newClient.email)) {
          showNotification("Por favor ingresa un email válido", "error")
          return;
        }
      }
      
      // Validación de contraseña para usuarios sin email
      if (withoutEmail) {
        if (!previewCredentials.password || previewCredentials.password.length < 5) {
          showNotification("La contraseña debe tener al menos 5 caracteres", "error")
          return;
        }
      }
      
      if (newClient.monto === "" || newClient.monto === null || newClient.monto === undefined || !newClient.fecha_pago || !newClient.proxima_fecha) {
        showNotification("Por favor completa toda la información de pagos", "error")
        return;
      }
      
      // Validar que la fecha de próximo pago no sea anterior a la fecha de pago
      const fechaPago = new Date(newClient.fecha_pago)
      const proximaFecha = new Date(newClient.proxima_fecha)
      if (proximaFecha < fechaPago) {
        showNotification("La fecha de próximo pago no puede ser anterior a la fecha de pago", "error")
        return;
      }

      // Preparar datos del cliente
      const clientData = {
        ...newClient,
        withoutEmail: withoutEmail,
        ...(withoutEmail && previewCredentials.password && {
          customPassword: previewCredentials.password
        })
      }

      const response = await fetch("https://elrefugiocountryclub.com/api/api/users/register-cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      })
      
      if (response.ok) {
        const result = await response.json()
        refreshUsersList()
        loadPaymentCounts()
        loadPaymentStatus()
        
        // Si es usuario sin email, cerrar modal inmediatamente después de crear
        if (withoutEmail && result.credentials) {
          // Actualizar las credenciales con las reales del servidor (incluyendo numeración si existe)
          setPreviewCredentials({
            username: result.credentials.username,
            password: result.credentials.password
          })
          setUserCreatedSuccessfully(true)
          
          // Mostrar notificación y cerrar modal inmediatamente
          showNotification(
            `✅ Usuario creado: ${result.credentials.username}`, 
            "success"
          )
          
          closeAddClientModal()
          return; // No continuar con el flujo normal
        }
        
        closeAddClientModal()
        showNotification(
          withoutEmail 
            ? "Cliente registrado correctamente. Las credenciales están listas para distribución manual." 
            : "Cliente registrado correctamente. Las credenciales se han enviado por email.", 
          "success"
        )
      } else {
        const error = await response.json()
        showNotification("Error al crear cliente: " + (error?.error ?? "Error desconocido"), "error")
      }
    } catch (error) {
      showNotification("Error de conexión. Inténtalo de nuevo.", "error")
    } finally {
      setCreatingClient(false);
    }
  }

  const refreshUsersList = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    return fetch("https://elrefugiocountryclub.com/api/api/users/users-with-payments")
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((u) => ({
          id: u.id,
          name: u.nombre + (u.apellido ? " " + u.apellido : ""),
          email: u.email || "",
          status: capitalizeStatus(u.estatus),
          monthlyFee: u.monto || 0,
          paymentDate: "",
          lastPaymentDate: u.fecha_pago || "",
          proximaFecha: u.proxima_fecha || "",
          rol: u.rol || "",
        }))
        setMembers(mapped)
        if (!silent) setLoading(false)
      })
      .catch(() => {
        setMembers([])
        if (!silent) setLoading(false)
      })
  }, [])

  const saveMemberChanges = async () => {
    try {
      const changes = {}
      let hasChanges = false

      if (selectedMember.monthlyFee !== originalMember.monthlyFee) {
        changes.monto = selectedMember.monthlyFee || 0
        hasChanges = true
      }
      if (selectedMember.lastPaymentDate !== originalMember.lastPaymentDate) {
        if (!selectedMember.lastPaymentDate) {
          showNotification("Por favor completa la fecha de último pago", "error")
          return
        }
        changes.fecha_pago = selectedMember.lastPaymentDate
        hasChanges = true
      }
      // Nota: proxima_fecha no existe en la tabla contabilidad, se maneja a través del historial de pagos

      if (!hasChanges) {
        closeModal()
        return
      }

      changes.id_usuario = selectedMember.id

      const paymentResponse = await fetch("https://elrefugiocountryclub.com/api/api/users/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      })

      if (paymentResponse.ok) {
        setMembers((prev) => prev.map((m) => (m.id === selectedMember.id ? selectedMember : m)))
        closeModal()
        showNotification("Información de pago actualizada correctamente", "success")
      } else {
        const error = await paymentResponse.json()
        showNotification("Error al guardar información de pago: " + (error?.error ?? "Error desconocido"), "error")
      }
    } catch {
      showNotification("Error de conexión. Inténtalo de nuevo.", "error")
    }
  }

  const isPaymentExpired = (paymentDate) => {
    const today = new Date()
    const payment = new Date(paymentDate)
    if (isNaN(payment.getTime())) return false
    return today > payment
  }

  // Solo usuarios con rol cliente
  const clientMembers = members.filter(m => m.rol === "cliente")
  const totalUsers = clientMembers.length
  const activeUsers = clientMembers.filter((m) => m.status === "Activo" && !isPaymentExpired(m.paymentDate)).length
  const blockedUsers = clientMembers.filter(
    (m) => m.status === "Bloqueado" || (m.status === "Activo" && isPaymentExpired(m.paymentDate)),
  ).length
  const pendingUsers = clientMembers.filter((m) => m.status === "Pendiente").length

  const renderPortal = (node) => ReactDOM.createPortal(node, document.body)

  return (
    <div className="dashboard-container">

      {/* ESTADÍSTICAS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-topline" style={{ backgroundColor: "#c17b4a" }}></div>
          <div className="stat-title">Usuarios Totales</div>
          <div className="stat-value">{totalUsers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-topline" style={{ backgroundColor: "#9caf88" }}></div>
          <div className="stat-title">Activos</div>
          <div className="stat-value">{activeUsers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-topline" style={{ backgroundColor: "#8b5a2b" }}></div>
          <div className="stat-title">Bloqueados</div>
          <div className="stat-value">{blockedUsers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-topline" style={{ backgroundColor: "#d4a574" }}></div>
          <div className="stat-title">Pendientes</div>
          <div className="stat-value">{pendingUsers}</div>
        </div>
      </div>

      {/* CONTROLES */}
      <div className="controls-container enhanced-controls">
        <div className="controls-inner">
          <div className="search-filter-group enhanced-search-filter">
            <Search size={18} className="search-icon external-search-icon" />
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                ref={searchRef}
                autoComplete="off"
                name="dashboard-search"
                autoCorrect="off"
                spellCheck={false}
                inputMode="search"
                data-lpignore="true"
                data-form-type="other"
              />
            </div>
            <div className="filter-box">
              <select className="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Todos</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="Bloqueado">Bloqueado</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </div>
          </div>
          {/* Removed button from controls-inner as it's now in header-actions */}
        </div>
      </div>

      {/* TABLA */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(107,68,35,0.06)",
          }}
        >
          <Loader size={40} className="spin" style={{ color: "var(--terracotta)", marginBottom: "1rem" }} />
          <div
            style={{
              color: "var(--primary-brown)",
              fontSize: "1.1rem",
              fontWeight: "600",
            }}
          >
            Cargando usuarios...
          </div>
        </div>
      ) : (
        <div style={{ overflow: "hidden", borderRadius: "16px" }}>
          <table className="members-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Mensualidad</th>
                <th>Último Pago</th>
                <th>Próximo Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      color: "var(--terracotta)",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                    }}
                  >
                    {searchTerm || statusFilter
                      ? "No se encontraron usuarios con los filtros aplicados."
                      : "No hay usuarios con rol de cliente."}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const expired = isPaymentExpired(member.paymentDate)
                  const displayStatus = expired && member.status === "Activo" ? "Bloqueado" : member.status

                  return (
                    <tr key={member.id}>
                      <td style={{ fontWeight: "600" }}>{member.name}</td>
                      <td>
                        {member.email ? (
                          <span style={{ color: "var(--stone-gray)" }}>{member.email}</span>
                        ) : (
                          <span
                            style={{
                              color: "#dc3545",
                              fontWeight: "bold",
                              fontSize: "13px",
                              fontStyle: "italic",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
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
                        <select
                          className="status-badge"
                          value={member.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value
                            try {
                              const response = await fetch(
                                `https://elrefugiocountryclub.com/api/api/users/update-status/${member.id}`,
                                {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ estado: newStatus }),
                                },
                              )
                              if (response.ok) {
                                setMembers((prev) =>
                                  prev.map((m) => (m.id === member.id ? { ...m, status: newStatus } : m)),
                                )
                                showNotification("Estado actualizado correctamente", "success")
                              } else {
                                const error = await response.json()
                                showNotification("Error al actualizar el estado: " + (error?.error ?? "Error desconocido"), "error")
                              }
                            } catch {
                              showNotification("Error de conexión. Inténtalo de nuevo.", "error")
                            }
                          }}
                          style={{
                            borderColor:
                              displayStatus === "Activo"
                                ? "#9caf88"
                                : displayStatus === "Inactivo"
                                  ? "#c17b4a"
                                  : displayStatus === "Pendiente"
                                    ? "#d4a574"
                                    : "#8b5a2b",
                            color:
                              displayStatus === "Activo"
                                ? "#9caf88"
                                : displayStatus === "Inactivo"
                                  ? "#c17b4a"
                                  : displayStatus === "Pendiente"
                                    ? "#d4a574"
                                    : "#8b5a2b",
                          }}
                        >
                          <option value="Activo">Activo</option>
                          <option value="Inactivo">Inactivo</option>
                          <option value="Bloqueado">Bloqueado</option>
                          <option value="Pendiente">Pendiente</option>
                        </select>
                      </td>
                      <td style={{ fontWeight: "600", color: "var(--primary-brown)" }}>${formatCurrency(member.monthlyFee)}</td>
                      <td>{formatDate(member.lastPaymentDate)}</td>
                      <td
                        style={{
                          color: expired ? "#8b5a2b" : "var(--charcoal)",
                          fontWeight: expired ? "600" : "500",
                        }}
                      >
                        {formatDate(member.proximaFecha) || "-"}
                      </td>
                      <td>
                        <button
                          className="btn history-btn"
                          onClick={() => openPaymentHistoryModal(member)}
                          type="button"
                          style={{
                            background: "linear-gradient(135deg, var(--terracotta), var(--primary-brown))",
                            color: "white",
                            border: "none",
                            position: "relative",
                          }}
                        >
                          <History size={16} /> Historial
                          {paymentCounts[member.id] && paymentCounts[member.id] > 0 && (
                            <span className="payment-badge">
                              {paymentCounts[member.id]}
                            </span>
                          )}
                          {/* Alerta de pago vencido o próximo a vencer */}
                          {(() => {
                            const alert = getPaymentAlert(member.id)
                            return alert ? (
                              <span 
                                className={alert.className}
                                title={alert.title}
                              >
                                {alert.icon}
                                <span className="alert-text">{alert.text}</span>
                              </span>
                            ) : null
                          })()}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL EDITAR (Portal) */}
      {modalOpen &&
        selectedMember &&
        renderPortal(
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{selectedMember.name}</h2>
              <div className="modal-field">
                <label>Monto Mensualidad:</label>
                <input
                  type="number"
                  value={selectedMember.monthlyFee === 0 ? "" : selectedMember.monthlyFee}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedMember({
                      ...selectedMember,
                      monthlyFee: val === "" ? "" : Number.parseFloat(val)
                    });
                  }}
                  ref={editFirstInputRef}
                  autoComplete="off"
                  inputMode="decimal"
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>
              <div className="modal-field">
                <label>Último Pago:</label>
                <input
                  type="date"
                  value={formatDate(selectedMember.lastPaymentDate)}
                  onChange={(e) => setSelectedMember({ ...selectedMember, lastPaymentDate: e.target.value })}
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>
              <div className="modal-field">
                <label>Próximo Pago:</label>
                <input
                  type="date"
                  value={formatDate(selectedMember.paymentDate)}
                  onChange={(e) => setSelectedMember({ ...selectedMember, paymentDate: e.target.value })}
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>
              <div className="modal-actions">
                <button className="btn" onClick={saveMemberChanges} type="button">
                  <CheckCircle size={16} /> Guardar
                </button>
                <button className="btn" onClick={closeModal} type="button">
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
        )}

      {/* MODAL AGREGAR CLIENTE (Portal) */}
      {addClientModalOpen &&
        renderPortal(
          <div className="modal-overlay" onClick={closeAddClientModal}>
            <div className="modal-content add-client-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Agregar Nuevo Cliente</h2>

              <div className="modal-section">
                <h3>Información Personal</h3>
                <div style={{background: 'rgba(139, 111, 78, 0.1)', border: '1px solid rgba(139, 111, 78, 0.3)', borderRadius: '8px', padding: '12px', margin: '10px 0 20px 0', fontSize: '14px', color: '#8b6f4e'}}>
                  🔑 <strong>Credenciales automáticas:</strong> El username y contraseña se generarán automáticamente y se enviarán por email al cliente.
                </div>
                <div className="modal-field">
                  <label>Nombre *:</label>
                  <input
                    type="text"
                    value={newClient.nombre}
                    onChange={(e) => setNewClient({ ...newClient, nombre: e.target.value })}
                    placeholder="Ingresa el nombre"
                    ref={addFirstInputRef}
                    autoComplete="off"
                    name="newclient-name"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-form-type="other"
                  />
                </div>
                <div className="modal-field">
                  <label>Apellido *:</label>
                  <input
                    type="text"
                    value={newClient.apellido}
                    onChange={(e) => setNewClient({ ...newClient, apellido: e.target.value })}
                    placeholder="Ingresa el apellido"
                    autoComplete="off"
                    name="newclient-lastname"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-form-type="other"
                  />
                </div>
                <div className="modal-field" style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  <label style={{color: withoutEmail ? '#999' : 'inherit'}}>
                    Email {!withoutEmail && '*'}:
                  </label>
                  <input
                    type="email"
                    value={withoutEmail ? '' : newClient.email}
                    onChange={(e) => !withoutEmail && setNewClient({ ...newClient, email: e.target.value })}
                    placeholder={withoutEmail ? "Email deshabilitado" : "ejemplo@email.com"}
                    autoComplete="off"
                    name="newclient-email"
                    inputMode="email"
                    data-lpignore="true"
                    data-form-type="other"
                    disabled={withoutEmail}
                    style={{
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      backgroundColor: withoutEmail ? '#f5f5f5' : 'white',
                      color: withoutEmail ? '#999' : 'inherit',
                      cursor: withoutEmail ? 'not-allowed' : 'text'
                    }}
                  />
                  <label style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    cursor: 'pointer', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#495057',
                    marginTop: '4px'
                  }} onClick={() => setWithoutEmail(!withoutEmail)}>
                    <input
                      type="checkbox"
                      checked={withoutEmail}
                      onChange={(e) => setWithoutEmail(e.target.checked)}
                      style={{width: '16px', height: '16px'}}
                    />
                    Usuario sin correo electrónico
                  </label>
                  {withoutEmail && (
                    <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                      Las credenciales se mostrarán para distribución manual
                    </div>
                  )}
                </div>

                {withoutEmail && previewCredentials.username && (
                  <div style={{
                    background: userCreatedSuccessfully ? '#d4edda' : '#fff3cd', 
                    border: `1px solid ${userCreatedSuccessfully ? '#c3e6cb' : '#ffeaa7'}`, 
                    borderRadius: '6px', 
                    padding: '15px', 
                    marginBottom: '15px'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                      <h4 style={{margin: 0, color: userCreatedSuccessfully ? '#155724' : '#856404', fontSize: '14px'}}>
                        {userCreatedSuccessfully ? '🎉 ¡Usuario creado exitosamente!' : '⚠️ Credenciales a crear:'}
                      </h4>
                      <button
                        type="button"
                        onClick={async () => {
                          if (userCreatedSuccessfully) {
                            // Si ya se creó, usar las credenciales que ya tenemos
                            const credentialsText = `Username: ${previewCredentials.username}\nContraseña: ${previewCredentials.password}`;
                            navigator.clipboard.writeText(credentialsText);
                            setCopyMessage("Texto copiado");
                            setTimeout(() => setCopyMessage(""), 2000);
                          } else {
                            // Si no se ha creado, obtener credenciales reales del servidor
                            setCopyMessage("Obteniendo credenciales reales...");
                            const realCredentials = await getRealCredentials(
                              newClient.nombre, 
                              newClient.apellido, 
                              previewCredentials.password
                            );
                            
                            if (realCredentials) {
                              // Actualizar la vista con las credenciales reales
                              setPreviewCredentials(realCredentials);
                              // Copiar las credenciales reales
                              const credentialsText = `Username: ${realCredentials.username}\nContraseña: ${realCredentials.password}`;
                              navigator.clipboard.writeText(credentialsText);
                              setCopyMessage("✅ Credenciales reales copiadas");
                              setTimeout(() => setCopyMessage(""), 3000);
                            } else {
                              setCopyMessage("❌ Error obteniendo credenciales");
                              setTimeout(() => setCopyMessage(""), 2000);
                            }
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: userCreatedSuccessfully ? '#28a745' : '#f0ad4e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Copiar ambas credenciales"
                      >
                        📋 Copiar todo
                      </button>
                    </div>
                    
                    {copyMessage && (
                      <div style={{
                        background: '#d4edda',
                        color: '#155724',
                        border: '1px solid #c3e6cb',
                        borderRadius: '4px',
                        padding: '8px',
                        marginBottom: '10px',
                        fontSize: '12px',
                        textAlign: 'center'
                      }}>
                        ✅ {copyMessage}
                      </div>
                    )}

                    {!userCreatedSuccessfully && (
                      <div style={{
                        background: '#fcf8e3',
                        color: '#8a6d3b',
                        border: '1px solid #faebcc',
                        borderRadius: '4px',
                        padding: '10px',
                        marginBottom: '12px',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        💡 <strong>RECOMENDACIÓN:</strong> Copia estas credenciales ANTES de crear la cuenta. Una vez creada, el modal se cerrará automáticamente.
                      </div>
                    )}
                    
                    <div style={{marginBottom: '10px'}}>
                      <label style={{fontSize: '12px', color: '#6c757d', fontWeight: 'bold'}}>Username:</label>
                      <div style={{
                        background: 'white', 
                        border: '1px solid #ced4da', 
                        borderRadius: '4px', 
                        padding: '8px', 
                        fontFamily: 'monospace', 
                        fontSize: '14px'
                      }}>
                        {previewCredentials.username}
                      </div>
                    </div>
                    
                    <div>
                      <label style={{fontSize: '12px', color: '#6c757d', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px'}}>
                        Contraseña:
                        {!userCreatedSuccessfully && (
                          <span style={{fontSize: '11px', color: '#8b6f4e', fontWeight: 'normal'}}>✏️ (editable)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={previewCredentials.password}
                        onChange={(e) => !userCreatedSuccessfully && setPreviewCredentials({...previewCredentials, password: e.target.value})}
                        disabled={userCreatedSuccessfully}
                        style={{
                          width: '100%',
                          border: `2px solid ${
                            userCreatedSuccessfully 
                              ? '#28a745' 
                              : previewCredentials.password.length > 0 && previewCredentials.password.length < 5
                                ? '#dc3545'
                                : '#8b6f4e'
                          }`, 
                          borderRadius: '4px', 
                          padding: '8px', 
                          fontFamily: 'monospace', 
                          fontSize: '14px',
                          backgroundColor: userCreatedSuccessfully ? '#f8fff9' : '#fafafa',
                          cursor: userCreatedSuccessfully ? 'default' : 'text'
                        }}
                        placeholder={userCreatedSuccessfully ? "Contraseña final" : "Mínimo 5 caracteres"}
                      />
                      {!userCreatedSuccessfully && previewCredentials.password.length > 0 && previewCredentials.password.length < 5 && (
                        <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '4px', fontWeight: '500' }}>
                          ⚠️ Contraseña muy corta ({previewCredentials.password.length}/5 caracteres)
                        </div>
                      )}
                      {!userCreatedSuccessfully && previewCredentials.password.length >= 5 && (
                        <div style={{ fontSize: '11px', color: '#28a745', marginTop: '4px', fontWeight: '500' }}>
                          ✓ Contraseña válida ({previewCredentials.password.length} caracteres)
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-section">
                <h3>Información de Pagos</h3>
                <div className="modal-field">
                  <label>Monto Mensualidad *:</label>
                  <input
                    type="number"
                    value={newClient.monto === "" ? "" : newClient.monto}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewClient({
                        ...newClient,
                        monto: val === "" ? "" : Number.parseFloat(val)
                      });
                    }}
                    placeholder="Ej: 200.00"
                    step="0.01"
                    min="0"
                    autoComplete="off"
                    inputMode="decimal"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                </div>
                <div className="modal-field">
                  <label>Fecha Último Pago *:</label>
                  <input
                    type="date"
                    value={newClient.fecha_pago}
                    onChange={(e) => setNewClient({ ...newClient, fecha_pago: e.target.value })}
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                </div>
                <div className="modal-field">
                  <label>Fecha Próximo Pago *:</label>
                  <input
                    type="date"
                    value={newClient.proxima_fecha}
                    onChange={(e) => setNewClient({ ...newClient, proxima_fecha: e.target.value })}
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                </div>
                <div className="modal-field">
                  <label>Método de Pago *:</label>
                  <select
                    value={newClient.metodo_pago}
                    onChange={(e) => setNewClient({ ...newClient, metodo_pago: e.target.value })}
                    className="status-filter"
                    data-lpignore="true"
                    data-form-type="other"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="link">Link de Pago</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-primary" onClick={createNewClient} type="button" disabled={creatingClient}>
                  <UserPlus size={16} /> {creatingClient ? "Creando..." : "Crear Cliente"}
                </button>
                <button className="btn btn-secondary" onClick={closeAddClientModal} type="button">
                  Cancelar
                </button>
              </div>
            </div>
          </div>,
        )}

      {/* MODAL HISTORIAL DE PAGOS (Portal) */}
      {paymentHistoryModalOpen &&
        selectedMember &&
        renderPortal(
          <div className="modal-overlay" onClick={closePaymentHistoryModal}>
            <div className="modal-content payment-history-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Historial de Pagos - {selectedMember.name}</h2>

              {/* Historial de pagos existentes */}
              <div className="modal-section">
                <h3>Pagos Realizados</h3>
                {paymentHistory.length === 0 ? (
                  <p style={{ color: "var(--stone-gray)", fontStyle: "italic" }}>
                    No hay pagos registrados
                  </p>
                ) : (
                  <div className="payment-history-list">
                    {paymentHistory.map((payment, index) => (
                      <div key={index} className="payment-item">
                        <div className="payment-info">
                          <div className="payment-amount">${formatCurrency(payment.monto)}</div>
                          <div className="payment-concept">Concepto: {payment.concepto || "N/A"}</div>
                          <div className="payment-status">Estado: {payment.estatus_pago || "N/A"}</div>
                          <div className="payment-dates">
                            <span>Fecha de Pago: {formatDate(payment.fecha_pago)}</span>
                          </div>
                          {payment.observaciones && (
                            <div className="payment-observations">Observaciones: {payment.observaciones}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="edit-payment-btn"
                          onClick={() => openEditPaymentModal(payment)}
                          title="Editar pago"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Formulario para agregar nuevo pago */}
              <div className="modal-section">
                <h3>Agregar Nuevo Pago</h3>
                <div className="modal-field">
                  <label>Monto *:</label>
                  <input
                    type="number"
                    value={newPayment.monto === 0 ? "" : newPayment.monto}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewPayment({
                        ...newPayment,
                        monto: val === "" ? "" : Number.parseFloat(val)
                      });
                    }}
                    placeholder="Ej: 200.00"
                    step="0.01"
                    min="0"
                    autoComplete="off"
                    inputMode="decimal"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                </div>
                <div className="modal-field">
                  <label>Fecha de Pago *:</label>
                  <input
                    type="date"
                    value={newPayment.fecha_pago}
                    onChange={(e) => setNewPayment({ ...newPayment, fecha_pago: e.target.value })}
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                </div>
                <div className="modal-field">
                  <label>Concepto *:</label>
                  <input
                    type="text"
                    value={newPayment.concepto}
                    onChange={(e) => setNewPayment({ ...newPayment, concepto: e.target.value })}
                    placeholder="Ej: Mensualidad, Pago inicial, etc."
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                </div>
                <div className="modal-field">
                  <label>Estado del Pago *:</label>
                  <select
                    value={newPayment.estatus_pago}
                    onChange={(e) => setNewPayment({ ...newPayment, estatus_pago: e.target.value })}
                    className="status-filter"
                    data-lpignore="true"
                    data-form-type="other"
                  >
                    <option value="pagado">Pagado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="vencido">Vencido</option>
                    <option value="bloqueado">Bloqueado</option>
                  </select>
                </div>
                <div className="modal-field">
                  <label>Observaciones:</label>
                  <textarea
                    value={newPayment.observaciones}
                    onChange={(e) => setNewPayment({ ...newPayment, observaciones: e.target.value })}
                    placeholder="Observaciones adicionales (opcional)"
                    rows="3"
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-primary" onClick={addNewPayment} type="button">
                  <CheckCircle size={16} /> Agregar Pago
                </button>
                <button className="btn btn-secondary" onClick={closePaymentHistoryModal} type="button">
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
        )}

      {/* MODAL DE EDICIÓN DE PAGO (Portal) */}
      {editPaymentModalOpen &&
        renderPortal(
          <div className="modal-overlay" onClick={closeEditPaymentModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Editar Pago</h2>
                <button className="modal-close" onClick={closeEditPaymentModal}>
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="modal-content">
                <div className="modal-field">
                  <label>Monto *:</label>
                  <input
                    type="number"
                    value={editingPayment?.monto || ""}
                    onChange={(e) => setEditingPayment({...editingPayment, monto: e.target.value})}
                    placeholder="Ingresa el monto"
                  />
                </div>

                <div className="modal-field">
                  <label>Fecha de Pago *:</label>
                  <input
                    type="date"
                    value={editingPayment?.fecha_pago || ""}
                    onChange={(e) => setEditingPayment({...editingPayment, fecha_pago: e.target.value})}
                  />
                </div>

                <div className="modal-field">
                  <label>Concepto *:</label>
                  <input
                    type="text"
                    value={editingPayment?.concepto || ""}
                    onChange={(e) => setEditingPayment({...editingPayment, concepto: e.target.value})}
                    placeholder="Ej: Mensualidad, Pago inicial, etc."
                  />
                </div>

                <div className="modal-field">
                  <label>Estado del Pago *:</label>
                  <select
                    value={editingPayment?.estatus_pago || "pagado"}
                    onChange={(e) => setEditingPayment({...editingPayment, estatus_pago: e.target.value})}
                  >
                    <option value="pagado">Pagado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="vencido">Vencido</option>
                    <option value="bloqueado">Bloqueado</option>
                  </select>
                </div>

                <div className="modal-field">
                  <label>Observaciones:</label>
                  <textarea
                    value={editingPayment?.observaciones || ""}
                    onChange={(e) => setEditingPayment({...editingPayment, observaciones: e.target.value})}
                    placeholder="Observaciones adicionales (opcional)"
                    rows="3"
                  />
                </div>

                {/* Botones integrados dentro del contenido */}
                <div className="modal-buttons">
                  <button 
                    className="btn cancel-btn" 
                    onClick={closeEditPaymentModal}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn submit-btn" 
                    onClick={updatePayment}
                    type="button"
                  >
                    Actualizar Pago
                  </button>
                </div>
              </div>
            </div>
          </div>,
        )}

      {/* NOTIFICACIÓN (Portal) */}
      {notification.show &&
        renderPortal(
          <div className={`notification ${notification.type}`}>
            <div className="notification-content">
              <span className="notification-message">{notification.message}</span>
              <button 
                className="notification-close" 
                onClick={() => setNotification({ show: false, message: "", type: "" })}
              >
                ×
              </button>
            </div>
          </div>
        )}
    </div>
  )
}

export default MembershipAdminDashboardLocal
