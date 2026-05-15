# API Backend — El Refugio Country Club

Base URL producción: `https://elrefugiocountryclub.com/api/api`  
Base URL local: `http://localhost:5000/api`

> El doble `/api/api` en producción es intencional: el servidor Express monta rutas en `/api/xxx` y el proxy reverso añade otro prefijo `/api`.

---

## Tabla de contenidos

- [Reservas](#reservas--apireservas)
- [Usuarios / Contabilidad](#usuarios--apiusers)
- [Caballos](#caballos--apicaballos)
- [Horarios](#horarios--apihorarios)
- [Instructoras](#instructoras--apiinstructoras)
- [Descansos](#descansos--apidescansos)
- [Bloqueos](#bloqueos--apibloqueos)
- [Email](#email--apiemail)
- [Instructor (legacy)](#instructor-legacy--apiinstructor)
- [Reservas Admin (legacy)](#reservas-admin-legacy--apireservas-admin)

---

## Reservas — `/api/reservas`

Archivo: `Backend/routes/reservas_new.js` (2580 líneas)

### Admin

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/admin/all` | Todas las reservas (con filtro `?fecha=`) |
| `GET` | `/admin/dashboard` | Resumen/stats para el panel admin |
| `POST` | `/admin/create` | Crear reserva desde el panel admin |
| `PUT` | `/admin/:id/status` | Cambiar estatus de una reserva |
| `PUT` | `/admin/:reservaId/observations` | Agregar observaciones a una reserva |
| `PUT` | `/admin/:reservaId/attendance` | Registrar asistencia (admin) |

### Cliente

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/my-reservations/:clienteId` | Reservas del cliente |
| `GET` | `/available-slots/:clienteId` | Slots disponibles para el cliente según su nivel/tipo |
| `POST` | `/book` | **Crear reserva** — lógica principal con selección consciente de instructora |
| `GET` | `/week` | Semana completa de reservas (`?fecha_inicio=&fecha_fin=`) |
| `GET` | `/propietarios` | Lista de clientes tipo propietario |
| `PUT` | `/:id/cancel/:clienteId` | Cancelar reserva (soft-cancel) |

### Instructor

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/instructor/create` | Crear reserva desde panel instructor |
| `GET` | `/instructor/my-classes/:instructoraId` | Clases del día asignadas al instructor |
| `PUT` | `/instructor/:reservaId/assign-horse` | Asignar caballo a una reserva |
| `PUT` | `/instructor/:reservaId/attendance` | Registrar asistencia |
| `PUT` | `/instructor/:reservaId/status` | Cambiar estatus de reserva |
| `PUT` | `/instructor/:reservaId/observations` | Agregar notas a una reserva |
| `POST` | `/instructor/request-break` | Solicitar descanso/pausa |
| `POST` | `/instructor/cancel-day` | Cancelar todas las reservas del día |
| `POST` | `/instructor/cancel-from-time` | Cancelar reservas desde una hora en adelante |

### Utilidades / Compartidos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/classes` | Lista de clases disponibles |
| `GET` | `/horses/available` | Caballos disponibles |
| `GET` | `/instructors/available` | Instructoras disponibles |
| `POST` | `/instructor-availability/batch` | Verificar disponibilidad de instructora en múltiples slots (usa `Promise.all`) |

---

## Usuarios — `/api/users`

Archivo: `Backend/routes/users_new.js`

> Este archivo también maneja toda la **contabilidad** — no existe ruta `/api/contabilidad` separada.

### Gestión de usuarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/all` | Todos los usuarios |
| `GET` | `/:id` | Usuario por ID |
| `POST` | `/register` | Registro de usuario (admin) |
| `POST` | `/register-cliente` | Auto-registro de cliente |
| `POST` | `/preview-credentials` | Preview de credenciales antes de enviar por email |
| `POST` | `/change-password` | Cambio de contraseña |
| `PATCH` | `/update-email/:id` | Actualizar email |
| `PATCH` | `/update-password/:id` | Actualizar contraseña |
| `PATCH` | `/update-status/:id` | Cambiar estatus del usuario |
| `PATCH` | `/update-nivel/:id` | Cambiar nivel de clase del usuario |

### Pagos / Contabilidad

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/users-with-payments` | Usuarios enriquecidos con datos de pago |
| `GET` | `/with-payments` | Alternativa — usuarios con pagos |
| `GET` | `/payments/:id` | Pagos de un usuario |
| `POST` | `/payments` | Crear registro de pago |
| `GET` | `/payment-history/:id` | Historial detallado de pagos |
| `POST` | `/add-payment` | Agregar pago (endpoint alternativo) |
| `GET` | `/payment-counts` | Conteos agregados de pagos (dashboard) |
| `GET` | `/payment-status` | Estatus de pago para dashboard |
| `PUT` | `/payment/:id` | Editar registro de pago |

---

## Caballos — `/api/caballos`

Archivo: `Backend/routes/caballos.js`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Todos los caballos |
| `GET` | `/disponibles` | Caballos disponibles (filtra por `disponibilidad='disponible'` + tipo cliente) |
| `GET` | `/disponibles/:especialidad` | Por especialidad (`iniciacion`, `intermedio`, `avanzado`, `mixto`) |
| `GET` | `/disponibles-filtrado` | Filtrado avanzado de disponibilidad |
| `POST` | `/disponibles/invalidar` | Invalida el caché de caballos disponibles |
| `GET` | `/:id` | Caballo por ID |
| `GET` | `/:id/actividades-dia` | Actividades del caballo en un día (`?fecha=`) |
| `POST` | `/` | Crear caballo |
| `PUT` | `/:id` | Editar caballo |
| `PATCH` | `/:id/disponibilidad` | Cambiar disponibilidad (`disponible` / `no_disponible`) |
| `PATCH` | `/:id/estatus` | Cambiar estatus |
| `DELETE` | `/:id` | Eliminar caballo |

---

## Horarios — `/api/horarios`

Archivo: `Backend/routes/horarios.js`

> Nota: existe una ruta `GET /ocupacion/:fecha` duplicada en el archivo (bug conocido, solo aplica la primera definición).

### horarios_clase

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/clase/:nombreClase` | Horarios de una clase por nombre, con cupo ajustado por descansos fijos |
| `GET` | `/` | Todos los slots de horarios |
| `POST` | `/` | Crear slot de horario |
| `PUT` | `/:id` | Editar slot |
| `DELETE` | `/:id` | Eliminar slot |
| `GET` | `/clases` | Lista de clases con `id`, `nombre`, `duracion_min`, `cupo_max` (ordenadas por prioridad) |
| `GET` | `/disponibles/:fecha` | Slots disponibles para una fecha |
| `GET` | `/estadisticas` | Estadísticas de ocupación |
| `GET` | `/ocupacion/:fecha` | Ocupación para una fecha *(duplicada — solo aplica la primera)* |

### horarios_personalizados

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/personalizados-all` | Todos los horarios personalizados |
| `GET` | `/personalizados/:userId` | Horario personalizado de un usuario |
| `POST` | `/personalizados` | Crear horario personalizado |
| `PUT` | `/personalizados/:id` | Editar horario personalizado |
| `DELETE` | `/personalizados/:id` | Eliminar horario personalizado |

---

## Instructoras — `/api/instructoras`

Archivo: `Backend/routes/instructoras.js`

> Nota: `GET /clases-asignadas` está duplicado en el archivo (bug conocido).

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Todas las instructoras |
| `GET` | `/clases-asignadas` | Clases asignadas (duplicada) |
| `GET` | `/clases/:usuario_id` | Clases asignadas a instructora por ID de usuario |
| `GET` | `/by-user/:userId` | Obtener registro de instructora desde ID de usuario |
| `GET` | `/debug/all` | Debug: todos los datos sin filtro |
| `GET` | `/:id` | Instructora por ID |
| `GET` | `/:id/reservas-activas` | Reservas activas de la instructora |
| `POST` | `/` | Crear instructora |
| `PUT` | `/:id` | Editar instructora |
| `PATCH` | `/:id/disponibilidad` | Cambiar disponibilidad (`disponible` / `no_disponible`) |
| `DELETE` | `/:id` | Eliminar instructora |
| `PUT` | `/reservas/:id/asistencia` | Registrar asistencia en una reserva |
| `POST` | `/:id/reasignar` | Reasignar instructora a reservas |
| `GET` | `/:id/horarios` | Horarios de la instructora (`instructora_horarios`) |
| `POST` | `/:id/horarios` | Crear horario de instructora |
| `PUT` | `/:id/horarios/:horarioId` | Editar horario de instructora |
| `DELETE` | `/:id/horarios/:horarioId` | Eliminar horario de instructora |

---

## Descansos — `/api/descansos`

Archivo: `Backend/routes/descansos.js`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Todos los descansos |
| `GET` | `/instructora/:instructoraId` | Descansos de una instructora |
| `GET` | `/check/:instructoraId` | Verificar si la instructora está en descanso ahora |
| `GET` | `/upcoming` | Próximos descansos |
| `GET` | `/stats` | Estadísticas de descansos |
| `POST` | `/` | Crear descanso |
| `PUT` | `/:id` | Editar descanso |
| `DELETE` | `/:id` | Eliminar descanso |

---

## Bloqueos — `/api/bloqueos`

Archivo: `Backend/routes/bloqueos.js`

Bloqueos administrativos de slots por **fecha + turno (mañana/tarde) + clases**. Cuando un admin crea un bloqueo, los clientes no pueden hacer NUEVAS reservas en ese horario. Las reservas ya existentes **no** se cancelan automáticamente (el admin las gestiona desde Reservas si quiere).

Reglas:
- `clase_id NULL` → el bloqueo aplica a **todas** las clases de esa fecha + turno.
- `turno = 'mañana'` → afecta slots con `hora_inicio < 12:00`.
- `turno = 'tarde'` → afecta slots con `hora_inicio >= 12:00`.
- Un bloqueo "Todas" en fecha+turno hace conflicto con cualquier otro de ese mismo fecha+turno.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Listar bloqueos (filtros: `?fecha_inicio=`, `?fecha_fin=`, `?clase_id=`, `?solo_activos=1`) |
| `GET` | `/check` | Verificar si un slot está bloqueado (`?fecha=&turno=&clase_id=`) |
| `POST` | `/` | Crear uno o varios bloqueos. Body: `{ clase_ids: number[], fecha, turno, motivo?, creado_por? }` — `clase_ids: []` = "Todas" (inserta 1 fila con `clase_id = NULL`); con ids inserta 1 fila por cada id. |
| `DELETE` | `/:id` | Eliminar (hard-delete) un bloqueo |

**Enforcement:** `POST /api/reservas/book` consulta `bloqueos_clase` después del check de plazo de reserva. Si hay un bloqueo activo que cubra esa `fecha + turno + (clase_id o NULL)`, responde **400** con `{ error: 'Las clases de la <turno> de este día no están disponibles[: motivo]' }`.

---

## Email — `/api/email`

Archivo: `Backend/routes/email.js`

Triggered server-side en eventos clave del sistema.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/send-credentials` | Enviar credenciales iniciales al cliente |
| `POST` | `/send-updated-credentials` | Enviar credenciales actualizadas |
| `POST` | `/send-reservation-confirmation` | Confirmación de reserva |
| `POST` | `/send-cancellation-notification` | Notificación de cancelación |

---

## Instructor (legacy) — `/api/instructor`

Archivo: `Backend/routes/instructor.js`

Subconjunto legacy de operaciones de instructor. La funcionalidad completa está en `/api/reservas/instructor/...`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/reservas` | Reservas del instructor |
| `PUT` | `/reservas/:id/asistencia` | Registrar asistencia |

---

## Reservas Admin (legacy) — `/api/reservas-admin`

Archivo: `Backend/routes/reservas_admin.js`

Panel de administración con operaciones ampliadas. Incluye **hard DELETE** (borrado físico) de reservas.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Todas las reservas con filtros |
| `GET` | `/:id` | Reserva por ID |
| `PATCH` | `/:id/estatus` | Cambiar estatus |
| `PUT` | `/:id` | Editar reserva completa |
| `DELETE` | `/:id` | **Hard delete** (borrado físico, solo admin) |
| `GET` | `/stats/summary` | Resumen estadístico |
| `GET` | `/analytics/detailed` | Analytics detallado |

---

## Notas generales

- **Timezone**: El backend usa `timezone: 'Z'` (UTC) en el pool MySQL. La lógica de reservas usa `luxon` con `America/Cancun` para la regla de 2 horas de anticipación.
- **Caché de caballos**: `GET /caballos/disponibles` usa caché interno; `POST /caballos/disponibles/invalidar` lo limpia.
- **Selección de instructora**: `POST /reservas/book` aplica lógica consciente de escasez — evita agotar la única instructora disponible para una clase especializada.
- **Horarios personalizados**: Asignan instructora al cliente pero **no** saltan la validación de cupo.
- **Contabilidad**: No tiene ruta propia; todo se gestiona a través de `/api/users/payments/...` y `/api/users/contabilidad/...`.
