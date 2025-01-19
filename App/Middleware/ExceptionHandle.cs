using System.Net;
using System.Text.Json;
using App.CustomException;
namespace App.Middleware
{
    public class ExceptionHandleMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionHandleMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context); // 调用下一个中间件
            }
            catch (ServiceException se)
            {
                await HandleExceptionAsync(context, se, se.HttpCode, se.Message);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private Task HandleExceptionAsync(
            HttpContext context,
            Exception exception,
            int? httpCode = null,
            string? message = null)
        {
            context.Response.ContentType = "application/json";

            context.Response.StatusCode = httpCode ?? (int)HttpStatusCode.InternalServerError;

            // 可扩展错误响应结构
            var response = new
            {
                StatusCode = httpCode ?? context.Response.StatusCode,
                Message = message ?? "Internal Server Error. Please try again later.",
                // Detailed = exception.Message // 如果需要更详细的错误信息
            };

            var jsonResponse = JsonSerializer.Serialize(response);
            return context.Response.WriteAsync(jsonResponse);
        }
    }
}