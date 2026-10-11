using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SmartRent.Api.Models;

namespace SmartRent.Api.Data
{
    public class AppDbContext :DbContext
    {
      public AppDbContext(DbContextOptions<AppDbContext> options): base(options)
        {
            
        }

        public DbSet<Flat> Flats{get; set;}
        public DbSet<Tenant> Tenants{get; set;}
        public DbSet<Invoice> Invoices{get; set;}


        protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Flat>().Property(f => f.BaseRent).HasPrecision(18, 2);
        modelBuilder.Entity<Invoice>().Property(i => i.BaseRent).HasPrecision(18, 2);
        modelBuilder.Entity<Invoice>().Property(i => i.ElectricityBill).HasPrecision(18, 2);
        modelBuilder.Entity<Invoice>().Property(i => i.GasBill).HasPrecision(18, 2);
        modelBuilder.Entity<Invoice>().Property(i => i.WaterBill).HasPrecision(18, 2);

        modelBuilder.Entity<Tenant>()
            .HasOne(typeof(Flat), "Flat")
            .WithOne("CurrentTenant")
            .HasForeignKey("FlatId")
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Invoice>()
            .HasOne(typeof(Flat), "Flat")
            .WithMany("Invoices")
            .HasForeignKey("FlatId")
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Invoice>()
            .HasOne(typeof(Tenant), "Tenant")
            .WithMany("Invoices")
            .HasForeignKey("TenantId")
            .OnDelete(DeleteBehavior.Restrict);
    }
        
    }
}