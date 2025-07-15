"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface User {
  user_id: number;
  full_name: string;
  company_name?: string;
  user_type: string;
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
    fetchApprovedRequests();
    fetchVendors();
  }, []);

  const fetchApprovedRequests = async () => {
    try {
      const response = await fetch("/api/requests/approved");
      if (response.ok) {
        const data = await response.json();
        setApprovedRequests(data);
      } else {
        setError("承認済み見積依頼の取得に失敗しました");
      }
    } catch (err) {
      setError("承認済み見積依頼の取得中にエラーが発生しました");
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/users?user_type=VENDOR");
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      } else {
        setError("ベンダー情報の取得に失敗しました");
      }
    } catch (err) {
      setError("ベンダー情報の取得中にエラーが発生しました");
    }
  };

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
      formData.append("target_id", "0");

      try {
        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const uploadedFile = await response.json();
          setAttachedFiles(prev => [...prev, uploadedFile]);
        } else {
          setError("ファイルのアップロードに失敗しました");
        }
      } catch (err) {
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
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          request_id: parseInt(formData.request_id),
          vendor_id: formData.vendor_id ? parseInt(formData.vendor_id) : null,
          estimate_price: formData.estimate_price ? parseFloat(formData.estimate_price) : null,
          total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
          created_by: 1,
          attachment_ids: attachedFiles.map(file => file.file_id),
        }),
      });

      if (response.ok) {
        router.push("/responses");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "見積回答の作成に失敗しました");
      }
    } catch (err) {
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
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
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
                <Label htmlFor="vendor_id" className="text-sm font-medium text-gray-700">
                  ベンダー
                </Label>
                <Select value={formData.vendor_id} onValueChange={(value) => handleInputChange("vendor_id", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="ベンダーを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.user_id} value={vendor.user_id.toString()}>
                        {vendor.full_name} ({vendor.company_name})
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
                        <p className="pl-1">またはドラッグ&ドロップ</p>
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
              {isLoading ? "作成中..." : "見積回答を作成"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
