document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('alumnos-tbody');
    const searchInput = document.getElementById('search-input');
    const filterGrade = document.getElementById('filter-grade');
    
    const listView = document.getElementById('list-view');
    const detailView = document.getElementById('detail-view');
    const studentForm = document.getElementById('student-form');
    const btnCloseDetail = document.getElementById('btn-close-detail');
    
    const selectRows = document.getElementById('rows-per-page');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const lblStart = document.getElementById('lbl-start');
    const lblEnd = document.getElementById('lbl-end');
    const lblTotal = document.getElementById('lbl-total');

    let allAlumnos = []; 
    let filteredAlumnos = [];
    let currentPage = 1;
    let rowsPerPage = 10;

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
                
                filterGrade.innerHTML = '<option value="">Todos los Semestres</option>';
                uniqueGrados.forEach(grado => {
                    const option = document.createElement('option');
                    option.value = grado;
                    option.textContent = `${grado}° Semestre`;
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
                filteredAlumnos = allAlumnos;
                currentPage = 1;
                renderTable();
            } else {
                if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger);">Error cargando datos.</td></tr>`;
            }
        } catch (error) {
            console.error(error);
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger);">Error de servidor.</td></tr>`;
        }
    }

    function renderTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (filteredAlumnos.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">No se encontraron alumnos.</td></tr>`;
            lblStart.textContent = 0;
            lblEnd.textContent = 0;
            lblTotal.textContent = 0;
            btnPrev.disabled = true;
            btnNext.disabled = true;
            return;
        }

        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, filteredAlumnos.length);
        const paginatedData = filteredAlumnos.slice(startIndex, endIndex);

        paginatedData.forEach(alumno => {
            const row = document.createElement('tr');
            const avatar = alumno.imagen_url || '../assets/img/default-avatar.png';
            const nombre = `${alumno.nombres} ${alumno.apellido_paterno}`;
            const statusColor = alumno.esta_activo ? 'var(--success)' : 'var(--danger)';
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
                    <div style="display:flex; flex-direction:column; font-size:12px;">
                        <span style="font-weight:700; font-family:monospace; font-size:13px; color:var(--accent-primary);">${alumno.boleta}</span>
                        <span style="color:var(--text-muted);">${alumno.curp}</span>
                    </div>
                </td>
                <td>
                    <span class="badge badge-primary">${alumno.grado || '?'}° ${alumno.grupo || '?'}</span>
                </td>
                <td>
                    <span style="color:${statusColor}; font-weight:700; font-size:12px;">
                        ● ${statusText}
                    </span>
                </td>
                <td style="text-align:right;">
                    <button class="action-btn btn-view" data-id="${alumno.id_perfil_alumno}">Editar / Ver</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        lblStart.textContent = startIndex + 1;
        lblEnd.textContent = endIndex;
        lblTotal.textContent = filteredAlumnos.length;

        btnPrev.disabled = currentPage === 1;
        btnNext.disabled = endIndex >= filteredAlumnos.length;

        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => openDetail(e.target.dataset.id));
        });
    }

    function setupListeners() {
        if (searchInput) searchInput.addEventListener('input', filterData);
        if (filterGrade) filterGrade.addEventListener('change', filterData);

        if (selectRows) {
            selectRows.addEventListener('change', (e) => {
                rowsPerPage = parseInt(e.target.value);
                currentPage = 1;
                renderTable();
            });
        }

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderTable();
                }
            });
        }

        if (btnNext) {
            btnNext.addEventListener('click', () => {
                if ((currentPage * rowsPerPage) < filteredAlumnos.length) {
                    currentPage++;
                    renderTable();
                }
            });
        }

        if (btnCloseDetail) {
            btnCloseDetail.addEventListener('click', (e) => {
                e.preventDefault(); 
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

        filteredAlumnos = allAlumnos.filter(a => {
            const textMatch = `${a.nombres} ${a.apellido_paterno} ${a.curp} ${a.boleta} ${a.correo_electronico}`.toLowerCase().includes(term);
            const gradeMatch = grade === '' || (a.grado && a.grado.toString() === grade);
            return textMatch && gradeMatch;
        });
        
        currentPage = 1;
        renderTable();
    }

    function openDetail(id) {
        const student = allAlumnos.find(a => a.id_perfil_alumno == id);
        if(!student) return;

        document.getElementById('student-id').value = student.id_perfil_alumno;
        
        const isActive = student.esta_activo === 1 || student.esta_activo === true;
        document.getElementById('student-active').value = isActive ? '1' : '0';
        
        document.getElementById('student-image-url').value = student.imagen_url;

        document.getElementById('d-boleta').value = student.boleta; 
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
            if(isActive) {
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