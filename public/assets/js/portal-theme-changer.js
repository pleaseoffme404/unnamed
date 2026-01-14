document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;

    const currentTheme = localStorage.getItem('theme') || 'light';
    applyTheme(currentTheme);

    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            body.classList.remove('dark-theme');
            if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isDark = body.classList.contains('dark-theme');
            const newTheme = isDark ? 'light' : 'dark';
            
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }
});