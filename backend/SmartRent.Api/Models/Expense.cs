using System.ComponentModel.DataAnnotations;

namespace SmartRent.Api.Models;

public class Expense
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty; // Maintenance, Lift, Guard Salary, Cleaning, Utilities

    [Required]
    [MaxLength(250)]
    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;

    public int? FlatId { get; set; } // নির্দিষ্ট ফ্ল্যাটের খরচ হলে Id থাকবে, সম্পূর্ণ বিল্ডিংয়ের কমন খরচ হলে null
    public Flat? Flat { get; set; }
}