/**
 * login.js - Control del inicio de sesión y registro de usuarios
 */

// Mostrar mensaje en la caja de alerta
function mostrarAlertaLogin(mensaje, tipo = 'danger') {
    const el = document.getElementById('mensajeAlerta');
    if (!el) return;

    el.className = `alert alert-${tipo} py-2 small shadow-sm`;
    el.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-${tipo === 'success' ? 'check-circle-fill' : tipo === 'warning' ? 'exclamation-triangle-fill' : 'exclamation-circle-fill'} me-2"></i>
            <div>${mensaje}</div>
        </div>
    `;
    el.classList.remove('d-none');
}

function ocultarAlertaLogin() {
    const el = document.getElementById('mensajeAlerta');
    if (el) el.classList.add('d-none');
}

// Comprobar si ya existe una sesión activa
function verificarSesionPrevia() {
    const apiKey = obtenerApiKey();
    if (apiKey) {
        window.location.href = 'index.html';
    }

    const mensajePrevio = sessionStorage.getItem('mensajeLogin');
    if (mensajePrevio) {
        mostrarAlertaLogin(mensajePrevio, 'warning');
        sessionStorage.removeItem('mensajeLogin');
    }
}

// 1. Iniciar sesion (POST /api/Auth/login)
const frmLogin = document.getElementById('frmLogin');
if (frmLogin) {
    frmLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        ocultarAlertaLogin();

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            mostrarAlertaLogin('Ingresa tu usuario y contraseña.', 'warning');
            return;
        }

        const btnSubmit = document.getElementById('btnLoginSubmit');
        const spinner = document.getElementById('loginSpinner');
        btnSubmit.disabled = true;
        spinner.classList.remove('d-none');

        try {
            const respuesta = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await respuesta.json().catch(() => null);

            if (respuesta.ok && data && data.apiKey) {
                guardarSesion(data);
                mostrarAlertaLogin('Iniciando sesión...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 600);
            } else {
                let mensaje = 'El usuario o la contraseña son incorrectos.';
                if (data) {
                    if (data.detail) mensaje = data.detail;
                    else if (data.title) mensaje = data.title;
                }
                mostrarAlertaLogin(mensaje, 'danger');
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            mostrarAlertaLogin('No se pudo conectar con el servidor. Inténtalo más tarde.', 'danger');
        } finally {
            btnSubmit.disabled = false;
            spinner.classList.add('d-none');
        }
    });
}

// 2. Registrarse (POST /api/Auth/register)
const frmRegistro = document.getElementById('frmRegistro');
if (frmRegistro) {
    frmRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        ocultarAlertaLogin();

        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;

        if (!username || !email || !password) {
            mostrarAlertaLogin('Todos los campos son obligatorios.', 'warning');
            return;
        }

        if (password.length < 8) {
            mostrarAlertaLogin('La contraseña debe tener al menos 8 caracteres.', 'warning');
            return;
        }

        const btnSubmit = document.getElementById('btnRegistroSubmit');
        const spinner = document.getElementById('regSpinner');
        btnSubmit.disabled = true;
        spinner.classList.remove('d-none');

        try {
            const respuesta = await fetch(API_ENDPOINTS.AUTH_REGISTER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await respuesta.json().catch(() => null);

            if ((respuesta.status === 200 || respuesta.status === 201) && data && data.apiKey) {
                guardarSesion(data);
                mostrarAlertaLogin('Cuenta creada exitosamente. Iniciando sesión...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 800);
            } else {
                let mensaje = 'No fue posible registrar la cuenta.';
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
                        if (lista.length > 0) mensaje = lista.join('<br>');
                    } else if (data.detail) {
                        mensaje = data.detail;
                    } else if (data.title) {
                        mensaje = data.title;
                    }
                }
                mostrarAlertaLogin(mensaje, 'danger');
            }
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            mostrarAlertaLogin('No se pudo conectar con el servidor. Inténtalo más tarde.', 'danger');
        } finally {
            btnSubmit.disabled = false;
            spinner.classList.add('d-none');
        }
    });
}

verificarSesionPrevia();
