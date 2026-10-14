# Eventify API

API REST para gestionar **eventos e inscripciones**, desarrollada con **Node.js, Express 5, MongoDB y Mongoose**. Permite registrar usuarios, iniciar sesión, organizar eventos, publicar un catálogo público, reservar entradas y cancelar inscripciones, con controles de acceso y capacidad.

**Repositorio:** https://github.com/agush1t/eventify-api

## Tecnologías

- **Backend:** Node.js, Express 5, JavaScript con ECMAScript Modules (ESM).
- **Persistencia:** MongoDB (por ejemplo, MongoDB Atlas) y Mongoose.
- **Seguridad:** Passport.js (`passport-local`, `passport-jwt`), JWT en cookies, bcrypt y `cookie-parser`.
- **Configuración y correo:** dotenv y Nodemailer.
- **Pruebas:** `node:test`, Supertest y `mongodb-memory-server`.

## Funcionalidades

- Registro de usuarios, inicio y cierre de sesión, y consulta del usuario autenticado.
- Roles `user`, `organizer` y `admin`, con autorización por ruta y control de propiedad de los recursos.
- Eventos con estados `draft`, `published`, `cancelled` y `finished`.
- Catálogo público limitado a eventos publicados; consultas privadas para organizadores y administradores.
- Filtros, paginación y ordenamiento de eventos, con validación de parámetros.
- Inscripciones con códigos de reserva, prevención de duplicados activos y control de cupos.
- Cancelación lógica de tickets y liberación de capacidad.
- Transacciones de MongoDB y control de concurrencia para evitar sobreventas en reservas simultáneas.
- DTO para controlar la información devuelta, manejo centralizado de errores y correos de confirmación/cancelación.

## Arquitectura

El proyecto separa las responsabilidades en capas:

```text
Ruta → Controller → Service → Repository → DAO → Model → MongoDB
                                  
Respuesta HTTP ← Controller ← DTO ← Service / datos recuperados
```

| Capa | Responsabilidad |
|---|---|
| **Routes** | Definir endpoints y aplicar middlewares. |
| **Controllers** | Recibir parámetros, invocar servicios y construir respuestas HTTP. |
| **Services** | Aplicar validaciones, reglas de negocio y permisos de propiedad. |
| **Repositories** | Abstraer operaciones de persistencia para los servicios. |
| **DAO** | Ejecutar consultas y escrituras con Mongoose. |
| **Models** | Definir los esquemas de MongoDB. |
| **DTO** | Transformar respuestas y evitar exponer datos sensibles. |
| **Middlewares** | Autenticar, autorizar y gestionar errores. |
| **Utils** | Funciones auxiliares de hash, JWT, errores y correo. |

Los servicios utilizan repositorios en lugar de acceder directamente a los modelos de Mongoose.

### Estructura principal

```text
src/
├── app.js
├── server.js
├── config/          # Configuración, MongoDB y Passport
├── routes/          # events, sessions, users, tickets
├── controllers/     # Controladores HTTP
├── services/        # Reglas de negocio
├── repositories/    # Abstracción de persistencia
├── dao/             # Operaciones Mongoose
├── dtos/            # EventDTO, UserDTO, TicketDTO
├── models/          # User, Event, Ticket
├── middlewares/     # auth, authorize, errorHandler
└── utils/           # JWT, hash, errores y correo

tests/
└── integration.test.js
```

## Instalación y ejecución

**Requisitos:** Node.js y npm compatibles con las dependencias del proyecto; acceso a una instancia de MongoDB. Para el envío real de correos se necesitan credenciales SMTP.

```bash
git clone https://github.com/agush1t/eventify-api.git
cd eventify-api
npm install
```

Crear `.env` en la raíz tomando como referencia `.env.example`:

```env
PORT=8080
NODE_ENV=development
MONGO_URL=mongodb+srv://<usuario>:<contraseña>@<cluster>/eventify
JWT_SECRET=REEMPLAZAR_POR_UN_SECRETO_ALEATORIO_LARGO
JWT_EXPIRES_IN=1h

MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=tu-correo@gmail.com
MAIL_PASS=tu-app-password
MAIL_FROM=tu-correo@gmail.com
```

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP; ejemplo: `8080`. |
| `NODE_ENV` | Entorno (`development`, `test`, `production`). |
| `MONGO_URL` | URI de conexión a MongoDB. |
| `JWT_SECRET` | Clave de firma de JWT; en producción debe tener al menos 32 caracteres. |
| `JWT_EXPIRES_IN` | Duración del JWT, por ejemplo `1h`; la cookie utiliza una duración coherente con el token. |
| `MAIL_*` | Configuración opcional del servidor SMTP, definida de manera conjunta. |

> **Seguridad:** no subir `.env`, contraseñas ni credenciales reales a GitHub. `.env.example` debe contener solo ejemplos.

Iniciar el servidor:

```bash
npm start
```

Para desarrollo con reinicio automático:

```bash
npm run dev
```

Para ejecutar la suite automatizada:

```bash
npm test
```

Al iniciar, la aplicación configura la conexión a MongoDB antes de escuchar solicitudes HTTP.

## Modelos principales

### User

Representa una cuenta con nombre, apellido, email, contraseña almacenada mediante hash y rol (`user`, `organizer` o `admin`). El registro público asigna siempre `user`.

### Event

| Campo | Tipo | Descripción |
|---|---|---|
| `title`, `description`, `category`, `location` | String | Información del evento. |
| `date` | Date | Fecha programada. |
| `capacity` | Number | Cantidad máxima de entradas disponibles. |
| `price` | Number | Precio, no negativo. |
| `status` | String | `draft`, `published`, `cancelled` o `finished`. |
| `organizer` | ObjectId → User | Usuario organizador. |
| `reservationVersion` | Number | Campo interno utilizado para coordinar escrituras concurrentes. |

### Ticket

| Campo | Tipo | Descripción |
|---|---|---|
| `user` | ObjectId → User | Propietario de la inscripción. |
| `event` | ObjectId → Event | Evento asociado. |
| `quantity` | Number | Cantidad de entradas reservadas. |
| `status` | String | `confirmed`, `pending` o `cancelled`. |
| `reservationCode` | String | Código único de reserva. |
| `cancelledAt` | Date | Fecha de cancelación, si corresponde. |
| `createdAt`, `updatedAt` | Date | Marcas temporales del documento. |

El flujo de inscripción actual genera tickets `confirmed`; `pending` está definido en el modelo, pero no se implementa una lista de espera automática.

## Autenticación y autorización

Passport centraliza tres estrategias:

- **`register`:** recibe `email`, `password` y los demás campos, y delega la creación del usuario al servicio.
- **`login`:** normaliza el email, busca el usuario y verifica la contraseña con bcrypt.
- **`current`:** extrae el JWT de la cookie `currentUser`, verifica su validez y consulta el usuario existente en la base de datos.

El login guarda el JWT en una cookie `httpOnly`, `sameSite: lax`, con `secure` activado en producción. Su duración depende de `JWT_EXPIRES_IN`; con el ejemplo `1h`, dura una hora. El logout elimina la cookie.

### Ejemplo de registro

`POST /api/sessions/register`

```json
{
  "first_name": "Agustin",
  "last_name": "Acosta",
  "email": "agustin@example.com",
  "password": "claveSegura123"
}
```

Se requieren los cuatro campos. El email se normaliza y valida, la contraseña debe tener al menos **6 caracteres** y los emails duplicados devuelven `409 Conflict`. El rol se asigna desde el servidor: **no es posible registrarse públicamente como `organizer` o `admin`**.

### Roles y permisos

| Acción | `user` | `organizer` | `admin` |
|---|:---:|:---:|:---:|
| Consultar catálogo público de eventos publicados | Sí | Sí | Sí |
| Consultar eventos propios, incluso no publicados | No | Sí | Sí |
| Consultar todos los eventos mediante ruta administrativa | No | No | Sí |
| Crear eventos | No | Sí | Sí |
| Editar/cambiar estado de eventos propios | No | Sí | Sí |
| Administrar eventos ajenos | No | No | Sí |
| Consultar todos los usuarios | No | No | Sí |
| Crear y consultar inscripciones propias | Sí | Sí | Sí |
| Consultar tickets de un evento propio | No | Sí | Sí |
| Consultar tickets de eventos ajenos | No | No | Sí |
| Cancelar un ticket propio | Sí | Sí | Sí |
| Cancelar tickets ajenos | No | No | Sí |

Los permisos se verifican mediante middlewares y, cuando corresponde, reglas de propiedad en los servicios.

### Usuarios de prueba y asignación de roles

El registro público mediante `POST /api/sessions/register` crea usuarios con el rol `user`. Por seguridad, no permite elegir los roles `organizer` ni `admin` desde la solicitud.

Para probar los tres roles en un entorno de desarrollo:

1. Registrar tres cuentas con correos diferentes mediante `POST /api/sessions/register`.
2. Conectarse a la base de datos de desarrollo mediante MongoDB Compass.
3. Abrir la colección `users`.
4. Mantener la primera cuenta con el rol `user`.
5. Cambiar el campo `role` de la segunda cuenta a `"organizer"`.
6. Cambiar el campo `role` de la tercera cuenta a `"admin"`.
7. Iniciar sesión con cada cuenta mediante `POST /api/sessions/login`.

**Permisos de prueba:**

- `user`: consultar eventos publicados, reservar entradas y cancelar inscripciones propias.
- `organizer`: crear y administrar eventos propios, publicarlos y consultar sus inscripciones.
- `admin`: administrar eventos y consultar usuarios e inscripciones según los permisos de la API.

**Importante:** este procedimiento debe realizarse únicamente en una base de datos de desarrollo o pruebas. No se deben publicar contraseñas ni credenciales reales.

## Endpoints

Todas las rutas comienzan con `/api`.

### Salud y sesiones

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/health` | Público | Estado básico del servidor. |
| POST | `/api/sessions/register` | Público | Registro de usuario. |
| POST | `/api/sessions/login` | Público | Login y cookie JWT. |
| GET | `/api/sessions/current` | Autenticado | Datos del usuario actual. |
| POST | `/api/sessions/logout` | Público | Elimina la cookie de sesión. |
| GET | `/api/sessions` | Público | Ruta existente; devuelve una lista vacía. |

Respuesta de `GET /api/health`:

```json
{
  "status": "ok",
  "message": "Servidor activo"
}
```

### Eventos

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/events` | Público | Catálogo de eventos **publicados**. |
| GET | `/api/events/:id` | Público | Detalle de evento publicado; los demás no se muestran (`404`). |
| GET | `/api/events/mine` | `organizer`, `admin` | Eventos creados por el usuario autenticado, de cualquier estado. |
| GET | `/api/events/admin/all` | `admin` | Todos los eventos, de cualquier estado. |
| GET | `/api/events/manage/:id` | `organizer` propietario o `admin` | Detalle privado de gestión, incluso no publicado. |
| POST | `/api/events` | `organizer`, `admin` | Crear evento. |
| PUT | `/api/events/:id` | `organizer` propietario o `admin` | Actualizar evento. |
| PATCH | `/api/events/:id/status` | `organizer` propietario o `admin` | Cambiar estado. |

#### Filtros y paginación

Las rutas de listado aceptan los filtros `status`, `category`, `location`, `organizer`, `dateFrom` y `dateTo`, además de:

- `page`: entero positivo; predeterminado `1`.
- `limit`: entero positivo entre 1 y 100; predeterminado `10`.
- `sort`: `date`, `title` o `price`; prefijo `-` para orden descendente.

Las fechas de filtro se envían en formato ISO, por ejemplo `2027-10-10` o `2027-10-10T18:00:00Z`. `dateFrom` no puede ser posterior a `dateTo`.

En **`GET /api/events`**, el estado siempre se limita a `published`: solicitar otro estado devuelve `400`, en lugar de revelar eventos privados. Los filtros desconocidos o inválidos también devuelven `400`.

```http
GET /api/events?category=workshop&page=1&limit=5&sort=date
GET /api/events?dateFrom=2027-01-01&dateTo=2027-12-31
GET /api/events/mine?status=draft
GET /api/events/admin/all?status=cancelled&sort=-date
```

Los listados responden con `status`, `data`, `page`, `limit`, `total` y `totalPages`.

#### Crear evento

`POST /api/events` (requiere sesión de `organizer` o `admin`):

```json
{
  "title": "Workshop de desarrollo web",
  "description": "Evento sobre desarrollo web",
  "category": "workshop",
  "date": "2027-10-10T18:00:00.000Z",
  "location": "Buenos Aires",
  "capacity": 100,
  "price": 5000
}
```

El organizador se obtiene del usuario autenticado, no del body. Los eventos se crean con estado `draft` y fecha futura. `capacity` debe ser un entero positivo, `price` debe ser no negativo y los campos de texto requeridos no pueden estar vacíos.

#### Estados y edición

Transiciones permitidas:

```text
draft ────────→ published ────────→ finished
  │                  │
  └──→ cancelled ←───┘
```

- Solo puede publicarse un evento cuya fecha todavía no haya pasado.
- Solo puede finalizarse un evento después de su fecha.
- `cancelled` y `finished` son estados terminales; no admiten nuevas modificaciones.
- La capacidad de un evento no puede reducirse por debajo de las entradas activas ya reservadas.

Para cambiar de estado:

`PATCH /api/events/:id/status`

```json
{
  "status": "published"
}
```

### Tickets e inscripciones

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/events/:eid/tickets` | Autenticado | Crear inscripción. |
| GET | `/api/tickets/my-tickets` | Autenticado | Consultar tickets propios. |
| GET | `/api/events/:eid/tickets` | Organizador propietario o `admin` | Consultar inscripciones de un evento. |
| PATCH | `/api/tickets/:tid/cancel` | Propietario del ticket o `admin` | Cancelar inscripción. |

Crear inscripción:

`POST /api/events/:eid/tickets`

```json
{
  "quantity": 1
}
```

**Reglas:** el evento debe existir, estar `published` y tener fecha futura; `quantity` debe ser un entero positivo; debe existir capacidad suficiente y el usuario no puede mantener otra inscripción activa para el mismo evento.

La ocupación considera tickets `confirmed` y `pending`, pero excluye `cancelled`. Por ejemplo, con capacidad 100, 40 entradas confirmadas y 5 pendientes, quedan **55 cupos**. Una reserva nueva se crea como `confirmed` y recibe un código de reserva.

Las reservas duplicadas activas o sin cupos suficientes devuelven `409 Conflict`.

**Concurrencia:** la creación y cancelación de tickets emplean transacciones de MongoDB. La escritura coordinada sobre el evento mediante `reservationVersion` permite detectar conflictos cuando varias solicitudes intentan reservar simultáneamente el último cupo. También se define un índice único parcial para impedir dos tickets activos del mismo usuario en el mismo evento. Para usar transacciones se necesita un despliegue de MongoDB compatible (por ejemplo, un replica set).

**Cancelación:** `PATCH /api/tickets/:tid/cancel` marca el ticket como `cancelled`, registra `cancelledAt` y libera los cupos correspondientes, sin borrar el documento. No se permite cancelar dos veces el mismo ticket.

### Usuarios

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/users` | `admin` | Consultar usuarios registrados, sin exponer contraseñas. |

## Correos electrónicos

Nodemailer permite enviar notificaciones de confirmación y cancelación. La configuración se obtiene de las variables `MAIL_*`. Un fallo de SMTP se registra sin revertir la reserva o cancelación ya realizada. En las pruebas se utiliza un transporte simulado (`jsonTransport`), sin envío de correos reales.

## Errores HTTP

| Código | Significado | Ejemplo |
|---|---|---|
| `200 OK` | Consulta o actualización exitosa | Consultar eventos. |
| `201 Created` | Recurso creado | Registrar usuario o ticket. |
| `400 Bad Request` | Parámetro o regla inválida | Filtro desconocido, fecha inválida. |
| `401 Unauthorized` | Falta autenticación válida | JWT ausente o vencido. |
| `403 Forbidden` | Sin permisos suficientes | Editar evento ajeno. |
| `404 Not Found` | Recurso no visible o inexistente | Consultar públicamente un evento `draft`. |
| `409 Conflict` | Conflicto de reserva o duplicado | Cupos agotados, email repetido. |
| `500 Internal Server Error` | Error interno no controlado | Fallo inesperado. |

Los errores se centralizan en `src/middlewares/errorHandler.js` y se devuelven como JSON.

## Pruebas de integración

```bash
npm test
```

La suite `tests/integration.test.js` utiliza `node:test`, Supertest y `mongodb-memory-server` con una base de datos temporal aislada del entorno de desarrollo. **Última ejecución informada: 17 de 17 pruebas aprobadas.**

Los 17 escenarios automatizados cubren:

1. Flujo completo de registro, login, evento, ticket y cancelación.
2. Rechazo de `/api/sessions/current` sin autenticación.
3. Logout y bloqueo posterior de `/api/sessions/current`.
4. Rechazo de credenciales de login incorrectas.
5. Rechazo de email duplicado.
6. Prevención de autoasignación del rol administrador en el registro.
7. Bloqueo de creación de eventos por usuarios comunes.
8. Protección frente a la cancelación de tickets ajenos.
9. Liberación de cupos tras cancelar una inscripción.
10. Dos reservas simultáneas sin sobrepasar el último cupo.
11. Validaciones de capacidad, estados y permisos de edición.
12. Validación de textos vacíos y límite de paginación.
13. Coherencia entre duración de cookie y expiración de JWT.
14. Rechazo de JWT expirados o manipulados.
15. Catálogo público limitado a publicados y protección del detalle.
16. Rechazo de filtros inválidos con HTTP 400.
17. Visibilidad de eventos propios para organizadores y global para administradores.

Las pruebas de correo utilizan un transporte simulado: no comprueban la entrega real mediante un proveedor SMTP.

## Posibles mejoras futuras

- Lista de espera automática y flujo completo de tickets `pending`.
- Recuperación de contraseñas.
- Autenticación con proveedores externos.
- Integración de pagos.
- Dashboard y estadísticas administrativas.
- Consulta real de sesiones en `GET /api/sessions`, actualmente una ruta de compatibilidad que devuelve una lista vacía.

---

**Eventify API** — Proyecto de Backend II, Coderhouse.  
**Código fuente:** https://github.com/agush1t/eventify-api
