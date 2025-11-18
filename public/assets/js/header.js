document.addEventListener('DOMContentLoaded', () => {
    
    const header = document.querySelector('.main-header');
    if (!header) return;

    let isUserLoggedIn = false;
    let userData = {}; 

    async function initializeHeader() {
        try {
            const data = await apiFetch('/api/check-auth', 'GET');
            
            if (data.success && data.autenticado) {
                isUserLoggedIn = true;
                userData = data.user; 
            } else {
                handleNotAuthenticated();
            }
        } catch (error) {
            console.log('Visitante no autenticado.');
            handleNotAuthenticated();
        } finally {
            renderHeader();
            setupThemeChanger();
            setupHeaderListeners();
        }
    }

    function renderHeader() {
        const path = window.location.pathname;
        const active = (href) => (path.startsWith(href) ? 'active' : '');
        const logoHref = isUserLoggedIn ? '/dashboard' : '/';
        
        let headerLeftHtml = `
            <div class="header-left">
                <a href="${logoHref}" class="header-title">Unnamed</a>
        `;

        if (isUserLoggedIn) {
            headerLeftHtml += `
                <nav class="header-nav">
                    <a href="/dashboard" class="nav-link ${active('/dashboard')}">Dashboard</a>
                    <a href="/alumnos" class="nav-link ${active('/alumnos')}">Alumnos</a>
                    <a href="/tutores" class="nav-link ${active('/tutores')}">Tutores</a>
                    <a href="/announcements" class="nav-link ${active('/announcements')}">Anuncios</a>
                    <a href="/historial" class="nav-link ${active('/historial')}">Historial</a>
                    <a href="/scanQR" class="nav-link ${active('/scanQR')}">Escaner QR</a>
                </nav>
            `;
        }
        
        headerLeftHtml += `</div>`;

        let headerRightHtml = `<div class="header-right">`;

        headerRightHtml += `
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
        `;

        if (isUserLoggedIn) {
            const displayName = userData.nombre_usuario || userData.boleta;
            const displayEmail = userData.email || 'No email';
            
            headerRightHtml += `
                <div class="profile-menu">
                    <img src="/assets/img/logonobg.png" alt="Foto de perfil" class="profile-pic" id="profile-pic-btn">
                    <div class="profile-dropdown" id="profile-dropdown">
                        <div class="dropdown-header">
                            <p>${displayName}</p>
                            <span>${displayEmail}</span>
                        </div>
                        <a href="#" class="dropdown-item logout" id="logout-button">Cerrar Sesión</a>
                    </div>
                </div>
            `;
        }

        headerRightHtml += `</div>`;

        header.innerHTML = headerLeftHtml + headerRightHtml;
    }

    function setupThemeChanger() {
        const switcher = document.getElementById('switcher');
        const body = document.body;
        if (!switcher) return;

        const applyTheme = (theme) => {
            if (theme === 'dark') {
                body.classList.add('dark-theme');
                switcher.classList.add('switcher--dark');
            } else {
                body.classList.remove('dark-theme');
                switcher.classList.remove('switcher--dark');
            }
        };

        let currentTheme = localStorage.getItem('theme') || 'light';
        applyTheme(currentTheme);

        switcher.addEventListener('click', () => {
            const isDark = body.classList.contains('dark-theme');
            const newTheme = isDark ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }

    function setupHeaderListeners() {
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await apiFetch('/api/logout', 'POST');
                    window.location.href = '/';
                } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                }
            });
        }
        
        const profilePicBtn = document.getElementById('profile-pic-btn');
        const profileDropdown = document.getElementById('profile-dropdown');
        
        if (profilePicBtn && profileDropdown) {
            profilePicBtn.addEventListener('click', () => {
                profileDropdown.classList.toggle('visible');
            });
            
            document.addEventListener('click', (e) => {
                if (!profilePicBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                    profileDropdown.classList.remove('visible');
                }
            });
        }
    }

    function handleNotAuthenticated() {
        const pathname = window.location.pathname;

        const publicPages = [
            '/',
            '/index.html',
            '/forgot-password/',
            '/forgot-password/index.html'
        ];

        const isProtectedPage = !publicPages.includes(pathname);

        if (isProtectedPage) {
            window.location.href = '/';
        }
    }

    initializeHeader();
});