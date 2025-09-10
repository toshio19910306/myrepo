"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Edit, Download, FileText } from "lucide-react";

interface EstimateResponse {
  response_id: number;
  request_id: number;
  company_id?: number;
  estimate_number?: string;
  estimate_price?: number;
  total_amount?: number;
  breakdown?: Record<string, unknown>;
  delivery_date?: string;
  validity_period?: string;
  terms_conditions?: string;
  response_remarks?: string;
  response_date?: string;
  status: string;
  created_by: number;
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

export default function ResponseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [response, setResponse] = useState<EstimateResponse | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResponseDetail = useCallback(async () => {
    try {
      setError(null);
      const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000'}/api/responses/${id}`);
      if (apiResponse.ok) {
        const result = await apiResponse.json();
        if (result.success && result.data) {
          setResponse(result.data);
          
          try {
            const filesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000'}/api/files/target/RESPONSE/${id}`);
            if (filesResponse.ok) {
              const filesData = await filesResponse.json();
              setAttachedFiles(filesData.data || []);
            }
          } catch (err) {
            console.error('Error fetching attachments:', err);
          }
        } else {
          setError("見積回答の取得に失敗しました");
        }
      } else {
        setError(`見積回答の取得に失敗しました: ${apiResponse.status} ${apiResponse.statusText}`);
      }
    } catch (err) {
      console.error('Error fetching response detail:', err);
      setError(`見積回答の取得中にエラーが発生しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchResponseDetail();
    }
  }, [id, fetchResponseDetail]);

  const handleDownloadFile = async (file: AttachedFile) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000'}/api/files/download/${file.file_id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "下書き", variant: "secondary" as const },
      submitted: { label: "提出済み", variant: "default" as const },
      approved: { label: "承認済み", variant: "success" as const },
      rejected: { label: "却下", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  if (isLoading) {
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

  if (error || !response) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error || "見積回答が見つかりません"}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/responses")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            一覧に戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">見積回答詳細</h1>
            <p className="text-gray-600">見積回答の詳細情報を表示します</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => router.push("/responses")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              一覧に戻る
            </Button>
            <Button onClick={() => router.push(`/responses/${id}/edit`)} className="bg-blue-600 hover:bg-blue-700">
              <Edit className="h-4 w-4 mr-2" />
              編集
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 flex items-center justify-between">
                基本情報
                {getStatusBadge(response.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">見積番号</label>
                  <p className="mt-1 text-sm text-gray-900">{response.estimate_number || "-"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">回答日</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(response.response_date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">金額情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">見積金額</label>
                  <p className="mt-1 text-sm text-gray-900">{formatCurrency(response.estimate_price)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">合計金額</label>
                  <p className="mt-1 text-sm text-gray-900">{formatCurrency(response.total_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">納期・有効期限</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">納期</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(response.delivery_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">有効期限</label>
                  <p className="mt-1 text-sm text-gray-900">{response.validity_period || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">詳細情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">条件・規約</label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{response.terms_conditions || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">備考</label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{response.response_remarks || "-"}</p>
              </div>
            </CardContent>
          </Card>

          {attachedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">添付ファイル</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFile(file)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">システム情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">作成日時</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(response.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">更新日時</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(response.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
