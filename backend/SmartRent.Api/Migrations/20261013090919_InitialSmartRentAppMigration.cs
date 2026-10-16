using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartRent.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialSmartRentAppMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$NptSE.CWQtreNwNDVu/ImezrJsoFvmjmzUPjxIx4urrL7yNVkmDta");
        }
    }
}
