# Eventify API

API REST para una plataforma de eventos e inscripciones.

## Temática del proyecto

**Eventify** es una plataforma destinada a la gestión de eventos e inscripciones. La API permitirá administrar usuarios, eventos e inscripciones, y servirá como base para incorporar funcionalidades de autenticación, autorización y gestión de cupos en futuras entregas.

## Tecnologías

* Node.js
* Express
* JavaScript
* ECMAScript Modules (ESM)
* dotenv
* MongoDB (preparado para futuras etapas)

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/agush1t/eventify-api.git


Ingresar a la carpeta del proyecto:

```bash
cd eventify-api
```

Instalar las dependencias:

```bash
npm install
```

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto tomando como referencia el archivo `.env.example`.

Las variables utilizadas son:

```env
PORT=8080
NODE_ENV=development
MONGO_URL=mongodb://localhost:27017/eventify
JWT_SECRET=clave_secreta
```

El archivo `.env` contiene información que no debe ser publicada en el repositorio.

## Ejecución

Para ejecutar el servidor:

```bash
npm start
```

Para ejecutar el servidor en modo desarrollo:

```bash
npm run dev
```

El servidor se iniciará utilizando el puerto configurado mediante la variable de entorno `PORT`.

## Estructura de carpetas

```text
src/
├── app.js
├── server.js
├── config/
├── routes/
│   ├── events.router.js
│   └── sessions.router.js
├── controllers/
│   ├── events.controller.js
│   └── sessions.controller.js
├── services/
├── repositories/
├── dao/
├── models/
│   ├── User.js
│   └── Event.js
├── middlewares/
└── utils/
```

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

En esta primera etapa devuelve una lista vacía:

```json
{
  "status": "success",
  "payload": []
}
```

### Sessions

**GET `/api/sessions`**

Endpoint inicial para el recurso de sesiones. La lógica de autenticación será incorporada en futuras entregas.

## Estado del proyecto

Esta implementación corresponde a la **Pre-entrega 1 de Backend II**.

El objetivo de esta etapa es establecer la arquitectura inicial de una API REST organizada por capas y preparada para futuras funcionalidades como:

* Registro de usuarios
* Login
* JWT
* Cookies
* Passport
* Roles y autorización
* Gestión de eventos
* Inscripciones
* Control de cupos
* Notificaciones

