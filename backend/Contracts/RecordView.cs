using AcxiomCRM.Api.Models;
namespace AcxiomCRM.Api.Contracts;
public class RecordView:RecordInput {
 public Guid Id {get;set;} public string Code {get;set;} = ""; public string? TeamId {get;set;}
 public string CreatedBy {get;set;} = ""; public DateTime CreatedAt {get;set;} public DateTime UpdatedAt {get;set;}
 public DateTime? ClosedAt {get;set;} public Guid? ConvertedCustomerId {get;set;}
 public static RecordView From(CrmRecord r)=>new() {
Name=r.Name,
Email=r.Email,
Phone=r.Phone,
CompanyName=r.CompanyName,
Address=r.Address,
City=r.City,
State=r.State,
Status=r.Status,
Source=r.Source,
Priority=r.Priority,
Amount=r.Amount,
ExpectedValue=r.ExpectedValue,
Probability=r.Probability,
Stage=r.Stage,
ExpectedCloseDate=r.ExpectedCloseDate,
FollowUpDate=r.FollowUpDate,
ActivityDate=r.ActivityDate,
Type=r.Type,
Notes=r.Notes,
CustomerId=r.CustomerId,
LeadId=r.LeadId,
OpportunityId=r.OpportunityId,
OwnerId=r.OwnerId,
Version=r.Version,
Id=r.Id,
Code=r.Code,
TeamId=r.TeamId,
CreatedBy=r.CreatedBy,
CreatedAt=r.CreatedAt,
UpdatedAt=r.UpdatedAt,
ClosedAt=r.ClosedAt,
ConvertedCustomerId=r.ConvertedCustomerId
 };
}
