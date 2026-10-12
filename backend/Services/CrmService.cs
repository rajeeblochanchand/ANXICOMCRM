using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using AcxiomCRM.Api.Contracts;
using AcxiomCRM.Api.Data;
using AcxiomCRM.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
namespace AcxiomCRM.Api.Services;
public class BusinessException(string message):Exception(message) {}
public class CrmService(CrmDbContext db,Scope scope,UserManager<AppUser> users) {
 public static DateTime Today => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow,TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata")).Date;
 private static DateTime? Utc(DateTime? date)=> date.HasValue?DateTime.SpecifyKind(date.Value.ToUniversalTime(),DateTimeKind.Utc):null;
 public async Task Save<T>(T entity,RecordInput input,bool creating) where T:CrmRecord {
  var errors=new List<ValidationResult>();
  if(!Validator.TryValidateObject(input,new ValidationContext(input),errors,true)) throw new BusinessException(string.Join(" ",errors.Select(x=>x.ErrorMessage)));
  var kind=typeof(T).Name;
  var statuses=kind switch { "Customer"=>new[]{"Active","Inactive"},"Lead"=>new[]{"New","Contacted","Qualified","Unqualified","Converted","Lost"},"Opportunity"=>new[]{"Open","Won","Lost"},"FollowUp"=>new[]{"Planned","Completed","Missed","Cancelled"},_=>new[]{"Pending","Completed","Cancelled"} };
  if(!statuses.Contains(input.Status)) throw new BusinessException("Invalid status.");
  if(!new[]{"Low","Medium","High"}.Contains(input.Priority)) throw new BusinessException("Invalid priority.");
  if(kind=="Customer" && (string.IsNullOrWhiteSpace(input.Email)||string.IsNullOrWhiteSpace(input.Phone))) throw new BusinessException("Email and international phone are required.");
  if(kind=="Lead") {
   if(string.IsNullOrWhiteSpace(input.Source)) throw new BusinessException("Lead source is required.");
   if(input.Status=="Converted" && (creating || entity.Status!="Converted")) throw new BusinessException("Use the lead conversion action.");
   if(!creating && !CanTransition(entity.Status,input.Status)) throw new BusinessException("Invalid lead status transition.");
  }
  if(kind=="Opportunity") {
   if(!new[]{"Qualification","Proposal","Negotiation","Won","Lost"}.Contains(input.Stage)) throw new BusinessException("Invalid pipeline stage.");
   if(input.Amount<=0) throw new BusinessException("Opportunity amount must be greater than zero.");
   if(input.CustomerId==null) throw new BusinessException("Select a customer.");
   if(input.ExpectedCloseDate==null || (input.Status=="Open" && input.ExpectedCloseDate.Value.Date<Today)) throw new BusinessException("Open opportunities require a close date today or later.");
   if((input.Stage=="Won")!=(input.Status=="Won") || (input.Stage=="Lost")!=(input.Status=="Lost")) throw new BusinessException("Stage must match opportunity status.");
  }
  if(kind is "FollowUp" or "Activity") {
   if(!new[]{"Call","Meeting","Email","Task"}.Contains(input.Type)) throw new BusinessException("Invalid activity type.");
   if(input.CustomerId==null && input.LeadId==null && input.OpportunityId==null) throw new BusinessException("Choose a related record.");
   if(kind=="FollowUp" && (input.FollowUpDate==null || (input.Status=="Planned" && TimeZoneInfo.ConvertTimeFromUtc(Utc(input.FollowUpDate)!.Value,TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata")).Date<Today))) throw new BusinessException("Planned follow-up cannot be in the past.");
   if(kind=="Activity" && input.ActivityDate==null) throw new BusinessException("Activity date is required.");
  }
  var ownerId=creating?scope.UserId:entity.OwnerId;
  if(!string.IsNullOrEmpty(input.OwnerId) && input.OwnerId!=ownerId) { if(!scope.IsAdmin&&!scope.IsManager) throw new BusinessException("You cannot assign another owner."); ownerId=input.OwnerId; }
  var owner=await users.FindByIdAsync(ownerId);
  if(owner==null || !owner.IsActive || (!scope.IsAdmin && scope.IsManager && (scope.TeamId==null||owner.TeamId!=scope.TeamId))) throw new BusinessException("Invalid assignee for your scope.");
  await CheckRelated<Customer>(input.CustomerId,owner.TeamId); await CheckRelated<Lead>(input.LeadId,owner.TeamId); await CheckRelated<Opportunity>(input.OpportunityId,owner.TeamId);
  if(!creating && input.Version!=entity.Version) throw new BusinessException("Record changed. Refresh and try again.");
  var old=creating?null:JsonSerializer.Serialize(entity);
  entity.Name=input.Name.Trim();entity.Email=input.Email?.Trim().ToLowerInvariant();entity.Phone=input.Phone?.Trim();entity.CompanyName=input.CompanyName;
  entity.Address=input.Address;entity.City=input.City;entity.State=input.State;entity.Status=input.Status;entity.Source=input.Source;entity.Priority=input.Priority;
  entity.Amount=input.Amount;entity.ExpectedValue=input.ExpectedValue;entity.Probability=input.Probability;entity.Stage=input.Stage;entity.ExpectedCloseDate=Utc(input.ExpectedCloseDate);
  entity.FollowUpDate=Utc(input.FollowUpDate);entity.ActivityDate=Utc(input.ActivityDate);entity.Type=input.Type;entity.Notes=input.Notes;
  entity.CustomerId=input.CustomerId;entity.LeadId=input.LeadId;entity.OpportunityId=input.OpportunityId;entity.OwnerId=ownerId;entity.TeamId=owner.TeamId;entity.UpdatedAt=DateTime.UtcNow;
  if(kind=="Opportunity") entity.ClosedAt=input.Status=="Open"?null:entity.ClosedAt??DateTime.UtcNow;
  if(creating) {entity.Code=kind[..3].ToUpperInvariant()+"-"+Guid.NewGuid().ToString("N")[..10];entity.CreatedBy=scope.UserId;db.Set<T>().Add(entity);}
  scope.Audit(creating?"Create":"Update",kind,entity.Id.ToString(),old,JsonSerializer.Serialize(entity));
  await db.SaveChangesAsync();
 }
 private async Task CheckRelated<T>(Guid? id,string? team) where T:CrmRecord {
  if(id==null)return;
  var r=await scope.Query<T>().SingleOrDefaultAsync(x=>x.Id==id);
  if(r==null || r.TeamId!=team) throw new BusinessException("Related record is inaccessible or belongs to another team.");
 }
 public static bool CanTransition(string from,string to)=>from==to || (from switch {"New"=>new[]{"Contacted","Unqualified","Lost"},"Contacted"=>new[]{"Qualified","Unqualified","Lost"},"Qualified"=>new[]{"Lost"},"Unqualified" or "Lost"=>new[]{"Contacted"},_=>Array.Empty<string>()}).Contains(to);
 public async Task<Customer> Convert(Lead lead) {
  if(lead.Status!="Qualified" || lead.ConvertedCustomerId!=null) throw new BusinessException("Only an unconverted qualified lead can be converted.");
  if(string.IsNullOrWhiteSpace(lead.Email)||string.IsNullOrWhiteSpace(lead.Phone))throw new BusinessException("Lead requires email and phone before conversion.");
  var c=new Customer {Name=lead.Name,Code="CUS-"+Guid.NewGuid().ToString("N")[..10],Email=lead.Email,Phone=lead.Phone,CompanyName=lead.CompanyName,Status="Active",OwnerId=lead.OwnerId,TeamId=lead.TeamId,CreatedBy=scope.UserId};
  var old=JsonSerializer.Serialize(lead);db.Customers.Add(c);lead.Status="Converted";lead.ConvertedCustomerId=c.Id;lead.UpdatedAt=DateTime.UtcNow;
  scope.Audit("Convert","Lead",lead.Id.ToString(),old,JsonSerializer.Serialize(lead));scope.Audit("Create","Customer",c.Id.ToString(),null,JsonSerializer.Serialize(c));
  await db.SaveChangesAsync(); return c;
 }
}
