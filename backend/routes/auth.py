# routes/auth.py
import re
import jwt
import os
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models.user import User

auth_bp = Blueprint('auth', __name__)

# ================= BASIC USER REGISTRATION =================
@auth_bp.route('/register', methods=['POST'])
def register_user():
    """
    Register a basic user account (no school yet)
    """
    data = request.get_json()
    
    # Required fields
    required = ['email', 'password', 'first_name', 'last_name']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Normalize email (lowercase and strip spaces)
    email = data['email'].lower().strip()
    
    # Validate email format
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Check if email exists
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    try:
        # Create BASIC user
        user = User(
            email=email,
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone'),
            role='user',
            status='active'
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user) # Ensure object is synced with DB
        
        return jsonify({
            'message': 'User registered successfully.',
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ================= LOGIN =================
@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login existing user with JWT generation synchronized with Gateway
    """
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    
    # Normalize lookup email
    email = data['email'].lower().strip()
    user = User.query.filter_by(email=email).first()
    
    # Check credentials
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if user.status != 'active':
        return jsonify({'error': 'Account is not active.'}), 403

    # ================= JWT GENERATION =================
    # CRITICAL: Match the secret key used by the Node.js Gateway
    # We check JWT_SECRET (Gateway standard) then SECRET_KEY (Flask standard)
    secret_key = os.environ.get('JWT_SECRET') or current_app.config.get('SECRET_KEY')
    
    if not secret_key:
        # Hardcoded fallback to match your manual setup if env fails
        secret_key = 'echo_platform_secret_2026' 
        print("⚠️ WARNING: Using fallback secret key for JWT.")

    token_payload = {
        'user_id': str(user.id),
        'email': user.email,
        'role': user.role,
        'school_id': str(user.school_id) if user.school_id else None,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    
    try:
        # Generate token
        token = jwt.encode(token_payload, secret_key, algorithm='HS256')
        
        # Handle PyJWT version differences (ensure string output)
        if isinstance(token, bytes):
            token = token.decode('utf-8')
            
    except Exception as e:
        print(f"❌ JWT Error: {e}")
        return jsonify({'error': 'Authentication service error'}), 500
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'token': token
    })

# ================= TEST ENDPOINT =================
@auth_bp.route('/test', methods=['GET'])
def test_auth():
    return jsonify({'status': 'online', 'module': 'auth_v1_fixed'})