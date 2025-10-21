document.addEventListener('DOMContentLoaded', () => {
    const alertsListContainer = document.querySelector('.alerts-list-container');
    const addAlertForm = document.getElementById('add-alert-form');

    if (addAlertForm) {
        addAlertForm.addEventListener('submit', (event) => {
            if (!event.defaultPrevented) { 
                console.log('Simulando adición de alerta...');
                 addAlertForm.reset();
            }
        });
    }

    if (alertsListContainer) {
        alertsListContainer.addEventListener('click', (event) => {
            const target = event.target;
            const alertItem = target.closest('.alert-item');
            if (!alertItem) return; 

            const alertId = alertItem.getAttribute('data-alert-id');

            if (target.classList.contains('delete-button')) {
                if (confirm(`¿Seguro que quieres eliminar la alerta ${alertId}?`)) {
                    console.log(`Eliminar alerta ID: ${alertId}`);
                    alertItem.remove();
                }
            }

            else if (target.classList.contains('edit-button')) {
                console.log(`Editar alerta ID: ${alertId}`);
                toggleEditState(alertItem, true);
            }

            else if (target.classList.contains('save-button')) {
                console.log(`Guardar cambios alerta ID: ${alertId}`);
                saveEdit(alertItem);
                toggleEditState(alertItem, false); 
            }

            else if (target.classList.contains('cancel-button')) {
                console.log(`Cancelar edición alerta ID: ${alertId}`);
                toggleEditState(alertItem, false);
            }

            else if (target.classList.contains('visibility-checkbox')) {
                const isVisible = target.checked;
                console.log(`Cambiar visibilidad alerta ID: ${alertId} a ${isVisible}`);
            }
        });
    }

    function toggleEditState(alertItem, isEditing) {
        const textDisplay = alertItem.querySelector('.alert-text');
        const messageInput = alertItem.querySelector('.alert-edit-message');
        const prioritySelect = alertItem.querySelector('.alert-edit-priority');
        const editButton = alertItem.querySelector('.edit-button');
        const deleteButton = alertItem.querySelector('.delete-button');
        const saveButton = alertItem.querySelector('.save-button');
        const cancelButton = alertItem.querySelector('.cancel-button');
        const visibilityToggle = alertItem.querySelector('.visibility-toggle'); 

        if (isEditing) {
            alertItem.classList.add('editing');
            messageInput.value = textDisplay.textContent.trim();
            const currentPriorityClass = alertItem.querySelector('.alert-priority').classList.item(1); 
            const currentPriorityValue = currentPriorityClass.split('-')[1]; 
            prioritySelect.value = currentPriorityValue;

            textDisplay.style.display = 'none';
            messageInput.style.display = 'block';
            prioritySelect.style.display = 'block';
            editButton.style.display = 'none';
            deleteButton.style.display = 'none';
            visibilityToggle.style.display = 'none';
            saveButton.style.display = 'inline-block';
            cancelButton.style.display = 'inline-block';
        } else {
            alertItem.classList.remove('editing');
            textDisplay.style.display = 'block';
            messageInput.style.display = 'none';
            prioritySelect.style.display = 'none';
            editButton.style.display = 'inline-block';
            deleteButton.style.display = 'inline-block';
            visibilityToggle.style.display = 'block';
            saveButton.style.display = 'none';
            cancelButton.style.display = 'none';
        }
    }

     function saveEdit(alertItem) {
         const messageInput = alertItem.querySelector('.alert-edit-message');
         const prioritySelect = alertItem.querySelector('.alert-edit-priority');
         const textDisplay = alertItem.querySelector('.alert-text');
         const priorityIndicator = alertItem.querySelector('.alert-priority');

         const newMessage = messageInput.value.trim();
         const newPriority = prioritySelect.value; 


         textDisplay.textContent = newMessage;
         priorityIndicator.className = `alert-priority priority-${newPriority}`; 

         console.log(`Nuevos valores: Mensaje="${newMessage}", Prioridad="${newPriority}"`);
     }

});