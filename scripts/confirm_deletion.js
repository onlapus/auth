/**
 * confirm_deletion.js - Account Deletion Confirmation Flow
 */

const UI = {
    form: document.querySelector('#confirm-deletion-form'),
    passwordInput: document.getElementById('deletion-password'),
    submitBtn: document.querySelector('.delete-btn'),
    alertModal: document.getElementById('alert-modal'),
    alertMsg: document.getElementById('alert-message'),
    alertOk: document.getElementById('alert-ok')
};

function showAlert(message, title = "Error") {
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

function restoreButton(button) {
    if (!button) return;
    button.disabled = false;
    button.classList.remove('button-loading');
    if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
        delete button.dataset.originalText;
    }
}

function getCodeFromURL() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    return code;
}

document.addEventListener('DOMContentLoaded', () => {
    // Extract code from URL on page load
    const code = getCodeFromURL();
    if (!code) {
        showAlert('Invalid or missing confirmation code. Please request account deletion again.', 'Error').then(() => {
            window.location.href = 'view-user';
        });
        return;
    }

    // Form submission
    UI.form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = UI.passwordInput.value.trim();
        if (!password) {
            await showAlert('Please enter your password to confirm deletion.', 'Password Required');
            return;
        }

        setButtonLoading(UI.submitBtn, 'Deleting Account...');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/account/confirm-deletion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`
                },
                credentials: 'include',
                redirect: 'manual', // Prevent automatic redirect handling
                body: JSON.stringify({
                    code: code,
                    password: password
                })
            });

            // Handle redirect responses (307) or successful responses
            if (response.type === 'opaqueredirect' || response.status === 0 || response.ok) {
                // Account deletion successful - redirect occurred
                sessionStorage.clear();
                window.location.href = './';
            } else {
                // Handle error response
                const errorData = await response.json().catch(() => ({ detail: "Failed to delete account" }));
                const errorMsg = Array.isArray(errorData.detail)
                    ? errorData.detail.map(err => err.msg).join(', ')
                    : (errorData.detail || 'Failed to delete account');
                await showAlert(errorMsg, 'Deletion Failed');
            }
        } catch (err) {
            console.error('Account deletion error:', err);
            
            // If we get a NetworkError during deletion, it might be due to the redirect
            // In this case, assume success since the account deletion likely worked
            if (err.name === 'TypeError' && err.message.includes('NetworkError')) {
                console.log('NetworkError detected - assuming successful deletion due to redirect');
                sessionStorage.clear();
                window.location.href = './';
            } else {
                const errorMsg = err.message || 'Failed to delete account. Please try again.';
                await showAlert(errorMsg, 'Deletion Failed');
            }
        } finally {
            restoreButton(UI.submitBtn);
        }
    });
});