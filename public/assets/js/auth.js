document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgot-password-form');
    
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('email-forgot');
            const feedback = document.getElementById('forgot-feedback');
            const btn = forgotForm.querySelector('button');
            const originalText = btn.textContent;

            btn.disabled = true;
            btn.textContent = 'Enviando...';
            feedback.style.display = 'none';

            try {
                const res = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo: emailInput.value })
                });

                const data = await res.json();

                if (data.success) {
                    feedback.textContent = 'Si el correo existe, se han enviado las instrucciones.';
                    feedback.className = 'feedback-message success';
                    feedback.style.display = 'block';
                    forgotForm.reset();
                } else {
                    feedback.textContent = data.message || 'Error al procesar solicitud.';
                    feedback.className = 'feedback-message error';
                    feedback.style.display = 'block';
                }

            } catch (error) {
                feedback.textContent = 'Error de conexión.';
                feedback.className = 'feedback-message error';
                feedback.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }
});