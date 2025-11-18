document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

async function handleRegister(e) {
    e.preventDefault();
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    errorMessage.textContent = '';
    successMessage.textContent = '';

    const form = e.target;
    const username = form.username.value;
    const correo = form.correo.value;
    const password = form.password.value;

    if (!username || !correo || !password) {
        errorMessage.textContent = 'Todos los campos son obligatorios.';
        return;
    }

    try {
        const data = await apiFetch('/api/register', 'POST', { username, correo, password });

        if (data.success) {
            successMessage.textContent = '¡Usuario registrado exitosamente!';
            form.reset();
        } else {
            errorMessage.textContent = data.message || 'Error desconocido.';
        }
    } catch (error) {
        errorMessage.textContent = error.message || 'Error al registrar el usuario.';
    }
}