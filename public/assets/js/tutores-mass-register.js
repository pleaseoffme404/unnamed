document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('mass-tutor-form');
    const fileInput = document.getElementById('csvFile');
    const uploadArea = document.getElementById('upload-area');
    const fileNameDisplay = document.getElementById('file-name');
    const submitBtn = document.getElementById('btn-upload');
    const feedback = document.getElementById('form-feedback');
    const logContainer = document.getElementById('log-content');
    const errorLog = document.getElementById('error-log');
    
    const btnDownload = document.getElementById('btn-download-template');
    const previewContainer = document.getElementById('preview-container');
    const previewTable = document.getElementById('preview-table-body');
    const previewStats = document.getElementById('preview-stats');
    const btnExportErrors = document.getElementById('btn-export-errors');

    let currentErrorData = [];

    if(btnDownload) {
        btnDownload.addEventListener('click', () => {
            const headers = [
                'nombres', 'apellido_paterno', 'apellido_materno', 
                'correo_electronico', 'telefono', 'contrasena', 'boleta_alumno'
            ];
            const example = [
                'Maria', 'Gomez', 'Ruiz', 
                'maria@tutor.com', '5598765432', 'Password123', '2020640001'
            ];
            const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + example.join(",");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "plantilla_tutores.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

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
            fileNameDisplay.innerHTML = `Analizando: <span style="color:var(--accent-primary);">${file.name}</span>`;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                parseAndPreview(e.target.result);
            };
            reader.readAsText(file);
        }
    }

    function parseAndPreview(csvText) {
        if(!previewTable) return; 

        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 501) {
            alert("El archivo excede el límite de 500 filas.");
            submitBtn.disabled = true;
            return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const expectedHeaders = ['nombres', 'apellido_paterno', 'correo_electronico', 'telefono'];
        const missing = expectedHeaders.filter(h => !headers.includes(h));
        
        if (missing.length > 0) {
            alert(`Faltan columnas obligatorias: ${missing.join(', ')}`);
            submitBtn.disabled = true;
            return;
        }

        let html = `<thead><tr>`;
        headers.forEach(h => html += `<th>${h}</th>`);
        html += `<th>Estado</th></tr></thead><tbody>`;

        let errorCount = 0;
        let totalRows = 0;

        const regexName = /^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s\.]+$/;
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const regexPhone = /^\d{10}$/;

        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(',');
            if (row.length !== headers.length) continue;

            totalRows++;
            let rowHtml = `<tr>`;
            let rowErrors = [];

            row.forEach((cell, index) => {
                const header = headers[index];
                const val = cell.trim();
                let isInvalid = false;
                let title = "";

                if (header === 'nombres' || header === 'apellido_paterno') {
                    if (!val || !regexName.test(val)) { isInvalid = true; title = "Solo letras."; }
                }
                else if (header === 'correo_electronico') {
                    if (!val || !regexEmail.test(val)) { isInvalid = true; title = "Email inválido."; }
                }
                else if (header === 'telefono') {
                    if (val && !regexPhone.test(val)) { isInvalid = true; title = "10 dígitos."; }
                }

                if (isInvalid) {
                    rowHtml += `<td style="background-color:rgba(218,55,60,0.2);" title="${title}">${val}</td>`;
                    rowErrors.push(title);
                } else {
                    rowHtml += `<td>${val}</td>`;
                }
            });

            if (rowErrors.length > 0) {
                rowHtml += `<td style="color:var(--danger);">⚠️ Error</td></tr>`;
                errorCount++;
            } else {
                rowHtml += `<td style="color:var(--success);">Ok</td></tr>`;
            }
            html += rowHtml;
        }
        html += `</tbody>`;
        previewTable.innerHTML = html;
        previewContainer.style.display = 'block';
        previewStats.textContent = `${totalRows} filas. ${errorCount} errores.`;
        
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-secondary'); 
        submitBtn.classList.add('btn-primary');
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (fileInput.files.length === 0) {
                alert("Selecciona un archivo.");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Procesando...';
            feedback.style.display = 'none';
            errorLog.style.display = 'none';
            if(btnExportErrors) btnExportErrors.style.display = 'none';
            logContainer.innerHTML = '';
            currentErrorData = [];

            const formData = new FormData(form);

            try {
                const response = await apiFetch('/api/tutores/register-masivo', 'POST', formData);
                
                feedback.style.display = 'block';
                if (response.success) {
                    feedback.className = 'feedback-message success';
                    feedback.textContent = response.message;

                    if (response.errores && response.errores.length > 0) {
                        currentErrorData = response.errores;
                        errorLog.style.display = 'block';
                        if(btnExportErrors) btnExportErrors.style.display = 'block';

                        response.errores.forEach(err => {
                            const div = document.createElement('div');
                            div.className = 'log-item';
                            const msg = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
                            div.textContent = `Fila ${err.fila}: ${msg}`;
                            logContainer.appendChild(div);
                        });
                    } else {
                        form.reset();
                        if(previewContainer) previewContainer.style.display = 'none';
                        fileNameDisplay.textContent = '';
                        setTimeout(() => { submitBtn.textContent = 'Procesar Archivo'; }, 2000);
                    }
                }
            } catch (error) {
                console.error(error);
                feedback.className = 'feedback-message error';
                feedback.style.display = 'block';
                feedback.textContent = error.message || 'Error.';
            } finally {
                if(fileInput.files.length > 0) submitBtn.disabled = false;
                if(submitBtn.disabled) submitBtn.textContent = 'Procesar Archivo';
            }
        });
    }

    if (btnExportErrors) {
        btnExportErrors.addEventListener('click', () => {
            if (currentErrorData.length === 0) return;
            const headers = ['Fila', 'Error', 'Datos_Originales'];
            const rows = currentErrorData.map(err => {
                const dataStr = err.data ? JSON.stringify(err.data).replace(/,/g, ';') : ''; 
                return `${err.fila},"${err.error}","${dataStr}"`;
            });
            const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "reporte_errores_tutores.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
});