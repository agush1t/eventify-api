# Eventify API

API REST para una plataforma de gestión de eventos e inscripciones.

## Temática del proyecto

**Eventify** es una plataforma destinada a la gestión de eventos e inscripciones. La API utiliza una arquitectura por capas y cuenta con autenticación mediante Passport.js, JWT y cookies.

El proyecto se encuentra preparado para incorporar funcionalidades de autorización, gestión de usuarios, eventos, inscripciones y control de cupos.

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

Esta estructura permite mantener el código organizado, facilitar su mantenimiento y desacoplar la lógica de negocio del acceso a los datos.

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

## Estructura de carpetas

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
│   └── sessions.router.js

├── controllers/
│   ├── events.controller.js
│   └── sessions.controller.js

├── services/
│   └── events.service.js

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
│   └── errorHandler.js

└── utils/
    ├── generateError.js
    ├── hash.js
    └── jwt.js
```

## Responsabilidad de cada capa

### Config

Centraliza la configuración de las variables de entorno, la conexión con MongoDB y las estrategias de Passport.

### Routes

Define los endpoints disponibles de la API y aplica las estrategias de autenticación correspondientes.

### Controllers

Reciben las solicitudes HTTP y construyen las respuestas HTTP.

En el flujo de autenticación, los controllers utilizan la información colocada en `req.user` por Passport y se encargan de generar el JWT y establecer la cookie de sesión.

### Services

Contienen la lógica de negocio de la aplicación.

Actualmente se utiliza un service para la gestión de eventos.

### Repositories

Abstraen el acceso a la fuente de datos y se comunican con los DAO.

### DAO

Gestionan el acceso a los datos. El DAO de eventos utiliza una estructura en memoria como implementación inicial, mientras que el DAO de usuarios utiliza Mongoose para persistir los usuarios en MongoDB.

### Models

Contienen los esquemas de Mongoose utilizados para representar los datos de la aplicación.

### Middlewares

Contienen funcionalidades que intervienen durante el procesamiento de las solicitudes, incluyendo el manejo centralizado de errores.

La autenticación de sesiones se gestiona mediante estrategias de Passport.js.

### Utils

Contiene funciones auxiliares y reutilizables, como el hash de contraseñas mediante bcrypt, la generación de errores personalizados y la generación/verificación de tokens JWT.

## Rutas disponibles

### Health Check

**GET `/api/health`**

Verifica que el servidor se encuentre activo.

Respuesta:

```json
{
  "status": "ok",
  "message": "Servidor activo"
}
```

### Events

**GET `/api/events`**

Obtiene la lista de eventos.

En esta etapa los eventos son obtenidos mediante el flujo:

```text
Controller → Service → Repository → DAO
```

Respuesta inicial:

```json
{
  "status": "success",
  "payload": []
}
```

### Sessions

**GET `/api/sessions`**

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

## Estrategia `register`

**POST `/api/sessions/register`**

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
  "email": "Ana@Mail.com ",
  "password": "Secreta123"
}
```

El email se normaliza automáticamente eliminando espacios y convirtiéndolo a minúsculas.

La contraseña se almacena utilizando un hash generado con bcrypt.

El campo `role` no se recibe desde el registro público y se establece automáticamente como `user`.

### Respuesta 201 — Registro exitoso

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

### Respuesta 400 — Error de validación

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

### Respuesta 409 — Email duplicado

```json
{
  "status": "error",
  "message": "El email ya está registrado"
}
```

---

## Estrategia `login`

**POST `/api/sessions/login`**

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

El JWT contiene únicamente:

```json
{
  "id": "665f2a...",
  "email": "ana@mail.com",
  "role": "user"
}
```

La contraseña nunca se incluye dentro del token.

### Respuesta 200 — Login correcto

```json
{
  "status": "success",
  "message": "Login correcto"
}
```

### Respuesta 401 — Credenciales inválidas

Tanto si el email no existe como si la contraseña es incorrecta, se devuelve el mismo mensaje.

```json
{
  "status": "error",
  "message": "Credenciales inválidas"
}
```

---

## Estrategia `current`

**GET `/api/sessions/current`**

Utiliza la estrategia `current` de Passport.

La estrategia obtiene el JWT desde la cookie `currentUser`, verifica su firma y expiración y coloca el payload validado en `req.user`.

### Respuesta 200 — Usuario autenticado

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

La contraseña nunca se devuelve.

### Respuesta 401 — No autenticado

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

## Logout

**POST `/api/sessions/logout`**

Cierra la sesión eliminando la cookie `currentUser`.

No requiere autenticación mediante Passport.

### Respuesta 200 — Sesión cerrada

```json
{
  "status": "success",
  "message": "Sesión cerrada"
}
```

Después de cerrar sesión, una solicitud a `/api/sessions/current` devuelve:

```json
{
  "status": "error",
  "message": "No autenticado"
}
```

---

## Flujo de autenticación

### Registro

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
req.user
          ↓
Controller
          ↓
Respuesta 201
```

### Login

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

### Usuario actual

```text
GET /api/sessions/current
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

### Logout

```text
POST /api/sessions/logout
          ↓
Eliminar cookie currentUser
          ↓
GET /api/sessions/current
          ↓
401 No autenticado
```

## Preparación para proveedores externos

La configuración de Passport se encuentra centralizada en:

```text
src/config/passport.config.js
```

Esta organización permite incorporar futuras estrategias de autenticación mediante proveedores externos, como **Google** o **GitHub**, sin necesidad de modificar la inicialización de Passport en `app.js`.

## Manejo de errores

La aplicación cuenta con un middleware centralizado para el manejo de errores:

```text
src/middlewares/errorHandler.js
```

Los errores propagados mediante `next(error)` son gestionados por este middleware, evitando duplicar la lógica de respuesta de errores en los diferentes controllers y estrategias.

## Base de datos

La aplicación utiliza **MongoDB Atlas** como base de datos y **Mongoose** como ODM.

La conexión se realiza al iniciar el servidor utilizando la variable de entorno `MONGO_URL`.

Los modelos definidos actualmente son:

* `User`
* `Event`

## Estado del proyecto

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
* Manejo centralizado de errores.
* Preparación para futuras estrategias de autenticación externas.

### Funcionalidades previstas para futuras entregas

* Roles y autorización.
* Gestión completa de eventos.
* Inscripciones.
* Control de cupos.
* Notificaciones.
* Integración con proveedores externos como Google o GitHub.
