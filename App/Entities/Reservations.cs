
using System.ComponentModel.DataAnnotations.Schema;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace App.Entities
{

    [Index(nameof(UserId))]
    [Index(nameof(CarId))]
    public class ReservationsEntity
    {
        public int Id { set; get; }
        [ForeignKey(nameof(UserEntity))]
        public required int UserId { set; get; }
        public required UserEntity User { set; get; }

        [ForeignKey(nameof(CarEntity))]
        public required int CarId { set; get; }
        public required CarEntity Car { set; get; }
        public required DateTimeOffset ExpiredAt { set; get; }


    }
    public class ReservationsCreateDto
    {
        public required int UserId { set; get; }
        public required int CarId { set; get; }
        public required DateTimeOffset ExpiredAt { set; get; }
    }
    public class ReservationsReadDto : ReservationsCreateDto { }
    public class ReservationsProfile : Profile
    {
        public ReservationsProfile()
        {
            CreateMap<ReservationsCreateDto, ReservationsEntity>();
            CreateMap<ReservationsEntity, ReservationsReadDto>();
        }
    }
}