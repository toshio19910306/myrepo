"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface EstimateRequest {
  request_id: number;
  subject: string;
  description: string;
  deadline: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface EstimateResponse {
  response_id: number;
  request_id: number;
  vendor_id: number;
  total_amount: number;
  delivery_date: string;
  validity_period: number;
  notes?: string;
  breakdown?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  company_name?: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ResponsesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedResponses, setSelectedResponses] = useState<string[]>([])
  const [bulkEvaluationStatus, setBulkEvaluationStatus] = useState("APPROVED");
  const [approvedRequests, setApprovedRequests] = useState<EstimateRequest[]>([]);
  const [responses, setResponses] = useState<EstimateResponse[]>([]);
  const [vendors, setVendors] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [newResponse, setNewResponse] = useState({
    vendor_id: '',
    total_amount: '',
    delivery_date: '',
    validity_period: '',
    notes: '',
    breakdown: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);


  useEffect(() => {
    fetchApprovedRequests();
    fetchResponses();
    fetchVendors();
  }, []);

  const fetchApprovedRequests = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/requests/approved`);
      if (response.ok) {
        const data = await response.json();
        setApprovedRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching approved requests:', error);
    }
  };

  const fetchResponses = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/responses`);
      if (response.ok) {
        const data = await response.json();
        setResponses(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users?user_type=VENDOR`);
      if (response.ok) {
        const data = await response.json();
        setVendors(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleCreateResponse = async () => {
    console.log('Form validation check:');
    console.log('selectedRequestId:', selectedRequestId);
    console.log('newResponse:', newResponse);
    
    if (!selectedRequestId || !newResponse.vendor_id || !newResponse.total_amount || !newResponse.delivery_date || !newResponse.validity_period) {
      alert('必須項目を入力してください');
      return;
    }

    try {
      const uploadedFileIds: string[] = [];
      
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('target_type', 'RESPONSE');
          formData.append('target_id', '0');
          formData.append('file', file);
          
          const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/files/upload`, {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error(`ファイル ${file.name} のアップロードに失敗しました`);
          }
          
          const uploadResult = await uploadResponse.json();
          uploadedFileIds.push(uploadResult.data.file_id);
        }
      }

      const responseData = {
        request_id: selectedRequestId,
        vendor_id: parseInt(newResponse.vendor_id),
        total_amount: parseFloat(newResponse.total_amount),
        delivery_date: newResponse.delivery_date,
        validity_period: parseInt(newResponse.validity_period),
        notes: newResponse.notes,
        breakdown: newResponse.breakdown,
        attachment_ids: uploadedFileIds
      };

      console.log('Sending response data:', JSON.stringify(responseData, null, 2));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewResponse({
          vendor_id: '',
          total_amount: '',
          delivery_date: '',
          validity_period: '',
          notes: '',
          breakdown: ''
        });
        setSelectedFiles([]);
        setSelectedRequestId(null);
        fetchResponses();
        alert('見積回答を作成しました');
      } else {
        for (const fileId of uploadedFileIds) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/files/${fileId}`, {
              method: 'DELETE',
            });
          } catch (cleanupError) {
            console.error('Failed to cleanup file:', fileId, cleanupError);
          }
        }
        throw new Error('見積回答の作成に失敗しました');
      }
    } catch (error) {
      console.error('Error creating response:', error);
      alert('見積回答の作成中にエラーが発生しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
    }
  };

  const handleBulkEvaluation = async () => {
    if (selectedResponses.length === 0) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/responses/bulk-evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response_ids: selectedResponses,
          evaluation: bulkEvaluationStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to bulk evaluate responses');
      }

      const data = await response.json();
      if (data.success) {
        setSelectedResponses([]);
        fetchResponses();
        alert(`${selectedResponses.length}件の見積回答を一括評価しました`);
      }
    } catch (err) {
      console.error('Error bulk evaluating responses:', err);
      alert('一括評価に失敗しました');
    }
  };

  const handleResponseSelection = (responseId: string) => {
    setSelectedResponses(prev => 
      prev.includes(responseId) 
        ? prev.filter(id => id !== responseId)
        : [...prev, responseId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const getVendorName = (vendorId: number) => {
    const vendor = vendors.find(v => v.user_id === vendorId);
    return vendor ? vendor.company_name || vendor.full_name : '不明なベンダー';
  };

  const getRequestTitle = (requestId: number) => {
    const request = approvedRequests.find(r => r.request_id === requestId);
    return request ? request.subject : '不明な依頼';
  };

  const filteredResponses = responses.filter(response => {
    const vendorName = getVendorName(response.vendor_id);
    const requestTitle = getRequestTitle(response.request_id);
    return vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           requestTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
           response.response_id.toString().includes(searchTerm.toLowerCase());
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "text-green-600 bg-green-50";
      case "SUBMITTED": return "text-blue-600 bg-blue-50";
      case "DRAFT": return "text-gray-600 bg-gray-50";
      case "REJECTED": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "APPROVED": return "承認済み";
      case "SUBMITTED": return "提出済み";
      case "DRAFT": return "下書き";
      case "REJECTED": return "却下";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            見積回答管理
          </h1>
          <p className="text-muted-foreground">
            ベンダーからの見積回答の確認・評価・承認
          </p>
        </header>

        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="見積回答を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary/90"
            >
              新規回答作成
            </Button>
            {selectedResponses.length > 0 && (
              <>
                <select
                  value={bulkEvaluationStatus}
                  onChange={(e) => setBulkEvaluationStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="APPROVED">承認</option>
                  <option value="REJECTED">却下</option>
                </select>
                <Button 
                  onClick={handleBulkEvaluation}
                  className="bg-primary hover:bg-primary/90"
                >
                  一括評価 ({selectedResponses.length}件)
                </Button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResponses.map((response) => (
              <Card key={response.response_id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold mb-1">
                        {getRequestTitle(response.request_id)}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        回答ID: {response.response_id} | 依頼ID: {response.request_id}
                      </CardDescription>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedResponses.includes(response.response_id.toString())}
                      onChange={() => handleResponseSelection(response.response_id.toString())}
                      className="ml-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">ベンダー:</span>
                      <p className="mt-1">{getVendorName(response.vendor_id)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">金額:</span>
                      <p className="mt-1 font-semibold text-primary">¥{response.total_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">納期:</span>
                      <p className="mt-1">{new Date(response.delivery_date).toLocaleDateString('ja-JP')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">有効期限:</span>
                      <p className="mt-1">{response.validity_period}日</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(response.status)}`}>
                      {getStatusText(response.status)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      作成日: {new Date(response.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  
                  {response.notes && (
                    <div className="pt-2 border-t">
                      <span className="text-xs font-medium text-muted-foreground">備考:</span>
                      <p className="mt-1 text-xs">{response.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">新規見積回答作成</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">承認済み見積依頼</label>
                  <select
                    value={selectedRequestId || ''}
                    onChange={(e) => setSelectedRequestId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">見積依頼を選択してください</option>
                    {approvedRequests.map((request) => (
                      <option key={request.request_id} value={request.request_id}>
                        {request.subject} (ID: {request.request_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">ベンダー</label>
                  <select
                    value={newResponse.vendor_id}
                    onChange={(e) => setNewResponse({...newResponse, vendor_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">ベンダーを選択してください</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.user_id} value={vendor.user_id}>
                        {vendor.company_name || vendor.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">見積金額</label>
                  <input
                    type="number"
                    value={newResponse.total_amount}
                    onChange={(e) => setNewResponse({...newResponse, total_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="金額を入力してください"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">納期</label>
                  <input
                    type="text"
                    value={newResponse.delivery_date}
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      console.log('Date input changed:', dateValue);
                      setNewResponse({...newResponse, delivery_date: dateValue});
                    }}
                    placeholder="YYYY-MM-DD (例: 2025-03-15)"
                    pattern="\d{4}-\d{2}-\d{2}"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">有効期限（日数）</label>
                  <input
                    type="number"
                    value={newResponse.validity_period}
                    onChange={(e) => setNewResponse({...newResponse, validity_period: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="有効期限を日数で入力してください"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">内訳</label>
                  <textarea
                    value={newResponse.breakdown}
                    onChange={(e) => setNewResponse({...newResponse, breakdown: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="見積内訳を入力してください"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">備考</label>
                  <textarea
                    value={newResponse.notes}
                    onChange={(e) => setNewResponse({...newResponse, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="備考を入力してください"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">添付ファイル</label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">選択されたファイル:</p>
                      <ul className="text-sm">
                        {selectedFiles.map((file, index) => (
                          <li key={index} className="text-blue-600">📎 {file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewResponse({
                      vendor_id: '',
                      total_amount: '',
                      delivery_date: '',
                      validity_period: '',
                      notes: '',
                      breakdown: ''
                    });
                    setSelectedFiles([]);
                    setSelectedRequestId(null);
                  }}
                >
                  キャンセル
                </Button>
                <Button onClick={handleCreateResponse}>
                  作成
                </Button>
              </div>
            </div>
          </div>
        )}

        {filteredResponses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">検索条件に一致する見積回答が見つかりません。</p>
          </div>
        )}
      </div>
    </div>
  );
}
