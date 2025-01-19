using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace App.Migrations
{
    /// <inheritdoc />
    public partial class FixCarName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CarEntity_Users_UserId",
                table: "CarEntity");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CarEntity",
                table: "CarEntity");

            migrationBuilder.RenameTable(
                name: "CarEntity",
                newName: "Cars");

            migrationBuilder.RenameColumn(
                name: "location",
                table: "Cars",
                newName: "Location");

            migrationBuilder.RenameIndex(
                name: "IX_CarEntity_UserId",
                table: "Cars",
                newName: "IX_Cars_UserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Cars",
                table: "Cars",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Cars_Users_UserId",
                table: "Cars",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cars_Users_UserId",
                table: "Cars");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Cars",
                table: "Cars");

            migrationBuilder.RenameTable(
                name: "Cars",
                newName: "CarEntity");

            migrationBuilder.RenameColumn(
                name: "Location",
                table: "CarEntity",
                newName: "location");

            migrationBuilder.RenameIndex(
                name: "IX_Cars_UserId",
                table: "CarEntity",
                newName: "IX_CarEntity_UserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CarEntity",
                table: "CarEntity",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CarEntity_Users_UserId",
                table: "CarEntity",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
