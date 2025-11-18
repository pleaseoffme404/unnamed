document.addEventListener('DOMContentLoaded', () => {
    const massRegisterForm = document.getElementById('form-mass-register');
    const formFeedback = document.getElementById('form-feedback');

    if (massRegisterForm) {
        massRegisterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(massRegisterForm);
            
            try {
                const response = await api.postForm('/alumnos/register-masivo', formData);
                
                let successMessage = response.message || 'Proceso completado.';
                if (response.errores && response.errores.length > 0) {
                    successMessage += ` Se encontraron ${response.errores.length} errores.`;
                    console.warn('Errores en la carga:', response.errores);
                }
                
                showFeedback(formFeedback, successMessage, 'success');
                massRegisterForm.reset();
                
            } catch (error) {
                showFeedback(formFeedback, error.message || 'Error al subir el archivo.', 'error');
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