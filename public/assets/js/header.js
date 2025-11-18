document.addEventListener('DOMContentLoaded', () => {
    
    (async function checkAuthentication() {
        try {
            const response = await api.get('/auth/check');
            if (!response.autenticado || response.user.rol !== 'admin') {
                throw new Error('No autorizado');
            }
            
            populateHeader(response.user);

        } catch (error) {
            console.log('Auth check failed, redirecting to login.');
            window.location.href = '/index.html'; 
        }
    })();

    function populateHeader(user) {
        const usernameEl = document.getElementById('admin-username');
        const avatarEl = document.getElementById('admin-avatar');
        
        if (usernameEl) {
            usernameEl.textContent = user.nombre || user.correo;
        }
        
        if (avatarEl) {
            avatarEl.src = user.imagen ? user.imagen : '/assets/img/default-avatar.png'; // Asegúrate de tener un avatar default
            avatarEl.alt = user.nombre || 'Avatar';
        }
    }

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
    
    const themeCheckbox = document.getElementById('admin-theme-checkbox');
    if (themeCheckbox) {
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeCheckbox.checked = currentTheme === 'dark';

        themeCheckbox.addEventListener('change', (e) => {
            const theme = e.target.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
    }
});