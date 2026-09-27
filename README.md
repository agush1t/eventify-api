# Eventify API

API REST para una plataforma de gestión de eventos e inscripciones.

## Temática del proyecto

**Eventify** es una plataforma destinada a la gestión de eventos e inscripciones.

La API utiliza una arquitectura por capas y cuenta con:

* Autenticación mediante Passport.js.
* JWT almacenado en cookies.
* Autorización basada en roles.
* Control de permisos mediante middlewares reutilizables.
* Gestión de usuarios.
* Gestión de eventos.
* Validaciones de negocio.
* Filtros, paginación y ordenamiento de eventos.
* Control de ownership sobre los eventos.
* Gestión de estados de los eventos.

---

## Tecnologías

* Node.js
* Express
* JavaScript
* ECMAScript Modules (ESM)
* dotenv
* Mongoose
* MongoDB Atlas
* bcrypt
* jsonwebtoken
* cookie-parser
* Passport.js
* passport-local
* passport-jwt

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
Base de datos
```

La autenticación se encuentra centralizada mediante Passport.js y sus estrategias se configuran en:

```text
src/config/passport.config.js
```

Los controles de autenticación y autorización se implementan mediante middlewares reutilizables:

```text
src/middlewares/auth.middleware.js
src/middlewares/authorize.middleware.js
```

Esta estructura permite mantener el código organizado, facilitar su mantenimiento y desacoplar la lógica de negocio del acceso a los datos.

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
```

La variable `MONGO_URL` contiene la cadena de conexión utilizada para conectar la aplicación con MongoDB Atlas.

`JWT_SECRET` se utiliza para firmar y verificar los tokens JWT.

`JWT_EXPIRES_IN` permite configurar el tiempo de expiración de los tokens JWT.

El archivo `.env` contiene información sensible y se encuentra incluido en `.gitignore`, por lo que no debe ser publicado en el repositorio.

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
│   └── users.router.js
├── controllers/
│   ├── events.controller.js
│   ├── sessions.controller.js
│   └── users.controller.js
├── services/
│   ├── events.service.js
│   └── users.service.js
├── repositories/
│   ├── events.repository.js
│   └── users.repository.js
├── dao/
│   ├── events.dao.js
│   └── users.dao.js
├── models/
│   ├── User.js
│   └── Event.js
├── middlewares/
│   ├── auth.middleware.js
│   ├── authorize.middleware.js
│   └── errorHandler.js
└── utils/
    ├── generateError.js
    ├── hash.js
    └── jwt.js
```

---

# Responsabilidad de cada capa

## Config

Centraliza la configuración de las variables de entorno, la conexión con MongoDB y las estrategias de Passport.

## Routes

Define los endpoints disponibles de la API y aplica los middlewares de autenticación y autorización correspondientes.

## Controllers

Reciben las solicitudes HTTP y construyen las respuestas HTTP.

Los controllers utilizan la información colocada en `req.user` por el middleware de autenticación.

Los controllers no contienen la lógica de negocio principal.

## Services

Contienen la lógica de negocio de la aplicación.

Actualmente existen services para la gestión de eventos y usuarios.

En `events.service.js` se encuentran las validaciones relacionadas con fechas, capacidad, precios, estados y ownership.

## Repositories

Abstraen el acceso a la fuente de datos y se comunican con los DAO.

## DAO

Gestionan el acceso a los datos.

El DAO de eventos utiliza Mongoose para consultar, crear, actualizar y paginar eventos en MongoDB.

El DAO de usuarios utiliza Mongoose para persistir y consultar usuarios.

## Models

Contienen los esquemas de Mongoose utilizados para representar los datos de la aplicación.

Actualmente se encuentran definidos los modelos:

* `User`
* `Event`

## Middlewares

Contienen funcionalidades reutilizables que intervienen durante el procesamiento de las solicitudes.

Se utilizan middlewares separados para:

* Autenticación.
* Autorización.
* Manejo centralizado de errores.

## Utils

Contiene funciones auxiliares y reutilizables, como:

* Hash de contraseñas mediante bcrypt.
* Generación de errores personalizados.
* Generación y verificación de tokens JWT.

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

| Campo         | Tipo     | Requerido | Descripción          |
| ------------- | -------- | --------- | -------------------- |
| `title`       | String   | Sí        | Título del evento    |
| `description` | String   | Sí        | Descripción          |
| `category`    | String   | Sí        | Categoría del evento |
| `date`        | Date     | Sí        | Fecha del evento     |
| `location`    | String   | Sí        | Ubicación            |
| `capacity`    | Number   | Sí        | Capacidad máxima     |
| `price`       | Number   | Sí        | Precio del evento    |
| `status`      | String   | No        | Estado del evento    |
| `organizer`   | ObjectId | Sí        | Usuario organizador  |

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

* `status`
* `category`
* `location`
* `dateFrom`
* `dateTo`

Ejemplo:

```text
GET /api/events?status=published&category=workshop
```

### Paginación

Se pueden utilizar:

* `page`
* `limit`

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

* `organizer`
* `admin`

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

* `title` es obligatorio.
* `description` es obligatorio.
* `category` es obligatorio.
* `date` es obligatoria.
* `location` es obligatorio.
* `capacity` es obligatoria.
* `price` es obligatorio.
* La fecha debe ser futura.
* La capacidad debe ser mayor a `0`.
* El precio no puede ser negativo.

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

* `organizer`
* `admin`

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

* `organizer`
* `admin`

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

Una capacidad igual o menor a cero genera:

```text
400 Bad Request
```

### Precio

El precio debe ser igual o mayor a cero.

```text
price >= 0
```

Un precio negativo genera:

```text
400 Bad Request
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

* `register`
* `login`
* `current`

Las rutas utilizan `passport.authenticate()` para ejecutar las estrategias correspondientes.

---

## Estrategia `register`

### POST `/api/sessions/register`

Registra un nuevo usuario utilizando la estrategia `register` de Passport.

La estrategia se encarga de:

* Validar campos obligatorios.
* Normalizar el email.
* Validar el formato del email.
* Validar la longitud mínima de la contraseña.
* Verificar si el email ya existe.
* Generar el hash de la contraseña mediante bcrypt.
* Crear el usuario en MongoDB.
* Asignar el rol `user` por defecto.

El campo `role` no se recibe desde el registro público.

---

## Estrategia `login`

### POST `/api/sessions/login`

Autentica un usuario mediante la estrategia `login` de Passport.

Si las credenciales son correctas, se genera un token JWT y se almacena en una cookie llamada:

```text
currentUser
```

La cookie utiliza:

* `httpOnly: true`
* `sameSite: lax`
* `maxAge: 3600000`
* `secure: true` únicamente en producción

---

## Estrategia `current`

### GET `/api/sessions/current`

Utiliza la estrategia `current` de Passport.

Obtiene el JWT desde la cookie `currentUser`, verifica su firma y expiración y coloca el payload validado en:

```text
req.user
```

---

## Logout

### POST `/api/sessions/logout`

Cierra la sesión eliminando la cookie `currentUser`.

---

# Roles y autorización

Eventify implementa autorización basada en roles.

Los roles disponibles son:

* `user`
* `organizer`
* `admin`

El modelo `User` utiliza `user` como rol predeterminado.

El registro público siempre asigna:

```text
user
```

Los roles privilegiados no pueden ser enviados directamente desde el formulario de registro.

---

## Matriz de permisos

| Acción                                        | user | organizer | admin |
| --------------------------------------------- | :--: | :-------: | :---: |
| Consultar eventos                             |   ✅  |     ✅     |   ✅   |
| Crear eventos                                 |   ❌  |     ✅     |   ✅   |
| Modificar eventos propios                     |   ❌  |     ✅     |   ✅   |
| Modificar eventos de otros organizers         |   ❌  |     ❌     |   ✅   |
| Cambiar estado de eventos propios             |   ❌  |     ✅     |   ✅   |
| Cambiar estado de eventos de otros organizers |   ❌  |     ❌     |   ✅   |
| Consultar todos los usuarios                  |   ❌  |     ❌     |   ✅   |

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

* No existe la cookie de sesión.
* El JWT es inválido.
* El JWT está expirado.
* No existe una sesión válida.

## 403 Forbidden

Se utiliza cuando el usuario está autenticado pero no tiene permisos suficientes.

Ejemplos:

* Un `user` intenta crear un evento.
* Un `organizer` intenta acceder a una ruta exclusiva de `admin`.
* Un `organizer` intenta modificar un evento perteneciente a otro organizer.

---

# Ownership de eventos

Cada evento almacena el identificador del usuario que lo creó:

```text
organizer: req.user.id
```

Esto permite validar la propiedad del recurso.

Cuando un `organizer` intenta modificar un evento:

1. Se autentica al usuario.
2. Se verifica que tenga rol `organizer` o `admin`.
3. Se busca el evento.
4. Si el usuario es `organizer`, se compara su ID con el propietario del evento.
5. Si no coincide, se devuelve `403`.
6. Si el usuario es `admin`, puede modificar el evento independientemente de su propietario.

---

# Flujo de creación de eventos

```text
POST /api/events
        ↓
auth
        ↓
authorize('organizer', 'admin')
        ↓
createEvent
        ↓
req.user.id
        ↓
EventsService
        ↓
EventsRepository
        ↓
EventsDAO
        ↓
MongoDB
        ↓
Evento creado
```

El propietario se obtiene del usuario autenticado y no del body de la petición.

---

# Flujo de modificación de eventos

```text
PUT /api/events/:id
        ↓
auth
        ↓
authorize('organizer', 'admin')
        ↓
EventsService
        ↓
Buscar evento
        ↓
¿Evento cancelado?
   ↓              ↓
 Sí              No
 ↓                ↓
Error          Verificar ownership
                  ↓
          ┌───────┴───────┐
          ↓               ↓
      Organizer         Admin
          ↓               ↓
     ¿Es dueño?       Modifica
       ↓    ↓
      Sí    No
      ↓      ↓
   Modifica 403
```

---

# Flujo de autenticación

## Registro

```text
POST /api/sessions/register
          ↓
Passport → estrategia "register"
          ↓
Validación
          ↓
Normalización del email
          ↓
Verificación de usuario existente
          ↓
bcrypt.hash()
          ↓
MongoDB
          ↓
role = user
          ↓
req.user
          ↓
Controller
          ↓
Respuesta 201
```

## Login

```text
POST /api/sessions/login
          ↓
Passport → estrategia "login"
          ↓
Buscar usuario
          ↓
bcrypt.compare()
          ↓
req.user
          ↓
Controller
          ↓
Generar JWT
          ↓
Cookie httpOnly currentUser
          ↓
Respuesta 200
```

## Usuario actual

```text
GET /api/sessions/current
          ↓
auth
          ↓
Passport → estrategia "current"
          ↓
Leer cookie currentUser
          ↓
Verificar JWT
          ↓
req.user
          ↓
Controller
          ↓
Datos del usuario
```

## Logout

```text
POST /api/sessions/logout
          ↓
Eliminar cookie currentUser
          ↓
GET /api/sessions/current
          ↓
401 No autenticado
```

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

Los errores de autenticación y autorización se diferencian mediante códigos HTTP:

```text
401 → No autenticado
403 → Autenticado sin permisos
```

---

# Base de datos

La aplicación utiliza **MongoDB Atlas** como base de datos y **Mongoose** como ODM.

La conexión se realiza al iniciar el servidor utilizando:

```text
MONGO_URL
```

Los modelos definidos actualmente son:

* `User`
* `Event`

Los usuarios y eventos se almacenan mediante Mongoose.

---

# Pruebas realizadas

Durante la implementación de PE5 y PE6 se verificaron diferentes casos funcionales.

## PE5

| Caso                                  | Resultado esperado | Resultado |
| ------------------------------------- | -----------------: | :-------: |
| `user` crea evento                    |                403 |     ✅     |
| `organizer` crea evento               |                201 |     ✅     |
| `organizer` accede a ruta admin       |                403 |     ✅     |
| `admin` accede a ruta admin           |                200 |     ✅     |
| Sin sesión en `/api/sessions/current` |                401 |     ✅     |
| `organizer` modifica evento ajeno     |                403 |     ✅     |
| `admin` modifica evento ajeno         |                200 |     ✅     |

## PE6

| Caso                                    | Resultado esperado | Resultado |
| --------------------------------------- | -----------------: | :-------: |
| Crear evento como organizer             |                201 |     ✅     |
| Crear evento con fecha pasada           |                400 |     ✅     |
| Crear evento con capacidad 0            |                400 |     ✅     |
| Organizer modifica su propio evento     |                200 |     ✅     |
| Organizer modifica evento ajeno         |                403 |     ✅     |
| Admin modifica evento de otro organizer |                200 |     ✅     |
| Cancelar evento                         |                200 |     ✅     |
| Modificar evento cancelado              |                400 |     ✅     |
| Cambiar estado de evento cancelado      |                400 |     ✅     |
| Filtrar por `status` y `category`       |                200 |     ✅     |
| Paginación                              |                200 |     ✅     |
| Evento inexistente                      |                404 |     ✅     |

---

# Estado del proyecto

Actualmente se encuentran implementadas:

* Arquitectura por capas.
* Configuración mediante variables de entorno.
* Conexión con MongoDB Atlas mediante Mongoose.
* Modelo `User`.
* Modelo `Event`.
* Registro seguro de usuarios.
* Validación de campos obligatorios.
* Normalización de emails.
* Control de emails duplicados.
* Hash de contraseñas mediante bcrypt.
* Login de usuarios.
* Generación de tokens JWT.
* Expiración configurable de JWT.
* Autenticación mediante cookie `currentUser`.
* Passport.js para centralizar la autenticación.
* Estrategias `register`, `login` y `current`.
* Endpoint protegido `/api/sessions/current`.
* Logout y eliminación de la cookie de sesión.
* Middleware reutilizable de autenticación.
* Middleware reutilizable de autorización.
* Roles `user`, `organizer` y `admin`.
* Protección de rutas según rol.
* Ruta administrativa `/api/users`.
* Modelo completo de eventos.
* Creación de eventos.
* Consulta individual de eventos.
* Actualización de eventos.
* Actualización de estados.
* Control de ownership.
* Validaciones de negocio.
* Filtros de eventos.
* Paginación.
* Ordenamiento.
* Control de eventos cancelados.
* Diferenciación entre errores `401`, `403` y `404`.
* Manejo centralizado de errores.

---

# Funcionalidades previstas para futuras entregas

* Sistema de inscripciones a eventos.
* Estados de inscripción.
* Control de cupos asociado a inscripciones.
* Lista de espera.
* Cancelación de inscripciones.
* Notificaciones.
* Integración con proveedores externos como Google o GitHub.
* Funcionalidades adicionales de gestión de eventos.
