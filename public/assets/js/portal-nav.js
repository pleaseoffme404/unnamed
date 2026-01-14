document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
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

    toggleBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        const icon = toggleBtn.querySelector('i');
        if (navMenu.classList.contains('active')) {
            icon.classList.replace('fa-bars', 'fa-xmark');
        } else {
            icon.classList.replace('fa-xmark', 'fa-bars');
        }
    });

    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/tutores/app/logout', { method: 'POST' });
            window.location.href = '/portal/';
        } catch (error) {
            window.location.href = '/portal/';
        }
    });

    themeBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeIcon(isDark);
    });

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