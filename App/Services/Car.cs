using App.DB;
using App.Entities;
using App.Helpers;
using App.Migrations;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace App.Services
{
    public class CarServices(DataBaseContext context, IMapper mapper, AuthServices authService)
    {
        public async Task<List<CarEntity>> GetAroundCarsByPolygon(Polygon polygon)
        {
            return await context.Cars
                .Where(car =>
                    car.CarStatus == CarStatus.CanBeReserved &&
                    polygon.Contains(car.Location)
                    )
                .ToListAsync();
        }
        public async Task<CarEntity?> GetCar(int carId, CarStatus? carStatus)
        {
            if (carStatus == null)
            {
                return await context.Cars.FirstOrDefaultAsync(c => c.Id == carId);
            }
            return await context.Cars
            .FirstOrDefaultAsync(c => c.Id == carId && c.CarStatus == carStatus);
        }
        public async Task<string> ReserveCar(int carId)
        {
            var user = await authService.GetUserByJwt();
            using (var transaction = await context.Database.BeginTransactionAsync())  // 開始事務
            {
                try
                {
                    await context.Database.ExecuteSqlRawAsync(@"
                            SELECT ""Id""
                            FROM ""Cars"" 
                            WHERE ""Id""  = {0} AND ""CarStatus"" = {1}
                            FOR UPDATE
                        ", carId, CarStatus.CanBeReserved);
                    var targetCar = await GetCar(carId, CarStatus.CanBeReserved);
                    if (targetCar == null)
                    {
                        throw new Exception("無法找到該車");
                    }
                    var hasReserved = await context.Reservations.FirstOrDefaultAsync(r => r.User == user || r.Car == targetCar);
                    var hasDriving = await context.Drivings.FirstOrDefaultAsync(d => d.User == user || d.Car == targetCar);
                    if (hasDriving != null || hasReserved != null)
                    {
                        throw new Exception("該車或使用者已經騎乘或預約中");
                    }
                    targetCar.CarStatus = CarStatus.Reserved;

                    var newReservation = new ReservationsEntity
                    {
                        UserId = user.Id,
                        User = user,
                        CarId = targetCar.Id,
                        Car = targetCar,
                        ExpiredAt = DateTime.UtcNow.AddMinutes(10) // 當前時間加10分鐘
                    };

                    await context.AddAsync(newReservation);  // 添加預約
                    await context.SaveChangesAsync();  // 保存變更
                    await transaction.CommitAsync();  // 提交事務
                    return Const.SUCCESS;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return ex.Message;
                }
            }
        }
        public async Task<string> CancelReserveCar(int carId)
        {
            var user = await authService.GetUserByJwt();
            using (var transaction = await context.Database.BeginTransactionAsync())  // 開始事務
            {
                try
                {
                    var targetReserve = await context.Reservations
                    .FirstOrDefaultAsync(r => r.UserId == user.Id && r.CarId == carId);
                    if (targetReserve == null)
                    {
                        throw new Exception("找不到預約");
                    }
                    var targetCar = await GetCar(targetReserve.CarId, CarStatus.Reserved);
                    if (targetCar == null)
                    {
                        throw new Exception("找不到預約");
                    }
                    targetCar.CarStatus = CarStatus.CanBeReserved;
                    context.Remove(targetReserve);
                    await context.SaveChangesAsync();  // 保存變更
                    await transaction.CommitAsync();  // 提交事務
                    return Const.SUCCESS;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();  // 如果發生錯誤，回滾事務
                    return ex.Message;
                }
            }
        }
        public async Task<string> PickupCar(int carId)
        {
            var user = await authService.GetUserByJwt();
            using (var transaction = await context.Database.BeginTransactionAsync())  // 開始事務
            {
                try
                {
                    var targetReserve = await context.Reservations
                    .FirstOrDefaultAsync(r => r.UserId == user.Id && r.CarId == carId);
                    if (targetReserve == null)
                    {
                        throw new Exception("找不到預約");
                    }
                    var targetCar = await GetCar(targetReserve.CarId, CarStatus.Reserved);
                    if (targetCar == null)
                    {
                        throw new Exception("找不到該車");
                    }
                    context.Reservations.Remove(targetReserve);
                    var hasExpired = targetReserve.ExpiredAt < DateTimeOffset.UtcNow;
                    if (hasExpired)
                    {
                        targetCar.CarStatus = CarStatus.CanBeReserved;
                        await context.SaveChangesAsync();
                        await transaction.CommitAsync();
                        throw new Exception("預約已過期");
                    }
                    targetCar.CarStatus = CarStatus.Driving;
                    var newDriving = new DrivingsEntity
                    {
                        UserId = user.Id,
                        User = user,
                        CarId = targetCar.Id,
                        Car = targetCar,
                        CurrentSumMeters = 0
                    };
                    await context.AddAsync(newDriving);
                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return Const.SUCCESS;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();  // 如果發生錯誤，回滾事務
                    return ex.Message;
                }
            }
        }
        public async Task<string> ReturnCar(int carId, double lat, double lon)
        {
            var user = await authService.GetUserByJwt();
            using (var transaction = await context.Database.BeginTransactionAsync())  // 開始事務
            {
                try
                {
                    var targetDriving = await context.Drivings
                    .FirstOrDefaultAsync(d => d.UserId == user.Id && d.CarId == carId);
                    if (targetDriving == null)
                    {
                        throw new Exception("找不到騎乘資料");
                    }
                    var targetCar = await GetCar(targetDriving.CarId, CarStatus.Driving);
                    if (targetCar == null)
                    {
                        throw new Exception("找不到騎乘資料");
                    }
                    targetCar.CarStatus = CarStatus.CanBeReserved;
                    targetCar.Location.Y = lat;
                    targetCar.Location.X = lon;
                    context.Drivings.Remove(targetDriving);
                    var totalDurationInSeconds =
                     (int)(DateTimeOffset.UtcNow - targetDriving.CreatedAt).TotalSeconds;
                    var newOrder = new OrderEntity
                    {
                        UserId = targetDriving.UserId,
                        User = targetDriving.User,
                        CarId = targetCar.Id,
                        Car = targetCar,
                        TotalCost = 0, //TODO
                        DurationInSeconds = totalDurationInSeconds,//TODO
                        TotalDistanceMeter = targetDriving.CurrentSumMeters//TODO

                    };
                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return Const.SUCCESS;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();  // 如果發生錯誤，回滾事務
                    return ex.Message;
                }
            }
        }
        public async Task<string> UpdateCarWhenDriving(double lat, double lon)
        {
            var user = await authService.GetUserByJwt();
            using (var transaction = await context.Database.BeginTransactionAsync())  // 開始事務
            {
                try
                {
                    await context.Database.ExecuteSqlRawAsync(@"
                            SELECT ""UserId""
                            FROM ""Drivings"" 
                            WHERE ""UserId""  = {0} 
                            FOR UPDATE
                        ", user.Id);
                    var targetDriving = await context.Drivings
                    .FirstOrDefaultAsync(d => d.UserId == user.Id);

                    if (targetDriving == null)
                    {
                        throw new Exception("找不到騎乘資料");
                    }
                    var targetCar = await GetCar(targetDriving.CarId, CarStatus.Driving);
                    if (targetCar == null)
                    {
                        throw new Exception("找不到騎乘資料");
                    }
                    var lastPoint = targetCar.Location;
                    var point = GeoHelpers.CreatePoint(lon, lat);
                    var distance = (float)point.Distance(lastPoint);
                    var distanceInMeters = (int)(distance * 10000);
                    targetCar.Location.Y = lat;
                    targetCar.Location.X = lon;
                    targetDriving.CurrentSumMeters += distanceInMeters;
                    Console.WriteLine("-----------distance------------");
                    Console.WriteLine(distance);
                    Console.WriteLine(distanceInMeters);
                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return Const.SUCCESS;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return ex.Message;
                }
            }

        }
        public class GetBeforeStatusResult
        {
            public required string userStatus { get; set; }
            public CarReadDto? targetCar { get; set; }
        }
        public async Task<GetBeforeStatusResult> GetBeforeStatus()
        {
            var user = await authService.GetUserByJwt();
            var hasReserved = await context.Reservations.Where(r => r.UserId == user.Id).FirstOrDefaultAsync();
            if (hasReserved != null)
            {
                var reservedCar = await GetCar(hasReserved.CarId, null);
                var hasExpired = hasReserved.ExpiredAt < DateTimeOffset.UtcNow;
                if (hasExpired)
                {
                    if (reservedCar != null)
                    {
                        reservedCar.CarStatus = CarStatus.CanBeReserved;
                    }
                    context.Reservations.Remove(hasReserved);
                    await context.SaveChangesAsync();
                    return new GetBeforeStatusResult
                    {
                        userStatus = "noLooking",
                        targetCar = null,
                    };
                }
                else
                {
                    return new GetBeforeStatusResult
                    {
                        userStatus = "reservedCar",
                        targetCar = mapper.Map<CarReadDto>(reservedCar),
                    };

                }
            }
            var hasDriving = await context.Drivings.Where(d => d.UserId == user.Id).FirstOrDefaultAsync();
            if (hasDriving == null)
            {
                return new GetBeforeStatusResult
                {
                    userStatus = "noLooking",
                    targetCar = null,
                };
            }
            var drivingCar = await GetCar(hasDriving.CarId, null);
            if (drivingCar == null)
            {
                throw new Exception("無法找到該車");
            }
            return new GetBeforeStatusResult
            {
                userStatus = "driving",
                targetCar = mapper.Map<CarReadDto>(drivingCar),
            };
        }
    }
}