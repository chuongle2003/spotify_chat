"use client"

import { useEffect, useState } from "react"
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
import { Pencil, Trash2, Search, Eye } from "lucide-react"
import { musicApi } from "@/lib/api"
import type { Playlist } from "@/types"
import Image from "next/image"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

export default function AdminPlaylistsPage() {
  const router = useRouter()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isEditPlaylistOpen, setIsEditPlaylistOpen] = useState(false)
  const [isDeletePlaylistOpen, setIsDeletePlaylistOpen] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true)
        const data = await musicApi.getPlaylists()
        setPlaylists(data as Playlist[])
      } catch (error) {
        console.error("Error fetching playlists:", error)
        // Fallback to mock data
        setPlaylists([
          {
            id: "1",
            title: "My Playlist #1",
            description: "A collection of my favorite songs",
            cover_image: "/placeholder.svg?height=60&width=60&text=P1",
            created_by: "admin",
            created_at: new Date().toISOString(),
            is_public: true,
            followers_count: 12,
          },
          {
            id: "2",
            title: "Thiên Hạ Nghe Gì",
            description: "Những bài hát đang được nghe nhiều nhất",
            cover_image: "/placeholder.svg?height=60&width=60&text=TH",
            created_by: "spotify",
            created_at: new Date().toISOString(),
            is_public: true,
            followers_count: 1245,
          },
          {
            id: "3",
            title: "Tìm Lại Bầu Trời",
            description: "Nhạc trữ tình Việt Nam",
            cover_image: "/placeholder.svg?height=60&width=60&text=TL",
            created_by: "spotify",
            created_at: new Date().toISOString(),
            is_public: true,
            followers_count: 876,
          },
          {
            id: "4",
            title: "Bài hát đã thích",
            description: "Danh sách bài hát đã thích",
            cover_image: "/placeholder.svg?height=60&width=60&text=♥",
            created_by: "user123",
            created_at: new Date().toISOString(),
            is_public: false,
            followers_count: 0,
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylists()
  }, [])

  const handleEditPlaylist = async () => {
    if (!selectedPlaylist) return

    try {
      // Call API to update playlist
      const updatedPlaylist = await musicApi.updatePlaylist(selectedPlaylist.id, selectedPlaylist)

      // Update playlists list
      setPlaylists(
        playlists.map((playlist) => (playlist.id === selectedPlaylist.id ? (updatedPlaylist as Playlist) : playlist)),
      )

      // Reset and close dialog
      setSelectedPlaylist(null)
      setIsEditPlaylistOpen(false)
    } catch (error) {
      console.error("Error updating playlist:", error)
      alert("Có lỗi xảy ra khi cập nhật playlist")
    }
  }

  const handleDeletePlaylist = async () => {
    if (!selectedPlaylist) return

    try {
      // Call API to delete playlist
      await musicApi.deletePlaylist(selectedPlaylist.id)

      // Update playlists list
      setPlaylists(playlists.filter((playlist) => playlist.id !== selectedPlaylist.id))

      // Reset and close dialog
      setSelectedPlaylist(null)
      setIsDeletePlaylistOpen(false)
    } catch (error) {
      console.error("Error deleting playlist:", error)
      alert("Có lỗi xảy ra khi xóa playlist")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const filteredPlaylists = playlists.filter(
    (playlist) =>
      playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (playlist.description && playlist.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      playlist.created_by.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý playlist</h1>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Tìm kiếm playlist..."
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
              <TableHead className="text-zinc-400">Playlist</TableHead>
              <TableHead className="text-zinc-400">Người tạo</TableHead>
              <TableHead className="text-zinc-400">Công khai</TableHead>
              <TableHead className="text-zinc-400">Người theo dõi</TableHead>
              <TableHead className="text-zinc-400">Ngày tạo</TableHead>
              <TableHead className="text-zinc-400 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-zinc-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredPlaylists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-zinc-500">
                  Không tìm thấy playlist nào
                </TableCell>
              </TableRow>
            ) : (
              filteredPlaylists.map((playlist) => (
                <TableRow key={playlist.id} className="hover:bg-zinc-700/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src={playlist.cover_image || "/placeholder.svg?height=60&width=60"}
                        width={60}
                        height={60}
                        alt={playlist.title}
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium">{playlist.title}</div>
                        <div className="text-xs text-zinc-400 max-w-xs truncate">{playlist.description || "-"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{playlist.created_by}</TableCell>
                  <TableCell>
                    <div
                      className={`px-2 py-1 rounded-full text-xs inline-block ${playlist.is_public ? "bg-green-500/20 text-green-500" : "bg-zinc-500/20 text-zinc-400"}`}
                    >
                      {playlist.is_public ? "Công khai" : "Riêng tư"}
                    </div>
                  </TableCell>
                  <TableCell>{playlist.followers_count?.toLocaleString() || "0"}</TableCell>
                  <TableCell>{formatDate(playlist.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Xem playlist"
                        onClick={() => router.push(`/playlist/${playlist.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedPlaylist(playlist)
                          setIsEditPlaylistOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => {
                          setSelectedPlaylist(playlist)
                          setIsDeletePlaylistOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Playlist Dialog */}
      <Dialog open={isEditPlaylistOpen} onOpenChange={setIsEditPlaylistOpen}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa playlist</DialogTitle>
            <DialogDescription className="text-zinc-400">Cập nhật thông tin playlist</DialogDescription>
          </DialogHeader>
          {selectedPlaylist && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit_title" className="text-sm font-medium">
                  Tên playlist
                </label>
                <Input
                  id="edit_title"
                  value={selectedPlaylist.title}
                  onChange={(e) => setSelectedPlaylist({ ...selectedPlaylist, title: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit_description" className="text-sm font-medium">
                  Mô tả
                </label>
                <Input
                  id="edit_description"
                  value={selectedPlaylist.description || ""}
                  onChange={(e) => setSelectedPlaylist({ ...selectedPlaylist, description: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit_cover_image" className="text-sm font-medium">
                  URL ảnh bìa
                </label>
                <Input
                  id="edit_cover_image"
                  value={selectedPlaylist.cover_image || ""}
                  onChange={(e) => setSelectedPlaylist({ ...selectedPlaylist, cover_image: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={selectedPlaylist.is_public}
                  onCheckedChange={(checked) => setSelectedPlaylist({ ...selectedPlaylist, is_public: checked })}
                />
                <Label htmlFor="is_public">Công khai</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPlaylistOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleEditPlaylist}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Playlist Dialog */}
      <Dialog open={isDeletePlaylistOpen} onOpenChange={setIsDeletePlaylistOpen}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa playlist</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Bạn có chắc chắn muốn xóa playlist này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          {selectedPlaylist && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 bg-zinc-800 rounded-md">
                <Image
                  src={selectedPlaylist.cover_image || "/placeholder.svg?height=60&width=60"}
                  width={60}
                  height={60}
                  alt={selectedPlaylist.title}
                  className="rounded"
                />
                <div>
                  <div className="font-medium">{selectedPlaylist.title}</div>
                  <div className="text-sm text-zinc-400">Người tạo: {selectedPlaylist.created_by}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeletePlaylistOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeletePlaylist}>
              Xóa playlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
