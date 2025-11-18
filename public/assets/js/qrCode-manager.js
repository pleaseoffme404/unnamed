document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.getElementById('back-to-dashboard-secure');
    const reauthModal = document.getElementById('reauth-modal');
    const reauthCloseButton = document.getElementById('reauth-close-button');
    const reauthForm = document.getElementById('reauth-form');
    const reauthPasswordInput = document.getElementById('reauth-password');
    const reauthErrorMessage = document.getElementById('reauth-error-message');
    const headerClock = document.getElementById('header-clock'); 

    function updateClock() {
        if (!headerClock) return; 

        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        headerClock.textContent = `${hours}:${minutes}:${seconds}`;
    }

    updateClock();
    setInterval(updateClock, 1000);

    const openReauthModal = () => {
        if (reauthModal) {
             if(reauthPasswordInput) reauthPasswordInput.value = '';
             if(reauthErrorMessage) reauthErrorMessage.textContent = '';
             reauthPasswordInput?.classList.remove('is-invalid');
            reauthModal.style.display = 'block';
             reauthPasswordInput?.focus();
        }
    };

    const closeReauthModal = () => {
        if (reauthModal) {
            reauthModal.style.display = 'none';
        }
    };

    if (backButton) {
        backButton.addEventListener('click', (event) => {
            event.preventDefault();
            openReauthModal();
        });
    }

    if (reauthCloseButton) {
        reauthCloseButton.addEventListener('click', closeReauthModal);
    }

    window.addEventListener('click', (event) => {
        if (event.target === reauthModal) {
            closeReauthModal();
        }
    });

     window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && reauthModal && reauthModal.style.display === 'block') {
            closeReauthModal();
        }
    });

    if (reauthForm && reauthPasswordInput) {
        reauthForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (reauthPasswordInput.classList.contains('is-invalid')) {
                return;
            }

            const password = reauthPasswordInput.value;
            console.log('Intentando verificar contraseña...');
            if (reauthErrorMessage) reauthErrorMessage.textContent = '';

            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                if (password === "incorrecta") {
                    throw new Error("Contraseña incorrecta");
                }
                console.log('Re-autenticación exitosa (simulada). Redirigiendo...');
                window.location.href = '/dashboard/index.html'; 
            } catch (error) {
                console.error('Error de re-autenticación:', error.message);
                if (reauthErrorMessage) {
                    reauthErrorMessage.textContent = error.message || 'Error al verificar. Intenta de nuevo.';
                }
                reauthPasswordInput.classList.add('is-invalid');
            }
        });
    }

    function displayScanData(userData, vehicleData) {
        const resultsContainer = document.getElementById('scan-results');
        const waitingMessage = document.getElementById('waiting-scan-message');
        

        const userNameEl = document.getElementById('user-name');
        const userGroupEl = document.getElementById('user-group');
        const userScheduleEl = document.getElementById('user-schedule-time');
        const userPhotoEl = document.querySelector('.user-photo-placeholder');
        const userStatusEl = document.getElementById('user-status');
        const vehicleColorEl = document.getElementById('vehicle-color');
        const vehicleTypeEl = document.getElementById('vehicle-type');
        const vehiclePhotoEl = document.querySelector('.vehicle-photo-placeholder');

        if (!resultsContainer) return;

        resultsContainer.classList.add('has-data'); 

        if (userNameEl) userNameEl.textContent = userData.name || 'Desconocido';
        if (userGroupEl) userGroupEl.textContent = userData.group || 'N/A';
        if (userScheduleEl) userScheduleEl.textContent = userData.schedule || '00:00 - 00:00';
        if (userPhotoEl && userData.photoUrl) {
            userPhotoEl.style.backgroundImage = `url('${userData.photoUrl}')`;
            userPhotoEl.style.backgroundColor = 'transparent'; 
        } else if (userPhotoEl) {
             userPhotoEl.style.backgroundImage = 'none';
             userPhotoEl.style.backgroundColor = 'var(--bg-tertiary)'; 
        }
        if (userData.status) { 
            userStatusEl.textContent = userData.status; 
            userStatusEl.className = 'scan-status'; 
            if (userData.status.toLowerCase() === 'entrada normal') {
                userStatusEl.classList.add('status-normal');
            } else if (userData.status.toLowerCase() === 'entrada con retardo') {
                userStatusEl.classList.add('status-late');
            }
             userStatusEl.style.display = 'inline-block'; 
        } else {
            userStatusEl.style.display = 'none';
            userStatusEl.textContent = '';
            userStatusEl.className = 'scan-status';
        }


        if (vehicleData) {
            resultsContainer.classList.remove('no-vehicle');
            if (vehicleColorEl) vehicleColorEl.textContent = vehicleData.color || 'Color desc.';
            if (vehicleTypeEl) vehicleTypeEl.textContent = vehicleData.type || 'Tipo desc.';
             if (vehiclePhotoEl && vehicleData.photoUrl) {
                vehiclePhotoEl.style.backgroundImage = `url('${vehicleData.photoUrl}')`;
                vehiclePhotoEl.style.backgroundColor = 'transparent';
             } else if (vehiclePhotoEl) {
                  vehiclePhotoEl.style.backgroundImage = 'none';
                 vehiclePhotoEl.style.backgroundColor = 'var(--bg-tertiary)';
             }
        } else {
             resultsContainer.classList.add('no-vehicle');
        }
    }

 const simulateScanButton = document.getElementById('simulate-scan-btn');
    if (simulateScanButton) {
        simulateScanButton.addEventListener('click', () => {
            console.log('Simulating scan...');

            const exampleUserDataNormal = {
                name: "Ana Sofía Ramírez",
                group: "6A",
                schedule: "07:00 - 14:00",
                status: "Entrada Normal", 
                photoUrl: null 
            };
             const exampleUserDataLate = {
                name: "Luis Ángel Morales",
                group: "5B",
                schedule: "08:00 - 15:00", 
                status: "Entrada con Retardo",
                photoUrl: "../assets/img/user-placeholder.png"
            };
            const exampleVehicleData = {
                color: "Azul",
                type: "Scooter",
                photoUrl: null
            };

            const simulateLate = Math.random() < 0.5; 
            const userDataToDisplay = simulateLate ? exampleUserDataLate : exampleUserDataNormal;
            const vehicleDataToDisplay = simulateLate ? exampleVehicleData : null; 

            displayScanData(userDataToDisplay, vehicleDataToDisplay);

            setTimeout(() => {
            }, 10000);
        });
    }
});