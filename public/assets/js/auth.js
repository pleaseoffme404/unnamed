document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('login-form');
    const loginFeedback = document.getElementById('login-feedback');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const correo = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const data = { correo: correo, password: password };
                const response = await api.post('/auth/login', data);
                
                if (response.success) {
                    window.location.href = '/dashboard/index.html';
                }
            } catch (error) {
                showFeedback(loginFeedback, error.message || 'Error al iniciar sesión.', 'error');
            }
        });
    }

    const forgotForm = document.getElementById('forgot-password-form');
    const forgotFeedback = document.getElementById('forgot-feedback');

    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const correo = document.getElementById('email-forgot').value;
            
            try {
                const response = await api.post('/auth/forgot-password', { correo_electronico: correo });
                showFeedback(forgotFeedback, response.message, 'success');
            } catch (error) {
                showFeedback(forgotFeedback, error.message || 'Error al enviar el correo.', 'error');
            }
        });
    }
    
    function showFeedback(element, message, type) {
        if (!element) return;
        element.textContent = message;
        element.className = `feedback-message ${type}`;
        element.style.display = 'block';
    }
});