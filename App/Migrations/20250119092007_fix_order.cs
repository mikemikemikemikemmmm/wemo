using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace App.Migrations
{
    /// <inheritdoc />
    public partial class fix_order : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.AddColumn<int>(
                name: "DurationInSeconds",
                table: "Orders",
                type: "int4",
                nullable: false);

            migrationBuilder.DropColumn(
                name: "TotalTime",
                table: "Orders");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DurationInSeconds",
                table: "Orders");
            migrationBuilder.AddColumn<TimeSpan>(
                name: "TotalTime",
                table: "Orders",
                type: "interval",
                nullable: false);
        }
    }
}
