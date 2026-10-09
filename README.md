# Eventify API

API REST para una plataforma de gestión de eventos e inscripciones.

## Temática del proyecto

**Eventify** es una plataforma destinada a la gestión de eventos e inscripciones.

La API utiliza una arquitectura por capas y cuenta con:

- Autenticación mediante Passport.js.
- JWT almacenado en cookies.
- Autorización basada en roles.
- Control de permisos mediante middlewares reutilizables.
- Gestión de usuarios.
- Gestión de eventos.
- Gestión de tickets e inscripciones.
- Control de cupos.
- Cancelación de tickets.
- Envío de emails de confirmación mediante Nodemailer.
- Validaciones de negocio.
- Filtros, paginación y ordenamiento de eventos.
- Control de ownership sobre los eventos.
- Gestión de estados de los eventos.
- Arquitectura DAO, Repository y DTO.

---

## Tecnologías

- Node.js
- Express
- JavaScript
- ECMAScript Modules (ESM)
- dotenv
- Mongoose
- MongoDB Atlas
- bcrypt
- jsonwebtoken
- cookie-parser
- Passport.js
- passport-local
- passport-jwt
- Nodemailer

---

## Arquitectura

El proyecto utiliza una arquitectura organizada por capas, separando las responsabilidades de cada componente:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
DAO
  ↓
Model
  ↓
Base de datos
```

Para las respuestas de la API se utilizan DTO:

```text
Base de datos
     ↓
DAO
     ↓
Repository
     ↓
Service
     ↓
DTO
     ↓
Controller
     ↓
Respuesta HTTP
```

Cada capa tiene una responsabilidad específica:

- **Routes:** definen los endpoints y aplican middlewares.
- **Controllers:** coordinan la solicitud y respuesta HTTP.
- **Services:** contienen la lógica de negocio.
- **Repositories:** abstraen el acceso a los datos y trabajan con los DAO.
- **DAO:** realizan exclusivamente las operaciones de acceso a MongoDB mediante Mongoose.
- **Models:** definen los esquemas de Mongoose.
- **DTO:** controlan y transforman la información que se expone al cliente.

Esta estructura permite mantener el código organizado, facilitar su mantenimiento y desacoplar la lógica de negocio del acceso a los datos.

### Acceso a datos

Los DAO son la única capa que importa directamente los modelos de Mongoose.

Se encuentran implementados:

- `UsersDAO`
- `EventsDAO`
- `TicketsDAO`

Los Repository utilizan los DAO y exponen métodos orientados al dominio.

Los Services utilizan exclusivamente los Repository y no acceden directamente a los modelos ni a los DAO.

### Autenticación y autorización

La autenticación se encuentra centralizada mediante Passport.js y sus estrategias se configuran en:

```text
src/config/passport.config.js
```

Los controles de autenticación y autorización se implementan mediante middlewares reutilizables:

```text
src/middlewares/auth.middleware.js
src/middlewares/authorize.middleware.js
```

---

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/agush1t/eventify-api.git
```

Ingresar a la carpeta del proyecto:

```bash
cd eventify-api
```

Instalar las dependencias:

```bash
npm install
```

---

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto tomando como referencia `.env.example`.

Las variables utilizadas son:

```env
PORT=8080
NODE_ENV=development
MONGO_URL=mongodb+srv://<usuario>:<contraseña>@<cluster>/eventify
JWT_SECRET=clave_secreta
JWT_EXPIRES_IN=1h

MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=correo@example.com
MAIL_PASS=app_password
MAIL_FROM=correo@example.com
```

### Variables de MongoDB y JWT

`MONGO_URL` contiene la cadena de conexión utilizada para conectar la aplicación con MongoDB Atlas.

`JWT_SECRET` se utiliza para firmar y verificar los tokens JWT.

`JWT_EXPIRES_IN` permite configurar el tiempo de expiración de los tokens JWT.

### Variables de correo

Las variables `MAIL_*` se utilizan para configurar el envío de emails mediante Nodemailer.

- `MAIL_HOST`: servidor SMTP.
- `MAIL_PORT`: puerto SMTP.
- `MAIL_USER`: cuenta utilizada para autenticarse.
- `MAIL_PASS`: credencial utilizada para la autenticación SMTP.
- `MAIL_FROM`: dirección utilizada como remitente.

En el caso de Gmail se recomienda utilizar una contraseña de aplicación.

Las credenciales reales nunca deben publicarse en el repositorio.

El archivo `.env` se encuentra incluido en `.gitignore` y debe mantenerse fuera del control de versiones.

---

## Ejecución

Para ejecutar el servidor:

```bash
npm start
```

Para ejecutar el servidor en modo desarrollo:

```bash
npm run dev
```

El servidor utiliza el puerto configurado mediante la variable de entorno `PORT`.

Al iniciar correctamente, la aplicación establece la conexión con MongoDB y luego inicia el servidor Express.

---

# Estructura de carpetas

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
```

---

# Responsabilidad de cada capa

## Config

Centraliza la configuración de las variables de entorno, la conexión con MongoDB y las estrategias de Passport.

## Routes

Define los endpoints disponibles de la API y aplica los middlewares de autenticación y autorización correspondientes.

## Controllers

Reciben las solicitudes HTTP y construyen las respuestas HTTP.

Los controllers:

- Extraen información de `req.body`, `req.params` y `req.query`.
- Utilizan la información de `req.user` cuando corresponde.
- Invocan los métodos de los Services.
- Devuelven las respuestas HTTP correspondientes.
- Propagan los errores mediante `next(error)`.

Los controllers no contienen la lógica de negocio principal ni acceden directamente a Mongoose.

## Services

Contienen la lógica de negocio de la aplicación.

Se encuentran implementados servicios para:

- Usuarios.
- Eventos.
- Tickets e inscripciones.

`events.service.js` contiene las reglas relacionadas con fechas, capacidad, precios, estados y ownership.

`tickets.service.js` contiene las reglas relacionadas con inscripciones, cupos, duplicados, cancelaciones y envío de emails.

Los Services no acceden directamente a modelos Mongoose ni a los DAO. Utilizan los Repository correspondientes.

## Repositories

Abstraen el acceso a la fuente de datos y se comunican exclusivamente con los DAO.

Los Repository exponen métodos orientados al dominio que son utilizados por los Services.

Se encuentran implementados:

- `UsersRepository`
- `EventsRepository`
- `TicketsRepository`

De esta manera, la lógica de negocio no depende directamente de Mongoose.

## DAO

Los DAO gestionan exclusivamente el acceso a los datos mediante Mongoose.

Son la única capa que importa directamente los modelos:

```text
src/models/
```

Se encuentran implementados DAO para:

- Usuarios.
- Eventos.
- Tickets.

Los DAO exponen operaciones de acceso a datos como:

- Búsqueda por identificador.
- Búsqueda por email.
- Creación.
- Actualización.
- Búsquedas filtradas.
- Conteo de documentos.
- Consultas relacionadas con tickets.

Los DAO no contienen reglas de negocio.

## DTO

Los **DTO (Data Transfer Objects)** se utilizan para controlar y definir la información que la API expone hacia el cliente.

Se encuentran implementados DTO para:

- Usuarios.
- Eventos.
- Tickets e inscripciones.

Los archivos se encuentran en:

```text
src/dtos/
├── user.dto.js
├── event.dto.js
└── ticket.dto.js
```

Los DTO evitan que los modelos de Mongoose sean enviados directamente como respuesta HTTP.

Además, permiten ocultar información sensible.

Por ejemplo, las respuestas de usuarios nunca incluyen:

```text
password
```

Incluso cuando la contraseña se encuentra almacenada mediante un hash en la base de datos, nunca se expone mediante los DTO.

### DTO y documentos relacionados

Cuando un ticket utiliza `populate`, el DTO también controla qué información de los documentos relacionados se expone.

Por ejemplo, un usuario asociado a un ticket puede incluir:

```json
{
  "id": "...",
  "first_name": "...",
  "last_name": "...",
  "email": "..."
}
```

pero nunca incluye su contraseña.

Del mismo modo, la información del evento asociado al ticket se limita a los datos necesarios para la respuesta:

```json
{
  "id": "...",
  "title": "...",
  "date": "...",
  "location": "..."
}
```

### Flujo de respuesta

La información sigue el siguiente flujo:

```text
Base de datos
     ↓
DAO
     ↓
Repository
     ↓
Service
     ↓
DTO
     ↓
Controller
     ↓
Respuesta HTTP
```

De esta forma, la estructura interna de los modelos queda desacoplada de la representación que recibe el cliente.

## Models

Contienen los esquemas de Mongoose utilizados para representar los datos de la aplicación.

Actualmente se encuentran definidos los modelos:

- `User`
- `Event`
- `Ticket`

Los modelos solamente son utilizados directamente por los DAO.

## Middlewares

Contienen funcionalidades reutilizables que intervienen durante el procesamiento de las solicitudes.

Se utilizan middlewares separados para:

- Autenticación.
- Autorización.
- Manejo centralizado de errores.

## Utils

Contiene funciones auxiliares y reutilizables, como:

- Hash de contraseñas mediante bcrypt.
- Generación de errores personalizados.
- Generación y verificación de tokens JWT.
- Envío de emails mediante Nodemailer.

---

# Rutas disponibles

## Health Check

### GET `/api/health`

Verifica que el servidor se encuentre activo.

Respuesta:

```json
{
  "status": "ok",
  "message": "Servidor activo"
}
```

---

# Events

La entidad `Event` representa los eventos gestionados por la plataforma.

## Modelo Event

Los eventos contienen los siguientes campos:

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `title` | String | Sí | Título del evento |
| `description` | String | Sí | Descripción |
| `category` | String | Sí | Categoría del evento |
| `date` | Date | Sí | Fecha del evento |
| `location` | String | Sí | Ubicación |
| `capacity` | Number | Sí | Capacidad máxima |
| `price` | Number | Sí | Precio del evento |
| `status` | String | No | Estado del evento |
| `organizer` | ObjectId | Sí | Usuario organizador |

El campo `organizer` utiliza una referencia a `User`:

```text
organizer → User._id
```

No se almacena un objeto completo de usuario dentro del evento.

Los estados permitidos son:

```text
draft
published
cancelled
finished
```

El estado inicial de un evento nuevo es:

```text
draft
```

---

## GET `/api/events`

Obtiene una lista paginada de eventos.

Esta ruta es pública y no requiere autenticación.

### Filtros disponibles

Se pueden utilizar los siguientes parámetros:

- `status`
- `category`
- `location`
- `dateFrom`
- `dateTo`
- `organizer`

Ejemplo:

```text
GET /api/events?status=published&category=workshop
```

### Paginación

Se pueden utilizar:

- `page`
- `limit`

Ejemplo:

```text
GET /api/events?page=2&limit=5
```

Los valores predeterminados son:

```text
page = 1
limit = 10
```

### Ordenamiento

Se puede utilizar el parámetro:

```text
sort
```

Ejemplo:

```text
GET /api/events?sort=date
```

El ordenamiento debe utilizar campos permitidos por la aplicación.

### Ejemplo completo

```text
GET /api/events?status=published&category=workshop&page=2&limit=5&sort=date
```

### Respuesta

La respuesta incluye información de paginación:

```json
{
  "status": "success",
  "data": [],
  "page": 2,
  "limit": 5,
  "total": 10,
  "totalPages": 2
}
```

---

## GET `/api/events/:id`

Obtiene un evento específico mediante su identificador.

Ejemplo:

```text
GET /api/events/507f1f77bcf86cd799439011
```

Esta ruta es pública.

Si el evento no existe:

```text
404 Not Found
```

Respuesta:

```json
{
  "status": "error",
  "message": "Evento no encontrado"
}
```

---

## POST `/api/events`

Crea un nuevo evento.

### Autenticación

Requiere una sesión válida.

### Roles permitidos

- `organizer`
- `admin`

Los usuarios con rol `user` reciben:

```text
403 Forbidden
```

### Request

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

El campo `organizer` no debe enviarse desde el body.

El propietario del evento se asigna automáticamente utilizando el usuario autenticado:

```text
organizer = req.user.id
```

### Validaciones

Al crear un evento:

- `title` es obligatorio.
- `description` es obligatorio.
- `category` es obligatorio.
- `date` es obligatoria.
- `location` es obligatorio.
- `capacity` es obligatoria.
- `price` es obligatorio.
- La fecha debe ser futura.
- La capacidad debe ser mayor a `0`.
- El precio no puede ser negativo.

El evento se crea inicialmente con:

```text
status = draft
```

---

## PUT `/api/events/:id`

Modifica un evento existente.

### Autenticación

Requiere una sesión válida.

### Roles permitidos

- `organizer`
- `admin`

### Ownership

Los usuarios con rol `organizer` solamente pueden modificar eventos cuyo propietario sea el usuario autenticado.

Un `organizer` que intenta modificar el evento de otro organizer recibe:

```text
403 Forbidden
```

Los usuarios con rol `admin` pueden modificar cualquier evento.

### Campos modificables

```json
{
  "title": "Nuevo título",
  "description": "Nueva descripción",
  "category": "workshop",
  "date": "2027-10-20T18:00:00.000Z",
  "location": "Buenos Aires",
  "capacity": 150,
  "price": 7500
}
```

El campo `organizer` no se modifica desde el body.

### Regla para eventos cancelados

Los eventos con estado:

```text
cancelled
```

no pueden modificarse.

---

## PATCH `/api/events/:id/status`

Permite modificar el estado de un evento.

### Autenticación

Requiere una sesión válida.

### Roles permitidos

- `organizer`
- `admin`

### Request

```json
{
  "status": "published"
}
```

Los estados permitidos son:

```text
draft
published
cancelled
finished
```

No se puede publicar un evento que se encuentre:

```text
cancelled
```

o:

```text
finished
```

Un evento cancelado no puede volver a otro estado.

La cancelación se realiza modificando el estado:

```text
status = cancelled
```

No se realiza eliminación física del evento.

---

# Reglas de negocio de Events

Las principales reglas de negocio se encuentran implementadas en:

```text
src/services/events.service.js
```

### Fecha

Al crear un evento, la fecha debe ser futura.

Una fecha pasada genera:

```text
400 Bad Request
```

### Capacidad

La capacidad debe ser mayor a cero.

```text
capacity > 0
```

### Precio

El precio debe ser igual o mayor a cero.

```text
price >= 0
```

### Estados

Los estados permitidos son:

```text
draft
published
cancelled
finished
```

No se puede publicar un evento cancelado o finalizado.

Los eventos cancelados no pueden modificarse.

### Ownership

El `organizer` solamente puede modificar sus propios eventos.

El `admin` puede modificar eventos pertenecientes a cualquier organizer.

---

# Tickets e inscripciones

La entidad `Ticket` representa la inscripción de un usuario a un evento.

Los tickets utilizan referencias mediante `ObjectId` hacia los modelos `User` y `Event`.

No se almacenan objetos completos de usuario o evento dentro del ticket.

## Modelo Ticket

Los tickets contienen:

| Campo | Tipo | Descripción |
|---|---|---|
| `user` | ObjectId | Usuario propietario |
| `event` | ObjectId | Evento asociado |
| `status` | String | Estado del ticket |
| `quantity` | Number | Cantidad de entradas |
| `reservationCode` | String | Código único de reserva |
| `cancelledAt` | Date | Fecha de cancelación |
| `createdAt` | Date | Fecha de creación |

Los estados permitidos son:

```text
confirmed
pending
cancelled
```

El estado inicial de una inscripción es:

```text
confirmed
```

---

## POST `/api/events/:eid/tickets`

Crea una inscripción para un evento.

### Autenticación

Requiere una sesión válida.

### Request

```json
{
  "quantity": 1
}
```

### Validaciones

Para crear una inscripción:

- El evento debe existir.
- El evento debe encontrarse en estado `published`.
- La cantidad debe ser un número entero mayor que `0`.
- Debe existir capacidad suficiente.
- El usuario no puede tener otra inscripción activa para el mismo evento.

Una inscripción activa puede encontrarse en estado:

```text
confirmed
```

o:

```text
pending
```

Los tickets `cancelled` no se consideran inscripciones activas.

### Control de capacidad

La cantidad ocupada se calcula únicamente considerando tickets:

```text
confirmed
pending
```

Los tickets:

```text
cancelled
```

no ocupan capacidad.

Ejemplo:

```text
Capacidad del evento: 100

Tickets confirmed: 40
Tickets pending:    5
Tickets cancelled: 10

Cupos ocupados: 45
Cupos disponibles: 55
```

Si la cantidad solicitada supera los cupos disponibles, la inscripción es rechazada.

Respuesta de ejemplo:

```json
{
  "status": "error",
  "message": "No hay cupos suficientes. Cupos disponibles: 0"
}
```

### Código de reserva

Cada ticket recibe un código único de reserva:

```text
EVT-XXXXXXXXXXXX-XXXXXX
```

---

## GET `/api/tickets/my-tickets`

Obtiene las inscripciones del usuario autenticado.

### Autenticación

Requiere una sesión válida.

El endpoint solamente devuelve tickets pertenecientes al usuario autenticado.

Los datos del evento se obtienen mediante `populate` incluyendo:

- `title`
- `date`
- `location`

No se exponen datos sensibles de otros usuarios.

La respuesta se transforma mediante `TicketDTO` antes de ser enviada al cliente.

---

## GET `/api/events/:eid/tickets`

Obtiene las inscripciones asociadas a un evento.

### Autenticación

Requiere una sesión válida.

### Acceso

Puede acceder:

- El `organizer` propietario del evento.
- Un `admin`.

Un usuario sin permisos recibe:

```text
403 Forbidden
```

Un organizer que intenta consultar los tickets de un evento perteneciente a otro organizer también recibe:

```text
403 Forbidden
```

Los tickets incluyen información del usuario mediante `populate`, sin incluir información sensible como contraseñas.

La respuesta se transforma mediante `TicketDTO`.

---

## PATCH `/api/tickets/:tid/cancel`

Cancela una inscripción.

### Autenticación

Requiere una sesión válida.

### Permisos

Puede cancelar:

- El propietario del ticket.
- Un `admin`.

Un usuario autenticado que intenta cancelar el ticket de otra persona recibe:

```text
403 Forbidden
```

### Cancelación

La cancelación no elimina físicamente el ticket.

Se modifica:

```text
status = cancelled
```

y se establece:

```text
cancelledAt = fecha actual
```

Los tickets cancelados dejan de ocupar capacidad automáticamente.

Si un ticket ya está cancelado, la operación devuelve un error de negocio.

---

# Envío de emails

Las confirmaciones de inscripción se envían mediante **Nodemailer**.

La implementación se encuentra en:

```text
src/utils/mailer.js
```

Cuando una inscripción se crea correctamente, se envía un email de confirmación que incluye:

- Nombre del evento.
- Fecha.
- Ubicación.
- Cantidad de entradas.
- Código de reserva.

Las credenciales SMTP se obtienen exclusivamente mediante variables de entorno.

No se almacenan credenciales directamente en el código fuente.

---

# Flujo de inscripción

```text
POST /api/events/:eid/tickets
            ↓
auth
            ↓
TicketsController
            ↓
TicketsService
            ↓
EventsRepository
            ↓
EventsDAO
            ↓
Verificar evento
            ↓
Verificar estado published
            ↓
Validar quantity
            ↓
Verificar inscripción activa existente
            ↓
Calcular cupos ocupados
            ↓
Verificar capacidad disponible
            ↓
TicketsRepository
            ↓
TicketsDAO
            ↓
Crear Ticket
            ↓
Generar reservationCode
            ↓
Enviar email de confirmación
            ↓
TicketDTO
            ↓
Respuesta 201
```

---

# Flujo de cancelación

```text
PATCH /api/tickets/:tid/cancel
            ↓
auth
            ↓
TicketsController
            ↓
TicketsService
            ↓
TicketsRepository
            ↓
TicketsDAO
            ↓
Buscar ticket
            ↓
Verificar ownership/admin
            ↓
Verificar que no esté cancelado
            ↓
status = cancelled
            ↓
cancelledAt = fecha actual
            ↓
Ticket actualizado
            ↓
TicketDTO
            ↓
Respuesta HTTP
```

La cancelación libera automáticamente la cantidad de cupos correspondiente.

---

# Sessions

## GET `/api/sessions`

Endpoint correspondiente al recurso de sesiones.

---

# Autenticación

La autenticación se encuentra centralizada mediante **Passport.js**.

Las estrategias implementadas se encuentran en:

```text
src/config/passport.config.js
```

Actualmente se encuentran implementadas tres estrategias:

- `register`
- `login`
- `current`

Las rutas utilizan `passport.authenticate()` para ejecutar las estrategias correspondientes.

---

## Estrategia `register`

### POST `/api/sessions/register`

Registra un nuevo usuario utilizando la estrategia `register` de Passport.

La estrategia se encarga de:

- Validar campos obligatorios.
- Normalizar el email.
- Validar el formato del email.
- Validar la longitud mínima de la contraseña.
- Verificar si el email ya existe.
- Generar el hash de la contraseña mediante bcrypt.
- Crear el usuario en MongoDB.
- Asignar el rol `user` por defecto.

El campo `role` no se recibe desde el registro público.

La respuesta de registro se transforma mediante `UserDTO`, por lo que la contraseña nunca se devuelve al cliente.

---

## Estrategia `login`

### POST `/api/sessions/login`

Autentica un usuario mediante la estrategia `login` de Passport.

Si las credenciales son correctas, se genera un token JWT y se almacena en una cookie llamada:

```text
currentUser
```

La cookie utiliza:

- `httpOnly: true`
- `sameSite: lax`
- `maxAge: 3600000`
- `secure: true` únicamente en producción

---

## Estrategia `current`

### GET `/api/sessions/current`

Utiliza la estrategia `current` de Passport.

Obtiene el JWT desde la cookie `currentUser`, verifica su firma y expiración y coloca el payload validado en:

```text
req.user
```

La respuesta utiliza `UserDTO`, por lo que nunca incluye la contraseña del usuario.

---

## Logout

### POST `/api/sessions/logout`

Cierra la sesión eliminando la cookie `currentUser`.

---

# Roles y autorización

Eventify implementa autorización basada en roles.

Los roles disponibles son:

- `user`
- `organizer`
- `admin`

El modelo `User` utiliza `user` como rol predeterminado.

El registro público siempre asigna:

```text
user
```

Los roles privilegiados no pueden ser enviados directamente desde el formulario de registro.

---

## Matriz de permisos

| Acción | user | organizer | admin |
|---|:---:|:---:|:---:|
| Consultar eventos | ✅ | ✅ | ✅ |
| Crear eventos | ❌ | ✅ | ✅ |
| Modificar eventos propios | ❌ | ✅ | ✅ |
| Modificar eventos de otros organizers | ❌ | ❌ | ✅ |
| Cambiar estado de eventos propios | ❌ | ✅ | ✅ |
| Cambiar estado de eventos de otros organizers | ❌ | ❌ | ✅ |
| Consultar todos los usuarios | ❌ | ❌ | ✅ |
| Crear inscripción | ✅ | ✅ | ✅ |
| Consultar propios tickets | ✅ | ✅ | ✅ |
| Consultar tickets de evento propio | ❌ | ✅ | ✅ |
| Consultar tickets de evento ajeno | ❌ | ❌ | ✅ |
| Cancelar ticket propio | ✅ | ✅ | ✅ |
| Cancelar ticket ajeno | ❌ | ❌ | ✅ |

---

# Users

## GET `/api/users`

Obtiene la lista de usuarios registrados.

### Acceso

Esta ruta requiere:

```text
Autenticación + rol admin
```

Los usuarios `user` y `organizer` reciben:

```text
403 Forbidden
```

La contraseña no se incluye en la respuesta.

La información de los usuarios se obtiene mediante `UsersRepository` y se transforma mediante `UserDTO` antes de ser enviada al cliente.

---

# Middleware de autenticación

El middleware:

```text
src/middlewares/auth.middleware.js
```

se encarga de verificar que exista una sesión válida.

Utiliza Passport con la estrategia `current`.

Cuando la autenticación es correcta:

```text
req.user
```

queda disponible para los siguientes middlewares y controllers.

Cuando no existe una sesión válida, devuelve:

```text
401 Unauthorized
```

---

# Middleware de autorización

El middleware:

```text
src/middlewares/authorize.middleware.js
```

es reutilizable y recibe los roles permitidos.

Ejemplo:

```js
authorize('organizer', 'admin')
```

Si el usuario está autenticado pero no posee los permisos necesarios, devuelve:

```text
403 Forbidden
```

---

# Diferencia entre 401 y 403

## 401 Unauthorized

Se utiliza cuando el usuario no está autenticado.

Ejemplos:

- No existe la cookie de sesión.
- El JWT es inválido.
- El JWT está expirado.
- No existe una sesión válida.

## 403 Forbidden

Se utiliza cuando el usuario está autenticado pero no tiene permisos suficientes.

Ejemplos:

- Un `user` intenta crear un evento.
- Un `organizer` intenta acceder a una ruta exclusiva de `admin`.
- Un `organizer` intenta modificar un evento perteneciente a otro organizer.
- Un usuario intenta cancelar el ticket de otra persona.

---

# Manejo de errores

La aplicación cuenta con un middleware centralizado:

```text
src/middlewares/errorHandler.js
```

Los errores propagados mediante:

```js
next(error)
```

son gestionados por este middleware.

Esto evita duplicar la lógica de respuesta de errores en los diferentes controllers y middlewares.

Los errores se diferencian mediante códigos HTTP:

```text
400 → Error de validación o regla de negocio
401 → No autenticado
403 → Autenticado sin permisos
404 → Recurso no encontrado
409 → Conflicto de datos
500 → Error interno del servidor
```

---

# Base de datos

La aplicación utiliza **MongoDB Atlas** como base de datos y **Mongoose** como ODM.

La conexión se realiza al iniciar el servidor utilizando:

```text
MONGO_URL
```

Los modelos definidos son:

- `User`
- `Event`
- `Ticket`

Los usuarios, eventos y tickets se almacenan mediante Mongoose.

Los tickets mantienen referencias mediante `ObjectId` hacia usuarios y eventos.

Los modelos son accedidos directamente únicamente por la capa DAO.

---

# Pruebas realizadas

Durante la implementación de PE5, PE6, PE7 y PE8 se verificaron diferentes casos funcionales.

## Ejecución de pruebas automatizadas

Para ejecutar la suite de pruebas de integración:

```bash
npm test
```

Las pruebas verifican el flujo de registro, inicio de sesión, creación y publicación de eventos, generación y cancelación de tickets, así como escenarios de autenticación, autorización y validación de errores.

La suite utiliza `mongodb-memory-server` para ejecutar las pruebas con una base de datos MongoDB temporal, aislada de la base de datos de desarrollo.

La ejecución se considera exitosa cuando todos los tests finalizan correctamente, sin fallos.

## PE5

| Caso | Resultado esperado | Resultado |
|---|---:|:---:|
| `user` crea evento | 403 | ✅ |
| `organizer` crea evento | 201 | ✅ |
| `organizer` accede a ruta admin | 403 | ✅ |
| `admin` accede a ruta admin | 200 | ✅ |
| Sin sesión en `/api/sessions/current` | 401 | ✅ |
| `organizer` modifica evento ajeno | 403 | ✅ |
| `admin` modifica evento ajeno | 200 | ✅ |

## PE6

| Caso | Resultado esperado | Resultado |
|---|---:|:---:|
| Crear evento como organizer | 201 | ✅ |
| Crear evento con fecha pasada | 400 | ✅ |
| Crear evento con capacidad 0 | 400 | ✅ |
| Organizer modifica su propio evento | 200 | ✅ |
| Organizer modifica evento ajeno | 403 | ✅ |
| Admin modifica evento de otro organizer | 200 | ✅ |
| Cancelar evento | 200 | ✅ |
| Modificar evento cancelado | 400 | ✅ |
| Cambiar estado de evento cancelado | 400 | ✅ |
| Filtrar por `status` y `category` | 200 | ✅ |
| Paginación | 200 | ✅ |
| Evento inexistente | 404 | ✅ |

## PE7

| Caso | Resultado esperado | Resultado |
|---|---:|:---:|
| Crear inscripción correctamente | 201 | ✅ |
| Envío de email de confirmación | Email enviado | ✅ |
| Sin sesión | 401 | ✅ |
| Evento inexistente | 404 | ✅ |
| Evento no disponible | 400 | ✅ |
| Cantidad inválida | 400 | ✅ |
| Capacidad insuficiente | 400 | ✅ |
| Inscripción duplicada activa | 400 | ✅ |
| Cancelar ticket propio | 200 | ✅ |
| Cancelar ticket ajeno | 403 | ✅ |
| Usuario normal consulta tickets del evento | 403 | ✅ |
| Organizer consulta su propio evento | 200 | ✅ |
| Organizer consulta evento ajeno | 403 | ✅ |
| Cancelar ticket libera capacidad | Cupo liberado | ✅ |
| Ticket cancelado no ocupa capacidad | Cupo disponible | ✅ |
| Crear nueva inscripción después de liberar cupo | 201 | ✅ |
| Ticket mantiene `cancelledAt` | Fecha registrada | ✅ |
| No se elimina físicamente el ticket | Ticket permanece | ✅ |

## PE8

| Caso | Resultado esperado | Resultado |
|---|---:|:---:|
| DAO por entidad principal | Implementado | ✅ |
| Repository por entidad principal | Implementado | ✅ |
| Services sin acceso directo a DAO/modelos | Cumplido | ✅ |
| Controllers sin acceso directo a Mongoose | Cumplido | ✅ |
| DTO de usuario sin password | Cumplido | ✅ |
| DTO de evento | Implementado | ✅ |
| DTO de ticket/inscripción | Implementado | ✅ |
| Ticket poblado sin password del usuario | Cumplido | ✅ |
| `/api/sessions/current` sin password | Cumplido | ✅ |
| Sin sesión en endpoint protegido | 401 | ✅ |
| Usuario sin permisos | 403 | ✅ |
| Evento inexistente | 404 | ✅ |
| Ticket ya cancelado | 400 | ✅ |
| Flujo registro → login → evento → inscripción → tickets → cancelación | Funcional | ✅ |

---

# Estado del proyecto

Actualmente se encuentran implementadas:

- Arquitectura por capas.
- Arquitectura DAO, Repository y DTO.
- Configuración mediante variables de entorno.
- Conexión con MongoDB Atlas mediante Mongoose.
- Modelo `User`.
- Modelo `Event`.
- Modelo `Ticket`.
- DAO para usuarios, eventos y tickets.
- Repository para usuarios, eventos y tickets.
- Services para usuarios, eventos y tickets.
- DTO para usuarios, eventos y tickets.
- Registro seguro de usuarios.
- Validación de campos obligatorios.
- Normalización de emails.
- Control de emails duplicados.
- Hash de contraseñas mediante bcrypt.
- Login de usuarios.
- Generación de tokens JWT.
- Expiración configurable de JWT.
- Autenticación mediante cookie `currentUser`.
- Passport.js para centralizar la autenticación.
- Estrategias `register`, `login` y `current`.
- Endpoint protegido `/api/sessions/current`.
- Logout y eliminación de la cookie de sesión.
- Middleware reutilizable de autenticación.
- Middleware reutilizable de autorización.
- Roles `user`, `organizer` y `admin`.
- Protección de rutas según rol.
- Ruta administrativa `/api/users`.
- Creación de eventos.
- Consulta individual de eventos.
- Actualización de eventos.
- Actualización de estados.
- Control de ownership.
- Validaciones de negocio.
- Filtros de eventos.
- Filtro por organizer.
- Paginación.
- Ordenamiento.
- Control de eventos cancelados.
- Diferenciación entre errores `400`, `401`, `403`, `404`, `409` y `500`.
- Manejo centralizado de errores.
- Creación de tickets.
- Inscripciones a eventos.
- Control de capacidad.
- Prevención de inscripciones duplicadas.
- Cancelación lógica de tickets.
- Liberación automática de cupos.
- Consulta de tickets propios.
- Consulta de tickets de eventos por organizer/admin.
- Control de ownership de tickets.
- Generación de códigos de reserva.
- Envío de emails de confirmación mediante Nodemailer.
- Configuración SMTP mediante variables de entorno.
- Protección de respuestas mediante DTO.
- Ocultamiento de contraseñas y datos sensibles.
- Filtrado de documentos relacionados mediante DTO.

---

# Próximas funcionalidades

Algunas funcionalidades que podrían incorporarse en futuras iteraciones:

- Lista de espera automática.
- Gestión avanzada de estados `pending`.
- Notificaciones adicionales.
- Recuperación de contraseña.
- Integración con proveedores externos como Google o GitHub.
- Integración con servicios de pago.
- Dashboard administrativo.
- Estadísticas de eventos e inscripciones.

---

# Repositorio

Repositorio público:

https://github.com/agush1t/eventify-api
