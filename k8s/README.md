# K8s

Carpeta raiz de Kubernetes del monorepo.

Los manifiestos fuente estan en `ParkingApp/k8s` para mantenerlos junto al backend. Esta carpeta expone un `kustomization.yaml` raiz para cumplir la estructura solicitada:

```bash
kubectl apply -k k8s
```

Consulta `ParkingApp/k8s/README.md` para instrucciones completas. El frontend no se despliega en Kubernetes; se ejecuta aparte con `docker-compose.frontend.yml`.
