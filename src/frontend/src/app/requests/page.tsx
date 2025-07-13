"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";

interface EstimateRequest {
  request_id: number;
  spec_id: number | null;
  subject: string;
  description: string;
  deadline: string;
  budget_range_min: number | null;
  budget_range_max: number | null;
  requirements: string | null;
  status: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export default function RequestsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [requests, setRequests] = useState<EstimateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    dueDate: ""
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/requests`);
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      const apiResponse = await response.json();
      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'API request failed');
      }
      const data = Array.isArray(apiResponse.data) ? apiResponse.data : [];
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request =>
    request.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.request_id.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-green-600 bg-green-50";
      case "submitted": return "text-yellow-600 bg-yellow-50";
      case "in_review": return "text-blue-600 bg-blue-50";
      case "draft": return "text-gray-600 bg-gray-50";
      case "rejected": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "APPROVED": return "承認済み";
      case "SUBMITTED": return "提出済み";
      case "IN_REVIEW": return "審査中";
      case "DRAFT": return "下書き";
      case "REJECTED": return "却下";
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ja-JP');
    } catch {
      return dateString;
    }
  };

  const handleCreateRequest = () => {
    setShowCreateModal(true);
  };

  const handleSaveRequest = async () => {
    if (!newRequest.title || !newRequest.description || !newRequest.dueDate) {
      alert('すべての必須項目を入力してください。');
      return;
    }

    try {
      let attachmentIds: string[] = [];
      
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });

        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/files/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload files');
        }

        const uploadData = await uploadResponse.json();
        attachmentIds = uploadData.file_ids || [];
      }

      let formattedDate = newRequest.dueDate;
      console.log('Original date from form:', formattedDate);
      
      if (formattedDate) {
        if (formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          console.log('Date already in correct YYYY-MM-DD format');
        } else {
          console.log('Date needs formatting, attempting to parse...');
          
          const dateObj = new Date(formattedDate);
          if (!isNaN(dateObj.getTime())) {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            formattedDate = `${year}-${month}-${day}`;
            console.log('Successfully parsed date:', formattedDate);
          } else {
            console.log('Failed to parse date, keeping original:', formattedDate);
            const numbers = formattedDate.match(/\d+/g);
            if (numbers && numbers.length >= 3) {
              const [yearPart, monthPart, dayPart] = numbers;
              if (yearPart.length === 4 && monthPart.length <= 2 && dayPart.length <= 2) {
                formattedDate = `${yearPart}-${monthPart.padStart(2, '0')}-${dayPart.padStart(2, '0')}`;
                console.log('Extracted and formatted date:', formattedDate);
              }
            }
          }
        }
      }

      const requestData = {
        subject: newRequest.title,
        description: newRequest.description,
        deadline: formattedDate,
        attachment_ids: attachmentIds
      };
      
      console.log('Final request data being sent:', requestData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to create request');
      }

      await fetchRequests();
      
      setNewRequest({
        title: '',
        description: '',
        dueDate: ''
      });
      setSelectedFiles([]);
      setShowCreateModal(false);
      alert('見積依頼が正常に作成されました。');
    } catch (err) {
      console.error('Error creating request:', err);
      alert('見積依頼の作成に失敗しました。詳細: ' + (err instanceof Error ? err.message : '不明なエラー'));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setNewRequest({
      title: "",
      description: "",
      dueDate: ""
    });
    setSelectedFiles([]);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            見積依頼管理
          </h1>
          <p className="text-muted-foreground">
            ベンダーへの見積依頼作成・管理・追跡
          </p>
        </header>

        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="見積依頼を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button 
            className="ml-4 bg-primary hover:bg-primary/90"
            onClick={handleCreateRequest}
          >
            新規見積依頼作成
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>読み込み中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p>エラー: {error}</p>
            <Button onClick={fetchRequests} className="mt-4">
              再試行
            </Button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>検索条件に一致する見積依頼が見つかりません。</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredRequests.map((request) => (
              <Card key={request.request_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{request.subject}</CardTitle>
                      <CardDescription className="mt-1">
                        ID: {request.request_id} • 作成日: {formatDate(request.created_at)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{request.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">希望納期</h4>
                      <p className="text-sm">{formatDate(request.deadline)}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">予算範囲</h4>
                      <p className="text-sm">
                        {request.budget_range_min && request.budget_range_max 
                          ? `¥${request.budget_range_min.toLocaleString()} - ¥${request.budget_range_max.toLocaleString()}`
                          : '未設定'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      期限まで: {Math.ceil((new Date(request.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}日
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        詳細表示
                      </Button>
                      <Button variant="outline" size="sm">
                        編集
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 新規見積依頼作成モーダル */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-primary mb-6">新規見積依頼作成</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">依頼タイトル *</label>
                  <Input
                    value={newRequest.title}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="見積依頼のタイトルを入力してください"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">詳細説明 *</label>
                  <textarea
                    value={newRequest.description}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="見積依頼の詳細内容を入力してください"
                    className="w-full p-2 border border-gray-300 rounded-md h-24 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">希望納期 *</label>
                  <Input
                    type="date"
                    value={newRequest.dueDate}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">添付ファイル</label>
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                    onDrop={handleFileDrop}
                    onDragOver={handleDragOver}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      ファイルをドラッグ&ドロップするか、クリックして選択
                    </p>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      id="file-upload"
                      onChange={handleFileSelect}
                    />
                    <label
                      htmlFor="file-upload"
                      className="mt-2 inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-md cursor-pointer hover:bg-gray-200"
                    >
                      ファイルを選択
                    </label>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">選択されたファイル:</p>
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm text-gray-600">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={handleCancelCreate}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleSaveRequest}
                  className="bg-primary hover:bg-primary/90"
                  disabled={!newRequest.title.trim() || !newRequest.description.trim() || !newRequest.dueDate}
                >
                  作成
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
