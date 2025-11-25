document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('historial-tbody');
    const searchInput = document.getElementById('sim-search-input');
    const searchResults = document.getElementById('sim-search-results');
    const selectedIdInput = document.getElementById('sim-alumno-id');
    const btnEntrada = document.getElementById('btn-sim-entrada');
    const btnSalida = document.getElementById('btn-sim-salida');

    let allStudentsCache = [];

    init();

    function init() {
        loadHistory();
        loadStudents();
        setupListeners();
    }

    async function loadStudents() {
        try {
            const response = await apiFetch('/api/alumnos', 'GET');
            if (response.success) {
                allStudentsCache = response.data;
            }
        } catch (e) {}
    }

    async function loadHistory() {
        try {
            const response = await apiFetch('/api/asistencia', 'GET');
            if (response.success) {
                renderTable(response.data);
            }
        } catch (error) {
            console.error(error);
        }
    }

    function renderTable(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">No hay registros recientes.</td></tr>`;
            return;
        }

        data.forEach(item => {
            const row = document.createElement('tr');
            const avatar = item.imagen_url || '../assets/img/default-avatar.png';
            const nombre = `${item.nombres} ${item.apellido_paterno}`;
            
            const fechaEntrada = new Date(item.fecha_hora_entrada).toLocaleString('es-MX', { hour12: true });
            const fechaSalida = item.fecha_hora_salida ? new Date(item.fecha_hora_salida).toLocaleString('es-MX', { hour12: true }) : '--';
            
            const statusBadge = item.fecha_hora_salida 
                ? `<span class="status-badge status-out">Completado</span>` 
                : `<span class="status-badge status-in">En Campus</span>`;

            row.innerHTML = `
                <td>
                    <div class="user-cell">
                        <img src="${avatar}" class="user-avatar">
                        <div class="user-info">
                            <span class="user-name">${nombre}</span>
                            <span class="user-meta">${item.boleta}</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge badge-primary">${item.grupo || '?'}</span></td>
                <td class="time-cell">${fechaEntrada}</td>
                <td class="time-cell">${fechaSalida}</td>
                <td>${item.metodo_entrada === 'manual' ? 'Manual (Sim)' : 'QR App'}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function setupListeners() {
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                if (term.length < 2) {
                    searchResults.classList.remove('active');
                    return;
                }
                
                const filtered = allStudentsCache.filter(s => 
                    `${s.nombres} ${s.apellido_paterno} ${s.boleta}`.toLowerCase().includes(term)
                ).slice(0, 8); 

                renderSearchResults(filtered);
            });

            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                    searchResults.classList.remove('active');
                }
            });
        }

        btnEntrada.addEventListener('click', () => executeSimulation('entrada'));
        btnSalida.addEventListener('click', () => executeSimulation('salida'));
    }

    function renderSearchResults(results) {
        searchResults.innerHTML = '';
        if (results.length === 0) {
            searchResults.classList.remove('active');
            return;
        }

        results.forEach(s => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.innerHTML = `
                <div>
                    <div class="name">${s.nombres} ${s.apellido_paterno}</div>
                    <div class="meta">${s.boleta} - ${s.grupo}</div>
                </div>
            `;
            div.addEventListener('click', () => {
                selectStudent(s);
            });
            searchResults.appendChild(div);
        });
        searchResults.classList.add('active');
    }

    function selectStudent(student) {
        searchInput.value = `${student.nombres} ${student.apellido_paterno}`;
        selectedIdInput.value = student.id_perfil_alumno;
        searchResults.classList.remove('active');
        btnEntrada.disabled = false;
        btnSalida.disabled = false;
    }

    async function executeSimulation(tipo) {
        const id = selectedIdInput.value;
        if (!id) return;

        try {
            const response = await apiFetch('/api/asistencia/simular', 'POST', {
                id_alumno: id,
                tipo_movimiento: tipo
            });

            if (response.success) {
                loadHistory(); 
                alert(response.message);
                searchInput.value = '';
                selectedIdInput.value = '';
                btnEntrada.disabled = true;
                btnSalida.disabled = true;
            } else {
                alert('Error: ' + response.message);
            }
        } catch (error) {
            alert(error.message || 'Error al simular.');
        }
    }
});