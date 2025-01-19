using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

using App.Entities;
using App.DB;
using App.Services;
using System.Text;
using App.Migrations;
using Microsoft.AspNetCore.Authorization;
namespace App.Controllers.v1
{
    public class UserController(DataBaseContext context, IMapper mapper, AuthServices authServices) : BaseApiController
    {
        [HttpPost]
        public async Task<ActionResult<UserReadDto>> Create(UserCreateDto userCreateDto)
        {
            var item = await context.Users.Where(u => u.Name == userCreateDto.Name).FirstOrDefaultAsync();
            if (item != null)
            {
                return BadRequest("已有相同名稱");
            }
            var hashPassword = authServices.HashPasswordWithSalt(userCreateDto.Password);
            var newUser = new UserEntity
            {
                Name = userCreateDto.Name,
                PasswordHash = hashPassword,
                UserRole = UserRole.Client
            };
            context.Add(newUser);
            await context.SaveChangesAsync();
            var toRead = mapper.Map<UserReadDto>(newUser);
            return Ok(toRead);
        }
        // [HttpDelete("{id}")]
        // public async Task<ActionResult<bool>> Delete(int id)
        // {
        //     var item = await context.FindAsync<OrderEntity>(id);
        //     if (item == null)
        //     {
        //         return NotFound();
        //     }
        //     context.Orders.Remove(item);
        //     await context.SaveChangesAsync();
        //     var toRead = mapper.Map<OrderReadDto>(item);
        //     return Ok(toRead);
        // }
        // [HttpGet("{id}")]
        // public async Task<ActionResult<OrderReadDto>> GetOne(int id)
        // {
        //     var item = await context.FindAsync<OrderEntity>(id);
        //     var toRead = mapper.Map<OrderReadDto>(item);
        //     return Ok(toRead);
        // }
        [Authorize(Roles = "Admin")]
        [HttpGet()]
        public async Task<ActionResult<UserReadDto>> GetMany()
        {
            var item = await context.Users.ToListAsync();
            var toRead = mapper.Map<List<UserReadDto>>(item);
            return Ok(toRead);
        }
    }
}