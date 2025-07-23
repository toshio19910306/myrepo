"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";

const navigationItems = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/specifications", label: "仕様書管理" },
  { href: "/requests", label: "見積依頼" },
  { href: "/responses", label: "見積回答" },
  { href: "/approvals", label: "承認管理" },
  { href: "/users", label: "ユーザー管理" },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useUser();

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              見積依頼システム
            </Link>
            <div className="hidden md:flex space-x-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                logout();
                router.push('/login');
              }}
            >
              ログアウト
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
