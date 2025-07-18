'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from "../../components/ui/checkbox";

interface NewUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  permissions: string[];
}

interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  department?: string;
  position?: string;
  permissions?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  position?: string;
  permissions?: string[];
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    userId: "",
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    position: "",
    permissions: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const [updateFormData, setUpdateFormData] = useState<UpdateUserRequest>({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    permissions: [],
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users from API...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Response status:', response.status);
      if (response.ok) {
        const apiResponse = await response.json();
        console.log('API Response:', apiResponse);
        if (apiResponse.success && Array.isArray(apiResponse.data)) {
          setUsers(apiResponse.data);
          console.log('Users set:', apiResponse.data.length);
        }
      } else {
        console.error('Failed to fetch users, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetail = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        throw new Error('ユーザー詳細の取得に失敗しました');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setSelectedUser(result.data);
        setShowDetailModal(true);
      } else {
        throw new Error('ユーザーが見つかりません');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
    if (!newUser.userId || !newUser.firstName || !newUser.lastName || !newUser.email) {
      alert("ユーザーID、姓、名、メールアドレスは必須項目です。");
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
          full_name: `${newUser.lastName} ${newUser.firstName}`,
          department: newUser.department,
          position: newUser.position,
          permissions: newUser.permissions,
          email: newUser.email,
          password: "defaultPassword123"
        }),
      });

      if (response.ok) {
        setNewUser({
          userId: "",
          firstName: "",
          lastName: "",
          email: "",
          department: "",
          position: "",
          permissions: []
        });
        setShowCreateModal(false);
        alert("新規ユーザーが正常に作成されました。");
        await fetchUsers();
      }else {
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
      firstName: "",
      lastName: "",
      email: "",
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

  const handleUpdatePermissionChange = (permission: string, checked: boolean) => {
    setUpdateFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...(prev.permissions || []), permission]
        : (prev.permissions || []).filter(p => p !== permission)
    }));
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setUpdateLoading(true);
    setUpdateError(null);

    try {
      const response = await fetch(`/api/users/${selectedUser.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: updateFormData.firstName && updateFormData.lastName 
            ? `${updateFormData.lastName} ${updateFormData.firstName}` 
            : undefined,
          email: updateFormData.email,
          department: updateFormData.department,
          position: updateFormData.position,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'ユーザーの更新に失敗しました');
      }

      setUpdateSuccess(true);
      setShowUpdateModal(false);
      setSelectedUser(null);
      
      await fetchUsers();
      
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('このユーザーを削除してもよろしいですか？')) {
      return;
    }

    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'ユーザーの削除に失敗しました');
      }

      setDeleteSuccess(true);
      await fetchUsers();
      
      setTimeout(() => setDeleteSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateInputChange = (field: keyof UpdateUserRequest, value: string) => {
    setUpdateFormData(prev => ({ ...prev, [field]: value }));
  };

  const openUpdateModal = (user: User) => {
    setSelectedUser(user);
    const nameParts = user.full_name.split(' ');
    setUpdateFormData({
      firstName: nameParts[1] || '',
      lastName: nameParts[0] || '',
      email: user.email,
      department: user.department || '',
      position: user.position || '',
      permissions: user.permissions || [],
    });
    setShowUpdateModal(true);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#82A0AA] mb-2">
            ユーザー管理
          </h1>
          <p className="text-muted-foreground">
            システムユーザーの管理・権限設定・部門職位管理
          </p>
        </header>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}


        {updateSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              ユーザー情報が正常に更新されました
            </AlertDescription>
          </Alert>
        )}

        {deleteSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              ユーザーが正常に削除されました
            </AlertDescription>
          </Alert>
        )}

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
              className="bg-[#82A0AA] hover:bg-[#6B8A94] text-white"
              onClick={handleCreateUser}
            >
              新規ユーザー作成
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ユーザー一覧</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p>読み込み中...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>ユーザー名</TableHead>
                    <TableHead>氏名</TableHead>
                    <TableHead>メールアドレス</TableHead>
                    <TableHead>部署</TableHead>
                    <TableHead>役職</TableHead>
                    <TableHead>ユーザータイプ</TableHead>
                    <TableHead>会社名</TableHead>
                    <TableHead>作成日</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>{user.user_id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>{user.position || '-'}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => fetchUserDetail(user.user_id)}
                          >
                            詳細
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openUpdateModal(user)}
                          >
                            更新
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteUser(user.user_id)}
                            disabled={deleteLoading}
                          >
                            削除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* 新規作成フォーム */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-[#82A0AA] mb-6">新規ユーザー作成</h2>
              
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      姓 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="姓を入力"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      名 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="名を入力"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    メールアドレス <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="メールアドレスを入力"
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
                  className="bg-[#82A0AA] hover:bg-[#6B8A94] text-white"
                >
                  {isSubmitting ? "作成中..." : "保存"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 詳細表示モーダル */}
        {showDetailModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-[#82A0AA] mb-6">ユーザー詳細</h2>
              
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">ユーザーID</Label>
                  <p className="mt-1 p-2 bg-gray-50 rounded">{selectedUser.username}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">姓</Label>
                    <p className="mt-1 p-2 bg-gray-50 rounded">{selectedUser.full_name?.split(' ')[0] || '-'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">名</Label>
                    <p className="mt-1 p-2 bg-gray-50 rounded">{selectedUser.full_name?.split(' ')[1] || '-'}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="font-medium">メールアドレス</Label>
                  <p className="mt-1 p-2 bg-gray-50 rounded">{selectedUser.email}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">部門</Label>
                    <p className="mt-1 p-2 bg-gray-50 rounded">{selectedUser.department || '-'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">職位</Label>
                    <p className="mt-1 p-2 bg-gray-50 rounded">{selectedUser.position || '-'}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="font-medium">権限</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <div className="flex flex-wrap gap-2">
                      {availablePermissions.map((permission) => (
                        <Badge 
                          key={permission} 
                          variant={(selectedUser.permissions || []).includes(permission) ? 'default' : 'secondary'}
                        >
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">作成日</Label>
                    <p className="mt-1 p-2 bg-gray-50 rounded">{new Date(selectedUser.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="font-medium">更新日</Label>
                    <p className="mt-1 p-2 bg-gray-50 rounded">{new Date(selectedUser.updated_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="font-medium">ステータス</Label>
                  <p className="mt-1 p-2 bg-gray-50 rounded">
                    <Badge variant={selectedUser.is_active ? 'default' : 'secondary'}>
                      {selectedUser.is_active ? 'アクティブ' : '無効'}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button 
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedUser(null);
                  }}
                  variant="outline"
                >
                  閉じる
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 更新フォーム */}
        {showUpdateModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-[#82A0AA] mb-6">ユーザー情報更新</h2>
              
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="update_lastName">姓 *</Label>
                    <Input
                      id="update_lastName"
                      type="text"
                      value={updateFormData.lastName}
                      onChange={(e) => handleUpdateInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="update_firstName">名 *</Label>
                    <Input
                      id="update_firstName"
                      type="text"
                      value={updateFormData.firstName}
                      onChange={(e) => handleUpdateInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="update_email">メールアドレス *</Label>
                  <Input
                    id="update_email"
                    type="email"
                    value={updateFormData.email}
                    onChange={(e) => handleUpdateInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="update_department">部門</Label>
                  <Input
                    id="update_department"
                    type="text"
                    value={updateFormData.department}
                    onChange={(e) => handleUpdateInputChange('department', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="update_position">職位</Label>
                  <Input
                    id="update_position"
                    type="text"
                    value={updateFormData.position}
                    onChange={(e) => handleUpdateInputChange('position', e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">権限</Label>
                  <div className="mt-2 space-y-2">
                    {availablePermissions.map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={`update_${permission}`}
                          checked={(updateFormData.permissions || []).includes(permission)}
                          onCheckedChange={(checked: boolean) => handleUpdatePermissionChange(permission, checked)}
                        />
                        <Label htmlFor={`update_${permission}`} className="text-sm">
                          {permission}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {updateError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      {updateError}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={updateLoading}
                    className="bg-[#82A0AA] hover:bg-[#6B8A94] text-white"
                  >
                    {updateLoading ? '更新中...' : '更新'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowUpdateModal(false);
                      setSelectedUser(null);
                      setUpdateError(null);
                    }}
                  >
                    キャンセル
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
