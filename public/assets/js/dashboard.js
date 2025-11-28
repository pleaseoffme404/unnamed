document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadDashboardData();
    loadRecentActivity();
});

function setupNavigation() {
    const navMap = {
        'btn-scan-qr': '/scanQR/index.html',
        'btn-regis-alumno': '/alumnos/register/index.html',
        'btn-regis-tutor': '/tutores/register/index.html',
        'btn-crear-anuncio': '/announcements/index.html',
        'btn-simulador': '/historial/simulador.html'
    };

    for (const [id, url] of Object.entries(navMap)) {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => window.location.href = url);
    }
}

async function loadDashboardData() {
    try {
        const response = await apiFetch('/api/stats/counts', 'GET');
        
        if (response.success) {
            const data = response.data;
            setText('stat-alumnos', data.alumnos);
            setText('stat-tutores', data.tutores);
            renderAttendanceChart(data);
        }
    } catch (error) {
        console.error(error);
    }
}

async function loadRecentActivity() {
    const tbody = document.getElementById('recent-tbody');
    try {
        const response = await apiFetch('/api/asistencia', 'GET');
        if (response.success) {
            const recientes = response.data.slice(0, 5); 
            tbody.innerHTML = '';
            
            if(recientes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">Sin actividad hoy.</td></tr>';
                return;
            }

            recientes.forEach(item => {
                const tr = document.createElement('tr');
                const horaEntrada = new Date(item.fecha_hora_entrada).toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'});
                const horaSalida = item.fecha_hora_salida ? new Date(item.fecha_hora_salida).toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'}) : null;
                
                let accion = 'Entrada';
                let hora = horaEntrada;
                let color = 'var(--success)';

                if (item.fecha_hora_salida) {
                    accion = 'Salida';
                    hora = horaSalida;
                    color = 'var(--warning)';
                }

                let statusBadge = '';
                if (!item.fecha_hora_salida) { 
                    if (item.estatus === 'retardo') {
                        statusBadge = `<span class="status-badge status-late">Retardo</span>`;
                    } else {
                        statusBadge = `<span class="status-badge status-ontime">A Tiempo</span>`;
                    }
                } else {
                    statusBadge = `<span style="color:var(--text-muted); font-size:11px;">—</span>`;
                }

                tr.innerHTML = `
                    <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${item.imagen_url || '/assets/img/default-avatar.png'}" style="width:24px; height:24px; border-radius:50%;">
                            <span style="font-weight:600;">${item.nombres} ${item.apellido_paterno}</span>
                        </div>
                    </td>
                    <td style="font-family:monospace;">${hora}</td>
                    <td>${statusBadge}</td>
                    <td><span style="color:${color}; font-weight:bold; font-size:12px;">● ${accion}</span></td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error(e);
        if(tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Error al cargar.</td></tr>';
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if(el) el.textContent = value || 0;
}

function renderAttendanceChart(data) {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;

    if (window.attendanceChartInstance) {
        window.attendanceChartInstance.destroy();
    }

    const total = data.alumnos || 0;
    const enPlantel = data.en_plantel || 0;
    const yaSalieron = data.ya_salieron || 0;
    const ausentes = Math.max(0, total - (enPlantel + yaSalieron));

    const colors = {
        in: '#23A559',
        out: '#F0B132',
        absent: '#E3E5E8'
    };

    window.attendanceChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['En Plantel', 'Ya Salieron', 'Ausentes'],
            datasets: [{
                data: [enPlantel, yaSalieron, ausentes],
                backgroundColor: [colors.in, colors.out, colors.absent],
                borderWidth: 2,
                borderColor: getComputedStyle(document.body).getPropertyValue('--bg-panel')
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        font: { family: 'Lato', size: 12 },
                        color: getComputedStyle(document.body).getPropertyValue('--text-primary')
                    }
                }
            }
        }
    });
}