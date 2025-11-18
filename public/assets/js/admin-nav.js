document.addEventListener('DOMContentLoaded', async () => {
    
    const headerHTML = `
    <header class="admin-header">
        <div class="header-left">
            <h1 class="header-title">Admin</h1>
        </div>
        
        <nav class="header-nav">
            <a href="/dashboard/index.html" data-path="/dashboard/">Dashboard</a>
            <a href="/alumnos/index.html" data-path="/alumnos/">Alumnos</a>
            <a href="/tutores/index.html" data-path="/tutores/">Tutores</a>
            <a href="/historial/index.html" data-path="/historial/">Historial</a>
            <a href="/announcements/index.html" data-path="/announcements/">Anuncios</a>
            <a href="/usuarios/register/index.html" data-path="/usuarios/">Usuarios</a>
        </nav>

        <div class="header-right">
            <div id="admin-user-info" style="display: none;"> <img src="" alt="Avatar" id="admin-avatar">
                <span id="admin-username">Cargando...</span>
            </div>
            <button id="admin-logout-button">Salir</button>
            
            <svg id="switcher" class="switcher" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
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
    </header>
    `;

    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.header-nav a');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('data-path');
        if (currentPath.includes(linkPath)) {
            link.classList.add('active');
        }
    });

    initThemeSwitcher();

    await checkAuthentication();
});


function initThemeSwitcher() {
    const switcher = document.getElementById('switcher');
    const body = document.body;

    const applyTheme = (theme) => {
        if (theme === 'light') {
            body.classList.add('light-theme');
            switcher.classList.remove('switcher--dark');
        } else {
            body.classList.remove('light-theme');
            switcher.classList.add('switcher--dark');
        }
    };

    let currentTheme = localStorage.getItem('theme');
    if (!currentTheme) {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        currentTheme = prefersDark ? 'dark' : 'light';
    }
    
    applyTheme(currentTheme);
    localStorage.setItem('theme', currentTheme); 

    switcher.addEventListener('click', () => {
        const isLight = body.classList.contains('light-theme');
        const newTheme = isLight ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });
}

async function checkAuthentication() {
    try {
        if (typeof api === 'undefined') {
            console.error('Error: api.js debe cargarse antes que admin-nav.js');
            return;
        }

        const response = await api.get('/auth/check');
        if (!response.autenticado || response.user.rol !== 'admin') {
            throw new Error('No autorizado');
        }
        
        const userInfoContainer = document.getElementById('admin-user-info');
        const usernameEl = document.getElementById('admin-username');
        const avatarEl = document.getElementById('admin-avatar');
        
        if (usernameEl) usernameEl.textContent = response.user.nombre || response.user.correo;
        if (avatarEl) {
            avatarEl.src = response.user.imagen ? response.user.imagen : '/assets/img/default-avatar.png';
        }
        
        userInfoContainer.style.display = 'flex';

        const logoutButton = document.getElementById('admin-logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
                try {
                    await api.post('/auth/logout');
                    window.location.href = '/index.html';
                } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                }
            });
        }

    } catch (error) {
        console.log('Verificación de sesión fallida, redirigiendo al login.');
        window.location.href = '/index.html'; 
    }
}