/**
 * register.js - Modernized with Custom Modals
 */

const UI = {
    form: document.querySelector('form'),
    alertModal: document.getElementById('alert-modal'),
    alertMsg: document.getElementById('alert-message'),
    alertOk: document.getElementById('alert-ok'),
    googleBtn: document.getElementById('google-btn'),
    facebookBtn: document.getElementById('facebook-btn')
};

function showAlert(message, title = "Registration") {
    document.getElementById('alert-title').textContent = title;
    UI.alertMsg.textContent = message;
    UI.alertModal.classList.add('active');
    return new Promise(resolve => {
        UI.alertOk.onclick = () => {
            UI.alertModal.classList.remove('active');
            resolve();
        };
    });
}

function setButtonLoading(button, text = "Processing...") {
    if (!button) return;
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.classList.add('button-loading');
    button.textContent = text;
}

document.addEventListener('DOMContentLoaded', () => {
    UI.form.addEventListener('submit', async (e) => {  
        e.preventDefault();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value || null;
        const password = document.getElementById('password').value;
        const passwordRepeat = document.getElementById('password_repeat').value;

        if (password !== passwordRepeat) {
            await showAlert("Passwords do not match!", "Validation Error");
            return;
        }

        const payload = { username, email, password };

        try {
            const data = await authFetch('/auth/account/register', 'POST', payload);

            if (data.access_token) {
                sessionStorage.setItem('access_token', data.access_token);
            }

            if (data.confirmation_sent) {
                await showAlert('Registration successful! Please check your email to confirm your account.', 'Success');
                window.location.href = 'login'; 
            } else {
                window.location.href = 'view-user';
            }
        } catch (err) {
            console.error('Registration error:', err);
            await showAlert(err.message, "Error");
        }
    });

    // OAUTH BUTTONS
    if (UI.googleBtn) {
        UI.googleBtn.addEventListener('click', () => {
            setButtonLoading(UI.googleBtn, 'Redirecting...');
            window.location.href = `${API_BASE_URL}/auth/oauth/google`;
        });
    }

    if (UI.facebookBtn) {
        UI.facebookBtn.addEventListener('click', () => {
            setButtonLoading(UI.facebookBtn, 'Redirecting...');
            window.location.href = `${API_BASE_URL}/auth/oauth/facebook`;
        });
    }

    // CHECK FOR OAUTH ERRORS ON PAGE LOAD
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'oauth_failed') {
        showAlert('Social login failed. Please try again or use your email/password.', 'OAuth Error', true);
    }
});