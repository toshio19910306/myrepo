"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ApprovalsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const mockApprovals = [
    {
      id: "APP-001",
      type: "見積依頼",
      title: "新システム開発見積依頼",
      requestId: "REQ-001",
      requester: "山田主任",
      department: "IT部",
      currentStep: 2,
      totalSteps: 3,
      currentApprover: "田中部長",
      status: "承認待ち",
      submittedDate: "2025-06-25",
      dueDate: "2025-06-30",
      amount: "5,000,000円",
      history: [
        { step: 1, action: "申請", user: "山田主任", date: "2025-06-25 16:45", status: "完了" },
        { step: 2, action: "上程", user: "佐藤課長", date: "2025-06-26 09:15", status: "完了" },
        { step: 3, action: "承認", user: "田中部長", date: "-", status: "待機中" }
      ]
    },
    {
      id: "APP-002",
      type: "見積回答",
      title: "インフラ構築見積回答",
      requestId: "RES-002",
      requester: "佐藤課長",
      department: "IT部",
      currentStep: 1,
      totalSteps: 2,
      currentApprover: "田中部長",
      status: "承認待ち",
      submittedDate: "2025-06-26",
      dueDate: "2025-07-01",
      amount: "2,900,000円",
      history: [
        { step: 1, action: "申請", user: "佐藤課長", date: "2025-06-26 14:30", status: "完了" },
        { step: 2, action: "承認", user: "田中部長", date: "-", status: "待機中" }
      ]
    },
    {
      id: "APP-003",
      type: "仕様書",
      title: "セキュリティ監査仕様書",
      requestId: "SPEC-003",
      requester: "鈴木係長",
      department: "IT部",
      currentStep: 3,
      totalSteps: 3,
      currentApprover: "-",
      status: "承認済み",
      submittedDate: "2025-06-24",
      dueDate: "2025-06-29",
      amount: "1,200,000円",
      history: [
        { step: 1, action: "申請", user: "鈴木係長", date: "2025-06-24 10:00", status: "完了" },
        { step: 2, action: "上程", user: "佐藤課長", date: "2025-06-24 15:30", status: "完了" },
        { step: 3, action: "承認", user: "田中部長", date: "2025-06-25 11:15", status: "完了" }
      ]
    }
  ];

  const filteredApprovals = mockApprovals.filter(approval =>
    approval.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    approval.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    approval.requester.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            多段階承認プロセスの管理・追跡・実行
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
            <Button variant="outline">
              一括承認
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              承認設定
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredApprovals.map((approval) => (
            <Card key={approval.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{approval.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {approval.id} • {approval.type} • 申請者: {approval.requester} ({approval.department})
                    </CardDescription>
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
                    <p className="text-sm">{approval.submittedDate}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">期限</h4>
                    <p className="text-sm">{approval.dueDate}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-sm text-muted-foreground mb-3">承認フロー進捗</h4>
                  <div className="flex items-center space-x-4">
                    {approval.history.map((step, index) => (
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

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    進捗: {approval.currentStep}/{approval.totalSteps} • 
                    現在の承認者: {approval.currentApprover}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      詳細表示
                    </Button>
                    <Button variant="outline" size="sm">
                      履歴表示
                    </Button>
                    {approval.status === "承認待ち" && (
                      <>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                          承認
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          差し戻し
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredApprovals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">検索条件に一致する承認案件が見つかりません。</p>
          </div>
        )}
      </div>
    </div>
  );
}
