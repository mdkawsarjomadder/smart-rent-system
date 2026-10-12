using Microsoft.EntityFrameworkCore;
using SmartRent.Api.Models;

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

        // টাইপ-সেফ রিলেশনশিপ (Lambda Expressions)
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
    }
}