# NeuroTrack Doctor Dashboard - QA Checklist

## Version: 1.1.0
## Last Updated: 2025

---

## 1. Navigation & Sidebar Scoping

### Dashboard View
- [ ] ✅ Main sidebar (Navigation) appears ONLY when Dashboard view is active
- [ ] ✅ Sidebar contains: Patient Dashboard, Patient List, Files navigation buttons
- [ ] ✅ Sidebar toggle button collapses/expands sidebar
- [ ] ✅ Quick stats in sidebar footer show correct counts

### Schedule View  
- [ ] ✅ Main sidebar is HIDDEN when Schedule view is active
- [ ] ✅ Schedule-specific sidebar with meetings list appears
- [ ] ✅ Quick Actions section visible (New Meeting, Instant Call buttons)
- [ ] ✅ Today's Stats section shows meetings/consultations counts

### Messages View
- [ ] ✅ Main sidebar is HIDDEN when Messages view is active
- [ ] ✅ Participants panel appears on the right side
- [ ] ✅ Chat panel takes 2/3 of the width

### Profile View
- [ ] ✅ Main sidebar is HIDDEN when Profile view is active
- [ ] ✅ Profile modal/page displays user information correctly

---

## 2. Participant Data Loading (Messages)

### Data Binding
- [ ] ✅ Participants load from `data/messages.json`
- [ ] ✅ Both patients (10) and physios (10) appear in the list
- [ ] ✅ Participant avatars show type-specific styling (patient/physio)
- [ ] ✅ Online status indicator displays correctly
- [ ] ✅ Unread message badges appear for participants with unread messages

### Error States
- [ ] ✅ Error fallback shows when fetch fails
- [ ] ✅ Retry button triggers re-initialization
- [ ] ✅ Empty state message shows when no participants match filter
- [ ] ✅ Console logs initialization success/failure

### Interactions
- [ ] ✅ Click on participant → loads conversation in chat panel
- [ ] ✅ Chat header updates with selected participant info
- [ ] ✅ Messages display correctly with timestamps
- [ ] ✅ Message composer enables after selecting participant

### Filter & Search
- [ ] ✅ "All" filter shows all participants
- [ ] ✅ "Patients" filter shows only patients
- [ ] ✅ "Physios" filter shows only physiotherapists  
- [ ] ✅ Search input filters participants by name

### Accessibility
- [ ] ✅ Keyboard navigation works (Arrow keys, Enter, Tab)
- [ ] ✅ Screen reader labels present on interactive elements
- [ ] ✅ Focus states visible

---

## 3. Schedule View Functionality

### Meetings List
- [ ] ✅ Meetings load from `data/calendar-events.json`
- [ ] ✅ Only meetings & consultations appear (filtered by category)
- [ ] ✅ Meetings sorted by date (upcoming first)
- [ ] ✅ Empty state shows if no upcoming meetings

### Meeting Selection
- [ ] ✅ Click on meeting item → highlights as active
- [ ] ✅ Meeting preview pane updates with selected meeting details
- [ ] ✅ Meeting title, description, time, participants display correctly

### Video Preview Controls
- [ ] ✅ Microphone toggle button works (muted state shows red)
- [ ] ✅ Camera toggle button works (off state shows red)
- [ ] ✅ "Join Meeting" button shows alert (integration placeholder)
- [ ] ✅ Video placeholder area displays correctly

### Calendar Integration
- [ ] ✅ Mini calendar renders correctly
- [ ] ✅ Month navigation (prev/next) works
- [ ] ✅ Event filters toggle event visibility
- [ ] ✅ Events list shows upcoming events

---

## 4. Dashboard Content

### Patient Dashboard Sub-view
- [ ] ✅ Patient selector dropdown populated with patients
- [ ] ✅ KPI cards update when patient selected
- [ ] ✅ Charts render correctly (tremor, ROM, gait)
- [ ] ✅ Recent notes section shows patient notes

### Patient List Sub-view
- [ ] ✅ Patient cards display correctly
- [ ] ✅ Search/filter functionality works
- [ ] ✅ Click on patient → opens patient details

### Files Sub-view
- [ ] ✅ File list loads from `data/files.json`
- [ ] ✅ Files categorized correctly
- [ ] ✅ File preview/download actions work

---

## 5. Event Handling & Leakage

### Click Events
- [ ] ✅ Notification dropdown closes when clicking outside
- [ ] ✅ Profile modal closes when clicking overlay
- [ ] ✅ No duplicate event handlers on re-render

### Keyboard Events
- [ ] ✅ Escape key closes modals
- [ ] ✅ Enter/Space activates focused buttons
- [ ] ✅ No keyboard trap in modals

### State Management
- [ ] ✅ View state persists correctly (activeSection variable)
- [ ] ✅ Chat selection persists when switching views
- [ ] ✅ Schedule meeting selection persists

---

## 6. Responsive Design

### Desktop (>1200px)
- [ ] ✅ Three-column layout in Schedule view
- [ ] ✅ Sidebar fully visible in Dashboard
- [ ] ✅ All content readable

### Tablet (768px - 1199px)
- [ ] ✅ Schedule layout adjusts to 2 columns
- [ ] ✅ Sidebar collapsible

### Mobile (<768px)
- [ ] ✅ Single column layout
- [ ] ✅ Meeting controls stack properly
- [ ] ✅ Touch targets appropriately sized

---

## 7. Visual Polish

### Empty States
- [ ] ✅ All sections have meaningful empty states
- [ ] ✅ Icons and messages guide user action
- [ ] ✅ Retry buttons present where applicable

### Loading States
- [ ] ✅ Loading indicators show during data fetch
- [ ] ✅ Skeleton loaders or spinners visible

### Consistency
- [ ] ✅ Color palette consistent with design tokens
- [ ] ✅ Typography matches design system
- [ ] ✅ Spacing uses CSS variables consistently

---

## 8. Integration Points (For Future Development)

### API Endpoints (Currently Mock)
- [ ] 📝 `/api/messages` - Chat data
- [ ] 📝 `/api/patients` - Patient records
- [ ] 📝 `/api/calendar` - Calendar events
- [ ] 📝 `/api/files` - File management

### WebRTC/Video SDK
- [ ] 📝 Meeting video integration placeholder ready
- [ ] 📝 Mic/camera control state management in place

### Real-time Updates (Sockets)
- [ ] 📝 Chat message sending ready for socket integration
- [ ] 📝 Online status indicators ready for real-time data

---

## Test Results Summary

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Navigation & Sidebar | - | - | |
| Participant Data | - | - | |
| Schedule View | - | - | |
| Dashboard Content | - | - | |
| Event Handling | - | - | |
| Responsive Design | - | - | |
| Visual Polish | - | - | |

**Overall Status:** ⏳ Pending Manual Testing

---

## How to Run Tests

1. Start the server: `python server.py`
2. Navigate to: `http://localhost:5000/pages/login.html`
3. Login with test credentials:
   - Username: `dokter`
   - Password: `password123`
4. Verify each checklist item manually
5. Document any failures with screenshots

---

## Bug Report Template

```
**Bug ID:** BUG-XXX
**Section:** [Navigation/Messages/Schedule/etc.]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**

**Actual Result:**

**Browser/Device:**

**Screenshots:**
```
