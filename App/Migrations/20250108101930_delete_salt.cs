using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace App.Migrations
{
    /// <inheritdoc />
    public partial class delete_salt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordSalt",
                table: "Users");

            // migrationBuilder.DropColumn(
            //     name: "UserStatus",
            //     table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PasswordSalt",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            // migrationBuilder.AddColumn<int>(
            //     name: "UserStatus",
            //     table: "Users",
            //     type: "integer",
            //     nullable: false,
            //     defaultValue: 0);
        }
    }
}
