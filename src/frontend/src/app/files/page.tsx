'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, Trash2, FileText, Image, Archive, File } from 'lucide-react';

interface FileItem {
  file_id: string;
  original_filename: string;
  file_size: number;
  content_type: string;
  created_at: string;
  blob_url: string;
  target_type: string;
  target_id: number;
}

interface UploadResponse {
  file_id: string;
  filename: string;
  size: number;
  content_type: string;
  url: string;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      const response = await fetch('https://database-fix-app-tunnel-arvgx9xw.devinapps.com/api/files');
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      setFiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    setError(null);
    
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target_type', 'SPECIFICATION');
        formData.append('target_id', '1');
        
        const response = await fetch('https://database-fix-app-tunnel-arvgx9xw.devinapps.com/api/files/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        const uploadResult: UploadResponse = await response.json();
        
        const newFile: FileItem = {
          file_id: uploadResult.file_id,
          original_filename: uploadResult.filename,
          file_size: uploadResult.size,
          content_type: uploadResult.content_type,
          created_at: new Date().toISOString(),
          blob_url: uploadResult.url,
          target_type: 'SPECIFICATION',
          target_id: 1
        };
        
        setFiles(prev => [...prev, newFile]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    maxSize: 10 * 1024 * 1024,
    disabled: uploading
  });

  const handleDownload = async (file: FileItem) => {
    try {
      const response = await fetch(`https://database-fix-app-tunnel-arvgx9xw.devinapps.com/api/files/download/${file.file_id}`);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      const response = await fetch(`https://database-fix-app-tunnel-arvgx9xw.devinapps.com/api/files/${fileId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
      
      setFiles(prev => prev.filter(file => file.file_id !== fileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const getFileIcon = (type: string) => {
    if (!type) return <File className="w-6 h-6" />;
    if (type.startsWith('image/')) return <Image className="w-6 h-6" aria-label="Image file icon" />;
    if (type.includes('pdf')) return <FileText className="w-6 h-6" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="w-6 h-6" />;
    return <File className="w-6 h-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">ファイルを読み込み中...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ファイル管理</h1>
          <p className="text-gray-600">見積依頼・回答・仕様書関連ファイルの管理・アップロード・ダウンロード</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ファイルアップロード</h2>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {uploading ? (
              <p className="text-lg font-medium text-gray-600">アップロード中...</p>
            ) : isDragActive ? (
              <p className="text-lg font-medium text-blue-600">ファイルをドロップしてください</p>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-900 mb-2">ファイルをドラッグ&ドロップ</p>
                <p className="text-gray-500 mb-4">または クリックしてファイルを選択</p>
                <p className="text-sm text-gray-400">
                  対応形式: PDF, Word, Excel, PowerPoint, CSV, TXT (最大10MB)
                </p>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">アップロード済みファイル</h2>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.file_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="text-gray-500">
                    {getFileIcon(file.content_type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.original_filename}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="ダウンロード"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(file.file_id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {files.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                アップロードされたファイルはありません
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
