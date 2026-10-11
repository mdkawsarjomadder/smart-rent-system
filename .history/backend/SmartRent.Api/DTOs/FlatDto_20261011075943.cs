using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SmartRent.Api.Models;

namespace SmartRent.Api.DTOs;
public record CreateFlatDto
(
    string FlatNumber,
    int Floor,
    int BaseRent,
    int Bedrooms,
    int Bathrooms
);
public record FlatResponseDto(
    int Id,
    string FlatNumber,
    int Floor,
    decimal BaseRent,
    int Bedrooms,
    int Bathrooms,
    FlatStatus Status,
    string? CurrentTenantName
);
