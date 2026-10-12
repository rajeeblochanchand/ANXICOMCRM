using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using AcxiomCRM.Api.Data;
using AcxiomCRM.Api.Models;
using AcxiomCRM.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
LoadDotEnv(Path.Combine(Directory.GetCurrentDirectory(), ".env"));
var databaseUrl=Environment.GetEnvironmentVariable("DATABASE_URL")??Environment.GetEnvironmentVariable("SUPABASE_DB_URL");
if(!string.IsNullOrWhiteSpace(databaseUrl)&&string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")))Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection",databaseUrl);
var builder=WebApplication.CreateBuilder(args);
var key=builder.Configuration["Jwt:Key"];
if(string.IsNullOrEmpty(key)||Encoding.UTF8.GetByteCount(key)<32)throw new InvalidOperationException("Configure Jwt__Key with at least 32 random bytes.");
builder.Services.AddDbContext<CrmDbContext>(o=>o.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")??throw new InvalidOperationException("Configure ConnectionStrings__DefaultConnection.")));
builder.Services.AddIdentityCore<AppUser>(o=>{o.User.RequireUniqueEmail=true;o.Password.RequiredLength=8;o.Password.RequireDigit=true;o.Password.RequireUppercase=true;o.Password.RequireLowercase=true;o.Password.RequireNonAlphanumeric=true;o.Lockout.MaxFailedAccessAttempts=5;o.Lockout.DefaultLockoutTimeSpan=TimeSpan.FromMinutes(15);}).AddRoles<IdentityRole>().AddEntityFrameworkStores<CrmDbContext>().AddSignInManager().AddDefaultTokenProviders();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o=>{
 o.TokenValidationParameters=new TokenValidationParameters{ValidateIssuer=true,ValidateAudience=true,ValidateLifetime=true,ValidateIssuerSigningKey=true,ValidIssuer=builder.Configuration["Jwt:Issuer"],ValidAudience=builder.Configuration["Jwt:Audience"],IssuerSigningKey=new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),ClockSkew=TimeSpan.FromSeconds(30)};
 o.Events=new JwtBearerEvents{OnTokenValidated=async context=>{var um=context.HttpContext.RequestServices.GetRequiredService<UserManager<AppUser>>();var u=await um.FindByIdAsync(context.Principal!.FindFirstValue(ClaimTypes.NameIdentifier)!);if(u==null||!u.IsActive||await um.IsLockedOutAsync(u)||u.SecurityStamp!=context.Principal.FindFirstValue("stamp"))context.Fail("Session unavailable.");}};
});
builder.Services.AddDataProtection();builder.Services.AddAuthorization();builder.Services.AddControllers();builder.Services.AddHttpContextAccessor();builder.Services.AddScoped<AcxiomCRM.Api.Services.Scope>();builder.Services.AddScoped<CrmService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o=>{
 o.SwaggerDoc("v1",new OpenApiInfo{Title="AcxiomCRM API",Version="v1",Description="Customers, leads, opportunities, follow-ups, activities, users, reports and audit."});
 o.AddSecurityDefinition("Bearer",new OpenApiSecurityScheme{Description="Paste the token returned by POST /api/auth/login",Name="Authorization",In=ParameterLocation.Header,Type=SecuritySchemeType.Http,Scheme="bearer",BearerFormat="JWT"});
 o.AddSecurityRequirement(document=>new OpenApiSecurityRequirement{{new OpenApiSecuritySchemeReference("Bearer",document),new List<string>()}});
});
var origins=(builder.Configuration["AllowedOrigins"]??"http://localhost:3000").Split(',',StringSplitOptions.TrimEntries|StringSplitOptions.RemoveEmptyEntries);
builder.Services.AddCors(o=>o.AddDefaultPolicy(p=>p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddRateLimiter(o=>{o.RejectionStatusCode=429;o.AddPolicy("auth",ctx=>RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString()??"unknown",_=>new FixedWindowRateLimiterOptions{PermitLimit=20,Window=TimeSpan.FromMinutes(1),QueueLimit=0}));});
var app=builder.Build();
app.Use(async(context,next)=>{try{await next();}catch(BusinessException e){context.Response.StatusCode=422;await context.Response.WriteAsJsonAsync(new{message=e.Message});}catch(DbUpdateConcurrencyException){context.Response.StatusCode=409;await context.Response.WriteAsJsonAsync(new{message="Record changed. Refresh and try again."});}catch(DbUpdateException){context.Response.StatusCode=409;await context.Response.WriteAsJsonAsync(new{message="Duplicate data or invalid record relationship."});}catch(Exception e){app.Logger.LogError(e,"Unhandled API error");context.Response.StatusCode=500;await context.Response.WriteAsJsonAsync(new{message="Unable to complete request."});}});
app.UseCors();app.UseRateLimiter();app.UseSwagger();app.UseSwaggerUI(o=>{o.SwaggerEndpoint("/swagger/v1/swagger.json","AcxiomCRM API");o.RoutePrefix="swagger";});app.UseAuthentication();app.UseAuthorization();app.MapControllers();app.MapGet("/health",()=>Results.Ok(new{status="ok"}));app.MapGet("/",()=>Results.Redirect("/swagger"));
if(args.Contains("--bootstrap")){
 using var s=app.Services.CreateScope();var db=s.ServiceProvider.GetRequiredService<CrmDbContext>();await db.Database.MigrateAsync();var rm=s.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
 foreach(var role in new[]{"Admin","Manager","SalesExecutive"})if(!await rm.RoleExistsAsync(role)){var r=await rm.CreateAsync(new IdentityRole(role));if(!r.Succeeded)throw new InvalidOperationException("Role provisioning failed.");}
 var um=s.ServiceProvider.GetRequiredService<UserManager<AppUser>>();var email=builder.Configuration["Bootstrap:Email"]??throw new InvalidOperationException("Set Bootstrap__Email.");var existing=await um.FindByEmailAsync(email);
 if(existing==null){var u=new AppUser{Name="Administrator",Email=email,UserName=email,LockoutEnabled=true};var r=await um.CreateAsync(u,builder.Configuration["Bootstrap:Password"]??throw new InvalidOperationException("Set Bootstrap__Password."));if(!r.Succeeded)throw new InvalidOperationException(string.Join(" ",r.Errors.Select(x=>x.Description)));r=await um.AddToRoleAsync(u,"Admin");if(!r.Succeeded)throw new InvalidOperationException("Admin assignment failed.");}else if(!await um.IsInRoleAsync(existing,"Admin"))throw new InvalidOperationException("Bootstrap email exists without Admin role; choose an unused email.");
 return;
}
app.Run();
static void LoadDotEnv(string path){
 if(!File.Exists(path))return;
 foreach(var raw in File.ReadAllLines(path)){
  var line=raw.Trim();
  if(line.Length==0||line.StartsWith('#'))continue;
  var split=line.IndexOf('=');
  if(split<=0)continue;
  var name=line[..split].Trim();
  var value=line[(split+1)..].Trim().Trim('"');
  if(string.IsNullOrEmpty(Environment.GetEnvironmentVariable(name)))Environment.SetEnvironmentVariable(name,value);
 }
}
