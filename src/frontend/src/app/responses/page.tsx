"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Eye, FileText, Users, X } from "lucide-react";

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

interface User {
  user_id: number;
  full_name: string;
  email: string;
  department?: string;
  position?: string;
}

export default function ResponsesPage() {
  const router = useRouter();
  const [responses, setResponses] = useState<EstimateResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedApprovers, setSelectedApprovers] = useState<number[]>([]);
  const [approvalResponseId, setApprovalResponseId] = useState<number | null>(null);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  useEffect(() => {
    fetchResponses();
    fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/approvers`);
      if (response.ok) {
        const apiResponse = await response.json();
        if (apiResponse.success && Array.isArray(apiResponse.data)) {
          setUsers(apiResponse.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch approvers:', error);
    }
  };

  const handleApprovalRequest = (responseId: number) => {
    setApprovalResponseId(responseId);
    setSelectedApprovers([]);
    setApprovalError(null);
    setIsApprovalModalOpen(true);
  };

  const handleSubmitApproval = async () => {
    if (!approvalResponseId || selectedApprovers.length === 0) return;

    setIsSubmittingApproval(true);
    setApprovalError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/responses/${approvalResponseId}/submit-for-approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approver_ids: selectedApprovers
        }),
      });

      if (response.ok) {
        await fetchResponses();
        setIsApprovalModalOpen(false);
        setApprovalResponseId(null);
        setSelectedApprovers([]);
        setError(null);
        alert('承認申請を送信しました');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setApprovalError(errorData.error?.message || '承認申請に失敗しました');
      }
    } catch (error) {
      console.error('Error submitting approval request:', error);
      setApprovalError('ネットワークエラーが発生しました。再度お試しください。');
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

  const filteredResponses = responses.filter((response) =>
    response.estimate_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        <div className="mb-6">
          <Input
            placeholder="見積番号で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
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
            {filteredResponses.length === 0 ? (
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
                    {filteredResponses.map((response) => (
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
                            {(response.status === "draft" || response.status === "rejected") && (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleApprovalRequest(response.response_id)}
                              >
                                <Users className="h-4 w-4 mr-1" />
                                承認依頼
                              </Button>
                            )}
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

        {/* Approval Request Modal */}
        {isApprovalModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  承認者選択
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsApprovalModalOpen(false);
                    setApprovalResponseId(null);
                    setSelectedApprovers([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  承認者を選択してください（複数選択可能）
                </p>
                
                {approvalError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{approvalError}</p>
                  </div>
                )}
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {users.map((user) => (
                    <div 
                      key={user.user_id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedApprovers.includes(user.user_id)
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleApproverSelection(user.user_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-gray-500">
                            {user.department && `${user.department} `}
                            {user.position && `- ${user.position}`}
                          </div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedApprovers.includes(user.user_id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedApprovers.includes(user.user_id) && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsApprovalModalOpen(false);
                    setApprovalResponseId(null);
                    setSelectedApprovers([]);
                  }}
                >
                  キャンセル
                </Button>
                <Button 
                  onClick={handleSubmitApproval}
                  disabled={selectedApprovers.length === 0 || isSubmittingApproval}
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {isSubmittingApproval ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      送信中...
                    </>
                  ) : (
                    `承認申請を送信 (${selectedApprovers.length}名選択)`
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
