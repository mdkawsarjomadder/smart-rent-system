using System;

namespace SmartRent.Api.DTOs;

public class CreateTenantDto
{
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string NidNumber { get; set; } = string.Empty;
    public decimal SecurityDeposit { get; set; }
    public DateTime MoveInDate { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public int FlatId { get; set; }
}

public class UpdateTenantDto : CreateTenantDto 
{ 
}

public class TenantResponseDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string NidNumber { get; set; } = string.Empty;
    public decimal SecurityDeposit { get; set; }
    public DateTime MoveInDate { get; set; }
    public bool IsActive { get; set; }
    public int FlatId { get; set; }
    public string? FlatNumber { get; set; }
}