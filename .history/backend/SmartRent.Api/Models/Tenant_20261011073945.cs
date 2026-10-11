using System;
using System.Collections.Generic;

namespace SmartRent.Api.Models;

public class Tenant
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string NidNumber { get; set; } = string.Empty;
    public decimal SecurityDeposit { get; set; }
    public DateTime MoveInDate { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // Foreign Key ও Flat-এর সাথে রিলেশনশিপ
    public int FlatId { get; set; }
    public Flat? Flat { get; set; }

    // Invoices নেভিগেশন প্রপার্টি
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}