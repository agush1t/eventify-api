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
* Control de ownership sobre los eventos.

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
Base de datos / fuente de datos
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

## Services

Contienen la lógica de negocio de la aplicación.

Actualmente existen services para la gestión de eventos y usuarios.

## Repositories

Abstraen el acceso a la fuente de datos y se comunican con los DAO.

## DAO

Gestionan el acceso a los datos.

El DAO de eventos utiliza actualmente una estructura en memoria como implementación inicial, mientras que el DAO de usuarios utiliza Mongoose para persistir los usuarios en MongoDB.

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

## GET `/api/events`

Obtiene la lista de eventos.

Los eventos son obtenidos mediante el flujo:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
DAO
```

Respuesta:

```json
{
  "status": "success",
  "payload": []
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
  "title": "Evento de ejemplo",
  "description": "Descripción del evento",
  "date": "2026-10-10",
  "location": "Buenos Aires",
  "capacity": 100
}
```

El propietario del evento se asigna automáticamente utilizando el usuario autenticado:

```text
organizer = req.user.id
```

El cliente no puede establecer el propietario del evento desde el body.

### Respuesta 201

```json
{
  "status": "success",
  "payload": {
    "id": "uuid-del-evento",
    "title": "Evento de ejemplo",
    "description": "Descripción del evento",
    "date": "2026-10-10",
    "location": "Buenos Aires",
    "capacity": 100,
    "organizer": "id-del-usuario"
  }
}
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
  "date": "2026-10-10",
  "location": "Buenos Aires",
  "capacity": 150
}
```

El campo `organizer` no se modifica desde el body.

### Respuesta 200

```json
{
  "status": "success",
  "payload": {
    "id": "uuid-del-evento",
    "title": "Nuevo título",
    "description": "Nueva descripción",
    "date": "2026-10-10",
    "location": "Buenos Aires",
    "capacity": 150,
    "organizer": "id-del-usuario"
  }
}
```

---

# Sessions

## GET `/api/sessions`

Endpoint inicial correspondiente al recurso de sesiones.

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

### Request

```json
{
  "first_name": "Ana",
  "last_name": "Pérez",
  "email": "Ana@Mail.com",
  "password": "Secreta123"
}
```

El email se normaliza automáticamente eliminando espacios y convirtiéndolo a minúsculas.

La contraseña se almacena utilizando un hash generado con bcrypt.

El campo `role` no se recibe desde el registro público y se establece automáticamente como `user`.

Esto evita que un usuario pueda registrarse directamente como `organizer` o `admin`.

### Respuesta 201

```json
{
  "status": "success",
  "payload": {
    "id": "665f2a...",
    "first_name": "Ana",
    "last_name": "Pérez",
    "email": "ana@mail.com",
    "role": "user"
  }
}
```

La contraseña no se incluye en la respuesta.

### Respuesta 400

Se utiliza `400` para datos inválidos, como:

* Campos obligatorios faltantes.
* Email con formato incorrecto.
* Contraseña con menos de 6 caracteres.

Ejemplo:

```json
{
  "status": "error",
  "message": "Faltan campos obligatorios"
}
```

### Respuesta 409

Cuando el email ya se encuentra registrado:

```json
{
  "status": "error",
  "message": "El email ya está registrado"
}
```

---

# Estrategia `login`

### POST `/api/sessions/login`

Autentica un usuario mediante la estrategia `login` de Passport.

La estrategia:

1. Valida las credenciales.
2. Normaliza el email.
3. Busca el usuario en MongoDB.
4. Verifica la contraseña utilizando bcrypt.
5. Coloca el usuario autenticado en `req.user`.

El controller genera posteriormente el JWT y establece la cookie de sesión.

### Request

```json
{
  "email": "ana@mail.com",
  "password": "Secreta123"
}
```

Si las credenciales son correctas, se genera un token JWT y se almacena en una cookie llamada `currentUser`.

La cookie utiliza:

* `httpOnly: true`
* `sameSite: lax`
* `maxAge: 3600000`
* `secure: true` únicamente en producción

El JWT contiene:

```json
{
  "id": "665f2a...",
  "email": "ana@mail.com",
  "role": "user"
}
```

La contraseña nunca se incluye dentro del token.

### Respuesta 200

```json
{
  "status": "success",
  "message": "Login correcto"
}
```

### Respuesta 401

Cuando las credenciales son inválidas:

```json
{
  "status": "error",
  "message": "Credenciales inválidas"
}
```

---

# Estrategia `current`

### GET `/api/sessions/current`

Utiliza la estrategia `current` de Passport.

La estrategia obtiene el JWT desde la cookie `currentUser`, verifica su firma y expiración y coloca el payload validado en `req.user`.

### Respuesta 200

```json
{
  "status": "success",
  "payload": {
    "id": "665f2a...",
    "email": "ana@mail.com",
    "role": "user"
  }
}
```

### Respuesta 401

Se devuelve cuando:

* No existe la cookie.
* El JWT es inválido.
* El JWT fue manipulado.
* El JWT está expirado.

```json
{
  "status": "error",
  "message": "No autenticado"
}
```

---

# Logout

### POST `/api/sessions/logout`

Cierra la sesión eliminando la cookie `currentUser`.

No requiere autenticación mediante Passport.

### Respuesta 200

```json
{
  "status": "success",
  "message": "Sesión cerrada"
}
```

Después de cerrar sesión, una solicitud a:

```text
GET /api/sessions/current
```

devuelve:

```json
{
  "status": "error",
  "message": "No autenticado"
}
```

---

# Roles y autorización

Eventify implementa autorización basada en roles.

Los roles disponibles son:

* `user`
* `organizer`
* `admin`

El modelo `User` utiliza `user` como rol predeterminado.

```text
user
organizer
admin
```

El registro público siempre asigna el rol:

```text
user
```

Los roles privilegiados no pueden ser enviados directamente desde el formulario de registro.

---

## Matriz de permisos

| Acción                                | user | organizer | admin |
| ------------------------------------- | :--: | :-------: | :---: |
| Consultar eventos                     |   ✅  |     ✅     |   ✅   |
| Crear eventos                         |   ❌  |     ✅     |   ✅   |
| Modificar eventos propios             |   ❌  |     ✅     |   ✅   |
| Modificar eventos de otros organizers |   ❌  |     ❌     |   ✅   |
| Consultar todos los usuarios          |   ❌  |     ❌     |   ✅   |

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

Respuesta:

```json
{
  "status": "error",
  "message": "No autenticado"
}
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

El middleware compara el rol de:

```text
req.user.role
```

con los roles permitidos.

Si el usuario está autenticado pero no posee los permisos necesarios, devuelve:

```text
403 Forbidden
```

Respuesta:

```json
{
  "status": "error",
  "message": "No tenés permisos para realizar esta acción"
}
```

---

# Diferencia entre 401 y 403

La API diferencia correctamente ambos casos.

## 401 Unauthorized

Se utiliza cuando el usuario **no está autenticado**.

Ejemplos:

* No existe la cookie de sesión.
* El JWT es inválido.
* El JWT está expirado.
* No existe una sesión válida.

Ejemplo:

```json
{
  "status": "error",
  "message": "No autenticado"
}
```

---

## 403 Forbidden

Se utiliza cuando el usuario **está autenticado pero no tiene permisos suficientes**.

Ejemplos:

* Un `user` intenta crear un evento.
* Un `organizer` intenta acceder a una ruta exclusiva de `admin`.
* Un `organizer` intenta modificar un evento perteneciente a otro organizer.

Ejemplo:

```json
{
  "status": "error",
  "message": "No tenés permisos para realizar esta acción"
}
```

---

# Users

## GET `/api/users`

Obtiene la lista de usuarios registrados.

### Acceso

Esta ruta requiere:

```text
Autenticación + rol admin
```

### Roles permitidos

* `admin`

Los usuarios `user` y `organizer` reciben:

```text
403 Forbidden
```

### Respuesta 200

```json
{
  "status": "success",
  "payload": [
    {
      "_id": "665f2a...",
      "first_name": "Ana",
      "last_name": "Pérez",
      "email": "ana@mail.com",
      "role": "user"
    }
  ]
}
```

La contraseña no se incluye en la respuesta.

---

# Ownership de eventos

Cada evento creado por un `organizer` almacena el identificador del usuario que lo creó:

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

# Flujo de autorización

```text
Request
   ↓
auth.middleware
   ↓
¿JWT válido?
   ↓
req.user
   ↓
authorize(...)
   ↓
¿Rol permitido?
   ↓
Controller
```

Si no existe una sesión válida:

```text
401 Unauthorized
```

Si existe sesión pero el rol no tiene permisos:

```text
403 Forbidden
```

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
Buscar evento
        ↓
¿Es organizer?
   ↓              ↓
  Sí              No
   ↓              ↓
¿Es propietario?  Admin
   ↓              ↓
  Sí → Modifica   Modifica
  No → 403
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

La aplicación cuenta con un middleware centralizado para el manejo de errores:

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

La conexión se realiza al iniciar el servidor utilizando la variable de entorno:

```text
MONGO_URL
```

Los modelos definidos actualmente son:

* `User`
* `Event`

Los usuarios se almacenan en MongoDB mediante Mongoose.

Los eventos utilizan actualmente un DAO en memoria como implementación inicial.

---

# Preparación para proveedores externos

La configuración de Passport se encuentra centralizada en:

```text
src/config/passport.config.js
```

Esta organización permite incorporar futuras estrategias de autenticación mediante proveedores externos, como:

* Google
* GitHub

sin necesidad de modificar la inicialización principal de Passport en `app.js`.

---

# Pruebas realizadas para PE5

Durante la implementación de roles y autorización se verificaron los siguientes casos:

| Caso                                  | Resultado esperado | Resultado |
| ------------------------------------- | -----------------: | --------: |
| `user` crea evento                    |                403 |         ✅ |
| `organizer` crea evento               |                201 |         ✅ |
| `organizer` accede a ruta admin       |                403 |         ✅ |
| `admin` accede a ruta admin           |                200 |         ✅ |
| Sin sesión en `/api/sessions/current` |                401 |         ✅ |
| `organizer` modifica evento ajeno     |                403 |         ✅ |
| `admin` modifica evento ajeno         |                200 |         ✅ |

Estas pruebas permiten verificar la separación entre autenticación, autorización y ownership de recursos.

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
* Respuesta de registro sin incluir la contraseña.
* Asignación automática del rol `user` durante el registro público.
* Login de usuarios.
* Validación de credenciales.
* Generación de tokens JWT.
* Expiración configurable de JWT.
* Autenticación mediante cookie `currentUser`.
* Passport.js para centralizar la autenticación.
* Estrategia `register`.
* Estrategia `login`.
* Estrategia `current`.
* Endpoint protegido `/api/sessions/current`.
* Logout y eliminación de la cookie de sesión.
* Middleware reutilizable de autenticación.
* Middleware reutilizable de autorización.
* Roles `user`, `organizer` y `admin`.
* Protección de rutas según rol.
* Ruta administrativa `/api/users`.
* Creación de eventos protegida por roles.
* Modificación de eventos protegida por roles.
* Control de ownership de eventos.
* Diferenciación entre errores `401` y `403`.
* Manejo centralizado de errores.
* Preparación para futuras estrategias de autenticación externas.

---

# Funcionalidades previstas para futuras entregas

* Gestión completa de eventos.
* Inscripciones a eventos.
* Control de cupos.
* Cancelación de eventos.
* Notificaciones.
* Integración con proveedores externos como Google o GitHub.
* Persistencia completa de eventos mediante MongoDB.
