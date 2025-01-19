using App.Entities;
using Microsoft.EntityFrameworkCore;
namespace App.DB
{
    public class DataBaseContext(DbContextOptions options) : DbContext(options)
    {
        public required DbSet<UserEntity> Users { get; set; }
        public required DbSet<CarEntity> Cars { get; set; }
        public required DbSet<OrderEntity> Orders { get; set; }
        public required DbSet<ReservationsEntity> Reservations { get; set; }
        public required DbSet<DrivingsEntity> Drivings { get; set; }
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            base.OnConfiguring(optionsBuilder);

            // optionsBuilder
            //     .EnableSensitiveDataLogging()
            //     .LogTo(Console.WriteLine, LogLevel.Information);
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            builder.HasPostgresExtension("postgis");
            builder.Entity<ReservationsEntity>()
                .HasKey(r => new { r.UserId, r.CarId });
            builder.Entity<DrivingsEntity>()
                .HasKey(d => new { d.UserId, d.CarId });

        }
        public override int SaveChanges()
        {
            AddTimestamps();
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            AddTimestamps();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void AddTimestamps()
        {
            var changedEntities = ChangeTracker.Entries()
                .Where(e =>
                {
                    bool isInheritedByBase = e.Entity is BaseEntityMixin;
                    bool isModified = e.State == EntityState.Added ||
                    e.State == EntityState.Modified;
                    return isInheritedByBase && isModified;
                });
            foreach (var entity in changedEntities)
            {
                var now = DateTimeOffset.UtcNow; // current datetime
                if (entity.State == EntityState.Added)
                {
                    ((BaseEntityMixin)entity.Entity).CreatedAt = now;
                }
                    ((BaseEntityMixin)entity.Entity).UpdatedAt = now;
            }
        }
    }
}