document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-tutor-form');
    const feedbackEl = document.getElementById('form-feedback');
    const photoPreview = document.getElementById('photo-preview');
    const photoInput = document.getElementById('imagen');

    const searchInput = document.getElementById('student-search');
    const resultsContainer = document.getElementById('search-results');
    const selectedContainer = document.getElementById('selected-students');
    let selectedStudents = []; 
    let allStudentsCache = []; 

    loadStudentsForSearch();

    async function loadStudentsForSearch() {
        try {
            const response = await apiFetch('/api/alumnos', 'GET');
            if(response.success) {
                allStudentsCache = response.data;
            }
        } catch (e) { console.error("Error cargando lista alumnos", e); }
    }

    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            if(term.length < 2) {
                resultsContainer.classList.remove('active');
                return;
            }

            const filtered = allStudentsCache.filter(s => {
                const alreadySelected = selectedStudents.some(sel => sel.id === s.id_perfil_alumno);
                const matches = `${s.nombres} ${s.apellido_paterno} ${s.curp}`.toLowerCase().includes(term);
                return matches && !alreadySelected;
            });

            renderSearchResults(filtered);
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
                resultsContainer.classList.remove('active');
            }
        });
    }

    function renderSearchResults(results) {
        resultsContainer.innerHTML = '';
        if(results.length === 0) {
            resultsContainer.classList.remove('active');
            return;
        }

        results.forEach(s => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.textContent = `${s.nombres} ${s.apellido_paterno} (${s.curp})`;
            div.addEventListener('click', () => {
                addStudent(s);
                searchInput.value = '';
                resultsContainer.classList.remove('active');
            });
            resultsContainer.appendChild(div);
        });
        resultsContainer.classList.add('active');
    }

    function addStudent(student) {
        selectedStudents.push({ id: student.id_perfil_alumno, name: `${student.nombres} ${student.apellido_paterno}` });
        renderSelectedStudents();
    }

    function removeStudent(id) {
        selectedStudents = selectedStudents.filter(s => s.id !== id);
        renderSelectedStudents();
    }

    function renderSelectedStudents() {
        selectedContainer.innerHTML = '';
        selectedStudents.forEach(s => {
            const tag = document.createElement('div');
            tag.className = 'student-tag';
            tag.innerHTML = `
                ${s.name}
                <span class="remove-tag" data-id="${s.id}">×</span>
            `;
            tag.querySelector('.remove-tag').addEventListener('click', (e) => {
                removeStudent(parseInt(e.target.dataset.id));
            });
            selectedContainer.appendChild(tag);
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

            selectedStudents.forEach(s => {
                formData.append('alumnos', s.id);
            });

            try {
                const response = await apiFetch('/api/tutores', 'POST', formData);
                
                if (response.success) {
                    feedbackEl.textContent = 'Tutor registrado exitosamente.';
                    feedbackEl.className = 'feedback-message success';
                    feedbackEl.style.display = 'block';
                    
                    setTimeout(() => {
                        window.location.href = '/tutores/index.html';
                    }, 1500);
                }
            } catch (error) {
                console.error(error);
                feedbackEl.textContent = error.message || 'Error al registrar el tutor.';
                feedbackEl.className = 'feedback-message error';
                feedbackEl.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Registrar Tutor';
            }
        });
    }
});