document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;

    if (path === '/portal/' || path === '/portal/index.html') {
        return;
    }

    try {
        const res = await fetch('/api/tutores/app/me');

        if (res.status === 401 || res.status === 403) {
            console.warn('Sesión no válida o rol incorrecto. Redirigiendo...');
            localStorage.removeItem('tutor_user'); 
            window.location.href = '/portal/';
            return;
        }

        const data = await res.json();
        if (!data.success) {
            window.location.href = '/portal/';
        } else {
            localStorage.setItem('tutor_user', JSON.stringify(data.data));
        }

    } catch (error) {
        console.error('Error de autenticación:', error);
        window.location.href = '/portal/';
    }
});
document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
    checkUrgentAnnouncements();
});

function renderNavbar() {
    const adminEmail = 'admin@bullnodes.com'; 
    const currentPath = window.location.pathname;

    const navHtml = `
    <nav class="portal-navbar">
        <div class="portal-container nav-container">
            <a href="/portal/dashboard/" class="nav-logo">
                <i class="fa-solid fa-school" style="color: var(--accent-primary);"></i>
                <span>Escuela</span>
            </a>

            <button class="nav-toggle" id="navToggle" aria-label="Abrir menú">
                <i class="fa-solid fa-bars"></i>
            </button>

            <div class="nav-menu" id="navMenu">
                <a href="/portal/dashboard/" class="nav-link ${currentPath.includes('dashboard') ? 'active' : ''}">
                    <i class="fa-solid fa-house-user"></i> Mis Hijos
                </a>

                 <a href="/portal/anuncios/" class="nav-link ${currentPath.includes('anuncios') ? 'active' : ''}">
                    <i class="fa-solid fa-bullhorn"></i> Avisos
                </a>

                <a href="/portal/perfil/" class="nav-link ${currentPath.includes('perfil') ? 'active' : ''}">
                    <i class="fa-solid fa-user-gear"></i> Mi Perfil
                </a>
                
                <a href="mailto:${adminEmail}?subject=Solicitud de Cita Escolar" class="nav-link">
                    <i class="fa-solid fa-calendar-check"></i> Solicitar Cita
                </a>

                <div class="nav-divider"></div>

                <button class="nav-link btn-theme-nav" id="themeToggleNav">
                    <i class="fa-solid fa-moon"></i> Tema Oscuro
                </button>

                <button class="nav-link btn-logout-nav" id="logoutBtnNav">
                    <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
                </button>
            </div>
        </div>
    </nav>
    `;

    document.body.insertAdjacentHTML('afterbegin', navHtml);

    const toggleBtn = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const logoutBtn = document.getElementById('logoutBtnNav');
    const themeBtn = document.getElementById('themeToggleNav');

    if(toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = toggleBtn.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.replace('fa-bars', 'fa-xmark');
            } else {
                icon.classList.replace('fa-xmark', 'fa-bars');
            }
        });
    }

    if(logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/tutores/app/logout', { method: 'POST' });
                window.location.href = '/portal/';
            } catch (error) {
                window.location.href = '/portal/';
            }
        });
    }

    if(themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);
        });
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
    updateThemeIcon(savedTheme === 'dark');
}

function updateThemeIcon(isDark) {
    const btn = document.getElementById('themeToggleNav');
    if(!btn) return;
    if (isDark) {
        btn.innerHTML = '<i class="fa-solid fa-sun"></i> Tema Claro';
    } else {
        btn.innerHTML = '<i class="fa-solid fa-moon"></i> Tema Oscuro';
    }
}

async function checkUrgentAnnouncements() {
    try {
        const res = await fetch('/api/tutores/app/anuncios');
        const response = await res.json();

        if (response.success && response.data.length > 0) {
            const ultimoAnuncio = response.data[0];
            
            if (ultimoAnuncio.prioridad === 'urgente') {
                const nav = document.querySelector('.portal-navbar');
                if(!nav) return;

                const existingBanner = document.querySelector('.urgent-banner');
                if(existingBanner) return;

                const bannerHtml = `
                    <div class="urgent-banner">
                        <div class="urgent-banner-content">
                            <div class="urgent-text">
                                <i class="fa-solid fa-triangle-exclamation"></i>
                                <span><strong>${ultimoAnuncio.titulo}:</strong> ${ultimoAnuncio.contenido.substring(0, 80)}${ultimoAnuncio.contenido.length > 80 ? '...' : ''}</span>
                            </div>
                            <a href="/portal/anuncios/" class="urgent-link">Ver detalles <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                    </div>
                `;
                nav.parentNode.insertBefore(document.createRange().createContextualFragment(bannerHtml), nav.nextSibling);
            }
        }
    } catch (error) {
        console.error(error);
    }
}