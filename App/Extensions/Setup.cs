using System.Text;
using App;
using App.DB;
using App.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

public static class Setup
{
    public static void SetupAllServices(this IServiceCollection services, ConfigurationManager configurationManager)
    {
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();
        services.AddDbContext<DataBaseContext>(opt =>
        {
            var connectionString = configurationManager.GetConnectionString("NGQSQL_CONNECTION");
            opt.UseNpgsql(connectionString, o => o.UseNetTopologySuite());
        });
        services.Configure<AuthSettings>(configurationManager.GetSection("AuthSettings"));
        services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
        });
        services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                var jwtSecretKey = configurationManager.GetSection("AuthSettings").GetValue<string>("jwtSecretKey");
                options.IncludeErrorDetails = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey))
                };
            });

        services.AddSingleton(provider => NetTopologySuite.NtsGeometryServices.Instance.CreateGeometryFactory(Const.SRID));
        services.AddHttpContextAccessor();
        services.AddScoped<AuthServices>();
        services.AddScoped<CarServices>();
    }
    public static void SetupAllMiddleware(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseExceptionHandler("/error-development");
            app.UseSwagger();
            app.UseSwaggerUI();
            app.UseCors("AllowAll");
        }
        else
        {
            app.UseExceptionHandler("/error");
        }
        app.UseHttpsRedirection();
        app.UseAuthentication();
        app.UseAuthorization();
    }
}