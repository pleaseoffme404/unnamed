document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('alumnos-tbody');
    const searchInput = document.getElementById('search-input');
    const filterGrade = document.getElementById('filter-grade');
    

    const listView = document.getElementById('list-view');
    const detailView = document.getElementById('detail-view');
    const studentForm = document.getElementById('student-form');
    const btnCloseDetail = document.getElementById('btn-close-detail');
    
    let allAlumnos = []; 

    init();

    function init() {
        loadFilterOptions();
        fetchAlumnos();
        setupListeners();
    }

    async function loadFilterOptions() {
        if (!filterGrade) return;
        
        try {
            const response = await apiFetch('/api/alumnos/grupos', 'GET');
            if (response.success) {
                const grupos = response.data;
                const uniqueGrados = [...new Set(grupos.map(g => g.grado))].sort();
                
                filterGrade.innerHTML = '<option value="">Todos los Grados</option>';
                uniqueGrados.forEach(grado => {
                    const option = document.createElement('option');
                    option.value = grado;
                    option.textContent = `${grado}° Grado`;
                    filterGrade.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error cargando filtros:", error);
        }
    }

    async function fetchAlumnos() {
        try {
            const response = await apiFetch('/api/alumnos', 'GET');
            if (response.success) {
                allAlumnos = response.data;
                renderTable(allAlumnos);
            } else {
                if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger);">Error cargando datos.</td></tr>`;
            }
        } catch (error) {
            console.error(error);
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger);">Error de servidor.</td></tr>`;
        }
    }

    function renderTable(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">No se encontraron alumnos.</td></tr>`;
            return;
        }

        data.forEach(alumno => {
            const row = document.createElement('tr');
            const avatar = alumno.imagen_url || '../assets/img/default-avatar.png';
            const nombre = `${alumno.nombres} ${alumno.apellido_paterno}`;
            const statusClass = alumno.esta_activo ? 'success' : 'danger';
            const statusText = alumno.esta_activo ? 'Activo' : 'Inactivo';
            
            row.innerHTML = `
                <td>
                    <div class="user-cell">
                        <img src="${avatar}" class="user-avatar">
                        <div class="user-info">
                            <span class="user-name">${nombre}</span>
                            <span class="user-meta">${alumno.correo_electronico}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-family:monospace; font-size:12px;">
                        <div>${alumno.curp}</div>
                        <div style="color:var(--text-muted);">${alumno.nss || '-'}</div>
                    </div>
                </td>
                <td><span class="badge badge-primary">${alumno.grado || '?'}° ${alumno.grupo || '?'}</span></td>
                <td><span style="color:var(--${statusClass});font-weight:700;font-size:12px;">● ${statusText}</span></td>
                <td style="text-align:right;">
                    <button class="action-btn btn-view" data-id="${alumno.id_perfil_alumno}">Editar / Ver</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => openDetail(e.target.dataset.id));
        });
    }

    function setupListeners() {
        if (searchInput) searchInput.addEventListener('input', filterData);
        if (filterGrade) filterGrade.addEventListener('change', filterData);

        if (btnCloseDetail) {
            btnCloseDetail.addEventListener('click', () => {
                detailView.classList.add('hidden');
                listView.classList.remove('hidden');
            });
        }

        const photoInput = document.getElementById('student-photo');
        const photoPreview = document.getElementById('photo-preview');
        
        if (photoPreview && photoInput) {
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

        if (studentForm) {
            studentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = document.getElementById('student-id').value;
                const formData = new FormData(studentForm);
                
                try {
                    const response = await apiFetch(`/api/alumnos/${id}`, 'PUT', formData);
                    if (response.success) {
                        alert('Alumno actualizado correctamente.');
                        detailView.classList.add('hidden');
                        listView.classList.remove('hidden');
                        fetchAlumnos();
                    }
                } catch (error) {
                    alert('Error al actualizar: ' + (error.message || 'Error desconocido'));
                }
            });
        }

        const btnDelete = document.getElementById('btn-soft-delete');
        if (btnDelete) {
            btnDelete.addEventListener('click', () => {
                const isActive = document.getElementById('student-active').value == '1';
                const action = isActive ? 'desactivar' : 'reactivar';
                
                if(confirm(`¿Deseas ${action} a este alumno?`)) {
                    document.getElementById('student-active').value = isActive ? '0' : '1';
                    studentForm.dispatchEvent(new Event('submit'));
                }
            });
        }
    }

    function filterData() {
        if (!searchInput || !filterGrade) return;
        
        const term = searchInput.value.toLowerCase();
        const grade = filterGrade.value;

        const filtered = allAlumnos.filter(a => {
            const textMatch = `${a.nombres} ${a.apellido_paterno} ${a.curp} ${a.correo_electronico}`.toLowerCase().includes(term);
            const gradeMatch = grade === '' || (a.grado && a.grado.toString() === grade);
            return textMatch && gradeMatch;
        });
        renderTable(filtered);
    }

    function openDetail(id) {
        const student = allAlumnos.find(a => a.id_perfil_alumno == id);
        if(!student) return;

        document.getElementById('student-id').value = student.id_perfil_alumno;
        document.getElementById('student-active').value = student.esta_activo ? '1' : '0';
        document.getElementById('student-image-url').value = student.imagen_url;

        document.getElementById('d-nombres').value = student.nombres;
        document.getElementById('d-paterno').value = student.apellido_paterno;
        document.getElementById('d-materno').value = student.apellido_materno || '';
        document.getElementById('d-curp').value = student.curp;
        document.getElementById('d-nss').value = student.nss || '';
        document.getElementById('d-grado').value = student.grado;
        document.getElementById('d-grupo').value = student.grupo;
        document.getElementById('d-sangre').value = student.tipo_sangre || '';
        document.getElementById('d-email').value = student.correo_electronico;
        document.getElementById('d-telefono').value = student.telefono || '';

        const photo = student.imagen_url || '../assets/img/default-avatar.png';
        document.getElementById('photo-preview').style.backgroundImage = `url('${photo}')`;

        const btnDelete = document.getElementById('btn-soft-delete');
        if (btnDelete) {
            if(student.esta_activo) {
                btnDelete.textContent = 'Desactivar Alumno';
                btnDelete.className = 'btn btn-danger';
            } else {
                btnDelete.textContent = 'Reactivar Alumno';
                btnDelete.className = 'btn btn-success';
                btnDelete.style.backgroundColor = 'var(--success)';
                btnDelete.style.color = 'white';
            }
        }

        listView.classList.add('hidden');
        detailView.classList.remove('hidden');
    }
});