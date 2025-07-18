'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  department?: string;
  position?: string;
  user_type: string;
  company_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  department?: string;
  position?: string;
  user_type: string;
  company_name?: string;
}

interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  department?: string;
  position?: string;
  user_type?: string;
  company_name?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    department: '',
    position: '',
    user_type: 'user',
    company_name: '',
  });

  const [updateFormData, setUpdateFormData] = useState<UpdateUserRequest>({
    full_name: '',
    email: '',
    department: '',
    position: '',
    user_type: '',
    company_name: '',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users?page=1&limit=50');
      
      if (!response.ok) {
        throw new Error('ユーザー一覧の取得に失敗しました');
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setUsers(result.data);
      } else {
        throw new Error('データの形式が正しくありません');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'ユーザーの作成に失敗しました');
      }

      setCreateSuccess(true);
      setShowCreateForm(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        department: '',
        position: '',
        user_type: 'user',
        company_name: '',
      });
      
      await fetchUsers();
      
      setTimeout(() => setCreateSuccess(false), 3000);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setCreateLoading(false);
    }
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
        body: JSON.stringify(updateFormData),
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

  const handleShowUpdateModal = (user: User) => {
    setSelectedUser(user);
    setUpdateFormData({
      full_name: user.full_name,
      email: user.email,
      department: user.department || '',
      position: user.position || '',
      user_type: user.user_type,
      company_name: user.company_name || '',
    });
    setShowUpdateModal(true);
  };

  const handleInputChange = (field: keyof CreateUserRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateInputChange = (field: keyof UpdateUserRequest, value: string) => {
    setUpdateFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'admin': return '管理者';
      case 'approver': return '承認者';
      case 'user': return '一般ユーザー';
      default: return type;
    }
  };

  const getUserTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'admin': return 'destructive';
      case 'approver': return 'default';
      case 'user': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ユーザー管理</h1>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-[#82A0AA] hover:bg-[#6B8A94] text-white"
        >
          新規ユーザー作成
        </Button>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {createSuccess && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            ユーザーが正常に作成されました
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

      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>新規ユーザー作成</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">ユーザー名 *</Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">メールアドレス *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">パスワード *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="full_name">氏名 *</Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="department">部署</Label>
                  <Input
                    id="department"
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="position">役職</Label>
                  <Input
                    id="position"
                    type="text"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="user_type">ユーザータイプ *</Label>
                  <Select value={formData.user_type} onValueChange={(value) => handleInputChange('user_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">一般ユーザー</SelectItem>
                      <SelectItem value="approver">承認者</SelectItem>
                      <SelectItem value="admin">管理者</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="company_name">会社名</Label>
                  <Input
                    id="company_name"
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                  />
                </div>
              </div>

              {createError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {createError}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createLoading}
                  className="bg-[#82A0AA] hover:bg-[#6B8A94] text-white"
                >
                  {createLoading ? '作成中...' : '作成'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateError(null);
                  }}
                >
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ユーザー一覧</CardTitle>
        </CardHeader>
        <CardContent>
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
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>{user.user_id}</TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>{user.position || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getUserTypeBadgeVariant(user.user_type)}>
                      {getUserTypeLabel(user.user_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.company_name || '-'}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                  </TableCell>
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
                        onClick={() => handleShowUpdateModal(user)}
                      >
                        更新
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
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
        </CardContent>
      </Card>

      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">ユーザー詳細</h2>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedUser(null);
                }}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">ユーザーID</Label>
                  <p className="text-sm mt-1">{selectedUser.user_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">ユーザー名</Label>
                  <p className="text-sm mt-1">{selectedUser.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">氏名</Label>
                  <p className="text-sm mt-1">{selectedUser.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">メールアドレス</Label>
                  <p className="text-sm mt-1">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">部署</Label>
                  <p className="text-sm mt-1">{selectedUser.department || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">役職</Label>
                  <p className="text-sm mt-1">{selectedUser.position || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">ユーザータイプ</Label>
                  <p className="text-sm mt-1">
                    <Badge variant={getUserTypeBadgeVariant(selectedUser.user_type)}>
                      {getUserTypeLabel(selectedUser.user_type)}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">会社名</Label>
                  <p className="text-sm mt-1">{selectedUser.company_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">ステータス</Label>
                  <p className="text-sm mt-1">
                    <Badge variant={selectedUser.is_active ? 'default' : 'destructive'}>
                      {selectedUser.is_active ? 'アクティブ' : '無効'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">作成日</Label>
                  <p className="text-sm mt-1">{new Date(selectedUser.created_at).toLocaleString('ja-JP')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">更新日</Label>
                  <p className="text-sm mt-1">{new Date(selectedUser.updated_at).toLocaleString('ja-JP')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUpdateModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">ユーザー情報更新</h2>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedUser(null);
                  setUpdateError(null);
                }}
              >
                ×
              </Button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="update_full_name">氏名 *</Label>
                  <Input
                    id="update_full_name"
                    type="text"
                    value={updateFormData.full_name}
                    onChange={(e) => handleUpdateInputChange('full_name', e.target.value)}
                    required
                  />
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
                  <Label htmlFor="update_department">部署</Label>
                  <Input
                    id="update_department"
                    type="text"
                    value={updateFormData.department}
                    onChange={(e) => handleUpdateInputChange('department', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="update_position">役職</Label>
                  <Input
                    id="update_position"
                    type="text"
                    value={updateFormData.position}
                    onChange={(e) => handleUpdateInputChange('position', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="update_user_type">ユーザータイプ *</Label>
                  <Select value={updateFormData.user_type} onValueChange={(value) => handleUpdateInputChange('user_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">一般ユーザー</SelectItem>
                      <SelectItem value="approver">承認者</SelectItem>
                      <SelectItem value="admin">管理者</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="update_company_name">会社名</Label>
                  <Input
                    id="update_company_name"
                    type="text"
                    value={updateFormData.company_name}
                    onChange={(e) => handleUpdateInputChange('company_name', e.target.value)}
                  />
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
  );
}
