"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Eye, CheckCircle, XCircle } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

interface ResponseApprovalItem {
  response_id: number;
  estimate_number?: string;
  estimate_price?: number;
  vendor_name: string;
  request_subject: string;
  status: string;
  submitted_date: string;
  current_approver: string;
  current_approver_id?: number;
}

export default function ResponseApprovalsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [approvals, setApprovals] = useState<ResponseApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useUser();

  const fetchResponseApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/responses/pending-approvals`);
      if (response.ok) {
        const apiResponse = await response.json();
        if (apiResponse.success && apiResponse.data) {
          setApprovals(apiResponse.data);
        }
      } else {
        setError('見積回答承認一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('Error fetching response approvals:', error);
      setError('見積回答承認一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResponseApprovals();
  }, [fetchResponseApprovals]);

  const handleApprove = async (responseId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/responses/${responseId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approver_id: currentUser?.id || 1,
          action: "approved",
          comments: "承認しました"
        })
      });

      if (response.ok) {
        alert('見積回答を承認しました');
        await fetchResponseApprovals();
      } else {
        alert('承認処理に失敗しました');
      }
    } catch (err) {
      console.error('Error approving response:', err);
      alert('承認処理に失敗しました');
    }
  };

  const handleReject = async (responseId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/responses/${responseId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approver_id: currentUser?.id || 1,
          action: "rejected",
          comments: "差し戻しました"
        })
      });

      if (response.ok) {
        alert('見積回答を差し戻しました');
        await fetchResponseApprovals();
      } else {
        alert('差し戻し処理に失敗しました');
      }
    } catch (err) {
      console.error('Error rejecting response:', err);
      alert('差し戻し処理に失敗しました');
    }
  };

  const filteredApprovals = approvals.filter((approval) => {
    const matchesSearch = 
      approval.estimate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.request_subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "承認待ち", variant: "secondary" as const },
      approved: { label: "承認済み", variant: "success" as const },
      rejected: { label: "差し戻し", variant: "destructive" as const },
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">見積回答承認管理</h1>
          <p className="text-gray-600">見積回答の承認・差し戻しを管理します</p>
        </div>

        <div className="mb-6">
          <Input
            placeholder="見積番号、会社名、件名で検索..."
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
            <CardTitle className="text-xl text-gray-900">承認待ち見積回答一覧</CardTitle>
            <CardDescription>承認が必要な見積回答の一覧です</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">読み込み中...</p>
              </div>
            ) : filteredApprovals.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">承認待ちの見積回答がありません</h3>
                <p className="text-gray-600">現在承認待ちの見積回答はありません。</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>見積番号</TableHead>
                      <TableHead>会社名</TableHead>
                      <TableHead>件名</TableHead>
                      <TableHead>見積金額</TableHead>
                      <TableHead>提出日</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApprovals.map((approval) => (
                      <TableRow key={approval.response_id}>
                        <TableCell className="font-medium">
                          {approval.estimate_number || "-"}
                        </TableCell>
                        <TableCell>{approval.vendor_name}</TableCell>
                        <TableCell>{approval.request_subject}</TableCell>
                        <TableCell>{formatCurrency(approval.estimate_price)}</TableCell>
                        <TableCell>{new Date(approval.submitted_date).toLocaleDateString("ja-JP")}</TableCell>
                        <TableCell>{getStatusBadge(approval.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/responses/${approval.response_id}`, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {approval.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApprove(approval.response_id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  承認
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleReject(approval.response_id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  差し戻し
                                </Button>
                              </>
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
      </div>
    </div>
  );
}
