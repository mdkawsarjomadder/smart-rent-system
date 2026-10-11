using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartRent.Api.Data;
using SmartRent.Api.DTOs;
using SmartRent.Api.Models;

namespace SmartRent.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FlatsController : ControllerBase
{
    private readonly AppDbContext _context;

    public FlatsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/flats
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FlatResponseDto>>> GetFlats()
    {
        var flats = await _context.Flats
            .Include(f => f.CurrentTenant)
            .Select(f => new FlatResponseDto
            {
                Id = f.Id,
                FlatNumber = f.FlatNumber,
                Floor = f.Floor,
                BaseRent = f.BaseRent,
                Bedrooms = f.Bedrooms,
                Bathrooms = f.Bathrooms,
                Status = f.Status,
                CurrentTenantName = f.CurrentTenant != null ? f.CurrentTenant.FullName : null
            })
            .ToListAsync();

        return Ok(flats);
    }

    // GET: api/flats/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<FlatResponseDto>> GetFlat(int id)
    {
        var flat = await _context.Flats
            .Include(f => f.CurrentTenant)
            .Where(f => f.Id == id)
            .Select(f => new FlatResponseDto
            {
                Id = f.Id,
                FlatNumber = f.FlatNumber,
                Floor = f.Floor,
                BaseRent = f.BaseRent,
                Bedrooms = f.Bedrooms,
                Bathrooms = f.Bathrooms,
                Status = f.Status,
                CurrentTenantName = f.CurrentTenant != null ? f.CurrentTenant.FullName : null
            })
            .FirstOrDefaultAsync();

        if (flat == null)
        {
            return NotFound(new { message = $"Flat with ID {id} not found." });
        }

        return Ok(flat);
    }

    // POST: api/flats
    [HttpPost]
    public async Task<ActionResult<FlatResponseDto>> CreateFlat([FromBody] CreateFlatDto dto)
    {
        var flat = new Flat
        {
            FlatNumber = dto.FlatNumber,
            Floor = dto.Floor,
            BaseRent = dto.BaseRent,
            Bedrooms = dto.Bedrooms,
            Bathrooms = dto.Bathrooms,
            Status = FlatStatus.Available
        };

        _context.Flats.Add(flat);
        await _context.SaveChangesAsync();

        var responseDto = new FlatResponseDto
        {
            Id = flat.Id,
            FlatNumber = flat.FlatNumber,
            Floor = flat.Floor,
            BaseRent = flat.BaseRent,
            Bedrooms = flat.Bedrooms,
            Bathrooms = flat.Bathrooms,
            Status = flat.Status,
            CurrentTenantName = null
        };

        return CreatedAtAction(nameof(GetFlat), new { id = flat.Id }, responseDto);
    }

    // PUT: api/flats/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateFlat(int id, [FromBody] UpdateFlatDto dto)
    {
        var flat = await _context.Flats.FindAsync(id);
        if (flat == null)
        {
            return NotFound(new { message = $"Flat with ID {id} not found." });
        }

        flat.FlatNumber = dto.FlatNumber;
        flat.Floor = dto.Floor;
        flat.BaseRent = dto.BaseRent;
        flat.Bedrooms = dto.Bedrooms;
        flat.Bathrooms = dto.Bathrooms;
        flat.Status = (FlatStatus)dto.Status;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/flats/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteFlat(int id)
    {
        var flat = await _context.Flats.FindAsync(id);
        if (flat == null)
        {
            return NotFound(new { message = $"Flat with ID {id} not found." });
        }

        _context.Flats.Remove(flat);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}