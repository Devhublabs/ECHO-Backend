// Simple form handling and interactivity
document.addEventListener('DOMContentLoaded', function() {
    // Login form handling
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Login functionality would connect to your backend API.');
            // In real implementation: fetch API call
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
    
    // Role selection and navigation
    function setupRoleSelection() {
        document.querySelectorAll('[data-role]').forEach(link => {
            link.addEventListener('click', function() {
                const role = this.getAttribute('data-role');
                localStorage.setItem('selectedRole', role);
            });
        });
        
        const urlParams = new URLSearchParams(window.location.search);
        const roleParam = urlParams.get('role');
        if (roleParam) {
            localStorage.setItem('selectedRole', roleParam);
        }
    }
    
    // Form submission with role context
    function handleAuthForms() {
        const forms = document.querySelectorAll('form[id$="Form"]');
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const role = localStorage.getItem('selectedRole') || 'student';
                
                // Add role to form data
                formData.append('role', role);
                
                console.log('Submitting form for role:', role);
                
                // Redirect based on role
                switch(role) {
                    case 'admin':
                        alert('Redirecting to Admin Dashboard...');
                        // window.location.href = '../dashboards/admin-dashboard.html';
                        break;
                    case 'teacher':
                        alert('Redirecting to Teacher Dashboard...');
                        // window.location.href = '../dashboards/teacher-dashboard.html';
                        break;
                    case 'student':
                        alert('Redirecting to Student Dashboard...');
                        // window.location.href = '../dashboards/student-dashboard.html';
                        break;
                }
            });
        });
    }
    
    // Mobile menu toggle (simplified)
    function initMobileMenu() {
        if (window.innerWidth < 768) {
            console.log('Mobile view detected - add hamburger menu if needed');
        }
    }
    
    // Initialize all functions
    setupRoleSelection();
    handleAuthForms();
    initMobileMenu();
    window.addEventListener('resize', initMobileMenu);
});


// js/main.js - Add these functions

// Initialize auth on login/register pages
function initAuthForms() {
    // Handle login forms
    document.querySelectorAll('form[id*="Login"]').forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const email = this.querySelector('input[type="email"]').value;
            const password = this.querySelector('input[type="password"]').value;
            
            // Determine role from page
            let role = 'admin';
            if (window.location.pathname.includes('teacher')) role = 'teacher';
            if (window.location.pathname.includes('student')) role = 'student';
            
            // Show loading
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            submitBtn.disabled = true;
            
            try {
                // Use Auth module
                await Auth.login(email, password, role);
                
                // Success - redirect to dashboard
                setTimeout(() => {
                    window.location.href = `../../dashboards/${role}/dashboard.html`;
                }, 500);
                
            } catch (error) {
                // Error handling
                alert(error.message || 'Login failed. Please try again.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    });
    
    // Handle registration forms
    document.querySelectorAll('form[id*="Register"]').forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Collect form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            
            // Determine role
            let role = 'admin';
            if (window.location.pathname.includes('teacher')) role = 'teacher';
            if (window.location.pathname.includes('student')) role = 'student';
            
            // Show loading
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
            
            try {
                // Use Auth module
                const user = await Auth.register(data, role);
                
                // Success message based on role
                if (role === 'admin') {
                    alert(`School "${data.schoolName || 'Your School'}" registered successfully!`);
                    setTimeout(() => {
                        window.location.href = '../../dashboards/admin/dashboard.html';
                    }, 1000);
                } else {
                    alert('Registration submitted successfully! Account pending approval.');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1000);
                }
                
            } catch (error) {
                // Error handling
                alert(error.message || 'Registration failed. Please try again.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    });
}

// Add to existing DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Existing main.js code...
    
    // Initialize auth forms if on login/register pages
    if (window.location.pathname.includes('/auth/')) {
        initAuthForms();
    }
    
    // Quick login for testing (on homepage)
    if (window.location.pathname.includes('home.html') || 
        window.location.pathname.endsWith('/')) {
        
        // Add quick login buttons if not already present
        if (!document.querySelector('.quick-login-buttons')) {
            const quickLoginDiv = document.createElement('div');
            quickLoginDiv.className = 'quick-login-buttons';
            quickLoginDiv.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                gap: 10px;
                background: white;
                padding: 10px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            `;
            
            quickLoginDiv.innerHTML = `
                <button onclick="quickLogin('admin')" style="padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Test Admin
                </button>
                <button onclick="quickLogin('teacher')" style="padding: 8px 12px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Test Teacher
                </button>
                <button onclick="quickLogin('student')" style="padding: 8px 12px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Test Student
                </button>
            `;
            
            document.body.appendChild(quickLoginDiv);
        }
    }
});

// Global quick login function
window.quickLogin = function(role) {
    Auth.login(`test@${role}.com`, 'password', role)
        .then(() => {
            window.location.href = `dashboards/${role}/dashboard.html`;
        })
        .catch(error => {
            alert('Quick login failed: ' + error.message);
        });
};

// Role selection functionality
function initRoleSelection() {
    // Highlight selected role
    function highlightSelectedRole(role) {
        document.querySelectorAll('.role-card').forEach(card => {
            card.style.borderColor = '';
        });
        
        const selectedCard = document.querySelector(`[data-role="${role}"]`);
        if (selectedCard) {
            selectedCard.style.borderColor = 'var(--echo-blue)';
        }
    }
    
    // Role card click handler
    document.querySelectorAll('.role-card[data-role]').forEach(card => {
        card.addEventListener('click', function(e) {
            const role = this.getAttribute('data-role');
            
            // Store selected role
            localStorage.setItem('echo_selected_role', role);
            
            // Visual feedback
            highlightSelectedRole(role);
            
            // If clicking on register button, let it navigate naturally
            // If clicking anywhere else on card, navigate to register page
            if (!e.target.closest('a') && !e.target.closest('button')) {
                const registerLink = this.querySelector('a.btn-primary');
                if (registerLink) {
                    window.location.href = registerLink.href;
                }
            }
        });
    });
    
    // Restore selection on page load
    const savedRole = localStorage.getItem('echo_selected_role');
    if (savedRole) {
        highlightSelectedRole(savedRole);
    }
}