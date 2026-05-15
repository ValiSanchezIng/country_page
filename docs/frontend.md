# Frontend — El Refugio Country Club

App React (Vite) ubicada en `country_page/country_app/`.  
Router: React Router v6. Notificaciones: react-toastify.

---

## Tabla de contenidos

- [Rutas](#rutas)
- [Páginas](#páginas)
- [Autenticación y roles](#autenticación-y-roles)
- [Grupos de componentes](#grupos-de-componentes)
- [Archivos de API](#archivos-de-api-frontend)
- [Custom Hooks](#custom-hooks)
- [Estructura de directorios](#estructura-de-directorios)

---

## Rutas

Definidas en `src/App.jsx` usando `BrowserRouter` + `Routes`.

| Path | Componente | Protegida | Roles requeridos |
|------|-----------|-----------|-----------------|
| `/` | `Home` | No | Pública |
| `/equitacion` | `Equitacion` | No | Pública |
| `/CalendarioReserva` | `CalendarioReserva` | No | Pública |
| `/login` | `Login` | No | Pública |
| `/MenuCalendario` | `MenuCalendario` | Sí | Cualquier usuario autenticado |
| `/registro` | `RegistroUsuarios` | Sí | `creadorcuentas` |
| `/instructor` | `InstructorClases` | **No** ⚠️ | Protección comentada en el código |
| `/contabilidad` | `Contabilidad` | Sí | `administrador`, `contabilidad` |
| `/admin` | `Administrador` | Sí | `administrador` |

> **Nota de seguridad:** La ruta `/instructor` tiene el `ProtectedRoute` comentado — cualquier persona sin autenticar puede acceder al panel del instructor.

---

## Páginas

### Públicas

**`/` — Home** (`src/views/Home.jsx`)  
Landing page principal. Contiene hero con carousel (Swiper), sección de eventos, formulario de contacto y footer. Usa `Navigation.jsx` para la barra de navegación con scroll-to-section.

**`/equitacion` — Equitacion** (`src/views/Equitacion.jsx`)  
Página informativa de clases. Muestra los tipos de clase disponibles (iniciación, intermedio, avanzado) con un CTA que lleva a `/MenuCalendario` para reservar.

**`/CalendarioReserva` — CalendarioReserva** (`src/components/CalendarioReserva.jsx`)  
Date picker básico usando react-datepicker. Bloquea fechas ocupadas cargadas desde `reservas.json`.

**`/login` — Login** (`src/components/Login.jsx`)  
Formulario de autenticación con email/contraseña. Al iniciar sesión exitosamente, redirige según el rol del usuario usando `roleRedirect.js`. Tiene toggle de visibilidad de contraseña y "recordarme".

---

### Protegidas

**`/MenuCalendario` — MenuCalendario** (`src/components/MenuCalendario.jsx`)  
Panel principal del **cliente**. Vista de calendario semanal que muestra disponibilidad de clases y reservas del usuario. Incluye:
- `WeeklyCalendar` — grilla de horarios de la semana
- `BookingModal` — modal para crear una reserva
- `SessionUpdateModal` — aviso de sesión expirada
- `ChangePasswordModal` — cambio de contraseña
- `ReservacionTabla` — vista de tabla de reservas existentes

**`/registro` — RegistroUsuarios** (`src/components/RegistroUsuarios.jsx`)  
Dashboard de gestión de cuentas de usuario. Solo accesible con rol `creadorcuentas`. Permite crear usuarios, editar email/contraseña, copiar credenciales al portapapeles y cambiar nivel de clase.

**`/instructor` — InstructorClases** (`src/components/InstructorClases.jsx`)  
Panel del **instructor**. Muestra el calendario de clases del día, permite marcar asistencia, asignar caballos a cada reserva y cancelar clases (individual, todo el día, o desde cierta hora). Usa el hook `useInstructorDashboard`.

**`/contabilidad` — Contabilidad** (`src/components/Contabilidad.jsx`)  
Panel de **contabilidad y administración**. Accesible para roles `administrador` y `contabilidad`. Organizado en tabs:
- **Clientes** — lista de socios, historial de pagos, estatus de membresía
- **Caballos** — gestión de caballos (`CaballosAdmin`)
- **Instructoras** — gestión de instructoras (`InstructorasAdmin`)
- **Reservas** — vista admin de reservas (`ReservasAdmin`)
- **Horarios personalizados** — horarios individuales de clientes (`HorariosPersonalizadosAdmin`)
- **Métricas** — resumen estadístico (`MetricasResumen`)

**`/admin` — Administrador** (`src/components/Administrador.jsx`)  
Panel de **administración completa**. Solo rol `administrador`. Consolida reservas, contabilidad, instructoras y caballos en una interfaz unificada.

---

## Autenticación y roles

### Storage
El usuario autenticado se guarda en `localStorage`:

| Key | Contenido |
|-----|-----------|
| `user` | Objeto principal `{ id, nombre, rol, ... }` |
| `authToken` | Token de sesión |
| `instructorData` | Datos del instructor (cuando aplica) |
| `userData` | Datos extendidos del usuario |

### Redirect por rol
Definido en `src/utils/roleRedirect.js`:

| Rol | Ruta destino |
|-----|-------------|
| `cliente` | `/MenuCalendario` |
| `instructora` | `/instructor` |
| `creadorcuentas` | `/registro` |
| `administrador` | `/contabilidad` |
| `admin` | `/admin` |
| `viewer` | `/dashboard-viewer` |

### ProtectedRoute (`src/components/ProtectedRoute.jsx`)
- Verifica `localStorage.getItem('user')` y que el objeto tenga `id` y `nombre`
- Sincroniza logout entre múltiples tabs via evento `storage`
- Re-verifica autenticación en focus, visibility change y page show
- Muestra "Verificando sesión..." mientras valida
- Redirige a `/login` si no hay sesión; guarda la ruta original para post-login

### useRoleGuard (`src/hooks/useRoleGuard.js`)
Hook que recibe un array de roles permitidos y redirige automáticamente si el usuario no tiene el rol requerido. Usado por `Contabilidad` y `RegistroUsuarios`.

---

## Grupos de componentes

### `/calendario/` — Sistema de reservas del cliente

Maneja toda la UI de calendario y reservas para clientes.

**Componentes principales:**
- `weekly-calendar.jsx` — grilla semanal de horarios y disponibilidad
- `calendar-grid.jsx` — layout de la grilla
- `calendar-header.jsx` — navegación entre semanas
- `time-slot-card.jsx` — tarjeta individual de un slot horario
- `booking-modal.jsx` — modal de creación de reserva
- `reservacion_tabla.jsx` — vista de tabla de reservas del usuario
- `change-password-modal.jsx` — cambio de contraseña
- `session-update-modal.jsx` — aviso de sesión

**API:**
- `booking-api.js` — reservas (crear, cancelar, listar)
- `booking-classes-api.js` — clases disponibles

**Infraestructura:**
- `lib/auth-context.jsx` — contexto de autenticación (legacy)
- `lib/booking-context.jsx` — estado de reservas
- `lib/schedule-config.jsx` — configuración de horarios
- `utils/week.js` — cálculo de semanas

---

### `/instructor/` — Panel del instructor

**Componentes principales:**
- `CalendarView.jsx` — calendario del instructor
- `DayClassesModal.jsx` — modal con las clases del día seleccionado
- `atendance-modal.jsx` — modal para marcar asistencia y asignar caballo
- `HorseSelect.jsx` — selector de caballo con filtro por nivel
- `CancelIndividualModal.jsx` — cancelación de reserva individual

**Lógica centralizada:**
- `constants.jsx` — exporta el hook `useInstructorDashboard` con todo el estado del panel
- `instructor-api.js` — todas las llamadas API del panel instructor (~22 KB)

---

### Componentes de administración

Usados dentro de `/contabilidad` y `/admin`:

| Componente | Función |
|-----------|---------|
| `CaballosAdmin.jsx` | CRUD de caballos |
| `InstructorasAdmin.jsx` | CRUD de instructoras y horarios |
| `ReservasAdmin.jsx` | Vista y gestión admin de reservas |
| `HorariosPersonalizadosAdmin.jsx` | Horarios personalizados por cliente |
| `BloqueosAdmin.jsx` | Bloqueos administrativos de slots (fecha + turno + clases). CRUD sobre `/api/bloqueos`. Pestaña dentro de Contabilidad. |
| `MetricasResumen.jsx` | Dashboard de métricas |
| `ContabilidadLocal.jsx` | Vista de contabilidad local |

**Integración del bloqueo en el calendario del cliente:**
- `calendario/weekly-calendar.jsx` fetcha `GET /api/bloqueos?fecha_inicio=&fecha_fin=&solo_activos=1` para la semana visible (depende solo de `currentDate`, no de `claseId`, para incluir los bloqueos de "Todas las clases"). Dentro de `generateTimeSlots` calcula `isAdminBlocked` + `blockMessage` por slot y los fusiona en `slot.isBlocked`.
- `calendario/time-slot-card.jsx` recibe `isAdminBlocked` y `blockMessage` y renderiza el estado `tsc--admin-blocked` (rojo, "Clases canceladas[: motivo]") con prioridad máxima — **salvo** si el cliente ya tiene una reserva en ese slot, en cuyo caso su reserva se sigue mostrando normal.

---

### Componentes de UI general

| Componente | Función |
|-----------|---------|
| `Navigation.jsx` | Nav principal (Home) — responsive con hamburger |
| `NavigationClases.jsx` | Nav para página de Equitación |
| `LogoutBoton.jsx` | Botón de logout — limpia localStorage y redirige a `/login` |
| `Logo.jsx` | Logo del club |
| `ContactForm.jsx` | Formulario de contacto |
| `EventsSection.jsx` | Sección de eventos |
| `EventBanner.jsx` | Banner de evento |
| `AboutSection.jsx` | Sección "Acerca de" |
| `Footer.jsx` | Pie de página |
| `OptimizedInput.jsx` | Input reutilizable optimizado |
| `SubmitButton.jsx` | Botón de submit reutilizable |

---

## Archivos de API (frontend)

**Base URL:** `https://elrefugiocountryclub.com/api/api`  
*(El doble `/api/api` es intencional — proxy reverso en producción)*

### `booking-api.js` — `src/components/calendario/`

| Función | Método | Endpoint |
|---------|--------|---------|
| `fetchUserBookings(clienteId)` | `GET` | `/reservas/my-reservations/:clienteId` |
| `fetchWeekBookings(fechaInicio, fechaFin)` | `GET` | `/reservas/week?fecha_inicio=&fecha_fin=` |
| `createBooking({cliente_id, clase_id, fecha, hora_inicio})` | `POST` | `/reservas/book` |
| `cancelBooking(reservaId, clienteId)` | `PUT` | `/reservas/:id/cancel/:clienteId` |

### `booking-classes-api.js` — `src/components/calendario/`

| Función | Método | Endpoint |
|---------|--------|---------|
| `fetchClasses()` | `GET` | `/reservas/classes` |

### `instructor-api.js` — `src/components/instructor/`

| Función | Método | Endpoint |
|---------|--------|---------|
| `obtenerClasesInstructora(usuarioId)` | `GET` | `/instructoras/clases/:usuarioId` |
| `obtenerInstructoraPorUsuario(userId)` | `GET` | `/instructoras/by-user/:userId` |
| `actualizarAsistencia(reservaId, datos)` | `PUT` | `/reservas/instructor/:reservaId/attendance` |
| `asignarCaballo(reservaId, caballoId, instructoraId)` | `PUT` | `/reservas/instructor/:reservaId/assign-horse` |
| `obtenerCaballos()` | `GET` | `/caballos` |
| `obtenerCaballosDisponiblesParaHorario(nivel, fecha, hora, ...)` | `GET` | `/caballos/disponibles?nivel=&fecha=&hora=&...` |
| `obtenerCaballosPorNivel(nivelCliente, fecha)` | `GET` | `/caballos` (filtra por `especialidad`) |
| `invalidarCacheDisponibles(nivel, fecha, hora)` | `POST` | `/caballos/disponibles/invalidar` |
| `obtenerActividadesCaballo(caballoId, fecha)` | `GET` | `/caballos/:id/actividades-dia?fecha=` |
| `obtenerReservasAdmin(fecha)` | `GET` | `/reservas/admin/all?fecha=` |
| `cancelarReservasDia(instructoraId, fecha, motivo)` | `POST` | `/reservas/instructor/cancel-day` |
| `cancelarReservasDesdeHora(instructoraId, fecha, hora, motivo)` | `POST` | `/reservas/instructor/cancel-from-time` |
| `cancelarReservaIndividual(reservaId, clienteId)` | `PUT` | `/reservas/:id/cancel/:clienteId` |

> `instructor-api.js` implementa un caché en memoria con TTL de 15 segundos para deduplicar llamadas de disponibilidad de caballos que se repiten en el mismo render.

---

## Custom Hooks

Ubicados en `src/hooks/`:

| Hook | Archivo | Propósito |
|------|---------|-----------|
| `useInstructorDashboard` | `instructor/constants.jsx` | Estado completo del panel instructor (clases, caballos, modales, cancelaciones) |
| `useRoleGuard(roles[])` | `hooks/useRoleGuard.js` | Redirige si el rol del usuario no está en la lista |
| `useReservas()` | `hooks/useReservas.js` | Estado y operaciones de reservas del cliente |
| `useUsuarios()` | `hooks/useUsuarios.js` | Gestión de usuarios (CRUD) |
| `useAutoRefresh(fn, interval)` | `hooks/useAutoRefresh.js` | Ejecuta una función a intervalo para mantener datos frescos |
| `useOptimizedForm(initial)` | `hooks/useOptimizedForm.js` | Formularios con manejo optimizado de estado |

---

## Estructura de directorios

```
country_app/src/
├── App.jsx                    ← Router principal
├── main.jsx                   ← Entry point React
├── index.css
├── views/
│   ├── Home.jsx               ← Ruta /
│   └── Equitacion.jsx         ← Ruta /equitacion
├── components/
│   ├── Login.jsx
│   ├── ProtectedRoute.jsx
│   ├── MenuCalendario.jsx
│   ├── InstructorClases.jsx
│   ├── Contabilidad.jsx
│   ├── Administrador.jsx
│   ├── RegistroUsuarios.jsx
│   ├── Navigation.jsx
│   ├── LogoutBoton.jsx
│   ├── calendario/            ← Sistema de reservas cliente
│   │   ├── booking-api.js
│   │   ├── booking-classes-api.js
│   │   ├── weekly-calendar.jsx
│   │   ├── booking-modal.jsx
│   │   ├── lib/
│   │   └── utils/
│   └── instructor/            ← Panel del instructor
│       ├── instructor-api.js
│       ├── constants.jsx
│       ├── CalendarView.jsx
│       └── ...
├── hooks/
│   ├── useRoleGuard.js
│   ├── useReservas.js
│   ├── useUsuarios.js
│   ├── useAutoRefresh.js
│   └── useOptimizedForm.js
├── utils/
│   └── roleRedirect.js
├── config/
├── CSS/
├── data/
└── img/
```
