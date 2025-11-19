document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-student-form');
    const feedbackEl = document.getElementById('form-feedback');
    const photoPreview = document.getElementById('photo-preview');
    const photoInput = document.getElementById('imagen');

    if (photoPreview && photoInput) {
        photoPreview.addEventListener('click', () => photoInput.click());
        
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    photoPreview.style.backgroundImage = `url('${evt.target.result}')`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Registrando...';
            feedbackEl.style.display = 'none';

            const formData = new FormData(registerForm);

            try {
                const response = await apiFetch('/api/alumnos', 'POST', formData); 
                
                if (response.success) {
                    feedbackEl.textContent = 'Alumno registrado exitosamente.';
                    feedbackEl.className = 'feedback-message success';
                    feedbackEl.style.display = 'block';
                    
                    setTimeout(() => {
                        window.location.href = '/alumnos/index.html';
                    }, 1500);
                }
            } catch (error) {
                console.error(error);
                feedbackEl.textContent = error.message || 'Error al registrar el alumno.';
                feedbackEl.className = 'feedback-message error';
                feedbackEl.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Registrar Alumno';
            }
        });
    }
});

