using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SmartRent.Api.Models;

namespace SmartRent.Api.DTOs;
  public record GenerateInvoiceDto(
    int FlatId,
    string BillingMonth,      
    decimal ElectricityBill,
    decimal GasBill,          
    decimal WaterBill,
    DateTime DueDate
  );
  public record PayInvoiceDto(
    DateTime PaidDate
);
 public record InvoiceResponseDto(
    int Id,
    string InvoiceNumber,
    string BillingMonth,
    decimal BaseRent,
    decimal ElectricityBill,
    decimal GasBill,
    decimal WaterBill,
    decimal TotalAmount,
    DateTime DueDate,
    DateTime? PaidDate,
    PaymentStatus Status,
    int FlatId,
    string FlatNumber,
    int TenantId,
    string TenantName
);
