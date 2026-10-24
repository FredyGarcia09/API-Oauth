// Comprobar si ya existe una sesión activa con Google
async function verificarSesionPrevia() {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/auth/GoogleOAuth/response`, {
            credentials: 'include'
        });

        if (respuesta.ok) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error al verificar sesión previa:', error);
    }
}

// Iniciar redirección de login hacia la API de ASP.NET
const btnGoogleLogin = document.getElementById('btnGoogleLogin');
if (btnGoogleLogin) {
    btnGoogleLogin.addEventListener('click', () => {
        const returnUrl = new URL('index.html', window.location.href).href;
        window.location.href = `${API_BASE_URL}/auth/GoogleOAuth/google?returnUrl=${encodeURIComponent(returnUrl)}`;
    });
}

verificarSesionPrevia();
