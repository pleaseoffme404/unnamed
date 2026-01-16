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
                    <span style="position: absolute; bottom: 10px; right: 0; background: ${statusInfo.color}; color: white; border-radius: 50%; padding: 5px; width: 28px; height: 28px; font-size: 14px; display: flex; align-items: center; justify-content: center; border: 2px solid white;">
                        <i class="${statusInfo.icon}"></i>
                    </span>
                </div>
                
                <h3 class="student-name">${alumno.nombres}</h3>
                <p class="student-info">${alumno.grado || '?'}° ${alumno.grupo || ''}</p>

                <div style="background: ${statusInfo.bg}; color: ${statusInfo.text}; padding: 8px 15px; border-radius: 20px; margin-bottom: 15px; font-weight: bold; border: 1px solid ${statusInfo.color}; font-size: 0.9rem;">
                    <i class="${statusInfo.icon}" style="margin-right:5px;"></i> ${statusInfo.label}
                </div>

                <div style="display: flex; justify-content: center; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 15px;">
                   ${alumno.ultima_entrada ? 
                       `<span><i class="fa-solid fa-clock"></i> Entrada: ${new Date(alumno.ultima_entrada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>` 
                       : '<span>--:--</span>'}
                </div>

                <button class="btn btn-portal" style="padding: 10px; font-size: 0.9rem; background-color: var(--bg-input); color: var(--text-primary); width: 100%; border:none; cursor:pointer; border-radius:8px;" onclick="verDetalle(${alumno.id_perfil_alumno})">
                    Ver Historial
                </button>
            `;
            
            studentsGrid.appendChild(card);
        });
    }

   
    function calcularEstado(alumno) {
        const ahora = new Date();

        if (!alumno.ultima_entrada) {
            if (alumno.horario_salida) {
                const [hrsSalida, minsSalida] = alumno.horario_salida.split(':');
                const fechaSalida = new Date();
                fechaSalida.setHours(hrsSalida, minsSalida, 0);

                if (ahora > fechaSalida) {
                     return { label: 'Falta', color: '#ef4444', bg: '#fee2e2', text: '#991b1b', icon: 'fa-solid fa-xmark' }; // ROJO
                }
            }
            return { label: 'Pendiente', color: '#9ca3af', bg: '#f3f4f6', text: '#374151', icon: 'fa-solid fa-minus' }; // GRIS
        }
        
        const entrada = new Date(alumno.ultima_entrada);
        const salida = alumno.ultima_salida ? new Date(alumno.ultima_salida) : null;
        const esHoy = entrada.toDateString() === ahora.toDateString();

        if (!esHoy) {
            return { label: 'Pendiente', color: '#9ca3af', bg: '#f3f4f6', text: '#374151', icon: 'fa-solid fa-minus' };
        }

        if (salida && salida > entrada) {
            return { label: 'Salida', color: '#3b82f6', bg: '#eff6ff', text: '#1e40af', icon: 'fa-solid fa-person-walking-arrow-right' };
        }

        let esRetardo = false;
        
        if (alumno.horario_entrada) {
            const [hrs, mins] = alumno.horario_entrada.split(':');
            const fechaHorario = new Date(entrada); 
            fechaHorario.setHours(hrs, mins, 0);
            
            const toleranciaMs = 10 * 60 * 1000; 

            if (entrada.getTime() > (fechaHorario.getTime() + toleranciaMs)) {
                esRetardo = true;
            }
        }

        if (esRetardo) {
            return { label: 'Retardo', color: '#eab308', bg: '#fefce8', text: '#854d0e', icon: 'fa-solid fa-triangle-exclamation' }; // AMARILLO
        }

        return { label: 'En Clase', color: '#22c55e', bg: '#dcfce7', text: '#166534', icon: 'fa-solid fa-check' }; // VERDE
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