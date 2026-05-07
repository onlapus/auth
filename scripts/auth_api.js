const API_BASE_URL = 'http://localhost:8000';

// 🔒 refresh mutex (CRITICAL FIX)
let refreshPromise = null;

async function authFetch(endpoint, method = 'POST', payload = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    };

    const token = sessionStorage.getItem('access_token');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (payload) {
        options.body = JSON.stringify(payload);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    // 🚨 handle 401 (but prevent refresh loops)
    if (
        response.status === 401 &&
        !endpoint.includes('/auth/session/refresh') &&
        !endpoint.includes('/session/login')
    ) {
        const refreshed = await tryRefresh();

        if (refreshed) {
            // retry original request ONCE
            return authFetch(endpoint, method, payload);
        }

        // redirect only if not already on login
        if (!window.location.pathname.endsWith('login')) {
            window.location.href = 'login';
        }

        return null;
    }

    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error('Invalid JSON response from server');
    }

    if (!response.ok) {
        const errorMsg = Array.isArray(data.detail)
            ? data.detail.map(err => err.msg).join(', ')
            : (data.detail || 'Something went wrong');

        throw new Error(errorMsg);
    }

    return data;
}

// 🔒 SINGLE FLIGHT REFRESH (main fix)
async function tryRefresh() {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/session/refresh`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!res.ok) return false;

            const data = await res.json();
            sessionStorage.setItem('access_token', data.access_token);

            return true;
        } catch (err) {
            return false;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}
