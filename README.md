Kiosco de Propinas - Sunset Monalisa
====================================

Descripción
-----------
Aplicación web tipo kiosco para que los clientes de Sunset Monalisa dejen propina de forma digital. Flujo básico: el mesero ingresa su nombre y número de mesa, entrega el dispositivo al cliente, el cliente elige un porcentaje (20, 23 o 25) y el registro se guarda para consulta posterior en un panel administrador.

Características
--------------
- Interfaz para kiosco optimizada para tablet.
- Selección rápida de porcentaje de propina (20, 23, 25).
- API REST para crear y consultar registros de propinas.
- Base de datos local con `better-sqlite3` (sin servidor externo).
- Panel de administración con filtros por mesero y fechas, totales y exportación CSV.
- Protección del panel y consultas con Autenticación Básica.

Tecnologías
-----------
- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Backend: Node.js, Express
- Base de datos: better-sqlite3 (SQLite embebido)
- Dependencias principales: express, dotenv, cors, basic-auth, better-sqlite3

Requisitos
----------
- Node.js 16 o superior
- npm (incluido con Node.js)

Instalación
-----------
1. Clonar el repositorio:
   - `git clone https://github.com/GaelCampuzano/Proyecto_Practicas.git`
   - `cd kiosco-sunset`
2. Instalar dependencias:
   - `npm install`
3. Variables de entorno (crear archivo `.env` en la raíz):
   
   Ejemplo:
   ```env
   ADMIN_USER=admin
   ADMIN_PASS=sunset123
   # Opcional
   PORT=3000
   ```

Ejecución
---------
- Desarrollo (recarga con Node): `npm run dev`
- Producción: `npm start`

La aplicación estará disponible en `http://localhost:3000` (o el puerto configurado).

Inicio rápido
-------------
```bash
git clone https://github.com/GaelCampuzano/Proyecto_Practicas.git
cd kiosco-sunset
npm install
copy NUL .env  # (Windows) luego edita y agrega ADMIN_USER/ADMIN_PASS
npm start
```

Uso
---
- Kiosco: `http://localhost:3000`
- Panel administrador: `http://localhost:3000/admin.html` (requiere `ADMIN_USER` y `ADMIN_PASS`)

Estructura del proyecto
-----------------------
```
/
├── public/           # Archivos estáticos (kiosco y admin)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── admin.html
│   ├── admin.css
│   └── admin.js
├── data/             # Base de datos SQLite (tips.db)
├── database.js       # Capa de acceso a datos (SQLite)
├── package.json
├── server.js         # Servidor Express y API
└── README.md
```

API
---
POST `/api/tips`
- Descripción: Crea un nuevo registro de propina.
- Autenticación: No requiere.
- Body JSON:
```
{
  "table_number": "12",
  "waiter_name": "Gael",
  "tip_percentage": 20,
  "device_id": "opcional"
}
```
- Respuesta 201:
```
{ "id": 1, "message": "Propina registrada con éxito" }
```

Ejemplo (curl):
```bash
curl -X POST http://localhost:3000/api/tips \
  -H "Content-Type: application/json" \
  -d '{"table_number":"12","waiter_name":"Gael","tip_percentage":20}'
```

GET `/api/tips`
- Descripción: Obtiene registros de propinas (ordenados por `created_at` desc).
- Autenticación: Básica (usar `ADMIN_USER` y `ADMIN_PASS`).
- Query params opcionales:
  - `startDate` (formato ISO o `YYYY-MM-DD`)
  - `endDate` (formato ISO o `YYYY-MM-DD`)
  - `waiterName` (coincidencia parcial)

Ejemplo (curl):
```bash
curl -u admin:sunset123 "http://localhost:3000/api/tips?startDate=2025-01-01&endDate=2025-12-31&waiterName=Gael"
```

GET `/api/tips/csv`
- Descripción: Exporta los registros de propinas a CSV.
- Autenticación: Básica (usar `ADMIN_USER` y `ADMIN_PASS`).
- Query params opcionales: mismos que `GET /api/tips`.
- Respuestas:
  - 200: descarga de archivo `text/csv`
  - 404: `{ "error": "No hay registros para exportar." }`

Ejemplo (curl):
```bash
curl -u admin:sunset123 -o reporte_propinas.csv "http://localhost:3000/api/tips/csv?startDate=2025-01-01&endDate=2025-12-31"
```

Notas
-----
- La base de datos se crea automáticamente en `data/tips.db` al iniciar el servidor.
- Los índices sobre `created_at` y `waiter_name` se crean automáticamente.
- Los porcentajes válidos son 20, 23 y 25.

Scripts disponibles
-------------------
- `npm run dev`: `node --watch server.js`
- `npm start`: `node server.js`

Arquitectura
------------
- `server.js`: servidor Express, middleware CORS y autenticación básica. Define endpoints `POST /api/tips`, `GET /api/tips`, `GET /api/tips/csv` y sirve `public/`.
- `database.js`: capa de acceso a datos con SQLite (better-sqlite3). Expone `setupDatabase`, `getTips`, `addTip`.
- `public/`: contiene el kiosco (`index.html`, `style.css`, `app.js`) y el dashboard admin (`admin.html`, `admin.css`, `admin.js`).

Seguridad y configuración
-------------------------
- Las rutas de consulta y exportación requieren Basic Auth con `ADMIN_USER` y `ADMIN_PASS`.
- Usa `dotenv` para cargar variables desde `.env`.
- CORS habilitado para permitir acceso desde el dashboard.
- Validación de entrada en `POST /api/tips` (porcentaje permitido 20/23/25 y campos requeridos).

Buenas prácticas y mantenimiento
-------------------------------
- Manejo de errores con respuestas consistentes JSON/CSV.
- Índices en `created_at` y `waiter_name` para consultas rápidas.
- Código documentado con comentarios y JSDoc en backend y UI.

Despliegue (nota breve)
-----------------------
- Producción: defina `ADMIN_USER`/`ADMIN_PASS` en variables de entorno del sistema y ejecute `npm start`.
- Opcional: use PM2 para correr como servicio (`pm2 start server.js --name kiosco-sunset`).
- Asegure permisos de escritura en la carpeta `data/` para el proceso que ejecuta Node.

Solución de problemas
---------------------
- Error EADDRINUSE: cambie el puerto en `.env` (variable `PORT`).
- 401 en panel admin: verifique `ADMIN_USER`/`ADMIN_PASS` y reinicie el servidor tras cambiar `.env`.
- Problemas con `tips.db` en OneDrive: si hay bloqueos/sincronización, mueva `data/` fuera de carpetas sincronizadas o excluya `data/` de OneDrive.

Créditos
--------
- Responsable: David Peña (Gerente de implementaciones de sistemas)
- Ejecutor: Gael Campuzano (Practicante de desarrollo)

Licencia
--------
Este proyecto está licenciado bajo ISC (ver `package.json`).