using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartRent.Api.Data;
using SmartRent.Api.DTOs;
using SmartRent.Api.Models;

namespace SmartRent.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly AppDbContext _context;

    public InvoicesController(AppDbContext context)
    {
        _context = context;
    }

   
    // Get: api/invoices?status=paid
    [HttpGet]
    public async Task<ActionResult<IEnumerable<InvoiceResponseDto>>> GetInvoices([FromQuery] PaymentStatus? status)
    {
        var query = _context.Invoices
            .Include(i => i.Flat)
            .Include(i => i.Tenant)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(i => i.Status == status.Value);
        }

        var invoices = await query
            .OrderByDescending(i => i.Id)
            .Select(i => new InvoiceResponseDto(
                i.Id,
                i.InvoiceNumber,
                i.BillingMonth,
                i.BaseRent,
                i.ElectricityBill,
                i.GasBill,
                i.WaterBill,
                i.TotalAmount,
                i.DueDate,
                i.PaidDate,
                i.Status,
                i.FlatId,
                i.Flat != null ? i.Flat.FlatNumber : string.Empty,
                i.TenantId,
                i.Tenant != null ? i.Tenant.FullName : string.Empty
            ))
            .ToListAsync();

        return Ok(invoices);
    }

   
    //2. Get Details of a specific invoice
    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceResponseDto>> GetInvoice(int id)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Flat)
            .Include(i => i.Tenant)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null)
        {
            return NotFound(new { message = "Invoice not found." });
        }

        var response = new InvoiceResponseDto(
            invoice.Id,
            invoice.InvoiceNumber,
            invoice.BillingMonth,
            invoice.BaseRent,
            invoice.ElectricityBill,
            invoice.GasBill,
            invoice.WaterBill,
            invoice.TotalAmount,
            invoice.DueDate,
            invoice.PaidDate,
            invoice.Status,
            invoice.FlatId,
            invoice.Flat != null ? invoice.Flat.FlatNumber : string.Empty,
            invoice.TenantId,
            invoice.Tenant != null ? invoice.Tenant.FullName : string.Empty
        );

        return Ok(response);
    }

    
    //3. Generate a new invoice for a specific flat and its active tenant.
    [HttpPost("generate")]
    public async Task<ActionResult<InvoiceResponseDto>> GenerateInvoice(GenerateInvoiceDto dto)
    {
        var flat = await _context.Flats
            .Include(f => f.CurrentTenant)
            .FirstOrDefaultAsync(f => f.Id == dto.FlatId);

        if (flat == null)
        {
            return NotFound(new { message = "Flat not found." });
        }

        if (flat.Status != FlatStatus.Occupied || flat.CurrentTenant == null)
        {
            return BadRequest(new { message = "There is no active tenant in this flat. Invoices can only be generated for occupied flats with active tenants." });
        }

        // check if an invoice for the same billing month already exists for this flat
        var existingInvoice = await _context.Invoices
            .AnyAsync(i => i.FlatId == dto.FlatId && i.BillingMonth.ToLower() == dto.BillingMonth.ToLower());

        if (existingInvoice)
        {
            return BadRequest(new { message = $"{dto.BillingMonth} month's invoice for this flat already exists." });
        }

     
        // unique invoice number format INV-202610-101
        var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMM}-{flat.FlatNumber}-{Guid.NewGuid().ToString()[..4].ToUpper()}";

        var invoice = new Invoice
        {
            InvoiceNumber = invoiceNumber,
            BillingMonth = dto.BillingMonth,
            BaseRent = flat.BaseRent, // ফ্ল্যাটের নির্ধারিত বেস রেন্ট সরাসরি বসবে
            ElectricityBill = dto.ElectricityBill,
            GasBill = dto.GasBill,
            WaterBill = dto.WaterBill,
            DueDate = dto.DueDate,
            Status = PaymentStatus.Unpaid,
            FlatId = flat.Id,
            TenantId = flat.CurrentTenant.Id
        };

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        var response = new InvoiceResponseDto(
            invoice.Id,
            invoice.InvoiceNumber,
            invoice.BillingMonth,
            invoice.BaseRent,
            invoice.ElectricityBill,
            invoice.GasBill,
            invoice.WaterBill,
            invoice.TotalAmount,
            invoice.DueDate,
            invoice.PaidDate,
            invoice.Status,
            flat.Id,
            flat.FlatNumber,
            flat.CurrentTenant.Id,
            flat.CurrentTenant.FullName
        );

        return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, response);
    }

    // ৪.  (Mark as Paid)
    [HttpPatch("{id}/pay")]
    public async Task<ActionResult<InvoiceResponseDto>> PayInvoice(int id, [FromBody] PayInvoiceDto? dto)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Flat)
            .Include(i => i.Tenant)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null)
        {
            return NotFound(new { message = "Invoice not found." });
        }

        if (invoice.Status == PaymentStatus.Paid)
        {
            return BadRequest(new { message = "This invoice has already been paid." });
        }

        invoice.Status = PaymentStatus.Paid;
        invoice.PaidDate = dto?.PaidDate ?? DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var response = new InvoiceResponseDto(
            invoice.Id,
            invoice.InvoiceNumber,
            invoice.BillingMonth,
            invoice.BaseRent,
            invoice.ElectricityBill,
            invoice.GasBill,
            invoice.WaterBill,
            invoice.TotalAmount,
            invoice.DueDate,
            invoice.PaidDate,
            invoice.Status,
            invoice.FlatId,
            invoice.Flat != null ? invoice.Flat.FlatNumber : string.Empty,
            invoice.TenantId,
            invoice.Tenant != null ? invoice.Tenant.FullName : string.Empty
        );

        return Ok(response);
    }
}