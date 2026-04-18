/**
 * login.js - Modernized with Custom Modals & Password Reset
 */

const UI = {
    form: document.querySelector('form'),
    alertModal: document.getElementById('alert-modal'),
    alertMsg: document.getElementById('alert-message'),
    alertOk: document.getElementById('alert-ok'),
    resetEmailModal: document.getElementById('reset-email-modal'),
    resetEmailInput: document.getElementById('reset-email-input'),
    resetSendBtn: document.getElementById('reset-send'),
    resetCancelBtn: document.getElementById('reset-cancel'),
    forgotPasswordLink: document.getElementById('forgot-password-link'),
    googleBtn: document.getElementById('google-btn'),
    facebookBtn: document.getElementById('facebook-btn')
};

function showAlert(message, title = "Error", isError = true) {
    document.getElementById('alert-title').textContent = title;
    UI.alertMsg.textContent = message;
    UI.alertModal.classList.add('active');
    
    // Style the alert based on type
    const titleElement = document.getElementById('alert-title');
    const messageElement = document.getElementById('alert-message');
    
    if (isError) {
        titleElement.style.color = '#ef4444';
        messageElement.style.color = '#fca5a5';
        UI.alertModal.classList.add('error-state');
        UI.alertModal.classList.remove('success-state');
    } else {
        titleElement.style.color = '#22c55e';
        messageElement.style.color = '#86efac';
        UI.alertModal.classList.add('success-state');
        UI.alertModal.classList.remove('error-state');
    }
    
    return new Promise(resolve => {
        UI.alertOk.onclick = () => {
            UI.alertModal.classList.remove('active', 'error-state', 'success-state');
            titleElement.style.color = '';
            messageElement.style.color = '';
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

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function getErrorMessage(error) {
    // Network/Connection errors
    if (error instanceof TypeError) {
        return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    // Extract message from Error object
    let message = error.message || error;
    
    // Specific error messages based on content
    if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('unauthorized')) {
        return 'Invalid username/email or password. Please try again.';
    }
    
    if (message.toLowerCase().includes('not found')) {
        return 'Account not found. Please check your username or email.';
    }
    
    if (message.toLowerCase().includes('server') || message.toLowerCase().includes('500')) {
        return 'Server error. Please try again later.';
    }
    
    // Default error message
    return message || 'Authentication failed. Please try again.';
}

document.addEventListener('DOMContentLoaded', () => {
    // LOGIN FORM SUBMISSION
    UI.form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = UI.form.querySelector('button[type="submit"]');
        setButtonLoading(submitBtn, 'Signing in...');

        const identifier = document.getElementById('id').value.trim();
        const password = document.getElementById('password').value;

        // Basic validation
        if (!identifier || !password) {
            restoreButton(submitBtn);
            await showAlert('Please enter both username/email and password.', 'Missing Fields', true);
            return;
        }

        const payload = { 
            password: password,
            email: identifier.includes('@') ? identifier : null,
            username: !identifier.includes('@') ? identifier : null
        };

        try {
            const data = await authFetch('/auth/session/login', 'POST', payload);
            if (data && data.access_token) {
                sessionStorage.setItem('access_token', data.access_token);
                window.location.href = 'view-user';
            } else {
                throw new Error('No access token received. Please try again.');
            }
        } catch (err) {
            console.error('Login error:', err);
            const errorMsg = getErrorMessage(err);
            await showAlert(errorMsg, 'Login Failed', true);
        } finally {
            restoreButton(submitBtn);
        }
    });

    // FORGOT PASSWORD LINK
    UI.forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        UI.resetEmailInput.value = '';
        UI.resetEmailModal.classList.add('active');
    });

    // RESET EMAIL MODAL - CANCEL
    UI.resetCancelBtn.addEventListener('click', () => {
        UI.resetEmailModal.classList.remove('active');
        UI.resetEmailInput.value = '';
    });

    // RESET EMAIL MODAL - SEND
    UI.resetSendBtn.addEventListener('click', async () => {
        const email = UI.resetEmailInput.value.trim();
        
        if (!email) {
            await showAlert('Please enter your email address.', 'Email Required', true);
            return;
        }

        if (!validateEmail(email)) {
            await showAlert('Please enter a valid email address.', 'Invalid Email', true);
            return;
        }

        setButtonLoading(UI.resetSendBtn, 'Sending...');

        try {
            await authFetch('/auth/account/reset-password', 'POST', { email: email });
            
            // Always show positive feedback (security best practice)
            UI.resetEmailModal.classList.remove('active');
            UI.resetEmailInput.value = '';
            restoreButton(UI.resetSendBtn);
            
            await showAlert(
                'If an account exists with this email, a password reset link has been sent. Check your inbox and click the link to reset your password.',
                'Check Your Email',
                false
            );
        } catch (err) {
            console.error('Reset password error:', err);
            // Still show generic message for security
            UI.resetEmailModal.classList.remove('active');
            UI.resetEmailInput.value = '';
            restoreButton(UI.resetSendBtn);
            
            await showAlert(
                'If an account exists with this email, a password reset link has been sent. Check your inbox and click the link to reset your password.',
                'Check Your Email',
                false
            );
        }
    });

    // Allow Enter key to submit reset email
    UI.resetEmailInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            UI.resetSendBtn.click();
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