using System.ComponentModel.DataAnnotations;
namespace AcxiomCRM.Api.Contracts;
public record RegisterInput([Required,MaxLength(120)] string Name,[Required,EmailAddress] string Email,[Required,MinLength(8)] string Password);
public record LoginInput([Required,EmailAddress] string Email,[Required] string Password);
public record UserInput([Required,MaxLength(120)] string Name,[Required,EmailAddress] string Email,string Role,string? TeamId,bool IsActive,string? Password);
public class RecordInput {
 [Required,MaxLength(120)] public string Name {get;set;} = "";
 [EmailAddress,MaxLength(254)] public string? Email {get;set;}
 [RegularExpression(@"^\+[1-9]\d{7,14}$")] public string? Phone {get;set;}
 [MaxLength(160)] public string? CompanyName {get;set;} [MaxLength(500)] public string? Address {get;set;}
 [MaxLength(100)] public string? City {get;set;} [MaxLength(100)] public string? State {get;set;}
 public string Status {get;set;} = ""; public string? Source {get;set;} public string Priority {get;set;} = "Medium";
 [Range(0,1000000000000d)] public decimal Amount {get;set;}
 [Range(0,1000000000000d)] public decimal ExpectedValue {get;set;}
 [Range(0,100)] public int Probability {get;set;}
 public string Stage {get;set;} = "Qualification"; public DateTime? ExpectedCloseDate {get;set;}
 public DateTime? FollowUpDate {get;set;} public DateTime? ActivityDate {get;set;}
 public string Type {get;set;} = "Call"; [MaxLength(2000)] public string? Notes {get;set;}
 public Guid? CustomerId {get;set;} public Guid? LeadId {get;set;} public Guid? OpportunityId {get;set;}
 public string? OwnerId {get;set;} public uint? Version {get;set;}
}

public record ResetPasswordInput([Required,MinLength(8)] string Password);
