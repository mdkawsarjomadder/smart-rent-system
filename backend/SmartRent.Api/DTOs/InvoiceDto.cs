using System;
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
    bool IsPaid, // এই ফিল্ডটি ফ্রন্টএন্ডের জন্য যুক্ত করা হলো
    int FlatId,
    string FlatNumber,
    int TenantId,
    string TenantName
);

public record BulkGenerateInvoiceDto(
    string BillingMonth,
    decimal DefaultElectricityBill,
    decimal DefaultGasBill,
    decimal DefaultWaterBill,
    DateTime DueDate
);

public record BulkGenerateResultDto(
    int TotalGenerated,
    int TotalSkipped,
    string Message
);