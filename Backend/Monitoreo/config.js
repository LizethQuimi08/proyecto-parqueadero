/**
 * Configuración del frontend.
 * Esta variable puede ser sobrescrita por el servidor de despliegue
 * (por ejemplo, mediante un ConfigMap en Kubernetes) sin recompilar la app.
 */
window.API_BASE = window.API_BASE || (
    window.location.protocol === 'file:'
        ? 'http://localhost:30080'
        : window.location.port === '8080'
            ? 'http://localhost:30080'
            : window.location.origin
);
