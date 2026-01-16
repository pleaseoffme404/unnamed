document.addEventListener('DOMContentLoaded', async () => {
    
    const loginForm = document.getElementById('portalLoginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const path = window.location.pathname;

    if (loginForm) {
        
        fetch('/api/tutores/app/me')
            .then(res => res.json())
            .then(data => {
                if (data.success) window.location.href = '/portal/dashboard/';
            })
            .catch(() => {});

        const passInput = document.getElementById('password');
        const toggleBtn = document.getElementById('togglePass');
        const btnSubmit = document.getElementById('btnSubmit');

        if (toggleBtn && passInput) {
            toggleBtn.addEventListener('click', () => {
                const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passInput.setAttribute('type', type);
                toggleBtn.innerHTML = type === 'password' ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
            });
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const correo = document.getElementById('correo').value.trim();
            const password = document.getElementById('password').value.trim();
            const originalText = btnSubmit.innerHTML;

            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Validando...';
            btnSubmit.disabled = true;

            try {
                const response = await fetch('/api/tutores/app/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo, password })
                });

                const result = await response.json();

                if (result.success) {
                    window.location.href = '/portal/dashboard/';
                } else {
                    throw new Error(result.message || 'Credenciales inválidas');
                }

            } catch (error) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de acceso',
                        text: error.message,
                        confirmButtonColor: '#ff8c69',
                        heightAuto: false
                    });
                } else {
                    alert(error.message);
                }
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
            }
        });

    } else {
        
        if (path !== '/portal/' && path !== '/portal/index.html') {
            try {
                const res = await fetch('/api/tutores/app/me');
                if (res.status === 401 || res.status === 403) {
                    window.location.href = '/portal/';
                    return;
                }
                const data = await res.json();
                if (!data.success) {
                    window.location.href = '/portal/';
                }
            } catch (error) {
                window.location.href = '/portal/';
            }
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/tutores/app/logout', { method: 'POST' });
                window.location.href = '/portal/';
            } catch (error) {
                window.location.href = '/portal/';
            }
        });
    }
});