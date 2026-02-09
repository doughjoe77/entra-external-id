using dotnet_graphql.Models;
using HotChocolate.Authorization;



namespace dotnet_graphql.GQL
{
    
    public class Query
    {
        //[AllowAnonymous] // this field bypasses JWT auth
        public HealthResult Health()
            => new("OK", DateTime.UtcNow);
        
        [Authorize]
        public Book GetBook() =>
            new Book
            {
                Title = "C# in depth.",
                Author = new Author
                {
                    Name = "Jon Skeet"
                }
            };
    }

}
