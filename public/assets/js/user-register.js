document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('form-registrar-alumno');
    const formFeedback = document.getElementById('form-feedback');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(registerForm);
            
            try {
                const response = await api.postForm('/alumnos', formData);
                
                showFeedback(formFeedback, '¡Alumno registrado exitosamente!', 'success');
                registerForm.reset();
                
            } catch (error) {
                showFeedback(formFeedback, error.message || 'Error al registrar. Revisa los campos.', 'error');
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