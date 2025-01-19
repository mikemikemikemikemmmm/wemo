var builder = WebApplication.CreateBuilder(args);
var configurationManager = builder.Configuration;
builder.Services.SetupAllServices(configurationManager);
var app = builder.Build();
app.SetupAllMiddleware();
app.MapControllers();
app.Run();
