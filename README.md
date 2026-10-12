# Eventify API

API REST para la gestión de eventos e inscripciones, desarrollada con Node.js, Express y MongoDB.

Eventify permite registrar usuarios, autenticar sesiones, crear y administrar eventos, gestionar inscripciones (tickets), controlar cupos y cancelar inscripciones. El proyecto utiliza una arquitectura por capas y separa el acceso a datos de la lógica de negocio.

## Tecnologías

- Node.js y Express 5
- JavaScript con ECMAScript Modules (ESM)
- MongoDB y Mongoose
- Passport.js (`passport-local` y `passport-jwt`)
- JSON Web Tokens (JWT) almacenados en cookies
- bcrypt para el hash de contraseñas
- cookie-parser
- dotenv
- Nodemailer para el envío de emails
- node:test, Supertest y MongoDB Memory Server para pruebas de integración

## Funcionalidades principales

- Registro de usuarios con validación y hash de contraseñas.
- Inicio y cierre de sesión.
- Autenticación mediante JWT en una cookie `httpOnly`.
- Autorización basada en los roles `user`, `organizer` y `admin`.
- Creación, consulta, edición y cambio de estado de eventos.
- Filtros, paginación y ordenamiento de eventos.
- Control de propiedad (ownership) de eventos.
- Inscripción a eventos y prevención de inscripciones activas duplicadas.
- Control de capacidad y liberación de cupos al cancelar una inscripción.
- Consulta de tickets propios y de los tickets de un evento para usuarios autorizados.
- Envío de emails de confirmación y cancelación mediante Nodemailer.
- DTO para limitar los datos expuestos en las respuestas.
- Manejo centralizado de errores.

## Arquitectura

El proyecto utiliza las siguientes capas:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
DAO
  ↓
Models / MongoDB
```

Los datos que se devuelven al cliente pasan por DTO:

```text
MongoDB → DAO → Repository → Service → DTO → Controller → Respuesta HTTP
```

Responsabilidad de cada capa:

- **Routes:** definen los endpoints y aplican los middlewares.
- **Controllers:** coordinan la solicitud HTTP y la respuesta.
- **Services:** contienen las reglas y validaciones de negocio.
- **Repositories:** abstraen el acceso a los datos y utilizan los DAO.
- **DAO:** realizan las operaciones de persistencia mediante Mongoose.
- **Models:** definen los esquemas de Mongoose.
- **DTO:** determinan qué información se expone al cliente.
- **Middlewares:** gestionan autenticación, autorización y errores.
- **Utils:** agrupan funciones auxiliares, como JWT, hash y correo.

Los Services no acceden directamente a los modelos ni a los DAO; utilizan los Repository correspondientes. Los DTO evitan devolver directamente los documentos de Mongoose y, entre otras cosas, impiden exponer contraseñas.

## Requisitos previos

- Node.js compatible con las dependencias del proyecto.
- npm.
- Una instancia de MongoDB, por ejemplo MongoDB Atlas.
- Credenciales SMTP si se desea enviar emails en un entorno real.

## Instalación

Cloná el repositorio y entrá en la carpeta:

```bash
git clone https://github.com/agush1t/eventify-api.git
cd eventify-api
npm install
```

## Variables de entorno

Creá un archivo `.env` en la raíz del proyecto tomando como referencia `.env.example`.

Ejemplo:

```env
PORT=8080
NODE_ENV=development
MONGO_URL=mongodb+srv://<usuario>:<contraseña>@<cluster>/eventify
JWT_SECRET=REEMPLAZAR_POR_UN_SECRETO_ALEATORIO_LARGO
JWT_EXPIRES_IN=1h

MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=correo@example.com
MAIL_PASS=contraseña_de_aplicacion
MAIL_FROM=correo@example.com
```

Descripción:

| Variable | Uso |
|---|---|
| `PORT` | Puerto HTTP del servidor. |
| `NODE_ENV` | Entorno de ejecución, por ejemplo `development`, `production` o `test`. |
| `MONGO_URL` | Cadena de conexión a MongoDB. |
| `JWT_SECRET` | Secreto para firmar y verificar los JWT. |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token, por ejemplo `1h`. |
| `MAIL_HOST` | Servidor SMTP. |
| `MAIL_PORT` | Puerto SMTP. |
| `MAIL_USER` | Usuario SMTP. |
| `MAIL_PASS` | Contraseña o credencial SMTP. |
| `MAIL_FROM` | Remitente de los emails. |

La configuración valida las variables necesarias para iniciar la aplicación y comprueba que las variables de correo estén configuradas en conjunto. En producción, `JWT_SECRET` debe tener al menos 32 caracteres.

**Importante:** no publiques el archivo `.env` ni credenciales reales. Mantené los secretos fuera del repositorio y usá `.env.example` únicamente con valores de ejemplo.

## Ejecución

Modo normal:

```bash
npm start
```

Modo desarrollo, con reinicio al detectar cambios:

```bash
npm run dev
```

Ejecutar las pruebas:

```bash
npm test
```

Al iniciar el servidor, la aplicación valida la configuración, conecta con MongoDB y luego comienza a escuchar en el puerto configurado.

## Estructura del proyecto

```text
src/
├── app.js
├── server.js
├── config/
│   ├── config.js
│   ├── database.js
│   └── passport.config.js
├── routes/
│   ├── events.router.js
│   ├── sessions.router.js
│   ├── users.router.js
│   └── tickets.router.js
├── controllers/
│   ├── events.controller.js
│   ├── sessions.controller.js
│   ├── users.controller.js
│   └── tickets.controller.js
├── services/
│   ├── events.service.js
│   ├── users.service.js
│   └── tickets.service.js
├── repositories/
│   ├── events.repository.js
│   ├── users.repository.js
│   └── tickets.repository.js
├── dao/
│   ├── events.dao.js
│   ├── users.dao.js
│   └── tickets.dao.js
├── dtos/
│   ├── event.dto.js
│   ├── user.dto.js
│   └── ticket.dto.js
├── models/
│   ├── User.js
│   ├── Event.js
│   └── Ticket.js
├── middlewares/
│   ├── auth.middleware.js
│   ├── authorize.middleware.js
│   └── errorHandler.js
└── utils/
    ├── generateError.js
    ├── hash.js
    ├── jwt.js
    └── mailer.js

tests/
└── integration.test.js
```

## Autenticación y sesiones

La autenticación se centraliza mediante Passport.js. El registro público asigna el rol `user` por defecto; no permite que el cliente se asigne a sí mismo el rol `organizer` o `admin`.

Al iniciar sesión correctamente, se genera un JWT y se almacena en la cookie `currentUser`, configurada con `httpOnly`, `sameSite: lax` y una duración de una hora. La opción `secure` se activa en producción.

La estrategia `current` verifica el token de la cookie para identificar al usuario autenticado. El cierre de sesión elimina la cookie.

### Endpoints de sesión

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/sessions/register` | Público | Registra un usuario. |
| `POST` | `/api/sessions/login` | Público | Inicia sesión y establece la cookie JWT. |
| `GET` | `/api/sessions/current` | Autenticado | Devuelve los datos del usuario actual. |
| `POST` | `/api/sessions/logout` | Público | Elimina la cookie de sesión. |
| `GET` | `/api/sessions` | Público | Endpoint existente, actualmente devuelve una lista vacía. |

Las respuestas de usuario se transforman mediante `UserDTO`; la contraseña no se devuelve.

### Ejemplo de registro

`POST /api/sessions/register`

```json
{
  "name": "Usuario de prueba",
  "email": "usuario@example.com",
  "password": "una_clave_segura"
}
```

El registro valida los campos, normaliza y valida el email, comprueba duplicados y almacena la contraseña mediante bcrypt. La estructura exacta de los campos admitidos debe respetar el modelo y la estrategia de registro del proyecto.

## Roles y permisos

Los roles disponibles son:

- `user`: puede consultar eventos, inscribirse, consultar sus tickets y cancelar sus propias inscripciones.
- `organizer`: además, puede crear y administrar sus propios eventos y consultar las inscripciones de esos eventos.
- `admin`: dispone de permisos administrativos, incluida la gestión de eventos de otros organizadores y la consulta de usuarios.

El control de roles se realiza con `authorize.middleware.js`. El control de propiedad se aplica en los Services cuando corresponde.

| Acción | `user` | `organizer` | `admin` |
|---|:---:|:---:|:---:|
| Consultar eventos | Sí | Sí | Sí |
| Crear eventos | No | Sí | Sí |
| Modificar o cambiar el estado de sus eventos | No | Sí | Sí |
| Modificar eventos de otros organizadores | No | No | Sí |
| Consultar todos los usuarios | No | No | Sí |
| Crear una inscripción | Sí | Sí | Sí |
| Consultar sus propios tickets | Sí | Sí | Sí |
| Consultar tickets de un evento propio | No | Sí | Sí |
| Consultar tickets de un evento ajeno | No | No | Sí |
| Cancelar su propio ticket | Sí | Sí | Sí |
| Cancelar el ticket de otra persona | No | No | Sí |

## Endpoints

Todas las rutas se encuentran bajo el prefijo `/api`.

### Health check

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/health` | Público | Comprueba que el servidor está activo. |

Respuesta:

```json
{
  "status": "ok",
  "message": "Servidor activo"
}
```

### Eventos

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/events` | Público | Lista eventos con filtros, paginación y ordenamiento. |
| `GET` | `/api/events/:id` | Público | Obtiene un evento por ID. |
| `POST` | `/api/events` | `organizer`, `admin` | Crea un evento. |
| `PUT` | `/api/events/:id` | `organizer`, `admin` | Actualiza un evento permitido. |
| `PATCH` | `/api/events/:id/status` | `organizer`, `admin` | Cambia el estado de un evento. |

#### Filtros, paginación y ordenamiento

`GET /api/events` admite estos filtros:

- `status`
- `category`
- `location`
- `organizer`
- `dateFrom`
- `dateTo`

Parámetros de paginación:

- `page`: página solicitada; por defecto `1`.
- `limit`: cantidad por página; por defecto `10`.

Ordenamiento mediante `sort`: los campos permitidos son `date`, `title` y `price`. Anteponé `-` para ordenar de forma descendente.

Ejemplos:

```http
GET /api/events?status=published&category=workshop
GET /api/events?page=2&limit=5
GET /api/events?sort=-date
GET /api/events?status=published&category=workshop&page=2&limit=5&sort=date
```

La respuesta incluye `data`, `page`, `limit`, `total` y `totalPages`.

#### Crear un evento

`POST /api/events` requiere autenticación y rol `organizer` o `admin`.

Ejemplo de body:

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

El organizador se obtiene del usuario autenticado; no se debe enviar `organizer` desde el body. El evento se crea con estado `draft`.

Reglas principales:

- Los campos requeridos deben estar presentes.
- La fecha debe ser futura.
- `capacity` debe ser un entero mayor que cero.
- `price` debe ser un número mayor o igual que cero.

#### Estados de evento

Los estados permitidos son:

- `draft`
- `published`
- `cancelled`
- `finished`

Para cambiar el estado:

`PATCH /api/events/:id/status`

```json
{
  "status": "published"
}
```

No se puede publicar un evento cancelado o finalizado. Un evento cancelado no puede volver a otro estado ni modificarse. La cancelación cambia el estado; no elimina físicamente el evento.

### Tickets e inscripciones

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/events/:eid/tickets` | Autenticado | Crea una inscripción a un evento. |
| `GET` | `/api/tickets/my-tickets` | Autenticado | Lista los tickets del usuario actual. |
| `GET` | `/api/events/:eid/tickets` | Organizador propietario o `admin` | Lista los tickets de un evento. |
| `PATCH` | `/api/tickets/:tid/cancel` | Propietario del ticket o `admin` | Cancela una inscripción. |

#### Crear una inscripción

`POST /api/events/:eid/tickets`

Body:

```json
{
  "quantity": 1
}
```

Reglas principales:

- El evento debe existir y estar publicado.
- La fecha del evento debe ser futura.
- `quantity` debe ser un entero mayor que cero.
- Debe haber cupos disponibles.
- El usuario no puede tener otra inscripción activa para el mismo evento.
- Las inscripciones canceladas no ocupan capacidad.

Una inscripción creada recibe un código de reserva y estado `confirmed`. Si no hay capacidad suficiente o ya existe una inscripción activa duplicada, la API devuelve `409 Conflict`.

#### Cancelar una inscripción

`PATCH /api/tickets/:tid/cancel`

La cancelación es lógica: el ticket permanece en la base de datos, cambia a estado `cancelled` y registra `cancelledAt`. Los cupos correspondientes vuelven a quedar disponibles. No se puede cancelar dos veces el mismo ticket.

Los estados de ticket definidos por el modelo incluyen `confirmed`, `pending` y `cancelled`; el flujo de creación actual genera tickets `confirmed`.

### Usuarios

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/users` | `admin` | Obtiene los usuarios registrados. |

La respuesta utiliza `UserDTO` y no expone contraseñas.

## Reglas de negocio y códigos HTTP

La API utiliza, entre otros, los siguientes códigos:

| Código | Significado | Ejemplos |
|---|---|---|
| `200 OK` | Operación correcta | Consultas, actualizaciones y cancelación de ticket. |
| `201 Created` | Recurso creado | Registro, creación de evento o inscripción. |
| `400 Bad Request` | Datos inválidos o regla de negocio incumplida | Fecha no válida, cantidad inválida o ticket ya cancelado. |
| `401 Unauthorized` | Falta autenticación válida | Acceso a una ruta protegida sin sesión. |
| `403 Forbidden` | El usuario no tiene permisos | Usuario común intenta crear un evento o alguien intenta cancelar un ticket ajeno. |
| `404 Not Found` | Recurso inexistente | Evento o ticket no encontrado. |
| `409 Conflict` | Conflicto con el estado actual | Inscripción activa duplicada o capacidad insuficiente. |
| `500 Internal Server Error` | Error inesperado del servidor | Fallo interno no controlado. |

Los errores se procesan mediante `src/middlewares/errorHandler.js`, que devuelve una respuesta JSON con `status: "error"` y un mensaje.

## Emails

Nodemailer se utiliza para intentar enviar emails de confirmación y cancelación de inscripciones. La configuración SMTP se obtiene de las variables `MAIL_*`.

Los errores de envío se registran sin interrumpir la operación principal de creación o cancelación del ticket. En el entorno de pruebas se utiliza `jsonTransport`, por lo que las pruebas no envían emails reales.

## Pruebas de integración

Ejecutá:

```bash
npm test
```

La suite se encuentra en `tests/integration.test.js` y utiliza `node:test`, Supertest y `mongodb-memory-server`. Las pruebas trabajan con una instancia temporal de MongoDB para no depender de la base de datos de desarrollo.

La suite incluye 9 tests de nivel superior que cubren, entre otros casos:

- Registro, login y consulta del usuario actual.
- Creación y publicación de eventos.
- Validaciones de eventos, filtros y paginación.
- Creación, consulta y cancelación de tickets.
- Rechazo de inscripciones duplicadas y control de cupos.
- Autenticación requerida y logout.
- Protección de roles y propiedad de recursos.
- Ocultamiento de contraseñas en las respuestas.
- Liberación de cupos al cancelar una inscripción.

Los tests contienen múltiples aserciones. El envío real de emails no se verifica mediante entrega SMTP, ya que el entorno de pruebas utiliza un transporte simulado.

## Estado actual y posibles mejoras

El proyecto ya cuenta con la arquitectura por capas, autenticación, autorización, gestión de eventos, inscripciones, control de cupos, cancelaciones, DTO y pruebas de integración descritas en este documento.

El endpoint `GET /api/sessions` existe, pero actualmente devuelve una lista vacía; no representa todavía una funcionalidad completa de consulta de sesiones.

Posibles mejoras futuras:

- Implementar la consulta real de sesiones, si forma parte del alcance.
- Completar una gestión de lista de espera y del estado `pending`.
- Recuperación de contraseña.
- Inicio de sesión con proveedores externos.
- Integración con pagos.
- Dashboard y estadísticas administrativas.

## Repositorio

[github.com/agush1t/eventify-api](https://github.com/agush1t/eventify-api)
