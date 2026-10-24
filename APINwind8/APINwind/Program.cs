using APINwind.Models;
using APINwind.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Options;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ContextoBD>(options =>
    options.UseMySql(builder.Configuration.GetConnectionString("ConexionNwind"),
    ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("ConexionNwind"))));

// Add services to the container.

builder.Services.AddControllers();

builder.Services.AddAuthentication("cookie").
    AddCookie("cookie", o =>
    {
        //Creando y configurando la cookie 
        o.Cookie.Name = "NWindAPI.auth";
        o.Cookie.SameSite = SameSiteMode.None;
        o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        o.Cookie.HttpOnly = true;

        //Evento que manda un error 401 al frontend en caso de que no haya iniciado sesión
        o.Events.OnRedirectToLogin = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            }
            context.Response.Redirect(context.RedirectUri);
            return Task.CompletedTask;
        };

        //Evento que manda un error 403 al frontend al denegar el acceso
        o.Events.OnRedirectToAccessDenied = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            }

            context.Response.Redirect(context.RedirectUri);
            return Task.CompletedTask;
        };
    })
    .AddGoogle(googleOptions =>
    {
        googleOptions.SignInScheme = "cookie";
        //Pide el ID del Cliente y el Client Secret de Google Cloud
        googleOptions.ClientId = builder.Configuration["Authentication:Google:ClientId"]!;
        googleOptions.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;
        googleOptions.SaveTokens = false;

        googleOptions.Scope.Clear();
        //Alcance que pide el nombre de perfil y el usuario a Google
        googleOptions.Scope.Add("profile");
        googleOptions.Scope.Add("email");

        googleOptions.AuthorizationEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";

        googleOptions.TokenEndpoint = "https://oauth2.googleapis.com/token";
        //Dirección de Callback configurada en Google Cloud al crear el ID de cliente
        googleOptions.CallbackPath = "/signin-google";

        //Registramos al usuario si es su pimera vez iniciando sesión con Google, usaos OnTicketReceived
        googleOptions.Events = new Microsoft.AspNetCore.Authentication.OAuth.OAuthEvents
        {
            OnTicketReceived = async context =>
            {
                // Obtenemos la instancia de la base de datos desde los servicios de la petición HTTP actual
                var dbContext = context.HttpContext.RequestServices.GetRequiredService<ContextoBD>();

                var email = context.Principal?.FindFirst(ClaimTypes.Email)?.Value;
                var nombre = context.Principal?.FindFirst(ClaimTypes.Name)?.Value;

                if (!string.IsNullOrEmpty(email))
                {
                    // Revisamos si ya existe el usuario por su correo
                    var existeUsuario = await dbContext.Usuarios.AnyAsync(u => u.Email == email);

                    if (!existeUsuario)
                    {
                        dbContext.Usuarios.Add(new Usuario
                        {
                            Email = email,
                            Nombre = nombre ?? "Usuario de Google"
                        });
                        await dbContext.SaveChangesAsync();
                    }
                }
            }
        };
    });

//Agregando la política con la que se requerirá hacer Login en la API
//Para emplearla, en cada EndPoint que se quiera aplicar la autenticación utilizar:
//[Authorize(Policy = "loggedIn")] al inicio de esta
builder.Services.AddAuthorization(options =>
{
    //Se llama "loggedIn" y requiere el esquema de autenticación de la cookie creada
    options.AddPolicy("loggedIn", policy =>
    {
        policy.AddAuthenticationSchemes("cookie")
              .RequireAuthenticatedUser();
    });
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
            "http://localhost:5500",
            "http://127.0.0.1:5500"
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        //Se añade que permita las credenciales en la API
        .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors();

//Habilitar autenticación y autorización
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
