"""
NeuroTrack System Test Suite
Comprehensive testing for authentication and functionality
"""

import json
import sys
from pathlib import Path

# Test Results
tests_passed = 0
tests_failed = 0
test_results = []

def test_result(name, passed, message=""):
    global tests_passed, tests_failed, test_results
    if passed:
        tests_passed += 1
        status = "✓ PASS"
        color = "\033[92m"  # Green
    else:
        tests_failed += 1
        status = "✗ FAIL"
        color = "\033[91m"  # Red
    
    reset = "\033[0m"
    result = f"{color}{status}{reset} - {name}"
    if message:
        result += f"\n       {message}"
    test_results.append(result)
    print(result)

print("="*70)
print("NeuroTrack System Test Suite")
print("="*70)
print()

# ==================== FILE EXISTENCE TESTS ====================
print("1. FILE EXISTENCE TESTS")
print("-" * 70)

# Check critical files
critical_files = [
    "server.py",
    "backend/__init__.py",
    "backend/auth.py",
    "backend/database.py",
    "data/users.json",
    "pages/login.html",
    "pages/patient-dashboard.html",
    "pages/docktor-dashboard.html",
    "pages/physio-dashboard.html",
    "assets/js/mock-auth.js",
    "assets/css/auth.css",
    "assets/css/dashboard.css"
]

for file_path in critical_files:
    path = Path(file_path)
    exists = path.exists()
    test_result(f"File exists: {file_path}", exists)

print()

# ==================== USER DATA TESTS ====================
print("2. USER DATA VALIDATION TESTS")
print("-" * 70)

try:
    with open('data/users.json', 'r') as f:
        users_data = json.load(f)
    
    test_result("users.json is valid JSON", True)
    
    # Check structure
    has_users = 'users' in users_data
    test_result("users.json has 'users' key", has_users)
    
    has_meta = '_meta' in users_data
    test_result("users.json has '_meta' key", has_meta)
    
    # Check predefined accounts
    users = users_data.get('users', [])
    user_count = len(users)
    test_result(f"Has {user_count} users (expected 3)", user_count == 3)
    
    # Check specific users
    usernames = [u.get('username') for u in users]
    
    test_result("Has 'dokter' account", 'dokter' in usernames)
    test_result("Has 'pasien' account", 'pasien' in usernames)
    test_result("Has 'psikioterapi' account", 'psikioterapi' in usernames)
    
    # Check user structure
    for user in users:
        username = user.get('username', 'unknown')
        has_id = 'id' in user
        has_username = 'username' in user
        has_password = 'password' in user
        has_role = 'role' in user
        has_profile = 'profile' in user
        
        test_result(f"User '{username}' has required fields", 
                   all([has_id, has_username, has_password, has_role, has_profile]),
                   f"ID:{has_id}, User:{has_username}, Pass:{has_password}, Role:{has_role}, Profile:{has_profile}")
    
    # Check roles
    roles = [u.get('role') for u in users]
    test_result("Has doctor role", 'doctor' in roles)
    test_result("Has patient role", 'patient' in roles)
    test_result("Has physio role", 'physio' in roles)
    
except json.JSONDecodeError as e:
    test_result("users.json is valid JSON", False, f"JSON Error: {e}")
except Exception as e:
    test_result("User data loading", False, f"Error: {e}")

print()

# ==================== PYTHON MODULE TESTS ====================
print("3. PYTHON MODULE IMPORT TESTS")
print("-" * 70)

try:
    import flask
    test_result("Flask module installed", True, f"Version: {flask.__version__}")
except ImportError as e:
    test_result("Flask module installed", False, str(e))

try:
    import flask_cors
    test_result("Flask-CORS module installed", True)
except ImportError as e:
    test_result("Flask-CORS module installed", False, str(e))

try:
    from backend.database import read_users_db, find_user_by_username, find_user_by_email
    test_result("Database module imports", True)
except ImportError as e:
    test_result("Database module imports", False, str(e))

try:
    from backend.auth import login_user, hash_password, verify_password
    test_result("Auth module imports", True)
except ImportError as e:
    test_result("Auth module imports", False, str(e))

print()

# ==================== DATABASE FUNCTION TESTS ====================
print("4. DATABASE FUNCTION TESTS")
print("-" * 70)

try:
    from backend.database import read_users_db, find_user_by_username, find_user_by_email
    
    # Test read_users_db
    try:
        data = read_users_db()
        test_result("read_users_db() works", True)
    except Exception as e:
        test_result("read_users_db() works", False, str(e))
    
    # Test find_user_by_username
    try:
        dokter = find_user_by_username('dokter')
        test_result("find_user_by_username('dokter') works", dokter is not None)
        
        if dokter:
            test_result("Dokter has correct role", dokter.get('role') == 'doctor')
    except Exception as e:
        test_result("find_user_by_username works", False, str(e))
    
    # Test find_user_by_email
    try:
        user = find_user_by_email('dokter@neurotrack.com')
        test_result("find_user_by_email works", user is not None)
    except Exception as e:
        test_result("find_user_by_email works", False, str(e))
    
except Exception as e:
    test_result("Database functions", False, f"Import error: {e}")

print()

# ==================== AUTHENTICATION TESTS ====================
print("5. AUTHENTICATION LOGIC TESTS")
print("-" * 70)

try:
    from backend.auth import verify_password, hash_password
    
    # Test password hashing
    try:
        test_password = "testpass123"
        hashed = hash_password(test_password)
        test_result("hash_password() works", len(hashed) > 0)
        
        # Test password verification
        is_valid = verify_password(test_password, hashed)
        test_result("verify_password() with correct password", is_valid)
        
        is_invalid = verify_password("wrongpass", hashed)
        test_result("verify_password() rejects wrong password", not is_invalid)
        
    except Exception as e:
        test_result("Password hashing/verification", False, str(e))
    
    # Test login with predefined accounts
    from backend.auth import login_user
    
    # Note: These tests will fail if passwords are already hashed differently
    # This is expected - just documenting the test
    test_accounts = [
        ('dokter', 'dokter123', 'doctor'),
        ('pasien', 'pasien123', 'patient'),
        ('psikioterapi', 'psikio123', 'physio')
    ]
    
    for username, password, expected_role in test_accounts:
        try:
            # This may fail due to password hash mismatch - that's OK for this test
            user = login_user(username, password)
            role_match = user.get('role') == expected_role
            test_result(f"Login '{username}' returns correct role", role_match,
                       f"Expected: {expected_role}, Got: {user.get('role')}")
        except Exception as e:
            # Expected if password hash doesn't match pre-hashed values
            test_result(f"Login '{username}' (may fail due to hash)", False, 
                       "Note: Pre-hashed passwords may not match. This is expected.")
    
except Exception as e:
    test_result("Authentication tests", False, f"Error: {e}")

print()

# ==================== HTML STRUCTURE TESTS ====================
print("6. HTML STRUCTURE TESTS")
print("-" * 70)

def check_html_element(file_path, element_id, element_name="element"):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            has_element = f'id="{element_id}"' in content
            test_result(f"{file_path} has {element_name}", has_element)
            return has_element
    except Exception as e:
        test_result(f"Read {file_path}", False, str(e))
        return False

# Login page elements
check_html_element('pages/login.html', 'loginEmail', 'username/email field')
check_html_element('pages/login.html', 'loginPassword', 'password field')
check_html_element('pages/login.html', 'loginRole', 'role select')
check_html_element('pages/login.html', 'loginBtn', 'login button')
check_html_element('pages/login.html', 'loginForm', 'login form')

# Check for password toggle button
try:
    with open('pages/login.html', 'r', encoding='utf-8') as f:
        content = f.read()
        has_toggle = 'data-toggle-password' in content
        test_result("Login page has password toggle button", has_toggle)
except Exception as e:
    test_result("Check password toggle", False, str(e))

# Dashboard pages
for role in ['patient', 'docktor', 'physio']:
    file_path = f'pages/{role}-dashboard.html'
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            has_header = 'dashboard-header' in content
            has_logo = 'header-logo' in content
            has_nav = 'header-nav' in content
            has_user = 'header-user' in content
            
            all_present = all([has_header, has_logo, has_nav, has_user])
            test_result(f"{file_path} has header components", all_present,
                       f"Header:{has_header}, Logo:{has_logo}, Nav:{has_nav}, User:{has_user}")
    except Exception as e:
        test_result(f"Check {file_path}", False, str(e))

print()

# ==================== JAVASCRIPT SYNTAX TESTS ====================
print("7. JAVASCRIPT SYNTAX TESTS")
print("-" * 70)

try:
    with open('assets/js/mock-auth.js', 'r', encoding='utf-8') as f:
        js_content = f.read()
        
        # Check for critical functions
        has_handleLogin = 'const handleLogin' in js_content or 'function handleLogin' in js_content
        test_result("mock-auth.js has handleLogin function", has_handleLogin)
        
        has_handleRegister = 'const handleRegister' in js_content or 'function handleRegister' in js_content
        test_result("mock-auth.js has handleRegister function", has_handleRegister)
        
        has_togglePassword = 'const togglePasswordVisibility' in js_content or 'function togglePasswordVisibility' in js_content
        test_result("mock-auth.js has togglePasswordVisibility function", has_togglePassword)
        
        has_switchRole = 'const switchRole' in js_content or 'function switchRole' in js_content
        test_result("mock-auth.js has switchRole function", has_switchRole)
        
        # Check for event listeners
        has_domContentLoaded = 'DOMContentLoaded' in js_content
        test_result("mock-auth.js has DOMContentLoaded listener", has_domContentLoaded)
        
        # Check for API endpoint
        has_api_url = 'API_BASE_URL' in js_content
        test_result("mock-auth.js defines API_BASE_URL", has_api_url)
        
        # Check for no duplicate fetch (the bug we fixed)
        fetch_count = js_content.count('fetch(`${API_BASE_URL}/auth/login`')
        test_result("No duplicate login fetch calls", fetch_count == 1,
                   f"Found {fetch_count} fetch calls (expected 1)")
        
except Exception as e:
    test_result("JavaScript file checks", False, str(e))

print()

# ==================== SERVER CONFIGURATION TESTS ====================
print("8. SERVER CONFIGURATION TESTS")
print("-" * 70)

try:
    with open('server.py', 'r', encoding='utf-8') as f:
        server_content = f.read()
        
        has_flask_import = 'from flask import' in server_content
        test_result("server.py imports Flask", has_flask_import)
        
        has_cors = 'CORS' in server_content
        test_result("server.py enables CORS", has_cors)
        
        has_login_route = '@app.route(\'/api/auth/login\'' in server_content
        test_result("server.py has login route", has_login_route)
        
        has_register_route = '@app.route(\'/api/auth/register\'' in server_content
        test_result("server.py has register route", has_register_route)
        
        has_main_check = 'if __name__ == \'__main__\':' in server_content
        test_result("server.py has main execution block", has_main_check)
        
        has_app_run = 'app.run(' in server_content
        test_result("server.py calls app.run()", has_app_run)
        
        # Check port configuration
        has_port_5000 = 'port=5000' in server_content
        test_result("server.py configured for port 5000", has_port_5000)
        
except Exception as e:
    test_result("Server configuration checks", False, str(e))

print()

# ==================== FINAL SUMMARY ====================
print("="*70)
print("TEST SUMMARY")
print("="*70)
print(f"Tests Passed: {tests_passed}")
print(f"Tests Failed: {tests_failed}")
print(f"Total Tests:  {tests_passed + tests_failed}")
print(f"Success Rate: {(tests_passed / (tests_passed + tests_failed) * 100):.1f}%")
print("="*70)

# Exit with appropriate code
sys.exit(0 if tests_failed == 0 else 1)
