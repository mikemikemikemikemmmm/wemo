namespace App.Entities
{
        public abstract class BaseEntityMixin
        {
                public int Id { set; get; }
                public DateTimeOffset CreatedAt { set; get; }
                public DateTimeOffset UpdatedAt { get; set; }

        }
}
