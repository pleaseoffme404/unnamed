document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('crud-modal');

    if (modal) {
        const closeButton = modal.querySelector('.close-button');
        const adminButtons = document.querySelectorAll('.admin-button'); 
        const modalTutorIdSpan = document.getElementById('modal-tutor-id');
        const crudForm = document.getElementById('crud-tutor-form');

        const openModal = (relatedId) => {
            if (modalTutorIdSpan) {
                modalTutorIdSpan.textContent = relatedId;
            }
            modal.style.display = 'block';
        };

        const closeModal = () => {
            modal.style.display = 'none';
            if (modalTutorIdSpan) {
                 modalTutorIdSpan.textContent = '';
            }
            if (crudForm) {
                crudForm.reset();
                crudForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
                crudForm.querySelectorAll('.error-message').forEach(el => el.textContent = '');
            }
        };

        adminButtons.forEach(button => {
            button.addEventListener('click', () => {
                const itemId = button.getAttribute('data-tutor-id') || button.getAttribute('data-item-id') || 'N/A';
                openModal(itemId);
            });
        });

        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        }

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.style.display === 'block') {
                closeModal();
            }
        });

         if (crudForm) {
             crudForm.addEventListener('submit', (event) => {
   
                 console.log('Formulario del modal intentando enviar...');
                 if (crudForm.querySelector('.is-invalid')) {
                      event.preventDefault();
                      console.log('Envío bloqueado por validación fallida.');
                 } else {
                     console.log('Validación OK (simulado). Enviando...');
                     event.preventDefault(); 
                 }
             });
         }
    }
});