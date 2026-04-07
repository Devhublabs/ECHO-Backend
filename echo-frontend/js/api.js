// ─────────────────────────────────────────
//  Echo API Helper
//  All calls go through Ronald's Gateway
//  Base: https://echo-backend-gateway.up.railway.app
// ─────────────────────────────────────────

function getApiBase() {
    const host = (window.location.hostname || '').toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    return isLocal ? 'http://localhost:8080' : 'https://echo-backend-gateway.up.railway.app';
}

const API_BASE = getApiBase();

const Api = {

    // ── Core fetch wrapper ──
    async request(method, endpoint, body = null) {
        const token = localStorage.getItem('echo_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const url = `${API_BASE}${endpoint}`;
        console.log('[API]', method, url);

        const response = await fetch(url, options);
        const data = await response.json();

        // Handle token expiry globally
        if (response.status === 401) {
            localStorage.removeItem('echo_token');
            localStorage.removeItem('echo_role');
            localStorage.removeItem('echo_user');
            window.location.href = '../../get-started.html';
            return;
        }

        if (!response.ok) {
            throw {
                status: response.status,
                message: data.error || data.message || 'Something went wrong.',
                code: data.code || null
            };
        }

        return data;
    },

    get(endpoint)         { return this.request('GET',  endpoint); },
    post(endpoint, body)  { return this.request('POST', endpoint, body); },
    put(endpoint, body)   { return this.request('PUT',  endpoint, body); },

    // ──────────────────────────────────────
    //  AUTH  (no token required)
    // ──────────────────────────────────────

    // Register a new user (step 1 - creates account, no school yet)
    register(firstName, lastName, email, password) {
        return this.post('/register', {
            first_name: firstName,
            last_name:  lastName,
            email,
            password
        });
    },

    // Login - returns { message, token, user }
    login(email, password) {
        return this.post('/login', { email, password });
    },

    // ──────────────────────────────────────
    //  SCHOOL SETUP  (after registration)
    // ──────────────────────────────────────

    // Owner: Create a new school and join it
    createAndJoinSchool(userId, schoolName, schoolType) {
        return this.post('/create-and-join', {
            user_id: userId,
            school_name: schoolName,
            school_type: schoolType,  // 'senior' | 'junior' | 'primary'
        });
    },

    // Teacher / Student: Join existing school via registration code
    joinSchool(userId, registrationCode, roleType) {
        return this.post('/join', {
            user_id:           userId,
            registration_code: registrationCode, // TCH-XXXX-XXX or STU-XXXX-XXX
            role_type:         roleType           // 'teacher' | 'student'
        });
    },

    // ──────────────────────────────────────
    //  SCHOOLS
    // ──────────────────────────────────────

    getSchools()                  { return this.get('/schools'); },
    getSchool(schoolId)           { return this.get(`/schools/${schoolId}`); },
    getSchoolStats(schoolId)      { return this.get(`/schools/${schoolId}/stats`); },
    async updateSchool(schoolId, data)  {
        try {
            return await this.put(`/schools/${schoolId}`, data);
        } catch (err) {
            // Some deployments enable strict trailing-slash routing.
            // If backend expects `/schools/<id>/`, retry once to avoid 405s.
            if (err?.status === 405) {
                return await this.put(`/schools/${schoolId}/`, data);
            }
            throw err;
        }
    },
    getSchoolTeachers(schoolId)   { return this.get(`/teachers?school_id=${encodeURIComponent(schoolId)}`); },
    getSchoolStudents(schoolId)   { return this.get(`/students?school_id=${encodeURIComponent(schoolId)}`); },

    // ──────────────────────────────────────
    //  TEACHERS
    // ──────────────────────────────────────

    getTeachers()                 { return this.get('/teachers'); },
    getTeacher(teacherId)         { return this.get(`/teachers/${teacherId}`); },
    createTeacher(data)           { return this.post('/teachers', data); },
    updateTeacher(teacherId, data){ return this.put(`/teachers/${teacherId}`, data); },

    // ──────────────────────────────────────
    //  STUDENTS
    // ──────────────────────────────────────

    getStudents()                 { return this.get('/students'); },
    getStudent(studentId)         { return this.get(`/students/${studentId}`); },
    createStudent(data)           { return this.post('/students', data); },
    updateStudent(studentId, data){ return this.put(`/students/${studentId}`, data); },

    // ──────────────────────────────────────
    //  CLASSES & SUBJECTS
    // ──────────────────────────────────────

    getClasses()                  { return this.get('/classes'); },
    createClass(data)             { return this.post('/classes', data); },
    getClass(classId)             { return this.get(`/classes/${classId}`); },
    getClassStudents(classId)     { return this.get(`/classes/${classId}/students`); },

    getSubjects()                 { return this.get('/subjects'); },
    createSubject(data)           { return this.post('/subjects', data); },
    getSubject(subjectId)         { return this.get(`/subjects/${subjectId}`); },

    // ──────────────────────────────────────
    //  USERS
    // ──────────────────────────────────────

    getUsers()                    { return this.get('/users'); },
    getUser(userId)               { return this.get(`/users/${userId}`); },
    updateUser(userId, data)      { return this.put(`/users/${userId}`, data); },

    // ──────────────────────────────────────
    //  DASHBOARD
    // ──────────────────────────────────────

    getSchoolDashboardOverview(schoolId) { return this.get(`/dashboard/overview/${schoolId}`); },
    getTeacherDashboard(teacherId)       { return this.get(`/dashboard/teacher/${teacherId}`); },

    // ──────────────────────────────────────
    //  HEALTH CHECK
    // ──────────────────────────────────────

    healthCheck()                 { return this.get('/health'); },

    // ──────────────────────────────────────
    //  WEBSOCKET
    // ──────────────────────────────────────

    // Connect to real-time notifications
    connectWebSocket(onMessage, onOpen, onClose) {
        const token = localStorage.getItem('echo_token');
        if (!token) return null;

        const wsScheme = API_BASE.startsWith('https://') ? 'wss://' : 'ws://';
        const wsHost = API_BASE.replace(/^https?:\/\//, '');
        const ws = new WebSocket(`${wsScheme}${wsHost}/ws?token=${token}`);
        let pingInterval;

        ws.onopen = function() {
            console.log('Echo WS connected');
            // Keep-alive ping every 30 seconds
            pingInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'ping' }));
                }
            }, 30000);
            if (onOpen) onOpen();
        };

        ws.onmessage = function(event) {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'pong') return; // Ignore pong
                if (onMessage) onMessage(msg);
            } catch(e) {}
        };

        ws.onclose = function() {
            clearInterval(pingInterval);
            console.log('Echo WS disconnected');
            if (onClose) onClose();
        };

        ws.onerror = function(err) {
            console.error('Echo WS error:', err);
        };

        return ws;
    }
};
