# Frontend

## Ubicacion

```text
Backend/Monitoreo
```

Archivos principales:

- `index.html`
- `app.js`
- `app.css`
- `config.js`
- `Dockerfile`
- `nginx.conf`

## Decision de despliegue

El frontend no se sube a Kubernetes.

Se ejecuta aparte con Docker:

```bash
docker compose -f docker-compose.frontend.yml up --build
```

URLs locales:

```text
http://localhost:8080/empresa1
http://localhost:8080/empresa2
```

## API Base

Cuando el frontend corre en `localhost:8080`, consume Kong en:

```text
http://localhost:30080
```

Esto se configura en:

```text
Backend/Monitoreo/config.js
```

## Login

El frontend muestra dos modos:

- `Empresa`
- `Admin empresa`

Ambos usan el tenant detectado desde la URL. Por ejemplo:

```text
/empresa1 -> tenantId empresa1
/empresa2 -> tenantId empresa2
```

## SSE

El frontend se conecta a:

```text
/api/espacios/sse?token=<JWT>
```

El backend extrae el token, obtiene el `tenantId` y solo entrega eventos de ese tenant.
