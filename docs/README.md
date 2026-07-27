# Documentacion del Sistema de Gestion de Parqueaderos

Esta carpeta documenta el trabajo realizado sobre el sistema SaaS multitenant de parqueaderos.

## Documentos

- [01-arquitectura.md](01-arquitectura.md): arquitectura general y distribucion del monorepo.
- [02-multitenancy.md](02-multitenancy.md): aislamiento por tenant y propagacion de `tenantId`.
- [03-frontend.md](03-frontend.md): frontend dockerizado, rutas por empresa y consumo de API Gateway.
- [04-docker.md](04-docker.md): contenerizacion y Dockerfiles.
- [05-kubernetes.md](05-kubernetes.md): despliegue local en Kubernetes sin frontend.
- [06-devops.md](06-devops.md): GitHub Actions, SonarCloud, GHCR y Telegram.
- [07-verificacion.md](07-verificacion.md): comandos ejecutados y resultados de validacion.

## Resumen

El sistema queda organizado como monorepo con microservicios independientes, API Gateway Kong, RabbitMQ, Postgres, auditoria centralizada, frontend externo dockerizado y manifiestos Kubernetes para backend e infraestructura.

Decision importante: el frontend no se despliega en Kubernetes. Se ejecuta aparte con Docker y consume el API Gateway expuesto por Kubernetes.
