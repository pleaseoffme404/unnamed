document.addEventListener('DOMContentLoaded', () => {

    apiFetch('/api/auth/verificar', 'GET').then(data => {
        if (data.success && data.autenticado && data.tipo === 'admin') {
            window.location.href = '/dashboard/index.html';
        }
    }).catch(() => {});

    const loginForm = document.getElementById('login-form');
    const loginButton = document.querySelector('button[type="submit"]');
    const loginFeedback = document.getElementById('login-feedback');
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if(loginButton) {
                loginButton.disabled = true;
                loginButton.textContent = 'Ingresando...';
            }
            if(loginFeedback) loginFeedback.style.display = 'none';

            const data = {
                correo: emailInput.value,
                password: passwordInput.value
            };

            try {
                const response = await apiFetch('/api/auth/login', 'POST', data);
                if (response.success) {
                    window.location.href = '/dashboard/index.html';
                }
            } catch (error) {
                if(loginFeedback) {
                    loginFeedback.textContent = error.message || 'Error al iniciar sesión';
                    loginFeedback.className = 'feedback-message error';
                    loginFeedback.style.display = 'block';
                }
                if(loginButton) {
                    loginButton.disabled = false;
                    loginButton.textContent = 'Entrar';
                }
            }
        });
    }
});