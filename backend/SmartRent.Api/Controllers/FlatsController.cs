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
    private readonly AppDbContext _context; // AppDbContext থেকে ApplicationDbContext-এ পরিবর্তন করা হলো

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
    [HttpGet("{id:int}", Name = "GetFlat")]
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

    // GET: api/flats/{id}/details
    [HttpGet("{id:int}/details")]
    public async Task<IActionResult> GetFlatDetails(int id)
    {
        var flat = await _context.Flats
            .Include(f => f.CurrentTenant)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (flat == null)
        {
            return NotFound(new { message = $"Flat with ID {id} not found." });
        }

        var tenantHistory = await _context.Tenants
            .Where(t => t.FlatId == id)
            .OrderByDescending(t => t.MoveInDate)
            .Select(t => new
            {
                t.Id,
                t.FullName,
                t.PhoneNumber,
                t.MoveInDate,
                t.IsActive
            })
            .ToListAsync();

        var billingHistory = await _context.Invoices
            .Where(i => i.FlatId == id)
            .OrderByDescending(i => i.DueDate)
            .Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                i.BillingMonth,
                i.BaseRent, // TotalAmount মডেল অনুযায়ী ঠিক রাখুন
                i.DueDate,
                i.PaidDate,
                IsPaid = i.IsPaid || i.Status == PaymentStatus.Paid
            })
            .ToListAsync();

        var result = new
        {
            flat.Id,
            flat.FlatNumber,
            flat.Floor,
            flat.BaseRent,
            Status = flat.Status.ToString(),
            CurrentTenant = flat.CurrentTenant == null ? null : new
            {
                flat.CurrentTenant.Id,
                flat.CurrentTenant.FullName,
                flat.CurrentTenant.PhoneNumber,
                flat.CurrentTenant.NidNumber,
                flat.CurrentTenant.MoveInDate,
                flat.CurrentTenant.SecurityDeposit
            },
            TenantHistory = tenantHistory,
            BillingHistory = billingHistory
        };

        return Ok(result);
    }

    // POST: api/flats
    [HttpPost]
    public async Task<ActionResult<FlatResponseDto>> CreateFlat([FromBody] CreateFlatDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

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

        return StatusCode(201, responseDto); // নিরাপদ 201 Created রেসপন্স
    }

    // POST: api/flats/{id}/vacate
    [HttpPost("{id:int}/vacate")]
    public async Task<IActionResult> VacateFlat(int id)
    {
        var flat = await _context.Flats.FindAsync(id);
        if (flat == null)
        {
            return NotFound(new { message = $"Flat with ID {id} not found." });
        }

        var activeTenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.FlatId == id && t.IsActive);

        if (activeTenant != null)
        {
            activeTenant.IsActive = false;
        }

        flat.Status = FlatStatus.Available;

        await _context.SaveChangesAsync();
        return Ok(new { message = $"Flat {flat.FlatNumber} has been vacated successfully." });
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
        return Ok(flat);
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