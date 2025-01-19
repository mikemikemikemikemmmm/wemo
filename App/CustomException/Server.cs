
namespace App.CustomException

{
    public class ServiceException : Exception
    {
        public int HttpCode { get; init; } // 使用 init-only 属性提高不可变性
        public override string Message { get; } // 覆写 Exception 的 Message 属性

        // 私有构造函数，限制外部直接实例化
        private ServiceException(int httpCode, string message)
        {
            HttpCode = httpCode;
            Message = message;
        }

        // 静态方法用于创建 Bad Request 异常
        public static ServiceException BadRequest(string message) =>
            new ServiceException(400, message);

        // 其他常用 HTTP 状态码方法
        public static ServiceException Unauthorized() =>
            new ServiceException(401, "未認證");

        public static ServiceException Forbidden() =>
            new ServiceException(403, "無權限");

        public static ServiceException NotFound(string message) =>
            new ServiceException(404, message);

        public static ServiceException InternalServerError(string message) =>
            new ServiceException(500, message);

        public static ServiceException ServiceUnavailable(string message) =>
            new ServiceException(503, message);
    }

}