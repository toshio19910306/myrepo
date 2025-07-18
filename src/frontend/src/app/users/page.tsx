"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import dynamic from 'next/dynamic';

interface NewUser {
  userId: string;
  fullName: string;
  department: string;
  position: string;
  permissions: string[];
}

interface ApiUser {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  department: string | null;
  position: string | null;
  user_type: string;
  company_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    userId: "",
    fullName: "",
    department: "",
    position: "",
    permissions: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users`);
      if (response.ok) {
        const apiResponse = await response.json();
        if (apiResponse.success && Array.isArray(apiResponse.data)) {
          setUsers(apiResponse.data);
        }
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchUsers();
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }


  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.position && user.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  const availablePermissions = [
    "仕様書管理",
    "見積依頼", 
    "見積回答",
    "承認管理",
    "ユーザー管理"
  ];

  const handleCreateUser = () => {
    setShowCreateModal(true);
  };

  const handleSaveUser = async () => {
    if (!newUser.userId || !newUser.fullName) {
      alert("ユーザーIDと姓名は必須項目です。");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newUser.userId,
          full_name: newUser.fullName,
          department: newUser.department,
          position: newUser.position,
          permissions: newUser.permissions,
          email: `${newUser.userId}@company.com`,
          user_type: "IT",
          password: "defaultPassword123"
        }),
      });

      if (response.ok) {
        setNewUser({
          userId: "",
          fullName: "",
          department: "",
          position: "",
          permissions: []
        });
        setShowCreateModal(false);
        alert("新規ユーザーが正常に作成されました。");
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(`ユーザー作成に失敗しました: ${errorData.error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error creating user:', err);
      alert('ユーザー作成中にエラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setNewUser({
      userId: "",
      fullName: "",
      department: "",
      position: "",
      permissions: []
    });
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setNewUser(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
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
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={handleCreateUser}
            >
              新規ユーザー作成
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">ユーザーを読み込み中...</p>
          </div>
        )}

        {!isLoading && (
          <div className="grid gap-6">
            {filteredUsers.map((user) => (
              <Card key={user.user_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{user.full_name}</CardTitle>
                      <CardDescription className="mt-1">
                        {user.username} • {user.email} • 登録日: {new Date(user.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.is_active ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                        {user.is_active ? 'アクティブ' : '無効'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.user_type === 'ADMIN' ? 'text-purple-600 bg-purple-50' : 'text-gray-600 bg-gray-50'}`}>
                        {user.user_type === 'ADMIN' ? '管理者' : '一般ユーザー'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">部門</h4>
                      <p className="text-sm">{user.department || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">職位</h4>
                      <p className="text-sm">{user.position || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">ユーザータイプ</h4>
                      <p className="text-sm">{user.user_type}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">会社名</h4>
                      <p className="text-sm">{user.company_name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      更新日: {new Date(user.updated_at).toLocaleDateString()}
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
                      {user.is_active && (
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          無効化
                        </Button>
                      )}
                      {!user.is_active && (
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
        )}

        {!isLoading && filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">検索条件に一致するユーザーが見つかりません。</p>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-primary mb-6">新規ユーザー作成</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userId" className="text-sm font-medium">
                    ユーザーID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="userId"
                    type="text"
                    value={newUser.userId}
                    onChange={(e) => setNewUser(prev => ({ ...prev, userId: e.target.value }))}
                    placeholder="ユーザーIDを入力"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    ユーザー姓名 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="姓名を入力"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="department" className="text-sm font-medium">
                    部門
                  </Label>
                  <Input
                    id="department"
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="部門を入力"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="position" className="text-sm font-medium">
                    職位
                  </Label>
                  <Input
                    id="position"
                    type="text"
                    value={newUser.position}
                    onChange={(e) => setNewUser(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="職位を入力"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">権限</Label>
                  <div className="mt-2 space-y-2">
                    {availablePermissions.map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={newUser.permissions.includes(permission)}
                          onCheckedChange={(checked: boolean) => handlePermissionChange(permission, checked)}
                        />
                        <Label htmlFor={permission} className="text-sm">
                          {permission}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={handleCancelCreate}
                  disabled={isSubmitting}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleSaveUser}
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? "作成中..." : "保存"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(UsersPage), {
  ssr: false
});
