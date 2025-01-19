
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace App.Entities
{
    [Index(nameof(UserId))]
    [Index(nameof(CarId))]
    public class DrivingsEntity : BaseEntityMixin
    {
        [ForeignKey(nameof(UserEntity))]
        public required int UserId { set; get; }
        public required UserEntity User { set; get; }

        [ForeignKey(nameof(CarEntity))]
        public required int CarId { set; get; }
        public required CarEntity Car { set; get; }
        public int CurrentSumMeters { set; get; }
    }
    public class DrivingsCreateDto
    {
        public required int UserId { set; get; }
        public required int CarId { set; get; }

    }
    public class DrivingsUpdateDto
    {
        public required int Id { set; get; }
        public required int CurrentSumMeters { set; get; }
    }
    public class DrivingsReadDto : DrivingsUpdateDto
    { }
    // public class ReservationsProfile : Profile
    // {
    //     public ReservationsProfile()
    //     {
    //         CreateMap<ReservationsCreateDto, ReservationsEntity>();
    //         CreateMap<ReservationsEntity, ReservationsReadDto>();
    //     }
    // }
}