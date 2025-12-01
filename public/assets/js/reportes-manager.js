document.addEventListener('DOMContentLoaded', () => {
    loadGroupsFilter();
});

async function loadGroupsFilter() {
    const select = document.getElementById('f-grupo');
    if(!select) return;

    try {
        const response = await apiFetch('/api/grupos', 'GET');
        if(response.success) {
            response.data.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g.grupo;
                opt.textContent = g.grupo;
                select.appendChild(opt);
            });
        }
    } catch(e) {}
}

window.downloadReport = function(tipo, formato) {
    const form = document.getElementById(`form-${tipo}`);
    const formData = new FormData(form);
    const feedback = document.getElementById(`feedback-${tipo}`);
    
    if(feedback) feedback.style.display = 'none';

    if (tipo === 'asistencia') {
        const inicio = formData.get('fechaInicio');
        const fin = formData.get('fechaFin');

        if (!inicio || !fin) {
            showError(feedback, 'Selecciona el rango de fechas.');
            return;
        }
        if (new Date(inicio) > new Date(fin)) {
            showError(feedback, 'La fecha inicio no puede ser mayor a la fecha fin.');
            return;
        }
    }
    
    const params = new URLSearchParams();
    params.append('formato', formato);
    
    for (const [key, value] of formData.entries()) {
        if (value) params.append(key, value);
    }

    const url = `/api/reportes/${tipo}?${params.toString()}`;
    window.open(url, '_blank');
};

function showError(el, msg) {
    if(el) {
        el.textContent = msg;
        el.style.display = 'block';
    } else {
        alert(msg);
    }
}








