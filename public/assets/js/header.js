document.addEventListener('DOMContentLoaded', () => {
    
    const currentPath = window.location.pathname;
    
    const isLoginPage = currentPath === '/' || (
        currentPath.includes('index.html') && 
        !currentPath.includes('/dashboard') && 
        !currentPath.includes('/alumnos') && 
        !currentPath.includes('/tutores') && 
        !currentPath.includes('/historial') &&
        !currentPath.includes('/announcements') &&
        !currentPath.includes('/scanQR') &&
        !currentPath.includes('/grupos') &&
        !currentPath.includes('/reportes')
    );

    if (isLoginPage) return;

    const headerContainer = document.querySelector('header');

    async function initializeHeader() {
        try {
            const data = await apiFetch('/api/auth/verificar', 'GET');
            
            if (data.success && data.autenticado && data.tipo === 'admin') {
                renderHeader(data.usuario);
            } else {
                window.location.href = '/index.html';
            }
        } catch (error) {
            window.location.href = '/index.html';
        }
    }

    function renderHeader(user) {
        if (!headerContainer) return;

        const p = window.location.pathname;
        const active = (path) => p.includes(path) ? 'active' : '';

        const html = `
            <div class="header-left">
                <h1 class="header-title">Admin Panel</h1>
            </div>
            
            <nav class="header-nav">
                <a href="/dashboard/index.html" class="${active('dashboard')}">Dashboard</a>
                <a href="/alumnos/index.html" class="${active('alumnos')}">Alumnos</a>
                <a href="/grupos/index.html" class="${active('grupos')}">Grupos</a>
                <a href="/tutores/index.html" class="${active('tutores')}">Tutores</a>
                <a href="/historial/index.html" class="${active('historial')}">Historial</a>
                <a href="/reportes/index.html" class="${active('reportes')}">Reportes</a>
                <a href="/announcements/index.html" class="${active('announcements')}">Anuncios</a>
            </nav>

            <div class="header-right">
                <a href="/scanQR/index.html" class="btn-nav-qr">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <path d="M3 14h7v7H3z"></path>
                    </svg>
                    <span>Escanear QR</span>
                </a>

                <div id="admin-user-info" style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <span id="admin-username" style="font-weight: 500; font-size: 14px;">${user.nombre || user.email}</span>
                    <img src="${user.imagen || '/assets/img/default-avatar.png'}" alt="Avatar" id="admin-avatar" 
                         style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 2px solid var(--bg-input);">
                </div>

                <button id="admin-logout-button" style="margin-left: 10px;" class="btn btn-danger btn-sm">Salir</button>

                <svg id="switcher" class="switcher" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" style="margin-left: 10px;">
                    <circle class="switcher__sun" cx="12" cy="12" r="6" mask="url(#moon-mask)" fill="currentColor" />
                    <g class="switcher__sun-beams" stroke="currentColor">
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </g>
                    <mask id="moon-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <circle class="switcher__moon" cx="24" cy="10" r="6" fill="black" />
                    </mask>
                </svg>
            </div>
        `;

        headerContainer.innerHTML = html;
        setupListeners();
        
        const currentTheme = localStorage.getItem('theme');
        const switcher = document.getElementById('switcher');
        if (currentTheme === 'dark' && switcher) {
            document.body.classList.add('dark-theme');
            switcher.classList.add('switcher--dark');
        } else {
            document.body.classList.remove('dark-theme');
            if(switcher) switcher.classList.remove('switcher--dark');
        }
    }

    function setupListeners() {
        const logoutBtn = document.getElementById('admin-logout-button');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await apiFetch('/api/auth/logout', 'POST');
                    window.location.href = '/index.html';
                } catch (error) {
                    console.error(error);
                }
            });
        }

        const switcher = document.getElementById('switcher');
        if(switcher) {
            switcher.addEventListener('click', () => {
                const body = document.body;
                const isDark = body.classList.contains('dark-theme');
                
                if (isDark) {
                    body.classList.remove('dark-theme');
                    switcher.classList.remove('switcher--dark');
                    localStorage.setItem('theme', 'light');
                } else {
                    body.classList.add('dark-theme');
                    switcher.classList.add('switcher--dark');
                    localStorage.setItem('theme', 'dark');
                }
            });
        }
    }

    initializeHeader();
});