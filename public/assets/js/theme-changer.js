document.addEventListener('DOMContentLoaded', () => {
    const switcher = document.querySelector('#switcher');
    
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
    }

    function applyTheme(theme) {
        const body = document.body;
        
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            if(switcher) switcher.classList.add('switcher--dark');
        } else {
            body.classList.remove('dark-theme');
            if(switcher) switcher.classList.remove('switcher--dark');
        }
    }

    if (switcher) {
        switcher.addEventListener('click', () => {
            const body = document.body;
            const isDark = body.classList.contains('dark-theme');
            
            const newTheme = isDark ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }

    initTheme();
});