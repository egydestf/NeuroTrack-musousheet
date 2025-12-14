/**
 * NeuroTrack Mock Authentication
 * Handles login, registration, and role-based field switching
 * Production: Replace with real API calls
 */

// ==================== UTILITY FUNCTIONS ====================

const showError = (fieldId, message) => {
  const errorEl = document.getElementById(fieldId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.setAttribute('aria-live', 'assertive');
  }
};

const clearError = (fieldId) => {
  const errorEl = document.getElementById(fieldId);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.removeAttribute('aria-live');
  }
};

const clearAllErrors = () => {
  document.querySelectorAll('.auth-error').forEach(el => {
    el.textContent = '';
    el.removeAttribute('aria-live');
  });
};

const setButtonLoading = (buttonId, isLoading) => {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  
  if (isLoading) {
    btn.classList.add('is-loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('is-loading');
    btn.disabled = false;
  }
};

// ==================== VALIDATION ====================

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8;
};

const validateRequired = (value) => {
  return value && value.trim() !== '';
};

// ==================== API CONFIGURATION ====================

const API_BASE_URL = 'http://localhost:5000/api';

// ==================== LOGIN LOGIC ====================

const handleLogin = async (e) => {
  e.preventDefault();
  clearAllErrors();
  
  const identifier = document.getElementById('loginEmail')?.value;
  const password = document.getElementById('loginPassword')?.value;
  const role = document.getElementById('loginRole')?.value;
  
  let hasError = false;
  
  // Validate identifier (username or email)
  if (!identifier || identifier.trim() === '') {
    showError('emailError', 'Please enter your username or email');
    hasError = true;
  }
  
  // Validate password
  if (!validatePassword(password)) {
    showError('passwordError', 'Password must be at least 8 characters');
    hasError = true;
  }
  
  // Validate role
  if (!role) {
    showError('roleError', 'Please select your role');
    hasError = true;
  }
  
  if (hasError) return;
  
  // Call real API
  setButtonLoading('loginBtn', true);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ identifier, password })
    });
    
    const data = await response.json();
    
    if (data.success && data.user) {
      // Verify role matches (security check)
      if (data.user.role !== role) {
        showError('roleError', `This account is registered as ${data.user.role}`);
        setButtonLoading('loginBtn', false);
        return;
      }
      
      // Store auth data
      localStorage.setItem('neurotrack_user', JSON.stringify(data.user));
      
      // Redirect based on role
      const dashboards = {
        'patient': '/pages/patient-dashboard.html',
        'doctor': '/pages/docktor-dashboard.html',
        'physio': '/pages/physio-dashboard.html'
      };
      
      window.location.href = dashboards[data.user.role] || '/pages/patient-dashboard.html';
    } else {
      showError('passwordError', data.message || 'Login failed. Please try again.');
      setButtonLoading('loginBtn', false);
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('passwordError', 'Connection error. Please ensure the server is running.');
    setButtonLoading('loginBtn', false);
  }
};

// ==================== REGISTRATION LOGIC ====================

// ROLE SWITCHING: Show/hide fields based on selected role
const switchRole = (newRole) => {
  // Show/hide role-specific field groups
  document.querySelectorAll('.role-fields').forEach(fieldGroup => {
    fieldGroup.classList.remove('is-active');
    fieldGroup.style.display = 'none';
    
    // Disable fields in hidden groups
    fieldGroup.querySelectorAll('input, select').forEach(input => {
      input.removeAttribute('required');
      input.disabled = true;
    });
  });
  
  // Activate the selected role's field group
  const activeGroup = document.getElementById(`${newRole}Fields`);
  if (activeGroup) {
    activeGroup.classList.add('is-active');
    activeGroup.style.display = 'grid';
    
    // Enable fields in active group
    activeGroup.querySelectorAll('input, select').forEach(input => {
      input.setAttribute('required', 'true');
      input.disabled = false;
    });
  }
  
  clearAllErrors();
};

const handleRegister = async (e) => {
  e.preventDefault();
  clearAllErrors();
  
  const name = document.getElementById('registerName')?.value;
  const email = document.getElementById('registerEmail')?.value;
  const password = document.getElementById('registerPassword')?.value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;
  const role = document.getElementById('registerRole')?.value;
  const termsAccepted = document.getElementById('termsAccepted')?.checked;
  
  let hasError = false;
  
  // Common validations
  if (!validateRequired(name)) {
    showError('nameError', 'Full name is required');
    hasError = true;
  }
  
  if (!validateEmail(email)) {
    showError('registerEmailError', 'Please enter a valid email address');
    hasError = true;
  }
  
  if (!validatePassword(password)) {
    showError('registerPasswordError', 'Password must be at least 8 characters');
    hasError = true;
  }
  
  if (password !== confirmPassword) {
    showError('confirmPasswordError', 'Passwords do not match');
    hasError = true;
  }
  
  if (!termsAccepted) {
    showError('termsError', 'You must accept the terms and conditions');
    hasError = true;
  }
  
  // Build profile based on role
  const profile = { fullName: name };
  
  // Role-specific validations and profile building
  if (role === 'patient') {
    const dob = document.getElementById('dateOfBirth')?.value;
    const mrn = document.getElementById('medicalRecordNumber')?.value;
    
    if (!validateRequired(dob)) {
      showError('dobError', 'Date of birth is required');
      hasError = true;
    }
    
    if (!validateRequired(mrn)) {
      showError('mrnError', 'Medical record number is required');
      hasError = true;
    }
    
    profile.dateOfBirth = dob;
    profile.medicalRecordNumber = mrn;
    
  } else if (role === 'doctor') {
    const license = document.getElementById('licenseId')?.value;
    const specialization = document.getElementById('specialization')?.value;
    const hospital = document.getElementById('hospitalAffiliation')?.value;
    
    if (!validateRequired(license)) {
      showError('licenseError', 'Medical license ID is required');
      hasError = true;
    }
    
    if (!validateRequired(specialization)) {
      showError('specializationError', 'Specialization is required');
      hasError = true;
    }
    
    if (!validateRequired(hospital)) {
      showError('hospitalError', 'Hospital affiliation is required');
      hasError = true;
    }
    
    profile.licenseId = license;
    profile.specialization = specialization;
    profile.hospitalAffiliation = hospital;
    
  } else if (role === 'physio') {
    const cert = document.getElementById('certificationLevel')?.value;
    const region = document.getElementById('assignedRegion')?.value;
    
    if (!validateRequired(cert)) {
      showError('certError', 'Certification level is required');
      hasError = true;
    }
    
    if (!validateRequired(region)) {
      showError('regionError', 'Assigned region is required');
      hasError = true;
    }
    
    profile.certificationLevel = cert;
    profile.assignedRegion = region;
  }
  
  if (hasError) return;
  
  // Call real API
  setButtonLoading('registerBtn', true);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        role,
        profile
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Redirect to login with success message
      alert('Account created successfully! Please log in.');
      window.location.href = './login.html';
    } else {
      showError('registerEmailError', data.message || 'Registration failed. Please try again.');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showError('registerEmailError', 'Connection error. Please ensure the server is running.');
  } finally {
    setButtonLoading('registerBtn', false);
  }
};

// ==================== PASSWORD TOGGLE ====================

const togglePasswordVisibility = (inputId) => {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
};

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Registration form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
    
    // Listen to role dropdown changes
    const roleSelect = document.getElementById('registerRole');
    if (roleSelect) {
      roleSelect.addEventListener('change', (e) => {
        const selectedRole = e.target.value;
        if (selectedRole) {
          switchRole(selectedRole);
        }
      });
      
      // Initialize with default selection (patient)
      switchRole(roleSelect.value || 'patient');
    }
  }
  
  // Password toggle buttons
  document.querySelectorAll('[data-toggle-password]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-toggle-password');
      togglePasswordVisibility(targetId);
    });
  });
  
  // Forgot password link
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Password reset functionality will be implemented in production.');
    });
  }
  
  // OAuth buttons (mock)
  document.querySelectorAll('.auth-oauth__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      alert('OAuth integration will be implemented in production.');
    });
  });
});
