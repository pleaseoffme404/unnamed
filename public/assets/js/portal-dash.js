document.addEventListener('DOMContentLoaded', async () => {
    
    const tutorName = document.getElementById('tutorName');
    const loadingState = document.getElementById('loadingState');
    const studentsGrid = document.getElementById('studentsGrid');
    const emptyState = document.getElementById('emptyState');
    
    const logoutBtn = document.getElementById('logoutBtn'); 

    try {
        const profileRes = await fetch('/api/tutores/app/me');
        const profileData = await profileRes.json();

        if (profileData.success) {
            if(tutorName) tutorName.textContent = profileData.data.nombres;
        } else {
            window.location.href = '/portal/';
            return;
        }

        const alumnosRes = await fetch('/api/tutores/app/mis-alumnos');
        if (!alumnosRes.ok) throw new Error('Server Error');
        const alumnosData = await alumnosRes.json();

        if (loadingState) loadingState.classList.add('hidden');

        if (alumnosData.success && alumnosData.data.length > 0) {
            if (studentsGrid) {
                studentsGrid.classList.remove('hidden');
                renderStudents(alumnosData.data);
            }
        } else {
            if (emptyState) emptyState.classList.remove('hidden');
        }

    } catch (error) {
        console.error(error);
        if (loadingState) loadingState.classList.add('hidden');
    }

    function renderStudents(alumnos) {
        if (!studentsGrid) return;
        studentsGrid.innerHTML = '';
        
        alumnos.forEach(alumno => {
            let rawImg = alumno.foto_url || alumno.imagen_url;
            let avatarUrl = '/assets/img/default-avatar.png';
            if (rawImg && rawImg.trim() !== '') avatarUrl = rawImg;

            const statusInfo = calcularEstado(alumno);
            
            const card = document.createElement('div');
            card.className = 'student-card';
            
            card.innerHTML = `
                <div style="position: relative; display: inline-block;">
                    <img 
                        src="${avatarUrl}" 
                        onerror="this.onerror=null; this.src='/assets/img/default-avatar.png';"
                        alt="Foto" 
                        class="student-avatar" 
                        style="border-color: ${statusInfo.color}"
                    >
                    <span style="position: absolute; bottom: 10px; right: 0; background: ${statusInfo.color}; color: white; border-radius: 50%; padding: 5px; width: 24px; height: 24px; font-size: 12px; display: flex; align-items: center; justify-content: center;">
                        <i class="${statusInfo.icon}"></i>
                    </span>
                </div>
                
                <h3 class="student-name">${alumno.nombres}</h3>
                <p class="student-info">${alumno.grado || '?'}° ${alumno.grupo || ''}</p>

                <div style="background: ${statusInfo.bg}; color: ${statusInfo.text}; padding: 10px; border-radius: 10px; margin-bottom: 15px; font-weight: bold; border: 1px solid ${statusInfo.color}">
                    ${statusInfo.label}
                </div>

                <div style="display: flex; justify-content: center; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 15px;">
                   ${alumno.ultima_entrada ? 
                        `<span><i class="fa-solid fa-clock-rotate-left"></i> Último: ${new Date(alumno.ultima_entrada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>` 
                        : '<span>Sin actividad reciente</span>'}
                </div>

                <button class="btn btn-portal" style="padding: 10px; font-size: 0.9rem; background-color: var(--bg-input); color: var(--text-primary);" onclick="verDetalle(${alumno.id_perfil_alumno})">
                    <i class="fa-solid fa-list-check"></i> Ver Historial
                </button>
            `;
            
            studentsGrid.appendChild(card);
        });
    }

    function calcularEstado(alumno) {
        if (!alumno.ultima_entrada) {
            return { label: 'Sin Actividad', color: '#9ca3af', bg: '#f3f4f6', text: '#374151', icon: 'fa-bed' };
        }
        const ahora = new Date();
        const entrada = new Date(alumno.ultima_entrada);
        const salida = alumno.ultima_salida ? new Date(alumno.ultima_salida) : null;
        
        const esHoy = entrada.toDateString() === ahora.toDateString();

        if (esHoy) {
            if (salida && salida > entrada) {
                return { label: '🔴 Ya salió', color: '#ef4444', bg: '#fee2e2', text: '#991b1b', icon: 'fa-person-walking-arrow-right' };
            }
            return { label: '🟢 En la Escuela', color: '#10b981', bg: '#d1fae5', text: '#065f46', icon: 'fa-school' };
        }
        return { label: '⚪ Fuera', color: '#6b7280', bg: '#f3f4f6', text: '#1f2937', icon: 'fa-house' };
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/tutores/app/logout', { method: 'POST' });
                window.location.href = '/portal/';
            } catch (error) {
                window.location.href = '/portal/';
            }
        });
    }
});

window.verDetalle = (id) => {
    window.location.href = `/portal/alumno/?id=${id}`;
};