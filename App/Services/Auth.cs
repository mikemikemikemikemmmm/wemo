using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using App.CustomException;
using App.DB;
using App.Entities;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace App.Services
{
    public class AuthServices(IHttpContextAccessor httpContextAccessor, DataBaseContext context, IOptions<AuthSettings> authSettings)
    {
        // public string GetUserIdInJwt()
        // {
        //     var user = httpContextAccessor.HttpContext?.User;
        //     var userId = user?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        //     if (userId == null)
        //     {
        //         throw ServiceException.Unauthorized("");
        //     }
        //     return userId;
        // }
        public async Task<UserEntity> GetUserByJwt()
        {
            // var user = httpContextAccessor.HttpContext?.User;
            // var userId = user?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var userId = "40";//TODO
            //TODO
            //TODO
            //TODO
            //TODO
            if (userId == null)
            {
                throw ServiceException.Unauthorized();
            }
            var userEntity = await context.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
            if (userEntity == null)
            {
                throw ServiceException.Unauthorized();
            }
            return userEntity;
        }
        public async Task<UserEntity?> GetUserEntityByName(string userName)
        {
            var user = await context.Users.Where(u => u.Name == userName).FirstOrDefaultAsync();
            return user;
        }
        public string? GetUserRoleName(UserRole userRole)
        {
            return Enum.GetName(typeof(UserRole), userRole);
        }
        public string GenerateJwtToken(UserEntity user)
        {
            var roleName = GetUserRoleName(user.UserRole) ?? "";
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Role, roleName)
            };
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authSettings.Value.jwtSecretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(authSettings.Value.jwtExpiredDays),  // 令牌过期时间
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }


        public string HashPasswordWithSalt(string password)
        {
            string salt = BCrypt.Net.BCrypt.GenerateSalt(authSettings.Value.saltSize);
            var hashed = BCrypt.Net.BCrypt.HashPassword(password, salt);
            return hashed;
        }

    }
}