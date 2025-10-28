document.addEventListener('DOMContentLoaded', () => {
    const searchByNameBtn = document.getElementById('search-by-name-btn');
    const searchByIdBtn = document.getElementById('search-by-id-btn');
    const searchHistoryNameInput = document.getElementById('search-history-name');
    const searchHistoryIdInput = document.getElementById('search-history-id');
    const recentHistorySection = document.getElementById('recent-history-section');
    const searchResultsSection = document.getElementById('search-results-section');
    const searchResultsTableBody = document.querySelector('#search-results-table tbody');
    const backToRecentBtn = document.getElementById('back-to-recent-btn');

    const performSearch = (searchTerm, searchType) => {
        console.log(`Buscando ${searchType}: "${searchTerm}"`);

        // --- Simulación de Resultados ---
        // Limpia resultados anteriores
        searchResultsTableBody.innerHTML = '';

        // Aquí harías la llamada real al backend
        // Por ahora, simulamos algunos resultados si el término no está vacío
        if (searchTerm.trim() !== '') {
             // Añadir fila de ejemplo 1
            const row1 = searchResultsTableBody.insertRow();
            row1.innerHTML = `
                <td>${searchTerm} (Resultado 1)</td>
                <td>Grupo Buscado</td>
                <td>28/10/2025 09:30 AM</td>
                <td>Entrada</td>
                <td><span class="status-badge status-normal">Normal</span></td>
                <td><a href="#" class="action-button small-button">Contactar</a></td>
            `;
             // Añadir fila de ejemplo 2
             const row2 = searchResultsTableBody.insertRow();
             row2.innerHTML = `
                <td>${searchTerm} (Resultado 2)</td>
                <td>Grupo Buscado</td>
                <td>28/10/2025 10:15 AM</td>
                <td>Salida</td>
                <td><span class="status-badge status-normal">Normal</span></td>
                <td><a href="#" class="action-button small-button">Contactar</a></td>
            `;
        } else {
            // Muestra mensaje si no hay resultados (o término vacío)
             const row = searchResultsTableBody.insertRow();
             const cell = row.insertCell();
             cell.colSpan = 6; // Ocupa todas las columnas
             cell.textContent = 'No se encontraron resultados o término de búsqueda vacío.';
             cell.style.textAlign = 'center';
             cell.style.padding = '20px';
        }
        // --- Fin Simulación ---


        // Oculta recientes y muestra resultados
        if (recentHistorySection) recentHistorySection.style.display = 'none';
        if (searchResultsSection) searchResultsSection.style.display = 'block';
    };

    // Event listeners para botones de búsqueda
    if (searchByNameBtn && searchHistoryNameInput) {
        searchByNameBtn.addEventListener('click', () => {
             // Re-valida antes de buscar (input-validator ya lo hizo, pero por si acaso)
             if (validateInput(searchHistoryNameInput, nameRegex, 'Solo se permiten letras y espacios.')) {
                 performSearch(searchHistoryNameInput.value, 'nombre');
             }
        });
         // Opcional: buscar al presionar Enter en el input
         searchHistoryNameInput.addEventListener('keypress', (event) => {
             if (event.key === 'Enter') {
                 searchByNameBtn.click(); // Simula clic en el botón
             }
         });
    }

    if (searchByIdBtn && searchHistoryIdInput) {
        searchByIdBtn.addEventListener('click', () => {
             if (validateInput(searchHistoryIdInput, studentIdRegex, 'Boleta inválida.')) {
                 performSearch(searchHistoryIdInput.value, 'boleta');
             }
        });
         searchHistoryIdInput.addEventListener('keypress', (event) => {
             if (event.key === 'Enter') {
                 searchByIdBtn.click();
             }
         });
    }

    // Event listener para volver a recientes
    if (backToRecentBtn) {
        backToRecentBtn.addEventListener('click', () => {
            if (searchResultsSection) searchResultsSection.style.display = 'none';
            if (recentHistorySection) recentHistorySection.style.display = 'block';
            // Limpia campos de búsqueda opcionalmente
            if(searchHistoryNameInput) searchHistoryNameInput.value = '';
            if(searchHistoryIdInput) searchHistoryIdInput.value = '';
        });
    }

     // --- Lógica Paginación (Simulada) ---
     // Necesitarás lógica más compleja aquí interactuando con el backend
     const paginationButtons = document.querySelectorAll('.pagination-button');
     paginationButtons.forEach(button => {
         button.addEventListener('click', () => {
             if (!button.disabled) {
                 console.log(`Botón de paginación '${button.textContent.trim()}' clickeado.`);
                 // Aquí iría la lógica para cargar la siguiente/anterior página
             }
         });
     });


    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const studentIdRegex = /^[a-zA-Z0-9\-]+$/;
    // Si no está global, necesitas la definición de validateInput aquí

});