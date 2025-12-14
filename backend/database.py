"""
NeuroTrack Database Operations Module
Handles JSON file-based data persistence with thread-safe operations
"""

import json
import os
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Dict, List, Optional, Any

# Thread-safe file operations
_file_lock = Lock()

# Database paths
DATA_DIR = Path(__file__).parent.parent / "data"
USERS_DB = DATA_DIR / "users.json"


class DatabaseError(Exception):
    """Custom exception for database operations"""
    pass


def ensure_data_directory() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def initialize_users_db() -> None:
    ensure_data_directory()
    if not USERS_DB.exists():
        initial_data = {
            "users": [],
            "_meta": {
                "version": "1.0",
                "last_updated": datetime.utcnow().isoformat() + "Z",
                "total_users": 0
            }
        }
        write_users_db(initial_data)


def read_users_db() -> Dict[str, Any]:
    """
    Read users database with thread-safe operations
    
    Returns:
        Dictionary containing users array and metadata
    
    Raises:
        DatabaseError: If file is corrupted or unreadable
    """
    initialize_users_db()
    
    with _file_lock:
        try:
            with open(USERS_DB, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            # Validate structure
            if not isinstance(data, dict) or 'users' not in data:
                raise DatabaseError("Invalid database structure")
                
            return data
            
        except json.JSONDecodeError as e:
            raise DatabaseError(f"Database file is corrupted: {str(e)}")
        except Exception as e:
            raise DatabaseError(f"Failed to read database: {str(e)}")


def write_users_db(data: Dict[str, Any]) -> None:
    """
    Write to users database with thread-safe operations and atomic writes
    
    Args:
        data: Dictionary containing users array and metadata
    
    Raises:
        DatabaseError: If write operation fails
    """
    ensure_data_directory()
    
    with _file_lock:
        try:
            # Update metadata
            if '_meta' not in data:
                data['_meta'] = {}
            
            data['_meta']['last_updated'] = datetime.utcnow().isoformat() + "Z"
            data['_meta']['total_users'] = len(data.get('users', []))
            
            # Atomic write: write to temp file first, then rename
            temp_file = USERS_DB.with_suffix('.tmp')
            
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            # Atomic rename
            temp_file.replace(USERS_DB)
            
        except Exception as e:
            # Clean up temp file if it exists
            if temp_file.exists():
                temp_file.unlink()
            raise DatabaseError(f"Failed to write database: {str(e)}")


def get_all_users() -> List[Dict[str, Any]]:
    """
    Retrieve all users from database
    
    Returns:
        List of user dictionaries
    """
    data = read_users_db()
    return data.get('users', [])


def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Find user by email address (case-insensitive)
    
    Args:
        email: User's email address
    
    Returns:
        User dictionary if found, None otherwise
    """
    users = get_all_users()
    email_lower = email.lower()
    
    for user in users:
        if user.get('email', '').lower() == email_lower:
            return user
    
    return None


def find_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """
    Find user by username (case-insensitive)
    
    Args:
        username: User's username
    
    Returns:
        User dictionary if found, None otherwise
    """
    users = get_all_users()
    username_lower = username.lower()
    
    for user in users:
        if user.get('username', '').lower() == username_lower:
            return user
    
    return None


def find_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """
    Find user by ID
    
    Args:
        user_id: User's unique identifier
    
    Returns:
        User dictionary if found, None otherwise
    """
    users = get_all_users()
    
    for user in users:
        if user.get('id') == user_id:
            return user
    
    return None


def get_next_user_id() -> int:
    """
    Generate next available user ID
    
    Returns:
        Next sequential user ID
    """
    users = get_all_users()
    
    if not users:
        return 1
    
    max_id = max(user.get('id', 0) for user in users)
    return max_id + 1


def add_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Add new user to database
    
    Args:
        user_data: User information dictionary
    
    Returns:
        Created user dictionary with assigned ID
    
    Raises:
        DatabaseError: If user already exists or write fails
    """
    # Check for duplicate email
    if find_user_by_email(user_data.get('email', '')):
        raise DatabaseError("Email already registered")
    
    # Read current data
    data = read_users_db()
    users = data.get('users', [])
    
    # Assign ID and timestamp
    user_data['id'] = get_next_user_id()
    user_data['created_at'] = datetime.utcnow().isoformat() + "Z"
    user_data['last_login'] = None
    
    # Add user
    users.append(user_data)
    data['users'] = users
    
    # Write back to database
    write_users_db(data)
    
    return user_data


def update_user(user_id: int, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Update existing user data
    
    Args:
        user_id: User's unique identifier
        updates: Dictionary of fields to update
    
    Returns:
        Updated user dictionary if found, None otherwise
    
    Raises:
        DatabaseError: If write fails
    """
    data = read_users_db()
    users = data.get('users', [])
    
    for i, user in enumerate(users):
        if user.get('id') == user_id:
            # Merge updates
            users[i] = {**user, **updates}
            data['users'] = users
            
            # Write back to database
            write_users_db(data)
            
            return users[i]
    
    return None


def update_last_login(user_id: int) -> None:
    """
    Update user's last login timestamp
    
    Args:
        user_id: User's unique identifier
    """
    update_user(user_id, {
        'last_login': datetime.utcnow().isoformat() + "Z"
    })


def delete_user(user_id: int) -> bool:
    """
    Delete user from database
    
    Args:
        user_id: User's unique identifier
    
    Returns:
        True if user was deleted, False if not found
    
    Raises:
        DatabaseError: If write fails
    """
    data = read_users_db()
    users = data.get('users', [])
    
    original_count = len(users)
    users = [u for u in users if u.get('id') != user_id]
    
    if len(users) < original_count:
        data['users'] = users
        write_users_db(data)
        return True
    
    return False


def get_users_by_role(role: str) -> List[Dict[str, Any]]:
    """
    Get all users with specific role
    
    Args:
        role: User role (patient, doctor, physio)
    
    Returns:
        List of user dictionaries
    """
    users = get_all_users()
    return [u for u in users if u.get('role') == role]


# Initialize database on module import
initialize_users_db()
