document.addEventListener('DOMContentLoaded', () => {
    const listView = document.getElementById('list-view');
    const formView = document.getElementById('form-view');
    const tableBody = document.querySelector('#alerts-table tbody');
    const form = document.getElementById('alert-form');
    
    const btnNew = document.getElementById('btn-new-alert');
    const btnCancel = document.getElementById('btn-cancel');

    let isEditing = false;

    loadAlerts();

    if(btnNew) btnNew.addEventListener('click', () => showForm(false));
    if(btnCancel) btnCancel.addEventListener('click', () => showList());
    
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveAlert();
        });
    }

    async function loadAlerts() {
        try {
            const res = await fetch('/api/anuncios');
            if (res.status === 403) {
                console.error("Error 403: No tienes permiso o falta tu perfil de admin.");
                return;
            }
            const data = await res.json();
            
            if(data.success) {
                renderTable(data.data);
            }
        } catch (error) {
            console.error('Error cargando anuncios:', error);
        }
    }

    function renderTable(anuncios) {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        
        if (anuncios.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No hay anuncios registrados.</td></tr>';
            return;
        }

        anuncios.forEach(a => {
            const date = new Date(a.fecha_publicacion).toLocaleDateString('es-MX');
            const row = document.createElement('tr');
            
            let priorityBadge = '<span class="badge-prio prio-normal">Normal</span>';
            if (a.prioridad === 'urgente') {
                priorityBadge = '<span class="badge-prio prio-urgente"> Urgente</span>';
            }

            let destBadge = 'Todos';
            if(a.destinatarios === 'solo_tutores') destBadge = 'Tutores';
            if(a.destinatarios === 'por_grado') destBadge = 'Grados';

            row.innerHTML = `
                <td>${priorityBadge}</td>
                <td style="font-weight: 600;">${a.titulo}</td>
                <td><span class="badge-dest">${destBadge}</span></td>
                <td style="color: #666; font-size: 0.9rem;">${date}</td>
                <td>
                    <button class="btn-icon btn-edit" type="button" onclick="window.editAlert(${a.id_anuncio})" title="Editar">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-icon btn-delete" type="button" onclick="window.deleteAlert(${a.id_anuncio})" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    async function saveAlert() {
        const id = document.getElementById('alert-id').value;
        const titulo = document.getElementById('titulo').value;
        const contenido = document.getElementById('contenido').value;
        const destinatarios = document.getElementById('destinatarios').value;
        const esUrgente = document.getElementById('prioridad').checked;

        const payload = { 
            titulo, 
            contenido, 
            destinatarios,
            prioridad: esUrgente ? 'urgente' : 'normal' 
        };

        const url = isEditing ? `/api/anuncios/${id}` : '/api/anuncios';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (res.status === 403) {
                alert("Error: No tienes permisos para publicar (403). Verifica que tu usuario tenga un Perfil de Admin en la base de datos.");
                return;
            }

            const data = await res.json();

            if (data.success) {
                alert(isEditing ? 'Anuncio actualizado correctamente.' : 'Anuncio publicado correctamente.');
                showList();
                loadAlerts();
            } else {
                alert('Error: ' + (data.message || 'Error desconocido'));
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión al guardar el anuncio.');
        }
    }

    window.editAlert = async (id) => {
        try {
            const res = await fetch(`/api/anuncios/${id}`);
            const data = await res.json();
            
            if(data.success) {
                const a = data.data;
                document.getElementById('alert-id').value = a.id_anuncio;
                document.getElementById('titulo').value = a.titulo;
                document.getElementById('contenido').value = a.contenido;
                document.getElementById('destinatarios').value = a.destinatarios;
                document.getElementById('prioridad').checked = (a.prioridad === 'urgente');

                showForm(true);
            }
        } catch (error) {
            console.error(error);
            alert('No se pudo cargar el anuncio para editar.');
        }
    };

    window.deleteAlert = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este anuncio? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const res = await fetch(`/api/anuncios/${id}`, { method: 'DELETE' });
            const data = await res.json();
            
            if (data.success) {
                alert('Anuncio eliminado.');
                loadAlerts();
            } else {
                alert('Error al eliminar: ' + data.message);
            }
        } catch (error) {
            alert('Error de conexión.');
        }
    };

    function showForm(editMode) {
        isEditing = editMode;
        const titleEl = document.getElementById('form-title');
        if(titleEl) titleEl.textContent = editMode ? 'Editar Alerta' : 'Nueva Alerta';
        
        if(!editMode && form) {
            form.reset();
            document.getElementById('alert-id').value = '';
        }
        
        listView.classList.add('hidden');
        formView.classList.remove('hidden');
        const searchGrid = document.querySelector('.search-grid');
        if(searchGrid) searchGrid.classList.add('hidden');
    }

    function showList() {
        listView.classList.remove('hidden');
        formView.classList.add('hidden');
        const searchGrid = document.querySelector('.search-grid');
        if(searchGrid) searchGrid.classList.remove('hidden');
    }
});