// auth_api.js
const API_BASE_URL = 'https://auth.onlapus.pp.ua';

async function authFetch(endpoint, method = 'POST', payload = null) {
    const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    };

    // Отримуємо токен з пам'яті
    const token = sessionStorage.getItem('access_token');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (payload) {
        options.body = JSON.stringify(payload);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    // Якщо 401 - пробуємо рефреш
    if (response.status === 401 && !endpoint.includes('/refresh')) {
        // ЯКЩО ми НЕ на шляху логіна, пробуємо рефреш
        if (!endpoint.includes('/session/login')) {
            const refreshed = await tryRefresh();
            if (refreshed) return authFetch(endpoint, method, payload);

            // Якщо рефреш не вдався, а ми не на логіні - тільки тоді редирект
            if (!window.location.pathname.endsWith('login')) {
                window.location.href = 'login';
            }
            return null;
        }

    }

    const data = await response.json();
    if (!response.ok) {
        const errorMsg = Array.isArray(data.detail) 
            ? data.detail.map(err => err.msg).join(', ') 
            : (data.detail || 'Something went wrong');
        throw new Error(errorMsg);
    }
    return data;
}

async function tryRefresh() {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/session/refresh`, {
            method: 'POST',
            credentials: 'include'
        });
        if (!res.ok) return false;
        const data = await res.json();
        sessionStorage.setItem('access_token', data.access_token);
        return true;
    } catch { return false; }
}
