document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcherButton = document.getElementById('theme-switcher-button');
    const body = document.body;
    const themeIcon = themeSwitcherButton.querySelector('.theme-icon');

    const applyTheme = (theme) => {
        if (theme === 'light') {
            body.classList.add('light-theme');
        } else {
            body.classList.remove('light-theme');
        }
    };

    let currentTheme = localStorage.getItem('theme');
    if (!currentTheme) {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        currentTheme = prefersDark ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
    }
    applyTheme(currentTheme);

    themeSwitcherButton.addEventListener('click', () => {
        const isLight = body.classList.contains('light-theme');
        const newTheme = isLight ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });
});