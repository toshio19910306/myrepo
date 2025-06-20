from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models import User, db
import structlog

auth_bp = Blueprint('auth', __name__)
logger = structlog.get_logger()

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.dashboard'))
    
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            azure_token = data.get('azure_token')
        else:
            azure_token = request.form.get('azure_token')
        
        if not azure_token:
            if request.is_json:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'MISSING_TOKEN',
                        'message': 'Azure ADトークンが必要です'
                    }
                }), 400
            flash('Azure ADトークンが必要です', 'error')
            return render_template('auth/login.html')
        
        user_info = validate_azure_token(azure_token)
        if not user_info:
            if request.is_json:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'INVALID_TOKEN',
                        'message': '無効なトークンです'
                    }
                }), 401
            flash('無効なトークンです', 'error')
            return render_template('auth/login.html')
        
        user = User.query.filter_by(email=user_info['email']).first()
        if not user:
            user = User(
                id=user_info['id'],
                name=user_info['name'],
                email=user_info['email'],
                roles=user_info.get('roles', 'viewer')
            )
            db.session.add(user)
            db.session.commit()
        
        login_user(user)
        logger.info("ユーザーログイン", user_id=user.id, email=user.email)
        
        if request.is_json:
            return jsonify({
                'success': True,
                'data': {
                    'user': {
                        'id': user.id,
                        'name': user.name,
                        'email': user.email,
                        'roles': user.roles.split(',') if user.roles else []
                    },
                    'session_id': session.get('_id'),
                    'expires_at': None
                }
            })
        
        next_page = request.args.get('next')
        return redirect(next_page) if next_page else redirect(url_for('dashboard.dashboard'))
    
    return render_template('auth/login.html')

@auth_bp.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    logger.info("ユーザーログアウト", user_id=current_user.id)
    logout_user()
    flash('ログアウトしました', 'info')
    return redirect(url_for('auth.login'))

def validate_azure_token(token):
    if token == 'mock_token':
        return {
            'id': 'EMP001',
            'name': '山田太郎',
            'email': 'yamada@example.com',
            'roles': 'admin,operator'
        }
    return None
