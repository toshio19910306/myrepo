"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            見積依頼システム ダッシュボード
          </h1>
          <p className="text-muted-foreground">
            IT部門向け見積依頼管理システム
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                進行中の見積依頼
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">12</div>
              <p className="text-xs text-muted-foreground">
                前月比 +2件
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                承認待ち
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">5</div>
              <p className="text-xs text-muted-foreground">
                要対応
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                完了済み
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">28</div>
              <p className="text-xs text-muted-foreground">
                今月完了
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                会社数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">
                登録済み
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>最近の見積依頼</CardTitle>
                <CardDescription>
                  最新の見積依頼状況
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { id: "REQ-001", title: "新システム開発", status: "承認待ち", date: "2025-06-25" },
                    { id: "REQ-002", title: "インフラ構築", status: "進行中", date: "2025-06-24" },
                    { id: "REQ-003", title: "セキュリティ監査", status: "完了", date: "2025-06-23" },
                  ].map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-muted-foreground">{request.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{request.status}</p>
                        <p className="text-xs text-muted-foreground">{request.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>承認履歴</CardTitle>
                <CardDescription>
                  最近の承認アクション
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: "承認", user: "管理者A", dept: "IT部", date: "2025-06-26 10:30" },
                    { action: "上程", user: "管理者B", dept: "IT部", date: "2025-06-26 09:15" },
                    { action: "申請", user: "管理者C", dept: "IT部", date: "2025-06-25 16:45" },
                  ].map((history, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{history.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {history.user} ({history.dept})
                        </p>
                        <p className="text-xs text-muted-foreground">{history.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Button className="bg-primary hover:bg-primary/90" onClick={() => window.location.href = '/requests'}>
            新規見積依頼作成
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/approvals'}>
            承認履歴詳細
          </Button>
          <Button variant="outline">
            レポート出力
          </Button>
        </div>
      </div>
    </div>
  );
}
