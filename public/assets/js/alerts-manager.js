document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('alerts-tbody');
    const searchInput = document.getElementById('search-input');
    
    const listView = document.getElementById('list-view');
    const formView = document.getElementById('form-view');
    const alertForm = document.getElementById('alert-form');
    
    const btnNew = document.getElementById('btn-new-alert');
    const btnClose = document.getElementById('btn-close-form');
    
    let allAlerts = [];

    init();

    function init() {
        fetchAlerts();
        setupListeners();
    }

    async function fetchAlerts() {
        try {
            const response = await apiFetch('/api/anuncios', 'GET');
            if (response.success) {
                allAlerts = response.data;
                renderTable(allAlerts);
            } else {
                if(tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger);">Error cargando datos.</td></tr>`;
            }
        } catch (error) {
            console.error(error);
        }
    }

    function renderTable(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">No hay anuncios publicados.</td></tr>`;
            return;
        }

        data.forEach(item => {
            const row = document.createElement('tr');
            const date = new Date(item.fecha_publicacion).toLocaleDateString('es-MX');
            
            let badgeClass = 'dest-todos';
            if (item.destinatarios === 'solo_tutores') badgeClass = 'dest-tutores';
            if (item.destinatarios === 'por_grado') badgeClass = 'dest-grado';

            row.innerHTML = `
                <td><strong>${item.titulo}</strong></td>
                <td><div class="content-preview">${item.contenido}</div></td>
                <td><span class="badge-dest ${badgeClass}">${item.destinatarios.replace('_', ' ')}</span></td>
                <td>${date}</td>
                <td style="text-align:right; display:flex; gap:5px; justify-content:flex-end;">
                    <button class="action-btn btn-edit" data-id="${item.id_anuncio}">Editar</button>
                    <button class="action-btn btn-delete" data-id="${item.id_anuncio}" style="border-color:var(--danger); color:var(--danger);">Borrar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => openForm(e.target.dataset.id));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => deleteAlert(e.target.dataset.id));
        });
    }

    function setupListeners() {
        if (searchInput) searchInput.addEventListener('input', filterData);

        if(btnNew) btnNew.addEventListener('click', () => openForm());
        if(btnClose) btnClose.addEventListener('click', closeForm);

        if(alertForm) {
            alertForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = document.getElementById('alert-id').value;
                const method = id ? 'PUT' : 'POST';
                const url = id ? `/api/anuncios/${id}` : '/api/anuncios';
                
                const data = {
                    titulo: document.getElementById('titulo').value,
                    contenido: document.getElementById('contenido').value,
                    destinatarios: document.getElementById('destinatarios').value
                };

                try {
                    const response = await apiFetch(url, method, data);
                    if (response.success) {
                        closeForm();
                        fetchAlerts();
                    } else {
                        alert('Error: ' + response.message);
                    }
                } catch (error) {
                    alert('Error de conexión.');
                }
            });
        }
    }

    function filterData() {
        const term = searchInput.value.toLowerCase();
        const filtered = allAlerts.filter(item => 
            item.titulo.toLowerCase().includes(term) || item.contenido.toLowerCase().includes(term)
        );
        renderTable(filtered);
    }

    function openForm(id = null) {
        document.getElementById('alert-id').value = id || '';
        document.getElementById('form-title').textContent = id ? 'Editar Alerta' : 'Nueva Alerta';
        
        if (id) {
            const item = allAlerts.find(a => a.id_anuncio == id);
            if (item) {
                document.getElementById('titulo').value = item.titulo;
                document.getElementById('contenido').value = item.contenido;
                document.getElementById('destinatarios').value = item.destinatarios;
            }
        } else {
            alertForm.reset();
        }

        listView.classList.add('hidden');
        formView.classList.remove('hidden');
    }

    function closeForm() {
        formView.classList.add('hidden');
        listView.classList.remove('hidden');
    }

    async function deleteAlert(id) {
        if (!confirm('¿Eliminar esta alerta permanentemente?')) return;
        try {
            await apiFetch(`/api/anuncios/${id}`, 'DELETE');
            fetchAlerts();
        } catch (error) {
            alert('No se pudo eliminar.');
        }
    }
});