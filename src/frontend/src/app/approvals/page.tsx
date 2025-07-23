"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

interface ApprovalItem {
  id: string;
  type: string;
  title: string;
  request_id: string;
  requester: string;
  department: string;
  current_step: number;
  total_steps: number;
  current_approver: string;
  current_approver_id?: number;
  status: string;
  submitted_date: string;
  due_date: string;
  amount: string;
  history: Array<{step: number, action: string, user: string, date: string, status: string}>;
}

export default function ApprovalsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApprovals, setSelectedApprovals] = useState<string[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useUser();

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const currentUserParam = currentUser ? `?current_user_id=${currentUser.id}` : '';
      const response = await fetch(`${apiUrl}/api/approvals${currentUserParam}`);
      if (response.ok) {
        const apiResponse = await response.json();
        if (apiResponse.success && apiResponse.data?.approvals) {
          setApprovals(apiResponse.data.approvals);
        }
      } else {
        setError('承認一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
      setError('承認一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchApprovals();
    }
  }, [currentUser, fetchApprovals]);


  const handleBulkApproval = async () => {
    if (selectedApprovals.length === 0) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/approvals/bulk-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approval_ids: selectedApprovals,
          comments: "一括承認"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to bulk approve');
      }

      const data = await response.json();
      if (data.success) {
        setSelectedApprovals([]);
        alert(`${selectedApprovals.length}件の承認を一括処理しました`);
      }
    } catch (err) {
      console.error('Error bulk approving:', err);
      alert('一括承認に失敗しました');
    }
  };

  const handleApprovalSelection = (approvalId: string) => {
    setSelectedApprovals(prev => 
      prev.includes(approvalId) 
        ? prev.filter(id => id !== approvalId)
        : [...prev, approvalId]
    );
  };

  const handleApprove = async (approvalId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approver_id: 1,
          action: "approve",
          comments: "承認しました"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve');
      }

      const data = await response.json();
      if (data.success) {
        alert('承認処理が完了しました');
        await fetchApprovals();
      }
    } catch (err) {
      console.error('Error approving:', err);
      alert('承認処理に失敗しました');
      setError('承認処理に失敗しました');
    }
  };

  const handleReject = async (approvalId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approver_id: 1,
          action: "reject",
          comments: "差し戻しました"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject');
      }

      const data = await response.json();
      if (data.success) {
        alert('差し戻し処理が完了しました');
        await fetchApprovals();
      }
    } catch (err) {
      console.error('Error rejecting:', err);
      alert('差し戻し処理に失敗しました');
      setError('差し戻し処理に失敗しました');
    }
  };

  const displayApprovals = approvals;
  
  const filteredApprovals = displayApprovals.filter((approval: ApprovalItem) => {
    const isCurrentUserApprover = currentUser && (
      approval.current_approver === currentUser.name ||
      approval.current_approver_id === currentUser.id
    );
    const isPending = approval.status === "承認待ち";
    const matchesSearch = approval.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (approval.request_id?.toString() || approval.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return isPending && isCurrentUserApprover && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "承認済み": return "text-green-600 bg-green-50";
      case "承認待ち": return "text-yellow-600 bg-yellow-50";
      case "差し戻し": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case "完了": return "text-green-600";
      case "待機中": return "text-yellow-600";
      case "差し戻し": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            承認管理
          </h1>
          <p className="text-muted-foreground">
            {currentUser ? `${currentUser.name}さんの承認待ち案件` : "多段階承認プロセスの管理・追跡・実行"}
          </p>
        </header>

        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="承認案件を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2 ml-4">
            <Button 
              variant="outline"
              onClick={handleBulkApproval}
              disabled={selectedApprovals.length === 0}
            >
              一括承認 ({selectedApprovals.length})
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setShowSettingsModal(true)}
            >
              承認設定
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid gap-6">
          {loading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-500">読み込み中...</p>
              </CardContent>
            </Card>
          ) : (
            filteredApprovals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">承認待ちの項目がありません</h3>
                  <p className="text-gray-500 text-center">
                    現在承認待ちの見積依頼や仕様書はありません。
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredApprovals.map((approval) => (
              <Card key={approval.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedApprovals.includes(approval.id)}
                        onChange={() => handleApprovalSelection(approval.id)}
                        className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <div>
                        <CardTitle className="text-lg">{approval.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {approval.id} • {approval.type} • 申請者: {approval.requester} ({approval.department})
                        </CardDescription>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(approval.status)}`}>
                      {approval.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">金額</h4>
                      <p className="text-sm font-medium">{approval.amount}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">申請日</h4>
                      <p className="text-sm">{approval.submitted_date}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">期限</h4>
                      <p className="text-sm">{approval.due_date}</p>
                    </div>
                  </div>

                  {approval.history && (
                    <div className="mb-6">
                      <h4 className="font-medium text-sm text-muted-foreground mb-3">承認フロー進捗</h4>
                      <div className="flex items-center space-x-4">
                        {approval.history.map((step: {step: number, action: string, user: string, date: string, status: string}, index: number) => (
                          <div key={index} className="flex items-center">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                                step.status === "完了" ? "bg-green-100 border-green-500 text-green-700" :
                                step.status === "待機中" ? "bg-yellow-100 border-yellow-500 text-yellow-700" :
                                "bg-gray-100 border-gray-300 text-gray-500"
                              }`}>
                                {step.step}
                              </div>
                              <div className="mt-1 text-xs text-center">
                                <div className={`font-medium ${getStepStatusColor(step.status)}`}>
                                  {step.action}
                                </div>
                                <div className="text-muted-foreground">{step.user}</div>
                                {step.date !== "-" && (
                                  <div className="text-muted-foreground">{step.date}</div>
                                )}
                              </div>
                            </div>
                            {index < approval.history.length - 1 && (
                              <div className={`w-8 h-0.5 ${
                                step.status === "完了" ? "bg-green-300" : "bg-gray-300"
                              }`}></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      進捗: {approval.current_step}/{approval.total_steps} • 
                      現在の承認者: {approval.current_approver}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedApproval(approval);
                          setShowDetailModal(true);
                        }}
                      >
                        詳細表示
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedApproval(approval);
                          setShowHistoryModal(true);
                        }}
                      >
                        履歴表示
                      </Button>
                      {approval.status === "承認待ち" && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => handleApprove(approval.id)}
                          >
                            承認
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleReject(approval.id)}
                          >
                            差し戻し
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            )
          )}
        </div>
      </div>

      {showDetailModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">承認詳細</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">タイトル</label>
                <p className="mt-1 text-sm text-gray-900">{selectedApproval.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">申請者</label>
                <p className="mt-1 text-sm text-gray-900">{selectedApproval.requester}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">金額</label>
                <p className="mt-1 text-sm text-gray-900">{selectedApproval.amount}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ステータス</label>
                <p className="mt-1 text-sm text-gray-900">{selectedApproval.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">承認履歴</h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {selectedApproval.history.map((step: {step: number, action: string, user: string, date: string, status: string}, index: number) => (
                <div key={index} className="border-b pb-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">ステップ {step.step}: {step.action}</span>
                    <span className={`px-2 py-1 rounded text-xs ${getStepStatusColor(step.status)}`}>
                      {step.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">担当者: {step.user}</p>
                  {step.date !== "-" && (
                    <p className="text-sm text-gray-500">日時: {step.date}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">承認設定</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">自動承認設定</label>
                <input type="checkbox" className="mt-1" />
                <span className="ml-2 text-sm">一定金額以下の自動承認を有効にする</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">承認閾値</label>
                <input type="number" className="mt-1 block w-full border rounded px-3 py-2" placeholder="1000000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">通知設定</label>
                <input type="checkbox" className="mt-1" defaultChecked />
                <span className="ml-2 text-sm">承認待ち通知を有効にする</span>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
                  キャンセル
                </Button>
                <Button className="bg-primary hover:bg-primary/90">
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
