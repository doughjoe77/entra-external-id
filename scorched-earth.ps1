# bring down local environment
docker compose down --rmi local --volumes

# remove all images
docker image rm entra-external-id-static-html-spa:latest -f
docker image rm entra-external-id-vue-spa:latest -f
docker image rm entra-external-id-react-spa:latest -f
docker image rm entra-external-id-nodejs-daily-tasks-api:latest -f