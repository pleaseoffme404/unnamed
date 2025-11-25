document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('mass-tutor-form');
    const fileInput = document.getElementById('csvFile');
    const uploadArea = document.getElementById('upload-area');
    const fileNameDisplay = document.getElementById('file-name');
    const submitBtn = document.getElementById('btn-upload');
    const feedback = document.getElementById('form-feedback');
    const logContainer = document.getElementById('log-content');
    const errorLog = document.getElementById('error-log');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('dragover'), false);
    });

    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    if (fileInput) {
        fileInput.addEventListener('change', function() {
            handleFiles(this.files);
        });
    }

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            
            if (!file.name.toLowerCase().endsWith('.csv')) {
                alert('Por favor sube un archivo con extensión .csv');
                return;
            }

            if (fileInput.files !== files) {
                fileInput.files = files;
            }

            fileNameDisplay.style.display = 'block';
            fileNameDisplay.innerHTML = `Archivo listo: <span style="color:var(--accent-primary);">${file.name}</span>`;
            
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-secondary');
            submitBtn.classList.add('btn-primary');
        }
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (fileInput.files.length === 0) {
                alert("Por favor selecciona un archivo primero.");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Procesando...';
            feedback.style.display = 'none';
            errorLog.style.display = 'none';
            logContainer.innerHTML = '';

            const formData = new FormData(form);

            try {
                const response = await apiFetch('/api/tutores/register-masivo', 'POST', formData);
                
                feedback.style.display = 'block';
                
                if (response.success) {
                    feedback.className = 'feedback-message success';
                    feedback.textContent = response.message;

                    if (response.errores && response.errores.length > 0) {
                        errorLog.style.display = 'block';
                        response.errores.forEach(err => {
                            const div = document.createElement('div');
                            div.className = 'log-item';
                            div.textContent = `Fila ${err.fila}: ${err.error}`;
                            logContainer.appendChild(div);
                        });
                    } else {
                        form.reset();
                        fileNameDisplay.textContent = '';
                        setTimeout(() => {
                            submitBtn.textContent = 'Procesar Archivo';
                        }, 2000);
                    }
                }

            } catch (error) {
                console.error(error);
                feedback.className = 'feedback-message error';
                feedback.style.display = 'block';
                feedback.textContent = error.message || 'Error al procesar el archivo.';
            } finally {
                if(fileInput.files.length > 0) submitBtn.disabled = false;
                if(submitBtn.disabled) submitBtn.textContent = 'Procesar Archivo';
            }
        });
    }
});