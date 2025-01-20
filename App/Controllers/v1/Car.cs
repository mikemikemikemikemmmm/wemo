using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using App.Helpers;
using App.Entities;
using App.DB;
using App.Services;
namespace App.Controllers.v1
{
    public class CarController(IMapper mapper, CarServices carServices) : BaseApiController
    {
        [HttpPost("get_cars_by_polygon")]
        public async Task<ActionResult<List<CarReadDto>>> GetAroundCarsByPolygon(
            [FromBody] GeoHelpers.GeoJsonFeature<GeoHelpers.GeometryPolygon> geoJsonPolygon
            )
        {
            var polygon = GeoHelpers.CreatePolygon(geoJsonPolygon);
            var cars = await carServices.GetAroundCarsByPolygon(polygon);
            var toRead = mapper.Map<List<CarReadDto>>(cars);
            return Ok(toRead);
        }
        [HttpGet("get_cars_by_id/{carId}")]
        public async Task<ActionResult<CarReadDto>> GetCarById(int carId)
        {
            var car = await carServices.GetCar(carId, null);
            var toRead = mapper.Map<CarReadDto>(car);
            return Ok(toRead);
        }
        [HttpGet("reserve/{carId}")]
        public async Task<ActionResult>
        ReserveCar(int carId)
        {
            var result = await carServices.ReserveCar(carId);
            if (result == Const.SUCCESS)
            {
                return Ok();
            }
            return BadRequest(result);
        }
        [HttpGet("cancel/{carId}")]
        public async Task<ActionResult>
        CancelReserveCar(int carId)
        {
            var result = await carServices.CancelReserveCar(carId);
            if (result == Const.SUCCESS)
            {
                return Ok();
            }
            return BadRequest(result);
        }
        [HttpGet("pickup/{carId}")]
        public async Task<ActionResult>
        PickupCar(int carId)
        {
            var result = await carServices.PickupCar(carId);
            if (result == Const.SUCCESS)
            {
                return Ok();
            }
            return BadRequest(result);
        }
        public class ReturnPostData
        {
            public required int carId { get; set; }
            public required double lat { get; set; }
            public required double lng { get; set; }

        }
        [HttpPost("return")]
        public async Task<ActionResult>
        ReturnCar([FromBody] ReturnPostData returnPostData)
        {
            var result = await carServices.ReturnCar(returnPostData.carId, returnPostData.lat, returnPostData.lng);
            if (result == Const.SUCCESS)
            {
                return Ok();
            }
            return BadRequest(result);
        }
        public class UpdatePostData
        {
            public required double lat { get; set; }
            public required double lon { get; set; }
        }
        [HttpGet("update/{lat}/{lon}")]
        public async Task<ActionResult> UpdateCarWhenDriving(double lat, double lon)
        {
            var result = await carServices.UpdateCarWhenDriving(lat, lon);
            if (result == Const.SUCCESS)
            {
                return Ok();
            }
            return BadRequest(result);
        }
        [HttpGet("before")]
        public async Task<ActionResult> GetBeforeStatus()
        {
            var result = await carServices.GetBeforeStatus();
            return Ok(result);
        }
    }
}