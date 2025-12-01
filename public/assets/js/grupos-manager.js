document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('groups-tbody');
    const listView = document.getElementById('list-view');
    const detailView = document.getElementById('detail-view');
    const groupForm = document.getElementById('group-form');
    
    const inputId = document.getElementById('group-id');
    const inputGrado = document.getElementById('grado');
    const inputGrupo = document.getElementById('grupo');
    const inputEntrada = document.getElementById('hora_entrada');
    const inputSalida = document.getElementById('hora_salida');
    
    const studentListContainer = document.getElementById('student-list');
    const btnNew = document.getElementById('btn-new-group');
    const btnClose = document.getElementById('btn-close-detail');
    const btnDelete = document.getElementById('btn-delete');

    let allGroups = [];

    init();

    function init() {
        fetchGroups();
        setupListeners();
    }

    async function fetchGroups() {
        try {
            const response = await apiFetch('/api/grupos', 'GET');
            if (response.success) {
                allGroups = response.data;
                renderTable(allGroups);
            }
        } catch (error) {
            console.error(error);
        }
    }

    function renderTable(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">No hay grupos registrados.</td></tr>`;
            return;
        }

        data.forEach(g => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td><span style="font-weight:bold;">${g.grupo}</span></td>
                <td>${g.grado} Semestre</td>
                <td>${g.hora_entrada.substring(0,5)} - ${g.hora_salida.substring(0,5)}</td>
                <td><span class="badge badge-primary">${g.total_alumnos} Alumnos</span></td>
                <td style="text-align:right;">
                    <button class="action-btn btn-edit" data-id="${g.id_grupo_disponible}">Gestionar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => openDetail(e.target.dataset.id));
        });
    }

    function setupListeners() {
        btnNew.addEventListener('click', () => openDetail(null));
        
        btnClose.addEventListener('click', () => {
            detailView.classList.add('hidden');
            listView.classList.remove('hidden');
        });

        groupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const entrada = inputEntrada.value;
            const salida = inputSalida.value;
            
            if (entrada >= salida) {
                alert('Error: La hora de salida debe ser posterior a la hora de entrada.');
                return;
            }
            if (inputGrupo.value.trim().length < 2) {
                alert('El nombre del grupo es muy corto.');
                return;
            }

            const id = inputId.value;
            const method = id ? 'PUT' : 'POST';
            const url = id ? `/api/grupos/${id}` : '/api/grupos';

            const payload = {
                grado: inputGrado.value,
                grupo: inputGrupo.value.toUpperCase(),
                hora_entrada: entrada,
                hora_salida: salida
            };

            try {
                const res = await apiFetch(url, method, payload);
                if(res.success) {
                    alert('Grupo guardado correctamente.');
                    detailView.classList.add('hidden');
                    listView.classList.remove('hidden');
                    fetchGroups();
                } else {
                    alert(res.message);
                }
            } catch(err) {
                alert('Error al guardar.');
            }
        });

        btnDelete.addEventListener('click', async () => {
            const id = inputId.value;
            if(!id) return;
            if(!confirm('Seguro que deseas eliminar este grupo? Si tiene alumnos no se permitira.')) return;

            try {
                const res = await apiFetch(`/api/grupos/${id}`, 'DELETE');
                if(res.success) {
                    alert('Grupo eliminado.');
                    detailView.classList.add('hidden');
                    listView.classList.remove('hidden');
                    fetchGroups();
                } else {
                    alert('Error: ' + res.message);
                }
            } catch(e) {
                alert('No se pudo eliminar.');
            }
        });
    }

    async function openDetail(id) {
        inputId.value = id || '';
        document.getElementById('form-title').textContent = id ? 'Editar Grupo' : 'Nuevo Grupo';
        studentListContainer.innerHTML = '<p style="text-align:center; padding:20px;">Cargando...</p>';

        if (id) {
            try {
                const res = await apiFetch(`/api/grupos/${id}`, 'GET');
                if(res.success) {
                    const g = res.data;
                    inputGrado.value = g.grado;
                    inputGrupo.value = g.grupo;
                    inputEntrada.value = g.hora_entrada;
                    inputSalida.value = g.hora_salida;
                    
                    inputGrado.disabled = true;
                    inputGrupo.disabled = true;
                    btnDelete.style.display = 'inline-block';

                    renderStudents(g.lista_alumnos);
                }
            } catch(e) { console.error(e); }
        } else {
            groupForm.reset();
            inputGrado.disabled = false;
            inputGrupo.disabled = false;
            btnDelete.style.display = 'none';
            studentListContainer.innerHTML = '<p style="text-align:center; padding:30px; color:var(--text-muted);">Guarda el grupo primero para ver alumnos.</p>';
        }

        listView.classList.add('hidden');
        detailView.classList.remove('hidden');
    }

    function renderStudents(list) {
        studentListContainer.innerHTML = '';
        if(!list || list.length === 0) {
            studentListContainer.innerHTML = '<p style="text-align:center; padding:30px; color:var(--text-muted);">No hay alumnos inscritos en este grupo.</p>';
            return;
        }

        list.forEach(s => {
            const div = document.createElement('div');
            div.className = 'student-item';
            const avatar = s.imagen_url || '/assets/img/default-avatar.png';
            div.innerHTML = `
                <img src="${avatar}">
                <div style="font-size:13px;">
                    <strong style="display:block; color:var(--text-primary);">${s.apellido_paterno} ${s.apellido_materno || ''} ${s.nombres}</strong>
                    <span style="color:var(--text-muted); font-size:11px;">${s.boleta}</span>
                </div>
            `;
            studentListContainer.appendChild(div);
        });
    }
});