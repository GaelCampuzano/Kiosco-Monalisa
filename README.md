# Kiosco de Propinas - Sunset Monalisa v2.0

## Descripción

Aplicación web tipo kiosco para que los clientes de Sunset Monalisa dejen propina de forma digital. Flujo básico: el mesero selecciona su nombre y número de mesa, entrega el dispositivo al cliente, el cliente elige un porcentaje (20, 23 o 25) y el registro se guarda para consulta posterior en un panel de administrador seguro.

## Características Clave

-   **Interfaz de Kiosco Optimizada:** UI sencilla y rápida para tablets.
-   **Selección de Propina:** Opciones claras (20%, 23%, 25%).
-   **API REST Segura:** Para crear y consultar registros de propinas.
-   **Base de Datos Local:** Usa `better-sqlite3` para un almacenamiento rápido y sin dependencias de un servidor externo.
-   **Panel de Administración Avanzado:**
    -   Autenticación segura por sesión (usuario y contraseña).
    -   Filtros por mesero y rango de fechas.
    -   Cálculo de totales y promedio de propinas.
    -   Exportación de datos filtrados a formato CSV.

## Tecnologías

-   **Frontend:** HTML5, CSS3, JavaScript (ES6+)
-   **Backend:** Node.js, Express
-   **Base de datos:** better-sqlite3 (SQLite embebido)
-   **Dependencias principales:**
    -   `express`: Framework del servidor.
    -   `express-session`: Manejo de sesiones de usuario.
    -   `connect-sqlite3`: Almacenamiento persistente de sesiones.
    -   `express-validator`: Validación de datos en el backend.
    -   `dotenv`: Gestión de variables de entorno.
    -   `cors`: Habilitar peticiones cruzadas.
    -   `better-sqlite3`: Driver para la base de datos.

## Requisitos

-   Node.js 18 o superior
-   npm (incluido con Node.js)

## Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/GaelCampuzano/Proyecto_Practicas.git](https://github.com/GaelCampuzano/Proyecto_Practicas.git)
    cd kiosco-sunset
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Variables de entorno:** Crea un archivo `.env` en la raíz del proyecto. Puedes copiar el contenido de `.env.example`.
    ```env
    # Puerto del servidor
    PORT=3000

    # Credenciales del administrador para el dashboard
    ADMIN_USER=admin
    ADMIN_PASS=sunset123

    # Secreto para firmar las cookies de sesión (¡cambiar en producción!)
    SESSION_SECRET=un-secreto-muy-seguro-y-largo
    ```

## Ejecución

-   **Modo Desarrollo (recarga automática):**
    ```bash
    npm run dev
    ```
-   **Modo Producción:**
    ```bash
    npm start
    ```

La aplicación estará disponible en `http://localhost:3000` (o el puerto que hayas configurado).

## Uso

-   **Kiosco:** `http://localhost:3000`
-   **Panel de administrador:** `http://localhost:3000/admin.html` (requiere iniciar sesión con `ADMIN_USER` y `ADMIN_PASS`).

## Estructura del Proyecto

/
├── public/           # Archivos estáticos (kiosco y admin)
├── routes/           # Definición de rutas de la API
│   └── api.js
├── data/             # Base de datos SQLite (se crea automáticamente)
├── database.js       # Capa de acceso a datos (SQLite)
├── server.js         # Servidor Express principal
├── package.json
└── README.md


## API Endpoints

### Sesión

-   `POST /api/login`
    -   **Descripción:** Inicia sesión y crea una cookie de sesión.
    -   **Body:** `{ "username": "...", "password": "..." }`
    -   **Respuesta 200:** `{ "message": "Inicio de sesión exitoso." }`

-   `POST /api/logout`
    -   **Descripción:** Cierra la sesión del usuario.

-   `GET /api/session`
    -   **Descripción:** Verifica si hay una sesión activa.
    -   **Respuesta 200:** `{ "loggedIn": true }` o `{ "loggedIn": false }`

### Datos

-   `POST /api/tips`
    -   **Descripción:** Crea un nuevo registro de propina.
    -   **Autenticación:** No requiere.
    -   **Body:** `{ "table_number": "12A", "waiter_name": "Gael", "tip_percentage": 20 }`

-   `GET /api/tips`
    -   **Descripción:** Obtiene registros de propinas.
    -   **Autenticación:** **Requiere sesión activa.**
    -   **Query Params (opcionales):** `startDate`, `endDate`, `waiterName`.

-   `GET /api/tips/csv`
    -   **Descripción:** Exporta registros a CSV.
    -   **Autenticación:** **Requiere sesión activa.**
    -   **Query Params:** Mismos que `GET /api/tips`.

-   `GET /api/waiters`
    -   **Descripción:** Obtiene la lista de meseros para el kiosco.
    -   **Autenticación:** No requiere.