"""
NeuroTrack Flask API Server
REST API endpoints for authentication and user management
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from typing import Dict, Any
import traceback
import os

from backend.auth import (
    register_user,
    login_user,
    AuthError,
    ValidationError
)
from backend.database import DatabaseError

app = Flask(__name__, static_folder='assets', template_folder='pages')

# Enable CORS for frontend integration
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:*", "http://127.0.0.1:*"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})


# ==================== ERROR HANDLERS ====================

@app.errorhandler(ValidationError)
def handle_validation_error(error):
    """Handle validation errors"""
    return jsonify({
        'success': False,
        'error': 'validation_error',
        'message': str(error)
    }), 400


@app.errorhandler(AuthError)
def handle_auth_error(error):
    """Handle authentication errors"""
    return jsonify({
        'success': False,
        'error': 'auth_error',
        'message': str(error)
    }), 401


@app.errorhandler(DatabaseError)
def handle_database_error(error):
    """Handle database errors"""
    return jsonify({
        'success': False,
        'error': 'database_error',
        'message': 'An error occurred while processing your request'
    }), 500


@app.errorhandler(500)
def handle_internal_error(error):
    """Handle unexpected errors"""
    return jsonify({
        'success': False,
        'error': 'internal_error',
        'message': 'An unexpected error occurred'
    }), 500


# ==================== STATIC FILE SERVING ====================

@app.route('/')
def index():
    """Redirect to login page"""
    return send_from_directory('pages', 'login.html')

@app.route('/pages/<path:filename>')
def serve_pages(filename):
    """Serve HTML pages"""
    return send_from_directory('pages', filename)

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve static assets (CSS, JS, images)"""
    return send_from_directory('assets', filename)


# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'service': 'NeuroTrack API',
        'version': '1.0'
    })


# ==================== AUTHENTICATION ENDPOINTS ====================

@app.route('/api/auth/register', methods=['POST'])
def api_register():
    """
    Register new user
    
    Request Body:
        {
            "email": "user@example.com",
            "password": "securepassword",
            "role": "patient|doctor|physio",
            "profile": {
                // Role-specific fields
            }
        }
    
    Response:
        {
            "success": true,
            "message": "Registration successful",
            "user": {
                "id": 1,
                "email": "user@example.com",
                "role": "patient",
                "profile": {...},
                "created_at": "2025-12-10T10:00:00Z"
            }
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            raise ValidationError("Request body is required")
        
        # Extract fields
        email = data.get('email', '').strip()
        password = data.get('password', '')
        role = data.get('role', '').strip().lower()
        profile = data.get('profile', {})
        
        # Register user
        user = register_user(email, password, role, profile)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'user': user
        }), 201
        
    except (ValidationError, AuthError) as e:
        # Let error handlers catch these
        raise
    except Exception as e:
        # Log unexpected errors
        print(f"Registration error: {traceback.format_exc()}")
        raise DatabaseError("Registration failed")


@app.route('/api/auth/login', methods=['POST'])
def api_login():
    """
    Authenticate user
    
    Request Body:
        {
            "identifier": "username or email",
            "password": "securepassword"
        }
    
    Response:
        {
            "success": true,
            "message": "Login successful",
            "user": {
                "id": 1,
                "email": "user@example.com",
                "role": "patient",
                "profile": {...},
                "last_login": "2025-12-10T10:00:00Z"
            }
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            raise ValidationError("Request body is required")
        
        # Extract credentials (support both email and identifier)
        identifier = data.get('identifier') or data.get('email', '')
        identifier = identifier.strip()
        password = data.get('password', '')
        
        # Authenticate
        user = login_user(identifier, password)
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': user
        }), 200
        
    except (ValidationError, AuthError) as e:
        # Let error handlers catch these
        raise
    except Exception as e:
        # Log unexpected errors
        print(f"Login error: {traceback.format_exc()}")
        raise DatabaseError("Login failed")


@app.route('/api/auth/check-email', methods=['POST'])
def api_check_email():
    """
    Check if email is already registered (for real-time validation)
    
    Request Body:
        {
            "email": "user@example.com"
        }
    
    Response:
        {
            "success": true,
            "available": true|false
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            raise ValidationError("Request body is required")
        
        email = data.get('email', '').strip()
        
        from backend.database import find_user_by_email
        user = find_user_by_email(email)
        
        return jsonify({
            'success': True,
            'available': user is None
        }), 200
        
    except Exception as e:
        print(f"Email check error: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': 'check_failed',
            'message': 'Could not check email availability'
        }), 500


# ==================== USER MANAGEMENT ====================

@app.route('/api/users/profile/<int:user_id>', methods=['GET'])
def api_get_profile(user_id):
    """
    Get user profile by ID
    
    Response:
        {
            "success": true,
            "user": {...}
        }
    """
    try:
        from backend.database import find_user_by_id
        
        user = find_user_by_id(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'not_found',
                'message': 'User not found'
            }), 404
        
        # Remove password_hash
        response_user = {k: v for k, v in user.items() if k != 'password_hash'}
        
        return jsonify({
            'success': True,
            'user': response_user
        }), 200
        
    except Exception as e:
        print(f"Profile fetch error: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': 'fetch_failed',
            'message': 'Could not retrieve profile'
        }), 500


# ==================== SERVER STARTUP ====================

if __name__ == '__main__':
    print("="*70)
    print("NeuroTrack API Server")
    print("="*70)
    print("Starting server on http://localhost:5000")
    print("\nWeb Interface:")
    print("  http://localhost:5000              - Login page")
    print("  http://localhost:5000/pages/login.html")
    print("  http://localhost:5000/pages/register.html")
    print("\nAPI Endpoints:")
    print("  GET  /api/health              - Health check")
    print("  POST /api/auth/register       - Register new user")
    print("  POST /api/auth/login          - Authenticate user")
    print("  POST /api/auth/check-email    - Check email availability")
    print("  GET  /api/users/profile/<id>  - Get user profile")
    print("="*70)
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
