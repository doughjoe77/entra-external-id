using dotnet_graphql.GQL;
using dotnet_graphql.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;


var builder = WebApplication.CreateBuilder(args);

// ASP.NET Core authorization services
builder.Services.AddAuthorization();

var idp = builder.Configuration
    .GetSection("IdentityProvider")
    .Get<IdentityProvider>();

// JWT Authentication
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = idp.Authority;
        options.Audience = idp.Audience;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true
        };
    });

// Hot Chocolate 14 GraphQL server
builder.Services
    .AddGraphQLServer()
    .AddAuthorization()        // REQUIRED in HC 14
    .AddQueryType<Query>();

var app = builder.Build();

// Support for static GraphiQL page
app.UseStaticFiles();

// ASP.NET Core auth middleware
app.UseAuthentication();
app.UseAuthorization();

// GraphQL endpoint
app.MapGraphQL();

// GraphiQL static page redirect
app.MapGet("/graphiql", async context =>
{
    context.Response.Redirect("/graphiql/index.html");
});

// Banana Cake Pop (optional but recommended)
//app.MapBananaCakePop("/graphql-ui");

app.Run();
