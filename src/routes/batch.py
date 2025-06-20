from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for
from flask_login import login_required, current_user
from models import BatchHistory, db
from services.batch_service import BatchService
from werkzeug.utils import secure_filename
import os
import structlog

batch_bp = Blueprint('batch', __name__)
logger = structlog.get_logger()

@batch_bp.route('/')
@login_required
def batch_status():
    running_batches = BatchHistory.query.filter_by(status='RUNNING').all()
    return render_template('batch/status.html', running_batches=running_batches)

@batch_bp.route('/history')
@login_required
def batch_history():
    page = request.args.get('page', 1, type=int)
    status_filter = request.args.get('status')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    query = BatchHistory.query
    
    if status_filter:
        query = query.filter(BatchHistory.status == status_filter)
    
    if date_from:
        query = query.filter(BatchHistory.created_at >= date_from)
    
    if date_to:
        query = query.filter(BatchHistory.created_at <= date_to)
    
    batches = query.order_by(BatchHistory.created_at.desc())\
                  .paginate(page=page, per_page=20, error_out=False)
    
    return render_template('batch/history.html', batches=batches)

@batch_bp.route('/upload', methods=['POST'])
@login_required
def upload_file():
    if not current_user.has_role('admin') and not current_user.has_role('operator'):
        flash('バッチ実行権限がありません', 'error')
        return redirect(url_for('batch.batch_status'))
    
    if 'file' not in request.files:
        flash('ファイルが選択されていません', 'error')
        return redirect(url_for('batch.batch_status'))
    
    file = request.files['file']
    if file.filename == '':
        flash('ファイルが選択されていません', 'error')
        return redirect(url_for('batch.batch_status'))
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        upload_folder = os.path.join(os.getcwd(), 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        
        logger.info("ファイルアップロード完了", filename=filename, user_id=current_user.id)
        flash(f'ファイル "{filename}" をアップロードしました', 'success')
        
        return redirect(url_for('batch.batch_status'))
    else:
        flash('CSVファイルのみアップロード可能です', 'error')
        return redirect(url_for('batch.batch_status'))

@batch_bp.route('/execute', methods=['POST'])
@login_required
def execute_batch():
    if not current_user.has_role('admin') and not current_user.has_role('operator'):
        flash('バッチ実行権限がありません', 'error')
        return redirect(url_for('batch.batch_status'))
    
    file_name = request.form.get('file_name') or request.json.get('file_name')
    if not file_name:
        flash('ファイル名が指定されていません', 'error')
        return redirect(url_for('batch.batch_status'))
    
    try:
        batch_service = BatchService()
        batch_id = batch_service.start_batch(file_name, current_user.id)
        
        logger.info("バッチ処理開始", batch_id=batch_id, file_name=file_name, user_id=current_user.id)
        
        if request.is_json:
            return jsonify({
                'success': True,
                'data': {
                    'batch_id': batch_id,
                    'status': 'RUNNING',
                    'file_name': file_name
                }
            }), 201
        
        flash(f'バッチ処理を開始しました (ID: {batch_id})', 'success')
        return redirect(url_for('batch.batch_status'))
        
    except Exception as e:
        logger.error("バッチ処理開始エラー", error=str(e), file_name=file_name, user_id=current_user.id)
        
        if request.is_json:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'BATCH_START_ERROR',
                    'message': 'バッチ処理の開始に失敗しました'
                }
            }), 500
        
        flash('バッチ処理の開始に失敗しました', 'error')
        return redirect(url_for('batch.batch_status'))

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'csv'
