"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Specification {
  spec_id: number;
  spec_number: string;
  title: string;
  work_items: string[];
  deliverables: string[];
  desired_delivery_date?: string;
  delivery_location?: string;
  acceptance_conditions?: string;
  estimate_copies?: number;
  supplied_items?: string;
  loaned_items?: string;
  applicable_standards?: string;
  special_notes?: string;
  status: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export default function SpecificationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newSpec, setNewSpec] = useState<{
    title: string;
    workItems: string[];
    deliverables: string[];
    desiredDeliveryDate: string;
    deliveryLocation: string;
    acceptanceConditions: string;
    estimateCopies: number;
    suppliedItems: string;
    loanedItems: string;
    applicableStandards: string;
    specialNotes: string;
  }>({
    title: "",
    workItems: [],
    deliverables: [],
    desiredDeliveryDate: "",
    deliveryLocation: "",
    acceptanceConditions: "",
    estimateCopies: 1,
    suppliedItems: "",
    loanedItems: "",
    applicableStandards: "",
    specialNotes: ""
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSpec, setEditingSpec] = useState<Specification | null>(null);
  const [editSpec, setEditSpec] = useState<{
    title: string;
    workItems: string[];
    deliverables: string[];
    desiredDeliveryDate: string;
    deliveryLocation: string;
    acceptanceConditions: string;
    estimateCopies: number;
    suppliedItems: string;
    loanedItems: string;
    applicableStandards: string;
    specialNotes: string;
  }>({
    title: "",
    workItems: [],
    deliverables: [],
    desiredDeliveryDate: "",
    deliveryLocation: "",
    acceptanceConditions: "",
    estimateCopies: 1,
    suppliedItems: "",
    loanedItems: "",
    applicableStandards: "",
    specialNotes: ""
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

  const fetchSpecifications = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const apiAuth = process.env.NEXT_PUBLIC_API_AUTH;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (apiAuth) {
        headers['Authorization'] = `Basic ${btoa(apiAuth)}`;
      }
      
      const response = await fetch(`${apiUrl}/api/specifications`, {
        headers,
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch specifications');
      }
      const data = await response.json();
      if (data.success && data.data) {
        setSpecifications(data.data);
      }
    } catch (err) {
      console.error('Error fetching specifications:', err);
      setError("仕様書の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecifications();
  }, []);

  const filteredSpecs = specifications.filter(spec =>
    spec.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spec.spec_number?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleSaveSpec = async () => {
    if (!newSpec.title.trim()) {
      alert("仕様書タイトルを入力してください");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const apiAuth = process.env.NEXT_PUBLIC_API_AUTH;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (apiAuth) {
        headers['Authorization'] = `Basic ${btoa(apiAuth)}`;
      }
      
      const response = await fetch(`${apiUrl}/api/specifications`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          spec_number: `SPEC-${Date.now()}`,
          title: newSpec.title,
          work_items: newSpec.workItems,
          deliverables: newSpec.deliverables,
          desired_delivery_date: (() => {
            if (!newSpec.desiredDeliveryDate || !newSpec.desiredDeliveryDate.trim()) {
              return null;
            }
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(newSpec.desiredDeliveryDate)) {
              return newSpec.desiredDeliveryDate;
            }
            console.warn('Invalid date format, sending null:', newSpec.desiredDeliveryDate);
            return null;
          })(),
          delivery_location: newSpec.deliveryLocation,
          acceptance_conditions: newSpec.acceptanceConditions,
          estimate_copies: newSpec.estimateCopies,
          supplied_items: newSpec.suppliedItems,
          loaned_items: newSpec.loanedItems,
          applicable_standards: newSpec.applicableStandards,
          special_notes: newSpec.specialNotes,
          created_by: 1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create specification');
      }

      const data = await response.json();
      if (data.success) {
        await fetchSpecifications(); // Refresh the list
        setShowCreateModal(false);
        setNewSpec({ 
          title: "", 
          workItems: [], 
          deliverables: [],
          desiredDeliveryDate: "",
          deliveryLocation: "",
          acceptanceConditions: "",
          estimateCopies: 1,
          suppliedItems: "",
          loanedItems: "",
          applicableStandards: "",
          specialNotes: ""
        });
        alert("仕様書を作成しました");
      }
    } catch (err) {
      console.error('Error creating specification:', err);
      alert("仕様書の作成に失敗しました");
    }
  };

  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setNewSpec({ 
      title: "", 
      workItems: [], 
      deliverables: [],
      desiredDeliveryDate: "",
      deliveryLocation: "",
      acceptanceConditions: "",
      estimateCopies: 1,
      suppliedItems: "",
      loanedItems: "",
      applicableStandards: "",
      specialNotes: ""
    });
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

  const handleDeleteSpec = async (specId: number, specTitle: string) => {
    if (!confirm(`仕様書「${specTitle}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const apiAuth = process.env.NEXT_PUBLIC_API_AUTH;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (apiAuth) {
        headers['Authorization'] = `Basic ${btoa(apiAuth)}`;
      }
      
      const response = await fetch(`${apiUrl}/api/specifications/${specId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMessage = `削除に失敗しました: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.success) {
        await fetchSpecifications();
        alert("仕様書を削除しました");
      } else {
        const errorMessage = data.error?.message || "削除に失敗しました";
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Error deleting specification:', err);
      const errorMessage = err instanceof Error ? err.message : "仕様書の削除に失敗しました";
      alert(errorMessage);
    }
  };

  const handleEditSpec = async (spec: Specification) => {
    setEditingSpec(spec);
    setEditSpec({
      title: spec.title,
      workItems: spec.work_items || [],
      deliverables: spec.deliverables || [],
      desiredDeliveryDate: spec.desired_delivery_date ? spec.desired_delivery_date.toString() : "",
      deliveryLocation: spec.delivery_location || "",
      acceptanceConditions: spec.acceptance_conditions || "",
      estimateCopies: spec.estimate_copies || 1,
      suppliedItems: spec.supplied_items || "",
      loanedItems: spec.loaned_items || "",
      applicableStandards: spec.applicable_standards || "",
      specialNotes: spec.special_notes || ""
    });
    setShowEditModal(true);
  };

  const handleSaveEditSpec = async () => {
    if (!editingSpec || !editSpec.title.trim()) {
      alert("仕様書タイトルを入力してください");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const apiAuth = process.env.NEXT_PUBLIC_API_AUTH;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (apiAuth) {
        headers['Authorization'] = `Basic ${btoa(apiAuth)}`;
      }

      const response = await fetch(`${apiUrl}/api/specifications/${editingSpec.spec_id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          title: editSpec.title,
          work_items: editSpec.workItems,
          deliverables: editSpec.deliverables,
          desired_delivery_date: (() => {
            if (!editSpec.desiredDeliveryDate || !editSpec.desiredDeliveryDate.trim()) {
              return null;
            }
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(editSpec.desiredDeliveryDate)) {
              return editSpec.desiredDeliveryDate;
            }
            console.warn('Invalid date format, sending null:', editSpec.desiredDeliveryDate);
            return null;
          })(),
          delivery_location: editSpec.deliveryLocation,
          acceptance_conditions: editSpec.acceptanceConditions,
          estimate_copies: editSpec.estimateCopies,
          supplied_items: editSpec.suppliedItems,
          loaned_items: editSpec.loanedItems,
          applicable_standards: editSpec.applicableStandards,
          special_notes: editSpec.specialNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update specification');
      }

      const data = await response.json();
      if (data.success) {
        await fetchSpecifications();
        setShowEditModal(false);
        setEditingSpec(null);
        alert("仕様書を更新しました");
      }
    } catch (err) {
      console.error('Error updating specification:', err);
      alert("仕様書の更新に失敗しました");
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingSpec(null);
    setEditSpec({
      title: "", workItems: [], deliverables: [], desiredDeliveryDate: "",
      deliveryLocation: "", acceptanceConditions: "", estimateCopies: 1,
      suppliedItems: "", loanedItems: "", applicableStandards: "", specialNotes: ""
    });
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

        {loading ? (
          <div className="text-center py-8">
            <p>読み込み中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredSpecs.map((spec) => (
              <Card key={spec.spec_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{spec.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {spec.spec_number} • 作成日: {spec.created_at ? new Date(spec.created_at).toLocaleDateString() : ''}
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
                        {spec.work_items && spec.work_items.map((item: string, index: number) => (
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
                        {spec.deliverables && spec.deliverables.map((item: string, index: number) => (
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
                      作成者: {spec.created_by || '-'}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditSpec(spec)}
                      >
                        編集
                      </Button>
                      {spec.status === "DRAFT" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteSpec(spec.spec_id, spec.title)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          削除
                        </Button>
                      )}
                      {spec.status === "DRAFT" && (
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
        )}

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

                <div>
                  <label className="block text-sm font-medium mb-2">希望納期 (YYYY-MM-DD形式)</label>
                  <input
                    type="text"
                    value={newSpec.desiredDeliveryDate}
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      console.log('Date text input onChange:', { 
                        rawValue: dateValue, 
                        type: typeof dateValue,
                        length: dateValue.length 
                      });
                      setNewSpec(prev => ({ ...prev, desiredDeliveryDate: dateValue }));
                    }}
                    placeholder="例: 2025-07-15"
                    pattern="\d{4}-\d{2}-\d{2}"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">納入場所</label>
                  <Input
                    value={newSpec.deliveryLocation}
                    onChange={(e) => setNewSpec(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                    placeholder="納入場所を入力してください"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">検収条件</label>
                  <textarea
                    value={newSpec.acceptanceConditions}
                    onChange={(e) => setNewSpec(prev => ({ ...prev, acceptanceConditions: e.target.value }))}
                    placeholder="検収条件を入力してください"
                    className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">見積書部数</label>
                  <Input
                    type="number"
                    min="1"
                    value={newSpec.estimateCopies}
                    onChange={(e) => setNewSpec(prev => ({ ...prev, estimateCopies: parseInt(e.target.value) || 1 }))}
                    placeholder="見積書部数を入力してください"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">支給品</label>
                  <textarea
                    value={newSpec.suppliedItems}
                    onChange={(e) => setNewSpec(prev => ({ ...prev, suppliedItems: e.target.value }))}
                    placeholder="支給品を入力してください"
                    className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">貸与品</label>
                  <textarea
                    value={newSpec.loanedItems}
                    onChange={(e) => setNewSpec(prev => ({ ...prev, loanedItems: e.target.value }))}
                    placeholder="貸与品を入力してください"
                    className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">適用標準</label>
                  <textarea
                    value={newSpec.applicableStandards}
                    onChange={(e) => setNewSpec(prev => ({ ...prev, applicableStandards: e.target.value }))}
                    placeholder="適用標準を入力してください"
                    className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">特記事項</label>
                  <textarea
                    value={newSpec.specialNotes}
                    onChange={(e) => setNewSpec(prev => ({ ...prev, specialNotes: e.target.value }))}
                    placeholder="特記事項を入力してください"
                    className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
                  />
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

        {/* 仕様書編集モーダル */}
        {showEditModal && editingSpec && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-primary mb-6">仕様書編集</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">仕様書タイトル</label>
                  <Input
                    value={editSpec.title}
                    onChange={(e) => setEditSpec(prev => ({ ...prev, title: e.target.value }))}
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
                        if (e.target.value && !editSpec.workItems.includes(e.target.value)) {
                          setEditSpec(prev => ({
                            ...prev,
                            workItems: [...prev.workItems, e.target.value]
                          }));
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">作業項目を選択してください</option>
                      {workItemOptions
                        .filter(option => !editSpec.workItems.includes(option))
                        .map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    {editSpec.workItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{item}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditSpec(prev => ({
                            ...prev,
                            workItems: prev.workItems.filter(i => i !== item)
                          }))}
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
                        if (e.target.value && !editSpec.deliverables.includes(e.target.value)) {
                          setEditSpec(prev => ({
                            ...prev,
                            deliverables: [...prev.deliverables, e.target.value]
                          }));
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">成果物を選択してください</option>
                      {deliverableOptions
                        .filter(option => !editSpec.deliverables.includes(option))
                        .map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    {editSpec.deliverables.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{item}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditSpec(prev => ({
                            ...prev,
                            deliverables: prev.deliverables.filter(i => i !== item)
                          }))}
                        >
                          削除
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">希望納期</label>
                  <Input
                    type="date"
                    value={editSpec.desiredDeliveryDate}
                    onChange={(e) => setEditSpec(prev => ({ ...prev, desiredDeliveryDate: e.target.value }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">納品場所</label>
                  <Input
                    value={editSpec.deliveryLocation}
                    onChange={(e) => setEditSpec(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                    placeholder="納品場所を入力してください"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">検収条件</label>
                  <textarea
                    value={editSpec.acceptanceConditions}
                    onChange={(e) => setEditSpec(prev => ({ ...prev, acceptanceConditions: e.target.value }))}
                    placeholder="検収条件を入力してください"
                    className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">見積書部数</label>
                  <Input
                    type="number"
                    min="1"
                    value={editSpec.estimateCopies}
                    onChange={(e) => setEditSpec(prev => ({ ...prev, estimateCopies: parseInt(e.target.value) || 1 }))}
                    placeholder="見積書部数を入力してください"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">支給品</label>
                  <textarea
                    value={editSpec.suppliedItems}
                    onChange={(e) => setEditSpec(prev => ({ ...prev, suppliedItems: e.target.value }))}
                    placeholder="支給品を入力してください"
                    className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">貸与品</label>
                  <textarea
                    value={editSpec.loanedItems}
                    onChange={(e) => setEditSpec(prev => ({ ...prev, loanedItems: e.target.value }))}
                    placeholder="貸与品を入力してください"
                    className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">適用標準</label>
                  <textarea
                    value={editSpec.applicableStandards}
                    onChange={(e) => setEditSpec(prev => ({ ...prev, applicableStandards: e.target.value }))}
                    placeholder="適用標準を入力してください"
                    className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">特記事項</label>
                  <textarea
                    value={editSpec.specialNotes}
                    onChange={(e) => setEditSpec(prev => ({ ...prev, specialNotes: e.target.value }))}
                    placeholder="特記事項を入力してください"
                    className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleSaveEditSpec}
                  className="bg-primary hover:bg-primary/90"
                  disabled={!editSpec.title.trim()}
                >
                  更新
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
