using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
namespace AcxiomCRM.Api.Models;
public class AppUser : IdentityUser { public string Name { get; set; } = ""; public string? TeamId { get; set; } public bool IsActive { get; set; } = true; }
public abstract class CrmRecord {
 public Guid Id { get; set; } = Guid.NewGuid();
 [MaxLength(120)] public string Name { get; set; } = "";
 public string Code { get; set; } = "";
 public string? Email { get; set; } public string? Phone { get; set; }
 public string? CompanyName { get; set; } public string? Address { get; set; } public string? City { get; set; } public string? State { get; set; }
 public string Status { get; set; } = ""; public string? Source { get; set; } public string Priority { get; set; } = "Medium";
 public decimal Amount { get; set; } public decimal ExpectedValue { get; set; } public int Probability { get; set; }
 public string Stage { get; set; } = "Qualification"; public DateTime? ExpectedCloseDate { get; set; } public DateTime? ClosedAt { get; set; }
 public DateTime? FollowUpDate { get; set; } public DateTime? ActivityDate { get; set; } public string Type { get; set; } = "Call";
 public string? Notes { get; set; } public Guid? CustomerId { get; set; } public Guid? LeadId { get; set; } public Guid? OpportunityId { get; set; }
 public string OwnerId { get; set; } = ""; public string? TeamId { get; set; } public string CreatedBy { get; set; } = "";
 public DateTime CreatedAt { get; set; } = DateTime.UtcNow; public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
 public bool IsDeleted { get; set; } public Guid? ConvertedCustomerId { get; set; }
 [Timestamp] public uint Version { get; set; }
}
public class Customer : CrmRecord { }
public class Lead : CrmRecord { }
public class Opportunity : CrmRecord { }
public class FollowUp : CrmRecord { }
public class Activity : CrmRecord { }
public class AuditLog {
 public long Id { get; set; } public string? UserId { get; set; } public string Action { get; set; } = "";
 public string EntityName { get; set; } = ""; public string? RecordId { get; set; } public string? OldValue { get; set; } public string? NewValue { get; set; }
 public DateTime CreatedAt { get; set; } = DateTime.UtcNow; public string? IpAddress { get; set; }
}
