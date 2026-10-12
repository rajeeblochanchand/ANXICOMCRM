using AcxiomCRM.Api.Data;
using AcxiomCRM.Api.Contracts;
using AcxiomCRM.Api.Models;
using AcxiomCRM.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace AcxiomCRM.Api.Controllers;
[ApiController,Authorize,Route("api")]
public class InsightsController(Scope scope,CrmDbContext db):ControllerBase {
 [HttpGet("dashboard"),HttpGet("reports/pipeline")]public async Task<IActionResult> Dashboard(DateTime? from,DateTime? to) {
  IQueryable<T> Filter<T>() where T:CrmRecord {var q=scope.Query<T>();if(from.HasValue)q=q.Where(x=>x.CreatedAt>=DateTime.SpecifyKind(from.Value,DateTimeKind.Utc));if(to.HasValue)q=q.Where(x=>x.CreatedAt<DateTime.SpecifyKind(to.Value.Date.AddDays(1),DateTimeKind.Utc));return q;}
  var c=Filter<Customer>();var l=Filter<Lead>();var o=Filter<Opportunity>();
  var leads=await l.ToListAsync();var opps=await o.ToListAsync();var open=opps.Where(x=>x.Status=="Open").ToList();
  return Ok(new{totalCustomers=await c.CountAsync(),totalLeads=leads.Count,openLeads=leads.Count(x=>!new[]{"Lost","Converted","Unqualified"}.Contains(x.Status)),totalOpportunities=opps.Count,openOpportunities=open.Count,wonOpportunities=opps.Count(x=>x.Status=="Won"),lostOpportunities=opps.Count(x=>x.Status=="Lost"),pipelineValue=open.Sum(x=>x.Amount),weightedPipeline=open.Sum(x=>x.Amount*x.Probability/100),conversionRate=leads.Count==0?0:100m*leads.Count(x=>x.Status=="Converted")/leads.Count,leadStatus=leads.GroupBy(x=>x.Status).Select(g=>new{label=g.Key,value=g.Count()}),pipeline=opps.GroupBy(x=>x.Stage).Select(g=>new{label=g.Key,value=g.Sum(x=>x.Amount)}),monthlySales=opps.Where(x=>x.Status=="Won"&&x.ClosedAt!=null).GroupBy(x=>x.ClosedAt!.Value.ToString("yyyy-MM")).OrderBy(g=>g.Key).Select(g=>new{label=g.Key,value=g.Sum(x=>x.Amount)}),upcoming=(await scope.Query<FollowUp>().Where(x=>x.Status=="Planned").OrderBy(x=>x.FollowUpDate).Take(6).ToListAsync()).Select(RecordView.From)});
 }
 [HttpGet("audit"),Authorize(Roles="Admin")]public async Task<IActionResult> Audit(string? search,int page=1) {var q=db.AuditLogs.AsNoTracking();if(!string.IsNullOrWhiteSpace(search))q=q.Where(x=>x.Action.Contains(search)||x.EntityName.Contains(search));return Ok(new{items=await q.OrderByDescending(x=>x.CreatedAt).Skip((Math.Max(1,page)-1)*50).Take(50).ToListAsync(),total=await q.CountAsync()});}
 [HttpGet("records/{kind}/{id:guid}/history")]public async Task<IActionResult> History(string kind,Guid id) {
  bool allowed=kind switch {"customers"=>await scope.Query<Customer>().AnyAsync(x=>x.Id==id),"leads"=>await scope.Query<Lead>().AnyAsync(x=>x.Id==id),"opportunities"=>await scope.Query<Opportunity>().AnyAsync(x=>x.Id==id),"followups"=>await scope.Query<FollowUp>().AnyAsync(x=>x.Id==id),"activities"=>await scope.Query<Activity>().AnyAsync(x=>x.Id==id),_=>false};
  if(!allowed)return NotFound();return Ok(await db.AuditLogs.Where(x=>x.RecordId==id.ToString()).OrderByDescending(x=>x.CreatedAt).Select(x=>new{x.Action,x.CreatedAt,x.UserId}).ToListAsync());
 }
 [HttpGet("reports/user-activity"),Authorize(Roles="Admin,Manager")]public async Task<IActionResult> UserActivity(DateTime? from,DateTime? to){var q=db.AuditLogs.AsNoTracking();if(!scope.IsAdmin){var ids=db.Users.Where(x=>scope.TeamId!=null&&x.TeamId==scope.TeamId).Select(x=>x.Id);q=q.Where(x=>x.UserId!=null&&ids.Contains(x.UserId));}if(from.HasValue)q=q.Where(x=>x.CreatedAt>=DateTime.SpecifyKind(from.Value,DateTimeKind.Utc));if(to.HasValue)q=q.Where(x=>x.CreatedAt<DateTime.SpecifyKind(to.Value.Date.AddDays(1),DateTimeKind.Utc));return Ok(await q.GroupBy(x=>new{x.UserId,x.Action}).Select(g=>new{g.Key.UserId,g.Key.Action,count=g.Count()}).ToListAsync());}
 [HttpGet("reports/customers")] public Task<IActionResult> CustomerReport(string? search,string? status,DateTime? from,DateTime? to,int page=1,int pageSize=20,string sort="createdAt",string direction="desc") => Report<Customer>(search,status,from,to,page,pageSize,sort,direction);
 [HttpGet("reports/leads")] public Task<IActionResult> LeadReport(string? search,string? status,DateTime? from,DateTime? to,int page=1,int pageSize=20,string sort="createdAt",string direction="desc") => Report<Lead>(search,status,from,to,page,pageSize,sort,direction);
 [HttpGet("reports/followups")] public Task<IActionResult> FollowUpReport(string? search,string? status,DateTime? from,DateTime? to,int page=1,int pageSize=20,string sort="createdAt",string direction="desc") => Report<FollowUp>(search,status,from,to,page,pageSize,sort,direction);
 [HttpGet("reports/opportunities")] public Task<IActionResult> OpportunityReport(string? search,string? status,DateTime? from,DateTime? to,int page=1,int pageSize=20,string sort="createdAt",string direction="desc") => Report<Opportunity>(search,status,from,to,page,pageSize,sort,direction);
 [HttpGet("reports/conversion")] public async Task<IActionResult> ConversionReport(string? search,string? status,DateTime? from,DateTime? to,int page=1,int pageSize=20,string sort="createdAt",string direction="desc") {
  var q=Filter(scope.Query<Lead>(),search,status,from,to);
  var converted=await q.CountAsync(x=>x.Status=="Converted");
  var totalAll=await q.CountAsync();
  page=Math.Max(page,1);pageSize=Math.Clamp(pageSize,1,100);
  q=sort=="name"?(direction=="asc"?q.OrderBy(x=>x.Name):q.OrderByDescending(x=>x.Name)):(direction=="asc"?q.OrderBy(x=>x.CreatedAt):q.OrderByDescending(x=>x.CreatedAt));
  var items=await q.AsNoTracking().Skip((page-1)*pageSize).Take(pageSize).Select(x=>new{x.Id,x.Code,x.Name,x.Email,x.Source,x.Status,x.OwnerId,x.ConvertedCustomerId,x.CreatedAt,converted=x.Status=="Converted"}).ToListAsync();
  return Ok(new{items,total=totalAll,page,pageSize,converted,notConverted=totalAll-converted,conversionRate=totalAll==0?0:100m*converted/totalAll});
 }
 private static IQueryable<T> Filter<T>(IQueryable<T> q,string? search,string? status,DateTime? from,DateTime? to) where T:CrmRecord {
  if(!string.IsNullOrWhiteSpace(search)){var s=search.ToLower();q=q.Where(x=>x.Name.ToLower().Contains(s)||(x.Email!=null&&x.Email.ToLower().Contains(s))||(x.CompanyName!=null&&x.CompanyName.ToLower().Contains(s))||(x.Phone!=null&&x.Phone.Contains(s)));}
  if(!string.IsNullOrEmpty(status))q=q.Where(x=>x.Status==status);
  if(from.HasValue)q=q.Where(x=>(x.FollowUpDate??x.ActivityDate??x.CreatedAt)>=DateTime.SpecifyKind(from.Value,DateTimeKind.Utc));
  if(to.HasValue)q=q.Where(x=>(x.FollowUpDate??x.ActivityDate??x.CreatedAt)<DateTime.SpecifyKind(to.Value.Date.AddDays(1),DateTimeKind.Utc));
  return q;
 }
 private async Task<IActionResult> Report<T>(string? search,string? status,DateTime? from,DateTime? to,int page,int pageSize,string sort,string direction) where T:CrmRecord {
  page=Math.Max(page,1);pageSize=Math.Clamp(pageSize,1,100);
  var q=Filter(scope.Query<T>(),search,status,from,to);
  var count=await q.CountAsync();
  q=sort=="name"?(direction=="asc"?q.OrderBy(x=>x.Name).ThenBy(x=>x.Id):q.OrderByDescending(x=>x.Name).ThenBy(x=>x.Id)):(direction=="asc"?q.OrderBy(x=>x.CreatedAt).ThenBy(x=>x.Id):q.OrderByDescending(x=>x.CreatedAt).ThenBy(x=>x.Id));
  var items=await q.AsNoTracking().Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
  return Ok(new{items=items.Select(RecordView.From),total=count,page,pageSize});
 }
}
