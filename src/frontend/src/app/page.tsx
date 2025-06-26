"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            見積依頼システム
          </CardTitle>
          <CardDescription>
            Estimate Request System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => router.push("/login")}
            className="w-full"
          >
            ログイン
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            <p>IT部門向け見積依頼管理システム</p>
            <p>承認ワークフロー機能付き</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
