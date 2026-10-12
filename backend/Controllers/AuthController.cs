using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AcxiomCRM.Api.Contracts;
using AcxiomCRM.Api.Data;
using AcxiomCRM.Api.Models;
using AcxiomCRM.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
namespace AcxiomCRM.Api.Controllers;
[ApiController,Route("api/auth")]
public class AuthController(UserManager<AppUser> users,SignInManager<AppUser> signIn,CrmDbContext db,IConfiguration config,Scope scope):ControllerBase {
 private async Task Log(string action,string? id) {db.AuditLogs.Add(new AuditLog{Action=action,EntityName="Authentication",UserId=id,IpAddress=HttpContext.Connection.RemoteIpAddress?.ToString()});await db.SaveChangesAsync();}
 [HttpPost("register"),EnableRateLimiting("auth")]public async Task<IActionResult> Register(RegisterInput input) {
  if(!config.GetValue<bool>("Auth:AllowRegistration"))return StatusCode(403,new{message="Public registration is disabled. Contact your administrator."});
  var u=new AppUser{Name=input.Name.Trim(),UserName=input.Email.Trim().ToLowerInvariant(),Email=input.Email.Trim().ToLowerInvariant(),LockoutEnabled=true};
  var result=await users.CreateAsync(u,input.Password);if(!result.Succeeded)return BadRequest(new{message=string.Join(" ",result.Errors.Select(x=>x.Description))});
  var role=await users.AddToRoleAsync(u,"SalesExecutive");if(!role.Succeeded){await users.DeleteAsync(u);return StatusCode(500,new{message="Account creation failed."});}
  await Log("Register",u.Id);return Ok(new{message="Account created. Sign in to continue."});
 }
 [HttpPost("login"),EnableRateLimiting("auth")]public async Task<IActionResult> Login(LoginInput input) {
  var u=await users.FindByEmailAsync(input.Email.Trim().ToLowerInvariant());
  if(u==null||!u.IsActive){await Log("FailedLogin",u?.Id);return Unauthorized(new{message="Invalid credentials or unavailable account."});}
  var result=await signIn.CheckPasswordSignInAsync(u,input.Password,true);
  if(!result.Succeeded){await Log(result.IsLockedOut?"Lockout":"FailedLogin",u.Id);return Unauthorized(new{message="Invalid credentials or unavailable account."});}
  var roles=await users.GetRolesAsync(u);var claims=new List<Claim>{new(ClaimTypes.NameIdentifier,u.Id),new("stamp",u.SecurityStamp!),new(ClaimTypes.Name,u.Name)};
  claims.AddRange(roles.Select(x=>new Claim(ClaimTypes.Role,x)));if(u.TeamId!=null)claims.Add(new Claim("team",u.TeamId));
  var expires=DateTime.UtcNow.AddMinutes(30);var jwt=new JwtSecurityToken(config["Jwt:Issuer"],config["Jwt:Audience"],claims,expires:expires,signingCredentials:new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!)),SecurityAlgorithms.HmacSha256));
  await Log("Login",u.Id);return Ok(new{token=new JwtSecurityTokenHandler().WriteToken(jwt),expiresAt=expires,user=new{id=u.Id,name=u.Name,email=u.Email,role=roles.FirstOrDefault(),teamId=u.TeamId}});
 }
 [HttpPost("logout"),Authorize]public async Task<IActionResult> Logout(){var u=await users.FindByIdAsync(scope.UserId);if(u!=null)await users.UpdateSecurityStampAsync(u);await Log("Logout",u?.Id);return NoContent();}
 [HttpGet("me"),Authorize]public async Task<IActionResult> Me(){var u=await users.FindByIdAsync(scope.UserId);return Ok(new{id=u!.Id,name=u.Name,email=u.Email,role=(await users.GetRolesAsync(u)).FirstOrDefault(),teamId=u.TeamId});}
}
