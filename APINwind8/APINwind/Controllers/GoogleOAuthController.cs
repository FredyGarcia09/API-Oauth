using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace APINwind.Controllers
{
    [Route("auth/[controller]")]
    [ApiController]
    public class GoogleOAuthController : ControllerBase
    {
        //EndPoint para hacer el login utilizando fetch seguido de ?returnUrl='url-de-retorno-luego-de-login'
        [HttpGet("google")]
        public IActionResult GoogleLogin([FromQuery] string? returnUrl)
        {

            if (string.IsNullOrWhiteSpace(returnUrl))
                returnUrl = "http://localhost:5500/";

            var properties = new AuthenticationProperties
            {
                RedirectUri = returnUrl
            };

            return Challenge(properties, "Google");
        }

        //EndPoint para revisar que sí se haya recuperado el usuario y correo de Google al iniciar sesión
        [HttpGet("response")]
        public IActionResult GoogleResponse()
        {
            var nombre = User.FindFirst(ClaimTypes.Name)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            if (string.IsNullOrEmpty(email))
            {
                return Unauthorized(new
                {
                    mensaje = "Aun no se inicia sesión con Google"
                });
            }

            return Ok(new
            {
                nombre,
                email
            });
        }

        //EndPoint para cerrar sesión y eliminar la cookie de autenticación
        [HttpGet("logout")]
        public async Task<IActionResult> Logout([FromQuery] string? returnUrl)
        {
            await HttpContext.SignOutAsync("cookie");

            if (string.IsNullOrWhiteSpace(returnUrl))
                returnUrl = "http://localhost:5500/login.html";

            return Redirect(returnUrl);
        }
    }
}
