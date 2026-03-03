# Entra External ID test Lab
This project is meant to test various features and integrations with Entra and Entra External ID.

# Run all Examples
To run all the examples on your workstation, run the PowerShell command ```.\start.ps1```. To clear everything out and bring down the running containers run the command ```.\scorched-earth.ps1```.
- [React SPA showcasing logging in plus JWT claims](http://localhost:3000)
- [Vue SPA](http://localhost:5173/)
- [Static HTML Page](http://localhost:3001/)
- [NodeJS Hasura / .NET Hot Chocolate like NodeJS GraphQL API](http://localhost:4001/graphiql)
- [NodeJS API using JWTs for Authentication Swagger Page](http://localhost:4000/docs/)
- [Hot Chocolate GraphQL API Graphiql UI](http://localhost:8085/graphiql/index.html)
- [PG Admin for access to the Postgres DB](http://localhost:8889/) 
  - PG admin user: `user@user.com`
  - PG Admin password: `test123` 
  - DB Password: `postgres`

This lab is currently using my Entra External ID lab tenant; others can sign up and login if they wish. If you want to experiment with your own tenant, you'll need to modify the .env files in the root of each application type folder.

# Exploring Specific Examples (Web UIs)

## React SPA
Running locally at http://localhost:3000 is a React Single Page Application (SPA) that, when you hit it, forces authentication against Entra External ID. To run the code, you need to be in the ```react-spa``` directory and to run the command ```npm start```. The SPA will also automatically log you out after 60 minutes of inactivity.

## Vue SPA
Running locally at http://localhost:5173/ is a Vue SPA that can obtain a JWT and use that JWT to call the daily tasks REST API and show those to the screen.

## Static HTML Page using MSAL to Authenticate
For this example, to work, you must be running from Docker (```./start.ps1```) as it requires a web server to work. You can access the site at http://localhost:3001/ and mimics functionality of the other apps (i.e., automatic login, logout to logout page, rolling auto logout, etc.).

# Exploring Specific Examples (APIs)

## NodeJS REST API
A sample REST API created to return random daily tasks has been included with JWT Authentication. To try the API out go to http://localhost:4000/docs/, obtain a JWT Access Token from the SPA hosted at http://localhost:3000, "Login" with the JWT Access token in the Swagger UI, then execute the ```/tasks``` endpoint.

## .NET GraphQL API (using Hot Chocolate)
A sample [Hot Chocolate](https://chillicream.com/docs/hotchocolate/) .NET GraphQL API with JWT Authentication. I had a real hard time getting Hot Chocolate v15 to work with JWT Authentication, so instead this version is running v14 instead of v15. Additionally, I've used the Apollo GraphiQL interface instead of the standard Hot Chocolate UI, this was to tenable automatic authentication against Entra.
- URL when running from Visual Studio: https://localhost:7091/graphiql/index.html
- URL when running from Docker (TBD)
``` gql
# sample test GraphQL Query
query{
  book{
    title
    author{
      name
    }
  }
  health{
    status
    serverTimeUtc
  }
}
```

## NodeJS Hasura / .NET Hot Chocolate like NodeJS GraphQL API
I went down a bit of rabbit hole on this, but this is an Apollo / Express NodeJS GraphQL API example that:
- will auto authenticate with Entra when you hit the GraphiQL page at http://localhost:4001/graphiql
- added a tree view explorer to GraphiQL that uses the introspection data to build a tree that helps with creating the GraphQL queries and mutations, this was needed due to the complexities of the *where* clause sections that mimic Hasura and Hot Chocolate style GraphQL APIs
turn on | off introspection — Controls whether clients can discover your schema. Turning it off in production reduces reconnaissance and prevents attackers from mapping objects and fields, aligning with OWASP API1 (Broken Object Level Authorization) and API3 (Broken Object Property Level Authorization), as well as the OWASP GraphQL Cheat Sheet recommendation to disable introspection outside development.
- turn on | off graphiql UI — Controls whether the in‑browser GraphQL editor is exposed. Disabling it removes a powerful exploration tool that attackers could use to craft malicious queries, aligning with OWASP API1 and API4 (Unrestricted Resource Consumption) by reducing the attack surface and preventing unauthenticated interactive querying.
- query depth checks — Limits how deeply nested a query can be. This prevents recursive or deeply nested resolver chains that can overwhelm the server, directly mitigating OWASP API4 (Unrestricted Resource Consumption) and following the OWASP GraphQL Cheat Sheet guidance to enforce maximum query depth.
- query complexity checks — Assigns a cost to each field and rejects queries that exceed a safe total cost. This stops wide or computationally expensive queries that could exhaust CPU, memory, or database resources, aligning with OWASP API4 and the OWASP GraphQL Cheat Sheet recommendation to enforce query complexity limits.
### OUTSTANDING
- no query allow lists, which is something I might leave configurable in the example
``` gql
# sample query with filtering, and a limit of records returned applied
query {
  books(where: {
    year: { _gte: 1920 }
  }, order_by: { title: asc }, limit: 3) {
    title
    year
    author {
      name
    }
  }
}
# sample query that will pull the claims out of the JWT being passed and display them in the JSON results
query {
  whoami
}
# simple subscription that returns the time
subscription {
  time {
    now
  }
}
# subscription listening to changes on the author table
subscription {
  author_live {
    inserts {
      id
      name
      country
      birth_year
    }
    updates {
      id
      name
      birth_year
    }
    deletes {
      id
      name
      birth_year
    }
  }
}
# query that has too many nested objects and will fail with an error of 'exceeds maximum operation depth of X'
query {
  authors{
    name
    books{
      title
      author{
        name
        books{
          year
          author{
            country
            books{
              id
              author{
                birth_year
                books{
                  id
                  author{
                    country
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

