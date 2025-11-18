document.addEventListener('DOMContentLoaded', () => {
    const switcher = document.getElementById('switcher');
    const body = document.body;

    if (!switcher) {
        return;
    }

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
});