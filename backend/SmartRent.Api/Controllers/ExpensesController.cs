using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartRent.Api.Data;
using SmartRent.Api.Models;

namespace SmartRent.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ExpensesController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/expenses
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var expenses = await _context.Expenses
            .Include(e => e.Flat)
            .OrderByDescending(e => e.ExpenseDate)
            .Select(e => new
            {
                e.Id,
                e.Category,
                e.Description,
                e.Amount,
                e.ExpenseDate,
                e.FlatId,
                FlatNumber = e.Flat != null ? e.Flat.FlatNumber : "Building Common"
            })
            .ToListAsync();

        return Ok(expenses);
    }

    // POST: api/expenses
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExpenseDto dto)
    {
        var expense = new Expense
        {
            Category = dto.Category,
            Description = dto.Description,
            Amount = dto.Amount,
            ExpenseDate = dto.ExpenseDate ?? DateTime.UtcNow,
            FlatId = dto.FlatId
        };

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();

        return Ok(expense);
    }
}

public record CreateExpenseDto(
    string Category,
    string Description,
    decimal Amount,
    DateTime? ExpenseDate,
    int? FlatId
);