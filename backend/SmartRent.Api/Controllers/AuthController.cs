using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartRent.Api.Data;
using SmartRentApi.DTOs;
using SmartRentApi.Models;

namespace SmartRentApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

    [HttpPost("login")]
public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
{
    var username = dto.Username?.Trim().ToLower();
    var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == username);

    if (user == null)
    {
        return Unauthorized(new { message = "The username or password is incorrect." });
    }

    // পাসওয়ার্ড চেক: ডিফল্ট admin123 অথবা ডাটাবেসের BCrypt হ্যাশ
    bool isValid = dto.Password == "admin123" || BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);

    if (!isValid)
    {
        return Unauthorized(new { message = "The username or password is incorrect." });
    }

    // পাসওয়ার্ড যদি admin123 হয়, তবে ডাটাবেসে সঠিক ভ্যালিড হ্যাশটি স্বয়ংক্রিয়ভাবে সেভ করে নেওয়া
    if (dto.Password == "admin123" && !user.PasswordHash.StartsWith("$2"))
    {
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123");
        await _context.SaveChangesAsync();
    }

    var token = GenerateJwtToken(user);

    return Ok(new AuthResponseDto
    {
        Token = token,
        Username = user.Username,
        FullName = user.FullName,
        Role = user.Role
    });
}

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("FullName", user.FullName)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiryDays = int.Parse(_config["Jwt:DurationInDays"] ?? "7");

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(expiryDays),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}