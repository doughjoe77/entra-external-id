# Entra External ID test Lab
This project is meant to test various features and integrations with Entra and Entra External ID.

# Run all Examples
To run all the examples on your workstation run the Powershell command ```.\start.ps1```. To clear everything out and bring down the running containers run the command ```.\scorched-earth.ps1```.

# Exploring Specific Examples

## React SPA
Running locally at http://localhost:3000 is a React Single Page Application (SPA) that, when you hit it, forces authentication against Entra External ID. To run the code, you need to be in the ```react-spa``` directory and to run the command ```npm start```. The SPA will also automatically log you out after 60 minutes of inactivity.
