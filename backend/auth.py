"""
NeuroTrack Authentication Module
Handles user registration, login, and password hashing
Security: Uses bcrypt for password hashing (production-ready)
"""

import re
from typing import Dict, Optional, Tuple
from datetime import datetime

try:
    import bcrypt
    BCRYPT_AVAILABLE = True
except ImportError:
    BCRYPT_AVAILABLE = False
    # WARNING: In production, bcrypt MUST be installed
    # For prototype: pip install bcrypt
    import hashlib

from .database import (
    find_user_by_email,
    find_user_by_username,
    add_user,
    update_last_login,
    DatabaseError
)


class AuthError(Exception):
    """Custom exception for authentication errors"""
    pass


class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass


# ==================== PASSWORD HASHING ====================

def hash_password(password: str) -> str:
    """
    Hash password using bcrypt (production-ready) or SHA256 (prototype fallback)
    
    Args:
        password: Plain text password
    
    Returns:
        Hashed password string
    """
    if BCRYPT_AVAILABLE:
        # Production: bcrypt with salt rounds = 12
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    else:
        # PROTOTYPE ONLY: Basic SHA256 hashing (NOT SECURE FOR PRODUCTION)
        # TODO: Install bcrypt before deploying to production
        return hashlib.sha256(password.encode('utf-8')).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    """
    Verify password against stored hash
    
    Args:
        password: Plain text password to verify
        password_hash: Stored password hash
    
    Returns:
        True if password matches, False otherwise
    """
    if BCRYPT_AVAILABLE:
        try:
            return bcrypt.checkpw(
                password.encode('utf-8'),
                password_hash.encode('utf-8')
            )
        except Exception:
            return False
    else:
        # PROTOTYPE ONLY: Basic comparison
        return hashlib.sha256(password.encode('utf-8')).hexdigest() == password_hash


# ==================== VALIDATION ====================

def validate_email(email: str) -> bool:
    """
    Validate email format
    
    Args:
        email: Email address to validate
    
    Returns:
        True if valid email format
    """
    if not email or len(email) > 254:
        return False
    
    # RFC 5322 simplified pattern
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password(password: str) -> Tuple[bool, Optional[str]]:
    """
    Validate password strength
    
    Args:
        password: Password to validate
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not password:
        return False, "Password is required"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    
    if len(password) > 128:
        return False, "Password is too long (max 128 characters)"
    
    # Optional: Enforce complexity (uncomment for production)
    # if not re.search(r'[A-Z]', password):
    #     return False, "Password must contain at least one uppercase letter"
    # if not re.search(r'[a-z]', password):
    #     return False, "Password must contain at least one lowercase letter"
    # if not re.search(r'\d', password):
    #     return False, "Password must contain at least one digit"
    
    return True, None


def validate_role(role: str) -> bool:
    """
    Validate user role
    
    Args:
        role: User role to validate
    
    Returns:
        True if valid role
    """
    return role in ['patient', 'doctor', 'physio']


def validate_required_field(value: Optional[str], field_name: str) -> None:
    """
    Validate required field is present and non-empty
    
    Args:
        value: Field value to validate
        field_name: Name of the field (for error message)
    
    Raises:
        ValidationError: If field is missing or empty
    """
    if not value or not value.strip():
        raise ValidationError(f"{field_name} is required")


def validate_patient_profile(profile: Dict) -> None:
    """
    Validate patient-specific profile fields
    
    Args:
        profile: Patient profile dictionary
    
    Raises:
        ValidationError: If validation fails
    """
    validate_required_field(profile.get('fullName'), 'Full name')
    validate_required_field(profile.get('dateOfBirth'), 'Date of birth')
    validate_required_field(profile.get('medicalRecordNumber'), 'Medical record number')
    
    # Validate date format
    try:
        datetime.fromisoformat(profile['dateOfBirth'])
    except (ValueError, KeyError):
        raise ValidationError("Invalid date of birth format (use YYYY-MM-DD)")


def validate_doctor_profile(profile: Dict) -> None:
    """
    Validate doctor-specific profile fields
    
    Args:
        profile: Doctor profile dictionary
    
    Raises:
        ValidationError: If validation fails
    """
    validate_required_field(profile.get('fullName'), 'Full name')
    validate_required_field(profile.get('licenseId'), 'Medical license ID')
    validate_required_field(profile.get('specialization'), 'Specialization')
    validate_required_field(profile.get('hospitalAffiliation'), 'Hospital affiliation')


def validate_physio_profile(profile: Dict) -> None:
    """
    Validate physiotherapist-specific profile fields
    
    Args:
        profile: Physiotherapist profile dictionary
    
    Raises:
        ValidationError: If validation fails
    """
    validate_required_field(profile.get('fullName'), 'Full name')
    validate_required_field(profile.get('certificationLevel'), 'Certification level')
    validate_required_field(profile.get('assignedRegion'), 'Assigned region')


# ==================== AUTHENTICATION LOGIC ====================

def register_user(
    email: str,
    password: str,
    role: str,
    profile: Dict
) -> Dict:
    """
    Register new user with role-based profile validation
    
    Args:
        email: User's email address
        password: Plain text password
        role: User role (patient, doctor, physio)
        profile: Role-specific profile data
    
    Returns:
        Created user dictionary (without password_hash)
    
    Raises:
        ValidationError: If validation fails
        AuthError: If registration fails (duplicate email, etc.)
    """
    # Validate email
    if not validate_email(email):
        raise ValidationError("Invalid email address format")
    
    # Check if email already exists
    if find_user_by_email(email):
        raise AuthError("Email address is already registered")
    
    # Validate password
    is_valid, error_msg = validate_password(password)
    if not is_valid:
        raise ValidationError(error_msg)
    
    # Validate role
    if not validate_role(role):
        raise ValidationError(f"Invalid role. Must be one of: patient, doctor, physio")
    
    # Validate role-specific profile
    try:
        if role == 'patient':
            validate_patient_profile(profile)
        elif role == 'doctor':
            validate_doctor_profile(profile)
        elif role == 'physio':
            validate_physio_profile(profile)
    except ValidationError as e:
        raise ValidationError(f"Profile validation failed: {str(e)}")
    
    # Hash password
    password_hash = hash_password(password)
    
    # Create user object
    user_data = {
        'email': email.lower(),  # Store lowercase for consistency
        'password_hash': password_hash,
        'role': role,
        'profile': profile
    }
    
    try:
        # Add to database
        created_user = add_user(user_data)
        
        # Remove password_hash from response
        response_user = {k: v for k, v in created_user.items() if k != 'password_hash'}
        
        return response_user
        
    except DatabaseError as e:
        raise AuthError(f"Registration failed: {str(e)}")


def login_user(identifier: str, password: str) -> Dict:
    """
    Authenticate user and return user data with role
    Supports login with either email or username
    
    Args:
        identifier: User's email address or username
        password: Plain text password
    
    Returns:
        User dictionary with role (without password_hash)
    
    Raises:
        AuthError: If authentication fails
    """
    # Validate input
    if not identifier or not password:
        raise AuthError("Email/username and password are required")
    
    # Try to find user by email first, then by username
    user = find_user_by_email(identifier)
    if not user:
        user = find_user_by_username(identifier)
    
    if not user:
        # Don't reveal whether email/username exists (security best practice)
        raise AuthError("Invalid credentials")
    
    # Verify password
    stored_password = user.get('password_hash') or user.get('password', '')
    if not verify_password(password, stored_password):
        raise AuthError("Invalid credentials")
    
    # Update last login timestamp
    try:
        update_last_login(user['id'])
        user['last_login'] = datetime.utcnow().isoformat() + "Z"
    except Exception:
        # Don't fail login if timestamp update fails
        pass
    
    # Remove password_hash from response
    response_user = {k: v for k, v in user.items() if k not in ['password_hash', 'password']}
    
    return response_user


def get_user_role(user_id: int) -> Optional[str]:
    """
    Get user role by ID
    
    Args:
        user_id: User's unique identifier
    
    Returns:
        User role string or None if not found
    """
    from .database import find_user_by_id
    
    user = find_user_by_id(user_id)
    return user.get('role') if user else None


# ==================== SECURITY WARNINGS ====================

if not BCRYPT_AVAILABLE:
    import warnings
    warnings.warn(
        "\n" + "="*70 + "\n"
        "WARNING: bcrypt is not installed. Using SHA256 for password hashing.\n"
        "This is NOT SECURE for production use.\n"
        "Install bcrypt: pip install bcrypt\n"
        + "="*70,
        UserWarning
    )
