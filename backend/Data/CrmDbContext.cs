using AcxiomCRM.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
namespace AcxiomCRM.Api.Data;
public class CrmDbContext(DbContextOptions<CrmDbContext> options) : IdentityDbContext<AppUser>(options) {
 public DbSet<Customer> Customers => Set<Customer>(); public DbSet<Lead> Leads => Set<Lead>();
 public DbSet<Opportunity> Opportunities => Set<Opportunity>(); public DbSet<FollowUp> FollowUps => Set<FollowUp>();
 public DbSet<Activity> Activities => Set<Activity>(); public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
 protected override void OnModelCreating(ModelBuilder b) {
  base.OnModelCreating(b); b.Entity<CrmRecord>().UseTpcMappingStrategy();
  b.Entity<CrmRecord>().Property(x=>x.Amount).HasPrecision(18,2); b.Entity<CrmRecord>().Property(x=>x.ExpectedValue).HasPrecision(18,2);
  b.Entity<CrmRecord>().HasIndex(x=>new{x.OwnerId,x.Status}); b.Entity<CrmRecord>().HasIndex(x=>new{x.TeamId,x.Status});
  b.Entity<CrmRecord>().HasIndex(x=>x.Code).IsUnique();
  b.Entity<Customer>().HasIndex(x=>x.Email).IsUnique(); b.Entity<Customer>().HasIndex(x=>x.Phone).IsUnique();
  b.Entity<Opportunity>().HasOne<Customer>().WithMany().HasForeignKey(x=>x.CustomerId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<Opportunity>().HasOne<Lead>().WithMany().HasForeignKey(x=>x.LeadId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<FollowUp>().HasOne<Customer>().WithMany().HasForeignKey(x=>x.CustomerId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<FollowUp>().HasOne<Lead>().WithMany().HasForeignKey(x=>x.LeadId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<FollowUp>().HasOne<Opportunity>().WithMany().HasForeignKey(x=>x.OpportunityId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<Activity>().HasOne<Customer>().WithMany().HasForeignKey(x=>x.CustomerId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<Activity>().HasOne<Lead>().WithMany().HasForeignKey(x=>x.LeadId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<Activity>().HasOne<Opportunity>().WithMany().HasForeignKey(x=>x.OpportunityId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<Lead>().HasOne<Customer>().WithMany().HasForeignKey(x=>x.ConvertedCustomerId).OnDelete(DeleteBehavior.Restrict);
 }
}
