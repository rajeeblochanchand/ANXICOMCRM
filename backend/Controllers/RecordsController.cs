using AcxiomCRM.Api.Contracts;
using AcxiomCRM.Api.Data;
using AcxiomCRM.Api.Models;
using AcxiomCRM.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace AcxiomCRM.Api.Controllers;
[ApiController,Authorize,ApiExplorerSettings(IgnoreApi=true)]
public abstract class RecordsController<T>(CrmDbContext db,Scope scope,CrmService service):ControllerBase where T:CrmRecord,new() {
 [HttpGet] public async Task<IActionResult> List(string? search,string? status,string? ownerId,string? stage,string? type,Guid? customerId,Guid? leadId,DateTime? from,DateTime? to,int page=1,int pageSize=20,string sort="createdAt",string direction="desc") {
  page=Math.Max(page,1);pageSize=Math.Clamp(pageSize,1,100);var q=scope.Query<T>();
  if(!string.IsNullOrWhiteSpace(search)) {var s=search.ToLower();q=q.Where(x=>x.Name.ToLower().Contains(s)||(x.Email!=null&&x.Email.ToLower().Contains(s))||(x.CompanyName!=null&&x.CompanyName.ToLower().Contains(s))||(x.Phone!=null&&x.Phone.Contains(s)));}
  if(!string.IsNullOrEmpty(status))q=q.Where(x=>x.Status==status);if(!string.IsNullOrEmpty(ownerId))q=q.Where(x=>x.OwnerId==ownerId);
  if(!string.IsNullOrEmpty(stage))q=q.Where(x=>x.Stage==stage);if(!string.IsNullOrEmpty(type))q=q.Where(x=>x.Type==type);
  if(from.HasValue)q=q.Where(x=>(x.FollowUpDate??x.ActivityDate??x.CreatedAt)>=DateTime.SpecifyKind(from.Value,DateTimeKind.Utc));
  if(to.HasValue)q=q.Where(x=>(x.FollowUpDate??x.ActivityDate??x.CreatedAt)<DateTime.SpecifyKind(to.Value.Date.AddDays(1),DateTimeKind.Utc));
  if(customerId.HasValue)q=q.Where(x=>x.CustomerId==customerId);if(leadId.HasValue)q=q.Where(x=>x.LeadId==leadId);
  var count=await q.CountAsync();q=sort=="name"?(direction=="asc"?q.OrderBy(x=>x.Name).ThenBy(x=>x.Id):q.OrderByDescending(x=>x.Name).ThenBy(x=>x.Id)):(direction=="asc"?q.OrderBy(x=>x.CreatedAt).ThenBy(x=>x.Id):q.OrderByDescending(x=>x.CreatedAt).ThenBy(x=>x.Id));
  var items=await q.AsNoTracking().Skip((page-1)*pageSize).Take(pageSize).ToListAsync();return Ok(new{items=items.Select(RecordView.From),total=count,page,pageSize});
 }
 [HttpGet("{id:guid}")]public async Task<IActionResult> Get(Guid id) {var r=await scope.Query<T>().AsNoTracking().SingleOrDefaultAsync(x=>x.Id==id);return r==null?NotFound():Ok(RecordView.From(r));}
 [HttpPost]public async Task<IActionResult> Create(RecordInput input) {var r=new T();await service.Save(r,input,true);return Created($"{Request.Path}/{r.Id}",RecordView.From(r));}
 [HttpPut("{id:guid}")]public async Task<IActionResult> Update(Guid id,RecordInput input) {var r=await scope.Query<T>().SingleOrDefaultAsync(x=>x.Id==id);if(r==null)return NotFound();await service.Save(r,input,false);return Ok(RecordView.From(r));}
 [HttpDelete("{id:guid}")]public async Task<IActionResult> Delete(Guid id) {var r=await scope.Query<T>().SingleOrDefaultAsync(x=>x.Id==id);if(r==null)return NotFound();r.IsDeleted=true;r.UpdatedAt=DateTime.UtcNow;scope.Audit("Delete",typeof(T).Name,id.ToString());await db.SaveChangesAsync();return NoContent();}
}
[ApiExplorerSettings(IgnoreApi=false),Route("api/customers")]public class CustomersController(CrmDbContext db,Scope s,CrmService service):RecordsController<Customer>(db,s,service) {}
[ApiExplorerSettings(IgnoreApi=false),Route("api/opportunities")]public class OpportunitiesController(CrmDbContext db,Scope s,CrmService service):RecordsController<Opportunity>(db,s,service) {}
[ApiExplorerSettings(IgnoreApi=false),Route("api/followups")]public class FollowUpsController(CrmDbContext db,Scope s,CrmService service):RecordsController<FollowUp>(db,s,service) {}
[ApiExplorerSettings(IgnoreApi=false),Route("api/activities")]public class ActivitiesController(CrmDbContext db,Scope s,CrmService service):RecordsController<Activity>(db,s,service) {}
[ApiExplorerSettings(IgnoreApi=false),Route("api/leads")]public class LeadsController(CrmDbContext db,Scope s,CrmService service):RecordsController<Lead>(db,s,service) {
 [HttpPost("{id:guid}/convert")]public async Task<IActionResult> Convert(Guid id) {var r=await s.Query<Lead>().SingleOrDefaultAsync(x=>x.Id==id);if(r==null)return NotFound();return Ok(RecordView.From(await service.Convert(r)));}
}
