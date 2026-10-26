
const API_BASE_URL = 'https://webappapikey-dwcwaac4aqfceqhh.mexicocentral-01.azurewebsites.net/api';

// Claves utilizadas en localStorage para persistir sesión
const STORAGE_KEYS = {
    API_KEY: 'northwind_apikey_value',
    USERNAME: 'northwind_apikey_username',
    USER_ID: 'northwind_apikey_userid',
    EXPIRES_AT: 'northwind_apikey_expires_at'
};

// Endpoints de la API
const API_ENDPOINTS = {
    // Autenticación
    AUTH_LOGIN: `${API_BASE_URL}/Auth/login`,
    AUTH_REGISTER: `${API_BASE_URL}/Auth/register`,
    // Gestión de API Keys
    APIKEYS_REGENERATE: `${API_BASE_URL}/ApiKeys/regenerate`,
    // Catálogo de Productos
    PRODUCTS: `${API_BASE_URL}/Products`,
    PRODUCT_BY_ID: (id) => `${API_BASE_URL}/Products/${id}`,
    // Catálogo de Clientes
    CUSTOMERS: `${API_BASE_URL}/Customers`,
    CUSTOMER_BY_ID: (id) => `${API_BASE_URL}/Customers/${id}`,
    // Historial de Órdenes
    ORDERS: `${API_BASE_URL}/Orders`,
    ORDER_BY_ID: (id) => `${API_BASE_URL}/Orders/${id}`
};
