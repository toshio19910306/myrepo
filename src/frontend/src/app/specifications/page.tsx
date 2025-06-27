"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SpecificationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [specifications, setSpecifications] = useState([
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
  ]);
  const [newSpec, setNewSpec] = useState<{
    title: string;
    workItems: string[];
    deliverables: string[];
  }>({
    title: "",
    workItems: [],
    deliverables: []
  });

  const workItemOptions = [
    "基本構想立案",
    "要件定義", 
    "AP外部設計",
    "ＡＰ内部設計",
    "AP製造",
    "プログラムテスト（単体テスト)",
    "AP結合テスト",
    "システムテスト",
    "システム受入支援・移行",
    "運用保守"
  ];

  const deliverableOptions = [
    "基本計画",
    "業務要件定義書",
    "リスクリスト(プロジェクト管理)",
    "課題管理表(プロジェクト管理)",
    "システム要件定義書",
    "システムアーキテクチャー概要設計書",
    "システムテスト関連書（テスト計画書部分）",
    "AP外部設計書",
    "AP内部設計書",
    "AP製造関連書",
    "AP結合テスト関連書",
    "システム基盤設計書",
    "システム基盤構築関連書",
    "システムテスト関連書",
    "移行準備関連書",
    "受入移行関連書",
    "サービス提供準備関連書",
    "打合せ議事録"
  ];

  const filteredSpecs = specifications.filter(spec =>
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

  const handleCreateSpec = () => {
    setShowCreateModal(true);
  };

  const handleSaveSpec = () => {
    if (newSpec.workItems.length === 0 || newSpec.deliverables.length === 0) {
      alert("作業項目と成果物を少なくとも1つずつ選択してください。");
      return;
    }

    const newSpecId = `SPEC-${String(specifications.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    
    const newSpecification = {
      id: newSpecId,
      title: newSpec.title,
      status: "作成中",
      createdDate: today,
      approver: "-",
      workItems: newSpec.workItems,
      deliverables: newSpec.deliverables
    };

    setSpecifications(prev => [...prev, newSpecification]);
    setShowCreateModal(false);
    setNewSpec({ title: "", workItems: [], deliverables: [] });
    
    console.log("新規仕様書作成:", newSpecification);
  };

  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setNewSpec({ title: "", workItems: [], deliverables: [] });
  };

  const addWorkItem = (selectedItem: string) => {
    if (!newSpec.workItems.includes(selectedItem)) {
      setNewSpec(prev => ({
        ...prev,
        workItems: [...prev.workItems, selectedItem]
      }));
    }
  };

  const addDeliverable = (selectedItem: string) => {
    if (!newSpec.deliverables.includes(selectedItem)) {
      setNewSpec(prev => ({
        ...prev,
        deliverables: [...prev.deliverables, selectedItem]
      }));
    }
  };

  const removeWorkItem = (itemToRemove: string) => {
    setNewSpec(prev => ({
      ...prev,
      workItems: prev.workItems.filter(item => item !== itemToRemove)
    }));
  };

  const removeDeliverable = (itemToRemove: string) => {
    setNewSpec(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter(item => item !== itemToRemove)
    }));
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
          <Button 
            className="ml-4 bg-primary hover:bg-primary/90"
            onClick={handleCreateSpec}
          >
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

        {/* 新規仕様書作成モーダル */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-primary mb-6">新規仕様書作成</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">仕様書タイトル</label>
                  <Input
                    value={newSpec.title}
                    onChange={(e) => setNewSpec(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="仕様書のタイトルを入力してください"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">作業項目</label>
                  <div className="mb-4">
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      onChange={(e) => {
                        if (e.target.value) {
                          addWorkItem(e.target.value);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">作業項目を選択してください</option>
                      {workItemOptions
                        .filter(option => !newSpec.workItems.includes(option))
                        .map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    {newSpec.workItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{item}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeWorkItem(item)}
                        >
                          削除
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">成果物</label>
                  <div className="mb-4">
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      onChange={(e) => {
                        if (e.target.value) {
                          addDeliverable(e.target.value);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">成果物を選択してください</option>
                      {deliverableOptions
                        .filter(option => !newSpec.deliverables.includes(option))
                        .map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    {newSpec.deliverables.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{item}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDeliverable(item)}
                        >
                          削除
                        </Button>
                      </div>
                    ))}
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
                  onClick={handleSaveSpec}
                  className="bg-primary hover:bg-primary/90"
                  disabled={!newSpec.title.trim()}
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
