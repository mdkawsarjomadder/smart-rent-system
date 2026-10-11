using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartRent.Api.Data;
using SmartRent.Api.DTOs;
using SmartRent.Api.Models;

namespace SmartRent.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TenantsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TenantsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/tenants
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TenantResponseDto>>> GetTenants()
    {
        var tenants = await _context.Tenants
            .AsNoTracking()
            .Include(t => t.Flat)
            .Select(t => new TenantResponseDto
            {
                Id = t.Id,
                FullName = t.FullName,
                PhoneNumber = t.PhoneNumber,
                NidNumber = t.NidNumber,
                SecurityDeposit = t.SecurityDeposit,
                MoveInDate = t.MoveInDate,
                IsActive = t.IsActive,
                FlatId = t.FlatId,
                FlatNumber = t.Flat != null ? t.Flat.FlatNumber : null
            })
            .ToListAsync();

        return Ok(tenants);
    }

    // GET: api/tenants/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TenantResponseDto>> GetTenant(int id)
    {
        var tenant = await _context.Tenants
            .AsNoTracking()
            .Include(t => t.Flat)
            .Where(t => t.Id == id)
            .Select(t => new TenantResponseDto
            {
                Id = t.Id,
                FullName = t.FullName,
                PhoneNumber = t.PhoneNumber,
                NidNumber = t.NidNumber,
                SecurityDeposit = t.SecurityDeposit,
                MoveInDate = t.MoveInDate,
                IsActive = t.IsActive,
                FlatId = t.FlatId,
                FlatNumber = t.Flat != null ? t.Flat.FlatNumber : null
            })
            .FirstOrDefaultAsync();

        if (tenant == null)
            return NotFound(new { message = $"Tenant with ID {id} not found." });

        return Ok(tenant);
    }

    // POST: api/tenants
    [HttpPost]
    public async Task<ActionResult<TenantResponseDto>> RegisterTenant([FromBody] CreateTenantDto dto)
    {
        var flat = await _context.Flats.FindAsync(dto.FlatId);
        if (flat == null)
        {
            return NotFound(new { message = $"Flat with ID {dto.FlatId} not found." });
        }

        if (flat.Status == FlatStatus.Occupied)
        {
            return BadRequest(new { message = $"Flat with ID {dto.FlatId} is already occupied." });
        }

        var tenant = new Tenant
        {
            FullName = dto.FullName,
            PhoneNumber = dto.PhoneNumber,
            NidNumber = dto.NidNumber,
            SecurityDeposit = dto.SecurityDeposit,
            FlatId = dto.FlatId,
            MoveInDate = dto.MoveInDate == default ? DateTime.UtcNow : dto.MoveInDate,
            IsActive = dto.IsActive
        };

        // Update flat status on tenant assignment
        flat.Status = FlatStatus.Occupied;

        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();

        var responseDto = new TenantResponseDto
        {
            Id = tenant.Id,
            FullName = tenant.FullName,
            PhoneNumber = tenant.PhoneNumber,
            NidNumber = tenant.NidNumber,
            SecurityDeposit = tenant.SecurityDeposit,
            MoveInDate = tenant.MoveInDate,
            IsActive = tenant.IsActive,
            FlatId = flat.Id,
            FlatNumber = flat.FlatNumber
        };

        return CreatedAtAction(nameof(GetTenant), new { id = tenant.Id }, responseDto);
    }

    // PUT: api/tenants/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateTenant(int id, [FromBody] UpdateTenantDto dto)
    {
        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null)
            return NotFound(new { message = $"Tenant with ID {id} not found." });

        // If FlatId changed, handle flat re-assignment and checks
        if (tenant.FlatId != dto.FlatId)
        {
            var newFlat = await _context.Flats.FindAsync(dto.FlatId);
            if (newFlat == null)
                return BadRequest(new { message = $"Flat with ID {dto.FlatId} does not exist." });

            var flatOccupied = await _context.Tenants.AnyAsync(t => t.FlatId == dto.FlatId && t.Id != id);
            if (flatOccupied)
                return Conflict(new { message = $"Flat with ID {dto.FlatId} is already occupied by another tenant." });

            // Free old flat status if exists
            var oldFlat = await _context.Flats.FindAsync(tenant.FlatId);
            if (oldFlat != null)
                oldFlat.Status = FlatStatus.Available;

            newFlat.Status = FlatStatus.Occupied;
            tenant.FlatId = dto.FlatId;
        }

        tenant.FullName = dto.FullName;
        tenant.PhoneNumber = dto.PhoneNumber;
        tenant.NidNumber = dto.NidNumber;
        tenant.SecurityDeposit = dto.SecurityDeposit;
        tenant.MoveInDate = dto.MoveInDate;
        tenant.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/tenants/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteTenant(int id)
    {
        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null)
            return NotFound(new { message = $"Tenant with ID {id} not found." });

        // Update assigned flat status back to available
        var flat = await _context.Flats.FindAsync(tenant.FlatId);
        if (flat != null)
        {
            flat.Status = FlatStatus.Available;
        }

        _context.Tenants.Remove(tenant);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}