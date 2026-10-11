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

    // GET: api/flats/{id}/details
    [HttpGet("{id:int}/details")]
    public async Task<IActionResult> GetFlatDetails(int id)
    {
        // ১. ফ্ল্যাটের মূল তথ্য ও বর্তমান ভাড়াটিয়া আনা
        var flat = await _context.Flats
            .Include(f => f.CurrentTenant)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (flat == null)
        {
            return NotFound(new { message = $"Flat with ID {id} not found." });
        }

        // ২. সরাসরি Tenants টেবিল থেকে এই ফ্ল্যাটের সব ভাড়াটিয়া আনা
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

        // ৩. সরাসরি Invoices টেবিল থেকে এই ফ্ল্যাটের সব ইনভয়েস আনা
        var billingHistory = await _context.Invoices
            .Where(i => i.FlatId == id)
            .OrderByDescending(i => i.DueDate)
            .Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                i.BillingMonth,
                i.TotalAmount,
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
        var flat = new Flat
        {
            FlatNumber = dto.FlatNumber,
            Floor = dto.Floor,
            BaseRent = dto.BaseRent,
            Bedrooms = dto.Bedrooms,
            Bathrooms = dto.Bathrooms,
            Status = FlatStatus.Available // Available ব্যবহার করা হয়েছে
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

    // POST: api/flats/{id}/vacate
    [HttpPost("{id:int}/vacate")]
    public async Task<IActionResult> VacateFlat(int id)
    {
        var flat = await _context.Flats.FindAsync(id);
        if (flat == null)
        {
            return NotFound(new { message = $"Flat with ID {id} not found." });
        }

        // এই ফ্ল্যাটের বর্তমান একটিভ ভাড়াটিয়াকে খুঁজে বের করা
        var activeTenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.FlatId == id && t.IsActive);

        if (activeTenant != null)
        {
            activeTenant.IsActive = false; // ভাড়াটিয়া নিষ্ক্রিয় করা হলো
        }

        // ফ্ল্যাট স্ট্যাটাস Available করা হলো
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