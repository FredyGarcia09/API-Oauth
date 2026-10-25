# Frontend Northwind (API Key)

Frontend web desarrollado en HTML5, CSS3, JavaScript y Bootstrap 5 para el consumo de la API de Northwind protegida mediante clave de acceso (`X-API-KEY`).

---

## 1. Configuración de la API

- **URL Base:** `https://webappapikey-dwcwaac4aqfceqhh.mexicocentral-01.azurewebsites.net/api`
- **Autorización:** Cabecera HTTP `X-API-KEY`
- **Manejo de Respuestas y Errores:** Estándar RFC 7807 (`ProblemDetails`)

---

## 2. Estructura de Archivos

```
Frontend-APIKey/
├── index.html          # Panel principal (Productos, Clientes, Órdenes)
├── login.html          # Inicio de sesión y registro de usuarios
├── README.md           # Documentación
└── js/
    ├── config.js       # Configuración de URLs y rutas de la API
    ├── auth.js         # Manejo de sesión, inyección de encabezado y cliente HTTP
    ├── login.js        # Lógica de inicio de sesión y registro
    ├── productos.js    # Listado, alta, edición y baja de productos
    ├── clientes.js     # Listado y detalle de clientes
    └── ordenes.js      # Historial y detalle de órdenes
```

---

## 3. Endpoints Utilizados

| Módulo | Método | Endpoint | Acción |
| :--- | :--- | :--- | :--- |
| **Acceso** | `POST` | `/api/Auth/register` | Crea la cuenta y emite la clave de acceso inicial. |
| **Acceso** | `POST` | `/api/Auth/login` | Valida credenciales y emite una clave de acceso activa. |
| **Claves** | `POST` | `/api/ApiKeys/regenerate` | Renueva la clave de acceso activa. |
| **Productos** | `GET` | `/api/Products` | Lista de productos y conteo total. |
| **Productos** | `GET` | `/api/Products/{id}` | Consulta datos de un producto específico. |
| **Productos** | `POST` | `/api/Products` | Registro de un nuevo producto. |
| **Productos** | `PUT` | `/api/Products/{id}` | Edición de un producto existente. |
| **Productos** | `DELETE` | `/api/Products/{id}` | Eliminación de producto. |
| **Clientes** | `GET` | `/api/Customers` | Lista de clientes. |
| **Clientes** | `GET` | `/api/Customers/{id}` | Ficha de cliente por código. |
| **Órdenes** | `GET` | `/api/Orders` | Historial de órdenes de compra. |
| **Órdenes** | `GET` | `/api/Orders/{id}` | Detalle de fechas, transporte y entrega. |

---

## 4. Ejecución

Abre `login.html` directamente en tu navegador o ejecuta un servidor local:

```bash
# Ejemplo con Python
python -m http.server 8080

# Ejemplo con Node.js
npx serve .
```
Accede desde tu navegador a `http://localhost:8080/login.html`.
