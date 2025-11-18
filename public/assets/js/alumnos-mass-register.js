document.getElementById('csv-upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const fileInput = document.getElementById('archivo_csv');
    const errorEl = document.getElementById('error-message');
    const successEl = document.getElementById('success-message');
    
    errorEl.textContent = '';
    successEl.textContent = '';

    if (fileInput.files.length === 0) {
        errorEl.textContent = 'Por favor, selecciona un archivo CSV.';
        return;
    }

    const formData = new FormData();
    formData.append('archivo_csv', fileInput.files[0]);
    
    successEl.textContent = 'Procesando archivo, por favor espera...';

    try {
        const response = await fetch('/api/alumnos/mass-register', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            successEl.textContent = data.message;
            form.reset();
        } else {
            let errorMsg = data.message;
            if (data.errores && data.errores.length > 0) {
                errorMsg += '\n' + data.errores.join('\n');
            }
            throw new Error(errorMsg);
        }
    } catch (error) {
        successEl.textContent = '';
        errorEl.textContent = error.message.replace(/\n/g, '<br>');
        errorEl.innerHTML = errorEl.textContent;
    }
});