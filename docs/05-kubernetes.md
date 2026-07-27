# Kubernetes

## Ubicacion

Entrada raiz solicitada:

```text
k8s/
```

Manifiestos fuente:

```text
ParkingApp/k8s/
```

## Que se despliega en Kubernetes

- Postgres
- RabbitMQ
- Kong API Gateway
- MS Usuarios/OAuth
- MS Zonas/Espacios
- MS Vehiculos
- MS Tickets
- MS Auditoria
- Ingress hacia Kong/API Gateway

## Que no se despliega en Kubernetes

El frontend no se despliega en Kubernetes. Se ejecuta aparte con Docker.

## Aplicar manifiestos

```bash
kubectl apply -k k8s
```

Para validar en Docker Desktop con imagenes locales:

```bash
kubectl apply -k k8s/local
```

## Exposicion local

Kong queda expuesto por NodePort:

```text
http://localhost:30080
```

## Ingress

Se agrego Ingress para:

```text
https://parqueadero.espe.edu.ec
```

Este Ingress apunta a Kong. Requisitos:

- Ingress Controller nginx.
- cert-manager con `ClusterIssuer` llamado `letsencrypt-prod`, o ajuste equivalente.
- DNS `parqueadero.espe.edu.ec` apuntando al LoadBalancer del Ingress.

## Escalabilidad

Los deployments permiten escalar cada microservicio independientemente:

```bash
kubectl -n parking-saas scale deployment ms-vehiculos --replicas=3
kubectl -n parking-saas scale deployment ms-tickets --replicas=3
kubectl -n parking-saas scale deployment ms-zonas-espacios --replicas=3
```

## Validacion realizada

```bash
kubectl kustomize k8s
```

Resultado: correcto.
