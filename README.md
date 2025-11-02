# 🎯 Kiosco de Propinas - Sunset Monalisa v2.2.0

> Aplicación web tipo kiosco para gestión digital de propinas con soporte offline y panel de administración avanzado.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características Principales](#-características-principales)
- [Tecnologías](#-tecnologías)
- [Requisitos del Sistema](#-requisitos-del-sistema)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Ejecución](#-ejecución)
- [Uso de la Aplicación](#-uso-de-la-aplicación)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Funcionalidades Avanzadas](#-funcionalidades-avanzadas)
- [Despliegue](#-despliegue)
- [Solución de Problemas](#-solución-de-problemas)
- [Seguridad](#-seguridad)
- [Contribuciones](#-contribuciones)
- [Licencia](#-licencia)

---

## 🎯 Descripción

Sistema de gestión de propinas digital diseñado específicamente para **Sunset Monalisa**. Permite que los meseros registren la información de la mesa y los clientes puedan dejar propina de forma rápida y sencilla a través de un dispositivo tipo kiosco (tablet o smartphone).

El sistema incluye:
- **Interfaz de kiosco** optimizada para tablets con diseño moderno y responsivo
- **Panel de administración** con análisis de datos y exportación de reportes
- **Funcionamiento offline** mediante Service Workers y almacenamiento local
- **Soporte multiidioma** (Español e Inglés)
- **Prevención de duplicados** mediante IDs de transacción únicos

---

## ✨ Características Principales

### 🖥️ Interfaz de Kiosco
- ✅ **Diseño optimizado para tablets** con UI moderna y fácil de usar
- ✅ **Selección rápida de propinas** (20%, 23%, 25%)
- ✅ **Validación en tiempo real** de formularios
- ✅ **Indicadores visuales** de estado y confirmación
- ✅ **Soporte multiidioma** (Español/Inglés)

### 📊 Panel de Administración
- ✅ **Autenticación segura** mediante sesiones
- ✅ **Dashboard con métricas**:
  - Total de registros de propinas
  - Promedio de propinas
  - Distribución por porcentajes
- ✅ **Filtros avanzados**:
  - Por mesero
  - Por rango de fechas
  - Combinación de ambos
- ✅ **Exportación a CSV** con datos filtrados
- ✅ **Interfaz moderna** con diseño responsivo

### 🔄 Funcionalidades Offline
- ✅ **Service Worker** para funcionamiento sin conexión
- ✅ **IndexedDB** para almacenamiento local temporal
- ✅ **Sincronización automática** cuando se restaura la conexión
- ✅ **Indicadores visuales** de estado offline

### 🛡️ Seguridad y Confiabilidad
- ✅ **Prevención de duplicados** mediante `transaction_id` único
- ✅ **Validación de datos** en backend y frontend
- ✅ **Sesiones seguras** con cookies HTTP-only
- ✅ **Manejo de errores** robusto

---

## 🛠️ Tecnologías

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web minimalista
- **better-sqlite3** - Base de datos SQLite embebida
- **express-session** - Manejo de sesiones de usuario
- **better-sqlite3-session-store** - Almacenamiento de sesiones en SQLite
- **express-validator** - Validación de datos de entrada
- **dotenv** - Gestión de variables de entorno
- **cors** - Habilitación de peticiones cruzadas

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos y responsivos
- **JavaScript ES6+** - Lógica de aplicación
- **Service Workers** - Funcionamiento offline
- **IndexedDB API** - Almacenamiento local
- **Fetch API** - Comunicación con el servidor

---

## 💻 Requisitos del Sistema

- **Node.js**: versión 18 o superior
- **npm**: versión 9 o superior (incluido con Node.js)
- **Sistema operativo**: Windows, macOS o Linux
- **Navegador**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ (para el cliente)

### Requisitos Recomendados
- **RAM**: Mínimo 512MB
- **Almacenamiento**: 100MB libres (para la base de datos y dependencias)
- **Red**: Conexión a internet (opcional, funciona offline)

---

## 🚀 Instalación

### 1. Clonar el Repositorio

    ```bash
git clone https://github.com/GaelCampuzano/Proyecto_Practicas.git
cd Kiosco-Monalisa
    ```

### 2. Instalar Dependencias

    ```bash
    npm install
    ```

Este comando instalará todas las dependencias necesarias listadas en `package.json`.

### 3. Verificar Instalación

Para verificar que todo esté correctamente instalado, puedes ejecutar:

```bash
node server.js
```

Si no hay errores, el servidor debería iniciarse correctamente.

---

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

    ```env
# Puerto del servidor (por defecto: 3000)
    PORT=3000

    # Credenciales del administrador para el dashboard
# ⚠️ IMPORTANTE: Cambia estos valores en producción
    ADMIN_USER=admin
    ADMIN_PASS=sunset123

# Secreto para firmar las cookies de sesión
# ⚠️ IMPORTANTE: Usa un valor aleatorio y seguro en producción
# Recomendado: Genera uno con: openssl rand -base64 32
SESSION_SECRET=un-secreto-muy-seguro-y-largo-cambiar-en-produccion

# Entorno de ejecución (opcional)
# NODE_ENV=production
```

### Generar un SESSION_SECRET Seguro

**En Linux/macOS:**
```bash
openssl rand -base64 32
```

**En Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**O en línea:**
Visita: https://generate-secret.vercel.app/32

### Configurar Meseros

Los meseros están definidos en `database.js`. Para modificarlos, edita la función `getWaiters()`:

```javascript
function getWaiters() {
  return [
    { name: 'David' },
    { name: 'Gael' },
    { name: 'Ivan' },
    { name: 'Luis' },
    { name: 'Emmanuel' },
    // Agrega más meseros aquí
  ];
}
```

---

## ▶️ Ejecución

### Modo Desarrollo

Con recarga automática cuando se detectan cambios:

    ```bash
    npm run dev
    ```

### Modo Producción

    ```bash
    npm start
    ```

O directamente:

```bash
node server.js
```

### Verificar que el Servidor Está Funcionando

Una vez iniciado, deberías ver en la consola:

```
Servidor escuchando en http://localhost:3000
Dashboard disponible en http://localhost:3000/admin.html
```

También puedes verificar el estado del servidor visitando:
- **Health Check**: `http://localhost:3000/api/health`

---

## 📱 Uso de la Aplicación

### Para Meseros y Clientes

1. **Acceder al Kiosco**: Abre `http://localhost:3000` en el dispositivo
2. **Seleccionar Mesero**: El mesero elige su nombre de la lista
3. **Ingresar Número de Mesa**: Se ingresa el número de mesa (1-999)
4. **Entregar al Cliente**: El mesero presiona "Entregar al Cliente"
5. **Elegir Propina**: El cliente selecciona el porcentaje deseado (20%, 23% o 25%)
6. **Confirmación**: Se muestra una pantalla de agradecimiento

### Para Administradores

1. **Acceder al Dashboard**: Navega a `http://localhost:3000/admin.html`
2. **Iniciar Sesión**: Usa las credenciales configuradas en `.env`
3. **Visualizar Datos**: El dashboard muestra métricas en tiempo real
4. **Aplicar Filtros**:
   - Selecciona un mesero específico
   - Define un rango de fechas
   - O combina ambos filtros
5. **Exportar Reporte**: Haz clic en "Exportar CSV" para descargar los datos filtrados

---

## 📁 Estructura del Proyecto

```
Kiosco-Monalisa/
├── data/                      # Base de datos SQLite (generada automáticamente)
│   └── tips.db                # Archivo de base de datos
│
├── public/                     # Archivos estáticos servidos al cliente
│   ├── assets/                 # Recursos multimedia
│   │   ├── bkg.jpg            # Imagen de fondo
│   │   └── Sunset-Monalisa-logo@2x_color.svg
│   │
│   ├── i18n/                   # Archivos de internacionalización
│   │   ├── es.json            # Traducciones en español
│   │   └── en.json            # Traducciones en inglés
│   │
│   ├── admin.html             # Panel de administración
│   ├── admin.css              # Estilos del panel
│   ├── admin.js               # Lógica del panel
│   ├── index.html             # Interfaz del kiosco
│   ├── style.css              # Estilos del kiosco
│   ├── app.js                 # Lógica principal del kiosco
│   ├── apiClient.js           # Cliente API reutilizable
│   ├── i18n.js                # Sistema de internacionalización
│   ├── indexedDB.js           # Manejo de almacenamiento local
│   └── sw.js                  # Service Worker para funcionalidad offline
│
├── routes/                     # Definición de rutas de la API
│   └── api.js                 # Endpoints de la API REST
│
├── database.js                 # Capa de acceso a datos (SQLite)
├── server.js                   # Servidor Express principal
├── package.json                # Configuración y dependencias
├── package-lock.json           # Lock file de dependencias
└── README.md                   # Este archivo
```

---

## 🔌 API Endpoints

### Health Check

#### `GET /api/health`
Verifica el estado del servidor y la conexión a la base de datos.

**Autenticación**: No requerida

**Respuesta 200:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": {
    "status": "ok",
    "message": "Conexión exitosa."
  }
}
```

---

### Autenticación

#### `POST /api/login`
Inicia sesión y crea una cookie de sesión.

**Autenticación**: No requerida

**Body:**
```json
{
  "username": "admin",
  "password": "sunset123"
}
```

**Respuesta 200:**
```json
{
  "message": "Inicio de sesión exitoso."
}
```

**Respuesta 401:**
```json
{
  "error": "Credenciales incorrectas."
}
```

#### `POST /api/logout`
Cierra la sesión del usuario.

**Autenticación**: No requerida (pero destruye la sesión actual)

**Respuesta 200:**
```json
{
  "message": "Sesión cerrada exitosamente."
}
```

#### `GET /api/session`
Verifica si hay una sesión activa.

**Autenticación**: No requerida

**Respuesta 200:**
```json
{
  "loggedIn": true
}
```
o
```json
{
  "loggedIn": false
}
```

---

### Gestión de Propinas

#### `POST /api/tips`
Crea un nuevo registro de propina.

**Autenticación**: No requerida

**Body:**
```json
{
  "table_number": "12",
  "waiter_name": "Gael",
  "tip_percentage": 20,
  "transaction_id": "unique-transaction-id-12345"
}
```

**Validaciones:**
- `table_number`: String, 1-10 caracteres, requerido
- `waiter_name`: String, no vacío, requerido
- `tip_percentage`: Integer, debe ser 20, 23 o 25
- `transaction_id`: String, único, requerido (previene duplicados)

**Respuesta 201:**
```json
{
  "id": 1,
  "message": "Propina registrada con éxito"
}
```

**Respuesta 200 (duplicado):**
```json
{
  "message": "Propina duplicada, ya registrada anteriormente."
}
```

#### `GET /api/tips`
Obtiene registros de propinas con filtros opcionales.

**Autenticación**: ✅ **Requiere sesión activa**

**Query Parameters (opcionales):**
- `startDate`: Fecha de inicio (ISO 8601, ej: `2024-01-01`)
- `endDate`: Fecha de fin (ISO 8601, ej: `2024-01-31`)
- `waiterName`: Nombre del mesero (búsqueda parcial)

**Ejemplo:**
```
GET /api/tips?startDate=2024-01-01&endDate=2024-01-31&waiterName=Gael
```

**Respuesta 200:**
```json
[
  {
    "id": 1,
    "table_number": "12",
    "waiter_name": "Gael",
    "tip_percentage": 20,
    "transaction_id": "unique-transaction-id-12345",
    "user_agent": "Mozilla/5.0...",
    "device_id": null,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

#### `GET /api/tips/csv`
Exporta registros de propinas a formato CSV.

**Autenticación**: ✅ **Requiere sesión activa**

**Query Parameters**: Mismos que `GET /api/tips`

**Respuesta 200:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="reporte_propinas.csv"

ID,Mesa,Mesero,Propina (%),Fecha y Hora
1,"12","Gael",20,"15/1/2024, 10:30:00"
```

#### `GET /api/waiters`
Obtiene la lista de meseros disponibles.

**Autenticación**: No requerida

**Respuesta 200:**
```json
[
  { "name": "David" },
  { "name": "Gael" },
  { "name": "Ivan" },
  { "name": "Luis" },
  { "name": "Emmanuel" }
]
```

---

## 🚀 Funcionalidades Avanzadas

### Modo Offline

El sistema está diseñado para funcionar sin conexión a internet:

1. **Service Worker**: Se registra automáticamente al cargar la aplicación
2. **Almacenamiento Local**: Las propinas se guardan en IndexedDB cuando no hay conexión
3. **Sincronización Automática**: Al recuperar la conexión, las propinas pendientes se envían al servidor
4. **Indicador Visual**: Se muestra un banner cuando el dispositivo está offline

### Prevención de Duplicados

Cada transacción genera un `transaction_id` único que:
- Se almacena en la base de datos con índice único
- Previene el registro accidental de la misma propina
- Permite reintentos seguros sin crear registros duplicados

### Internacionalización (i18n)

El sistema soporta múltiples idiomas:
- **Español** (por defecto)
- **Inglés**

Los textos se cargan desde archivos JSON en `public/i18n/`. Para agregar un nuevo idioma:
1. Crea un archivo `public/i18n/{codigo}.json`
2. Copia la estructura de `es.json` y traduce los textos
3. Agrega un botón en el selector de idioma en `index.html`

---

## 🌐 Despliegue

### Opciones de Despliegue

#### Opción 1: Servidor Dedicado (VPS/Cloud)

1. **Preparar el servidor:**
   ```bash
   # Instalar Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Clonar el repositorio
   git clone <repo-url>
   cd Kiosco-Monalisa
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   nano .env
   # Configurar PORT, ADMIN_USER, ADMIN_PASS, SESSION_SECRET
   ```

3. **Usar PM2 para gestión de procesos:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name kiosco-monalisa
   pm2 save
   pm2 startup
   ```

4. **Configurar Nginx como proxy reverso:**
   ```nginx
   server {
       listen 80;
       server_name tu-dominio.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

#### Opción 2: Docker (Próximamente)

```dockerfile
# Dockerfile ejemplo
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Opción 3: Servicios Cloud

- **Heroku**: Despliegue simple con Git
- **Railway**: Despliegue automático desde GitHub
- **Render**: Servicio gratuito para aplicaciones Node.js
- **DigitalOcean App Platform**: Solución completa de despliegue

### Configuración de Producción

⚠️ **Importante antes de desplegar:**

1. ✅ Cambiar `SESSION_SECRET` por un valor aleatorio seguro
2. ✅ Cambiar credenciales de `ADMIN_USER` y `ADMIN_PASS`
3. ✅ Configurar `NODE_ENV=production` en `.env`
4. ✅ Configurar HTTPS (usando Let's Encrypt o similar)
5. ✅ Configurar firewall para limitar acceso
6. ✅ Configurar respaldos automáticos de `data/tips.db`

---

## 🔧 Solución de Problemas

### El servidor no inicia

**Error: Puerto en uso**
```bash
# Cambiar el puerto en .env
PORT=3001
```

**Error: Módulo no encontrado**
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### La base de datos no se crea

**Verificar permisos:**
```bash
# Asegurar que el directorio data/ tenga permisos de escritura
chmod 755 data/
```

**Verificar ruta:**
- Asegúrate de que el directorio `data/` exista en la raíz del proyecto

### Los datos no se guardan

1. **Verificar conexión a la base de datos:**
   ```
   GET /api/health
   ```

2. **Revisar logs del servidor:**
   ```bash
   # Si usas PM2
   pm2 logs kiosco-monalisa
   ```

3. **Verificar permisos del archivo de base de datos:**
   ```bash
   ls -la data/tips.db
   ```

### El modo offline no funciona

1. **Verificar que el Service Worker esté registrado:**
   - Abre las DevTools (F12) > Application > Service Workers
   - Debe aparecer "sw.js" como activo

2. **Verificar soporte del navegador:**
   - Chrome/Edge: ✅ Soportado
   - Firefox: ✅ Soportado
   - Safari: ⚠️ Requiere iOS 11.3+ o macOS 10.13.4+

### Problemas de autenticación

1. **Limpiar cookies:**
   - Elimina las cookies del dominio en el navegador
   - O usa modo incógnito para probar

2. **Verificar variables de entorno:**
   - Confirma que `.env` tenga los valores correctos
   - Reinicia el servidor después de cambiar `.env`

---

## 🔒 Seguridad

### Recomendaciones de Seguridad

1. **Variables de Entorno:**
   - ⚠️ **NUNCA** subas el archivo `.env` al repositorio
   - Usa valores únicos y seguros en producción

2. **Credenciales de Admin:**
   - Usa contraseñas fuertes (mínimo 12 caracteres, mayúsculas, minúsculas, números y símbolos)
   - Considera implementar autenticación de dos factores (2FA) en futuras versiones

3. **HTTPS en Producción:**
   - Siempre usa HTTPS en producción
   - Las cookies de sesión deben tener `secure: true` cuando uses HTTPS

4. **Rate Limiting:**
   - Considera agregar rate limiting para prevenir abusos
   - Puedes usar `express-rate-limit`

5. **Validación de Datos:**
   - El sistema ya incluye validación en backend y frontend
   - No deshabilites estas validaciones

6. **Respaldo de Datos:**
   - Haz respaldos regulares de `data/tips.db`
   - Considera automatizar los respaldos

### Ejemplo de `.env` Seguro

```env
# Variables seguras (ejemplo - NO usar estos valores en producción)
PORT=3000
ADMIN_USER=admin_secure_2024
ADMIN_PASS=K1@sC0_M0n4l1$4_S3cur3_P@ss!
SESSION_SECRET=aB3$dEf9gHi2jKl5mNo8pQr7sTu1vWx4yZ6!@#$%^&*()_+-=[]{}|;:,.<>?
NODE_ENV=production
```

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. **Fork** el repositorio
2. Crea una **rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

### Guía de Estilo

- Usa indentación de 2 espacios
- Sigue las convenciones de nomenclatura de JavaScript
- Agrega comentarios cuando sea necesario
- Actualiza la documentación para nuevas funcionalidades

---

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

```
ISC License

Copyright (c) 2024, Gael Campuzano

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

---

## 👤 Autor

**Gael Campuzano**

- GitHub: [@GaelCampuzano](https://github.com/GaelCampuzano)
- Proyecto: [Kiosco Monalisa](https://github.com/GaelCampuzano/Proyecto_Practicas)

---

## 🙏 Agradecimientos

- **Sunset Monalisa** por la oportunidad de desarrollar este proyecto
- Comunidad de desarrolladores de Node.js y Express
- Todos los colaboradores y usuarios del proyecto

---

## 📞 Soporte

Si encuentras algún problema o tienes preguntas:

1. **Revisa** la sección [Solución de Problemas](#-solución-de-problemas)
2. **Abre un issue** en el repositorio de GitHub
3. **Contacta** al autor del proyecto

---

**Versión actual**: 2.2.0  
**Última actualización**: Septiembre 2025

---

<div align="center">
  <p>Hecho con ❤️ para Sunset Monalisa</p>
</div>