"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ResponsesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedResponses, setSelectedResponses] = useState<string[]>([])
  const [bulkEvaluationStatus, setBulkEvaluationStatus] = useState("APPROVED");

  const mockResponses = [
    {
      id: "RES-001",
      requestId: "REQ-001",
      title: "新システム開発見積回答",
      vendor: "株式会社テックソリューション",
      status: "提出済み",
      submittedDate: "2025-06-26",
      amount: "4,800,000円",
      deliveryPeriod: "6ヶ月",
      validUntil: "2025-07-26",
      attachments: ["見積書.pdf", "提案書.docx", "技術仕様書.pdf"]
    },
    {
      id: "RES-002", 
      requestId: "REQ-002",
      title: "インフラ構築見積回答",
      vendor: "クラウドインフラ株式会社",
      status: "評価中",
      submittedDate: "2025-06-25",
      amount: "2,900,000円",
      deliveryPeriod: "3ヶ月",
      validUntil: "2025-07-25",
      attachments: ["見積書.pdf", "構築計画書.xlsx"]
    },
    {
      id: "RES-003",
      requestId: "REQ-003",
      title: "セキュリティ監査見積回答",
      vendor: "セキュリティ監査法人",
      status: "承認済み",
      submittedDate: "2025-06-24",
      amount: "1,200,000円", 
      deliveryPeriod: "2ヶ月",
      validUntil: "2025-07-24",
      attachments: ["見積書.pdf", "監査計画書.pdf"]
    }
  ];

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

  const filteredResponses = mockResponses.filter(response =>
    response.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "承認済み": return "text-green-600 bg-green-50";
      case "評価中": return "text-yellow-600 bg-yellow-50";
      case "提出済み": return "text-blue-600 bg-blue-50";
      default: return "text-gray-600 bg-gray-50";
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
          <Button 
            onClick={handleBulkEvaluation}
            disabled={selectedResponses.length === 0}
            className={`ml-4 ${
              selectedResponses.length === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            一括評価 ({selectedResponses.length})
          </Button>
        </div>

        <div className="grid gap-6">
          {filteredResponses.map((response) => (
            <Card key={response.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedResponses.includes(response.id)}
                      onChange={() => handleResponseSelection(response.id)}
                      className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <div>
                      <CardTitle className="text-lg">{response.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {response.id} • 依頼ID: {response.requestId} • 提出日: {response.submittedDate}
                      </CardDescription>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(response.status)}`}>
                    {response.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">ベンダー</h4>
                    <p className="text-sm">{response.vendor}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">見積金額</h4>
                    <p className="text-sm font-medium text-lg">{response.amount}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">納期</h4>
                    <p className="text-sm">{response.deliveryPeriod}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">有効期限</h4>
                    <p className="text-sm">{response.validUntil}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">添付ファイル</h4>
                  <div className="flex flex-wrap gap-2">
                    {response.attachments.map((file, index) => (
                      <span key={index} className="px-2 py-1 bg-muted rounded text-xs cursor-pointer hover:bg-muted/80">
                        📎 {file}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    有効期限まで: {Math.ceil((new Date(response.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}日
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      詳細表示
                    </Button>
                    <Button variant="outline" size="sm">
                      比較表示
                    </Button>
                    {response.status === "提出済み" && (
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        評価開始
                      </Button>
                    )}
                    {response.status === "評価中" && (
                      <Button size="sm" className="bg-secondary hover:bg-secondary/90">
                        承認申請
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredResponses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">検索条件に一致する見積回答が見つかりません。</p>
          </div>
        )}
      </div>
    </div>
  );
}
