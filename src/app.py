from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_login import LoginManager, login_required, current_user
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from apscheduler.schedulers.background import BackgroundScheduler
import structlog
import os
from datetime import datetime
import pytz

def create_app(testing=False):
    app = Flask(__name__)
    
    if testing:
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['SECRET_KEY'] = 'test-secret-key'
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
            'DATABASE_URL', 
            'sqlite:///work_records.db'
        )
        app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    from models import db
    db.init_app(app)
    
    migrate = Migrate(app, db)
    
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    
    @login_manager.user_loader
    def load_user(user_id):
        from models import User
        return User.query.get(user_id)
    
    logger = structlog.get_logger()
    
    from routes.auth import auth_bp
    from routes.dashboard import dashboard_bp
    from routes.batch import batch_bp
    from routes.api import api_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/')
    app.register_blueprint(batch_bp, url_prefix='/batch')
    app.register_blueprint(api_bp, url_prefix='/api/v1')
    
    @app.route('/')
    def index():
        if current_user.is_authenticated:
            return redirect(url_for('dashboard.dashboard'))
        return redirect(url_for('auth.login'))
    
    @app.errorhandler(404)
    def not_found(error):
        return render_template('errors/404.html'), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error("Internal server error", error=str(error))
        return render_template('errors/500.html'), 500
    
    if not testing:
        scheduler = BackgroundScheduler(timezone=pytz.timezone('Asia/Tokyo'))
        
        @scheduler.scheduled_job('cron', hour=2, minute=0, id='daily_batch')
        def daily_batch_job():
            from services.batch_service import BatchService
            batch_service = BatchService()
            batch_service.execute_daily_batch()
        
        scheduler.start()
    
    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        from models import db
        db.create_all()
    
    app.run(debug=True, host='0.0.0.0', port=5000)
