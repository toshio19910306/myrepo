from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import BatchHistory, WorkRecord, db
from services.batch_service import BatchService
from functools import wraps
from datetime import datetime
import structlog

api_bp = Blueprint('api', __name__)
logger = structlog.get_logger()

def require_role(role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.has_role(role):
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'INSUFFICIENT_PERMISSIONS',
                        'message': '権限が不足しています'
                    }
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@api_bp.route('/batch/execute', methods=['POST'])
@login_required
@require_role('operator')
def execute_batch():
    data = request.get_json()
    
    if not data or not data.get('file_name'):
        return jsonify({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'ファイル名が必要です'
            }
        }), 422
    
    try:
        batch_service = BatchService()
        batch_id = batch_service.start_batch(data['file_name'], current_user.id)
        
        logger.info("API経由バッチ処理開始", batch_id=batch_id, user_id=current_user.id)
        
        return jsonify({
            'success': True,
            'data': {
                'batch_id': batch_id,
                'status': 'RUNNING',
                'file_name': data['file_name'],
                'started_at': BatchHistory.query.get(batch_id).started_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        logger.error("API経由バッチ処理エラー", error=str(e), user_id=current_user.id)
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': 'サーバー内部エラーが発生しました'
            }
        }), 500

@api_bp.route('/batch/<int:batch_id>/status', methods=['GET'])
@login_required
def get_batch_status(batch_id):
    batch = BatchHistory.query.get_or_404(batch_id)
    
    return jsonify({
        'success': True,
        'data': {
            'batch_id': batch.id,
            'status': batch.status.value,
            'progress': {
                'total_records': batch.total_records,
                'processed_records': batch.success_records + batch.error_records,
                'success_records': batch.success_records,
                'error_records': batch.error_records,
                'progress_percentage': batch.progress_percentage
            },
            'started_at': batch.started_at.isoformat() if batch.started_at else None,
            'completed_at': batch.completed_at.isoformat() if batch.completed_at else None,
            'processing_time': batch.processing_time,
            'error_message': batch.error_message
        }
    })

@api_bp.route('/batch/<int:batch_id>/stop', methods=['POST'])
@login_required
@require_role('operator')
def stop_batch(batch_id):
    batch = BatchHistory.query.get_or_404(batch_id)
    
    if batch.status != 'RUNNING':
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_STATUS',
                'message': '実行中のバッチではありません'
            }
        }), 400
    
    try:
        batch_service = BatchService()
        batch_service.stop_batch(batch_id)
        
        logger.info("バッチ処理停止", batch_id=batch_id, user_id=current_user.id)
        
        return jsonify({
            'success': True,
            'data': {
                'batch_id': batch_id,
                'status': 'STOPPED'
            }
        })
        
    except Exception as e:
        logger.error("バッチ処理停止エラー", error=str(e), batch_id=batch_id, user_id=current_user.id)
        return jsonify({
            'success': False,
            'error': {
                'code': 'STOP_ERROR',
                'message': 'バッチ処理の停止に失敗しました'
            }
        }), 500

@api_bp.route('/history', methods=['GET'])
@login_required
def get_batch_history():
    page = request.args.get('page', 1, type=int)
    limit = min(request.args.get('limit', 20, type=int), 100)
    status = request.args.get('status')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    query = BatchHistory.query
    
    if status:
        query = query.filter(BatchHistory.status == status)
    
    if date_from:
        query = query.filter(BatchHistory.created_at >= date_from)
    
    if date_to:
        query = query.filter(BatchHistory.created_at <= date_to)
    
    pagination = query.order_by(BatchHistory.created_at.desc())\
                     .paginate(page=page, per_page=limit, error_out=False)
    
    items = [{
        'batch_id': batch.id,
        'file_name': batch.file_name,
        'status': batch.status.value,
        'started_at': batch.started_at.isoformat() if batch.started_at else None,
        'completed_at': batch.completed_at.isoformat() if batch.completed_at else None,
        'total_records': batch.total_records,
        'success_records': batch.success_records,
        'error_records': batch.error_records,
        'processing_time': batch.processing_time
    } for batch in pagination.items]
    
    return jsonify({
        'success': True,
        'data': {
            'items': items,
            'pagination': {
                'page': page,
                'limit': limit,
                'total_items': pagination.total,
                'total_pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }
    })

@api_bp.route('/health', methods=['GET'])
def health_check():
    try:
        db.session.execute('SELECT 1')
        db_status = 'healthy'
    except Exception:
        db_status = 'unhealthy'
    
    return jsonify({
        'success': True,
        'data': {
            'status': 'healthy' if db_status == 'healthy' else 'unhealthy',
            'database': db_status,
            'timestamp': datetime.utcnow().isoformat()
        }
    })
