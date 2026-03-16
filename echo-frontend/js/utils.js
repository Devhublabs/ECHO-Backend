// ── Echo Dashboard Utilities ──

// Toast notifications
function toast(msg, type = 'default') {
    let el = document.getElementById('echo-toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'echo-toast';
        el.className = 'toast';
        document.body.appendChild(el);
    }
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i> ${msg}`;
    setTimeout(() => el.classList.add('show'), 10);
    setTimeout(() => el.classList.remove('show'), 3200);
}

// Modal helpers
function openModal(id) {
    document.getElementById(id).classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
    document.body.style.overflow = '';
}
// Close on backdrop click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-backdrop')) {
        e.target.classList.remove('open');
        document.body.style.overflow = '';
    }
});

// Mobile sidebar
const sidebar = document.querySelector('.sidebar');
const overlay = document.querySelector('.sidebar-overlay');
const hamburger = document.querySelector('.hamburger');
if (hamburger && sidebar && overlay) {
    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
    });
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    });
}

// Active nav link
const currentPage = location.pathname.split('/').pop();
document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPage) link.classList.add('active');
});

// Live date/time
function updateTime() {
    const el = document.getElementById('live-time');
    if (el) el.textContent = new Date().toLocaleDateString('en-NG', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}
updateTime();
setInterval(updateTime, 60000);

// Logout
document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('echo_token');
            localStorage.removeItem('echo_role');
            localStorage.removeItem('echo_user');
            window.location.href = '../../login.html';
        }
    });
});

// Simulate form success then redirect/stay
function handleForm(formId, successMsg, redirectUrl, delay = 1500) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const btn = form.querySelector('[type="submit"]');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }
        setTimeout(() => {
            toast(successMsg, 'success');
            if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label || 'Submit'; }
            if (redirectUrl) setTimeout(() => window.location.href = redirectUrl, 800);
            else form.reset();
        }, 900);
    });
}
