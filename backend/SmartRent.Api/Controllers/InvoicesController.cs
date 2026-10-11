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

    // 1. Get all invoices
    [HttpGet]
    public async Task<ActionResult<IEnumerable<InvoiceResponseDto>>> GetInvoices()
    {
        var invoices = await _context.Invoices
            .Include(i => i.Flat)
            .Include(i => i.Tenant)
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
                i.IsPaid || i.Status == PaymentStatus.Paid,
                i.FlatId,
                i.Flat != null ? i.Flat.FlatNumber : string.Empty,
                i.TenantId,
                i.Tenant != null ? i.Tenant.FullName : string.Empty
            ))
            .ToListAsync();

        return Ok(invoices);
    }

    // 2. Get Details of a specific invoice
    [HttpGet("{id:int}")]
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

        var isPaid = invoice.IsPaid || invoice.Status == PaymentStatus.Paid;

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
            isPaid,
            invoice.FlatId,
            invoice.Flat != null ? invoice.Flat.FlatNumber : string.Empty,
            invoice.TenantId,
            invoice.Tenant != null ? invoice.Tenant.FullName : string.Empty
        );

        return Ok(response);
    }

    // 3. Generate a new invoice
    [HttpPost("generate")]
    public async Task<ActionResult<InvoiceResponseDto>> GenerateInvoice([FromBody] GenerateInvoiceDto dto)
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

        var existingInvoice = await _context.Invoices
            .AnyAsync(i => i.FlatId == dto.FlatId && i.BillingMonth.ToLower() == dto.BillingMonth.ToLower());

        if (existingInvoice)
        {
            return BadRequest(new { message = $"{dto.BillingMonth} month's invoice for this flat already exists." });
        }

        var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMM}-{flat.FlatNumber}-{Guid.NewGuid().ToString()[..4].ToUpper()}";

        var invoice = new Invoice
        {
            InvoiceNumber = invoiceNumber,
            BillingMonth = dto.BillingMonth,
            BaseRent = flat.BaseRent,
            ElectricityBill = dto.ElectricityBill,
            GasBill = dto.GasBill,
            WaterBill = dto.WaterBill,
            DueDate = dto.DueDate,
            Status = PaymentStatus.Unpaid,
            IsPaid = false,
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
            false,
            flat.Id,
            flat.FlatNumber,
            flat.CurrentTenant.Id,
            flat.CurrentTenant.FullName
        );

        return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, response);
    }

    // POST: api/invoices/generate-bulk
[HttpPost("generate-bulk")]
public async Task<ActionResult<BulkGenerateResultDto>> GenerateBulkInvoices([FromBody] BulkGenerateInvoiceDto dto)
{
    // ১. শুধুমাত্র যেসব ফ্ল্যাটে বর্তমান সক্রিয় ভাড়াটিয়া রয়েছে তাদের আনা
    var occupiedFlats = await _context.Flats
        .Include(f => f.CurrentTenant)
        .Where(f => f.Status == FlatStatus.Occupied && f.CurrentTenant != null)
        .ToListAsync();

    if (!occupiedFlats.Any())
    {
        return BadRequest(new { message = "No occupied flats with active tenants found." });
    }

    int generatedCount = 0;
    int skippedCount = 0;

    foreach (var flat in occupiedFlats)
    {
        // ২. এই মাসের বিল ইতোমধ্যে আছে কিনা যাচাই করা
        bool alreadyExists = await _context.Invoices.AnyAsync(i =>
            i.FlatId == flat.Id &&
            i.BillingMonth.ToLower() == dto.BillingMonth.ToLower());

        if (alreadyExists)
        {
            skippedCount++;
            continue;
        }

        var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMM}-{flat.FlatNumber}-{Guid.NewGuid().ToString()[..4].ToUpper()}";

        var invoice = new Invoice
        {
            InvoiceNumber = invoiceNumber,
            BillingMonth = dto.BillingMonth,
            BaseRent = flat.BaseRent,
            ElectricityBill = dto.DefaultElectricityBill,
            GasBill = dto.DefaultGasBill,
            WaterBill = dto.DefaultWaterBill,
            DueDate = dto.DueDate,
            Status = PaymentStatus.Unpaid,
            IsPaid = false,
            FlatId = flat.Id,
            TenantId = flat.CurrentTenant!.Id
        };

        _context.Invoices.Add(invoice);
        generatedCount++;
    }

    if (generatedCount > 0)
    {
        await _context.SaveChangesAsync();
    }

    return Ok(new BulkGenerateResultDto(
        generatedCount,
        skippedCount,
        $"Successfully generated {generatedCount} invoices. Skipped {skippedCount} (already existed)."
    ));
}

    // 4. Mark as Paid (PATCH & PUT compatible)
    [HttpPatch("{id:int}/pay")]
    [HttpPut("{id:int}/pay")]
    public async Task<ActionResult<InvoiceResponseDto>> PayInvoice(int id, [FromBody] PayInvoiceDto? dto)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Flat)
            .Include(i => i.Tenant)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null)
        {
            return NotFound(new { message = $"Invoice with ID {id} not found." });
        }

        if (invoice.IsPaid || invoice.Status == PaymentStatus.Paid)
        {
            return BadRequest(new { message = "This invoice has already been paid." });
        }

        invoice.IsPaid = true;
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
            true,
            invoice.FlatId,
            invoice.Flat != null ? invoice.Flat.FlatNumber : string.Empty,
            invoice.TenantId,
            invoice.Tenant != null ? invoice.Tenant.FullName : string.Empty
        );

        return Ok(response);
    }
}