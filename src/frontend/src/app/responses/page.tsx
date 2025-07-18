"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Eye, FileText } from "lucide-react";

interface EstimateResponse {
  response_id: number;
  request_id: number;
  vendor_id?: number;
  estimate_number?: string;
  estimate_price?: number;
  total_amount?: number;
  delivery_date?: string;
  validity_period?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ResponsesPage() {
  const router = useRouter();
  const [responses, setResponses] = useState<EstimateResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/responses`);
      if (response.ok) {
        const apiResponse = await response.json();
        if (apiResponse.success && Array.isArray(apiResponse.data)) {
          setResponses(apiResponse.data);
        } else {
          setResponses([]);
        }
      } else {
        const errorText = await response.text();
        console.error('Response fetch error:', errorText);
        setError(`見積回答の取得に失敗しました: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error fetching responses:', err);
      setError(`見積回答の取得中にエラーが発生しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">見積回答</h1>
            <p className="text-gray-600">見積依頼に対する回答を管理します</p>
          </div>
          <Button
            onClick={() => router.push("/responses/new")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            新規回答作成
          </Button>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">見積回答一覧</CardTitle>
            <CardDescription>作成された見積回答の一覧です</CardDescription>
          </CardHeader>
          <CardContent>
            {responses.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">見積回答がありません</h3>
                <p className="text-gray-600 mb-4">
                  承認済みの見積依頼に対する回答を作成してください。
                </p>
                <Button
                  onClick={() => router.push("/responses/new")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新規回答作成
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>見積番号</TableHead>
                      <TableHead>見積金額</TableHead>
                      <TableHead>合計金額</TableHead>
                      <TableHead>納期</TableHead>
                      <TableHead>有効期限</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>作成日</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response) => (
                      <TableRow key={response.response_id}>
                        <TableCell className="font-medium">
                          {response.estimate_number || "-"}
                        </TableCell>
                        <TableCell>{formatCurrency(response.estimate_price)}</TableCell>
                        <TableCell>{formatCurrency(response.total_amount)}</TableCell>
                        <TableCell>{formatDate(response.delivery_date)}</TableCell>
                        <TableCell>{response.validity_period || "-"}</TableCell>
                        <TableCell>{getStatusBadge(response.status)}</TableCell>
                        <TableCell>{formatDate(response.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/responses/${response.response_id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/responses/${response.response_id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
