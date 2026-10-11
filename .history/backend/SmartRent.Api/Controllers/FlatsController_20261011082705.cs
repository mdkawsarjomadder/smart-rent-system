using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartRent.Api.Data;
using SmartRent.Api.DTOs;

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

    // HttpGet: api/flats
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FlatResponseDto>>> GetFlats()
    {
        var flats = await _context.Flats
            .Include(f => f.CurrentTenant)
            .Select(f => new FlatResponseDto())
            .ToListAsync();

        return Ok(flats);
    }
}
