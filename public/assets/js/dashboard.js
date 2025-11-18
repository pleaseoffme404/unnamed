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
        btnScanQr.addEventListener('click', () => {
            window.location.href = '/scarQR';
        });
    }

    if (btnRegisAlumno) {
        btnRegisAlumno.addEventListener('click', () => {
            window.location.href = '/alumnos/registrar';
        });
    }

    if (btnRegisTutor) {
        btnRegisTutor.addEventListener('click', () => {
            window.location.href = '/tutores/registrar';
        });
    }

    if (btnCrearAnuncio) {
        btnCrearAnuncio.addEventListener('click', () => {
            window.location.href = '/anouncements';
        });
    }
}

async function loadDashboardData() {
    try {
        const response = await fetch('/api/stats/counts');
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/';
                return;
            }
            throw new Error('Error al cargar los datos');
        }

        const data = await response.json();

        const cardTutores = document.querySelector('#card-tutores .stat-number');
        const cardAnuncios = document.querySelector('#card-anuncios .stat-number');

        if (cardTutores) cardTutores.textContent = data.tutores;
        if (cardAnuncios) cardAnuncios.textContent = data.anuncios;
        
        renderAlumnosChart(data.alumnos);

    } catch (error) {
        console.error('Error en loadDashboardData:', error);
    }
}

function renderAlumnosChart(totalAlumnos) {
    const ctx = document.getElementById('alumnosChart');
    if (!ctx) return;

    const metaAlumnos = 500;
    const faltantes = Math.max(0, metaAlumnos - totalAlumnos);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Registrados', 'Faltantes'],
            datasets: [{
                label: 'Alumnos',
                data: [totalAlumnos, faltantes],
                backgroundColor: [
                    'rgba(9, 105, 218, 1)',
                    'rgba(42, 49, 57, 1)'
                ],
                borderColor: [
                    'rgba(9, 105, 218, 1)',
                    'rgba(42, 49, 57, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true
                }
            }
        }
    });
}