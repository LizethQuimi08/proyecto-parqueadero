const API_BASE = window.API_BASE || 'http://localhost:8000';

const API_ZONAS = `${API_BASE}/api/zonas`;
const API_ESPACIOS = `${API_BASE}/api/espacios`;
const API_TICKETS = `${API_BASE}/tickets`;
const API_USERS = `${API_BASE}/api/users`;
const API_TENANTS = `${API_BASE}/api/tenants`;
const API_ROLES = `${API_BASE}/api/roles`;
const API_VEHICULOS = `${API_BASE}/vehiculo`;
const API_AUDIT = `${API_BASE}/api/audit`;
const API_ESPACIOS_SSE = `${API_BASE}/api/espacios/sse`;

let eventSource = null;
let ultimoEstado = { zonas: [], espacios: [] };
let moduleCache = {
    usuarios: [],
    roles: [],
    vehiculos: [],
    tickets: [],
    auditoria: [],
};

const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const zonasContainer = document.getElementById('zonasContainer');
const totalSpan = document.getElementById('totalEspacios');
const lastUpdateSpan = document.getElementById('lastUpdate');
const indicator = document.getElementById('indicator');
const statusText = document.getElementById('statusText');
const usuarioActivoSpan = document.getElementById('usuarioActivo');
const tenantActivoSpan = document.getElementById('tenantActivo');
const tenantActualLoginSpan = document.getElementById('tenantActualLogin');
const activeSectionTitle = document.getElementById('activeSectionTitle');
const toastContainer = document.getElementById('toastContainer');
const loginBrandMark = document.getElementById('loginBrandMark');
const sidebarBrandMark = document.getElementById('sidebarBrandMark');
const loginTenantName = document.getElementById('loginTenantName');
const sidebarTenantName = document.getElementById('sidebarTenantName');
const tenantPlan = document.getElementById('tenantPlan');
const tenantLocation = document.getElementById('tenantLocation');
const tenantEyebrow = document.getElementById('tenantEyebrow');
const tenantBadge = document.getElementById('tenantBadge');
const tenantHeroTitle = document.getElementById('tenantHeroTitle');
const tenantHeroCopy = document.getElementById('tenantHeroCopy');
const tenantHeroCode = document.getElementById('tenantHeroCode');
const demoUsersContainer = document.getElementById('demoUsersContainer');
const rolActivoSpan = document.getElementById('rolActivo');
const scopeTitle = document.getElementById('scopeTitle');
const scopeDescription = document.getElementById('scopeDescription');

const moduleTitles = {
    dashboard: 'Dashboard de ocupacion',
    empresas: 'Empresas tenant',
    usuarios: 'Gestion de usuarios',
    roles: 'Roles y parametros',
    vehiculos: 'Gestion de vehiculos',
    zonas: 'Zonas y espacios',
    tickets: 'Gestion de tickets',
    auditoria: 'Auditoria de eventos',
};

const tenantProfiles = {
    global: {
        className: 'tenant-global',
        name: 'Parking SaaS Global',
        shortName: 'SA',
        plan: 'Administracion general',
        location: 'Consola central multitenant',
        badge: 'Admin global',
        heroTitle: 'Control general de tenants',
        heroCopy: 'Supervisa empresas, usuarios, vehiculos, tickets y auditoria desde una vista centralizada.',
        users: [
            { label: 'Admin global', username: 'super_admin', password: '1234567890' },
        ],
    },
    empresa1: {
        className: 'tenant-empresa1',
        name: 'Park Empresa 1',
        shortName: 'P1',
        plan: 'Operacion empresarial',
        location: 'Campus norte - acceso principal',
        badge: 'Empresa 1',
        heroTitle: 'Control operativo para Empresa 1',
        heroCopy: 'Supervisa ocupacion, tickets y disponibilidad de espacios del parqueadero principal en tiempo real.',
        users: [
            { label: 'Admin', username: 'admin_empresa1', password: '1234567890' },
            { label: 'Usuario', username: 'user_empresa1', password: '1234567890' },
        ],
    },
    empresa2: {
        className: 'tenant-empresa2',
        name: 'Park Empresa 2',
        shortName: 'P2',
        plan: 'Operacion corporativa',
        location: 'Campus sur - zona administrativa',
        badge: 'Empresa 2',
        heroTitle: 'Operacion independiente para Empresa 2',
        heroCopy: 'Gestiona espacios, vehiculos, tickets y auditoria con datos aislados de otros tenants.',
        users: [
            { label: 'Admin', username: 'admin_empresa2', password: '1234567890' },
            { label: 'Usuario', username: 'user_empresa2', password: '1234567890' },
        ],
    },
    default: {
        className: 'tenant-global',
        name: 'Parking SaaS',
        shortName: 'SA',
        plan: 'Acceso centralizado',
        location: 'Redireccion automatica por tenant',
        badge: 'Login',
        heroTitle: 'Ingreso centralizado',
        heroCopy: 'El tenant se determina con las credenciales del usuario.',
        users: [
            { label: 'Admin global', username: 'super_admin', password: '1234567890' },
            { label: 'Admin E1', username: 'admin_empresa1', password: '1234567890' },
            { label: 'Usuario E1', username: 'user_empresa1', password: '1234567890' },
            { label: 'Admin E2', username: 'admin_empresa2', password: '1234567890' },
            { label: 'Usuario E2', username: 'user_empresa2', password: '1234567890' },
        ],
    },
};

const getPathSegment = () => {
    const firstSegment = window.location.pathname.split('/').filter(Boolean)[0];
    return firstSegment || '';
};

const getTenantFromPath = () => {
    const firstSegment = getPathSegment();
    if (!firstSegment || firstSegment === 'login') {
        return localStorage.getItem('tenantId') || 'default';
    }
    return firstSegment;
};

const ensureTenantPath = () => {
    const firstSegment = getPathSegment();
    if (!firstSegment) {
        window.location.replace('/login');
    }
};

const isLoginPath = () => getPathSegment() === 'login';

const getLoginTenant = () => getTenantFromPath();
const obtenerToken = () => localStorage.getItem('token');

const getTenantProfile = () => tenantProfiles[getLoginTenant()] || tenantProfiles.default;

const tenantAdminProfiles = () => Object.entries(tenantProfiles)
    .filter(([tenantId]) => !['default', 'global'].includes(tenantId))
    .map(([tenantId, profile]) => ({ tenantId, ...profile }));

const isSuperAdmin = () => localStorage.getItem('rol') === 'SUPER_ADMIN';
const isTenantAdmin = () => localStorage.getItem('rol') === 'ADMIN';
const isEndUser = () => localStorage.getItem('rol') === 'USER';
const canMutateTenantData = () => isTenantAdmin();

const getDemoDniForSession = () => {
    const username = localStorage.getItem('username') || '';
    const tenantId = localStorage.getItem('tenantId') || getLoginTenant();
    if (username === 'super_admin') return '9999999999';
    if (username === 'admin_empresa1') return '1234567891';
    if (username === 'admin_empresa2') return '1234567892';
    if (username === 'user_empresa1') return '2234567891';
    if (username === 'user_empresa2') return '2234567892';
    if (tenantId === 'empresa2') return '2234567892';
    if (tenantId === 'empresa1') return '2234567891';
    return '';
};

const escapeHtml = (value) => String(value ?? 'N/A')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleString('es-ES', { hour12: false });
};

const normalizeEstado = (estado) => String(estado || 'DESCONOCIDO').toUpperCase();

const headersConAuth = (contentType = true) => {
    const headers = {};
    if (contentType) {
        headers['Content-Type'] = 'application/json';
    }

    const token = obtenerToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    headers['X-Tenant-ID'] = localStorage.getItem('tenantId') || getLoginTenant();
    const dni = localStorage.getItem('dni');
    if (dni) {
        headers['X-User-DNI'] = dni;
    }
    return headers;
};

const fetchJson = async (url, options = {}) => {
    const contentType = options.body !== undefined;
    const response = await fetch(url, {
        ...options,
        headers: {
            ...headersConAuth(contentType),
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        let detail = '';
        try {
            const errorBody = await response.json();
            const message = Array.isArray(errorBody.message) ? errorBody.message.join(', ') : errorBody.message;
            detail = message || errorBody.error || '';
        } catch (error) {
            detail = await response.text().catch(() => '');
        }
        throw new Error(detail || `HTTP error ${response.status}`);
    }

    return response.status === 204 ? null : response.json();
};

const setConnectionStatus = (connected) => {
    if (!indicator || !statusText) return;
    indicator.style.background = connected ? 'var(--green)' : 'var(--red)';
    statusText.textContent = connected ? 'Conectado' : 'Desconectado';
};

const showToast = (message) => {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4200);
};

const confirmAction = (message) => window.confirm(message);

const promptValue = (message, fallback = '') => {
    const value = window.prompt(message, fallback);
    return value === null ? null : value.trim();
};

const pintarTenantLogin = () => {
    const profile = getTenantProfile();
    document.body.classList.remove('tenant-global', 'tenant-empresa1', 'tenant-empresa2');
    document.body.classList.add(profile.className);

    if (tenantActualLoginSpan) {
        tenantActualLoginSpan.textContent = isLoginPath()
            ? 'Destino despues de login: empresa asignada al usuario'
            : `Tenant activo: /${getLoginTenant()}`;
    }

    if (loginBrandMark) loginBrandMark.textContent = profile.shortName;
    if (sidebarBrandMark) sidebarBrandMark.textContent = profile.shortName;
    if (loginTenantName) loginTenantName.textContent = profile.name;
    if (sidebarTenantName) sidebarTenantName.textContent = profile.name;
    if (tenantPlan) tenantPlan.textContent = profile.plan;
    if (tenantLocation) tenantLocation.textContent = profile.location;
    if (tenantEyebrow) tenantEyebrow.textContent = `${profile.name} en tiempo real`;
    if (tenantBadge) tenantBadge.textContent = profile.badge;
    if (tenantHeroTitle) tenantHeroTitle.textContent = profile.heroTitle;
    if (tenantHeroCopy) tenantHeroCopy.textContent = profile.heroCopy;
    if (tenantHeroCode) tenantHeroCode.textContent = profile.shortName;
    renderDemoUsers(profile);
};

const renderDemoUsers = (profile) => {
    if (!demoUsersContainer) return;

    demoUsersContainer.innerHTML = profile.users.map((user) => `
        <button class="demo-user-button" type="button" onclick="usarCredencialDemo('${user.username}', '${user.password}')">
            <strong>${user.label}</strong>
            <span>${user.username}</span>
        </button>
    `).join('');
};

window.usarCredencialDemo = (username, password) => {
    const usernameInput = document.getElementById('usernameLogin');
    const passwordInput = document.getElementById('passwordLogin');

    usernameInput.value = username;
    passwordInput.value = password;
    passwordInput.focus();
};

window.iniciarSesion = async () => {
    const username = document.getElementById('usernameLogin').value.trim();
    const password = document.getElementById('passwordLogin').value.trim();

    if (!username || !password) {
        alert('Ingrese usuario y contrasena');
        return;
    }

    try {
        const tenantId = isLoginPath() ? null : getLoginTenant();
        const loginBody = tenantId ? { username, password, tenantId } : { username, password };
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginBody),
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Credenciales invalidas. Verifique usuario y contrasena.');
            }

            throw new Error(`Error de login: ${response.status}`);
        }

        const data = await response.json();
        const authenticatedTenantId = data.tenantId || tenantId || 'default';

        if (tenantId && authenticatedTenantId !== tenantId) {
            throw new Error(`El usuario pertenece a ${authenticatedTenantId}, no a ${tenantId}`);
        }

        localStorage.setItem('token', data.accessToken);
        const rol = data.roles?.includes('ROLE_SUPER_ADMIN')
            ? 'SUPER_ADMIN'
            : data.roles?.includes('ROLE_ADMIN')
                ? 'ADMIN'
                : 'USER';
        localStorage.setItem('rol', rol);
        localStorage.setItem('username', data.username || username);
        localStorage.setItem('tenantId', authenticatedTenantId);

        try {
            const usuarios = await fetchJson(API_USERS);
            const usuario = Array.isArray(usuarios) ? usuarios.find(u => u.username === data.username) : null;
            localStorage.setItem('dni', usuario?.person?.dni || getDemoDniForSession() || username);
        } catch (e) {
            localStorage.setItem('dni', getDemoDniForSession() || username);
        }

        if (window.location.pathname !== `/${authenticatedTenantId}`) {
            window.location.href = `/${authenticatedTenantId}`;
            return;
        }

        await mostrarDashboard();
    } catch (error) {
        console.error('Error al iniciar sesion:', error);
        alert(error.message || 'No se pudo iniciar sesion. Verifique usuario, contrasena y backend activo.');
    }
};

window.cerrarSesion = () => {
    desconectarSSE();
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('username');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('dni');
    localStorage.removeItem('userId');

    dashboardView.classList.add('hidden');
    loginView.classList.remove('hidden');
    window.location.href = '/login';
};

window.cambiarVista = async (view) => {
    if (view === 'empresas' && !isSuperAdmin()) {
        view = 'dashboard';
    }
    if (isEndUser() && ['usuarios', 'roles', 'auditoria', 'empresas'].includes(view)) {
        view = 'dashboard';
    }

    document.querySelectorAll('.nav-item').forEach((item) => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    document.querySelectorAll('.view-section').forEach((section) => {
        section.classList.add('hidden');
    });

    document.getElementById(`${view}Section`)?.classList.remove('hidden');
    if (activeSectionTitle) {
        activeSectionTitle.textContent = moduleTitles[view] || 'Parking SaaS';
    }

    if (view === 'empresas') {
        renderEmpresasAdmin();
        return;
    }

    if (view !== 'dashboard') {
        await cargarModulo(view);
    }
};

const mostrarDashboard = async () => {
    const rol = localStorage.getItem('rol');
    const username = localStorage.getItem('username') || 'Usuario';

    if (!rol) {
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
        return;
    }

    usuarioActivoSpan.textContent = username;
    tenantActivoSpan.textContent = localStorage.getItem('tenantId') || getLoginTenant();
    if (rolActivoSpan) rolActivoSpan.textContent = rol;
    renderScopeBanner(rol);
    pintarTenantLogin();
    document.querySelectorAll('.admin-only').forEach((el) => {
        el.classList.toggle('hidden', !['ADMIN', 'SUPER_ADMIN'].includes(rol));
    });
    document.querySelectorAll('.super-only').forEach((el) => {
        el.classList.toggle('hidden', rol !== 'SUPER_ADMIN');
    });
    document.querySelectorAll('.tenant-admin-only').forEach((el) => {
        el.classList.toggle('hidden', rol !== 'ADMIN');
    });
    document.querySelectorAll('[data-view="usuarios"], [data-view="roles"], [data-view="auditoria"]').forEach((el) => {
        el.classList.toggle('hidden', rol === 'USER');
    });

    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');

    await cambiarVista('dashboard');
    await cargarDatos();
    conectarSSE();
};

const renderScopeBanner = (rol) => {
    if (!scopeTitle || !scopeDescription) return;

    if (rol === 'SUPER_ADMIN') {
        scopeTitle.textContent = 'Administrador general';
        scopeDescription.textContent = 'Puede administrar tenants y usuarios. La informacion operativa de empresas es solo lectura.';
        return;
    }

    if (rol === 'ADMIN') {
        scopeTitle.textContent = 'Administrador de empresa';
        scopeDescription.textContent = `CRUD habilitado solo para ${localStorage.getItem('tenantId') || getLoginTenant()}.`;
        return;
    }

    scopeTitle.textContent = 'Usuario operativo';
    scopeDescription.textContent = 'Puede consultar disponibilidad, sus vehiculos asociados y sus tickets del parqueadero.';
};

const conectarSSE = () => {
    if (eventSource) {
        eventSource.close();
    }

    const token = obtenerToken();
    const tenantId = localStorage.getItem('tenantId') || getLoginTenant();
    const sseUrl = token
        ? `${API_ESPACIOS_SSE}?token=${encodeURIComponent(token)}&tenantId=${encodeURIComponent(tenantId)}`
        : `${API_ESPACIOS_SSE}?tenantId=${encodeURIComponent(tenantId)}`;

    eventSource = new EventSource(sseUrl);

    eventSource.addEventListener('cambio-espacio', (event) => {
        try {
            const espacio = JSON.parse(event.data);
            actualizarCardEspacio(espacio);
            reemplazarEspacioEnEstado(espacio);
            actualizarMetricas(ultimoEstado.espacios);
            lastUpdateSpan.textContent = formatDate(new Date());
            showToast(`${espacio.nombre || 'Espacio'} cambio a ${normalizeEstado(espacio.estado)}`);
        } catch (error) {
            console.error('Error procesando evento SSE:', error);
        }
    });

    eventSource.onerror = () => setConnectionStatus(false);
    eventSource.onopen = () => setConnectionStatus(true);
};

const desconectarSSE = () => {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
};

const reemplazarEspacioEnEstado = (espacio) => {
    const index = ultimoEstado.espacios.findIndex((item) => item.id === espacio.id);
    if (index >= 0) {
        ultimoEstado.espacios[index] = { ...ultimoEstado.espacios[index], ...espacio };
    }
};

const cargarDatos = async () => {
    try {
        const [zonas, espacios] = await Promise.all([
            fetchJson(API_ZONAS),
            fetchJson(API_ESPACIOS),
        ]);

        ultimoEstado = {
            zonas: Array.isArray(zonas) ? zonas : [],
            espacios: Array.isArray(espacios) ? espacios : [],
        };

        const dashboardState = getDashboardFilteredState();
        renderizarZonasConEspacios(dashboardState.zonas, dashboardState.espacios);
        renderizarResumenZonas(ultimoEstado.zonas, ultimoEstado.espacios);
        renderDashboardGlobal(dashboardState.zonas, dashboardState.espacios);
        actualizarMetricas(dashboardState.espacios);
        setConnectionStatus(true);
        lastUpdateSpan.textContent = formatDate(new Date());
    } catch (error) {
        console.error('Error al cargar datos:', error);
        setConnectionStatus(false);
    }
};

const renderDashboardGlobal = (zonas, espacios) => {
    if (!isSuperAdmin() || getLoginTenant() !== 'global') return;

    const zonasContainerEl = document.getElementById('zonasContainer');
    if (!zonasContainerEl) return;

    const tenants = tenantAdminProfiles();
    const tenantsOperativos = tenants.filter((tenant) => tenant.tenantId !== 'global');
    const usuariosCount = document.querySelectorAll('#usuariosContainer .data-card').length;
    zonasContainerEl.innerHTML = `
        <section class="global-admin-panel">
            <div class="global-console-hero">
                <div>
                    <span>Consola SaaS</span>
                    <h2>Administracion general del sistema</h2>
                    <p>Gestion central de empresas y usuarios. Los datos operativos de cada parqueadero se mantienen separados por tenant.</p>
                </div>
                <div class="global-console-actions">
                    <button type="button" onclick="cambiarVista('empresas')">Empresas</button>
                    <button type="button" onclick="cambiarVista('usuarios')">Usuarios</button>
                </div>
            </div>
            <div class="global-summary-grid">
                <article><span>Empresas operativas</span><strong>${tenantsOperativos.length}</strong></article>
                <article><span>Zonas registradas</span><strong>${zonas.length}</strong></article>
                <article><span>Espacios totales</span><strong>${espacios.length}</strong></article>
                <article><span>Usuarios cargados</span><strong>${usuariosCount || '--'}</strong></article>
            </div>
            <div class="module-header compact">
                <div>
                    <h2>Empresas conectadas</h2>
                    <span>Accesos frontend por tenant</span>
                </div>
            </div>
            <div class="tenant-admin-grid">
                ${tenantsOperativos.map(renderTenantAdminCard).join('')}
            </div>
        </section>
    `;
};

const renderEmpresasAdmin = () => {
    const container = document.getElementById('empresasContainer');
    if (!container) return;

    container.innerHTML = tenantAdminProfiles().map(renderTenantAdminCard).join('');
};

const renderTenantAdminCard = (tenant) => `
    <article class="tenant-admin-card">
        <div class="tenant-card-top">
            <div class="brand-mark small">${escapeHtml(tenant.shortName)}</div>
            <div>
                <strong>${escapeHtml(tenant.name)}</strong>
                <span>${escapeHtml(tenant.location)}</span>
            </div>
        </div>
        <dl>
            <div><dt>Tenant ID</dt><dd>${escapeHtml(tenant.tenantId)}</dd></div>
            <div><dt>Plan</dt><dd>${escapeHtml(tenant.plan)}</dd></div>
            <div><dt>Usuarios base</dt><dd>${tenant.users.length}</dd></div>
        </dl>
        <div class="tenant-card-actions">
            <button type="button" onclick="window.location.href='/${escapeHtml(tenant.tenantId)}'">Abrir frontend</button>
            ${isSuperAdmin() ? `<button type="button" onclick="abrirFormularioTenant('${escapeHtml(tenant.tenantId)}')">Editar</button>` : ''}
        </div>
    </article>
`;

const actualizarMetricas = (espacios) => {
    const counts = espacios.reduce((acc, esp) => {
        const estado = normalizeEstado(esp.estado);
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
    }, {});

    document.getElementById('availableCount').textContent = counts.DISPONIBLE || 0;
    document.getElementById('occupiedCount').textContent = counts.OCUPADO || 0;
    document.getElementById('reservedCount').textContent = counts.RESERVADO || 0;
    document.getElementById('maintenanceCount').textContent = counts.MANTENIMIENTO || 0;
    totalSpan.textContent = `${espacios.length} espacios`;
    renderOccupancyKpi(espacios, counts);
    renderFlowChart(espacios);
};

const renderOccupancyKpi = (espacios, counts) => {
    const total = espacios.length;
    const ocupados = (counts.OCUPADO || 0) + (counts.RESERVADO || 0);
    const percent = total ? Math.round((ocupados / total) * 100) : 0;
    const ring = document.getElementById('occupancyRing');
    const percentEl = document.getElementById('occupancyPercent');
    const detailEl = document.getElementById('occupancyDetail');

    if (ring) {
        ring.style.background = `conic-gradient(var(--brand) ${percent * 3.6}deg, #e2e8f0 0deg)`;
    }
    if (percentEl) percentEl.textContent = `${percent}%`;
    if (detailEl) detailEl.textContent = `${ocupados} de ${total} espacios ocupados o reservados`;
};

const renderFlowChart = (espacios) => {
    const container = document.getElementById('flowChart');
    if (!container) return;

    const base = espacios.length || 1;
    const hours = ['06', '08', '10', '12', '14', '16', '18', '20'];
    container.innerHTML = hours.map((hour, index) => {
        const entrada = Math.max(12, Math.round(((index + 2) * 13 + base * 7) % 92));
        const salida = Math.max(10, Math.round(((index + 5) * 11 + base * 5) % 84));
        return `
            <div class="flow-column">
                <div class="flow-bars">
                    <span class="flow-in" style="height:${entrada}%"></span>
                    <span class="flow-out" style="height:${salida}%"></span>
                </div>
                <small>${hour}:00</small>
            </div>
        `;
    }).join('');
};

const getDashboardFilteredState = () => {
    const selectedTenant = document.getElementById('dashboardTenantFilter')?.value || 'global';
    if (!isSuperAdmin() || selectedTenant === 'global') {
        return ultimoEstado;
    }

    const zonas = ultimoEstado.zonas.filter((zona) => zona.tenantId === selectedTenant);
    const zonaIds = new Set(zonas.map((zona) => zona.id));
    const espacios = ultimoEstado.espacios.filter((esp) => esp.tenantId === selectedTenant || zonaIds.has(esp.idZona));
    return { zonas, espacios };
};

window.aplicarFiltroDashboard = () => {
    const dashboardState = getDashboardFilteredState();
    actualizarMetricas(dashboardState.espacios);
    renderizarZonasConEspacios(dashboardState.zonas, dashboardState.espacios);
    renderDashboardGlobal(dashboardState.zonas, dashboardState.espacios);
};

const agruparEspaciosPorZona = (zonas, espacios) => zonas.map((zona) => ({
    ...zona,
    espacios: espacios.filter((esp) => esp.idZona === zona.id),
}));

const renderizarZonasConEspacios = (zonas, espacios) => {
    if (!zonasContainer) return;

    if (!zonas.length) {
        zonasContainer.innerHTML = '<div class="empty-state">No hay zonas registradas para este tenant.</div>';
        return;
    }

    const zonasConEspacios = agruparEspaciosPorZona(zonas, espacios);

    zonasContainer.innerHTML = zonasConEspacios.map((zona) => `
        <section class="zone-section">
            <div class="zone-header">
                <h2 class="zone-title">${escapeHtml(zona.nombre || zona.codigo || zona.descripcion || 'Zona sin nombre')}</h2>
                <span class="zone-count">${zona.espacios.length} espacios</span>
            </div>
            ${
                zona.espacios.length === 0
                    ? '<div class="empty-state">Esta zona no tiene espacios registrados.</div>'
                    : `<div class="spaces-grid">${zona.espacios.map(renderizarCardEspacio).join('')}</div>`
            }
        </section>
    `).join('');
};

const renderZoneModalMap = (zona) => {
    const position = { className: 'zone-modal-plane', floor: 'floor-concrete' };
    const nombre = zona.nombre || zona.codigo || 'Zona';
    const visibleSpaces = zona.espacios.slice(0, 24);

    return `
        <article class="iso-zone ${position.className} ${position.floor}">
            <header>${escapeHtml(nombre)}</header>
            <div class="zone-fixtures" aria-hidden="true">
                <span class="lpr-camera" title="Camara LPR"></span>
                <span class="access-barrier"></span>
                <span class="traffic-sign">P</span>
            </div>
            <div class="iso-spaces">
                ${visibleSpaces.map((esp, spaceIndex) => renderIsometricSpace(esp, spaceIndex)).join('') || '<span class="map-empty">Sin espacios</span>'}
            </div>
        </article>
    `;
};

const renderIsometricSpace = (esp, index) => {
    const estado = estadoClass(esp.estado);
    const nombre = esp.nombre || `P-${index + 1}`;
    const needsCar = ['ocupado', 'reservado'].includes(estado);
    const tooltip = buildSpaceTooltip(esp, estado);

    return `
        <button type="button" class="iso-space ${estado}" title="${escapeHtml(nombre)}">
            <span>${escapeHtml(nombre)}</span>
            ${needsCar ? '<i class="car-shape"></i>' : ''}
            <small class="space-tooltip">${tooltip}</small>
        </button>
    `;
};

const buildSpaceTooltip = (esp, estado) => {
    const nombre = escapeHtml(esp.nombre || esp.id || 'Espacio');

    if (estado === 'ocupado') {
        return `
            <strong>Espacio: ${nombre}</strong>
            <span>Patente LPR: ${escapeHtml(esp.placa || esp.patente || 'ABC-123')}</span>
            <span>Tiempo de estancia: ${escapeHtml(esp.tiempoEstancia || '2h 15m')}</span>
        `;
    }

    if (estado === 'reservado') {
        return `
            <strong>Espacio: ${nombre}</strong>
            <span>Estado: Reservado</span>
            <span>Usuario: ${escapeHtml(esp.username || localStorage.getItem('username') || 'Username')}</span>
            <span>Valido hasta: ${escapeHtml(esp.validoHasta || '14:00')}</span>
        `;
    }

    return `
        <strong>Espacio: ${nombre}</strong>
        <span>Estado: ${escapeHtml(normalizeEstado(estado))}</span>
    `;
};

const estadoClass = (estado) => normalizeEstado(estado).toLowerCase();

const renderizarCardEspacio = (esp) => {
    const estado = normalizeEstado(esp.estado);
    const estadoCss = estadoClass(estado);
    const rol = localStorage.getItem('rol');
    const puedeReservar = estado === 'DISPONIBLE' && ['ADMIN', 'USER', 'Usuario', 'USUARIO'].includes(rol);

    return `
        <article data-espacio-id="${escapeHtml(esp.id)}" class="espacio-card card-${estadoCss}">
            <div class="space-name">${escapeHtml(esp.nombre || 'Espacio sin nombre')}</div>
            <div class="space-meta">
                <span>Zona: ${escapeHtml(esp.nombreZona || 'N/A')}</span>
                <span>Tipo: ${escapeHtml(esp.tipo || 'N/A')}</span>
                <span>${escapeHtml(esp.descripcion || 'Sin descripcion')}</span>
            </div>
            <div class="space-footer">
                <span class="estado-badge badge-${estadoCss}">${estado}</span>
                <span class="text-xs text-slate-400">ID ${escapeHtml(esp.id ? String(esp.id).slice(0, 8) : 'N/A')}</span>
            </div>
            <div class="boton-container">
                ${puedeReservar
                    ? `<button onclick="reservarEspacio('${escapeHtml(esp.id)}', '${escapeHtml(esp.nombreZona || '')}')" class="reserve-button mt-3">Reservar</button>`
                    : '<button disabled class="disabled-button mt-3">No disponible</button>'}
            </div>
        </article>
    `;
};

const actualizarCardEspacio = (espacio) => {
    const card = document.querySelector(`[data-espacio-id="${CSS.escape(String(espacio.id))}"]`);
    if (!card) {
        cargarDatos();
        return;
    }

    const zona = card.closest('.zone-section');
    card.outerHTML = renderizarCardEspacio({
        ...espacio,
        nombreZona: espacio.nombreZona || zona?.querySelector('.zone-title')?.textContent || '',
    });
};

const getDemoPlateForTenant = () => {
    const tenantId = localStorage.getItem('tenantId') || getLoginTenant();
    if (tenantId === 'empresa2') return 'EBB-2001';
    return 'EAA-1001';
};

const getAvailableVehiclesForReservation = async () => {
    const cached = Array.isArray(moduleCache.vehiculos) ? moduleCache.vehiculos : [];
    if (cached.length) {
        return cached
            .filter((vehiculo) => normalizeEstado(vehiculo.estadoAutorizacion || 'ACEPTADO') === 'ACEPTADO')
            .filter((vehiculo) => vehiculo.placa || vehiculo.datos?.placa);
    }

    try {
        const vehiculos = await fetchJson(API_VEHICULOS);
        moduleCache.vehiculos = Array.isArray(vehiculos) ? vehiculos : [];
        return moduleCache.vehiculos
            .filter((vehiculo) => normalizeEstado(vehiculo.estadoAutorizacion || 'ACEPTADO') === 'ACEPTADO')
            .filter((vehiculo) => vehiculo.placa || vehiculo.datos?.placa);
    } catch (error) {
        console.warn('No se pudieron cargar vehiculos para la reserva:', error);
        return [];
    }
};

window.reservarEspacio = async (idEspacio, nombreZona) => {
    const now = new Date();
    const defaultDate = now.toISOString().slice(0, 10);
    const defaultTime = now.toTimeString().slice(0, 5);
    const vehiculosReserva = await getAvailableVehiclesForReservation();
    const vehiculoReserva = vehiculosReserva[0] || null;
    const placaDefault = document.getElementById('placaInput')?.value.trim() || vehiculoReserva?.placa || vehiculoReserva?.datos?.placa || getDemoPlateForTenant();
    const dniDefault = vehiculoReserva?.ownerDni || vehiculoReserva?.datos?.ownerDni || localStorage.getItem('dni') || document.getElementById('dniInput')?.value.trim() || getDemoDniForSession();
    const placaField = {
        name: 'placa',
        label: 'Placa del vehiculo',
        required: true,
        readonly: true,
        value: placaDefault.toUpperCase(),
        pattern: '[A-Z]{3}-[0-9]{4}',
        help: vehiculoReserva
            ? 'Placa tomada del vehiculo autorizado. Para cambiarla, actualice el vehiculo del usuario.'
            : 'Placa fija para esta reserva. Demo: empresa1 EAA-1001, empresa2 EBB-2001.',
    };

    abrirFormulario({
        title: 'Reservar espacio y generar ticket',
        scope: nombreZona || 'Zona seleccionada',
        introHtml: `
            <section class="reservation-summary">
                <article><span>Espacio</span><strong>${escapeHtml(String(idEspacio).slice(0, 8))}</strong></article>
                <article><span>Zona</span><strong>${escapeHtml(nombreZona || 'N/A')}</strong></article>
                <article><span>Tarifa</span><strong>$1.50/h</strong></article>
            </section>
        `,
        fields: [
            placaField,
            { name: 'dni', label: 'DNI', required: true, value: dniDefault, pattern: '[0-9]{1,10}' },
            { name: 'modalidad', label: 'Tipo de reserva', type: 'select', required: true, value: 'ahora', onchange: 'actualizarTotalReserva()', options: [
                { value: 'ahora', label: 'En este momento' },
                { value: 'programada', label: 'Programada' },
            ] },
            { name: 'fecha', label: 'Fecha', type: 'date', required: true, value: defaultDate },
            { name: 'hora', label: 'Hora de ingreso', type: 'time', required: true, value: defaultTime },
            { name: 'horasEstimadas', label: 'Horas estimadas', type: 'number', required: true, value: '1', min: '1', max: '24', oninput: 'actualizarTotalReserva()' },
        ],
        submitText: 'Generar ticket',
        onSubmit: async (values) => {
            const horas = Number(values.horasEstimadas);
            if (!Number.isFinite(horas) || horas < 1 || horas > 24) {
                throw new Error('Las horas estimadas deben estar entre 1 y 24.');
            }
            const fechaReserva = new Date(`${values.fecha}T${values.hora}:00`);
            const total = calcularTotalReserva(horas);
            const payload = {
                placa: values.placa.toUpperCase(),
                dni: values.dni,
                idEspacio,
                nombreZona,
            };

            if (values.modalidad === 'ahora') {
                const ticket = await fetchJson(API_TICKETS, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                showToast(`Ticket generado ${formatDate(ticket.fechaHoraIngreso || new Date())}. Total estimado: $${total}.`);
                await cargarDatos();
                await cargarModulo('tickets');
                return;
            }

            guardarTicketProgramado({
                ...payload,
                id: `RES-${Date.now()}`,
                codigo: `RES-${String(Date.now()).slice(-6)}`,
                estado: 'RESERVADO',
                activo: true,
                fechaHoraIngreso: fechaReserva.toISOString(),
                valorRecaudado: total,
                tenantId: localStorage.getItem('tenantId') || getLoginTenant(),
                programado: true,
            });
            showToast(`Reserva programada para ${formatDate(fechaReserva)}. Total estimado: $${total}.`);
            await cargarModulo('tickets');
        },
    });
};

const calcularTotalReserva = (horas) => (Number(horas) * 1.5).toFixed(2);

window.actualizarTotalReserva = () => {
    const horas = Number(document.getElementById('horasEstimadas')?.value || 1);
    const total = calcularTotalReserva(Number.isFinite(horas) ? horas : 1);
    const summary = document.querySelector('.reservation-summary article:last-child strong');
    if (summary) summary.textContent = `$1.50/h · Estimado $${total}`;
};

const getScheduledTicketsKey = () => `scheduledTickets:${localStorage.getItem('tenantId') || getLoginTenant()}:${localStorage.getItem('dni') || localStorage.getItem('username') || 'user'}`;

const getScheduledTickets = () => {
    try {
        return JSON.parse(localStorage.getItem(getScheduledTicketsKey()) || '[]');
    } catch (error) {
        return [];
    }
};

const guardarTicketProgramado = (ticket) => {
    const tickets = getScheduledTickets();
    tickets.unshift(ticket);
    localStorage.setItem(getScheduledTicketsKey(), JSON.stringify(tickets.slice(0, 20)));
};

const cargarModulo = async (view) => {
    const configs = {
        usuarios: { url: API_USERS, container: 'usuariosContainer', renderer: renderUsuario },
        roles: { url: API_ROLES, container: 'rolesContainer', renderer: renderRol },
        vehiculos: { url: API_VEHICULOS, container: 'vehiculosContainer', renderer: renderVehiculo },
        tickets: { url: API_TICKETS, container: 'ticketsContainer', renderer: renderTicket },
        auditoria: { url: API_AUDIT, container: 'auditContainer', renderer: renderAudit },
    };

    if (view === 'zonas') {
        renderizarResumenZonas(ultimoEstado.zonas, ultimoEstado.espacios);
        return;
    }

    const config = configs[view];
    if (!config) return;

    const container = document.getElementById(config.container);
    container.innerHTML = '<div class="empty-state">Cargando informacion...</div>';

    try {
        if (view === 'vehiculos' && isEndUser() && !moduleCache.tickets.length) {
            const ticketData = await fetchJson(API_TICKETS);
            moduleCache.tickets = Array.isArray(ticketData) ? ticketData : ticketData?.items || ticketData?.content || [];
        }
        const data = await fetchJson(config.url);
        let items = Array.isArray(data) ? data : data?.items || data?.content || [];
        if (view === 'tickets' && isEndUser()) {
            items = [...getScheduledTickets(), ...items];
        }
        moduleCache[view] = items;
        renderModuloFiltrado(view);
    } catch (error) {
        console.error(`Error cargando modulo ${view}:`, error);
        container.innerHTML = '<div class="empty-state">No se pudo cargar este modulo. Verifique API Gateway y permisos.</div>';
    }
};

window.filtrarModuloActual = (view) => renderModuloFiltrado(view);

const renderModuloFiltrado = (view) => {
    const configs = {
        usuarios: { container: 'usuariosContainer', renderer: renderUsuario, filter: filtrarUsuarios },
        roles: { container: 'rolesContainer', renderer: renderRol, filter: filtrarRoles },
        vehiculos: { container: 'vehiculosContainer', renderer: renderVehiculo, filter: filtrarVehiculos },
        tickets: { container: 'ticketsContainer', renderer: renderTicket, filter: filtrarTickets },
        auditoria: { container: 'auditContainer', renderer: renderAudit, filter: filtrarAuditoria },
    };

    if (view === 'zonas') {
        renderizarResumenZonas(ultimoEstado.zonas, ultimoEstado.espacios);
        return;
    }

    const config = configs[view];
    if (!config) return;

    const container = document.getElementById(config.container);
    const items = config.filter(moduleCache[view] || []);
    const emptyMessage = getEmptyModuleMessage(view);
    container.innerHTML = items.length
        ? items.map(config.renderer).join('')
        : `<div class="empty-state">${emptyMessage}</div>`;

    if (view === 'vehiculos') renderLprPanel(items);
};

const getEmptyModuleMessage = (view) => {
    if (isEndUser() && view === 'vehiculos') {
        return 'No hay vehiculos asociados a tus tickets o ingresos registrados.';
    }
    if (isEndUser() && view === 'tickets') {
        return 'Todavia no tienes tickets creados por ingreso al parqueadero.';
    }
    return 'No existen registros para mostrar.';
};

const includesText = (value, query) => String(value ?? '').toLowerCase().includes(query);

const filtrarUsuarios = (items) => {
    const query = document.getElementById('usuariosSearch')?.value.trim().toLowerCase() || '';
    const tenant = document.getElementById('usuariosTenantFilter')?.value || '';
    const status = document.getElementById('usuariosStatusFilter')?.value || '';

    return items.filter((u) => {
        const userTenant = u.tenantId || '';
        const userStatus = String(u.status || u.estado || 'activo').toLowerCase();
        const searchable = [
            u.username,
            u.email,
            u.person?.dni,
            u.dni,
            getUserRoles(u),
            userTenant,
        ].join(' ').toLowerCase();

        return (!query || searchable.includes(query))
            && (!tenant || userTenant === tenant)
            && (!status || userStatus === status);
    });
};

const filtrarVehiculos = (items) => {
    const query = document.getElementById('vehiculosSearch')?.value.trim().toLowerCase() || '';
    const tipo = document.getElementById('vehiculosTipoFilter')?.value || '';
    const userPlates = getUserTicketPlates();

    return items.filter((v) => {
        const vehicleType = String(v.tipo || v.tipoVehiculo || v.getTipo || '').toLowerCase();
        const searchable = [v.placa, v.marca, v.modelo, vehicleType, v.tenantId].join(' ').toLowerCase();
        const belongsToUser = !isEndUser() || userPlates.has(String(v.placa || '').toUpperCase());
        return belongsToUser && (!query || searchable.includes(query)) && (!tipo || vehicleType.includes(tipo));
    });
};

const getUserTicketPlates = () => {
    const dni = localStorage.getItem('dni');
    return new Set((moduleCache.tickets || [])
        .filter((ticket) => !dni || String(ticket.dni || '') === String(dni))
        .map((ticket) => String(ticket.placa || ticket.vehiculo?.placa || '').toUpperCase())
        .filter(Boolean));
};

const filtrarRoles = (items) => {
    const query = document.getElementById('rolesSearch')?.value.trim().toLowerCase() || '';
    return getRolesPermitidos(items).filter((role) => {
        const params = parseRoleParams(role);
        const searchable = [role.name, role.description, params.permissions?.join(' '), params.tenantId].join(' ').toLowerCase();
        return !query || searchable.includes(query);
    });
};

const filtrarTickets = (items) => {
    const query = document.getElementById('ticketsSearch')?.value.trim().toLowerCase() || '';
    const estado = document.getElementById('ticketsStatusFilter')?.value || '';
    const dni = localStorage.getItem('dni');

    return items.filter((t) => {
        const ticketStatus = normalizeEstado(t.estado);
        const searchable = [t.codigo, t.id, t.placa, t.vehiculo?.placa, t.idEspacio, t.espacioId].join(' ').toLowerCase();
        const belongsToUser = !isEndUser() || !dni || String(t.dni || '') === String(dni);
        return belongsToUser && (!query || searchable.includes(query)) && (!estado || ticketStatus === estado);
    });
};

const filtrarAuditoria = (items) => {
    const query = document.getElementById('auditSearch')?.value.trim().toLowerCase() || '';
    const severity = document.getElementById('auditSeverityFilter')?.value || '';

    return items.filter((a) => {
        const eventSeverity = String(a.severity || a.level || 'INFO').toUpperCase();
        const searchable = [a.eventType, a.action, a.username, a.userId, a.source, a.service, a.ipAddress].join(' ').toLowerCase();
        return (!query || searchable.includes(query)) && (!severity || eventSeverity === severity);
    });
};

const renderDataCard = (title, rows, modifier = '') => `
    <article class="data-card ${modifier}">
        <strong>${escapeHtml(title)}</strong>
        <dl>${rows.map(([key, value]) => `
            <div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>
        `).join('')}</dl>
    </article>
`;

const renderDataCardWithActions = (title, rows, actions = '') => `
    <article class="data-card">
        <div class="data-card-header">
            <strong>${escapeHtml(title)}</strong>
            ${actions}
        </div>
        <dl>${rows.map(([key, value]) => `
            <div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>
        `).join('')}</dl>
    </article>
`;

const getUserRoles = (u) => {
    const rawRoles = u.roles || u.authorities || u.permisos || u.role || u.rol || [];
    const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
    return roles
        .map((role) => role?.name || role?.authority || role?.role || role)
        .filter(Boolean)
        .map((role) => String(role).replace('ROLE_', ''))
        .join(', ') || 'Sin rol';
};

const getUserRoleList = (u) => {
    const rawRoles = u.roles || u.authorities || u.permisos || u.role || u.rol || [];
    const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
    return roles
        .map((role) => role?.name || role?.authority || role?.role || role)
        .filter(Boolean)
        .map((role) => String(role).replace('ROLE_', ''));
};

const renderUsuario = (u) => {
    const username = u.username || u.email || u.id;
    const tenant = u.tenantId || localStorage.getItem('tenantId') || getLoginTenant();
    const roles = getUserRoles(u);
    const inicial = String(username || '?').slice(0, 1).toUpperCase();
    const actions = ['ADMIN', 'SUPER_ADMIN'].includes(localStorage.getItem('rol'))
        ? `
            <div class="card-actions-row">
                <button class="icon-action" type="button" onclick='abrirFormularioUsuario(${JSON.stringify(u)})'>Editar</button>
                <button class="icon-action" type="button" onclick='abrirAsignacionRol(${JSON.stringify(u)})'>Rol</button>
                <button class="icon-action danger" type="button" onclick="eliminarUsuario('${escapeHtml(u.id)}')">Eliminar</button>
            </div>
        `
        : '';

    return `
        <article class="data-card user-card">
            <div class="user-card-top">
                <div class="user-avatar">${escapeHtml(inicial)}</div>
                <div>
                    <strong>${escapeHtml(username)}</strong>
                    <span class="user-tenant-chip">${escapeHtml(tenant)}</span>
                </div>
            </div>
            <dl>
                <div><dt>Rol</dt><dd><span class="role-inline">${escapeHtml(roles)}</span></dd></div>
                <div><dt>DNI</dt><dd>${escapeHtml(u.person?.dni || u.dni || 'N/A')}</dd></div>
                <div><dt>Tenant</dt><dd>${escapeHtml(tenant)}</dd></div>
            </dl>
            ${actions}
        </article>
    `;
};

const rolePermissionsCatalog = [
    { id: 'usuarios.leer', label: 'Ver usuarios' },
    { id: 'usuarios.crear', label: 'Crear usuarios' },
    { id: 'vehiculos.gestionar', label: 'Gestionar vehiculos' },
    { id: 'zonas.gestionar', label: 'Gestionar zonas' },
    { id: 'tickets.gestionar', label: 'Gestionar tickets' },
    { id: 'auditoria.leer', label: 'Ver auditoria' },
    { id: 'reportes.leer', label: 'Ver reportes' },
    { id: 'barrera.manual', label: 'Apertura manual' },
];

const parseRoleParams = (role) => {
    try {
        const parsed = JSON.parse(role.description || '{}');
        if (parsed && parsed.__parkingRole) return parsed;
    } catch (error) {
        return { note: role.description || '', permissions: [], tenantId: null };
    }
    return { note: role.description || '', permissions: [], tenantId: null };
};

const stringifyRoleParams = ({ tenantId, note, permissions }) => JSON.stringify({
    __parkingRole: true,
    tenantId,
    note,
    permissions,
});

const getDisplayRoleName = (role) => {
    const tenantId = localStorage.getItem('tenantId') || getLoginTenant();
    const prefix = `${tenantId}_`;
    return role.name?.startsWith(prefix) ? role.name.slice(prefix.length) : role.name;
};

const getRolesPermitidos = (roles) => {
    if (isSuperAdmin()) return roles;
    const tenantId = localStorage.getItem('tenantId') || getLoginTenant();
    return roles.filter((role) => {
        const params = parseRoleParams(role);
        return !['SUPER_ADMIN'].includes(role.name)
            && (['ADMIN', 'USER'].includes(role.name) || role.name?.startsWith(`${tenantId}_`) || params.tenantId === tenantId);
    });
};

const renderRol = (role) => {
    const params = parseRoleParams(role);
    const permissions = params.permissions || [];
    const tenant = params.tenantId || (['ADMIN', 'USER', 'SUPER_ADMIN'].includes(role.name) ? 'Sistema' : 'Global');
    return `
        <article class="data-card role-card">
            <div class="role-card-head">
                <div>
                    <strong>${escapeHtml(getDisplayRoleName(role))}</strong>
                    <span class="user-tenant-chip">${escapeHtml(tenant)}</span>
                </div>
                <span class="role-state ${role.active === false ? 'inactive' : ''}">${role.active === false ? 'Inactivo' : 'Activo'}</span>
            </div>
            <p>${escapeHtml(params.note || role.description || 'Sin parametros adicionales')}</p>
            <div class="permission-list">
                ${permissions.length
                    ? permissions.map((permission) => `<span>${escapeHtml(getPermissionLabel(permission))}</span>`).join('')
                    : '<span>Sin permisos definidos</span>'}
            </div>
        </article>
    `;
};

const getPermissionLabel = (permissionId) => rolePermissionsCatalog.find((item) => item.id === permissionId)?.label || permissionId;

const renderRolePrivileges = (role) => {
    const params = parseRoleParams(role);
    const permissions = params.permissions || [];
    return `
        <div class="role-preview-card">
            <div>
                <strong>${escapeHtml(getDisplayRoleName(role))}</strong>
                <span>${escapeHtml(params.tenantId || 'Sistema')}</span>
            </div>
            <p>${escapeHtml(params.note || role.description || 'Sin descripcion')}</p>
            <div class="permission-list">
                ${permissions.length
                    ? permissions.map((permission) => `<span>${escapeHtml(getPermissionLabel(permission))}</span>`).join('')
                    : '<span>Sin permisos parametrizados</span>'}
            </div>
        </div>
    `;
};

window.actualizarVistaRolSeleccionado = () => {
    const roleId = document.getElementById('roleId')?.value;
    const container = document.getElementById('selectedRolePreview');
    if (!container) return;
    const role = (moduleCache.roles || []).find((item) => String(item.id) === String(roleId));
    container.innerHTML = role ? renderRolePrivileges(role) : '<div class="empty-state compact">Seleccione un rol para ver sus privilegios.</div>';
};

const renderVehiculo = (v) => {
    const actions = canMutateTenantData()
        ? `
            <div class="card-actions-row">
                <button class="icon-action" type="button" onclick='abrirFormularioVehiculo("${escapeHtml(v.tipo || v.tipoVehiculo || 'Auto')}", ${JSON.stringify(v)})'>Editar</button>
                <button class="icon-action danger" type="button" onclick="eliminarVehiculo('${escapeHtml(v.id)}')">Eliminar</button>
            </div>
        `
        : '';
    const userInfo = isEndUser()
        ? [
            ['Estado', 'Aceptado'],
            ['Informacion', 'Vehiculo asociado a tus tickets'],
        ]
        : [];

    return renderDataCardWithActions(v.placa || v.id, [
        ['Tipo', v.tipo || v.tipoVehiculo || v.getTipo || 'Vehiculo'],
        ['Propietario', v.ownerUsername || v.ownerDni || 'N/A'],
        ['Autorizacion', v.estadoAutorizacion || 'ACEPTADO'],
        ['Marca', v.marca || 'N/A'],
        ['Modelo', v.modelo || 'N/A'],
        ...userInfo,
        ['Tenant', v.tenantId || localStorage.getItem('tenantId') || getLoginTenant()],
    ], actions);
};

const renderLprPanel = (vehiculos) => {
    const container = document.getElementById('lprPanel');
    if (!container) return;

    const recientes = vehiculos.slice(0, 4);
    container.innerHTML = `
        <article>
            <span>Lectura de placas</span>
            <strong>${recientes[0]?.placa || 'Sin lecturas'}</strong>
            <small>Camara acceso principal</small>
        </article>
        <div class="lpr-list">
            ${recientes.map((v, index) => `
                <div>
                    <strong>${escapeHtml(v.placa || 'N/A')}</strong>
                    <span>${index % 2 === 0 ? 'Autorizado' : 'Revision'}</span>
                </div>
            `).join('') || '<div><strong>N/A</strong><span>Sin registros</span></div>'}
        </div>
    `;
};

const renderTicket = (t) => {
    const estado = t.estado ? normalizeEstado(t.estado) : (t.activo === false ? 'CERRADO' : 'ACTIVO');
    const placa = t.placa || t.vehiculo?.placa || 'N/A';
    const entrada = t.fechaHoraIngreso || t.horaEntrada || t.createdAt || t.fechaEntrada || new Date().toISOString();
    const tarifa = t.total || t.valor || t.monto || calcularTarifaReferencial(entrada);

    return `
        <article class="data-card ticket-card">
            <div class="ticket-card-code">
                <span>Ticket</span>
                <strong>${escapeHtml(t.codigo || t.id || 'N/A')}</strong>
            </div>
            <dl>
                <div><dt>Placa</dt><dd>${escapeHtml(placa)}</dd></div>
                <div><dt>Estado</dt><dd><span class="estado-badge badge-${estadoClass(estado)}">${escapeHtml(estado)}</span></dd></div>
                <div><dt>Espacio</dt><dd>${escapeHtml(t.idEspacio || t.espacioId || 'N/A')}</dd></div>
                <div><dt>Zona</dt><dd>${escapeHtml(t.nombreZona || 'N/A')}</dd></div>
                <div><dt>Ingreso</dt><dd>${escapeHtml(formatDate(entrada))}</dd></div>
                <div><dt>Tarifa</dt><dd>$${escapeHtml(tarifa)}</dd></div>
            </dl>
            <div class="qr-box" aria-hidden="true">${escapeHtml(String(t.codigo || t.id || 'QR').slice(0, 6))}</div>
        </article>
    `;
};

const calcularTarifaReferencial = (entrada) => {
    const diffMs = Math.max(0, Date.now() - new Date(entrada).getTime());
    const horas = Math.max(1, Math.ceil(diffMs / 3600000));
    return (horas * 1.5).toFixed(2);
};

const renderAudit = (a) => {
    const severity = String(a.severity || a.level || 'INFO').toUpperCase();
    return `
        <article class="audit-item severity-${severity.toLowerCase()}">
            <div class="audit-dot"></div>
            <div>
                <div class="audit-title">
                    <strong>${escapeHtml(a.eventType || a.action || a.id)}</strong>
                    <span>${escapeHtml(severity)}</span>
                </div>
                <dl>
                    <div><dt>Actor</dt><dd>${escapeHtml(a.username || a.userId || 'N/A')}</dd></div>
                    <div><dt>Fecha</dt><dd>${escapeHtml(a.createdAt || a.timestamp || 'N/A')}</dd></div>
                    <div><dt>Origen</dt><dd>${escapeHtml(a.source || a.service || 'N/A')}</dd></div>
                    <div><dt>IP</dt><dd>${escapeHtml(a.ipAddress || a.ip || 'N/A')}</dd></div>
                </dl>
            </div>
        </article>
    `;
};

const renderizarResumenZonas = (zonas, espacios) => {
    const container = document.getElementById('zonasResumenContainer');
    if (!container) return;

    if (!zonas.length) {
        container.innerHTML = '<div class="empty-state">No hay zonas registradas.</div>';
        return;
    }

    const estadoFiltro = document.getElementById('zonasEstadoFilter')?.value || '';
    const zonasFiltradas = zonas.filter((zona) => {
        if (!estadoFiltro) return true;
        return espacios.some((esp) => esp.idZona === zona.id && normalizeEstado(esp.estado) === estadoFiltro);
    });

    if (!zonasFiltradas.length) {
        container.innerHTML = '<div class="empty-state">No hay zonas con ese estado.</div>';
        return;
    }

    container.innerHTML = zonasFiltradas.map((zona) => {
        const espaciosZona = espacios.filter((esp) => esp.idZona === zona.id);
        const total = espaciosZona.length || Number(zona.capacidad) || 0;
        const disponibles = espaciosZona.filter((esp) => normalizeEstado(esp.estado) === 'DISPONIBLE').length;
        const ocupados = espaciosZona.filter((esp) => normalizeEstado(esp.estado) === 'OCUPADO').length;
        const reservados = espaciosZona.filter((esp) => normalizeEstado(esp.estado) === 'RESERVADO').length;
        const mantenimiento = espaciosZona.filter((esp) => normalizeEstado(esp.estado) === 'MANTENIMIENTO').length;
        const ocupacion = total ? Math.round(((ocupados + reservados) / total) * 100) : 0;
        const actions = canMutateTenantData()
            ? `
                <div class="card-actions-row">
                    <button class="icon-action" type="button" onclick='event.stopPropagation(); abrirFormularioZona(${JSON.stringify(zona)})'>Editar</button>
                    <button class="icon-action danger" type="button" onclick="event.stopPropagation(); eliminarZona('${escapeHtml(zona.id)}')">Eliminar</button>
                </div>
            `
            : '';

        return `
            <article class="zone-summary-card" onclick="abrirModalZona('${escapeHtml(zona.id)}')">
                <div class="zone-summary-top">
                    <div>
                        <strong>${escapeHtml(zona.nombre || zona.codigo || zona.id)}</strong>
                        <span>${escapeHtml(zona.tenantId || localStorage.getItem('tenantId') || getLoginTenant())}</span>
                    </div>
                    ${actions}
                </div>
                <div class="zone-occupancy-line">
                    <span style="width:${ocupacion}%"></span>
                </div>
                <dl>
                    <div><dt>Ocupados</dt><dd>${ocupados}/${total}</dd></div>
                    <div><dt>Disponibles</dt><dd>${disponibles}/${total}</dd></div>
                    <div><dt>Reservados</dt><dd>${reservados}/${total}</dd></div>
                    <div><dt>Mantenimiento</dt><dd>${mantenimiento}/${total}</dd></div>
                </dl>
                <button class="zone-open-button" type="button">Ver mapa de zona</button>
            </article>
        `;
    }).join('');
};

window.abrirModalZona = (zonaId) => {
    const zona = ultimoEstado.zonas.find((item) => String(item.id) === String(zonaId));
    if (!zona) return;

    const espaciosZona = ultimoEstado.espacios.filter((esp) => esp.idZona === zona.id);
    const zonaConEspacios = { ...zona, espacios: espaciosZona };
    const counts = espaciosZona.reduce((acc, esp) => {
        const estado = normalizeEstado(esp.estado);
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
    }, {});
    const total = espaciosZona.length || Number(zona.capacidad) || 0;
    const profile = tenantProfiles[zona.tenantId] || getTenantProfile();

    document.getElementById('zoneModalBrand').textContent = profile.shortName || 'SA';
    document.getElementById('zoneModalTitle').textContent = `Detalle Operativo - Zona: ${zona.nombre || zona.codigo || 'Zona'}`;
    document.getElementById('zoneModalTenant').textContent = `${profile.shortName || 'SA'} ${zona.tenantId || localStorage.getItem('tenantId') || getLoginTenant()}`;
    document.getElementById('zoneModalMeta').textContent = `Nivel 1 | Capacidad: ${total} espacios`;
    document.getElementById('zoneModalUpdated').textContent = `Ultima actualizacion: ${formatDate(new Date())}`;
    document.getElementById('zoneModalStats').innerHTML = `
        <article><span>Ocupados</span><strong>${counts.OCUPADO || 0}/${total}</strong></article>
        <article><span>Disponibles</span><strong>${counts.DISPONIBLE || 0}/${total}</strong></article>
        <article><span>Reservados</span><strong>${counts.RESERVADO || 0}/${total}</strong></article>
        <article><span>Mantenimiento</span><strong>${counts.MANTENIMIENTO || 0}/${total}</strong></article>
    `;
    document.getElementById('zoneModalMap').innerHTML = `
        <div class="isometric-map modal-map">
            ${renderZoneModalMap(zonaConEspacios)}
            <div class="map-legend">
                <strong>Mapa leyenda</strong>
                <span><i class="legend-dot free"></i>Disponible</span>
                <span><i class="legend-dot busy"></i>Ocupado</span>
                <span><i class="legend-dot reserved"></i>Reservado</span>
                <span><i class="legend-dot maintenance"></i>Mantenimiento</span>
            </div>
        </div>
    `;
    document.getElementById('zoneModal').classList.remove('hidden');
};

window.cerrarModalZona = (event) => {
    if (event && !event.target.classList.contains('modal-backdrop')) return;
    document.getElementById('zoneModal')?.classList.add('hidden');
};

let activeFormSubmit = null;

const abrirFormulario = ({ title, scope, fields, submitText = 'Guardar', introHtml = '', onSubmit }) => {
    const modal = document.getElementById('formModal');
    const form = document.getElementById('dynamicForm');
    document.getElementById('formModalTitle').textContent = title;
    document.getElementById('formModalScope').textContent = scope;
    activeFormSubmit = onSubmit;

    form.innerHTML = `
        ${introHtml}
        <div class="form-fields">
            ${fields.map(renderFormField).join('')}
        </div>
        <footer class="form-actions">
            <button type="button" class="secondary-action" onclick="cerrarFormulario()">Cancelar</button>
            <button type="submit" class="primary-action compact">${escapeHtml(submitText)}</button>
        </footer>
    `;

    form.onsubmit = async (event) => {
        event.preventDefault();
        const values = getFormValues(form);
        try {
            await activeFormSubmit(values);
            cerrarFormulario();
        } catch (error) {
            console.error('Error enviando formulario:', error);
            alert(error.message || 'No se pudo guardar el formulario.');
        }
    };

    modal.classList.remove('hidden');
    form.querySelector('input, select, textarea')?.focus();
};

const renderFormField = (field) => {
    if (field.type === 'hidden') {
        return `<input type="hidden" id="${field.name}" name="${field.name}" value="${escapeHtml(field.value ?? '')}" />`;
    }

    const required = field.required ? 'required' : '';
    const readonly = field.readonly ? 'readonly' : '';
    const common = `id="${field.name}" name="${field.name}" ${required} ${readonly}`;
    const value = escapeHtml(field.value ?? '');
    const help = field.help ? `<small>${escapeHtml(field.help)}</small>` : '';

    if (field.type === 'select') {
        return `
            <label class="${field.full ? 'full' : ''}">
                <span>${escapeHtml(field.label)}</span>
                <select ${common} ${field.onchange ? `onchange="${field.onchange}"` : ''}>
                    ${(field.options || []).map((option) => `
                        <option value="${escapeHtml(option.value)}" ${String(option.value) === String(field.value ?? '') ? 'selected' : ''}>${escapeHtml(option.label)}</option>
                    `).join('')}
                </select>
                ${help}
            </label>
        `;
    }

    if (field.type === 'textarea') {
        return `
            <label class="full">
                <span>${escapeHtml(field.label)}</span>
                <textarea ${common} rows="${field.rows || 3}" placeholder="${escapeHtml(field.placeholder || '')}">${value}</textarea>
                ${help}
            </label>
        `;
    }

    if (field.type === 'checkbox') {
        return `
            <label class="check-field ${field.full ? 'full' : ''}">
                <input type="checkbox" ${common} ${field.value ? 'checked' : ''} />
                <span>${escapeHtml(field.label)}</span>
                ${help}
            </label>
        `;
    }

    return `
        <label class="${field.full ? 'full' : ''}">
            <span>${escapeHtml(field.label)}</span>
            <input type="${field.type || 'text'}" ${common} value="${value}" placeholder="${escapeHtml(field.placeholder || '')}" ${field.pattern ? `pattern="${escapeHtml(field.pattern)}"` : ''} ${field.min ? `min="${escapeHtml(field.min)}"` : ''} ${field.max ? `max="${escapeHtml(field.max)}"` : ''} ${field.oninput ? `oninput="${field.oninput}"` : ''} />
            ${help}
        </label>
    `;
};

const getFormValues = (form) => Array.from(form.elements).reduce((acc, input) => {
    if (!input.name) return acc;
    acc[input.name] = input.type === 'checkbox' ? input.checked : String(input.value).trim();
    return acc;
}, {});

window.cerrarFormulario = (event) => {
    if (event && !event.target.classList.contains('modal-backdrop')) return;
    document.getElementById('formModal')?.classList.add('hidden');
    activeFormSubmit = null;
};

window.crearZonaRapida = async () => {
    if (!canMutateTenantData()) return;
    abrirFormularioZona();
};

const abrirFormularioZona = (zona = null) => {
    abrirFormulario({
        title: zona ? 'Editar zona' : 'Nueva zona',
        scope: localStorage.getItem('tenantId') || getLoginTenant(),
        fields: [
            { name: 'nombre', label: 'Nombre de zona', required: true, value: zona?.nombre || 'Zona Operativa', help: '2 a 50 caracteres. Letras, numeros, espacios y guiones.' },
            { name: 'tipo', label: 'Tipo de zona', type: 'select', required: true, value: zona?.tipo || 'GENERAL', options: [
                { value: 'GENERAL', label: 'General' },
                { value: 'VIP', label: 'VIP' },
                { value: 'ESTUDIANTES', label: 'Estudiantes' },
                { value: 'PREFERENCIAL', label: 'Preferencial' },
            ] },
            { name: 'capacidad', label: 'Capacidad', type: 'number', required: true, value: zona?.capacidad || '10', min: '1', max: '200' },
            { name: 'descripcion', label: 'Descripcion', type: 'textarea', value: zona?.descripcion || `Creada desde frontend ${getLoginTenant()}`, full: true },
        ],
        onSubmit: async (values) => {
            const capacidad = Number(values.capacidad);
            if (!Number.isFinite(capacidad) || capacidad <= 0 || capacidad > 200) {
                throw new Error('Capacidad invalida. Debe estar entre 1 y 200.');
            }

            await fetchJson(zona ? `${API_ZONAS}/${zona.id}` : API_ZONAS, {
                method: zona ? 'PUT' : 'POST',
                body: JSON.stringify({
                    nombre: values.nombre,
                    descripcion: values.descripcion,
                    capacidad,
                    tipo: values.tipo,
                }),
            });
            showToast(zona ? 'Zona actualizada.' : 'Zona creada.');
            await cargarDatos();
            await cargarModulo('zonas');
        },
    });
};

window.eliminarZona = async (id) => {
    if (!canMutateTenantData() || !confirmAction('Eliminar esta zona?')) return;
    await fetchJson(`${API_ZONAS}/${id}`, { method: 'DELETE' });
    showToast('Zona eliminada.');
    await cargarDatos();
    await cargarModulo('zonas');
};

window.crearVehiculoRapido = async () => {
    if (!canMutateTenantData()) return;

    abrirFormularioVehiculo('Auto');
};

window.cambiarTipoVehiculoFormulario = () => {
    const tipo = document.getElementById('tipo')?.value || 'Auto';
    abrirFormularioVehiculo(tipo);
};

const abrirFormularioVehiculo = (tipo, vehiculo = null) => {
    const currentYear = new Date().getFullYear();
    const datosVehiculo = vehiculo?.datos || vehiculo || {};
    const tipoNormalizado = ['Auto', 'Moto', 'Camioneta'].includes(tipo) ? tipo : 'Auto';
    const extraFields = {
        Auto: [
            { name: 'numeroPuertas', label: 'Numero de puertas', type: 'number', required: true, value: datosVehiculo.numeroPuertas || '4', min: '2', max: '5' },
            { name: 'capacidadMaletero', label: 'Maletero litros', type: 'number', required: true, value: datosVehiculo.capacidadMaletero || '400', min: '0', max: '1000' },
        ],
        Moto: [
            { name: 'subtipoMoto', label: 'Tipo de motocicleta', type: 'select', required: true, value: datosVehiculo.tipo || 'Scooter', options: [
                { value: 'Deportiva', label: 'Deportiva' },
                { value: 'Crucero', label: 'Crucero' },
                { value: 'Naked', label: 'Naked' },
                { value: 'Scooter', label: 'Scooter' },
                { value: 'Enduro', label: 'Enduro' },
            ] },
        ],
        Camioneta: [
            { name: 'cabina', label: 'Cabina', type: 'select', required: true, value: datosVehiculo.cabina || 'Doble', options: [
                { value: 'Simple', label: 'Simple' },
                { value: 'Doble', label: 'Doble' },
            ] },
            { name: 'capacidadCarga', label: 'Capacidad carga kg', type: 'number', required: true, value: datosVehiculo.capacidadCarga || '1000', min: '0', max: '10000' },
        ],
    };

    abrirFormulario({
        title: vehiculo ? 'Editar vehiculo' : 'Nuevo vehiculo',
        scope: localStorage.getItem('tenantId') || getLoginTenant(),
        fields: [
            { name: 'tipo', label: 'Tipo de vehiculo', type: 'select', required: true, value: tipoNormalizado, onchange: 'cambiarTipoVehiculoFormulario()', options: [
                { value: 'Auto', label: 'Auto' },
                { value: 'Moto', label: 'Moto' },
                { value: 'Camioneta', label: 'Camioneta' },
            ] },
            { name: 'placa', label: 'Placa', required: true, value: datosVehiculo.placa || vehiculo?.placa || 'ABC-1234', pattern: '[A-Z]{3}-[0-9]{4}', help: 'Formato requerido: ABC-1234' },
            { name: 'ownerDni', label: 'DNI propietario', required: true, value: datosVehiculo.ownerDni || vehiculo?.ownerDni || getDemoDniForSession(), pattern: '[0-9]{1,10}', help: 'Define a que usuario/persona pertenece esta placa.' },
            { name: 'ownerUsername', label: 'Usuario propietario', value: datosVehiculo.ownerUsername || vehiculo?.ownerUsername || localStorage.getItem('username') || '', pattern: '[A-Za-z0-9._-]*' },
            { name: 'estadoAutorizacion', label: 'Autorizacion', type: 'select', required: true, value: datosVehiculo.estadoAutorizacion || vehiculo?.estadoAutorizacion || 'ACEPTADO', options: [
                { value: 'ACEPTADO', label: 'Aceptado' },
                { value: 'PENDIENTE', label: 'Pendiente' },
                { value: 'RECHAZADO', label: 'Rechazado' },
            ] },
            { name: 'marca', label: 'Marca', required: true, value: datosVehiculo.marca || 'Toyota' },
            { name: 'modelo', label: 'Modelo', required: true, value: datosVehiculo.modelo || 'Corolla' },
            { name: 'color', label: 'Color', required: true, value: datosVehiculo.color || 'Blanco' },
            { name: 'anio', label: 'Anio', type: 'number', required: true, value: String(datosVehiculo.anio || currentYear), min: '1900', max: String(currentYear) },
            { name: 'clasificacion', label: 'Clasificacion', required: true, value: datosVehiculo.clasificacion || (tipoNormalizado === 'Auto' ? 'Sedan' : tipoNormalizado) },
            ...(extraFields[tipoNormalizado] || []),
        ],
        onSubmit: async (values) => {
            const datos = {
                placa: values.placa.toUpperCase(),
                ownerDni: values.ownerDni,
                ownerUsername: values.ownerUsername,
                estadoAutorizacion: values.estadoAutorizacion,
                marca: values.marca,
                modelo: values.modelo,
                color: values.color,
                anio: Number(values.anio),
                clasificacion: values.clasificacion,
            };

            if (values.tipo === 'Auto') {
                datos.numeroPuertas = Number(values.numeroPuertas);
                datos.capacidadMaletero = Number(values.capacidadMaletero);
            } else if (values.tipo === 'Moto') {
                datos.tipo = values.subtipoMoto;
            } else if (values.tipo === 'Camioneta') {
                datos.cabina = values.cabina;
                datos.capacidadCarga = Number(values.capacidadCarga);
            }

            await fetchJson(vehiculo ? `${API_VEHICULOS}/${vehiculo.id}` : API_VEHICULOS, {
                method: vehiculo ? 'PUT' : 'POST',
                body: JSON.stringify({ tipo: values.tipo, datos }),
            });
            showToast(vehiculo ? 'Vehiculo actualizado.' : 'Vehiculo creado.');
            await cargarModulo('vehiculos');
        },
    });
};

window.eliminarVehiculo = async (id) => {
    if (!canMutateTenantData() || !confirmAction('Eliminar este vehiculo?')) return;
    await fetchJson(`${API_VEHICULOS}/${id}`, { method: 'DELETE' });
    showToast('Vehiculo eliminado.');
    await cargarModulo('vehiculos');
};

window.crearUsuarioRapido = async () => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(localStorage.getItem('rol'))) return;
    abrirFormularioUsuario();
};

const abrirFormularioUsuario = (usuario = null) => {
    const sessionTenant = localStorage.getItem('tenantId') || getLoginTenant();
    const defaultTenant = isSuperAdmin() ? (usuario?.tenantId || 'empresa1') : sessionTenant;
    const person = usuario?.person || usuario || {};
    const tenantField = isSuperAdmin()
        ? { name: 'tenantId', label: 'Tenant', required: true, value: defaultTenant, help: 'Solo el administrador global puede asignar tenant.' }
        : { name: 'tenantId', type: 'hidden', value: sessionTenant };

    abrirFormulario({
        title: usuario ? 'Editar usuario' : 'Nuevo usuario',
        scope: isSuperAdmin() ? 'Administracion global' : `Tenant asignado: ${sessionTenant}`,
        fields: [
            tenantField,
            ...(usuario ? [{ name: 'username', label: 'Username', required: true, value: usuario.username || '', pattern: '[A-Za-z0-9._-]+' }] : []),
            { name: 'dni', label: 'DNI', required: !usuario, value: person.dni || String(Math.floor(1000000000 + Math.random() * 8999999999)), pattern: '[0-9]{1,10}' },
            { name: 'firstName', label: 'Nombre', required: !usuario, value: person.firstName || usuario?.firstName || 'Demo', pattern: '[A-Za-z]+' },
            { name: 'middleName', label: 'Segundo nombre', value: person.middleName || usuario?.middleName || '', pattern: '[A-Za-z]*' },
            { name: 'lastName', label: 'Apellido', required: !usuario, value: person.lastName || usuario?.lastName || 'Usuario', pattern: '[A-Za-z]+' },
            { name: 'email', label: 'Email', type: 'email', required: !usuario, value: person.email || usuario?.email || 'usuario@test.com' },
            { name: 'phone', label: 'Telefono', value: person.phone || usuario?.phone || '0999999999', pattern: '[0-9]*' },
            { name: 'nationality', label: 'Nacionalidad', value: person.nationality || usuario?.nationality || 'Ecuatoriana' },
            ...(usuario ? [{ name: 'active', label: 'Usuario activo', type: 'checkbox', value: usuario.active !== false, full: true }] : []),
            { name: 'address', label: 'Direccion', type: 'textarea', value: person.address || usuario?.address || '', full: true },
        ],
        onSubmit: async (values) => {
            const tenantId = isSuperAdmin() ? values.tenantId : sessionTenant;
            const body = usuario
                ? {
                    tenantId,
                    username: values.username,
                    active: values.active,
                    firstName: values.firstName,
                    middleName: values.middleName,
                    lastName: values.lastName,
                    email: values.email,
                    phone: values.phone,
                    address: values.address,
                    nationality: values.nationality,
                }
                : { ...values, tenantId };

            await fetchJson(usuario ? `${API_USERS}/${usuario.id}` : API_USERS, {
                method: usuario ? 'PUT' : 'POST',
                body: JSON.stringify(body),
            });
            showToast(usuario ? 'Usuario actualizado.' : 'Usuario creado.');
            await cargarModulo('usuarios');
        },
    });
};

window.eliminarUsuario = async (id) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(localStorage.getItem('rol')) || !confirmAction('Eliminar este usuario?')) return;
    await fetchJson(`${API_USERS}/${id}`, { method: 'DELETE' });
    showToast('Usuario eliminado.');
    await cargarModulo('usuarios');
};

window.crearRolRapido = async () => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(localStorage.getItem('rol'))) return;

    const tenantId = localStorage.getItem('tenantId') || getLoginTenant();
    const fields = [
        { name: 'name', label: 'Nombre del rol', required: true, value: 'OPERADOR', pattern: '[A-Za-z0-9._-]+', help: 'Maximo 25 caracteres. Para admins de empresa se guardara con prefijo del tenant.' },
        ...(isSuperAdmin()
            ? [{ name: 'tenantId', label: 'Tenant del rol', required: true, value: 'global' }]
            : [{ name: 'tenantId', type: 'hidden', value: tenantId }]),
        { name: 'note', label: 'Descripcion / parametros', type: 'textarea', value: 'Rol operativo personalizado', full: true },
        ...rolePermissionsCatalog.map((permission) => ({
            name: `perm_${permission.id}`,
            label: permission.label,
            type: 'checkbox',
            value: ['usuarios.leer', 'vehiculos.gestionar'].includes(permission.id),
        })),
    ];

    abrirFormulario({
        title: 'Nuevo rol parametrizado',
        scope: isSuperAdmin() ? 'Administrador global' : `Tenant asignado: ${tenantId}`,
        fields,
        onSubmit: async (values) => {
            const roleTenant = isSuperAdmin() ? values.tenantId : tenantId;
            const cleanName = values.name.toUpperCase().replace(/^ROLE_/, '');
            const roleName = roleTenant && roleTenant !== 'global' ? `${roleTenant}_${cleanName}` : cleanName;
            if (roleName.length > 25) {
                throw new Error('El nombre final del rol supera 25 caracteres. Use un nombre mas corto.');
            }
            const permissions = rolePermissionsCatalog
                .filter((permission) => values[`perm_${permission.id}`])
                .map((permission) => permission.id);

            await fetchJson(API_ROLES, {
                method: 'POST',
                body: JSON.stringify({
                    name: roleName,
                    description: stringifyRoleParams({
                        tenantId: roleTenant,
                        note: values.note,
                        permissions,
                    }),
                }),
            });
            showToast('Rol creado.');
            await cargarModulo('roles');
        },
    });
};

window.abrirAsignacionRol = async (usuario) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(localStorage.getItem('rol'))) return;

    if (!moduleCache.roles.length) {
        moduleCache.roles = await fetchJson(API_ROLES);
    }
    const roles = getRolesPermitidos(moduleCache.roles)
        .filter((role) => isSuperAdmin() || role.name !== 'SUPER_ADMIN');
    if (!roles.length) {
        alert('No hay roles disponibles para asignar.');
        return;
    }
    const currentRoles = getUserRoleList(usuario);
    const availableRoles = roles.filter((role) => !currentRoles.includes(role.name) && !currentRoles.includes(getDisplayRoleName(role)));
    const selectableRoles = availableRoles.length ? availableRoles : roles;
    const currentRolesHtml = currentRoles.length
        ? currentRoles.map((roleName) => `<span>${escapeHtml(roleName)}</span>`).join('')
        : '<span>Sin roles reportados por el servicio</span>';

    abrirFormulario({
        title: `Asignar rol a ${usuario.username || usuario.id}`,
        scope: usuario.tenantId || localStorage.getItem('tenantId') || getLoginTenant(),
        introHtml: `
            <section class="role-assignment-panel">
                <div class="current-role-box">
                    <strong>Roles actuales</strong>
                    <div class="permission-list">${currentRolesHtml}</div>
                    <small>Alcance limitado al tenant autorizado.</small>
                </div>
                <div>
                    <strong>Privilegios del rol seleccionado</strong>
                    <div id="selectedRolePreview">${renderRolePrivileges(selectableRoles[0])}</div>
                </div>
            </section>
        `,
        fields: [
            { name: 'roleId', label: 'Rol disponible para agregar', type: 'select', required: true, value: selectableRoles[0].id, onchange: 'actualizarVistaRolSeleccionado()', options: selectableRoles.map((role) => ({
                value: role.id,
                label: `${getDisplayRoleName(role)} - ${parseRoleParams(role).note || role.description || 'Sin descripcion'}`,
            })) },
        ],
        submitText: 'Asignar rol',
        onSubmit: async (values) => {
            await fetchJson(`${API_USERS}/${usuario.id}/roles/${values.roleId}`, { method: 'POST' });
            showToast('Rol asignado.');
            await cargarModulo('usuarios');
        },
    });
};

window.crearTenantRapido = async () => {
    if (!isSuperAdmin()) return;
    abrirFormularioTenant();
};

const abrirFormularioTenant = (tenantId = null) => {
    const tenant = tenantId
        ? tenantAdminProfiles().find((item) => item.tenantId === tenantId)
        : null;
    abrirFormulario({
        title: tenant ? 'Editar tenant' : 'Crear tenant',
        scope: 'Super admin',
        fields: [
            { name: 'id', label: 'Tenant ID', required: true, value: tenant?.tenantId || 'empresa3', pattern: '[A-Za-z0-9._-]+', help: 'Ejemplo: empresa3' },
            { name: 'name', label: 'Nombre comercial', required: true, value: tenant?.name || 'Park Empresa 3' },
            { name: 'plan', label: 'Plan', value: tenant?.plan || 'Operacion empresarial' },
            { name: 'location', label: 'Ubicacion', value: tenant?.location || 'Campus principal' },
            { name: 'active', label: 'Tenant activo', type: 'checkbox', value: true, full: true },
        ],
        onSubmit: async (values) => {
            await fetchJson(tenant ? `${API_TENANTS}/${tenant.tenantId}` : API_TENANTS, {
                method: tenant ? 'PUT' : 'POST',
                body: JSON.stringify({
                    id: values.id,
                    name: values.name,
                    plan: values.plan,
                    location: values.location,
                    active: values.active,
                }),
            });
            showToast(tenant ? 'Tenant actualizado.' : 'Tenant creado.');
            renderEmpresasAdmin();
        },
    });
};

window.abrirFormularioZona = abrirFormularioZona;
window.abrirFormularioVehiculo = abrirFormularioVehiculo;
window.abrirFormularioUsuario = abrirFormularioUsuario;
window.abrirFormularioTenant = abrirFormularioTenant;

window.addEventListener('DOMContentLoaded', () => {
    ensureTenantPath();
    pintarTenantLogin();
});

(async () => {
    ensureTenantPath();

    const rol = localStorage.getItem('rol');
    const tenantId = localStorage.getItem('tenantId');

    if (isLoginPath() && rol && tenantId) {
        window.location.replace(`/${tenantId}`);
        return;
    }

    if (!isLoginPath() && !rol) {
        window.location.replace('/login');
        return;
    }

    if (rol) {
        await mostrarDashboard();
    } else {
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
    }

    setInterval(() => {
        if (localStorage.getItem('rol')) {
            cargarDatos();
        }
    }, 30000);
})();
