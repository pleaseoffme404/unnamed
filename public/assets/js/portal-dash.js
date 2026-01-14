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
            tutorName.textContent = profileData.data.nombres;
        } else {
            window.location.href = '/portal/';
            return;
        }

        const alumnosRes = await fetch('/api/tutores/app/mis-alumnos');
        const alumnosData = await alumnosRes.json();

        loadingState.classList.add('hidden');

        if (alumnosData.success && alumnosData.data.length > 0) {
            studentsGrid.classList.remove('hidden');
            renderStudents(alumnosData.data);
        } else {
            emptyState.classList.remove('hidden');
        }

    } catch (error) {
        window.location.href = '/portal/';
    }

    function renderStudents(alumnos) {
        studentsGrid.innerHTML = '';
        
        alumnos.forEach(alumno => {
            const avatarUrl = alumno.foto_url ? alumno.foto_url : '/assets/img/default-avatar.png';
            const statusInfo = calcularEstado(alumno);
            
            const card = document.createElement('div');
            card.className = 'student-card';
            
            card.innerHTML = `
                <div style="position: relative; display: inline-block;">
                    <img src="${avatarUrl}" alt="Foto" class="student-avatar" style="border-color: ${statusInfo.color}">
                    <span style="position: absolute; bottom: 10px; right: 0; background: ${statusInfo.color}; color: white; border-radius: 50%; padding: 5px; width: 24px; height: 24px; font-size: 12px; display: flex; align-items: center; justify-content: center;">
                        <i class="${statusInfo.icon}"></i>
                    </span>
                </div>
                
                <h3 class="student-name">${alumno.nombres}</h3>
                <p class="student-info">${alumno.grado}° ${alumno.grupo}</p>

                <div style="background: ${statusInfo.bg}; color: ${statusInfo.text}; padding: 10px; border-radius: 10px; margin-bottom: 15px; font-weight: bold; border: 1px solid ${statusInfo.color}">
                    ${statusInfo.label}
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 15px;">
                    <span><i class="fa-regular fa-clock"></i> Entrada: ${alumno.horario_entrada ? alumno.horario_entrada.slice(0,5) : '--:--'}</span>
                    <span><i class="fa-solid fa-person-walking-arrow-right"></i> Salida: ${alumno.horario_salida ? alumno.horario_salida.slice(0,5) : '--:--'}</span>
                </div>

                <button class="btn btn-portal" style="padding: 10px; font-size: 0.9rem; background-color: var(--bg-input); color: var(--text-primary);" onclick="verDetalle(${alumno.id_perfil_alumno})">
                    <i class="fa-solid fa-list-check"></i> Ver Historial Completo
                </button>
            `;
            
            studentsGrid.appendChild(card);
        });
    }

    function calcularEstado(alumno) {
        if (!alumno.horario_entrada) return { label: 'Sin Horario', color: '#9ca3af', bg: '#f3f4f6', text: '#374151', icon: 'fa-question' };

        const ahora = new Date();
        const hoyString = ahora.toISOString().split('T')[0];
        
        const fechaEntrada = alumno.ultima_entrada ? new Date(alumno.ultima_entrada) : null;
        const fechaSalida = alumno.ultima_salida ? new Date(alumno.ultima_salida) : null;
        
        const entroHoy = fechaEntrada && fechaEntrada.toISOString().split('T')[0] === hoyString;
        
        const [horasE, minsE] = alumno.horario_entrada.split(':');
        const horaLimiteEntrada = new Date();
        horaLimiteEntrada.setHours(parseInt(horasE), parseInt(minsE), 0);

        if (entroHoy) {
            if (fechaSalida && fechaSalida > fechaEntrada) {
                return { label: 'Salida Registrada', color: '#6b7280', bg: '#f3f4f6', text: '#1f2937', icon: 'fa-house' };
            }
            
            if (alumno.ultimo_estatus === 'retardo') {
                return { label: 'En Clases (Llegó Tarde)', color: '#f59e0b', bg: '#fef3c7', text: '#92400e', icon: 'fa-triangle-exclamation' };
            }

            return { label: '🟢 En la Escuela', color: '#10b981', bg: '#d1fae5', text: '#065f46', icon: 'fa-school' };
        }

        if (ahora > horaLimiteEntrada) {
            return { label: '🔴 Inasistencia', color: '#ef4444', bg: '#fee2e2', text: '#991b1b', icon: 'fa-xmark' };
        }

        return { label: 'Esperando Entrada', color: '#3b82f6', bg: '#dbeafe', text: '#1e40af', icon: 'fa-clock' };
    }

    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/tutores/app/logout', { method: 'POST' });
            window.location.href = '/portal/';
        } catch (error) {
            window.location.href = '/portal/';
        }
    });
});

window.verDetalle = (id) => {
    Swal.fire({
        title: 'Detalle de Asistencia',
        text: 'Redirigiendo al historial detallado...',
        icon: 'info',
        timer: 1500,
        showConfirmButton: false
    });
};