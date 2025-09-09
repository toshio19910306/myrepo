"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, X } from "lucide-react";

interface EstimateRequest {
  request_id: number;
  subject: string;
  description: string;
  deadline: string;
  budget_range_min?: number;
  budget_range_max?: number;
}

interface Vendor {
  company_id: number;
  company_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AttachedFile {
  file_id: string;
  filename: string;
  size: number;
  content_type: string;
  url: string;
}

interface EstimateResponse {
  response_id: number;
  request_id: number;
  vendor_id?: number;
  estimate_number?: string;
  estimate_price?: number;
  total_amount?: number;
  delivery_date?: string;
  validity_period?: string;
  terms_conditions?: string;
  response_remarks?: string;
  response_date?: string;
  status: string;
}

export default function EditResponsePage() {
  const router = useRouter();
  const params = useParams();
  const responseId = params.id as string;

  const [response, setResponse] = useState<EstimateResponse | null>(null);
  const [approvedRequests, setApprovedRequests] = useState<EstimateRequest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    request_id: "",
    vendor_id: "",
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
    const fetchResponse = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/responses/${responseId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const responseData = data.data;
            setResponse(responseData);
            setFormData({
              request_id: responseData.request_id?.toString() || "",
              vendor_id: responseData.vendor_id?.toString() || "",
              estimate_number: responseData.estimate_number || "",
              estimate_price: responseData.estimate_price?.toString() || "",
              total_amount: responseData.total_amount?.toString() || "",
              delivery_date: responseData.delivery_date || "",
              validity_period: responseData.validity_period || "",
              terms_conditions: responseData.terms_conditions || "",
              response_remarks: responseData.response_remarks || "",
              response_date: responseData.response_date || "",
            });
            
            try {
              const filesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/files/target/RESPONSE/${responseId}`);
              if (filesResponse.ok) {
                const filesData = await filesResponse.json();
                setAttachedFiles(filesData.data || []);
              }
            } catch (err) {
              console.error('Error fetching existing attachments:', err);
            }
          } else {
            setError("見積回答の取得に失敗しました");
          }
        } else {
          setError("見積回答の取得に失敗しました");
        }
      } catch {
        setError("見積回答の取得中にエラーが発生しました");
      }
    };

    const fetchApprovedRequests = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/requests/approved`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setApprovedRequests(data.data);
          }
        }
      } catch {
        console.error("承認済み見積依頼の取得に失敗しました");
      }
    };

    const fetchCompanies = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/companies`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setVendors(data.data);
          }
        }
      } catch {
        console.error("会社情報の取得に失敗しました");
      }
    };

    fetchResponse();
    fetchApprovedRequests();
    fetchCompanies();
  }, [responseId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("target_type", "RESPONSE");
      formData.append("target_id", responseId);

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/files/upload`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const uploadedFile = await response.json();
          setAttachedFiles(prev => [...prev, uploadedFile]);
        } else {
          setError("ファイルのアップロードに失敗しました");
        }
      } catch {
        setError("ファイルのアップロード中にエラーが発生しました");
      }
    }
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.file_id !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/responses/${responseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          request_id: formData.request_id ? parseInt(formData.request_id) : null,
          vendor_id: formData.vendor_id ? parseInt(formData.vendor_id) : null,
          estimate_price: formData.estimate_price ? parseFloat(formData.estimate_price) : null,
          total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
        }),
      });

      if (response.ok) {
        router.push("/responses");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "見積回答の更新に失敗しました");
      }
    } catch {
      setError("見積回答の更新中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  if (!response) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">見積回答編集</h1>
          <p className="text-gray-600">見積回答の内容を編集します</p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">基本情報</CardTitle>
              <CardDescription>見積回答の基本情報を編集してください</CardDescription>
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
                <Label htmlFor="vendor_id" className="text-sm font-medium text-gray-700">
                  会社
                </Label>
                <Select value={formData.vendor_id} onValueChange={(value) => handleInputChange("vendor_id", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="会社を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.company_id} value={vendor.company_id.toString()}>
                        {vendor.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <CardDescription>見積金額に関する情報を編集してください</CardDescription>
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
              <CardDescription>納期と有効期限を編集してください</CardDescription>
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
              <CardDescription>条件や備考を編集してください</CardDescription>
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
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
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
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
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
              {isLoading ? "更新中..." : "見積回答を更新"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
