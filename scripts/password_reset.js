/**
 * password_reset.js - Password Reset Flow
 */

const UI = {
    form: document.querySelector('#reset-form'),
    newPassInput: document.getElementById('new-password'),
    confirmPassInput: document.getElementById('confirm-password'),
    passwordHint: document.getElementById('password-hint'),
    alertModal: document.getElementById('alert-modal'),
    alertMsg: document.getElementById('alert-message'),
    alertOk: document.getElementById('alert-ok'),
    submitBtn: null
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

function validatePasswords() {
    const newPass = UI.newPassInput.value;
    const confirmPass = UI.confirmPassInput.value;
    
    if (!newPass) {
        UI.passwordHint.textContent = '';
        return false;
    }
    
    if (newPass.length < 8) {
        UI.passwordHint.textContent = '❌ Password must be at least 8 characters';
        UI.passwordHint.style.color = '#ef4444';
        return false;
    }
    
    if (newPass !== confirmPass) {
        UI.passwordHint.textContent = '❌ Passwords do not match';
        UI.passwordHint.style.color = '#ef4444';
        return false;
    }
    
    UI.passwordHint.textContent = '✓ Passwords match';
    UI.passwordHint.style.color = '#22c55e';
    return true;
}

function getCodeFromURL() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    return code;
}

document.addEventListener('DOMContentLoaded', () => {
    UI.submitBtn = UI.form.querySelector('button[type="submit"]');
    
    // Extract code from URL
    const code = getCodeFromURL();
    if (!code) {
        showAlert('Invalid or missing reset code. Please request a password reset again.', 'Error').then(() => {
            window.location.href = 'login';
        });
        return;
    }
    
    // Real-time password validation
    UI.newPassInput.addEventListener('input', validatePasswords);
    UI.confirmPassInput.addEventListener('input', validatePasswords);
    
    // Form submission
    UI.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validatePasswords()) {
            await showAlert('Please ensure both passwords match and are at least 8 characters long.', 'Validation Error');
            return;
        }
        
        const newPassword = UI.newPassInput.value;
        
        setButtonLoading(UI.submitBtn, 'Resetting...');
        
        try {
            const data = await authFetch('/auth/account/confirm-reset', 'POST', {
                code: code,
                new_password: newPassword
            });
            
            if (data && data.access_token) {
                sessionStorage.setItem('access_token', data.access_token);
                await showAlert('Password reset successfully! Redirecting...', 'Success');
                window.location.href = 'view-user';
            } else {
                throw new Error('No access token received from server.');
            }
        } catch (err) {
            console.error('Password reset error:', err);
            const errorMsg = err.message || 'Failed to reset password. The reset code may have expired.';
            await showAlert(errorMsg, 'Reset Failed');
        } finally {
            restoreButton(UI.submitBtn);
        }
    });
});
