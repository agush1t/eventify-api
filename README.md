# Eventify API

API REST para una plataforma de gestión de eventos e inscripciones.

## Temática del proyecto

**Eventify** es una plataforma destinada a la gestión de eventos e inscripciones. La API está organizada utilizando una arquitectura por capas y se encuentra preparada para incorporar funcionalidades de autenticación, autorización, gestión de usuarios, eventos, inscripciones y control de cupos.

## Tecnologías

* Node.js
* Express
* JavaScript
* ECMAScript Modules (ESM)
* dotenv
* Mongoose
* MongoDB Atlas
* bcrypt

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
```

> La variable `MONGO_URL` contiene la cadena de conexión utilizada para conectar la aplicación con MongoDB Atlas.

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
│   └── database.js
├── routes/
│   ├── events.router.js
│   └── sessions.router.js
├── controllers/
│   ├── events.controller.js
│   └── sessions.controller.js
├── services/
│   ├── events.service.js
│   └── sessions.service.js
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
    └── hash.js
```

### Responsabilidad de cada capa

**Config**

Centraliza la lectura y configuración de las variables de entorno y la conexión con MongoDB.

**Routes**

Define los endpoints disponibles de la API y los conecta con sus respectivos controllers.

**Controllers**

Reciben las solicitudes HTTP, invocan los servicios correspondientes y construyen las respuestas HTTP.

**Services**

Contienen la lógica de negocio de la aplicación.

**Repositories**

Abstraen el acceso a la fuente de datos y se comunican con los DAO.

**DAO**

Gestionan el acceso a los datos. El DAO de eventos utiliza una estructura en memoria como implementación inicial, mientras que el DAO de usuarios utiliza Mongoose para persistir los usuarios en MongoDB.

**Models**

Contienen los esquemas de Mongoose utilizados para representar los datos de la aplicación.

**Middlewares**

Contienen funcionalidades que intervienen durante el procesamiento de las solicitudes, incluyendo el manejo centralizado de errores.

**Utils**

Contiene funciones auxiliares y reutilizables, como el hash de contraseñas mediante bcrypt y la generación de errores personalizados.

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

### Registro de usuarios

**POST `/api/sessions/register`**

Registra un nuevo usuario en el sistema.

#### Request

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

#### Respuesta 201 — Registro exitoso

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

#### Respuesta 400 — Campos obligatorios faltantes

```json
{
  "status": "error",
  "message": "Faltan campos obligatorios"
}
```

También se utiliza el código `400` para datos inválidos, como un email con formato incorrecto o una contraseña con menos de 6 caracteres.

#### Respuesta 409 — Email duplicado

```json
{
  "status": "error",
  "message": "El email ya está registrado"
}
```

## Manejo de errores

La aplicación cuenta con un middleware centralizado para el manejo de errores:

```text
src/middlewares/errorHandler.js
```

Los errores propagados mediante `next(error)` son gestionados por este middleware, evitando duplicar la lógica de respuesta de errores en los diferentes controllers.

## Base de datos

La aplicación utiliza **MongoDB Atlas** como base de datos y **Mongoose** como ODM.

La conexión se realiza al iniciar el servidor utilizando la variable de entorno `MONGO_URL`.

Los modelos definidos actualmente son:

* `User`
* `Event`

## Estado del proyecto

Esta implementación corresponde a las primeras etapas del proyecto de **Backend II**.

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

### Funcionalidades previstas para futuras entregas

* Login
* JWT
* Cookies
* Passport
* Roles y autorización
* Gestión de eventos
* Inscripciones
* Control de cupos
* Notificaciones
