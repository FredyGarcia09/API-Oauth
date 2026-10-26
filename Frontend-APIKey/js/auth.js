/**
 * auth.js - Autenticación y manejo de sesión
 */

// Obtener clave activa desde localStorage
function obtenerApiKey() {
    return localStorage.getItem(STORAGE_KEYS.API_KEY);
}

// Obtener información del usuario
function obtenerUsuario() {
    return {
        apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY),
        username: localStorage.getItem(STORAGE_KEYS.USERNAME) || 'Usuario',
        userId: localStorage.getItem(STORAGE_KEYS.USER_ID) || null,
        expiresAt: localStorage.getItem(STORAGE_KEYS.EXPIRES_AT) || null
    };
}

// Persistir sesión en navegador
function guardarSesion(data) {
    if (data.apiKey) {
        localStorage.setItem(STORAGE_KEYS.API_KEY, data.apiKey);
    }
    if (data.username || data.clientIdentifier) {
        localStorage.setItem(STORAGE_KEYS.USERNAME, data.username || data.clientIdentifier);
    }
    if (data.userId || data.id) {
        localStorage.setItem(STORAGE_KEYS.USER_ID, data.userId || data.id);
    }
    if (data.expiresAt) {
        localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, data.expiresAt);
    }
}

// Cerrar sesión
function cerrarSesion(mensaje = null) {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);

    if (mensaje) {
        sessionStorage.setItem('mensajeLogin', mensaje);
    }
    window.location.href = 'login.html';
}

// Validar si existe una key activa en locqal storage
function verificarSesion() {
    const apiKey = obtenerApiKey();
    if (!apiKey) {
        window.location.href = 'login.html';
        return false;
    }

    const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
    if (expiresAt) {
        const fechaExp = new Date(expiresAt);
        if (fechaExp < new Date()) {
            cerrarSesion('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            return false;
        }
    }

    return true;
}

/**
 * Cliente HTTP centralizado para peticiones a la API
 */
async function apiFetch(url, options = {}) {
    const apiKey = obtenerApiKey();

    const headers = {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-KEY': apiKey } : {}),
        ...(options.headers || {})
    };

    const config = {
        ...options,
        headers
    };

    try {
        const respuesta = await fetch(url, config);

        if (respuesta.status === 401) {
            let detalle = 'Tu sesión ha caducado o la clave es inválida.';
            try {
                const errJson = await respuesta.json();
                detalle = errJson.detail || errJson.title || detalle;
            } catch (e) {
                // Ignore json parse error
            }
            cerrarSesion(detalle);
            throw new Error(detalle);
        }

        if (respuesta.status === 204) {
            return { ok: true, status: 204, data: null };
        }

        let data = null;
        const contentType = respuesta.headers.get('content-type') || '';
        if (contentType.includes('json')) {
            data = await respuesta.json();
        } else {
            const texto = await respuesta.text();
            data = texto ? { texto } : null;
        }

        if (!respuesta.ok) {
            let mensajeError = 'Ocurrió un error al procesar la solicitud.';

            if (data) {
                if (data.errors && typeof data.errors === 'object') {
                    const lista = [];
                    for (const campo in data.errors) {
                        if (Array.isArray(data.errors[campo])) {
                            lista.push(...data.errors[campo]);
                        } else {
                            lista.push(data.errors[campo]);
                        }
                    }
                    if (lista.length > 0) {
                        mensajeError = lista.join('<br>');
                    }
                } else if (data.detail) {
                    mensajeError = data.detail;
                } else if (data.title) {
                    mensajeError = data.title;
                }
            }

            const error = new Error(mensajeError);
            error.status = respuesta.status;
            error.problem = data;
            throw error;
        }

        return { ok: true, status: respuesta.status, data };
    } catch (error) {
        throw error;
    }
}

// Formatear fechas legibles
function formatearFecha(cadenaFecha) {
    if (!cadenaFecha) return 'No especificada';
    try {
        const fecha = new Date(cadenaFecha);
        if (isNaN(fecha.getTime())) return cadenaFecha;
        return fecha.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return cadenaFecha;
    }
}

// Sanitizar texto
function escapeHtml(texto) {
    if (texto === null || texto === undefined) return '';
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/'/g, '&#39;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Mostrar alertas en UI
function mostrarAlerta(mensaje, tipo = 'success') {
    const contenedor = document.getElementById('contenedorAlertas');
    if (!contenedor) return;

    const idAlerta = 'alert-' + Date.now();
    const alertHtml = `
        <div id="${idAlerta}" class="alert alert-${tipo} alert-dismissible fade show shadow-sm d-flex align-items-center justify-content-between" role="alert">
            <div>
                <i class="bi bi-${tipo === 'success' ? 'check-circle-fill' : tipo === 'warning' ? 'exclamation-triangle-fill' : tipo === 'info' ? 'info-circle-fill' : 'x-circle-fill'} me-2"></i>
                <span>${mensaje}</span>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        </div>
    `;

    contenedor.innerHTML = alertHtml;

    setTimeout(() => {
        const alerta = document.getElementById(idAlerta);
        if (alerta && window.bootstrap) {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(alerta);
            bsAlert.close();
        }
    }, 5000);
}

// Inicializar la interfaz en la barra superior
function inicializarNavbarUsuario() {
    const usuario = obtenerUsuario();
    const apiKeyMaskedEl = document.getElementById('apiKeyMasked');

    if (apiKeyMaskedEl && usuario.apiKey) {
        actualizarVisorApiKey(usuario.apiKey);
    }

    // Botón copiar clave
    const btnCopiarKey = document.getElementById('btnCopiarApiKey');
    if (btnCopiarKey) {
        btnCopiarKey.addEventListener('click', async () => {
            const key = obtenerApiKey();
            if (key) {
                try {
                    await navigator.clipboard.writeText(key);
                    mostrarAlerta('Clave copiada al portapapeles.', 'info');
                } catch (e) {
                    mostrarAlerta(`Clave: ${key}`, 'info');
                }
            }
        });
    }

    // Botón Cerrar sesión
    const btnCerrar = document.getElementById('btnCerrarSesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            cerrarSesion();
        });
    }

    // Botón confirmar renovación de clave en el modal
    const btnConfirmarRegenerar = document.getElementById('btnConfirmarRegenerar');
    if (btnConfirmarRegenerar) {
        btnConfirmarRegenerar.addEventListener('click', ejecutarRegeneracionApiKey);
    }
}

// Enmascarar API Key para la barra
function actualizarVisorApiKey(key) {
    const el = document.getElementById('apiKeyMasked');
    if (!el) return;
    if (!key) {
        el.textContent = '---';
        return;
    }
    if (key.length > 14) {
        el.textContent = `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
    } else {
        el.textContent = key;
    }
}

// Ejecutar renovación de la clave
async function ejecutarRegeneracionApiKey() {
    const btn = document.getElementById('btnConfirmarRegenerar');
    if (btn) btn.disabled = true;

    try {
        const respuesta = await apiFetch(API_ENDPOINTS.APIKEYS_REGENERATE, {
            method: 'POST'
        });

        if (respuesta.ok && respuesta.data) {
            guardarSesion({
                apiKey: respuesta.data.apiKey,
                username: respuesta.data.clientIdentifier,
                expiresAt: respuesta.data.expiresAt
            });

            const modalEl = document.getElementById('modalRegenerarApiKey');
            if (modalEl && window.bootstrap) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }

            actualizarVisorApiKey(respuesta.data.apiKey);
            mostrarAlerta('Clave de acceso renovada exitosamente.', 'success');
        }
    } catch (error) {
        console.error('Error al renovar clave:', error);
        mostrarAlerta(`No se pudo renovar la clave: ${error.message}`, 'danger');
    } finally {
        if (btn) btn.disabled = false;
    }
}
