document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-student-form');
    const feedbackEl = document.getElementById('form-feedback');
    const photoPreview = document.getElementById('photo-preview');
    const photoInput = document.getElementById('imagen');
    const gradoSelect = document.getElementById('grado');
    const grupoSelect = document.getElementById('grupo');

    let catalogoGrupos = [];

    loadGradosGrupos();

    async function loadGradosGrupos() {
        if (!gradoSelect || !grupoSelect) return;
        
        try {
            const response = await apiFetch('/api/alumnos/grupos', 'GET');
            if (response.success) {
                catalogoGrupos = response.data;
                populateGrades();
            }
        } catch (error) {
            console.error(error);
            gradoSelect.innerHTML = '<option value="">Error cargando</option>';
        }
    }

    function populateGrades() {
        const uniqueGrados = [...new Set(catalogoGrupos.map(item => item.grado))];
        gradoSelect.innerHTML = '<option value="">Seleccionar</option>';
        
        uniqueGrados.forEach(grado => {
            const option = document.createElement('option');
            option.value = grado;
            option.textContent = `${grado}° Semestre`;
            gradoSelect.appendChild(option);
        });
    }

    if (gradoSelect) {
        gradoSelect.addEventListener('change', () => {
            const selectedGrado = parseInt(gradoSelect.value);
            grupoSelect.innerHTML = '<option value="">Seleccionar</option>';
            
            if (!selectedGrado) return;

            const gruposFiltrados = catalogoGrupos.filter(item => item.grado === selectedGrado);
            
            gruposFiltrados.forEach(item => {
                const option = document.createElement('option');
                option.value = item.grupo;
                option.textContent = `Grupo ${item.grupo}`;
                grupoSelect.appendChild(option);
            });
        });
    }

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