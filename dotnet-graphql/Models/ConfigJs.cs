namespace dotnet_graphql.Models
{
    public class ConfigJs
    {
        public string clientId { get;set;  }
        public string authority { get; set; }
        public string redirectUri { get; set; }
        public string apiScope { get; set; }
        public string logoutMinutes { get; set; }  
    }

}
