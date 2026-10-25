# Documentación de la API Northwind

API REST desarrollada sobre ASP.NET Core 8 para la gestión de productos, categorías, proveedores y autenticación federada con Google OAuth 2.0 basada en cookies de sesión.

---

## 1. Configuración del Servidor

Modificar el siguiente valor para apuntar al entorno correspondiente (desarrollo local o servidor de producción). Todos los endpoints documentados a continuación se desprenden de esta ruta base.

| Parámetro | Valor Actual / Despliegue |
| :--- | :--- |
| **`BASE_URL`** | `https://localhost:7192` |

---

## 2. Protocolo de Autenticación y Seguridad

La API utiliza autenticación federada con Google mediante cookies seguras. No se emplean tokens Bearer (JWT) en cabeceras; toda la autorización depende de la cookie de sesión gestionada por el navegador.

- **Nombre de la Cookie:** `NWindAPI.auth`
- **Políticas de la Cookie:** `HttpOnly`, `Secure` (HTTPS obligatorio), `SameSite=None`.
- **Requisito de Conexión (Frontend):** Cualquier cliente HTTP en el frontend debe emitir las peticiones con soporte de credenciales habilitado (`credentials: include` o `withCredentials: true`). De lo contrario, la cookie no viajará y la API responderá con estado `401 Unauthorized`.
- **Políticas CORS:** El servidor admite peticiones con credenciales cruzadas (`AllowCredentials`). El origen del cliente debe coincidir con los dominios autorizados en el backend.

### Flujo de Sesión para el Cliente Frontend

1. **Comprobar Sesión:** Consultar `GET {BASE_URL}/auth/GoogleOAuth/response` o `GET {BASE_URL}/auth/GoogleOAuth/usuario`.
2. **Inicio de Sesión:** Si la API devuelve `401`, redirigir el navegador a `GET {BASE_URL}/auth/GoogleOAuth/google?returnUrl={URL_FRONTEND}`.
3. **Retorno:** Google autentica al usuario, la API procesa el callback, registra al usuario en la base de datos si es nuevo, emite la cookie en el navegador y redirige de vuelta a la URL indicada en `returnUrl`.
4. **Consumo:** Todas las peticiones posteriores a endpoints protegidos utilizarán automáticamente la cookie almacenada.
5. **Cierre de Sesión:** Redirigir el navegador a `GET {BASE_URL}/auth/GoogleOAuth/logout?returnUrl={URL_LOGIN}` para invalidar y eliminar la cookie.

---

## 3. Catálogo de Endpoints

### 3.1 Módulo de Autenticación (`/auth/GoogleOAuth`)

#### Iniciar Sesión con Google
Inicia el desafío OAuth hacia las cuentas de Google. Este endpoint debe ser invocado como una navegación del navegador (redirección), no mediante llamadas de fondo.

- **Método:** `GET`
- **Ruta:** `/auth/GoogleOAuth/google`
- **Autenticación:** No requerida (Público).
- **Parámetros de Consulta (Query Params):**
  - `returnUrl` (string, opcional): URL a la que se debe redirigir al usuario en el frontend tras el inicio de sesión. Si no se especifica, redirige a `http://localhost:5500/`.
- **Respuestas:**
  - `302 Found`: Redirige a Google Accounts para validación de credenciales.

---

#### Comprobar Estado de la Sesión
Verifica si el usuario actual cuenta con una sesión válida activa en la API.

- **Método:** `GET`
- **Ruta:** `/auth/GoogleOAuth/response`
- **Autenticación:** Requerida (Cookie `NWindAPI.auth`).
- **Respuestas:**
  - `200 OK`: Sesión activa.
    ```json
    {
      "nombre": "Nombre del Usuario",
      "email": "usuario@dominio.com"
    }
    ```
  - `401 Unauthorized`: No hay sesión activa.
    ```json
    {
      "mensaje": "Aun no se inicia sesión con Google"
    }
    ```

---

#### Obtener Nombre del Usuario Autenticado
Obtiene exclusivamente el nombre del usuario con sesión activa para presentación en interfaces de usuario.

- **Método:** `GET`
- **Ruta:** `/auth/GoogleOAuth/usuario` *(alias disponible: `/auth/GoogleOAuth/nombre`)*
- **Autenticación:** Requerida (Cookie `NWindAPI.auth`).
- **Respuestas:**
  - `200 OK`:
    ```json
    {
      "nombre": "Nombre del Usuario"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "mensaje": "Aun no se inicia sesión con Google"
    }
    ```

---

#### Cerrar Sesión
Invalida la sesión actual en el servidor, destruye la cookie de autenticación del navegador y redirige al frontend.

- **Método:** `GET`
- **Ruta:** `/auth/GoogleOAuth/logout`
- **Autenticación:** No requerida / Opcional.
- **Parámetros de Consulta (Query Params):**
  - `returnUrl` (string, opcional): URL de destino tras cerrar la sesión. Si no se envía, redirige por defecto a `http://localhost:5500/login.html`.
- **Respuestas:**
  - `302 Found`: Redirección hacia la URL destino con cabecera `Set-Cookie` de expiración de la sesión.

---

### 3.2 Módulo de Proveedores (`/api/Suppliers`)

#### Listar Proveedores
Obtiene la lista simplificada de proveedores registrados para poblar formularios y selectores.

- **Método:** `GET`
- **Ruta:** `/api/Suppliers`
- **Autenticación:** No requerida.
- **Respuestas:**
  - `200 OK`:
    ```json
    [
      {
        "supplierId": 1,
        "companyName": "Exotic Liquids"
      },
      {
        "supplierId": 2,
        "companyName": "New Orleans Cajun Delights"
      }
    ]
    ```

---

### 3.3 Módulo de Categorías (`/api/Categories`)

#### Listar Categorías
Devuelve las categorías disponibles en la base de datos con su descripción.

- **Método:** `GET`
- **Ruta:** `/api/Categories`
- **Autenticación:** Requerida (Cookie `NWindAPI.auth`).
- **Respuestas:**
  - `200 OK`:
    ```json
    [
      {
        "categoryId": 1,
        "categoryName": "Beverages",
        "description": "Soft drinks, coffees, teas, beers, and ales"
      },
      {
        "categoryId": 2,
        "categoryName": "Condiments",
        "description": "Sweet and savory sauces, relishes, spreads, and seasonings"
      }
    ]
    ```
  - `401 Unauthorized`: Si el cliente no incluye la cookie de autenticación.

---

### 3.4 Módulo de Productos (`/api/Products`)

#### Listar Todos los Productos
Obtiene el inventario completo de productos con los nombres del proveedor y categoría ya vinculados y listos para visualización en tablas.

- **Método:** `GET`
- **Ruta:** `/api/Products`
- **Autenticación:** Requerida (Cookie `NWindAPI.auth`).
- **Respuestas:**
  - `200 OK`:
    ```json
    [
      {
        "productId": 1,
        "productName": "Chai",
        "supplierId": 1,
        "supplier": "Exotic Liquids",
        "categoryId": 1,
        "category": "Beverages",
        "quantityPerUnit": "10 boxes x 20 bags",
        "unitPrice": 18.00,
        "unitsInStock": 39,
        "unitsOnOrder": 0,
        "reorderLevel": 10,
        "discontinued": false
      }
    ]
    ```
  - `401 Unauthorized`: No autenticado.

---

#### Obtener Producto por ID
Consulta el detalle individual de un producto mediante su identificador.

- **Método:** `GET`
- **Ruta:** `/api/Products/{id}`
- **Autenticación:** Requerida (Cookie `NWindAPI.auth`).
- **Parámetros de Ruta:**
  - `id` (integer, obligatorio): Identificador numérico del producto.
- **Respuestas:**
  - `200 OK`:
    ```json
    {
      "productId": 1,
      "productName": "Chai",
      "supplierId": 1,
      "categoryId": 1,
      "quantityPerUnit": "10 boxes x 20 bags",
      "unitPrice": 18.00,
      "unitsInStock": 39,
      "unitsOnOrder": 0,
      "reorderLevel": 10,
      "discontinued": false
    }
    ```
  - `404 Not Found`: El producto con el ID especificado no existe.
  - `401 Unauthorized`: No autenticado.

---

#### Crear Producto
Registra un nuevo producto en el catálogo.

- **Método:** `POST`
- **Ruta:** `/api/Products`
- **Autenticación:** Requerida (Cookie `NWindAPI.auth`).
- **Cabeceras Requeridas:** `Content-Type: application/json`
- **Estructura del Cuerpo (JSON):**
  | Campo | Tipo | Obligatorio | Restricciones / Reglas |
  | :--- | :--- | :--- | :--- |
  | `productName` | string | **Sí** | Mínimo 5 y máximo 40 caracteres. |
  | `supplierId` | integer \| null | No | Debe ser un ID existente en `/api/Suppliers` o `null`. **No enviar 0**. |
  | `categoryId` | integer \| null | No | Debe ser un ID existente en `/api/Categories` o `null`. **No enviar 0**. |
  | `quantityPerUnit` | string \| null | No | Presentación (ej. "24 botellas de 500ml"). |
  | `unitPrice` | decimal \| null | No | Valor numérico mayor o igual a 0. |
  | `unitsInStock` | integer \| null | No | Entero mayor o igual a 0. |
  | `unitsOnOrder` | integer \| null | No | Entero mayor o igual a 0. |
  | `reorderLevel` | integer \| null | No | Entero mayor o igual a 0. |
  | `discontinued` | boolean | No | `true` si el producto está descontinuado, `false` en caso contrario (default: `false`). |

- **Ejemplo de Cuerpo (Body):**
  ```json
  {
    "productName": "Té Verde Orgánico",
    "supplierId": 1,
    "categoryId": 1,
    "quantityPerUnit": "20 sobres por caja",
    "unitPrice": 14.50,
    "unitsInStock": 45,
    "unitsOnOrder": 0,
    "reorderLevel": 5,
    "discontinued": false
  }
  ```
- **Respuestas:**
  - `201 Created`: Devuelve el objeto del producto persistido (incluyendo su `productId` autogenerado) y la cabecera `Location` hacia `/api/Products/{id}`.
  - `400 Bad Request`: Si no cumple las validaciones de tipo o longitud.
  - `401 Unauthorized`: No autenticado.

---

#### Actualizar Producto
Modifica un producto existente.

- **Método:** `PUT`
- **Ruta:** `/api/Products/{id}`
- **Autenticación:** Requerida (Cookie `NWindAPI.auth`).
- **Cabeceras Requeridas:** `Content-Type: application/json`
- **Parámetros de Ruta:**
  - `id` (integer, obligatorio): ID del producto a modificar.
- **Regla Fundamental de Validación:** El valor `productId` en el cuerpo JSON **debe coincidir exactamente** con el `{id}` pasado en la ruta. En caso contrario, el servidor responderá inmediatamente con `400 Bad Request`.
- **Ejemplo de Cuerpo (Body):**
  ```json
  {
    "productId": 1,
    "productName": "Chai Modificado",
    "supplierId": 1,
    "categoryId": 1,
    "quantityPerUnit": "10 cajas x 20 bolsas",
    "unitPrice": 19.50,
    "unitsInStock": 30,
    "unitsOnOrder": 5,
    "reorderLevel": 10,
    "discontinued": false
  }
  ```
- **Respuestas:**
  - `204 No Content`: Modificación exitosa (sin contenido en el cuerpo).
  - `400 Bad Request`: Si `id` de la ruta no coincide con `productId` del cuerpo.
  - `404 Not Found`: Si el producto con ese ID no existe.
  - `401 Unauthorized`: No autenticado.

---

#### Eliminar Producto
Elimina un producto del catálogo por su ID.

- **Método:** `DELETE`
- **Ruta:** `/api/Products/{id}`
- **Autenticación:** Requerida (Cookie `NWindAPI.auth`).
- **Parámetros de Ruta:**
  - `id` (integer, obligatorio): ID del producto a remover.
- **Regla de Negocio / Integridad Referencial:** Si el producto tiene pedidos asociados en la base de datos (relación con `OrderDetails`), la base de datos previene la eliminación para preservar el historial de ventas y la API devuelve un error descriptivo con código `400`.
- **Respuestas:**
  - `204 No Content`: Eliminación confirmada y exitosa.
  - `400 Bad Request`: Producto bloqueado por tener pedidos vinculados.
    ```json
    {
      "message": "No se puede eliminar el producto porque tiene pedidos asociados."
    }
    ```
  - `404 Not Found`: Si el producto no existe.
  - `401 Unauthorized`: No autenticado.

---

## 4. Modelos y Esquemas de Datos (Schemas)

Esta sección describe la estructura de los modelos de base de datos expuestos en la API.

> **Importante para el Frontend (Propiedades de Navegación del ORM):**  
> En la documentación generada por OpenAPI/Swagger, las entidades de Entity Framework muestran colecciones y objetos anidados (por ejemplo, `supplier`, `category`, `orderDetails`, `products`).  
> **El frontend NO debe enviar estos objetos anidados en peticiones `POST` o `PUT`.**  
> Para establecer relaciones, se debe enviar únicamente el identificador numérico escalar (`supplierId` o `categoryId`).

### 4.1 Equivalencia de Tipos de Datos (Backend C# / MySQL ➔ JSON / JavaScript)

| Tipo Backend (C# / MySQL) | Tipo JSON / JavaScript | Ejemplo | Observaciones |
| :--- | :--- | :--- | :--- |
| `int`, `int?` | `number` \| `null` | `10` | Entero sin decimales. |
| `decimal`, `decimal?` | `number` \| `null` | `18.50` | Número de punto flotante estándar. |
| `string`, `string?` | `string` \| `null` | `"Chai"` | Cadena de texto UTF-8. |
| `bool`, `bool?` | `boolean` \| `null` | `false` | Booleano real (`true`/`false`), no cadenas `"true"`. |

---

### 4.2 Modelo `Product` (Producto)

Representa la entidad de inventario en la tabla `products`.

| Propiedad | Tipo JSON | Nulable | Longitud Máx / Restricción | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `productId` | `number` | No | Clave Primaria (Autoincrementable) | Identificador único del producto. |
| `productName` | `string` | No | Máx. 40 caracteres (Mín. 5) | Nombre comercial del producto. |
| `supplierId` | `number` | Sí | Clave Foránea -> `Supplier.supplierId` | ID del proveedor asignado (o `null`). |
| `categoryId` | `number` | Sí | Clave Foránea -> `Category.categoryId` | ID de la categoría asignada (o `null`). |
| `quantityPerUnit`| `string` | Sí | Máx. 20 caracteres | Descripción de empaque (ej. "24 botellas"). |
| `unitPrice` | `number` | Sí | `decimal(19,4)` >= 0 | Precio de venta por unidad. |
| `unitsInStock` | `number` | Sí | Entero >= 0 | Unidades físicas disponibles en almacén. |
| `unitsOnOrder` | `number` | Sí | Entero >= 0 | Unidades pendientes de recibir por compra. |
| `reorderLevel` | `number` | Sí | Entero >= 0 | Umbral mínimo para reposición de stock. |
| `discontinued` | `boolean` | No | Default: `false` | Indica si el producto ha sido descatalogado. |

#### Proyecciones Adicionales en Listado (`GET /api/Products`):
Al consultar el catálogo completo, la API proyecta automáticamente dos campos planos para facilitar el renderizado directo en tablas sin requerir llamadas extra:
- `supplier` (`string`): Nombre de la compañía proveedora (`companyName`) o `"Sin proveedor"`.
- `category` (`string`): Nombre de la categoría (`categoryName`) o `"Sin categoría"`.

---

### 4.3 Modelo `Category` (Categoría)

Representa la clasificación en la tabla `categories`.

| Propiedad | Tipo JSON | Nulable | Longitud Máx | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `categoryId` | `number` | No | Clave Primaria | Identificador único de la categoría. |
| `categoryName` | `string` | No | Máx. 15 caracteres | Nombre de la categoría (ej. "Beverages"). |
| `description` | `string` | Sí | Texto largo | Descripción detallada de los tipos de artículos. |

*(Nota: La propiedad binaria interna `Picture` presente en la base de datos es excluida por la API en las respuestas para evitar sobrecarga en la red).*

---

### 4.4 Modelo `Supplier` (Proveedor)

Representa a los distribuidores en la tabla `suppliers`.

| Propiedad | Tipo JSON | Nulable | Longitud Máx | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `supplierId` | `number` | No | Clave Primaria | Identificador único del proveedor. |
| `companyName` | `string` | No | Máx. 40 caracteres | Razón social o nombre de la empresa. |

*(Nota: El endpoint `/api/Suppliers` expone exclusivamente `supplierId` y `companyName` para optimizar el llenado de listas desplegables).*

---

### 4.5 Modelo `Usuario` (Sesión y Cuenta)

Representa a los usuarios autenticados registrados automáticamente en la tabla `Usuarios` a través de Google OAuth.

| Propiedad | Tipo JSON | Nulable | Descripción |
| :--- | :--- | :---: | :--- |
| `id` | `number` | No | Clave Primaria autoincrementable. |
| `email` | `string` | Sí | Correo electrónico de la cuenta de Google. |
| `nombre` | `string` | Sí | Nombre de perfil registrado en la cuenta de Google. |

---

## 5. Códigos de Estado HTTP y Manejo de Errores

| Código | Significado | Causa común en la API |
| :---: | :--- | :--- |
| **`200 OK`** | Operación exitosa | Peticiones `GET` con datos en la respuesta. |
| **`201 Created`** | Recurso creado | Petición `POST /api/Products` exitosa. |
| **`204 No Content`** | Sin contenido | Peticiones `PUT` o `DELETE` completadas exitosamente. |
| **`302 Found`** | Redirección | Flujos de inicio y cierre de sesión de Google OAuth. |
| **`400 Bad Request`** | Error en los datos | Tipos de datos inválidos, disparidad entre ID de ruta y de cuerpo en `PUT`, o intento de eliminar productos con pedidos vinculados. |
| **`401 Unauthorized`** | Falta autenticación | Intentar consumir endpoints protegidos sin la cookie `NWindAPI.auth` o sin habilitar credenciales en la petición. |
| **`403 Forbidden`** | Acceso denegado | Usuario autenticado pero sin permisos sobre la política solicitada. |
| **`404 Not Found`** | No encontrado | El registro (por ID) no existe en la base de datos. |
| **`500 Server Error`** | Error interno | Falla de conexión a base de datos MySQL o error no controlado en el servidor. |

---

## 6. Recomendaciones de Integración para el Frontend

1. **Gestión de Valores Vacíos en Llaves Foráneas:**
   En los formularios de creación o edición de productos, si el usuario no selecciona un Proveedor o una Categoría, se debe enviar explícitamente `null` en el JSON. Enviar cadenas vacías (`""`) o enteros en cero (`0`) provocará violaciones de llave foránea o fallos en el enlace del modelo de Entity Framework.
2. **Normalización de Tipos de Entrada:**
   Asegurar que los campos numéricos (`unitPrice`, `unitsInStock`, `unitsOnOrder`, `reorderLevel`) se envíen como números reales (flotantes o enteros) o `null`, nunca como texto serializado (`"15.5"`).
3. **Manejo de Errores al Eliminar:**
   Al invocar `DELETE /api/Products/{id}`, verificar si la respuesta es `400` y leer el campo `message` del JSON para mostrarle al usuario la razón exacta (por ejemplo, pedidos asociados) en vez de un mensaje genérico.
