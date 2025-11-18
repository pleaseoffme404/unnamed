document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const forgotForm = document.getElementById('forgot-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = '';

    const userField = document.getElementById('user');
    const passwordField = document.getElementById('password');

    const user = userField.value;
    const password = passwordField.value;

    if (!user || !password) {
        errorMessage.textContent = 'Por favor, ingresa usuario y contraseña.';
        return;
    }

    try {
        const data = await apiFetch('/api/login', 'POST', { user, password });

        if (data.success) {
            window.location.href = '/dashboard';
        } else {
            errorMessage.textContent = data.message || 'Error desconocido.';
        }
    } catch (error) {
        errorMessage.textContent = error.message || 'Credenciales inválidas o error de red.';
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    errorMessage.textContent = '';
    successMessage.textContent = '';

    const emailField = document.getElementById('email');
    const email = emailField.value;

    if (!email) {
        errorMessage.textContent = 'Por favor, ingresa un correo electrónico.';
        return;
    }

    try {
        const data = await apiFetch('/api/forgot-password', 'POST', { email });

        if (data.success) {
            successMessage.textContent = data.message || 'Si el correo existe, se enviará un enlace.';
            emailField.value = '';
        } else {
            errorMessage.textContent = data.message || 'No se pudo procesar la solicitud.';
        }
    } catch (error) {
        errorMessage.textContent = error.message || 'Error al contactar al servidor.';
    }
}