"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function FilesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const mockFiles = [
    {
      id: "FILE-001",
      name: "新システム開発仕様書.pdf",
      size: "2.5MB",
      type: "PDF",
      uploadedBy: "山田主任",
      uploadedDate: "2025-06-25 16:45",
      relatedTo: "REQ-001",
      relatedType: "見積依頼",
      downloads: 12,
      status: "アクティブ"
    },
    {
      id: "FILE-002",
      name: "インフラ構築計画書.xlsx",
      size: "1.8MB",
      type: "Excel",
      uploadedBy: "佐藤課長",
      uploadedDate: "2025-06-24 14:30",
      relatedTo: "SPEC-002",
      relatedType: "仕様書",
      downloads: 8,
      status: "アクティブ"
    },
    {
      id: "FILE-003",
      name: "セキュリティ監査要項.docx",
      size: "890KB",
      type: "Word",
      uploadedBy: "鈴木係長",
      uploadedDate: "2025-06-23 11:20",
      relatedTo: "RES-003",
      relatedType: "見積回答",
      downloads: 5,
      status: "アクティブ"
    },
    {
      id: "FILE-004",
      name: "旧システム設計書.pdf",
      size: "4.2MB",
      type: "PDF",
      uploadedBy: "田中部長",
      uploadedDate: "2025-06-20 09:15",
      relatedTo: "-",
      relatedType: "アーカイブ",
      downloads: 2,
      status: "アーカイブ"
    }
  ];

  const filteredFiles = mockFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.relatedTo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case "PDF": return "📄";
      case "Excel": return "📊";
      case "Word": return "📝";
      case "PowerPoint": return "📋";
      case "CSV": return "📈";
      default: return "📎";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "アクティブ": return "text-green-600 bg-green-50";
      case "アーカイブ": return "text-gray-600 bg-gray-50";
      case "削除済み": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            ファイル管理
          </h1>
          <p className="text-muted-foreground">
            見積依頼・回答・仕様書関連ファイルの管理・アップロード・ダウンロード
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>ファイルアップロード</CardTitle>
              <CardDescription>
                ドラッグ&ドロップまたはクリックしてファイルを選択
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="text-4xl mb-4">📁</div>
                <p className="text-lg font-medium mb-2">ファイルをここにドロップ</p>
                <p className="text-sm text-muted-foreground mb-4">
                  または <Button variant="link" className="p-0 h-auto">クリックして選択</Button>
                </p>
                <p className="text-xs text-muted-foreground">
                  対応形式: PDF, Word, Excel, PowerPoint, CSV, TXT (最大10MB)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ストレージ使用量</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>使用量</span>
                    <span>2.1GB / 10GB</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "21%" }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">総ファイル数</p>
                    <p className="font-medium">247</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">今月アップロード</p>
                    <p className="font-medium">18</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="ファイルを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2 ml-4">
            <Button variant="outline">
              フィルター
            </Button>
            <Button variant="outline">
              一括ダウンロード
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              手動アップロード
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{getFileIcon(file.type)}</div>
                    <div>
                      <h4 className="font-medium">{file.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {file.size} • {file.uploadedBy} • {file.uploadedDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{file.relatedType}</p>
                      <p className="text-xs text-muted-foreground">{file.relatedTo}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
                      {file.status}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        ダウンロード
                      </Button>
                      <Button variant="outline" size="sm">
                        詳細
                      </Button>
                      {file.status === "アクティブ" && (
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          削除
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  ダウンロード数: {file.downloads}回
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">検索条件に一致するファイルが見つかりません。</p>
          </div>
        )}
      </div>
    </div>
  );
}
