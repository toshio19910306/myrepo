"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RequestsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [requests, setRequests] = useState([
    {
      id: "REQ-001",
      title: "新システム開発見積依頼",
      specId: "SPEC-001",
      status: "承認待ち",
      createdDate: "2025-06-25",
      dueDate: "2025-07-10",
      vendor: "株式会社テックソリューション",
      estimatedAmount: "5,000,000円",
      attachments: ["仕様書.pdf", "要件定義書.docx"]
    },
    {
      id: "REQ-002",
      title: "インフラ構築見積依頼", 
      specId: "SPEC-002",
      status: "進行中",
      createdDate: "2025-06-24",
      dueDate: "2025-07-05",
      vendor: "クラウドインフラ株式会社",
      estimatedAmount: "3,000,000円",
      attachments: ["構築仕様書.pdf"]
    },
    {
      id: "REQ-003",
      title: "セキュリティ監査見積依頼",
      specId: "SPEC-003", 
      status: "完了",
      createdDate: "2025-06-23",
      dueDate: "2025-06-30",
      vendor: "セキュリティ監査法人",
      estimatedAmount: "1,500,000円",
      attachments: ["監査要項.pdf", "チェックリスト.xlsx"]
    }
  ]);
  const [newRequest, setNewRequest] = useState({
    title: "",
    specId: "",
    vendor: "",
    dueDate: "",
    estimatedAmount: "",
    description: ""
  });

  const filteredRequests = requests.filter(request =>
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "完了": return "text-green-600 bg-green-50";
      case "承認待ち": return "text-yellow-600 bg-yellow-50";
      case "進行中": return "text-blue-600 bg-blue-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const mockSpecs = [
    { id: "SPEC-001", title: "新システム開発仕様書" },
    { id: "SPEC-002", title: "インフラ構築仕様書" },
    { id: "SPEC-003", title: "セキュリティ監査仕様書" }
  ];

  const mockVendors = [
    "株式会社テックソリューション",
    "クラウドインフラ株式会社", 
    "セキュリティ監査法人",
    "システム開発株式会社",
    "ITコンサルティング株式会社"
  ];

  const handleCreateRequest = () => {
    setShowCreateModal(true);
  };

  const handleSaveRequest = () => {
    if (!newRequest.title.trim() || !newRequest.specId || !newRequest.vendor || !newRequest.dueDate) {
      alert("必須項目をすべて入力してください。");
      return;
    }

    const newRequestId = `REQ-${String(requests.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    
    const newEstimateRequest = {
      id: newRequestId,
      title: newRequest.title,
      specId: newRequest.specId,
      status: "承認待ち",
      createdDate: today,
      dueDate: newRequest.dueDate,
      vendor: newRequest.vendor,
      estimatedAmount: newRequest.estimatedAmount || "未設定",
      attachments: []
    };

    setRequests(prev => [...prev, newEstimateRequest]);
    setShowCreateModal(false);
    setNewRequest({
      title: "",
      specId: "",
      vendor: "",
      dueDate: "",
      estimatedAmount: "",
      description: ""
    });
    
    console.log("新規見積依頼作成:", newEstimateRequest);
  };

  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setNewRequest({
      title: "",
      specId: "",
      vendor: "",
      dueDate: "",
      estimatedAmount: "",
      description: ""
    });
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

        <div className="grid gap-6">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{request.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {request.id} • 仕様書: {request.specId} • 作成日: {request.createdDate}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">ベンダー</h4>
                    <p className="text-sm">{request.vendor}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">見積金額</h4>
                    <p className="text-sm font-medium">{request.estimatedAmount}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">回答期限</h4>
                    <p className="text-sm">{request.dueDate}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">添付ファイル</h4>
                  <div className="flex flex-wrap gap-2">
                    {request.attachments.map((file, index) => (
                      <span key={index} className="px-2 py-1 bg-muted rounded text-xs">
                        📎 {file}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    期限まで: {Math.ceil((new Date(request.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}日
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      詳細表示
                    </Button>
                    <Button variant="outline" size="sm">
                      編集
                    </Button>
                    <Button variant="outline" size="sm">
                      コピー作成
                    </Button>
                    {request.status === "進行中" && (
                      <Button size="sm" className="bg-secondary hover:bg-secondary/90">
                        催促メール
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">検索条件に一致する見積依頼が見つかりません。</p>
          </div>
        )}

        {/* 新規見積依頼作成モーダル */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-primary mb-6">新規見積依頼作成</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">依頼タイトル</label>
                  <Input
                    value={newRequest.title}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="見積依頼のタイトルを入力してください"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">関連仕様書</label>
                  <select
                    value={newRequest.specId}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, specId: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">仕様書を選択してください</option>
                    {mockSpecs.map(spec => (
                      <option key={spec.id} value={spec.id}>
                        {spec.id} - {spec.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ベンダー</label>
                  <select
                    value={newRequest.vendor}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, vendor: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">ベンダーを選択してください</option>
                    {mockVendors.map(vendor => (
                      <option key={vendor} value={vendor}>
                        {vendor}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">回答期限</label>
                    <Input
                      type="date"
                      value={newRequest.dueDate}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">予算上限</label>
                    <Input
                      value={newRequest.estimatedAmount}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, estimatedAmount: e.target.value }))}
                      placeholder="例: 5,000,000円"
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">詳細説明</label>
                  <textarea
                    value={newRequest.description}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="見積依頼の詳細内容を入力してください"
                    className="w-full p-2 border border-gray-300 rounded-md h-24 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">添付ファイル</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">
                      ファイルをドラッグ＆ドロップするか、クリックして選択してください
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, Word, Excel, PowerPoint (最大10MB)
                    </p>
                  </div>
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
                  disabled={!newRequest.title.trim() || !newRequest.specId || !newRequest.vendor}
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
