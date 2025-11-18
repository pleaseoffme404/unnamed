document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadDashboardData();
});

function setupNavigation() {
    const btnScanQr = document.getElementById('btn-scan-qr');
    const btnRegisAlumno = document.getElementById('btn-regis-alumno');
    const btnRegisTutor = document.getElementById('btn-regis-tutor');
    const btnCrearAnuncio = document.getElementById('btn-crear-anuncio');

    if (btnScanQr) {
        btnScanQr.addEventListener('click', () => window.location.href = '/scanQR/index.html');
    }
    if (btnRegisAlumno) {
        btnRegisAlumno.addEventListener('click', () => window.location.href = '/alumnos/register/index.html');
    }
    if (btnRegisTutor) {
        btnRegisTutor.addEventListener('click', () => window.location.href = '/tutores/register/index.html');
    }
    if (btnCrearAnuncio) {
        btnCrearAnuncio.addEventListener('click', () => window.location.href = '/announcements/index.html');
    }
}

async function loadDashboardData() {
    try {
        const response = await apiFetch('/api/stats/counts', 'GET');
        
        if (response.success) {
            const data = response.data;

            const cardTutores = document.querySelector('#card-tutores .stat-number');
            const cardAnuncios = document.querySelector('#card-anuncios .stat-number');

            if (cardTutores) cardTutores.textContent = data.tutores || 0;
            if (cardAnuncios) cardAnuncios.textContent = data.anuncios || 0; 
            
            renderAlumnosChart(data.alumnos || 0);
        }

    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}

function renderAlumnosChart(totalAlumnos) {
    const ctx = document.getElementById('alumnosChart');
    if (!ctx) return;

    if (window.alumnosChartInstance) {
        window.alumnosChartInstance.destroy();
    }

    const metaAlumnos = 500; 
    const faltantes = Math.max(0, metaAlumnos - totalAlumnos);

    window.alumnosChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Registrados', 'Espacio Disponible'],
            datasets: [{
                data: [totalAlumnos, faltantes],
                backgroundColor: [
                    'rgba(88, 101, 242, 1)', 
                    'rgba(227, 229, 232, 1)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
            }
        }
    });
}