
using AutoMapper;

namespace App.Entities
{
    public enum UserRole
    {
        Admin = 0,     
        Client = 1   
    }

    public class UserEntity : BaseEntityMixin
    {

        public required string Name { set; get; }
        public required string PasswordHash { set; get; }
        public required UserRole UserRole { set; get; }
        public List<OrderEntity> Orders { get; } = [];

    }
    public class UserCreateDto
    {
        public required string Name { set; get; }
        public required string Password { set; get; }
        public required UserRole UserRole { set; get; }
    }
    public class UserUpdatePassWordDto
    {
        public required string Password { set; get; }
    }
    public class UserUpdateOtherDto
    {

        public required string Name { set; get; }
    }
    public class UserReadDto
    {
        public required int Id { set; get; }
        public required string Name { set; get; }
    }

    public class UserProfile : Profile
    {
        public UserProfile()
        {
            CreateMap<UserEntity, UserReadDto>();
        }
    }
}