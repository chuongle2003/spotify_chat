"use client"

import { use, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Pencil, Trash2, Search, UserPlus, Shield, ShieldAlert, MoreHorizontal } from "lucide-react"
import { accountsApi } from "@/lib/api"
import type { User } from "@/types"
import Image from "next/image"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    created_at: "",
    is_staff: false,
    is_active: true,
  })

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const data = await accountsApi.getUsers_ad()
        setUsers(data as User[])
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleAddUser = async () => {
    try {
      // Validate form
      if (!newUser.username || !newUser.email || !newUser.password) {
        alert("Vui lòng điền đầy đủ thông tin bắt buộc")
        return
      }

      // Call API to create user
      const createdUser = await accountsApi.createUser(newUser)

      // Update users list
      setUsers([...users, createdUser as User])

      // Reset form and close dialog
      setNewUser({
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        created_at: "",
        is_staff: false,
        is_active: true,
      })
      setIsAddUserOpen(false)
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Có lỗi xảy ra khi tạo người dùng")
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      // Call API to update user
      const updatedUser = await accountsApi.updateUser(selectedUser.id, selectedUser)

      // Update users list
      setUsers(users.map((user) => (user.id === selectedUser.id ? (updatedUser as User) : user)))

      // Reset and close dialog
      setSelectedUser(null)
      setIsEditUserOpen(false)
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Có lỗi xảy ra khi cập nhật người dùng")
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      // Call API to delete user
      await accountsApi.deleteUser(selectedUser.id)

      // Update users list
      setUsers(users.filter((user) => user.id !== selectedUser.id))

      // Reset and close dialog
      setSelectedUser(null)
      setIsDeleteUserOpen(false)
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Có lỗi xảy ra khi xóa người dùng")
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
        <Button onClick={() => setIsAddUserOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Thêm người dùng
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Tìm kiếm người dùng..."
            className="pl-10 bg-zinc-800 border-zinc-700 text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-zinc-800 rounded-md border border-zinc-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-zinc-700/50">
              <TableHead className="text-zinc-400">Người dùng</TableHead>
              <TableHead className="text-zinc-400">Email</TableHead>
              <TableHead className="text-zinc-400">Ngày tạo</TableHead>
              <TableHead className="text-zinc-400 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-zinc-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-zinc-500">
                  Không tìm thấy người dùng nào
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-zinc-700/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src={user.profile_image || "/placeholder.svg?height=40&width=40"}
                        width={40}
                        height={40}
                        alt={user.username}
                        className="rounded-full"
                      />
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-xs text-zinc-400">
                          {user.first_name} {user.last_name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs w-fit ${user.is_admin ? "bg-purple-500/20 text-purple-500" : "bg-green-500/20 text-green-500"}`}
                    >
                      {user.created_at}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {user.id !== currentUser?.id && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user)
                            setIsEditUserOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-zinc-800 border-zinc-700 text-white">
                            <DropdownMenuItem
                              className="cursor-pointer flex items-center gap-2"
                              onClick={async () => {
                                try {
                                  await accountsApi.toggleUserActive(user.id);
                                  // Cập nhật danh sách người dùng
                                  setUsers(users.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
                                } catch (error) {
                                  console.error("Error toggling user active state:", error);
                                  alert("Có lỗi xảy ra khi thay đổi trạng thái người dùng");
                                }
                              }}
                            >
                              {user.is_active ? (
                                <>
                                  <ShieldAlert className="h-4 w-4 text-red-500" />
                                  <span>Vô hiệu hóa tài khoản</span>
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 text-green-500" />
                                  <span>Kích hoạt tài khoản</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer flex items-center gap-2"
                              onClick={async () => {
                                try {
                                  await accountsApi.toggleUserAdmin(user.id);
                                  // Cập nhật danh sách người dùng
                                  setUsers(users.map(u => u.id === user.id ? { ...u, is_admin: !u.is_admin } : u));
                                } catch (error) {
                                  console.error("Error toggling user admin state:", error);
                                  alert("Có lỗi xảy ra khi thay đổi quyền admin");
                                }
                              }}
                            >
                              {user.is_admin ? (
                                <>
                                  <Shield className="h-4 w-4 text-yellow-500" />
                                  <span>Thu hồi quyền Admin</span>
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 text-green-500" />
                                  <span>Cấp quyền Admin</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-700" />
                            <DropdownMenuItem
                              className="text-red-500 cursor-pointer flex items-center gap-2"
                              onClick={() => {
                                setSelectedUser(user)
                                setIsDeleteUserOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Xóa người dùng</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle>Thêm người dùng mới</DialogTitle>
            <DialogDescription className="text-zinc-400">Điền thông tin để tạo người dùng mới</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Tên người dùng <span className="text-red-500">*</span>
                </label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="first_name" className="text-sm font-medium">
                  Tên
                </label>
                <Input
                  id="first_name"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="last_name" className="text-sm font-medium">
                  Họ
                </label>
                <Input
                  id="last_name"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_staff"
                  checked={newUser.is_staff}
                  onCheckedChange={(checked) => setNewUser({ ...newUser, is_staff: checked })}
                />
                <Label htmlFor="is_staff">Quyền quản trị (Staff)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={newUser.is_active}
                  onCheckedChange={(checked) => setNewUser({ ...newUser, is_active: checked })}
                />
                <Label htmlFor="is_active">Tài khoản hoạt động</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddUser}>Thêm người dùng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
            <DialogDescription className="text-zinc-400">Cập nhật thông tin người dùng</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit_username" className="text-sm font-medium">
                    Tên người dùng
                  </label>
                  <Input
                    id="edit_username"
                    value={selectedUser.username}
                    onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit_email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit_first_name" className="text-sm font-medium">
                    Tên
                  </label>
                  <Input
                    id="edit_first_name"
                    value={selectedUser.first_name || ""}
                    onChange={(e) => setSelectedUser({ ...selectedUser, first_name: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit_last_name" className="text-sm font-medium">
                    Họ
                  </label>
                  <Input
                    id="edit_last_name"
                    value={selectedUser.last_name || ""}
                    onChange={(e) => setSelectedUser({ ...selectedUser, last_name: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit_is_staff"
                    checked={selectedUser.is_admin}
                    onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, is_admin: checked })}
                  />
                  <Label htmlFor="edit_is_staff">Quyền quản trị (Staff)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit_is_active"
                    checked={selectedUser.is_active}
                    onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, is_active: checked })}
                  />
                  <Label htmlFor="edit_is_active">Tài khoản hoạt động</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleEditUser}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa người dùng</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 bg-zinc-800 rounded-md">
                <Image
                  src={selectedUser.profile_image || "/placeholder.svg?height=60&width=60"}
                  width={60}
                  height={60}
                  alt={selectedUser.username}
                  className="rounded-full"
                />
                <div>
                  <div className="font-medium">{selectedUser.username}</div>
                  <div className="text-sm text-zinc-400">{selectedUser.email}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteUserOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Xóa người dùng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
