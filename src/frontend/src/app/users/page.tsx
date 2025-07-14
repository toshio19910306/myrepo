"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const mockUsers = [
    {
      id: "USR-001",
      name: "田中部長",
      email: "tanaka@company.com",
      department: "IT部",
      position: "部長",
      role: "管理者",
      status: "アクティブ",
      lastLogin: "2025-06-26 14:30",
      createdDate: "2024-04-01",
      permissions: ["承認", "見積依頼作成", "ユーザー管理"]
    },
    {
      id: "USR-002",
      name: "佐藤課長",
      email: "sato@company.com",
      department: "IT部",
      position: "課長",
      role: "承認者",
      status: "アクティブ",
      lastLogin: "2025-06-26 16:15",
      createdDate: "2024-04-01",
      permissions: ["承認", "見積依頼作成", "仕様書管理"]
    },
    {
      id: "USR-003",
      name: "山田主任",
      email: "yamada@company.com",
      department: "IT部",
      position: "主任",
      role: "一般ユーザー",
      status: "アクティブ",
      lastLogin: "2025-06-26 17:45",
      createdDate: "2024-05-15",
      permissions: ["見積依頼作成", "仕様書管理"]
    },
    {
      id: "USR-004",
      name: "鈴木係長",
      email: "suzuki@company.com",
      department: "IT部",
      position: "係長",
      role: "一般ユーザー",
      status: "休職中",
      lastLogin: "2025-06-20 10:30",
      createdDate: "2024-06-01",
      permissions: ["見積依頼作成", "仕様書管理"]
    }
  ];

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "アクティブ": return "text-green-600 bg-green-50";
      case "休職中": return "text-yellow-600 bg-yellow-50";
      case "退職": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "管理者": return "text-purple-600 bg-purple-50";
      case "承認者": return "text-blue-600 bg-blue-50";
      case "一般ユーザー": return "text-gray-600 bg-gray-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            ユーザー管理
          </h1>
          <p className="text-muted-foreground">
            システムユーザーの管理・権限設定・部門職位管理
          </p>
        </header>

        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="ユーザーを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2 ml-4">
            <Button variant="outline">
              CSVエクスポート
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              新規ユーザー作成
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {user.id} • {user.email} • 登録日: {user.createdDate}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">部門</h4>
                    <p className="text-sm">{user.department}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">職位</h4>
                    <p className="text-sm">{user.position}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">最終ログイン</h4>
                    <p className="text-sm">{user.lastLogin}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">権限数</h4>
                    <p className="text-sm">{user.permissions.length}個</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">権限</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.permissions.map((permission, index) => (
                      <span key={index} className="px-2 py-1 bg-muted rounded text-xs">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    最終アクティビティ: {Math.ceil((new Date().getTime() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60))}時間前
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      詳細表示
                    </Button>
                    <Button variant="outline" size="sm">
                      編集
                    </Button>
                    <Button variant="outline" size="sm">
                      権限設定
                    </Button>
                    {user.status === "アクティブ" && (
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        無効化
                      </Button>
                    )}
                    {user.status !== "アクティブ" && (
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        有効化
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">検索条件に一致するユーザーが見つかりません。</p>
          </div>
        )}
      </div>
    </div>
  );
}
