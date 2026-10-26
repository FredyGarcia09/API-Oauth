// Validar la sesión con el endpoint de autenticación de Google
async function verificarSesion() {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/auth/GoogleOAuth/response`, {
            credentials: 'include'
        });

        // Si no hay sesión válida, redirigir al portal de acceso
        if (respuesta.status === 401 || respuesta.status === 403) {
            window.location.href = 'login.html';
            return false;
        }

        if (!respuesta.ok) {
            throw new Error(`HTTP ${respuesta.status}`);
        }

        return true;
    } catch (error) {
        console.error('Error al verificar la sesión:', error);
        window.location.href = 'login.html';
        return false;
    }
}

// Obtener el nombre del usuario desde el endpoint para saludarlo en la UI
async function cargarNombreUsuario() {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/auth/GoogleOAuth/usuario`, {
            credentials: 'include'
        });

        if (respuesta.ok) {
            const data = await respuesta.json();
            if (data.nombre) {
                const usuarioInfo = document.getElementById('usuarioInfo');
                const usuarioNombre = document.getElementById('usuarioNombre');
                const saludoBienvenida = document.getElementById('saludoBienvenida');
                const saludoNombre = document.getElementById('saludoNombre');

                if (usuarioNombre) usuarioNombre.textContent = `¡Hola, ${data.nombre}!`;
                if (saludoNombre) saludoNombre.textContent = data.nombre;

                if (usuarioInfo) usuarioInfo.classList.remove('d-none');
                if (saludoBienvenida) saludoBienvenida.classList.remove('d-none');
            }
        }
    } catch (error) {
        console.error('Error al obtener el nombre del usuario:', error);
    }
}

// Inicializar el botón de cerrar sesión
function inicializarLogout() {
    const btnCerrar = document.getElementById('btnCerrarSesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            const returnUrl = new URL('login.html', window.location.href).href;
            window.location.href = `${API_BASE_URL}/auth/GoogleOAuth/logout?returnUrl=${encodeURIComponent(returnUrl)}`;
        });
    }
}
