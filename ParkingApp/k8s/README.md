# Kubernetes backend

Estos manifiestos despliegan solo infraestructura, microservicios, Kong e Ingress.

El frontend no se despliega en Kubernetes. El frontend se ejecuta aparte con Docker usando `docker-compose.frontend.yml`.

## Componentes en Kubernetes

- Postgres con PVC
- RabbitMQ
- Kong API Gateway
- MS Usuarios/OAuth
- MS Zonas/Espacios
- MS Vehiculos
- MS Tickets
- MS Auditoria
- Ingress para exponer Kong/API Gateway

## Imagenes

Los manifiestos usan imagenes GHCR con este formato:

```text
ghcr.io/OWNER/REPOSITORY/<servicio>:latest
```

Antes de desplegar en un cluster real, reemplaza `OWNER/REPOSITORY` por el owner y repo reales, o usa el workflow de GitHub Actions que hace el reemplazo automaticamente durante el despliegue.

## Despliegue Kubernetes

```bash
kubectl apply -k k8s
kubectl -n parking-saas get pods
```

Para Docker Desktop con imagenes locales:

```bash
kubectl apply -k k8s/local
```

Kong queda disponible por NodePort para pruebas locales:

```text
http://localhost:30080
```

## Frontend fuera de Kubernetes

Desde la raiz del repositorio:

```bash
docker compose -f docker-compose.frontend.yml up --build
```

URLs locales:

```text
http://localhost:8080/empresa1
http://localhost:8080/empresa2
```

El frontend detecta el tenant desde `/empresa1` o `/empresa2` y consume las APIs por Kong.

## Ingress

El Ingress expone Kong/API Gateway bajo:

```text
https://parqueadero.espe.edu.ec
```

Requisitos del cluster:

- Ingress Controller compatible con `nginx`.
- `cert-manager` con `ClusterIssuer` llamado `letsencrypt-prod`, o ajustar la anotacion/secret TLS segun el proveedor.
- DNS `parqueadero.espe.edu.ec` apuntando al LoadBalancer del Ingress.

## Tenants

El aislamiento multitenant se hace en backend con el `tenantId` del JWT. El frontend externo debe accederse por path de empresa y enviar login con ese tenant:

```text
http://localhost:8080/empresa1
http://localhost:8080/empresa2
```
