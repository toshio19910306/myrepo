"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SpecificationsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const mockSpecifications = [
    {
      id: "SPEC-001",
      title: "新システム開発仕様書",
      status: "承認済み",
      createdDate: "2025-06-20",
      approver: "田中部長",
      workItems: ["要件定義", "基本設計", "詳細設計"],
      deliverables: ["要件定義書", "基本設計書", "詳細設計書"]
    },
    {
      id: "SPEC-002", 
      title: "インフラ構築仕様書",
      status: "承認待ち",
      createdDate: "2025-06-22",
      approver: "佐藤課長",
      workItems: ["サーバー構築", "ネットワーク設定", "セキュリティ設定"],
      deliverables: ["構築手順書", "設定書", "テスト結果書"]
    },
    {
      id: "SPEC-003",
      title: "セキュリティ監査仕様書", 
      status: "作成中",
      createdDate: "2025-06-25",
      approver: "-",
      workItems: ["脆弱性診断", "ペネトレーションテスト", "レポート作成"],
      deliverables: ["診断報告書", "改善提案書"]
    }
  ];

  const filteredSpecs = mockSpecifications.filter(spec =>
    spec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spec.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "承認済み": return "text-green-600 bg-green-50";
      case "承認待ち": return "text-yellow-600 bg-yellow-50";
      case "作成中": return "text-blue-600 bg-blue-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            仕様書管理
          </h1>
          <p className="text-muted-foreground">
            プロジェクト仕様書の作成・管理・承認
          </p>
        </header>

        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="仕様書を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button className="ml-4 bg-primary hover:bg-primary/90">
            新規仕様書作成
          </Button>
        </div>

        <div className="grid gap-6">
          {filteredSpecs.map((spec) => (
            <Card key={spec.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{spec.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {spec.id} • 作成日: {spec.createdDate}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(spec.status)}`}>
                    {spec.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">作業項目</h4>
                    <ul className="space-y-1">
                      {spec.workItems.map((item, index) => (
                        <li key={index} className="text-sm flex items-center">
                          <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">成果物</h4>
                    <ul className="space-y-1">
                      {spec.deliverables.map((item, index) => (
                        <li key={index} className="text-sm flex items-center">
                          <span className="w-2 h-2 bg-secondary rounded-full mr-2"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    承認者: {spec.approver}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      詳細表示
                    </Button>
                    <Button variant="outline" size="sm">
                      編集
                    </Button>
                    {spec.status === "作成中" && (
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        承認申請
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSpecs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">検索条件に一致する仕様書が見つかりません。</p>
          </div>
        )}
      </div>
    </div>
  );
}
