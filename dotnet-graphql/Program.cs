using dotnet_graphql.GQL;
using dotnet_graphql.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using HotChocolate.Execution.Configuration;


var builder = WebApplication.CreateBuilder(args);

// ASP.NET Core authorization services
builder.Services.AddAuthorization();

var idp = builder.Configuration
    .GetSection("IdentityProvider")
    .Get<IdentityProvider>();

var gqlOptions = builder.Configuration.GetSection("GraphQL");


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
    .AddAuthorization()
    .AllowIntrospection(gqlOptions.GetValue<bool>("EnableIntrospection"))
    //.ModifyOptions(o => {
    //    o.EnableSchemaRequests = gqlOptions.GetValue<bool>("EnableSchemaRequests");
    //})
    .AddQueryType<Query>();

var app = builder.Build();

// Support for static GraphiQL page
app.UseStaticFiles();

// ASP.NET Core auth middleware
app.UseAuthentication();
app.UseAuthorization();

// GraphQL endpoint
app.MapGraphQL();

// GraphiQL config file, dynamic so we can change it with parameters in the Docker Image on deployment
app.MapGet("/graphiql/config.js", (IConfiguration config) =>
{
    var clientId = config["ConfigJs:ClientId"];
    var authority = config["ConfigJs:Authority"];
    var redirectUri = config["ConfigJs:RedirectUri"];
    var apiScope = config["ConfigJs:ApiScope"];
    var logoutMinutes = config["ConfigJs:LogoutMinutes"];

    var js = $@"
window.appConfig = {{
  clientId: ""{clientId}"",
  authority: ""{authority}"",
  redirectUri: ""{redirectUri}"",
  apiScope: ""{apiScope}"",
  logoutMinutes: {logoutMinutes}
}};
";

    return Results.Content(js, "application/javascript");
});


// GraphiQL static page redirect
app.MapGet("/graphiql", async context =>
{
    context.Response.Redirect("/graphiql/index.html");
});

app.Run();
