/**
 * NeuroTrack Doctor Dashboard
 * Modular JavaScript for dashboard functionality
 */

// ==================== GLOBAL STATE ====================
const DoctorDashboard = {
    // Data stores
    patientsData: null,
    filesData: null,
    chatData: null,
    meetingsData: [],
    calendarEvents: [],
    
    // Selection states
    selectedPatient: null,
    selectedPatientForList: null,
    activeChat: null,
    selectedMeeting: null,
    
    // UI states
    currentFolder: null,
    fileViewMode: 'grid',
    activeSection: 'dashboard',
    activeSidebarView: 'patient-dashboard',
    activeScheduleView: 'calendar',
    currentFilter: 'all',
    currentDate: new Date(),
    activeFilters: ['meeting', 'consultation', 'therapy', 'checkup'],
    
    // Chart instances
    chartInstances: {},
    
    // Meeting states
    meetingMicMuted: false,
    meetingCameraOff: false
};

// ==================== FALLBACK DATA ====================
const FallbackData = {
    userProfile: {
        email: 'dokter@neurotrack.com',
        username: 'dokter',
        role: 'doctor',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        profile: {
            fullName: 'Dr. Dokter Wijaya',
            specialization: 'Neurology',
            licenseId: 'MD-123456',
            hospitalAffiliation: 'General Hospital',
            department: 'Neuroscience Center',
            phone: '+62 812-3456-7890',
            mobile: '+62 856-9876-5432',
            address: '123 Medical Plaza',
            city: 'Jakarta, Indonesia'
        }
    },
    
    calendarEvents: [
        { id: 1, title: "Patient Consultation", description: "Alice Tan - Recovery Progress Review", date: "2025-12-16", time: "09:00", category: "consultation", icon: "👩‍⚕️" },
        { id: 2, title: "Team Meeting", description: "Weekly physio team sync", date: "2025-12-16", time: "11:00", category: "meeting", icon: "👥" },
        { id: 3, title: "Therapy Session", description: "Robert Chen - Motor Function", date: "2025-12-16", time: "14:00", category: "therapy", icon: "🏃" },
        { id: 4, title: "Patient Checkup", description: "Maria Santos - Balance Assessment", date: "2025-12-17", time: "10:00", category: "checkup", icon: "📋" },
        { id: 5, title: "Consultation", description: "New patient intake - David Kim", date: "2025-12-17", time: "13:00", category: "consultation", icon: "👩‍⚕️" },
        { id: 6, title: "Department Meeting", description: "Monthly review with neurology dept", date: "2025-12-18", time: "09:30", category: "meeting", icon: "👥" },
        { id: 7, title: "Therapy Review", description: "Susan Park - Upper limb progress", date: "2025-12-18", time: "15:00", category: "therapy", icon: "🏃" },
        { id: 8, title: "Patient Consultation", description: "John Williams - Speech therapy update", date: "2025-12-19", time: "11:00", category: "consultation", icon: "👩‍⚕️" },
        { id: 9, title: "Checkup", description: "Emma Thompson - Spinal assessment", date: "2025-12-19", time: "14:30", category: "checkup", icon: "📋" },
        { id: 10, title: "Team Sync", description: "Physio progress reports", date: "2025-12-20", time: "10:00", category: "meeting", icon: "👥" }
    ],
    
    chatParticipants: [
        { id: "p1", name: "Alice Tan", type: "patient", avatar: null, online: true, lastMessage: "Thank you for the update, Doctor!", lastMessageTime: new Date(Date.now() - 1800000).toISOString(), unread: 2 },
        { id: "p2", name: "Robert Chen", type: "patient", avatar: null, online: false, lastMessage: "I'll see you at the next session.", lastMessageTime: new Date(Date.now() - 86400000).toISOString(), unread: 0 },
        { id: "p3", name: "Maria Santos", type: "patient", avatar: null, online: true, lastMessage: "The exercises are helping a lot!", lastMessageTime: new Date(Date.now() - 3600000).toISOString(), unread: 1 },
        { id: "pt1", name: "Dr. Sarah Johnson", type: "physio", avatar: null, online: true, lastMessage: "Patient reports are ready for your review.", lastMessageTime: new Date(Date.now() - 900000).toISOString(), unread: 1 },
        { id: "pt2", name: "Dr. Michael Lee", type: "physio", avatar: null, online: false, lastMessage: "New protocol for stroke rehabilitation is ready.", lastMessageTime: new Date(Date.now() - 5400000).toISOString(), unread: 3 }
    ]
};

// ==================== UTILITY FUNCTIONS ====================
const Utils = {
    // Safely set text content
    setTextContent(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },
    
    // Safely get element
    getElement(id) {
        return document.getElementById(id);
    },
    
    // Format date
    formatDate(dateStr, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
        return new Date(dateStr).toLocaleDateString('en-US', options);
    },
    
    // Format time ago
    formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
};

// ==================== SECTION NAVIGATION ====================
function showSection(section) {
    console.log('Showing section:', section);
    
    // Get all section elements
    const sections = {
        dashboard: Utils.getElement('dashboardSection'),
        schedule: Utils.getElement('scheduleSection'),
        profile: Utils.getElement('profileSection'),
        messages: Utils.getElement('messagesSection')
    };
    
    // Hide all sections
    Object.values(sections).forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    // Show selected section and initialize
    try {
        switch(section) {
            case 'dashboard':
                if (sections.dashboard) sections.dashboard.style.display = 'block';
                if (!DoctorDashboard.patientsData || !DoctorDashboard.filesData) {
                    initializeDashboard();
                }
                break;
                
            case 'schedule':
                if (sections.schedule) sections.schedule.style.display = 'block';
                initializeScheduleView();
                break;
                
            case 'profile':
                if (sections.profile) sections.profile.style.display = 'block';
                loadProfilePage();
                break;
                
            case 'messages':
                if (sections.messages) sections.messages.style.display = 'block';
                DoctorDashboard.activeChat = null;
                initializeChat();
                break;
        }
    } catch (error) {
        console.error('Error showing section:', section, error);
    }
    
    // Update active nav link
    document.querySelectorAll('.header-nav__link').forEach(link => {
        link.classList.remove('active');
        if (link.textContent.toLowerCase().trim().includes(section)) {
            link.classList.add('active');
        }
    });
    
    DoctorDashboard.activeSection = section;
}

// ==================== NOTIFICATIONS ====================
function toggleNotifications() {
    const dropdown = Utils.getElement('notificationDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

function loadNotifications() {
    fetch('../data/notifications.json')
        .then(response => response.json())
        .then(data => {
            renderNotifications(data.notifications || []);
        })
        .catch(error => {
            console.error('Failed to load notifications:', error);
            renderNotifications([]);
        });
}

function renderNotifications(notifications) {
    const list = Utils.getElement('notificationList');
    if (!list) return;
    
    if (notifications.length === 0) {
        list.innerHTML = '<div class="notification-empty">No new notifications</div>';
        return;
    }
    
    list.innerHTML = notifications.slice(0, 5).map(notif => `
        <div class="notification-item ${notif.read ? '' : 'unread'}" onclick="markNotificationRead('${notif.id}')">
            <div class="notification-item__icon ${notif.type}">
                ${getNotificationIcon(notif.type)}
            </div>
            <div class="notification-item__content">
                <p class="notification-item__title">${notif.title}</p>
                <p class="notification-item__message">${notif.message}</p>
                <span class="notification-item__time">${Utils.formatTimeAgo(notif.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

function getNotificationIcon(type) {
    const icons = {
        alert: '<svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
        message: '<svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>',
        appointment: '<svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>',
        default: '<svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
    };
    return icons[type] || icons.default;
}

function markNotificationRead(id) {
    console.log('Marking notification as read:', id);
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    const notificationDropdown = Utils.getElement('notificationDropdown');
    const notificationBtn = document.querySelector('.header-notification');
    
    if (notificationDropdown && notificationBtn) {
        if (!notificationBtn.contains(event.target) && !notificationDropdown.contains(event.target)) {
            notificationDropdown.classList.remove('active');
        }
    }
});

// ==================== PROFILE SECTION ====================
function loadProfilePage() {
    let userData = JSON.parse(localStorage.getItem('neurotrack_user') || '{}');
    
    // Use fallback if no valid user data
    if (!userData || !userData.profile || Object.keys(userData.profile).length === 0) {
        userData = FallbackData.userProfile;
    }
    
    try {
        const profile = userData.profile;
        
        // Basic Info
        Utils.setTextContent('profilePageName', profile.fullName || 'Dr. Dokter');
        Utils.setTextContent('profilePageRole', `Senior ${(profile.specialization || 'Neurologist')}`);
        
        // Avatar Initial
        const firstLetter = (profile.fullName || 'D').charAt(0).toUpperCase();
        Utils.setTextContent('profilePageInitial', firstLetter);
        
        // Contact Information
        Utils.setTextContent('profilePageEmail', userData.email || 'dokter@neurotrack.com');
        Utils.setTextContent('profilePagePhone', profile.phone || '+62 812-3456-7890');
        Utils.setTextContent('profilePageMobile', profile.mobile || '+62 856-9876-5432');
        
        // Personal Information
        Utils.setTextContent('profilePageFullName', profile.fullName || 'Dr. Dokter Wijaya');
        Utils.setTextContent('profilePageLicense', profile.licenseId || 'MD-123456');
        Utils.setTextContent('profilePageUsername', '@' + (userData.username || 'dokter'));
        
        // Professional Details
        Utils.setTextContent('profilePageSpecialization', profile.specialization || 'Neurology');
        Utils.setTextContent('profilePageHospital', profile.hospitalAffiliation || 'General Hospital');
        Utils.setTextContent('profilePageDepartment', profile.department || 'Neuroscience Center');
        
        // Location
        Utils.setTextContent('profilePageAddress', profile.address || '123 Medical Plaza');
        Utils.setTextContent('profilePageCity', profile.city || 'Jakarta, Indonesia');
        
        // Account Information
        if (userData.created_at) {
            const createdAt = new Date(userData.created_at);
            Utils.setTextContent('profilePageMemberSince', createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        } else {
            Utils.setTextContent('profilePageMemberSince', 'December 2025');
        }
        
        if (userData.last_login) {
            const lastLogin = new Date(userData.last_login);
            const now = new Date();
            const diffMs = now - lastLogin;
            const diffMins = Math.floor(diffMs / 60000);
            
            let lastLoginText;
            if (diffMins < 1) lastLoginText = 'Just now';
            else if (diffMins < 60) lastLoginText = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
            else if (diffMins < 1440) {
                const hours = Math.floor(diffMins / 60);
                lastLoginText = `${hours} hour${hours > 1 ? 's' : ''} ago`;
            } else {
                lastLoginText = lastLogin.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            Utils.setTextContent('profilePageLastLogin', lastLoginText);
        } else {
            Utils.setTextContent('profilePageLastLogin', 'Just now');
        }
        
        console.log('Profile page loaded successfully');
    } catch (error) {
        console.error('Error loading profile page:', error);
    }
}

// ==================== SCHEDULE SECTION ====================
async function initializeScheduleView() {
    try {
        // Load calendar events
        const response = await fetch('../data/calendar-events.json');
        const data = await response.json();
        DoctorDashboard.calendarEvents = data.events || [];
        
        if (DoctorDashboard.calendarEvents.length === 0) {
            DoctorDashboard.calendarEvents = FallbackData.calendarEvents;
        }
    } catch (error) {
        console.warn('Using fallback calendar events:', error.message);
        DoctorDashboard.calendarEvents = FallbackData.calendarEvents;
    }
    
    // Update stats and render views
    updateScheduleStats();
    switchScheduleView('calendar');
    
    console.log('Schedule view initialized with', DoctorDashboard.calendarEvents.length, 'events');
}

function switchScheduleView(viewName) {
    DoctorDashboard.activeScheduleView = viewName;
    
    // Update sidebar active state
    document.querySelectorAll('.schedule-sidebar-nav .sidebar__item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.querySelector(`.sidebar__item[data-schedule-view="${viewName}"]`);
    if (activeItem) activeItem.classList.add('active');
    
    // Get view elements
    const views = {
        calendar: Utils.getElement('scheduleCalendarView'),
        meetings: Utils.getElement('scheduleMeetingsView'),
        upcoming: Utils.getElement('scheduleUpcomingView'),
        consultations: Utils.getElement('scheduleConsultationsView')
    };
    
    // Hide all views
    Object.values(views).forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    // Show selected view
    try {
        switch(viewName) {
            case 'calendar':
                if (views.calendar) views.calendar.style.display = 'block';
                renderCalendar();
                break;
            case 'meetings':
                if (views.meetings) views.meetings.style.display = 'block';
                renderMeetingsList();
                break;
            case 'upcoming':
                if (views.upcoming) views.upcoming.style.display = 'block';
                renderUpcomingEventsFull();
                break;
            case 'consultations':
                if (views.consultations) views.consultations.style.display = 'block';
                renderConsultations();
                break;
        }
    } catch (error) {
        console.error('Error rendering schedule view:', viewName, error);
    }
}

function updateScheduleStats() {
    const events = DoctorDashboard.calendarEvents;
    const meetings = events.filter(e => e.category === 'meeting' || e.category === 'consultation');
    Utils.setTextContent('scheduleMeetingsCount', meetings.length);
    Utils.setTextContent('scheduleEventsCount', events.length);
}

function renderCalendar() {
    const calendarBody = Utils.getElement('calendarBody');
    const calendarTitleEl = Utils.getElement('calendarTitle');
    
    if (!calendarBody || !calendarTitleEl) return;
    
    const year = DoctorDashboard.currentDate.getFullYear();
    const month = DoctorDashboard.currentDate.getMonth();
    
    // Update title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    calendarTitleEl.textContent = `${monthNames[month]} ${year}`;
    
    // Calculate calendar grid
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    calendarBody.innerHTML = '';
    
    let dayCounter = 1;
    let nextMonthCounter = 1;
    const totalCells = 42;
    
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        
        if (i < startingDayOfWeek) {
            const day = prevMonthLastDay - startingDayOfWeek + i + 1;
            cell.classList.add('other-month');
            cell.innerHTML = `<div class="cell-date">${day}</div>`;
        } else if (dayCounter <= daysInMonth) {
            const cellDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayCounter).padStart(2, '0')}`;
            const today = new Date();
            
            if (dayCounter === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                cell.classList.add('today');
            }
            
            cell.innerHTML = `<div class="cell-date">${dayCounter}</div>`;
            
            // Add events
            const dayEvents = DoctorDashboard.calendarEvents.filter(evt => 
                evt.date === cellDate && DoctorDashboard.activeFilters.includes(evt.category)
            );
            
            if (dayEvents.length > 0) {
                const eventsHtml = dayEvents.slice(0, 3).map(evt => 
                    `<div class="calendar-event ${evt.category}" onclick="showEventDetails(${evt.id})">${evt.icon} ${evt.title}</div>`
                ).join('');
                cell.innerHTML += eventsHtml;
                
                if (dayEvents.length > 3) {
                    cell.innerHTML += `<div class="more-events">+${dayEvents.length - 3} more</div>`;
                }
            }
            
            dayCounter++;
        } else {
            cell.classList.add('other-month');
            cell.innerHTML = `<div class="cell-date">${nextMonthCounter}</div>`;
            nextMonthCounter++;
        }
        
        calendarBody.appendChild(cell);
    }
    
    // Render related components
    renderMiniCalendar();
    renderUpcomingEvents();
    renderTodaysEvents();
}

function renderMiniCalendar() {
    const container = Utils.getElement('miniCalendarBody');
    if (!container) return;
    
    const year = DoctorDashboard.currentDate.getFullYear();
    const month = DoctorDashboard.currentDate.getMonth();
    const today = new Date();
    
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    let html = '';
    
    // Empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
        html += '<div class="mini-day empty"></div>';
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const hasEvents = DoctorDashboard.calendarEvents.some(e => e.date === dateStr);
        
        let classes = 'mini-day';
        if (isToday) classes += ' today';
        if (hasEvents) classes += ' has-events';
        
        html += `<div class="${classes}">${day}</div>`;
    }
    
    container.innerHTML = html;
}

function renderUpcomingEvents() {
    const container = Utils.getElement('upcomingEventsList');
    if (!container) return;
    
    const today = new Date();
    const upcomingEvents = DoctorDashboard.calendarEvents
        .filter(evt => {
            const eventDate = new Date(evt.date);
            return eventDate >= today && DoctorDashboard.activeFilters.includes(evt.category);
        })
        .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
        .slice(0, 10);
    
    container.innerHTML = upcomingEvents.map(evt => {
        const eventDate = new Date(evt.date);
        const dateStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        return `
            <div class="upcoming-event">
                <div class="upcoming-event__icon ${evt.category}">${evt.icon}</div>
                <div class="upcoming-event__content">
                    <div class="upcoming-event__title">${evt.title}</div>
                    <div class="upcoming-event__description">${evt.description}</div>
                    <div class="upcoming-event__time">${dateStr} • ${evt.time}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderTodaysEvents() {
    const container = Utils.getElement('todaysEventsList');
    const dateEl = Utils.getElement('todaysDate');
    if (!container) return;
    
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    if (dateEl) {
        dateEl.textContent = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
    
    const todaysEvents = DoctorDashboard.calendarEvents.filter(e => e.date === dateStr);
    
    if (todaysEvents.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No events scheduled for today</p></div>';
        return;
    }
    
    container.innerHTML = todaysEvents.map(evt => `
        <div class="todays-event">
            <div class="todays-event__time">${evt.time}</div>
            <div class="todays-event__content">
                <div class="todays-event__title">${evt.title}</div>
                <div class="todays-event__desc">${evt.description}</div>
            </div>
        </div>
    `).join('');
}

function prevMonth() {
    DoctorDashboard.currentDate.setMonth(DoctorDashboard.currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    DoctorDashboard.currentDate.setMonth(DoctorDashboard.currentDate.getMonth() + 1);
    renderCalendar();
}

function goToToday() {
    DoctorDashboard.currentDate = new Date();
    renderCalendar();
}

function renderMeetingsList() {
    const container = Utils.getElement('meetingsListContainer');
    if (!container) return;
    
    const meetings = DoctorDashboard.calendarEvents.filter(e => 
        e.category === 'meeting' || e.category === 'consultation'
    );
    
    if (meetings.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No meetings scheduled</p></div>';
        return;
    }
    
    container.innerHTML = meetings.map(meeting => `
        <div class="meeting-card" onclick="showEventDetails(${meeting.id})">
            <div class="meeting-card__icon">${meeting.icon}</div>
            <div class="meeting-card__content">
                <h4>${meeting.title}</h4>
                <p>${meeting.description}</p>
                <span class="meeting-card__time">${meeting.date} at ${meeting.time}</span>
            </div>
        </div>
    `).join('');
}

function renderUpcomingEventsFull() {
    const container = Utils.getElement('upcomingEventsFullList');
    if (!container) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = DoctorDashboard.calendarEvents
        .filter(e => new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
        .slice(0, 20);
    
    if (upcoming.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No upcoming events</p></div>';
        return;
    }
    
    container.innerHTML = upcoming.map(evt => `
        <div class="upcoming-event-full">
            <div class="upcoming-event-full__date">
                ${new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div class="upcoming-event-full__content">
                <h4>${evt.icon} ${evt.title}</h4>
                <p>${evt.description}</p>
                <span>${evt.time}</span>
            </div>
        </div>
    `).join('');
}

function renderConsultations() {
    const container = Utils.getElement('consultationsListContainer');
    if (!container) return;
    
    const consultations = DoctorDashboard.calendarEvents.filter(e => e.category === 'consultation');
    
    if (consultations.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No consultations scheduled</p></div>';
        return;
    }
    
    container.innerHTML = consultations.map(c => `
        <div class="consultation-card">
            <div class="consultation-card__icon">${c.icon}</div>
            <div class="consultation-card__content">
                <h4>${c.title}</h4>
                <p>${c.description}</p>
                <span>${c.date} at ${c.time}</span>
            </div>
        </div>
    `).join('');
}

function filterEvents(category) {
    const index = DoctorDashboard.activeFilters.indexOf(category);
    if (index > -1) {
        DoctorDashboard.activeFilters.splice(index, 1);
    } else {
        DoctorDashboard.activeFilters.push(category);
    }
    renderCalendar();
}

function showEventDetails(eventId) {
    const event = DoctorDashboard.calendarEvents.find(e => e.id === eventId);
    if (event) {
        alert(`Event: ${event.title}\n${event.description}\nDate: ${event.date} at ${event.time}`);
    }
}

// ==================== MESSAGES/CHAT SECTION ====================
async function initializeChat() {
    const participantsList = Utils.getElement('participantsList');
    if (participantsList) {
        participantsList.innerHTML = '<div class="loading-state"><p>Loading conversations...</p></div>';
    }
    
    try {
        const response = await fetch('../data/messages.json');
        if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
        
        DoctorDashboard.chatData = await response.json();
        
        if (!DoctorDashboard.chatData || !DoctorDashboard.chatData.participants || 
            DoctorDashboard.chatData.participants.length === 0) {
            throw new Error('Empty chat data');
        }
    } catch (error) {
        console.warn('Using fallback chat data:', error.message);
        DoctorDashboard.chatData = {
            participants: FallbackData.chatParticipants,
            messages: {}
        };
    }
    
    // Render UI
    renderParticipants();
    setupChatSearch();
    resetChatToDefaultState();
    
    console.log('Chat initialized with', DoctorDashboard.chatData.participants.length, 'participants');
}

function resetChatToDefaultState() {
    const placeholder = document.querySelector('.chat-header__placeholder');
    const activeHeader = document.querySelector('.chat-header__active');
    const messagesContainer = Utils.getElement('chatMessages');
    const composerInput = Utils.getElement('messageInput');
    
    if (placeholder) placeholder.style.display = 'flex';
    if (activeHeader) activeHeader.style.display = 'none';
    if (messagesContainer) messagesContainer.innerHTML = '';
    if (composerInput) composerInput.value = '';
    
    document.querySelectorAll('.participant-item').forEach(item => {
        item.classList.remove('active');
    });
}

function renderParticipants(filterType = 'all') {
    const participantsList = Utils.getElement('participantsList');
    if (!participantsList || !DoctorDashboard.chatData) return;
    
    let participants = [...DoctorDashboard.chatData.participants];
    
    // Apply filter
    if (filterType === 'patient') {
        participants = participants.filter(p => p.type === 'patient');
    } else if (filterType === 'physio') {
        participants = participants.filter(p => p.type === 'physio');
    }
    
    if (participants.length === 0) {
        participantsList.innerHTML = `
            <div class="participants-empty">
                <svg width="32" height="32" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
                <p>No ${filterType === 'all' ? 'conversations' : filterType + 's'} found</p>
            </div>
        `;
        return;
    }
    
    // Sort by last message time
    participants.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    
    participantsList.innerHTML = participants.map(p => `
        <div class="participant-item ${DoctorDashboard.activeChat === p.id ? 'active' : ''}" 
             data-id="${p.id}" 
             onclick="selectParticipant('${p.id}')"
             tabindex="0">
            <div class="participant-avatar ${p.online ? 'online' : ''}">
                ${p.name.charAt(0)}
            </div>
            <div class="participant-info">
                <div class="participant-name">${p.name}</div>
                <div class="participant-preview">${p.lastMessage}</div>
            </div>
            <div class="participant-meta">
                <span class="participant-time">${Utils.formatTimeAgo(p.lastMessageTime)}</span>
                ${p.unread > 0 ? `<span class="participant-unread">${p.unread}</span>` : ''}
            </div>
        </div>
    `).join('');
    
    DoctorDashboard.currentFilter = filterType;
}

function selectParticipant(participantId) {
    DoctorDashboard.activeChat = participantId;
    
    const participant = DoctorDashboard.chatData.participants.find(p => p.id === participantId);
    if (!participant) return;
    
    // Clear unread
    participant.unread = 0;
    
    // Update UI
    document.querySelectorAll('.participant-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`.participant-item[data-id="${participantId}"]`)?.classList.add('active');
    
    // Show chat header
    const placeholder = document.querySelector('.chat-header__placeholder');
    const activeHeader = document.querySelector('.chat-header__active');
    if (placeholder) placeholder.style.display = 'none';
    if (activeHeader) activeHeader.style.display = 'flex';
    
    // Update header info
    Utils.setTextContent('chatName', participant.name);
    Utils.setTextContent('chatStatus', participant.online ? 'Online' : 'Offline');
    Utils.setTextContent('chatAvatarInitial', participant.name.charAt(0));
    
    // Load messages
    loadMessages(participantId);
    renderParticipants(DoctorDashboard.currentFilter);
}

function loadMessages(participantId) {
    const container = Utils.getElement('chatMessages');
    if (!container) return;
    
    const messages = DoctorDashboard.chatData.messages?.[participantId] || [];
    
    if (messages.length === 0) {
        container.innerHTML = '<div class="chat-empty"><p>No messages yet. Start the conversation!</p></div>';
        return;
    }
    
    container.innerHTML = messages.map(msg => `
        <div class="chat-message ${msg.from === 'me' ? 'sent' : 'received'}">
            <div class="chat-message__bubble">${msg.text}</div>
            <div class="chat-message__time">${Utils.formatTimeAgo(msg.time)}</div>
        </div>
    `).join('');
    
    container.scrollTop = container.scrollHeight;
}

function setupChatSearch() {
    const searchInput = Utils.getElement('chatSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.participant-item').forEach(item => {
                const name = item.querySelector('.participant-name')?.textContent.toLowerCase() || '';
                item.style.display = name.includes(query) ? '' : 'none';
            });
        });
    }
}

function filterChatParticipants(type) {
    renderParticipants(type);
    
    // Update filter button states
    document.querySelectorAll('.chat-filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.chat-filter-btn[data-filter="${type}"]`)?.classList.add('active');
}

function sendMessage() {
    const input = Utils.getElement('messageInput');
    if (!input || !DoctorDashboard.activeChat) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    // Add message to data
    if (!DoctorDashboard.chatData.messages[DoctorDashboard.activeChat]) {
        DoctorDashboard.chatData.messages[DoctorDashboard.activeChat] = [];
    }
    
    DoctorDashboard.chatData.messages[DoctorDashboard.activeChat].push({
        id: 'm' + Date.now(),
        from: 'me',
        text: text,
        time: new Date().toISOString(),
        sent: true
    });
    
    // Update participant's last message
    const participant = DoctorDashboard.chatData.participants.find(p => p.id === DoctorDashboard.activeChat);
    if (participant) {
        participant.lastMessage = text;
        participant.lastMessageTime = new Date().toISOString();
    }
    
    // Clear input and refresh
    input.value = '';
    loadMessages(DoctorDashboard.activeChat);
    renderParticipants(DoctorDashboard.currentFilter);
}

// ==================== SIDEBAR TOGGLES ====================
function toggleDashboardSidebar() {
    const sidebar = Utils.getElement('dashboardSidebarNav');
    const mainContent = document.querySelector('.dashboard-main-content');
    if (sidebar) sidebar.classList.toggle('collapsed');
    if (mainContent) mainContent.classList.toggle('expanded');
}

function toggleScheduleSidebar() {
    const sidebar = Utils.getElement('scheduleSidebarNav');
    const mainContent = document.querySelector('.schedule-main-content');
    if (sidebar) sidebar.classList.toggle('collapsed');
    if (mainContent) mainContent.classList.toggle('expanded');
}

function switchSidebarView(viewName) {
    DoctorDashboard.activeSidebarView = viewName;
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar__item').forEach(item => item.classList.remove('active'));
    document.querySelector(`.sidebar__item[data-view="${viewName}"]`)?.classList.add('active');
    
    // Toggle view visibility
    const views = ['patientDashboardView', 'patientListView', 'filesView'];
    views.forEach(id => {
        const el = Utils.getElement(id);
        if (el) el.style.display = 'none';
    });
    
    const viewMap = {
        'patient-dashboard': 'patientDashboardView',
        'patient-list': 'patientListView',
        'files': 'filesView'
    };
    
    const targetView = Utils.getElement(viewMap[viewName]);
    if (targetView) targetView.style.display = 'block';
}

// ==================== PROFILE MODAL ====================
function openProfileModal() {
    const modal = Utils.getElement('profileModal');
    if (modal) modal.classList.add('active');
    loadModalProfileData();
}

function closeProfileModal() {
    const modal = Utils.getElement('profileModal');
    if (modal) modal.classList.remove('active');
}

function loadModalProfileData() {
    let userData = JSON.parse(localStorage.getItem('neurotrack_user') || '{}');
    if (!userData || !userData.profile) userData = FallbackData.userProfile;
    
    Utils.setTextContent('profileName', userData.profile.fullName || 'Dr. Dokter');
    Utils.setTextContent('profileRoleBadge', 'Doctor');
    Utils.setTextContent('profileEmail', userData.email || 'dokter@neurotrack.com');
    Utils.setTextContent('profileUsername', userData.username || 'dokter');
    Utils.setTextContent('profileSpecialization', userData.profile.specialization || 'Neurology');
    Utils.setTextContent('profileLicense', userData.profile.licenseId || 'MD-123456');
    Utils.setTextContent('profileHospital', userData.profile.hospitalAffiliation || 'General Hospital');
}

// ==================== LOGOUT ====================
function handleLogout() {
    localStorage.removeItem('neurotrack_user');
    window.location.href = './login.html';
}

// ==================== PLACEHOLDER FUNCTIONS ====================
function exportCalendar() { alert('Export Calendar feature coming soon!'); }
function addNewEvent() { alert('Add New Event feature coming soon!'); }
function exportPatientPDF() { alert('Export PDF feature coming soon!'); }
function addPatientNote() { alert('Add Note feature coming soon!'); }
function markAllAsRead() { alert('All messages marked as read!'); }
function startNewConversation() { alert('Start New Conversation feature coming soon!'); }
function viewBroadcasts() { alert('View Broadcasts feature coming soon!'); }

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Doctor Dashboard initializing...');
    
    // Check authentication
    const userData = JSON.parse(localStorage.getItem('neurotrack_user') || '{}');
    
    if (!userData.role || userData.role !== 'doctor') {
        console.log('No valid doctor session, redirecting to login');
        window.location.href = './login.html';
        return;
    }
    
    // Update header with user data
    Utils.setTextContent('userName', userData.profile?.fullName || 'Dr. Dokter');
    Utils.setTextContent('userRole', 'Doctor');
    
    const firstLetter = (userData.profile?.fullName || 'D').charAt(0).toUpperCase();
    Utils.setTextContent('userAvatar', firstLetter);
    
    // Load notifications
    loadNotifications();
    
    // Initialize dashboard (default section)
    if (typeof initializeDashboard === 'function') {
        initializeDashboard();
    }
    
    // Show dashboard by default
    showSection('dashboard');
    
    console.log('Doctor Dashboard initialized successfully');
});

// Make functions globally available
window.showSection = showSection;
window.toggleNotifications = toggleNotifications;
window.loadProfilePage = loadProfilePage;
window.initializeScheduleView = initializeScheduleView;
window.switchScheduleView = switchScheduleView;
window.initializeChat = initializeChat;
window.renderParticipants = renderParticipants;
window.selectParticipant = selectParticipant;
window.sendMessage = sendMessage;
window.filterChatParticipants = filterChatParticipants;
window.toggleDashboardSidebar = toggleDashboardSidebar;
window.toggleScheduleSidebar = toggleScheduleSidebar;
window.switchSidebarView = switchSidebarView;
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.handleLogout = handleLogout;
window.prevMonth = prevMonth;
window.nextMonth = nextMonth;
window.goToToday = goToToday;
window.filterEvents = filterEvents;
window.showEventDetails = showEventDetails;
window.exportCalendar = exportCalendar;
window.addNewEvent = addNewEvent;
window.exportPatientPDF = exportPatientPDF;
window.addPatientNote = addPatientNote;
window.markAllAsRead = markAllAsRead;
window.startNewConversation = startNewConversation;
window.viewBroadcasts = viewBroadcasts;
