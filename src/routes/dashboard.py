from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from models import BatchHistory, WorkRecord, db
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import structlog

dashboard_bp = Blueprint('dashboard', __name__)
logger = structlog.get_logger()

@dashboard_bp.route('/dashboard')
@login_required
def dashboard():
    stats = get_dashboard_stats()
    recent_batches = get_recent_batches()
    return render_template('dashboard/index.html', 
                         stats=stats, 
                         recent_batches=recent_batches)

@dashboard_bp.route('/api/dashboard/stats')
@login_required
def dashboard_stats():
    period = request.args.get('period', '7d')
    
    if period == '7d':
        start_date = datetime.utcnow() - timedelta(days=7)
    elif period == '30d':
        start_date = datetime.utcnow() - timedelta(days=30)
    else:
        start_date = datetime.utcnow() - timedelta(days=7)
    
    stats = get_dashboard_stats(start_date)
    daily_stats = get_daily_stats(start_date)
    
    return jsonify({
        'success': True,
        'data': {
            'summary': stats,
            'daily_stats': daily_stats
        }
    })

def get_dashboard_stats(start_date=None):
    if start_date is None:
        start_date = datetime.utcnow() - timedelta(days=7)
    
    query = BatchHistory.query.filter(BatchHistory.created_at >= start_date)
    
    total_batches = query.count()
    successful_batches = query.filter(BatchHistory.status == 'SUCCESS').count()
    failed_batches = query.filter(BatchHistory.status == 'ERROR').count()
    
    total_records = db.session.query(func.sum(BatchHistory.total_records))\
        .filter(BatchHistory.created_at >= start_date).scalar() or 0
    
    avg_processing_time = db.session.query(func.avg(BatchHistory.processing_time))\
        .filter(BatchHistory.created_at >= start_date,
                BatchHistory.status == 'SUCCESS').scalar() or 0
    
    success_rate = (successful_batches / total_batches * 100) if total_batches > 0 else 0
    
    return {
        'total_batches': total_batches,
        'successful_batches': successful_batches,
        'failed_batches': failed_batches,
        'total_records_processed': int(total_records),
        'success_rate': round(success_rate, 1),
        'average_processing_time': round(avg_processing_time, 1)
    }

def get_daily_stats(start_date):
    daily_data = db.session.query(
        func.date(BatchHistory.created_at).label('date'),
        func.count(BatchHistory.id).label('batch_count'),
        func.sum(func.case([(BatchHistory.status == 'SUCCESS', 1)], else_=0)).label('success_count'),
        func.sum(func.case([(BatchHistory.status == 'ERROR', 1)], else_=0)).label('error_count'),
        func.sum(BatchHistory.total_records).label('total_records'),
        func.avg(BatchHistory.processing_time).label('average_time')
    ).filter(BatchHistory.created_at >= start_date)\
     .group_by(func.date(BatchHistory.created_at))\
     .order_by(func.date(BatchHistory.created_at)).all()
    
    return [{
        'date': row.date.strftime('%Y-%m-%d'),
        'batch_count': row.batch_count,
        'success_count': row.success_count or 0,
        'error_count': row.error_count or 0,
        'total_records': row.total_records or 0,
        'average_time': round(row.average_time or 0, 1)
    } for row in daily_data]

def get_recent_batches(limit=10):
    return BatchHistory.query\
        .order_by(desc(BatchHistory.created_at))\
        .limit(limit).all()
