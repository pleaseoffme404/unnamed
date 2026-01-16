document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('login-form');
    const feedback = document.getElementById('login-feedback'); 

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button');
            const originalText = btn.textContent;

            btn.disabled = true;
            btn.textContent = 'Entrando...';
            if(feedback) {
                feedback.style.display = 'none';
                feedback.className = 'feedback-message';
            }

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo: email, password: password })
                });

                const data = await res.json();

                if (data.success) {
                    if (data.user.rol === 'admin') {
                        window.location.href = '/dashboard/index.html';
                    } else {
                        showError(feedback, 'Este portal es solo para administradores.');
                    }
                } else {
                    showError(feedback, data.message || 'Credenciales incorrectas');
                }
            } catch (error) {
                console.error(error);
                showError(feedback, 'Error de conexión con el servidor.');
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }

    function showError(element, message) {
        if(element) {
            element.textContent = message;
            element.classList.add('error'); 
            element.style.display = 'block';
        }
    }

});