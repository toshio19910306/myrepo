"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Send, X } from "lucide-react";

export default function NewSpecificationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    spec_number: "",
    title: "",
    desired_delivery_date: "",
    delivery_location: "",
    acceptance_conditions: "",
    estimate_copies: 1,
    supplied_items: "",
    loaned_items: "",
    applicable_standards: "",
    special_notes: "",
  });
  const [selectedWorkItems, setSelectedWorkItems] = useState<string[]>([]);
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>([]);

  const workItems = [
    "基本構想立案",
    "要件定義",
    "AP外部設計",
    "ＡＰ内部設計",
    "AP製造",
    "プログラムテスト（単体テスト)",
    "AP結合テスト",
    "システムテスト",
    "システム受入支援・移行",
    "運用保守",
  ];

  const deliverables = [
    "基本構想書",
    "要件定義書",
    "外部設計書",
    "内部設計書",
    "プログラム",
    "単体テスト仕様書",
    "単体テスト結果報告書",
    "結合テスト仕様書",
    "結合テスト結果報告書",
    "システムテスト仕様書",
    "システムテスト結果報告書",
    "受入テスト仕様書",
    "受入テスト結果報告書",
    "移行計画書",
    "移行手順書",
    "移行結果報告書",
    "運用手順書",
    "保守手順書",
    "操作マニュアル",
    "システム管理者マニュアル",
    "障害対応手順書",
    "バックアップ・リストア手順書",
    "セキュリティ設定書",
    "性能測定結果報告書",
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkItemAdd = (item: string) => {
    if (!selectedWorkItems.includes(item)) {
      setSelectedWorkItems(prev => [...prev, item]);
    }
  };

  const handleWorkItemRemove = (item: string) => {
    setSelectedWorkItems(prev => prev.filter(i => i !== item));
  };

  const handleDeliverableAdd = (item: string) => {
    if (!selectedDeliverables.includes(item)) {
      setSelectedDeliverables(prev => [...prev, item]);
    }
  };

  const handleDeliverableRemove = (item: string) => {
    setSelectedDeliverables(prev => prev.filter(i => i !== item));
  };

  const handleSave = () => {
    console.log("Saving specification:", {
      ...formData,
      work_items: selectedWorkItems,
      deliverables: selectedDeliverables,
    });
    router.push("/specifications");
  };

  const handleSubmit = () => {
    console.log("Submitting specification:", {
      ...formData,
      work_items: selectedWorkItems,
      deliverables: selectedDeliverables,
    });
    router.push("/specifications");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">新規仕様書作成</h1>
            <p className="text-muted-foreground mt-2">
              プロジェクトの仕様書を作成します
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>
              仕様書の基本的な情報を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spec_number">仕様書番号 *</Label>
                <Input
                  id="spec_number"
                  placeholder="SPEC-001"
                  value={formData.spec_number}
                  onChange={(e) => handleInputChange("spec_number", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimate_copies">見積書部数</Label>
                <Input
                  id="estimate_copies"
                  type="number"
                  min="1"
                  value={formData.estimate_copies}
                  onChange={(e) => handleInputChange("estimate_copies", parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                placeholder="仕様書のタイトルを入力"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="desired_delivery_date">希望納期</Label>
                <Input
                  id="desired_delivery_date"
                  type="date"
                  value={formData.desired_delivery_date}
                  onChange={(e) => handleInputChange("desired_delivery_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_location">納入場所</Label>
                <Input
                  id="delivery_location"
                  placeholder="東京都千代田区..."
                  value={formData.delivery_location}
                  onChange={(e) => handleInputChange("delivery_location", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>作業項目</CardTitle>
            <CardDescription>
              プロジェクトで実施する作業項目を選択してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>作業項目を追加</Label>
              <Select onValueChange={handleWorkItemAdd}>
                <SelectTrigger>
                  <SelectValue placeholder="作業項目を選択" />
                </SelectTrigger>
                <SelectContent>
                  {workItems
                    .filter(item => !selectedWorkItems.includes(item))
                    .map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>選択済み作業項目</Label>
              <div className="flex flex-wrap gap-2">
                {selectedWorkItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => handleWorkItemRemove(item)}
                      className="hover:bg-blue-200 rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>成果物</CardTitle>
            <CardDescription>
              プロジェクトで作成する成果物を選択してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>成果物を追加</Label>
              <Select onValueChange={handleDeliverableAdd}>
                <SelectTrigger>
                  <SelectValue placeholder="成果物を選択" />
                </SelectTrigger>
                <SelectContent>
                  {deliverables
                    .filter(item => !selectedDeliverables.includes(item))
                    .map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>選択済み成果物</Label>
              <div className="flex flex-wrap gap-2">
                {selectedDeliverables.map((item) => (
                  <div
                    key={item}
                    className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => handleDeliverableRemove(item)}
                      className="hover:bg-green-200 rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>詳細情報</CardTitle>
            <CardDescription>
              その他の詳細情報を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="acceptance_conditions">検収条件</Label>
              <Textarea
                id="acceptance_conditions"
                placeholder="検収条件を入力"
                value={formData.acceptance_conditions}
                onChange={(e) => handleInputChange("acceptance_conditions", e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplied_items">支給品</Label>
                <Textarea
                  id="supplied_items"
                  placeholder="支給品を入力"
                  value={formData.supplied_items}
                  onChange={(e) => handleInputChange("supplied_items", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loaned_items">貸与品</Label>
                <Textarea
                  id="loaned_items"
                  placeholder="貸与品を入力"
                  value={formData.loaned_items}
                  onChange={(e) => handleInputChange("loaned_items", e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="applicable_standards">適用規格</Label>
              <Textarea
                id="applicable_standards"
                placeholder="適用規格を入力"
                value={formData.applicable_standards}
                onChange={(e) => handleInputChange("applicable_standards", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="special_notes">特記事項</Label>
              <Textarea
                id="special_notes"
                placeholder="特記事項を入力"
                value={formData.special_notes}
                onChange={(e) => handleInputChange("special_notes", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            下書き保存
          </Button>
          <Button onClick={handleSubmit}>
            <Send className="h-4 w-4 mr-2" />
            提出
          </Button>
        </div>
      </div>
    </div>
  );
}
