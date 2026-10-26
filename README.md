# Northwind API & Frontend (OAuth 2.0)

Proyecto web que implementa una API REST en **ASP.NET Core 8** para la gestión del catálogo de productos sobre la base de datos Northwind. El sistema integra autenticación federada con **Google OAuth 2.0**, persistencia de sesiones mediante cookies seguras (`HttpOnly`) y un cliente web interactivo desarrollado en **Vanilla JavaScript** y **Bootstrap 5**.

---

## Stack Tecnológico

- **Backend:** ASP.NET Core 8 Web API
- **ORM:** Entity Framework Core 9 con Pomelo MySQL Provider
- **Autenticación:** Google OAuth 2.0 (`Microsoft.AspNetCore.Authentication.Google`) y Cookie Authentication
- **Base de Datos:** MySQL (Base de datos relacional Northwind)
- **Frontend:** HTML5, JavaScript Vanilla (ES6+ modular), Bootstrap 5.3 y DataTables 3

---

## Estructura del Proyecto

```
API-Oauth/
├── APINwind8/                  # Solución y código fuente del backend
│   ├── APINwind/               # Proyecto ASP.NET Core Web API
│   │   ├── Controllers/        # Controladores REST (Products, Categories, Suppliers, GoogleOAuth)
│   │   ├── Data/               # Contexto de base de datos de EF Core (ContextoBD)
│   │   ├── Migrations/         # Migraciones para la tabla de Usuarios
│   │   ├── Models/             # Modelos de entidad (Product, Category, Supplier, Usuario, etc.)
│   │   └── Program.cs          # Configuración de servicios, CORS, Cookie Auth y pipeline HTTP
│   └── APINwind.sln            # Archivo de solución de Visual Studio
├── Frontend/                   # Cliente web para pruebas y consumo
│   ├── index.html              # Vista principal: gestión de inventario y DataTables
│   ├── login.html              # Portal de acceso con botón de Google OAuth
│   └── js/                     # Lógica modular en JavaScript Vanilla
│       ├── config.js           # URL base centralizada de la API
│       ├── auth.js             # Verificación de sesión, saludo y logout
│       ├── productos.js        # Operaciones CRUD, modales y llamadas al catálogo
│       └── login.js            # Flujo de redirección inicial
├── DOCUMENTACION_API.md        # Especificación técnica detallada de endpoints y esquemas
└── README.md                   # Descripción general del repositorio
```

---

## Características Principales

1. **Autenticación Federada:** Inicio de sesión con cuentas de Google; los usuarios nuevos se registran automáticamente en la tabla `Usuarios` al completar el flujo.
2. **Manejo Seguro de Sesión:** Emisión de cookies `HttpOnly`, `SameSite=None` y `Secure` (`NWindAPI.auth`) para proteger la sesión del usuario.
3. **Gestión de Catálogo (CRUD):**
   - Consulta general con nombres resueltos de proveedores y categorías.
   - Consulta individual por ID de producto.
   - Alta de productos con validación de tipos y llaves foráneas.
   - Edición de productos existentes.
   - Eliminación con validación de integridad referencial (previene borrar artículos con pedidos históricos).
4. **CORS Habilitado:** Soporte para orígenes locales (`localhost:5500`) con transferencia de credenciales activa (`AllowCredentials`).

---

## Resumen de Rutas de la API

| Módulo | Método | Endpoint | Descripción | Acceso |
| :--- | :---: | :--- | :--- | :---: |
| **Auth** | `GET` | `/auth/GoogleOAuth/google` | Inicia el flujo de autenticación con Google | Público |
| **Auth** | `GET` | `/auth/GoogleOAuth/response` | Comprueba si existe una sesión activa | Autenticado |
| **Auth** | `GET` | `/auth/GoogleOAuth/usuario` | Devuelve el nombre del usuario autenticado | Autenticado |
| **Auth** | `GET` | `/auth/GoogleOAuth/logout` | Cierra la sesión y elimina la cookie | Público |
| **Proveedores** | `GET` | `/api/Suppliers` | Listado simplificado de proveedores | Público |
| **Categorías** | `GET` | `/api/Categories` | Listado de categorías disponibles | Autenticado |
| **Productos** | `GET` | `/api/Products` | Listado completo de inventario | Autenticado |
| **Productos** | `GET` | `/api/Products/{id}` | Detalle individual de un producto | Autenticado |
| **Productos** | `POST` | `/api/Products` | Creación de un nuevo producto | Autenticado |
| **Productos** | `PUT` | `/api/Products/{id}` | Actualización de un producto existente | Autenticado |
| **Productos** | `DELETE`| `/api/Products/{id}` | Eliminación de un producto | Autenticado |

> Para conocer los formatos JSON de envío y respuesta, tipos de datos, códigos de error y restricciones de base de datos, consulta el archivo [DOCUMENTACION_API.md](DOCUMENTACION_API.md).

---

## Instrucciones para Ejecución Local

### Prerrequisitos
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Servidor MySQL con la base de datos `nwind` cargada
- Cuenta de Google Cloud Console con credenciales OAuth 2.0 (Client ID y Client Secret)
- Servidor web estático local (como la extensión Live Server de VS Code) para el frontend

### 1. Configurar y Ejecutar la API

1. Clona el repositorio y navega a la carpeta del proyecto:
   ```bash
   cd APINwind8/APINwind
   ```
2. Configura la cadena de conexión a tu base de datos en `appsettings.json`:
   ```json
   "ConnectionStrings": {
     "ConexionNwind": "Server=localhost;Database=nwind;User Id=root;Password=TU_PASSWORD;"
   }
   ```
3. Registra las credenciales de Google OAuth usando User Secrets:
   ```bash
   dotnet user-secrets set "Authentication:Google:ClientId" "TU_CLIENT_ID"
   dotnet user-secrets set "Authentication:Google:ClientSecret" "TU_CLIENT_SECRET"
   ```
4. Aplica las migraciones para crear la tabla de usuarios si es necesario:
   ```bash
   dotnet ef database update
   ```
5. Inicia el servidor de desarrollo:
   ```bash
   dotnet run
   ```
   La API iniciará de forma predeterminada en `https://localhost:7192` (HTTPS).

### 2. Ejecutar el Frontend

1. Abre el directorio `Frontend` con Visual Studio Code.
2. Inicia un servidor local (por ejemplo, con **Live Server** en el puerto `5500`, que es el origen autorizado en el CORS de la API).
3. Abre `http://127.0.0.1:5500/login.html` o `http://localhost:5500/login.html` en tu navegador.
4. Inicia sesión con Google para acceder al catálogo completo de productos.
