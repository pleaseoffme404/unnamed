document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const searchTutorNameInput = document.getElementById('search-tutor-name');
    const searchStudentNameInput = document.getElementById('search-student-name');
    const crudTutorForm = document.getElementById('crud-tutor-form');
    const registerStudentForm = document.getElementById('register-student-form'); 
    const addAlertForm = document.getElementById('add-alert-form');
    const studentIdRegex = /^[a-zA-Z0-9\-]+$/; 
    const groupRegex = /^[a-zA-Z0-9]+$/; 
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/; 
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^[0-9]{10}$/;
    const potentiallyHarmfulCharsRegex = /[<>"'`{};()/\\]|--|\/\*|\*\/|drop |delete |insert |update |script/i;
    const searchHistoryNameInput = document.getElementById('search-history-name');
    const searchHistoryIdInput = document.getElementById('search-history-id');

    const validateInput = (inputElement, regex, errorMessage, allowEmpty = false) => {
        if (!inputElement) return true;

        const value = inputElement.value.trim();
        let errorElement = inputElement.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('error-message')) {
            const parent = inputElement.closest('.search-bar-container, .form-group');
            if (parent) {
                errorElement = parent.querySelector('.error-message');
            }
        }
        if (!errorElement) return true;

        let isValid = true;
        let msg = '';

        if (!allowEmpty && value === '') {
            msg = 'Este campo es obligatorio.';
            isValid = false;
        } else if (value !== '' && potentiallyHarmfulCharsRegex.test(value)) {
             msg = 'Caracteres no permitidos detectados.';
             isValid = false;
        } else if (value !== '' && regex && !regex.test(value)) {
            msg = errorMessage;
            isValid = false;
        }

        if (!isValid) {
            inputElement.classList.add('is-invalid');
            errorElement.textContent = msg;
        } else {
            inputElement.classList.remove('is-invalid');
            errorElement.textContent = '';
        }
        return isValid;
    };

    const addValidationListeners = (inputElement, regex, message) => {
        if (inputElement) {
             inputElement.addEventListener('input', () => {
                 validateInput(inputElement, null, 'Caracteres no permitidos detectados.', !inputElement.hasAttribute('required'));
             });
              inputElement.addEventListener('blur', () => {
                 validateInput(inputElement, regex, message, !inputElement.hasAttribute('required'));
             });
        }
    };

    if (loginForm) {
        const userInput = document.getElementById('user');
        const passwordInput = document.getElementById('password');

        loginForm.addEventListener('submit', (event) => {
            const isUserValid = validateInput(userInput, alphanumericRegex, 'Solo se permiten letras y números.');
            const isPasswordValid = validateInput(passwordInput, null, 'Caracteres no permitidos detectados.');

            if (!isUserValid || !isPasswordValid) {
                event.preventDefault();
            }
        });

        addValidationListeners(userInput, alphanumericRegex, 'Solo se permiten letras y números.');
        addValidationListeners(passwordInput, null, '');
    }

    if (forgotPasswordForm) {
        const emailInput = document.getElementById('email');
        forgotPasswordForm.addEventListener('submit', (event) => {
            if (!validateInput(emailInput, emailRegex, 'Formato de correo electrónico inválido.')) {
                event.preventDefault();
            }
        });
        addValidationListeners(emailInput, emailRegex, 'Formato de correo electrónico inválido.');
    }

    addValidationListeners(searchTutorNameInput, nameRegex, 'Solo se permiten letras y espacios.');
    addValidationListeners(searchStudentNameInput, nameRegex, 'Solo se permiten letras y espacios.');
    addValidationListeners(searchHistoryNameInput, nameRegex, 'Solo se permiten letras y espacios.');
    addValidationListeners(searchHistoryIdInput, studentIdRegex, 'Boleta inválida.');

    if (crudTutorForm) {
        const tutorNameInput = document.getElementById('tutor-name');
        const tutorPhoneInput = document.getElementById('tutor-phone');
        const tutorEmailInput = document.getElementById('tutor-email');

        crudTutorForm.addEventListener('submit', (event) => {
            const isNameValid = validateInput(tutorNameInput, nameRegex, 'Nombre inválido.');
            const isPhoneValid = validateInput(tutorPhoneInput, phoneRegex, 'Teléfono inválido (10 dígitos).');
            const isEmailValid = validateInput(tutorEmailInput, emailRegex, 'Correo inválido.');

            if (!isNameValid || !isPhoneValid || !isEmailValid) {
                event.preventDefault();
            }
        });

        addValidationListeners(tutorNameInput, nameRegex, 'Nombre inválido.');
        addValidationListeners(tutorPhoneInput, phoneRegex, 'Teléfono inválido (10 dígitos).');
        addValidationListeners(tutorEmailInput, emailRegex, 'Correo inválido.');
    }
    if (registerStudentForm) {
        const studentNameInput = document.getElementById('student-name');
        const studentIdInput = document.getElementById('student-id');
        const studentGroupInput = document.getElementById('student-group');
        const studentDobInput = document.getElementById('student-dob');
        const studentGenderSelect = document.getElementById('student-gender');
        const studentPhotoUrlInput = document.getElementById('student-photo-url');

        registerStudentForm.addEventListener('submit', (event) => {
            const isNameValid = validateInput(studentNameInput, nameRegex, 'Nombre inválido.');
            const isIdValid = validateInput(studentIdInput, studentIdRegex, 'Boleta/Matrícula inválida.');
            const isGroupValid = validateInput(studentGroupInput, groupRegex, 'Grupo inválido.');
            const isDobValid = validateInput(studentDobInput, null, 'Fecha inválida.');
            const isGenderValid = validateInput(studentGenderSelect, null, 'Debes seleccionar un género.');
            const isPhotoUrlValid = validateInput(studentPhotoUrlInput, urlRegex, 'URL inválida.', true); // true = permite vacío

            if (!isNameValid || !isIdValid || !isGroupValid || !isDobValid || !isGenderValid || !isPhotoUrlValid) {
                event.preventDefault();
                console.log('Registro de alumno bloqueado por validación.');
            } else {
                 console.log('Validación de registro de alumno OK (simulado). Enviando...');
                 event.preventDefault(); 
            }
        });
        addValidationListeners(studentNameInput, nameRegex, 'Nombre inválido.');
        addValidationListeners(studentIdInput, studentIdRegex, 'Boleta/Matrícula inválida.');
        addValidationListeners(studentGroupInput, groupRegex, 'Grupo inválido.');
        addValidationListeners(studentDobInput, null, 'Fecha inválida.');
        addValidationListeners(studentGenderSelect, null, 'Debes seleccionar un género.');
        addValidationListeners(studentPhotoUrlInput, urlRegex, 'URL inválida.');
    }
    const registerTutorForm = document.getElementById('register-tutor-form');

    if (registerTutorForm) {
        const tutorNameInput = document.getElementById('tutor-name');
        const tutorGenderSelect = document.getElementById('tutor-gender');
        const tutorMobileInput = document.getElementById('tutor-mobile');
        const tutorEmailInput = document.getElementById('tutor-email');
        const tutorNotificationSelect = document.getElementById('tutor-notification');
        const tutorStudentInput = document.getElementById('tutor-student'); 
        const tutorPhotoUrlInput = document.getElementById('tutor-photo-url');

        registerTutorForm.addEventListener('submit', (event) => {
            const isNameValid = validateInput(tutorNameInput, nameRegex, 'Nombre inválido.');
            const isGenderValid = validateInput(tutorGenderSelect, null, 'Debes seleccionar un género.');
            const isMobileValid = validateInput(tutorMobileInput, phoneRegex, 'Móvil inválido (10 dígitos).');
            const isEmailValid = validateInput(tutorEmailInput, emailRegex, 'Correo inválido.');
            const isNotificationValid = validateInput(tutorNotificationSelect, null, 'Debes seleccionar un método.');
            const isStudentValid = validateInput(tutorStudentInput, null, 'Debes indicar el alumno.'); 
            const isPhotoUrlValid = validateInput(tutorPhotoUrlInput, urlRegex, 'URL inválida.', true);

            if (!isNameValid || !isGenderValid || !isMobileValid || !isEmailValid || !isNotificationValid || !isStudentValid || !isPhotoUrlValid) {
                event.preventDefault();
                console.log('Registro de tutor bloqueado por validación.');
            } else {
                 console.log('Validación de registro de tutor OK (simulado). Enviando...');
                 event.preventDefault(); 
            }
        });

        addValidationListeners(tutorNameInput, nameRegex, 'Nombre inválido.');
        addValidationListeners(tutorGenderSelect, null, 'Debes seleccionar un género.');
        addValidationListeners(tutorMobileInput, phoneRegex, 'Móvil inválido (10 dígitos).');
        addValidationListeners(tutorEmailInput, emailRegex, 'Correo inválido.');
        addValidationListeners(tutorNotificationSelect, null, 'Debes seleccionar un método.');
        addValidationListeners(tutorStudentInput, null, 'Debes indicar el alumno.'); 
        addValidationListeners(tutorPhotoUrlInput, urlRegex, 'URL inválida.');
    }
    if (addAlertForm) {
        const alertMessageInput = document.getElementById('alert-message');
        const alertPrioritySelect = document.getElementById('alert-priority');

        const messageRegex = /.+/; 

        addAlertForm.addEventListener('submit', (event) => {
            const isMessageValid = validateInput(alertMessageInput, messageRegex, 'El mensaje no puede estar vacío.');
            const isPriorityValid = validateInput(alertPrioritySelect, null, 'Debes seleccionar una prioridad.');

            if (!isMessageValid || !isPriorityValid) {
                event.preventDefault();
                console.log('Envío de nueva alerta bloqueado por validación.');
            } else {
                 console.log('Validación de nueva alerta OK (simulado). Enviando...');
                 event.preventDefault(); 
                 addAlertForm.reset();
            }
        });

        addValidationListeners(alertMessageInput, messageRegex, 'El mensaje no puede estar vacío.');
        addValidationListeners(alertPrioritySelect, null, 'Debes seleccionar una prioridad.');
    }
    const searchByNameBtn = document.getElementById('search-by-name-btn');
    const searchByIdBtn = document.getElementById('search-by-id-btn');

    if (searchByNameBtn && searchHistoryNameInput) {
        searchByNameBtn.addEventListener('click', (event) => {
             if (!validateInput(searchHistoryNameInput, nameRegex, 'Solo se permiten letras y espacios.')) {
                 console.log("Búsqueda por nombre bloqueada por validación.");
             } else {
                 console.log("Validación de búsqueda por nombre OK.");
             }
        });
    }
     if (searchByIdBtn && searchHistoryIdInput) {
        searchByIdBtn.addEventListener('click', (event) => {
             if (!validateInput(searchHistoryIdInput, studentIdRegex, 'Boleta inválida.')) {
                  console.log("Búsqueda por boleta bloqueada por validación.");
             } else {
                  console.log("Validación de búsqueda por boleta OK.");
             }
        });
    }
});