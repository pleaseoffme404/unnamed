document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('tutores-tbody');
    const searchInput = document.getElementById('search-input');
    const listView = document.getElementById('list-view');
    const detailView = document.getElementById('detail-view');
    const tutorForm = document.getElementById('tutor-form');
    const btnCloseDetail = document.getElementById('btn-close-detail');
    
    const editSearchInput = document.getElementById('edit-student-search');
    const editResultsContainer = document.getElementById('edit-search-results');
    const editSelectedContainer = document.getElementById('edit-selected-students');
    
    let selectedStudents = []; 
    let allStudentsCache = [];
    let allTutores = []; 

    init();

    function init() {
        fetchTutores();
        loadStudentsForSearch();
        setupListeners();
        setupEditSearchListeners();
    }

    async function fetchTutores() {
        try {
            const response = await apiFetch('/api/tutores', 'GET');
            if (response.success) {
                allTutores = response.data;
                renderTable(allTutores);
            } else {
                if(tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger);">Error cargando datos.</td></tr>`;
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function loadStudentsForSearch() {
        try {
            const response = await apiFetch('/api/alumnos', 'GET');
            if(response.success) allStudentsCache = response.data;
        } catch (e) {}
    }

    function renderTable(data) {
        if(!tableBody) return;
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">No hay tutores registrados.</td></tr>`;
            return;
        }

        data.forEach(tutor => {
            const row = document.createElement('tr');
            const avatar = tutor.imagen_url || '../assets/img/default-avatar.png';
            const nombre = `${tutor.nombres} ${tutor.apellido_paterno}`;
            
            const isActive = tutor.esta_activo === 1 || tutor.esta_activo === true;
            const statusText = isActive ? 'Activo' : 'Inactivo';
            const statusColor = isActive ? 'var(--success)' : 'var(--danger)';

            row.innerHTML = `
                <td>
                    <div class="user-cell">
                        <img src="${avatar}" class="user-avatar">
                        <div class="user-info">
                            <span class="user-name">${nombre}</span>
                            <span class="user-meta" style="text-transform:capitalize;">${tutor.notificaciones}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display:flex; flex-direction:column; font-size:12px;">
                        <span style="font-weight:600;">${tutor.correo_electronico}</span>
                        <span style="color:var(--text-muted);">${tutor.telefono || '-'}</span>
                    </div>
                </td>
                <td><span class="badge badge-primary">${tutor.total_alumnos || 0} Alumnos</span></td>
                <td><span style="color:${statusColor}; font-weight:700; font-size:12px;">● ${statusText}</span></td>
                <td style="text-align:right;">
                    <button class="action-btn btn-view" data-id="${tutor.id_perfil_tutor}">Editar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => openDetail(e.target.dataset.id));
        });
    }

    function setupListeners() {
        if(searchInput) searchInput.addEventListener('input', filterData);

        if(btnCloseDetail) {
            btnCloseDetail.addEventListener('click', (e) => {
                e.preventDefault();
                detailView.classList.add('hidden');
                listView.classList.remove('hidden');
            });
        }

        const photoInput = document.getElementById('tutor-photo');
        const photoPreview = document.getElementById('photo-preview');
        if(photoInput && photoPreview) {
            photoPreview.addEventListener('click', () => photoInput.click());
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if(file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => photoPreview.style.backgroundImage = `url('${ev.target.result}')`;
                    reader.readAsDataURL(file);
                }
            });
        }

        if(tutorForm) {
            tutorForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = document.getElementById('tutor-id').value;
                const formData = new FormData(tutorForm);
                
                selectedStudents.forEach(s => formData.append('alumnos', s.id));

                try {
                    const response = await apiFetch(`/api/tutores/${id}`, 'PUT', formData);
                    if (response.success) {
                        alert('Tutor actualizado.');
                        detailView.classList.add('hidden');
                        listView.classList.remove('hidden');
                        fetchTutores();
                    }
                } catch (error) {
                    alert('Error: ' + (error.message || 'Desconocido'));
                }
            });
        }

        const btnDelete = document.getElementById('btn-soft-delete');
        if(btnDelete) {
            btnDelete.addEventListener('click', () => {
                const isActive = document.getElementById('tutor-active').value == '1';
                const action = isActive ? 'desactivar' : 'reactivar';
                if(confirm(`¿${action} cuenta?`)) {
                    document.getElementById('tutor-active').value = isActive ? '0' : '1';
                    tutorForm.dispatchEvent(new Event('submit'));
                }
            });
        }
    }

    function setupEditSearchListeners() {
        if(!editSearchInput || !editResultsContainer) return;

        editSearchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            if(term.length < 2) {
                editResultsContainer.classList.remove('active');
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
            if (!editSearchInput.contains(e.target) && !editResultsContainer.contains(e.target)) {
                editResultsContainer.classList.remove('active');
            }
        });
    }

    function renderSearchResults(results) {
        if(!editResultsContainer) return;
        editResultsContainer.innerHTML = '';
        if(results.length === 0) {
            editResultsContainer.classList.remove('active');
            return;
        }
        results.forEach(s => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.textContent = `${s.nombres} ${s.apellido_paterno} (${s.curp})`;
            div.addEventListener('click', () => {
                addStudent(s);
                editSearchInput.value = '';
                editResultsContainer.classList.remove('active');
            });
            editResultsContainer.appendChild(div);
        });
        editResultsContainer.classList.add('active');
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
        if(!editSelectedContainer) return; 
        editSelectedContainer.innerHTML = '';
        selectedStudents.forEach(s => {
            const tag = document.createElement('div');
            tag.className = 'student-tag';
            tag.innerHTML = `${s.name} <span class="remove-tag" data-id="${s.id}">×</span>`;
            tag.querySelector('.remove-tag').addEventListener('click', (e) => removeStudent(parseInt(e.target.dataset.id)));
            editSelectedContainer.appendChild(tag);
        });
    }

    function filterData() {
        if(!searchInput) return;
        const term = searchInput.value.toLowerCase();
        const filtered = allTutores.filter(t => {
            return `${t.nombres} ${t.apellido_paterno} ${t.correo_electronico} ${t.telefono}`.toLowerCase().includes(term);
        });
        renderTable(filtered);
    }

    async function openDetail(id) {
        try {
            const response = await apiFetch(`/api/tutores/${id}`, 'GET');
            if(!response.success) return;
            
            const data = response.data;
            populateForm(data);
            
            listView.classList.add('hidden');
            detailView.classList.remove('hidden');
        } catch (error) {
            console.error(error);
        }
    }

    function populateForm(data) {
        document.getElementById('tutor-id').value = data.id_perfil_tutor;
        document.getElementById('tutor-active').value = data.esta_activo ? '1' : '0';
        document.getElementById('tutor-image-url').value = data.imagen_url;

        document.getElementById('d-nombres').value = data.nombres;
        document.getElementById('d-paterno').value = data.apellido_paterno;
        document.getElementById('d-materno').value = data.apellido_materno || '';
        document.getElementById('d-email').value = data.correo_electronico;
        document.getElementById('d-telefono').value = data.telefono || '';
        document.getElementById('d-notif').value = data.notificaciones;

        const photo = data.imagen_url || '../assets/img/default-avatar.png';
        document.getElementById('photo-preview').style.backgroundImage = `url('${photo}')`;

        selectedStudents = []; 
        if (data.alumnos_lista) {
            data.alumnos_lista.forEach(a => {
                selectedStudents.push({ id: a.id_perfil_alumno, name: `${a.nombres} ${a.apellido_paterno}` });
            });
        }
        renderSelectedStudents();

        const btnDelete = document.getElementById('btn-soft-delete');
        if(btnDelete) {
            const isActive = data.esta_activo === 1 || data.esta_activo === true;
            if (isActive) {
                btnDelete.textContent = 'Desactivar Cuenta';
                btnDelete.className = 'btn btn-danger';
            } else {
                btnDelete.textContent = 'Reactivar Cuenta';
                btnDelete.className = 'btn btn-success';
                btnDelete.style.backgroundColor = 'var(--success)';
                btnDelete.style.color = 'white';
            }
        }
    }
});