"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Building } from "lucide-react";

interface Vendor {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  company_name?: string;
  department?: string;
  position?: string;
  is_active: boolean;
  created_at: string;
}

interface VendorFormData {
  company_name: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<VendorFormData>({
    company_name: "",
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users?user_type=VENDOR`);
      if (response.ok) {
        const apiResponse = await response.json();
        if (apiResponse.success && Array.isArray(apiResponse.data)) {
          setVendors(apiResponse.data);
        } else {
          setVendors([]);
        }
      } else {
        setError("ベンダー一覧の取得に失敗しました");
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError("ベンダー一覧の取得中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof VendorFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const url = editingVendor 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/${editingVendor.user_id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users`;
      
      const method = editingVendor ? "PUT" : "POST";
      const payload = {
        company_name: formData.company_name,
        user_type: "VENDOR",
        username: formData.company_name.toLowerCase().replace(/\s+/g, '_'),
        email: `${formData.company_name.toLowerCase().replace(/\s+/g, '_')}@vendor.local`,
        full_name: formData.company_name,
        ...(editingVendor ? {} : { password: "defaultpassword123" })
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setEditingVendor(null);
        resetForm();
        await fetchVendors();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "ベンダーの保存に失敗しました");
      }
    } catch (err) {
      console.error('Error saving vendor:', err);
      setError("ベンダーの保存中にエラーが発生しました");
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      company_name: vendor.company_name || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (vendorId: number) => {
    if (!confirm("このベンダーを削除してもよろしいですか？")) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/${vendorId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchVendors();
      } else {
        setError("ベンダーの削除に失敗しました");
      }
    } catch (err) {
      console.error('Error deleting vendor:', err);
      setError("ベンダーの削除中にエラーが発生しました");
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: "",
    });
  };

  const openCreateDialog = () => {
    setEditingVendor(null);
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ベンダー管理</h1>
            <p className="text-gray-600">ベンダー情報の登録・管理を行います</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                新規ベンダー登録
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingVendor ? "ベンダー編集" : "新規ベンダー登録"}</DialogTitle>
                <DialogDescription>
                  ベンダーの基本情報を入力してください
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="company_name">ベンダー名 <span className="text-red-500">*</span></Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange("company_name", e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingVendor ? "更新" : "登録"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">ベンダー一覧</CardTitle>
            <CardDescription>登録されているベンダーの一覧です</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">読み込み中...</p>
              </div>
            ) : vendors.length === 0 ? (
              <div className="text-center py-8">
                <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">ベンダーが登録されていません</h3>
                <p className="text-gray-600 mb-4">新規ベンダーを登録してください。</p>
                <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  新規ベンダー登録
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ベンダー名</TableHead>
                      <TableHead>担当者名</TableHead>
                      <TableHead>担当者部署</TableHead>
                      <TableHead>担当者役職</TableHead>
                      <TableHead>メールアドレス</TableHead>
                      <TableHead>登録日</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((vendor) => (
                      <TableRow key={vendor.user_id}>
                        <TableCell className="font-medium">
                          {vendor.company_name || "-"}
                        </TableCell>
                        <TableCell>{vendor.full_name}</TableCell>
                        <TableCell>{vendor.department || "-"}</TableCell>
                        <TableCell>{vendor.position || "-"}</TableCell>
                        <TableCell>{vendor.email}</TableCell>
                        <TableCell>{new Date(vendor.created_at).toLocaleDateString("ja-JP")}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(vendor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(vendor.user_id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
