using System.Collections.Generic;

namespace SmartRent.Api.Models;

public enum FlatStatus
{
    Vacant,
    Occupied
}

public class Flat
{
    public int Id { get; set; }
    public string FlatNumber { get; set; } = string.Empty;
    public int Floor { get; set; }
    public decimal BaseRent { get; set; }
    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public FlatStatus Status { get; set; } = FlatStatus.Vacant;

    public Tenant? CurrentTenant { get; set; }
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}