using System;

namespace SmartRent.Api.Models;

public enum PaymentStatus
{
    Unpaid,
    Paid
}

public class TenantInvoice
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string BillingMonth { get; set; } = string.Empty;
    
    public decimal BaseRent { get; set; }
    public decimal ElectricityBill { get; set; }
    public decimal GasBill { get; set; } = 1080;
    public decimal WaterBill { get; set; }
    
    public decimal TotalAmount => BaseRent + ElectricityBill + GasBill + WaterBill;

    public DateTime DueDate { get; set; }
    public DateTime? PaidDate { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Unpaid;

    public int FlatId { get; set; }
    public Flat? Flat { get; set; }

    public int TenantId { get; set; }
    public Tenant? Tenant { get; set; }
}