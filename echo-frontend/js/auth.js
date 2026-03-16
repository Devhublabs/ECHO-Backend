// ─────────────────────────────────────────
//  Echo Auth Manager
//  Gateway: https://echo-backend-gateway.up.railway.app
// ─────────────────────────────────────────

const Auth = {
    API_BASE: 'https://echo-backend-gateway.up.railway.app',
    STORAGE_KEY: 'echo_current_user',

    // Save session after login
    saveSession(token, user) {
        localStorage.setItem('echo_token',  token);
        localStorage.setItem('echo_role',   user.role || 'user');
        localStorage.setItem('echo_user',   JSON.stringify(user));
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    },

    getToken()  { return localStorage.getItem('echo_token'); },
    getRole()   { return localStorage.getItem('echo_role'); },
    getUser()   {
        try { return JSON.parse(localStorage.getItem('echo_user') || '{}'); }
        catch { return {}; }
    },

    isLoggedIn() { return !!this.getToken(); },

    clearSession() {
        ['echo_token','echo_role','echo_user', this.STORAGE_KEY].forEach(k => localStorage.removeItem(k));
    },

    logout() {
        this.clearSession();
        window.location.href = '../../home.html';
    },

    // Redirect to correct dashboard based on role
    redirectToDashboard(role) {
        const map = {
            owner:   '../../dashboards/admin/dashboard.html',
            admin:   '../../dashboards/admin/dashboard.html',
            teacher: '../../dashboards/teacher/dashboard.html',
            student: '../../dashboards/student/dashboard.html',
        };
        window.location.href = map[role] || '../../get-started.html';
    },

    // Guard: send to login if no token
    requireAuth() {
        if (!this.getToken()) {
            window.location.href = '../../get-started.html';
            return false;
        }
        return true;
    },

    // Guard: send to dashboard if already logged in
    requireGuest() {
        if (this.getToken()) this.redirectToDashboard(this.getRole());
    },

    // Login via gateway POST /login
    async login(email, password) {
        const res  = await fetch(`${this.API_BASE}/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || 'Login failed');
        this.saveSession(data.token, data.user);
        return data;
    },

    // Update dashboard header with user info
    updateDashboardUI() {
        const user = this.getUser();
        if (!user) return;
        const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'User';
        document.querySelectorAll('.user-name').forEach(el => el.textContent = name);
        document.querySelectorAll('.user-role').forEach(el => {
            const r = user.role || '';
            el.textContent = r.charAt(0).toUpperCase() + r.slice(1);
        });
    }
};
