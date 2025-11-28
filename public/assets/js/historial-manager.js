document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('historial-tbody');
    const searchInput = document.getElementById('table-search-input');
    
    const simSearchInput = document.getElementById('sim-search-input');
    const simSearchResults = document.getElementById('sim-search-results');
    const selectedIdInput = document.getElementById('sim-alumno-id');
    const btnEntrada = document.getElementById('btn-sim-entrada');
    const btnSalida = document.getElementById('btn-sim-salida');

    let allStudentsCache = [];
    let historyData = [];

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
                historyData = response.data;
                renderTable(historyData);
            }
        } catch (error) {
            console.error(error);
        }
    }

    function renderTable(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">No hay registros recientes.</td></tr>`;
            return;
        }

        data.forEach(item => {
            const row = document.createElement('tr');
            const avatar = item.imagen_url || '../assets/img/default-avatar.png';
            const nombre = `${item.nombres} ${item.apellido_paterno}`;
            
            const entradaDate = new Date(item.fecha_hora_entrada);
            const entradaStr = entradaDate.toLocaleString('es-MX', { hour12: true });
            const salidaStr = item.fecha_hora_salida ? new Date(item.fecha_hora_salida).toLocaleString('es-MX', { hour12: true }) : '--';
            
            let statusBadge = '';
            let statusText = '';
            
            if (item.estatus === 'retardo') {
                statusText = 'Retardo';
                statusBadge = 'status-late';
            } else {
                statusText = 'A Tiempo';
                statusBadge = 'status-ontime';
            }

            const estadoActual = item.fecha_hora_salida ? 
                '<span style="color:var(--text-muted); font-size:11px;">● Salida Registrada</span>' : 
                '<span style="color:var(--success); font-weight:bold; font-size:11px;">● En Campus</span>';

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
                <td class="time-cell">${entradaStr}</td>
                <td class="time-cell">${salidaStr}</td>
                <td>
                    <span class="status-badge ${statusBadge}">${statusText}</span>
                    <div style="margin-top:4px;">${estadoActual}</div>
                </td>
                <td>${item.metodo_entrada === 'manual' ? 'Manual' : 'QR App'}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function setupListeners() {
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = historyData.filter(item => 
                    `${item.nombres} ${item.apellido_paterno} ${item.boleta} ${item.grupo}`.toLowerCase().includes(term)
                );
                renderTable(filtered);
            });
        }

        if (simSearchInput) {
            simSearchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                if (term.length < 2) {
                    simSearchResults.classList.remove('active');
                    return;
                }
                
                const filtered = allStudentsCache.filter(s => 
                    `${s.nombres} ${s.apellido_paterno} ${s.boleta}`.toLowerCase().includes(term)
                ).slice(0, 8); 

                renderSimSearchResults(filtered);
            });

            document.addEventListener('click', (e) => {
                if (!simSearchInput.contains(e.target) && !simSearchResults.contains(e.target)) {
                    simSearchResults.classList.remove('active');
                }
            });
        }

        if (btnEntrada) btnEntrada.addEventListener('click', () => executeSimulation('entrada'));
        if (btnSalida) btnSalida.addEventListener('click', () => executeSimulation('salida'));
    }

    function renderSimSearchResults(results) {
        simSearchResults.innerHTML = '';
        if (results.length === 0) {
            simSearchResults.classList.remove('active');
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
                selectStudentForSim(s);
            });
            simSearchResults.appendChild(div);
        });
        simSearchResults.classList.add('active');
    }

    function selectStudentForSim(student) {
        simSearchInput.value = `${student.nombres} ${student.apellido_paterno}`;
        selectedIdInput.value = student.id_perfil_alumno;
        simSearchResults.classList.remove('active');
        btnEntrada.disabled = false;
        btnSalida.disabled = false;
    }

    async function executeSimulation(tipo) {
        const id = selectedIdInput.value;
        if (!id) return;

        try {
            const response = await apiFetch('/api/asistencia/simular', 'POST', {
                id_alumno: id,
                tipo: tipo
            });

            if (response.success) {
                loadHistory();
                alert(response.message);
                
                simSearchInput.value = '';
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