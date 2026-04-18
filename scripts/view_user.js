/**
 * view_user.js - Refactored with improved modularity 🚀
 */

// --- UI SELECTORS ---
const UI = {
    // Main buttons
    sessionBtn: document.querySelector('.session-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    settingsBtn: document.getElementById('settings-btn'),

    // Modals
    sessionModal: document.getElementById('session-modal'),
    alertModal: document.getElementById('alert-modal'),
    passwordModal: document.getElementById('password-modal'),
    settingsModal: document.getElementById('settings-modal'),

    // Settings modal actions
    updateEmailBtn: document.getElementById('update-email-btn'),
    updatePasswordBtn: document.getElementById('update-password-btn'),
    deleteAccountBtn: document.getElementById('delete-account-btn'),

    // Session elements
    sessionsList: document.getElementById('sessions-list'),

    // Universal modal elements
    modalTitle: document.getElementById('modal-title-dynamic'),
    modalDesc: document.getElementById('modal-desc-dynamic'),
    passInput: document.getElementById('modal-password-input'),
    confirmInput: document.getElementById('modal-password-confirm-input'),
    hintText: document.getElementById('modal-hint'),
    passConfirmBtn: document.getElementById('password-confirm'),
    passCancelBtn: document.getElementById('password-cancel'),

    // Alert elements
    alertMsg: document.getElementById('alert-message'),
    alertOk: document.getElementById('alert-ok'),

    // Profile elements
    usernameTitle: document.getElementById('user-username-title'),
    avatar: document.querySelector('.fake-pfp'),
    emailValue: document.getElementById('user-email-value'),
    createdAt: document.getElementById('user-created-value'),
    statusBadge: document.getElementById('user-status-badge'),
    verifiedBadge: document.getElementById('user-verified-badge')
};

// --- BUTTON LOADING HELPERS ---
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

// --- MODAL MANAGEMENT ---
const ModalManager = {
    showAlert: async function(message, title = "Notification") {
        document.getElementById('alert-title').textContent = title;
        UI.alertMsg.textContent = message;
        UI.alertModal.classList.add('active');
        return new Promise(resolve => {
            UI.alertOk.onclick = () => {
                UI.alertModal.classList.remove('active');
                resolve();
            };
        });
    },

    resetModalFields: function() {
        UI.passInput.value = '';
        UI.confirmInput.value = '';
        UI.confirmInput.style.display = 'none';
        UI.hintText.style.display = 'none';
        UI.hintText.textContent = '';
        UI.passConfirmBtn.disabled = false;
        UI.passInput.oninput = null;
        UI.confirmInput.oninput = null;
    },

    askPassword: function() {
        this.resetModalFields();
        UI.confirmInput.style.display = 'none';
        UI.hintText.style.display = 'none';

        UI.passInput.type = "password";
        UI.passInput.value = '';
        UI.passInput.placeholder = "Confirm with password";
        UI.modalTitle.textContent = "Confirm Action";
        UI.modalDesc.textContent = "Please enter your password to proceed.";

        UI.passwordModal.classList.add('active');
        return new Promise((resolve) => {
            UI.passConfirmBtn.onclick = () => {
                const val = UI.passInput.value;
                if (val) {
                    UI.passwordModal.classList.remove('active');
                    resolve(val);
                }
            };
            UI.passCancelBtn.onclick = () => {
                UI.passwordModal.classList.remove('active');
                resolve(null);
            };
        });
    },

    askPasswordWithProcessing: function(onPasswordEntered) {
        this.resetModalFields();
        UI.confirmInput.style.display = 'none';
        UI.hintText.style.display = 'none';

        UI.passInput.type = "password";
        UI.passInput.value = '';
        UI.passInput.placeholder = "Confirm with password";
        UI.modalTitle.textContent = "Confirm Account Deletion";
        UI.modalDesc.textContent = "This action cannot be undone. Enter your password to proceed.";

        UI.passwordModal.classList.add('active');
        
        UI.passConfirmBtn.onclick = () => {
            const val = UI.passInput.value;
            if (val) {
                setButtonLoading(UI.passConfirmBtn, 'Processing...');
                onPasswordEntered(val);
            }
        };
        
        UI.passCancelBtn.onclick = () => {
            UI.passwordModal.classList.remove('active');
        };
    },

    askEmail: async function() {
        this.resetModalFields();
        UI.confirmInput.style.display = 'none';
        UI.hintText.style.display = 'none';

        UI.passInput.type = "email";
        UI.passInput.value = '';
        UI.passInput.placeholder = "Enter your email";
        UI.modalTitle.textContent = "Activate Account";
        UI.modalDesc.textContent = "Enter your email to receive a confirmation link.";

        UI.passwordModal.classList.add('active');

        return new Promise((resolve) => {
            UI.passConfirmBtn.onclick = () => {
                const val = UI.passInput.value;
                if (val && val.includes('@')) {
                    UI.passwordModal.classList.remove('active');
                    UI.passInput.type = "password";
                    resolve(val);
                } else {
                    alert("Please enter a valid email address.");
                }
            };
            UI.passCancelBtn.onclick = () => {
                UI.passwordModal.classList.remove('active');
                UI.passInput.type = "password";
                resolve(null);
            };
        });
    },

    askNewPassword: async function() {
        this.resetModalFields();
        UI.confirmInput.style.display = 'block';
        UI.hintText.style.display = 'block';
        UI.hintText.textContent = 'Enter matching passwords.';
        UI.hintText.className = 'modal-hint';
        UI.passConfirmBtn.disabled = true;

        UI.passInput.type = "password";
        UI.passInput.value = '';
        UI.passInput.placeholder = "New password";
        UI.confirmInput.type = "password";
        UI.confirmInput.value = '';
        UI.confirmInput.placeholder = "Confirm new password";
        UI.modalTitle.textContent = "Update Password";
        UI.modalDesc.textContent = "Enter a new password and confirm it.";

        const validate = () => {
            const newPassword = UI.passInput.value.trim();
            const confirmPassword = UI.confirmInput.value.trim();
            if (newPassword.length < 8) {
                UI.hintText.textContent = 'Password must be at least 8 characters.';
                UI.hintText.className = 'modal-hint error';
                UI.passConfirmBtn.disabled = true;
                return;
            }
            if (confirmPassword.length === 0) {
                UI.hintText.textContent = 'Confirm your new password.';
                UI.hintText.className = 'modal-hint';
                UI.passConfirmBtn.disabled = true;
                return;
            }
            if (newPassword !== confirmPassword) {
                UI.hintText.textContent = 'Passwords do not match.';
                UI.hintText.className = 'modal-hint error';
                UI.passConfirmBtn.disabled = true;
                return;
            }
            UI.hintText.textContent = 'Passwords match.';
            UI.hintText.className = 'modal-hint success';
            UI.passConfirmBtn.disabled = false;
        };

        UI.passInput.oninput = validate;
        UI.confirmInput.oninput = validate;

        UI.passwordModal.classList.add('active');

        return new Promise((resolve) => {
            UI.passConfirmBtn.onclick = () => {
                if (!UI.passConfirmBtn.disabled) {
                    UI.passwordModal.classList.remove('active');
                    resolve(UI.passInput.value.trim());
                }
            };
            UI.passCancelBtn.onclick = () => {
                UI.passwordModal.classList.remove('active');
                resolve(null);
            };
        });
    },



    closeAll: function() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    }
};

// --- PROFILE MANAGEMENT ---
const ProfileManager = {
    async loadProfile() {
        try {
            const user = await authFetch('/auth/account/get', 'GET');
            this.renderProfile(user);
        } catch (e) {
            console.error("Profile load failed:", e);
            await ModalManager.showAlert("Failed to load profile data.");
        }
    },

    renderProfile(user) {
        UI.usernameTitle.textContent = user.username;
        UI.avatar.textContent = user.username[0].toUpperCase();

        // Email activation logic
        if (!user.email || user.email === "N/A" || user.email === "null") {
            UI.emailValue.innerHTML = '';
            const btn = document.createElement('button');
            btn.className = "term-btn";
            btn.style = "background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; color: #3b82f6; width: 100%; padding: 6px; cursor: pointer; font-weight: 600;";
            btn.textContent = "Activate Account";

            btn.onclick = (e) => {
                e.preventDefault();
                AccountActions.handleActivateAccount(btn);
            };
            UI.emailValue.appendChild(btn);
        } else {
            UI.emailValue.textContent = user.email;
        }

        UI.createdAt.textContent = new Date(user.created_at).toLocaleDateString();

        // Status badges
        UI.statusBadge.textContent = user.is_active ? 'Active' : 'Inactive';
        UI.statusBadge.className = `badge ${user.is_active ? 'badge-active' : 'badge-inactive'}`;

        UI.verifiedBadge.textContent = user.is_verified ? 'Verified' : 'Not Verified';
        UI.verifiedBadge.className = `badge ${user.is_verified ? 'badge-verified' : ''}`;

        // Password action button
        this.updatePasswordButton();
    },

    updatePasswordButton() {
        const button = UI.updatePasswordBtn;
        const actionContent = button.querySelector('.action-content');
        const actionTitle = actionContent.querySelector('.action-title');
        const actionDesc = actionContent.querySelector('.action-desc');

        actionTitle.textContent = 'Update Password';
        actionDesc.textContent = 'Change your account password';
        button.className = 'settings-action-btn';
        button.onclick = () => AccountActions.handleUpdatePassword(button);
    }
};

// --- SESSION MANAGEMENT ---
const SessionManager = {
    async loadSessions() {
        UI.sessionsList.innerHTML = '<p class="loading-text">Synchronizing sessions...</p>';
        try {
            const [{ session_id: currentId }, sessions] = await Promise.all([
                authFetch('/auth/session/get_current', 'GET'),
                authFetch('/auth/session/list', 'POST')
            ]);
            this.renderSessions(sessions, currentId);
        } catch (err) {
            UI.sessionsList.innerHTML = `<p class="loading-text" style="color: #ef4444;">${err.message}</p>`;
        }
    },

    renderSessions(sessions, currentId) {
        UI.sessionsList.innerHTML = '';
        sessions.forEach(s => {
            const isCurrent = s.session_id === currentId;
            const item = document.createElement('div');
            item.className = 'session-item';
            item.style = 'display: flex; justify-content: space-between; align-items: center; background: var(--bg-tertiary); padding: 1rem; border-radius: 12px; margin-bottom: 0.8rem; border: 1px solid rgba(255,255,255,0.05);';

            item.innerHTML = `
                <div style="flex: 1; min-width: 0; margin-right: 15px;">
                    <div class="info-label">ID</div>
                    <div style="font-family: monospace; font-size: 0.75rem; color: var(--text-secondary); word-break: break-all;">${s.session_id}</div>
                </div>
                <div class="action-zone"></div>
            `;

            const actionZone = item.querySelector('.action-zone');
            if (isCurrent) {
                actionZone.innerHTML = `<span style="color: var(--accent-primary); font-weight: bold; border: 1px solid var(--accent-primary); padding: 4px 12px; border-radius: 6px;">Current</span>`;
            } else {
                const btn = document.createElement('button');
                btn.className = 'term-btn';
                btn.textContent = 'Terminate';
                btn.onclick = () => SessionActions.terminateOne(s.session_id, btn);
                actionZone.appendChild(btn);
            }
            UI.sessionsList.appendChild(item);
        });

        const logoutAllBtn = document.createElement('button');
        logoutAllBtn.className = 'session-btn';
        logoutAllBtn.style = 'width: 100%; margin-top: 1rem; background: rgba(231, 76, 60, 0.1); color: #e74c3c; border: 1px solid #e74c3c;';
        logoutAllBtn.textContent = 'Logout from All Devices';
        logoutAllBtn.onclick = SessionActions.logoutAll;
        UI.sessionsList.appendChild(logoutAllBtn);
    }
};

// --- ACCOUNT ACTIONS ---
const AccountActions = {
    async handleActivateAccount(triggerButton = null) {
        if (triggerButton) setButtonLoading(triggerButton, 'Processing...');
        try {
            const newEmail = await ModalManager.askEmail();
            if (!newEmail) return;
            const response = await authFetch('/auth/account/update-email', 'POST', { new_email: newEmail });
            await ModalManager.showAlert(response.message || "Confirmation email sent!", "Success");
        } catch (err) {
            await ModalManager.showAlert(err.message, "Error");
        } finally {
            if (triggerButton) restoreButton(triggerButton);
        }
    },

    async handleUpdatePassword(triggerButton = null) {
        if (triggerButton) setButtonLoading(triggerButton, 'Processing...');
        try {
            const currentPassword = await ModalManager.askPassword();
            if (!currentPassword) return;

            const newPassword = await ModalManager.askNewPassword();
            if (!newPassword) return;

            const response = await authFetch('/auth/account/change-password', 'POST', {
                old_password: currentPassword,
                new_password: newPassword
            });

            if (response.password_changed) {
                await ModalManager.showAlert("Password updated successfully!", "Success");
                // Reload profile to update button state
                await ProfileManager.loadProfile();
            } else {
                await ModalManager.showAlert("Failed to update password. Please try again.", "Error");
            }
        } catch (err) {
            await ModalManager.showAlert(err.message || "Failed to update password", "Error");
        } finally {
            if (triggerButton) restoreButton(triggerButton);
        }
    },



    async handleDeleteAccount(triggerButton = null) {
        if (triggerButton) setButtonLoading(triggerButton, 'Processing...');
        
        ModalManager.askPasswordWithProcessing(async (password) => {
            try {
                const response = await authFetch('/auth/account/delete', 'DELETE', { password });

                if (response.deleted) {
                    // Update modal content to show success
                    UI.modalTitle.textContent = "Account Deleted";
                    UI.modalDesc.textContent = "Your account has been successfully deleted. You will be redirected.";
                    UI.passConfirmBtn.style.display = 'none';
                    UI.passCancelBtn.textContent = "OK";
                    UI.passCancelBtn.onclick = () => {
                        UI.passwordModal.classList.remove('active');
                        sessionStorage.clear();
                        window.location.href = './';
                    };
                } else if (response.is_email_sent) {
                    // Update modal content to show email sent
                    UI.modalTitle.textContent = "Confirmation Email Sent";
                    UI.modalDesc.textContent = "Please check your email and follow the link to complete the account deletion.";
                    UI.passConfirmBtn.style.display = 'none';
                    UI.passCancelBtn.textContent = "OK";
                    UI.passCancelBtn.onclick = () => {
                        UI.passwordModal.classList.remove('active');
                    };
                }
            } catch (err) {
                // Show error in the same modal
                UI.modalTitle.textContent = "Deletion Failed";
                UI.modalDesc.textContent = err.message || "Failed to delete account. Please try again.";
                UI.passConfirmBtn.textContent = "Try Again";
                restoreButton(UI.passConfirmBtn);
                UI.passConfirmBtn.onclick = () => {
                    // Reset for retry
                    ModalManager.askPasswordWithProcessing((newPassword) => {
                        AccountActions.handleDeleteAccount(triggerButton);
                    });
                };
            } finally {
                if (triggerButton) restoreButton(triggerButton);
            }
        });
    }
};

// --- SESSION ACTIONS ---
const SessionActions = {
    async terminateOne(id, button = null) {
        if (button) setButtonLoading(button, 'Terminating...');
        const password = await ModalManager.askPassword();
        if (!password) {
            if (button) restoreButton(button);
            return;
        }
        try {
            await authFetch('/auth/session/delete', 'DELETE', { session_id: id, password });
            await SessionManager.loadSessions();
        } catch (e) {
            await ModalManager.showAlert(e.message, "Error");
        } finally {
            if (button) restoreButton(button);
        }
    },

    async logoutAll() {
        const password = await ModalManager.askPassword();
        if (!password) return;
        try {
            await authFetch('/auth/session/logout-all', 'POST', { password });
            await ModalManager.showAlert("All sessions terminated. Redirecting...").then(() => {
                window.location.href = 'login';
            });
        } catch (e) {
            await ModalManager.showAlert(e.message, "Error");
        }
    }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    ProfileManager.loadProfile();

    // Main UI event listeners
    UI.sessionBtn.addEventListener('click', () => {
        UI.sessionModal.classList.add('active');
        SessionManager.loadSessions();
    });

    UI.settingsBtn.addEventListener('click', () => {
        UI.settingsModal.classList.add('active');
    });

    // Settings modal actions
    UI.updateEmailBtn.addEventListener('click', async () => {
        UI.settingsModal.classList.remove('active');
        await AccountActions.handleActivateAccount(UI.updateEmailBtn);
    });

    UI.updatePasswordBtn.addEventListener('click', async () => {
        UI.settingsModal.classList.remove('active');
        await AccountActions.handleUpdatePassword(UI.updatePasswordBtn);
    });

    UI.deleteAccountBtn.addEventListener('click', async () => {
        UI.settingsModal.classList.remove('active');
        await AccountActions.handleDeleteAccount(UI.deleteAccountBtn);
    });

    // Logout action
    UI.logoutBtn.addEventListener('click', async () => {
        setButtonLoading(UI.logoutBtn, 'Signing out...');
        try {
            await authFetch('/auth/session/logout', 'POST');
            sessionStorage.clear();
            window.location.href = 'login';
        } catch (e) {
            await ModalManager.showAlert(e.message);
        } finally {
            restoreButton(UI.logoutBtn);
        }
    });

    // Modal close handlers
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = () => ModalManager.closeAll();
    });

    // Click outside modal to close
    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) {
            ModalManager.closeAll();
        }
    };
});