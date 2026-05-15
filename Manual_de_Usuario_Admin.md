# Manual de Usuario — Panel de Administración

## Centro Ecuestre El Refugio

**Versión:** 1.0
**Audiencia:** Personal administrativo del club

---

## Índice

1. Acceso al Panel
2. Clientes
3. Caballos
4. Instructoras
5. Reservas
6. Horarios Extra
7. Bloqueos
8. Métricas
9. Preguntas Frecuentes

---

## 1. Acceso al Panel

Para acceder al panel de administración, inicia sesión con tu cuenta de administrador. Una vez dentro, verás la barra de navegación superior con las secciones principales:

- **Reservas**
- **Contabilidad** — incluye Clientes, Caballos, Instructoras, Horarios Extra, **Bloqueos** y Métricas
- **Horarios Extra**

> **Nota sobre actualización automática:** El sistema se actualiza automáticamente cada 30 segundos. Si otro administrador realiza un cambio (por ejemplo, da de alta un cliente o registra un pago), los datos en tu pantalla se refrescarán solos. También puedes cambiar de pestaña en el navegador y volver: los datos se sincronizarán de inmediato al regresar.

---

## 2. Clientes

La sección de **Clientes** es la central de gestión de miembros del club. Aquí se administran los datos personales, niveles, estados y pagos de cada cliente.

### 2.1 Cómo acceder

Desde el menú principal, haz clic en **Contabilidad** y luego en la pestaña **Clientes**.

### 2.2 Vista general de la tabla

La tabla muestra una fila por cada cliente registrado con las siguientes columnas:

| Columna | Descripción |
|---|---|
| **Nombre** | Nombre completo del cliente |
| **Email** | Correo electrónico registrado |
| **Estado** | Estado actual del cliente (ver sección 2.4) |
| **Nivel** | Nivel de equitación asignado |
| **Mensualidad** | Monto mensual correspondiente |
| **Ultimo Pago** | Fecha del pago más reciente registrado |
| **Proximo Pago** | Fecha límite del siguiente pago; aparece en rojo si ya vencio |
| **Acciones** | Boton Historial para gestionar los pagos del cliente |

### 2.3 Agregar un nuevo cliente

1. Haz clic en el boton **"Nuevo Cliente"** en la parte superior de la seccion.
2. Completa el formulario con los datos del cliente:
   - **Nombre y apellido** (obligatorios)
   - **Email** — Si el cliente no tiene correo electronico, marca la casilla **"Sin correo electronico"**. El sistema generara automaticamente un usuario y contraseña que deberas entregar en mano al cliente.
   - Datos opcionales: edad, telefono, tipo de cliente
   - **Nivel** (ver opciones en seccion 2.5)
   - **Estado** inicial (por defecto: Activo)
3. Registra el **primer pago**: monto, fecha, concepto, metodo de pago y observaciones (opcional).
4. Haz clic en **Guardar**.

> **Si se generaron credenciales automaticas:** El sistema mostrara el usuario y la contraseña generados. Copialos antes de cerrar la ventana, ya que no podras volver a verlos.

### 2.4 Estados de un cliente

Los estados se pueden cambiar directamente desde la tabla, en el desplegable de la columna **Estado**:

| Estado | Significado |
|---|---|
| **Activo** | Cliente con membresia vigente y acceso normal al sistema |
| **Inactivo** | Cliente que ya no utiliza el servicio activamente |
| **Bloqueado** | Acceso restringido (tambien se aplica automaticamente si el pago esta vencido) |
| **Pendiente** | En proceso de incorporacion o verificacion |

**Para cambiar el estado:**

1. Localiza al cliente en la tabla.
2. Haz clic en el desplegable de la columna **Estado**.
3. Selecciona el nuevo estado. El cambio se guarda automaticamente.

### 2.5 Niveles de un cliente

El nivel refleja la categoria de equitacion del cliente. Se puede cambiar desde la columna **Nivel** de la tabla:

| Nivel | Descripcion |
|---|---|
| **Iniciacion** | Principiantes que comienzan su formacion |
| **Pony Club** | Nivel para jinetes jovenes |
| **Paseo** | Clases de paseo recreativo |
| **Intermedio** | Jinetes con experiencia basica-media |
| **Avanzado** | Jinetes con dominio tecnico avanzado |

**Para cambiar el nivel:**

1. Localiza al cliente en la tabla.
2. Haz clic en el desplegable de la columna **Nivel**.
3. Selecciona el nuevo nivel. El cambio se guarda automaticamente.

### 2.6 Gestion de pagos

Para ver el historial de pagos de un cliente o registrar uno nuevo, haz clic en el boton **"Historial"** de la fila correspondiente.

#### Ver historial

El modal de historial muestra todos los pagos registrados del cliente ordenados cronologicamente, con los campos: monto, fecha, concepto, metodo de pago y observaciones.

#### Agregar un pago nuevo

1. Dentro del modal de historial, haz clic en **"Agregar Pago"**.
2. Completa los campos:
   - **Monto** (obligatorio)
   - **Fecha de pago** (obligatorio)
   - **Concepto** (obligatorio) — Ej.: "Mensualidad marzo", "Inscripcion", etc.
   - **Metodo de pago** — Por defecto: Efectivo
   - **Observaciones** — Campo libre opcional
3. Haz clic en **Guardar**.

> El campo **"Proximo Pago"** en la tabla se recalcula automaticamente: siempre es la fecha del ultimo pago registrado mas 30 dias.

#### Modificar un pago existente

1. Dentro del modal de historial, localiza el pago que deseas modificar.
2. Haz clic en el icono de **editar** (lapiz) junto al pago.
3. Modifica los campos necesarios.
4. Haz clic en **Guardar**.

> Los pagos tienen un identificador unico interno. Esto garantiza que al modificar un pago siempre se actualice el registro correcto, sin importar el orden en que aparezcan en pantalla.

### 2.7 Filtros de busqueda

| Filtro | Descripcion |
|---|---|
| **Barra de busqueda** | Busca por nombre o email del cliente en tiempo real |
| **Filtro de Estado** | Muestra todos los estados o filtra por uno especifico |
| **Filtro de Nivel** | Muestra todos los niveles o filtra por uno especifico |
| **Boton "Vencidos"** | Muestra unicamente los clientes cuyo proximo pago ya vencio |

Los filtros pueden combinarse entre si. Por ejemplo: buscar "Garcia" + Estado "Activo" mostrara solo los clientes activos cuyo nombre contiene "Garcia".

---

## 3. Caballos

La seccion de **Caballos** permite gestionar el registro de caballos del club, su disponibilidad, estatus y especialidades.

### 3.1 Como acceder

Desde **Contabilidad**, haz clic en la pestana **Caballos**.

### 3.2 Vista general

Al ingresar, veras tarjetas de resumen con los totales por categoria (disponibles, no disponibles, publicos, privados, en renta, media renta) y debajo la tabla completa de caballos.

**Columnas de la tabla:**

| Columna | Descripcion |
|---|---|
| **Nombre** | Nombre del caballo |
| **Propietario** | Nombre del propietario asociado |
| **Disponibilidad** | Si esta disponible o no disponible (desplegable editable) |
| **Estatus** | Tipo de relacion con el club (desplegable editable) |
| **Especialidad** | Tipos de clase para los que esta habilitado |
| **Descripcion** | Notas adicionales |
| **Acciones** | Botones de editar y eliminar |

### 3.3 Agregar un nuevo caballo

1. Haz clic en el boton **"Nuevo Caballo"**.
2. Completa el formulario:
   - **Nombre** (obligatorio)
   - **Propietario** — Seleccionar de la lista de usuarios
   - **Disponibilidad** (por defecto: Disponible)
   - **Estatus** (por defecto: Publico)
   - **Especialidad** — Seleccion multiple con casillas de verificacion
   - **Descripcion** — Campo libre opcional
3. Haz clic en **Guardar**.

### 3.4 Disponibilidad

| Disponibilidad | Significado |
|---|---|
| **Disponible** | El caballo puede ser asignado a clases |
| **No disponible** | El caballo esta fuera de servicio (lesion, descanso, etc.) |

Para cambiarla, usa el desplegable en la columna **Disponibilidad** de la tabla.

### 3.5 Estatus

| Estatus | Significado |
|---|---|
| **Publico** | Caballo de uso general del club |
| **Privado** | Caballo de propiedad privada, uso restringido |
| **Renta** | Caballo disponible en modalidad de renta completa |
| **Media Renta** | Caballo compartido en modalidad de media renta |

Para cambiarlo, usa el desplegable en la columna **Estatus** de la tabla.

### 3.6 Especialidades

Las especialidades definen en que tipos de clase puede participar el caballo. Un caballo puede tener varias especialidades al mismo tiempo. Se editan desde el modal de edicion del caballo.

- **Iniciacion**
- **Paseo**
- **Intermedio**
- **Salto**

### 3.7 Filtros de busqueda

| Filtro | Opciones disponibles |
|---|---|
| **Barra de busqueda** | Por nombre del caballo o nombre del propietario |
| **Filtro de Disponibilidad** | Todos / Disponible / No disponible |
| **Filtro de Estatus** | Todos / Publico / Privado / Renta / Media Renta |
| **Filtro de Especialidad** | Todos / Iniciacion / Paseo / Intermedio / Salto |

Los filtros pueden combinarse entre si.

---

## 4. Instructoras

La seccion de **Instructoras** permite gestionar el personal docente del club: sus datos, disponibilidad, descansos, horarios semanales y tipos de clase que pueden impartir.

### 4.1 Como acceder

Desde **Contabilidad**, haz clic en la pestana **Instructoras**.

### 4.2 Vista por defecto — Solo instructoras activas

> **Importante:** Al entrar a esta seccion, la vista muestra **unicamente las instructoras disponibles (activas)** de forma predeterminada.

Para ver instructoras inactivas o con descanso:

1. Localiza el filtro de **Disponibilidad** en la parte superior de la lista.
2. Selecciona la opcion deseada:
   - **Disponible** (predeterminado) — Solo las que pueden dar clases hoy
   - **No disponible** — Las que estan inactivas o suspendidas temporalmente
   - **(Todas)** — Para ver el registro completo

### 4.3 Agregar una nueva instructora

1. Haz clic en el boton **"Nueva Instructora"**.
2. Completa el formulario con los datos personales:
   - Nombre y apellido (obligatorios)
   - Correo electronico
   - Telefono
   - Tipos de clase que puede impartir
3. Haz clic en **Guardar**.

### 4.4 Buscar una instructora

Utiliza la **barra de busqueda** en la parte superior para buscar por nombre. Si no aparece en la lista, puede estar filtrada por disponibilidad — prueba cambiando el filtro a "Todas" para verla.

### 4.5 Tipos de clase que puede impartir

Cada instructora tiene asignados los tipos de clase que esta habilitada a dar (por ejemplo: Iniciacion, Intermedio, Salto).

**Para editar los tipos de clase:**

1. Localiza a la instructora en la lista.
2. Haz clic en el boton de **editar** (lapiz) o en su nombre.
3. Modifica las casillas de seleccion de tipos de clase.
4. Guarda los cambios.

> **Regla de horario por defecto:** Si a una instructora no se le asigna un horario especifico, el sistema asume que esta disponible en **todos los horarios predeterminados** correspondientes a los tipos de clase que tiene habilitados. Solo es necesario crear un horario personalizado si la disponibilidad de la instructora difiere de los horarios estandar del club.

### 4.6 Agregar un descanso (Baja temporal)

Los descansos permiten marcar periodos en los que una instructora no estara disponible (vacaciones, licencia medica, dias personales, etc.) sin eliminarla del sistema.

**Para agregar un descanso:**

1. Haz clic en el boton **"Descansos"** o el icono correspondiente en la fila de la instructora.
2. Haz clic en **"Agregar Descanso"**.
3. Completa el formulario:
   - **Tipo** — Motivo general del descanso (ej.: Personal)
   - **Motivo** — Descripcion breve (obligatorio)
   - **Es recurrente?** — Elige entre:
     - **No recurrente:** Indica fecha de inicio y fecha de fin
     - **Recurrente semanal:** Indica el dia de la semana que siempre descansa
4. Haz clic en **Guardar**.

Mientras un descanso este activo, la instructora aparecera con el indicador **"En descanso"** en la tabla y en las metricas.

### 4.7 Ver y modificar horarios semanales

Los horarios semanales definen en que franjas horarias puede impartir clases una instructora a lo largo de la semana.

**Para ver o editar los horarios:**

1. Localiza a la instructora.
2. Haz clic en el boton de **Horarios** (o el icono de calendario junto a su nombre).
3. Veras la distribucion de dias y horas asignados.
4. Para modificar, edita los dias y horarios disponibles y guarda.

> Recuerda la regla: si no hay horarios personalizados asignados, la instructora se considera disponible en todos los horarios estandar de sus tipos de clase.

### 4.8 Reglas de eliminacion

Antes de eliminar a una instructora, el sistema realiza las siguientes verificaciones:

- **Si tiene clases pasadas registradas:** No puede eliminarse, para preservar el historial del club. En su lugar, marcala como **No disponible**.
- **Si tiene clases futuras ya reservadas:** El sistema solicitara que primero cambies la instructora asignada en cada una de esas clases antes de permitir la eliminacion.

Esto protege la integridad de los registros historicos y evita dejar reservas sin instructora asignada.

---

## 5. Reservas

La seccion de **Reservas** ofrece una vista centralizada de todas las clases y actividades reservadas en el club.

### 5.1 Como acceder

Desde el menu principal, haz clic en **Reservas**. Tambien puedes acceder desde **Contabilidad > pestana Reservas**.

### 5.2 Vista de la tabla

| Columna | Descripcion |
|---|---|
| **Nombre** | Nombre del cliente que realizo la reserva |
| **Actividad** | Tipo de clase reservada, mostrada con una etiqueta de color |
| **Fecha** | Dia de la clase |
| **Hora** | Franja horaria de la clase |
| **Estado** | Estado actual de la reserva |

En la parte superior se muestra el **total de reservas** como indicador rapido.

### 5.3 Colores por tipo de actividad

| Etiqueta de color | Actividad |
|---|---|
| Verde / azul | Iniciacion |
| Tierra / cafe | Paseo |
| Dorado / amarillo | Salto |

---

## 6. Horarios Extra

La seccion de **Horarios Extra** permite asignar clases adicionales o personalizadas a clientes especificos, fuera del calendario estandar del club. Son especialmente utiles para alumnos con horarios particulares o lecciones privadas.

### 6.1 Como acceder

Desde el menu principal, haz clic en **Horarios Extra**. Tambien accesible desde **Contabilidad > Horarios Personalizados**.

### 6.2 Vista general

Al ingresar, veras la lista de todos los horarios extra registrados. Cada entrada muestra el cliente, la clase, la instructora, el tipo (fecha unica o recurrente) y el horario asignado.

### 6.3 Agregar un horario extra

1. Haz clic en el boton **"Nuevo Horario Extra"**.
2. Completa el formulario paso a paso:

**Paso 1 — Seleccionar cliente:**
Escribe el nombre del cliente en el campo de busqueda y seleccionalo de la lista desplegable.

**Paso 2 — Seleccionar tipo de clase:**
Elige el tipo de clase (Iniciacion, Pony Club, Paseo, Intermedio, etc.).

**Paso 3 — Seleccionar instructora:**
El sistema filtra automaticamente y muestra solo las instructoras habilitadas para el tipo de clase seleccionado. Si el desplegable aparece vacio, ninguna instructora activa esta habilitada para ese tipo de clase.

**Paso 4 — Elegir tipo de horario:**
Ver seccion 6.4 para los dos tipos disponibles.

**Paso 5 — Definir horario:**
- Hora de inicio (obligatorio).
- Hora de fin — Se calcula automaticamente segun la duracion predeterminada:
  - Iniciacion y Pony Club: 30 minutos
  - Otros tipos: 60 minutos
- La hora de fin puede ajustarse manualmente si la clase tiene una duracion diferente.

3. Haz clic en **Guardar**.

### 6.4 Tipos de horario extra

#### Tipo 1: Fecha Unica

Asigna la clase a **un dia especifico del calendario**. El sistema pedira seleccionar la fecha exacta (dia, mes y año).

Util para: clases de prueba, recuperaciones puntuales o lecciones especiales.

#### Tipo 2: Cada Semana (Recurrente)

Asigna la clase de forma **repetida semana a semana** en los dias que se indiquen. El sistema pedira seleccionar uno o varios dias de la semana (Lunes, Martes, Miercoles, Jueves, Viernes, Sabado, Domingo).

Si se seleccionan varios dias (ej.: Lunes y Miercoles), el sistema creara automaticamente un horario independiente por cada dia seleccionado.

Ideal para: alumnos con clases regulares en dias y horarios fijos distintos al estandar.

### 6.5 Editar o eliminar un horario extra

- **Editar:** Haz clic en el icono de lapiz junto al horario. Se abrira el formulario con los datos actuales para modificarlos.
- **Eliminar:** Haz clic en el icono de eliminar. El sistema pedira confirmacion antes de borrar el registro.

---

## 7. Bloqueos

La seccion de **Bloqueos** permite cerrar horarios puntuales para que los clientes no puedan reservar — util cuando hay mal clima, un evento del club, o cualquier motivo que obligue a suspender clases en un dia y turno especifico.

> **Importante:** Un bloqueo solo **impide nuevas reservas**. Las reservas que los clientes ya hicieron en ese horario **no se cancelan automaticamente**. Si necesitas cancelarlas, hazlo manualmente desde la pestaña **Reservas** una por una.

### 7.1 Como acceder

Desde el menu principal, haz clic en **Contabilidad** y luego en la pestaña **Bloqueos** (entre "Horarios Extras" y "Metricas").

### 7.2 Vista general

Al ingresar veras la lista de bloqueos registrados, con tres filtros arriba:

- **Vigentes** — bloqueos de hoy en adelante (los que estan activos o aplicaran proximamente). Es la vista por defecto.
- **Pasados** — bloqueos cuya fecha ya paso (historico).
- **Todos** — muestra ambos.

Cada fila de la tabla muestra:

| Columna | Descripcion |
|---|---|
| **Fecha** | Dia bloqueado (ej.: lun. 15 may. 2026) |
| **Turno** | `mañana` (slots antes de las 12:00) o `tarde` (slots desde las 12:00) |
| **Clase** | Nombre de la clase bloqueada, o **"Todas las clases"** si aplica a todas |
| **Motivo** | Texto libre que explica el bloqueo (clima, evento, etc.). Puede estar vacio. |
| **Acciones** | Boton de eliminar |

### 7.3 Crear un bloqueo

1. Haz clic en el boton **"Nuevo Bloqueo"** arriba a la derecha.
2. Completa el formulario:

**Fecha:** dia que quieres cerrar. Solo se permiten fechas de hoy en adelante.

**Turno:** elige uno de los dos:
- **Mañana** — afecta todos los slots con hora_inicio antes de las 12:00.
- **Tarde** — afecta todos los slots con hora_inicio desde las 12:00.

**Clases a bloquear:**
- Por defecto esta marcada la casilla **"Todas las clases"** — bloquea todos los tipos (Iniciación, Intermedio, Avanzado, Paseo, Pony Club…) para esa fecha + turno.
- Si quieres bloquear solo algunos tipos, **desmarca** "Todas las clases" y marca las casillas individuales de las clases que quieres cerrar (puedes elegir varias a la vez).

**Motivo (opcional):** texto corto que se mostrara a los clientes en las tarjetas bloqueadas (ej.: "clima", "evento del club"). Si lo dejas vacio, los clientes solo veran "Clases canceladas".

3. Haz clic en **Crear Bloqueo**.

> **Nota:** Si seleccionaste varias clases, el sistema crea **un bloqueo por cada clase** (los veras como filas separadas en la tabla). Si elegiste "Todas las clases", se crea **una sola fila** con clase = "Todas las clases".

### 7.4 Que ven los clientes

En el calendario semanal del cliente, los slots bloqueados aparecen en **rojo** con la etiqueta:
- **"Clases canceladas: <motivo>"** si pusiste motivo.
- **"Clases canceladas"** si no pusiste motivo.

El cliente no puede hacer clic sobre esos slots para reservar. Si intenta reservar via API directa, el backend tambien lo rechaza con el mismo mensaje.

### 7.5 Eliminar un bloqueo

Haz clic en el icono de basura de la fila. El sistema pedira confirmacion. Al eliminar el bloqueo, las clases vuelven a estar disponibles inmediatamente para que los clientes reserven.

### 7.6 Ejemplos comunes

- **"Bloquear las clases de la tarde de mañana"**: Fecha = mañana, Turno = `tarde`, Clases = "Todas las clases".
- **"Cerrar el dia entero el viernes"**: crea **dos** bloqueos para esa fecha — uno con turno `mañana` y otro con turno `tarde`.
- **"Solo cancelar iniciación y avanzado de la tarde del sabado"**: Fecha = sabado, Turno = `tarde`, desmarca "Todas las clases" y marca solo Iniciación y Avanzado.

---

## 8. Metricas

La seccion de **Metricas** proporciona un resumen analitico del rendimiento del club, disenado para apoyar la toma de decisiones operativas y academicas.

### 7.1 Como acceder

Desde **Contabilidad**, haz clic en la pestana **Metricas**.

### 7.2 Seleccionar el periodo de analisis

| Opcion | Periodo |
|---|---|
| **Este mes** | Desde el dia 1 del mes actual hasta hoy |
| **Ultimo mes** | El mes calendario anterior completo |
| **Ultimos 3 meses** | Los tres meses anteriores al actual |
| **Todo el historial** | Desde enero 2024 hasta la fecha actual |

Tambien puedes ingresar manualmente un **rango de fechas personalizado** usando los campos de inicio y fin.

> **Consejo:** Para analisis de temporada (verano, vacaciones escolares), usa el rango personalizado para delimitar exactamente el periodo que te interesa.

### 7.3 Indicadores principales (KPIs)

**Clases Realizadas**
Total de clases completadas en el periodo. Un numero que baje bruscamente puede indicar un problema de disponibilidad de instructoras o caballos.

**Inasistencias**
Total de no-shows o cancelaciones. Si crece, vale la pena revisar que nivel o instructora concentra mas ausencias.

**Tasa de Asistencia**
Porcentaje de clases asistidas vs. programadas.

| Rango | Evaluacion |
|---|---|
| 80% o mas | Excelente. Nivel de compromiso solido. |
| 50% a 79% | Aceptable, pero con margen de mejora. |
| Menos del 50% | Atencion requerida. Alta tasa de faltas. |

**Horario mas Demandado**
La franja horaria con mas reservas en el periodo. Util para asignar instructoras y caballos en los picos de demanda.

### 7.4 Rendimiento por nivel

| Columna | Descripcion |
|---|---|
| **Nivel** | Nombre del tipo de clase |
| **Alumna Estrella** | El cliente con mayor asistencia en ese nivel |
| **Mas Inasistencias** | El cliente con mas faltas en ese nivel |
| **Horario mas Demandado** | La franja horaria preferida para ese nivel |
| **Clases Realizadas** | Total de clases de ese nivel en el periodo |

**Como usar esta tabla:**

- Si un nivel tiene pocas clases realizadas y un horario poco demandado, puede ser buena senal para ajustar la oferta o promocionar ese nivel.
- El cliente con mas inasistencias puede ser candidato a un contacto de seguimiento o a un cambio de horario.
- La alumna estrella puede ser reconocida o invitada a asumir mayor compromiso (ej.: preparacion para competencias).

### 7.5 Rendimiento por instructora

| Dato | Descripcion |
|---|---|
| **Estado** | Indicador visual de disponibilidad actual |
| **Niveles impartidos** | Tipos de clase que dio y cuantas veces |
| **Total de clases** | Numero absoluto de clases impartidas en el periodo |
| **Porcentaje comparativo** | Proporcion de clases respecto a la instructora lider (= 100%) |
| **Alumna frecuente** | El cliente que mas ha tenido clase con ella |

**Estados posibles:**

| Indicador | Significado |
|---|---|
| Sin badge especial | Activa y disponible |
| Badge amarillo "En descanso" | Baja temporal activa |
| Badge gris "Inactiva" | Fuera de servicio |

**Como usar esta seccion:**

- Compara la distribucion de carga entre instructoras. Si una esta en el 100% y otra en el 20%, puede haber un desequilibrio que afecte la calidad o genere desgaste.
- Las instructoras en descanso aparecen en el reporte historico pero no recibiran nuevas asignaciones mientras dure el descanso.
- El dato de alumna frecuente es util para detectar vinculos fuertes alumna-instructora que conviene mantener al asignar horarios.

---

## 9. Preguntas Frecuentes

**Por que no veo un cliente que acaban de registrar?**

El sistema se actualiza automaticamente cada 30 segundos. Espera un momento o cambia de pestana en el navegador y vuelve para forzar la actualizacion inmediata.

**Puedo cambiar el estado o nivel de un cliente desde la tabla sin abrir ningun modal?**

Si. Los desplegables de Estado y Nivel en la tabla son directamente editables. El cambio se guarda al instante.

**Que pasa si el sistema marca a un cliente como "Bloqueado" aunque yo lo tenga como "Activo"?**

El sistema aplica automaticamente el estado visual de "Bloqueado" cuando la fecha del proximo pago ya vencio, aunque el estado real siga siendo "Activo". Para resolverlo, registra el pago del cliente en su historial.

**Puedo eliminar un pago registrado por error?**

Si. Desde el modal de historial de pagos, cada pago tiene una opcion de eliminar.

**Que pasa si intento eliminar una instructora con clases futuras?**

El sistema no lo permitira. Primero debes reasignar las clases futuras a otra instructora, y luego podras eliminarla.

**Se pierden los datos historicos si marco una instructora como inactiva?**

No. Al marcarla como "No disponible" se preservan todos sus registros historicos. Solo deja de aparecer en las busquedas de disponibilidad para nuevas asignaciones.

---

*Manual de uso interno — Personal administrativo de El Refugio*
