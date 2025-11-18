document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('alumnos-tbody');
    const searchInput = document.getElementById('search-input');
    const filterGrade = document.getElementById('filter-grade');
    const listView = document.getElementById('list-view');
    const detailView = document.getElementById('detail-view');
    const studentForm = document.getElementById('student-form');

    let allAlumnos = []; 

    fetchAlumnos();
    setupListeners();

    async function fetchAlumnos() {
        try {
            const response = await apiFetch('/api/alumnos', 'GET');
            if (response.success) {
                allAlumnos = response.data;
                renderTable(allAlumnos);
            } else {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--danger);">Error cargando datos.</td></tr>`;
            }
        } catch (error) {
            console.error(error);
        }
    }

    function renderTable(data) {
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted);">No hay alumnos registrados.</td></tr>`;
            return;
        }
        data.forEach(alumno => {
            const row = document.createElement('tr');
            const avatar = alumno.imagen_url || '../assets/img/default-avatar.png';
            const nombre = `${alumno.nombres} ${alumno.apellido_paterno}`;
            const statusColor = alumno.esta_activo ? 'var(--success)' : 'var(--danger)';
            
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
                <td>${alumno.curp}</td>
                <td><span class="badge badge-primary">${alumno.grado || '?'}° ${alumno.grupo || '?'}</span></td>
                <td><span style="color:${statusColor}; font-weight:bold;">● ${alumno.esta_activo ? 'Activo' : 'Inactivo'}</span></td>
                <td style="text-align:right;">
                    <button class="action-btn btn-view-profile" data-id="${alumno.id_perfil_alumno}">Ver Perfil</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        document.querySelectorAll('.btn-view-profile').forEach(btn => {
            btn.addEventListener('click', (e) => openDetail(e.target.dataset.id));
        });
    }

    function setupListeners() {
        searchInput.addEventListener('input', filterData);
        filterGrade.addEventListener('change', filterData);

        document.getElementById('btn-new-student').addEventListener('click', () => {
            window.location.href = '/alumnos/register/index.html';
        });

        document.getElementById('btn-close-detail').addEventListener('click', () => {
            detailView.classList.add('hidden');
            listView.classList.remove('hidden');
        });

        document.getElementById('student-photo').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    document.getElementById('photo-preview').style.backgroundImage = `url('${evt.target.result}')`;
                };
                reader.readAsDataURL(file);
            }
        });

        studentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(studentForm);
            const id = document.getElementById('student-id').value;
            
            try {
                const res = await apiFetch(`/api/alumnos/${id}`, 'PUT', null); 
                
                const finalFormData = new FormData(studentForm);
                const response = await fetch(`/api/alumnos/${id}`, {
                    method: 'PUT',
                    body: finalFormData
                });
                
                if (response.ok) {
                    alert('Alumno actualizado.');
                    fetchAlumnos(); 
                    detailView.classList.add('hidden');
                    listView.classList.remove('hidden');
                } else {
                    alert('Error al actualizar.');
                }
            } catch (error) {
                console.error(error);
            }
        });

        document.getElementById('btn-soft-delete').addEventListener('click', async () => {
            if (!confirm('¿Seguro que deseas desactivar a este alumno?')) return;
            
            const id = document.getElementById('student-id').value;
            const formData = new FormData();
            formData.append('esta_activo', 0);
            
x   
            document.getElementById('student-active').value = '0';
            studentForm.dispatchEvent(new Event('submit'));
        });
    }

    function filterData() {
        const term = searchInput.value.toLowerCase();
        const grade = filterGrade.value;
        
        const filtered = allAlumnos.filter(a => {
            const matchText = `${a.nombres} ${a.apellido_paterno} ${a.curp}`.toLowerCase().includes(term);
            const matchGrade = grade === '' || (a.grado && a.grado.toString() === grade);
            return matchText && matchGrade;
        });
        renderTable(filtered);
    }

    function openDetail(id) {
        const student = allAlumnos.find(a => a.id_perfil_alumno == id);
        if (!student) return;

        populateForm(student);
        listView.classList.add('hidden');
        detailView.classList.remove('hidden');
    }

    function populateForm(data) {
        document.getElementById('student-id').value = data.id_perfil_alumno;
        document.getElementById('d-nombres').value = data.nombres;
        document.getElementById('d-paterno').value = data.apellido_paterno;
        document.getElementById('d-materno').value = data.apellido_materno || '';
        document.getElementById('d-curp').value = data.curp;
        document.getElementById('d-grado').value = data.grado || '';
        document.getElementById('d-grupo').value = data.grupo || '';
        document.getElementById('d-sangre').value = data.tipo_sangre || '';
        document.getElementById('d-email').value = data.correo_electronico;
        document.getElementById('d-telefono').value = data.telefono || '';
        document.getElementById('student-active').value = data.esta_activo ? '1' : '0';
        document.getElementById('student-image-url').value = data.imagen_url;

        const photoUrl = data.imagen_url || '../assets/img/default-avatar.png';
        document.getElementById('photo-preview').style.backgroundImage = `url('${photoUrl}')`;

        const deleteBtn = document.getElementById('btn-soft-delete');
        if (data.esta_activo) {
            deleteBtn.textContent = 'Desactivar Alumno';
            deleteBtn.classList.remove('btn-success');
            deleteBtn.classList.add('btn-danger');
            deleteBtn.onclick = () => { 
                document.getElementById('student-active').value = '0'; 
                studentForm.requestSubmit(); 
            };
        } else {
            deleteBtn.textContent = 'Reactivar Alumno';
            deleteBtn.classList.remove('btn-danger');
            deleteBtn.classList.add('btn-success'); 
            deleteBtn.onclick = () => { 
                document.getElementById('student-active').value = '1'; 
                studentForm.requestSubmit(); 
            };
        }
    }
});