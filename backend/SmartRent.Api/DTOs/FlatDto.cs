using SmartRent.Api.Models;

namespace SmartRent.Api.DTOs;

public class CreateFlatDto
{
    public string FlatNumber { get; set; } = string.Empty;
    public int Floor { get; set; }
    public decimal BaseRent { get; set; }
    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public int Status { get; set; } = 0;
}

public class UpdateFlatDto : CreateFlatDto
{
}

public class FlatResponseDto
{
    public int Id { get; set; }
    public string FlatNumber { get; set; } = string.Empty;
    public int Floor { get; set; }
    public decimal BaseRent { get; set; }
    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public FlatStatus Status { get; set; }
    public string? CurrentTenantName { get; set; }
}


