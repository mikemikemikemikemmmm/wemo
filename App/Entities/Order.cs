
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AutoMapper;
using NetTopologySuite.Geometries;

namespace App.Entities
{
    public class OrderEntity : BaseEntityMixin
    {

        [ForeignKey(nameof(UserEntity))]
        public required int UserId { set; get; }
        public required UserEntity User { set; get; }
        [ForeignKey(nameof(CarEntity))]
        public required int CarId { set; get; }
        public required CarEntity Car { set; get; }
        [Range(0, int.MaxValue)]
        public required int TotalCost { set; get; }
        // public required TimeSpan TotalTime { set; get; }        
        
        public required int DurationInSeconds  { set; get; }
        public required int TotalDistanceMeter { set; get; }
    }
    public class OrderCreateDto
    {
        public required int UserId { set; get; }
        public required int CarId { set; get; }
        public required int TotalCost { set; get; }
        public required DateTimeOffset TotalTime { set; get; }
        public required int TotalDistanceMeter { set; get; }
    }
    public class OrderReadDto : OrderCreateDto
    {
        public int Id { set; get; }
    }
    public class OrderProfile : Profile
    {
        public OrderProfile()
        {
            CreateMap<OrderEntity, OrderReadDto>();
            CreateMap<OrderCreateDto, OrderEntity>();
        }
    }
}