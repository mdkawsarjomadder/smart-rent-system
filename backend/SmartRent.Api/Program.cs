using Microsoft.EntityFrameworkCore;
using SmartRent.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Controllers ও Swagger যোগ করা
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// EF Core SQL Server DbContext রেজিস্টার করা
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Next.js Frontend-এর সাথে কানেক্ট করার জন্য CORS পলিসি
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        policy.WithOrigins(
                    "http://localhost:3000",
                    "http://127.0.0.1:3000"
              )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// লোকাল ডেভেলপমেন্টে HTTP পোর্ট (5075) দিয়ে কাজ করার সময় 
// HttpsRedirection বন্ধ রাখাই নিরাপদ, যাতে CORS রিডাইরেক্ট এরর না হয়
// app.UseHttpsRedirection();

// CORS মিডলওয়্যার
app.UseCors("AllowNextJs");

app.UseAuthorization();

app.MapControllers();

app.Run();