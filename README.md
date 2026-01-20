# Entra External ID test Lab
This project is meant to test various features and integrations with Entra and Entra External ID.

# Run all Examples
To run all the examples on your workstation, run the PowerShell command ```.\start.ps1```. To clear everything out and bring down the running containers run the command ```.\scorched-earth.ps1```.
- [React SPA showcasing logging in plus JWT claims](http://localhost:3000)
- [NodeJS API using JWTs for Authentication Swagger Page](http://localhost:4000/docs/)
- [Vue SPA](http://localhost:5173/)

# Exploring Specific Examples

## React SPA
Running locally at http://localhost:3000 is a React Single Page Application (SPA) that, when you hit it, forces authentication against Entra External ID. To run the code, you need to be in the ```react-spa``` directory and to run the command ```npm start```. The SPA will also automatically log you out after 60 minutes of inactivity.

## Vue SPA
Running locally at http://localhost:5173/ is a Vue SPA that can obtain a JWT, and use that JWT to call the daily tasks REST API and show those to the sreen.

## NodeJS REST API
A sample REST API created to return random daily tasks has been included with JWT Authentication. To try the API out go to http://localhost:4000/docs/, obtain a JWT Access Token from the SPA hosted at http://localhost:3000, "Login" with the JWT Access token in the Swagger UI, then execute the ```/tasks``` endpoint.

