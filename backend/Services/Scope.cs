using System.Security.Claims;
using AcxiomCRM.Api.Data;
using AcxiomCRM.Api.Models;
using Microsoft.EntityFrameworkCore;
namespace AcxiomCRM.Api.Services;
public class Scope(CrmDbContext db, IHttpContextAccessor accessor) {
 public ClaimsPrincipal Principal => accessor.HttpContext!.User;
 public string UserId => Principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
 public bool IsAdmin => Principal.IsInRole("Admin");
 public bool IsManager => Principal.IsInRole("Manager");
 public string? TeamId => Principal.FindFirstValue("team");
 public IQueryable<T> Query<T>() where T:CrmRecord => Apply(db.Set<T>().Where(x=>!x.IsDeleted));
 public IQueryable<T> Apply<T>(IQueryable<T> q) where T:CrmRecord => IsAdmin?q:IsManager?q.Where(x=>TeamId!=null && x.TeamId==TeamId):q.Where(x=>x.OwnerId==UserId);
 public AuditLog Audit(string action,string entity,string? id=null,string? oldValue=null,string? newValue=null) {
  var log=new AuditLog { UserId=UserId,Action=action,EntityName=entity,RecordId=id,OldValue=oldValue,NewValue=newValue,IpAddress=accessor.HttpContext?.Connection.RemoteIpAddress?.ToString() };
  db.AuditLogs.Add(log); return log;
 }
}
