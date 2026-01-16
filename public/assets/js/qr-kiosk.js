document.addEventListener('DOMContentLoaded', () => {
    const qrContainer = document.getElementById('qrcode');
    const progressBar = document.getElementById('progress-bar');
    const clockDisplay = document.getElementById('header-clock');
    
    const defaultState = document.getElementById('default-state');
    const userResult = document.getElementById('user-result');
    const userPhoto = document.getElementById('user-photo');
    const userName = document.getElementById('user-name');
    const userGroup = document.getElementById('user-group');
    const accessStatus = document.getElementById('access-status');
    const scheduleIn = document.getElementById('schedule-in');
    const scheduleOut = document.getElementById('schedule-out');
    
    const vehicleCard = document.getElementById('vehicle-card');
    const vehicleDesc = document.getElementById('vehicle-desc');
    const vehicleVisual = document.getElementById('vehicle-visual');

    const btnLock = document.getElementById('back-to-dashboard-secure');
    const modalAuth = document.getElementById('reauth-modal');
    const reauthForm = document.getElementById('reauth-form');
    const cancelReauth = document.getElementById('cancel-reauth');
    const btnUnlockSubmit = reauthForm.querySelector('button[type="submit"]'); 
    
    const simSelect = document.getElementById('sim-student-select');
    const simBtn = document.getElementById('btn-simulate-scan');

    let currentToken = null;
    let timerInterval = null;
    const REFRESH_RATE = 30;

    init();

    function init() {
        lockSession(); 
        
        startClock();
        startKioskLoop();
        loadStudentsSim();
        setupAuthLock();
    }

    async function lockSession() {
        try {
            await apiFetch('/api/auth/kiosk/lock', 'POST');
            console.log('🔒 Modo Kiosco Activado: Sesión bloqueada para navegación.');
        } catch (error) {
            console.error('Error al bloquear sesión:', error);
        }
    }

    function startClock() {
        setInterval(() => {
            const now = new Date();
            clockDisplay.textContent = now.toLocaleTimeString('es-MX', { hour12: false });
        }, 1000);
    }

    function startKioskLoop() {
        fetchNewToken();
        timerInterval = setInterval(fetchNewToken, REFRESH_RATE * 1000);
    }

    async function fetchNewToken() {
        try {
            const response = await apiFetch('/api/qr/generate', 'GET');
            if (response.success) {
                currentToken = response.token;
                renderQR(currentToken);
                resetProgressBar();
            }
        } catch (error) {
            console.error(error);
        }
    }

    function renderQR(text) {
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: text,
            width: 250,
            height: 250,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }

    function resetProgressBar() {
        progressBar.style.transition = 'none';
        progressBar.style.width = '100%';
        void progressBar.offsetWidth;
        progressBar.style.transition = `width ${REFRESH_RATE}s linear`;
        progressBar.style.width = '0%';
    }

    function showAccessResult(data, type, status, message) {
        const alumno = data.alumno;
        
        defaultState.classList.remove('active');
        userResult.classList.add('active');

        userPhoto.src = alumno.imagen_url || '/assets/img/default-avatar.png';
        userName.textContent = `${alumno.nombres} ${alumno.apellido_paterno}`;
        userGroup.textContent = alumno.grupo ? `Grupo ${alumno.grupo}` : 'Sin Grupo';
        
        scheduleIn.textContent = alumno.hora_entrada ? alumno.hora_entrada.substring(0,5) : '--:--';
        scheduleOut.textContent = alumno.hora_salida ? alumno.hora_salida.substring(0,5) : '--:--';

        accessStatus.className = 'status-display'; 
        const iconSpan = document.createElement('span');
        iconSpan.className = 'status-icon';
        const textSpan = document.createElement('span');
        textSpan.className = 'status-text';
        accessStatus.innerHTML = '';
        accessStatus.appendChild(iconSpan);
        accessStatus.appendChild(textSpan);

        if (type === 'salida') {
            accessStatus.classList.add('out');
            iconSpan.textContent = '';
            textSpan.textContent = 'Salida Registrada';
        } else {
            if (status === 'retardo') {
                accessStatus.classList.add('late');
                iconSpan.textContent = '';
                textSpan.textContent = 'Entrada con Retardo';
            } else {
                iconSpan.textContent = '';
                textSpan.textContent = 'Entrada Autorizada';
            }
        }

        if (alumno.v_tipo) {
            vehicleCard.classList.remove('hidden');
            vehicleDesc.textContent = `${alumno.v_tipo} - ${alumno.v_desc}`;
            
            if (alumno.v_imagen) {
                vehicleVisual.innerHTML = `<img src="${alumno.v_imagen}" class="vehicle-img" alt="Vehículo">`;
            } else {
                vehicleVisual.innerHTML = `<span class="vehicle-icon">🚗</span>`;
            }
        } else {
            vehicleCard.classList.add('hidden');
        }

        setTimeout(() => {
            userResult.classList.remove('active');
            defaultState.classList.add('active');
        }, 10000); 
    }

    async function loadStudentsSim() {
        try {
            const res = await apiFetch('/api/alumnos', 'GET');
            if(res.success) {
                simSelect.innerHTML = '<option value="">Seleccionar Alumno</option>';
                res.data.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.id_perfil_alumno;
                    opt.textContent = `${s.nombres} ${s.apellido_paterno}`;
                    simSelect.appendChild(opt);
                });
            }
        } catch(e) {}
    }

    simBtn.addEventListener('click', async () => {
        const id = simSelect.value;
        if(!id || !currentToken) return;

        try {
            const res = await apiFetch('/api/asistencia/registrar-qr', 'POST', {
                qr_token: currentToken,
                id_alumno: id
            });

            if(res.success) {
                showAccessResult(res, res.tipo, res.estatus_llegada, res.message);
            } else {
                alert(res.message);
            }
        } catch (e) {
            alert(e.message);
        }
    });

    function setupAuthLock() {
        btnLock.addEventListener('click', (e) => {
            e.preventDefault();
            modalAuth.classList.add('active');
            document.getElementById('reauth-pass').value = ''; 
        });

        cancelReauth.addEventListener('click', () => {
            modalAuth.classList.remove('active');
        });

        reauthForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const passInput = document.getElementById('reauth-pass');
            const pass = passInput.value;
            
            if(!pass) return;

            const originalText = btnUnlockSubmit.textContent;
            btnUnlockSubmit.textContent = 'Verificando...';
            btnUnlockSubmit.disabled = true;

            try {
                const res = await apiFetch('/api/auth/kiosk/unlock', 'POST', { password: pass });

                if (res.success) {
                    window.location.href = '/dashboard/index.html';
                } else {
                    alert('Contraseña incorrecta');
                    btnUnlockSubmit.textContent = originalText;
                    btnUnlockSubmit.disabled = false;
                    passInput.value = '';
                    passInput.focus();
                }
            } catch (error) {
                console.error(error);
                alert('Error de conexión');
                btnUnlockSubmit.textContent = originalText;
                btnUnlockSubmit.disabled = false;
            }
        });
    }
});