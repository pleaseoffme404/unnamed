document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const dropdown = document.getElementById('search-dropdown');
    const selectedDiv = document.getElementById('selected-student');
    const btnEntrada = document.getElementById('btn-entrada');
    const btnSalida = document.getElementById('btn-salida');
    const feedback = document.getElementById('feedback');

    let allStudents = [];
    let currentStudentId = null;

    loadStudents();

    async function loadStudents() {
        try {
            const response = await apiFetch('/api/alumnos', 'GET');
            if(response.success) {
                allStudents = response.data;
            }
        } catch (e) { console.error(e); }
    }

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        dropdown.innerHTML = '';
        
        if (term.length < 2) {
            dropdown.classList.remove('show');
            return;
        }

        const filtered = allStudents.filter(s => 
            `${s.nombres} ${s.apellido_paterno} ${s.boleta}`.toLowerCase().includes(term)
        ).slice(0, 5);

        if (filtered.length > 0) {
            filtered.forEach(s => {
                const div = document.createElement('div');
                div.className = 'dropdown-item';
                div.textContent = `${s.nombres} ${s.apellido_paterno} (${s.boleta})`;
                div.onclick = () => selectStudent(s);
                dropdown.appendChild(div);
            });
            dropdown.classList.add('show');
        } else {
            dropdown.classList.remove('show');
        }
    });

    function selectStudent(s) {
        currentStudentId = s.id_perfil_alumno;
        searchInput.value = '';
        dropdown.classList.remove('show');
        
        document.getElementById('s-name').textContent = `${s.nombres} ${s.apellido_paterno}`;
        document.getElementById('s-boleta').textContent = `Boleta: ${s.boleta}`;
        document.getElementById('s-avatar').src = s.imagen_url || '../assets/img/default-avatar.png';
        
        selectedDiv.classList.add('active');
        btnEntrada.disabled = false;
        btnSalida.disabled = false;
        feedback.textContent = '';
    }

    async function simular(tipo) {
        if (!currentStudentId) return;
        
        feedback.textContent = 'Procesando...';
        feedback.style.color = 'var(--text-secondary)';
        
        try {
            const response = await apiFetch('/api/asistencia/simular', 'POST', {
                id_alumno: currentStudentId,
                tipo: tipo
            });

            if (response.success) {
                feedback.textContent = response.message;
                feedback.style.color = 'var(--success)';
                
                setTimeout(() => {
                    selectedDiv.classList.remove('active');
                    btnEntrada.disabled = true;
                    btnSalida.disabled = true;
                    currentStudentId = null;
                    feedback.textContent = '';
                }, 2000);
            }
        } catch (error) {
            feedback.textContent = error.message || 'Error al simular.';
            feedback.style.color = 'var(--danger)';
        }
    }

    btnEntrada.addEventListener('click', () => simular('entrada'));
    btnSalida.addEventListener('click', () => simular('salida'));

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
});