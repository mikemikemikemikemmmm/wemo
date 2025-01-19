
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AutoMapper;
using NetTopologySuite.Geometries;

namespace App.Entities
{
    public enum CarStatus
    {
        UnderMaintenance = 0, // 維修中
        OutOfOrder = 1,       // 故障中
        CanBeReserved = 2, // 可被預約
        Others = 3,    // 其他
        Reserved = 4,//等待被取車中
        Driving = 5 //騎行中
    }
    public class CarEntity : BaseEntityMixin
    {

        public required string Name { set; get; }
        public required CarStatus CarStatus { set; get; }
        [Column(TypeName = "geometry (point)")]
        public required Point Location { set; get; }
    }
    public class CarCreateDto
    {
        [Required]
        public required string Name { set; get; }
        [Required]
        public required CarStatus CarStatus { set; get; }
        public required float Longitude { set; get; }
        public required float Latitude { set; get; }
    }
    public class CarUpdateDto : CarCreateDto
    {
    }
    public class CarReadDto : CarCreateDto
    {
        public int Id { set; get; }
    }
    public class CarProfile : Profile
    {
        public CarProfile()
        {
            CreateMap<CarEntity, CarReadDto>()
            .ForMember(r => r.Longitude, e => e.MapFrom(e => e.Location.X))
            .ForMember(r => r.Latitude, e => e.MapFrom(e => e.Location.Y));
            CreateMap<CarCreateDto, CarEntity>();
            CreateMap<CarUpdateDto, CarEntity>();
        }
    }
}