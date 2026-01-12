docker build -t react-rcpmgr:latest .
docker tag react-rcpmgr:latest therdeancontainerregistry.azurecr.io/react-rcpmgr:latest
docker push therdeancontainerregistry.azurecr.io/react-rcpmgr:latest
kubectl rollout restart deployment react-rcpmgr