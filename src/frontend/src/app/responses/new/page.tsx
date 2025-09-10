"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, X, Users } from "lucide-react";

interface EstimateRequest {
  request_id: number;
  subject: string;
  description: string;
  deadline: string;
  budget_range_min?: number;
  budget_range_max?: number;
}

interface User {
  user_id: number;
  full_name: string;
  company_name?: string;
}

interface AttachedFile {
  file_id: string;
  filename: string;
  size: number;
  content_type: string;
  url: string;
}

export default function NewResponsePage() {
  const router = useRouter();
  const [approvedRequests, setApprovedRequests] = useState<EstimateRequest[]>([]);
  const [vendors, setVendors] = useState<User[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequestVendor, setSelectedRequestVendor] = useState<User | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedApprovers, setSelectedApprovers] = useState<number[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [createdResponseId, setCreatedResponseId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    request_id: "",
    company_id: "",
    estimate_number: "",
    estimate_price: "",
    total_amount: "",
    delivery_date: "",
    validity_period: "",
    terms_conditions: "",
    response_remarks: "",
    response_date: "",
  });

  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const futureDate = new Date(today);
    futureDate.setMonth(futureDate.getMonth() + 2);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    setFormData(prev => ({
      ...prev,
      response_date: todayStr,
      delivery_date: futureDateStr,
      estimate_number: "",
      estimate_price: "",
      total_amount: "",
      validity_period: "",
      terms_conditions: "",
      response_remarks: ""
    }));
  }, []);

  useEffect(() => {
    fetchApprovedRequests();
    fetchVendors();
    fetchUsers();
  }, []);

  const fetchApprovedRequests = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/requests/approved`);
      if (response.ok) {
        const apiResponse = await response.json();
        if (apiResponse.success && Array.isArray(apiResponse.data)) {
          setApprovedRequests(apiResponse.data);
        } else {
          setApprovedRequests([]);
        }
      } else {
        setError("承認済み見積依頼の取得に失敗しました");
      }
    } catch {
      setError("承認済み見積依頼の取得中にエラーが発生しました");
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/requests/approved-with-companies`);
      if (response.ok) {
        const apiResponse = await response.json();
        if (apiResponse.success && Array.isArray(apiResponse.data)) {
          const uniqueCompanies = apiResponse.data
            .filter((req: { company_id?: number; company_name?: string }) => req.company_id && req.company_name)
            .reduce((acc: { user_id: number; company_id: number; company_name: string; full_name: string; is_active: boolean; created_at: string; updated_at: string }[], req: { company_id: number; company_name: string; created_at: string; updated_at: string }) => {
              if (!acc.find(c => c.company_id === req.company_id)) {
                acc.push({
                  user_id: req.company_id,
                  company_id: req.company_id,
                  company_name: req.company_name,
                  full_name: req.company_name,
                  is_active: true,
                  created_at: req.created_at,
                  updated_at: req.updated_at
                });
              }
              return acc;
            }, []);
          setVendors(uniqueCompanies);
        }
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users`);
      if (response.ok) {
        const apiResponse = await response.json();
        if (apiResponse.success && Array.isArray(apiResponse.data)) {
          setUsers(apiResponse.data);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === "request_id" && value) {
      const selectedRequest = approvedRequests.find(req => req.request_id.toString() === value);
      if (selectedRequest) {
        fetchRequestVendor(selectedRequest.request_id);
      }
    }
  };

  const fetchRequestVendor = async (requestId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/requests/${requestId}`);
      if (response.ok) {
        const apiResponse = await response.json();
        if (apiResponse.success && apiResponse.data.vendor_name) {
          const vendor = vendors.find(v => v.full_name === apiResponse.data.vendor_name || v.company_name === apiResponse.data.vendor_name);
          setSelectedRequestVendor(vendor || null);
        } else {
          setSelectedRequestVendor(null);
        }
      }
    } catch (error) {
      console.error('Error fetching request vendor:', error);
      setSelectedRequestVendor(null);
    }
  };

  const handleFileUploadFromFiles = async (files: File[]) => {
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("target_type", "RESPONSE");
      formData.append("target_id", "0");

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/files/upload`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const apiResponse = await response.json();
          if (apiResponse.success && apiResponse.data) {
            setAttachedFiles(prev => [...prev, {
              file_id: apiResponse.data.file_id,
              filename: apiResponse.data.filename,
              size: apiResponse.data.size,
              content_type: apiResponse.data.content_type,
              url: apiResponse.data.url
            }]);
          }
        } else {
          setError("ファイルのアップロードに失敗しました");
        }
      } catch {
        setError("ファイルのアップロード中にエラーが発生しました");
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    handleFileUploadFromFiles(Array.from(files));
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    handleFileUploadFromFiles(files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.file_id !== fileId));
  };

  const handleApprovalRequest = () => {
    if (!createdResponseId) {
      setApprovalError("見積回答を先に作成してください");
      return;
    }
    setIsApprovalModalOpen(true);
    setApprovalError(null);
  };

  const handleSubmitApproval = async () => {
    if (selectedApprovers.length === 0) {
      setApprovalError("承認者を選択してください");
      return;
    }

    setIsSubmittingApproval(true);
    setApprovalError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/responses/${createdResponseId}/request-approval`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approver_ids: selectedApprovers,
        }),
      });

      if (response.ok) {
        setIsApprovalModalOpen(false);
        setSelectedApprovers([]);
        alert("承認依頼を送信しました");
      } else {
        const errorData = await response.json();
        setApprovalError(errorData.message || "承認依頼の送信に失敗しました");
      }
    } catch (error) {
      console.error("Error submitting approval:", error);
      setApprovalError("承認依頼の送信中にエラーが発生しました");
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const toggleApproverSelection = (userId: number) => {
    setSelectedApprovers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          request_id: parseInt(formData.request_id),
          company_id: formData.company_id ? parseInt(formData.company_id) : null,
          estimate_price: formData.estimate_price ? parseFloat(formData.estimate_price) : null,
          total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
          created_by: 1,
          attachment_ids: attachedFiles.map(file => file.file_id).filter(id => id != null),
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success && responseData.data) {
          setCreatedResponseId(responseData.data.response_id);
          router.push("/responses");
        } else {
          setError("見積回答の作成に失敗しました");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "見積回答の作成に失敗しました");
      }
    } catch {
      setError("見積回答の作成中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">見積回答作成</h1>
          <p className="text-gray-600">承認済みの見積依頼に対する回答を作成します</p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">基本情報</CardTitle>
              <CardDescription>見積回答の基本情報を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="request_id" className="text-sm font-medium text-gray-700">
                  見積依頼 <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.request_id} onValueChange={(value) => handleInputChange("request_id", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="承認済み見積依頼を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedRequests.map((request) => (
                      <SelectItem key={request.request_id} value={request.request_id.toString()}>
                        {request.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="company_id" className="text-sm font-medium text-gray-700">
                  会社
                </Label>
                {selectedRequestVendor ? (
                  <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm font-medium text-gray-900">
                      {selectedRequestVendor.company_name || selectedRequestVendor.full_name}
                    </p>
                    <p className="text-xs text-gray-600">
                      見積依頼で指定された会社
                    </p>
                  </div>
                ) : (
                  <Select value={formData.company_id} onValueChange={(value) => handleInputChange("company_id", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="会社を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.user_id} value={vendor.user_id.toString()}>
                          {vendor.company_name || vendor.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimate_number" className="text-sm font-medium text-gray-700">
                    見積番号
                  </Label>
                  <Input
                    id="estimate_number"
                    type="text"
                    value={formData.estimate_number}
                    onChange={(e) => handleInputChange("estimate_number", e.target.value)}
                    className="mt-1"
                    placeholder="見積番号を入力"
                  />
                </div>

                <div>
                  <Label htmlFor="response_date" className="text-sm font-medium text-gray-700">
                    回答日
                  </Label>
                  <Input
                    id="response_date"
                    type="date"
                    value={formData.response_date}
                    onChange={(e) => handleInputChange("response_date", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">金額情報</CardTitle>
              <CardDescription>見積金額に関する情報を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimate_price" className="text-sm font-medium text-gray-700">
                    見積金額
                  </Label>
                  <Input
                    id="estimate_price"
                    type="number"
                    step="0.01"
                    value={formData.estimate_price}
                    onChange={(e) => handleInputChange("estimate_price", e.target.value)}
                    className="mt-1"
                    placeholder="見積金額を入力"
                  />
                </div>

                <div>
                  <Label htmlFor="total_amount" className="text-sm font-medium text-gray-700">
                    合計金額
                  </Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => handleInputChange("total_amount", e.target.value)}
                    className="mt-1"
                    placeholder="合計金額を入力"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">納期・有効期限</CardTitle>
              <CardDescription>納期と有効期限を設定してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery_date" className="text-sm font-medium text-gray-700">
                    納期
                  </Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => handleInputChange("delivery_date", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="validity_period" className="text-sm font-medium text-gray-700">
                    有効期限
                  </Label>
                  <Input
                    id="validity_period"
                    type="text"
                    value={formData.validity_period}
                    onChange={(e) => handleInputChange("validity_period", e.target.value)}
                    className="mt-1"
                    placeholder="例: 30日間、2024年12月31日まで"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">詳細情報</CardTitle>
              <CardDescription>条件や備考を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="terms_conditions" className="text-sm font-medium text-gray-700">
                  条件・規約
                </Label>
                <Textarea
                  id="terms_conditions"
                  value={formData.terms_conditions}
                  onChange={(e) => handleInputChange("terms_conditions", e.target.value)}
                  className="mt-1"
                  rows={4}
                  placeholder="見積に関する条件や規約を入力"
                />
              </div>

              <div>
                <Label htmlFor="response_remarks" className="text-sm font-medium text-gray-700">
                  備考
                </Label>
                <Textarea
                  id="response_remarks"
                  value={formData.response_remarks}
                  onChange={(e) => handleInputChange("response_remarks", e.target.value)}
                  className="mt-1"
                  rows={3}
                  placeholder="その他の備考を入力"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">添付ファイル</CardTitle>
              <CardDescription>見積書や関連資料をアップロードしてください</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload" className="text-sm font-medium text-gray-700">
                    ファイルを選択
                  </Label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors" onDrop={handleFileDrop} onDragOver={handleDragOver}>
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>ファイルをアップロード</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            multiple
                            onChange={handleFileUpload}
                          />
                        </label>
                        <p className="pl-1">またはドラッグ&amp;ドロップ</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                    </div>
                  </div>
                </div>

                {attachedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">アップロード済みファイル</Label>
                    {attachedFiles.map((file) => (
                      <div key={file.file_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.filename}</p>
                            <p className="text-xs text-gray-500">{file.size ? (file.size / 1024).toFixed(1) : '0'} KB</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.file_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/responses")}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.request_id}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "作成中..." : "見積回答を作成"}
            </Button>
            {createdResponseId && (
              <Button
                type="button"
                onClick={handleApprovalRequest}
                className="bg-green-600 hover:bg-green-700"
              >
                <Users className="h-4 w-4 mr-1" />
                承認依頼
              </Button>
            )}
          </div>

          {isApprovalModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">承認者選択</h3>
                {approvalError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800 text-sm">{approvalError}</p>
                  </div>
                )}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {users.map((user) => (
                    <label key={user.user_id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedApprovers.includes(user.user_id)}
                        onChange={() => toggleApproverSelection(user.user_id)}
                        className="rounded"
                      />
                      <span className="text-sm">{user.full_name}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsApprovalModalOpen(false)}
                    disabled={isSubmittingApproval}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmitApproval}
                    disabled={isSubmittingApproval || selectedApprovers.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmittingApproval ? "送信中..." : "承認依頼を送信"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
