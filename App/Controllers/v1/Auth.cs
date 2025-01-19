using System.Text;
using App.Controllers.v1;
using App.Services;
using Microsoft.AspNetCore.Mvc;

public class AuthController(IConfiguration configuration, AuthServices authServices) : BaseApiController
{

    public class LoginModel
    {
        public required string username { set; get; }
        public required string password { set; get; }
    }
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginModel loginForm)
    {
        var user = await authServices.GetUserEntityByName(loginForm.username);
        if (user == null)
        {
            return Unauthorized("不存在該用戶");
        };
        var isPasswordCorrect = BCrypt.Net.BCrypt.Verify(loginForm.password, user.PasswordHash);
        if (!isPasswordCorrect)
        {
            return Unauthorized("密碼錯誤");
        };
        string jwt = authServices.GenerateJwtToken(user);
        return Ok(new { token = jwt });
    }
    // [HttpPost("logout")]
    // public async Task<IActionResult> Logout([FromBody] LoginModel loginForm)
    // {
    //     var user = await authServices.GetUserEntityByName(loginForm.username);
    //     if (user == null)
    //     {
    //         return Unauthorized("不存在該用戶");
    //     };
    //     var isPassCorrect = BCrypt.Net.BCrypt.Verify(loginForm.password, user.PasswordHash);
    //     if (!isPassCorrect)
    //     {
    //         return Unauthorized("密碼錯誤");
    //     };
    //     string jwt = authServices.GenerateJwtToken(user);
    //     return Ok(new { token = jwt });
    // }


}
