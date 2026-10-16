using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using SmartRent.Api.Models;
using SmartRentApi.Models;

namespace SmartRent.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Flat> Flats => Set<Flat>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<User> Users => Set<User>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        // .NET 9 এ মাইগ্রেশন ওয়ার্নিংকে এক্সেপশনে রূপান্তর হওয়া বন্ধ করে
        optionsBuilder.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Precision কনফিগারেশন
        modelBuilder.Entity<Flat>()
            .Property(f => f.BaseRent)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Tenant>()
            .Property(t => t.SecurityDeposit)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Invoice>()
            .Property(i => i.BaseRent).HasPrecision(18, 2);
        modelBuilder.Entity<Invoice>()
            .Property(i => i.ElectricityBill).HasPrecision(18, 2);
        modelBuilder.Entity<Invoice>()
            .Property(i => i.GasBill).HasPrecision(18, 2);
        modelBuilder.Entity<Invoice>()
            .Property(i => i.WaterBill).HasPrecision(18, 2);

        // রিলেশনশিপ ও ক্যাসকেড ডিলিট রেস্ট্রিকশন
        modelBuilder.Entity<Tenant>()
            .HasOne(t => t.Flat)
            .WithOne(f => f.CurrentTenant)
            .HasForeignKey<Tenant>(t => t.FlatId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.Flat)
            .WithMany(f => f.Invoices)
            .HasForeignKey(i => i.FlatId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.Tenant)
            .WithMany(t => t.Invoices)
            .HasForeignKey(i => i.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

      // "admin123" পাসওয়ার্ডের জন্য সঠিক BCrypt হ্যাশ
        const string fixedAdminHash = "$2a$11$uK8zFhQYwYFf4X.p0M1.jeK7j1wOslwN8R.L3tL8yA5eK1xWwGfCe";

        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Username = "admin",
            PasswordHash = fixedAdminHash,
            FullName = "System Administrator",
            Role = "Admin",
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}