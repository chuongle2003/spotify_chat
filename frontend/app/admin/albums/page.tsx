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
import { Pencil, Trash2, Search, Disc, Play, ListMusic } from "lucide-react"
import { musicApi } from "@/lib/api"
import type { Album, Song } from "@/types"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"

export default function AdminAlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddAlbumOpen, setIsAddAlbumOpen] = useState(false)
  const [isEditAlbumOpen, setIsEditAlbumOpen] = useState(false)
  const [isDeleteAlbumOpen, setIsDeleteAlbumOpen] = useState(false)
  const [isManageSongsOpen, setIsManageSongsOpen] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [albumSongs, setAlbumSongs] = useState<Song[]>([])
  const [selectedSongs, setSelectedSongs] = useState<string[]>([])
  const [newAlbum, setNewAlbum] = useState({
    title: "",
    artist: "",
    release_date: new Date().toISOString().split("T")[0],
    cover_image: "",
    description: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [albumsData, songsData] = await Promise.all([musicApi.getAlbums(), musicApi.getSongs()])
        setAlbums(albumsData as Album[])
        setSongs(songsData as Song[])
      } catch (error) {
        console.error("Error fetching data:", error)
        // Fallback to mock data
        setAlbums([
          {
            id: "1",
            title: "Chúng Ta Của Hiện Tại",
            artist: "Sơn Tùng M-TP",
            release_date: "2020-12-20",
            cover_image: "/placeholder.svg?height=200&width=200&text=CTCHT",
            description: "Album đơn của Sơn Tùng M-TP phát hành vào cuối năm 2020.",
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            title: "Có Chắc Yêu Là Đây",
            artist: "Sơn Tùng M-TP",
            release_date: "2020-07-05",
            cover_image: "/placeholder.svg?height=200&width=200&text=CCYLD",
            description: "Album đơn của Sơn Tùng M-TP phát hành vào giữa năm 2020.",
            created_at: new Date().toISOString(),
          },
          {
            id: "3",
            title: "Hoàng",
            artist: "Hoàng Thùy Linh",
            release_date: "2019-10-20",
            cover_image: "/placeholder.svg?height=200&width=200&text=H",
            description: "Album của Hoàng Thùy Linh phát hành vào cuối năm 2019.",
            created_at: new Date().toISOString(),
          },
        ])
        setSongs([
          {
            id: "1",
            title: "Chúng Ta Của Hiện Tại",
            artist: "Sơn Tùng M-TP",
            album: "Chúng Ta Của Hiện Tại (Single)",
            duration: 289,
            file_path: "https://example.com/song1.mp3",
            cover_image: "/placeholder.svg?height=60&width=60&text=ST",
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            title: "Có Chắc Yêu Là Đây",
            artist: "Sơn Tùng M-TP",
            album: "Có Chắc Yêu Là Đây (Single)",
            duration: 218,
            file_path: "https://example.com/song2.mp3",
            cover_image: "/placeholder.svg?height=60&width=60&text=ST",
            created_at: new Date().toISOString(),
          },
          {
            id: "3",
            title: "Chạy Ngay Đi",
            artist: "Sơn Tùng M-TP",
            album: "Chạy Ngay Đi (Single)",
            duration: 248,
            file_path: "https://example.com/song3.mp3",
            cover_image: "/placeholder.svg?height=60&width=60&text=ST",
            created_at: new Date().toISOString(),
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddAlbum = async () => {
    try {
      // Validate form
      if (!newAlbum.title || !newAlbum.artist) {
        alert("Vui lòng điền đầy đủ thông tin bắt buộc")
        return
      }

      // Call API to create album
      const createdAlbum = await musicApi.createAlbum(newAlbum)

      // Update albums list
      setAlbums([...albums, createdAlbum as Album])

      // Reset form and close dialog
      setNewAlbum({
        title: "",
        artist: "",
        release_date: new Date().toISOString().split("T")[0],
        cover_image: "",
        description: "",
      })
      setIsAddAlbumOpen(false)
    } catch (error) {
      console.error("Error creating album:", error)
      alert("Có lỗi xảy ra khi tạo album")
    }
  }

  const handleEditAlbum = async () => {
    if (!selectedAlbum) return

    try {
      // Call API to update album
      const updatedAlbum = await musicApi.updateAlbum(selectedAlbum.id, selectedAlbum)

      // Update albums list
      setAlbums(albums.map((album) => (album.id === selectedAlbum.id ? (updatedAlbum as Album) : album)))

      // Reset and close dialog
      setSelectedAlbum(null)
      setIsEditAlbumOpen(false)
    } catch (error) {
      console.error("Error updating album:", error)
      alert("Có lỗi xảy ra khi cập nhật album")
    }
  }

  const handleDeleteAlbum = async () => {
    if (!selectedAlbum) return

    try {
      // Call API to delete album
      await musicApi.deleteAlbum(selectedAlbum.id)

      // Update albums list
      setAlbums(albums.filter((album) => album.id !== selectedAlbum.id))

      // Reset and close dialog
      setSelectedAlbum(null)
      setIsDeleteAlbumOpen(false)
    } catch (error) {
      console.error("Error deleting album:", error)
      alert("Có lỗi xảy ra khi xóa album")
    }
  }

  const handleOpenManageSongs = async (album: Album) => {
    setSelectedAlbum(album)

    try {
      // Fetch songs in this album
      const albumSongsData = await musicApi.getAlbumSongs(album.id)
      setAlbumSongs(albumSongsData as Song[])

      // Set selected songs
      setSelectedSongs((albumSongsData as Song[]).map((song: Song) => song.id))
    } catch (error) {
      console.error("Error fetching album songs:", error)
      // Fallback to mock data - assume no songs in album
      setAlbumSongs([])
      setSelectedSongs([])
    }

    setIsManageSongsOpen(true)
  }

  const handleSaveSongs = async () => {
    if (!selectedAlbum) return

    try {
      // In a real app, you would have an API to update album songs
      // For now, we'll just update the UI

      // Remove songs that were unselected
      const songsToRemove = albumSongs.filter((song) => !selectedSongs.includes(song.id))
      for (const song of songsToRemove) {
        // await musicApi.removeSongFromAlbum(selectedAlbum.id, song.id)

      }

      // Add songs that were selected
      const songsToAdd = selectedSongs.filter((songId) => !albumSongs.some((song) => song.id === songId))
      for (const songId of songsToAdd) {

      }

      // Close dialog
      setIsManageSongsOpen(false)
      setSelectedAlbum(null)
      setAlbumSongs([])
      setSelectedSongs([])

      // Show success message
      alert("Cập nhật bài hát trong album thành công")
    } catch (error) {
      console.error("Error updating album songs:", error)
      alert("Có lỗi xảy ra khi cập nhật bài hát trong album")
    }
  }

  const toggleSongSelection = (songId: string) => {
    if (selectedSongs.includes(songId)) {
      setSelectedSongs(selectedSongs.filter((id) => id !== songId))
    } else {
      setSelectedSongs([...selectedSongs, songId])
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const filteredAlbums = albums.filter(
    (album) =>
      album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      album.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (album.description && album.description.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý album</h1>
        <Button onClick={() => setIsAddAlbumOpen(true)}>
          <Disc className="h-4 w-4 mr-2" />
          Thêm album
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Tìm kiếm album..."
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
              <TableHead className="text-zinc-400">Album</TableHead>
              <TableHead className="text-zinc-400">Nghệ sĩ</TableHead>
              <TableHead className="text-zinc-400">Ngày phát hành</TableHead>
              <TableHead className="text-zinc-400">Mô tả</TableHead>
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
            ) : filteredAlbums.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-zinc-500">
                  Không tìm thấy album nào
                </TableCell>
              </TableRow>
            ) : (
              filteredAlbums.map((album) => (
                <TableRow key={album.id} className="hover:bg-zinc-700/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src={album.cover_image || "/placeholder.svg?height=60&width=60"}
                        width={60}
                        height={60}
                        alt={album.title}
                        className="rounded"
                      />
                      <div className="font-medium">{album.title}</div>
                    </div>
                  </TableCell>
                  <TableCell>{album.artist}</TableCell>
                  <TableCell>{formatDate(album.release_date)}</TableCell>
                  <TableCell className="max-w-xs truncate">{album.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Quản lý bài hát"
                        onClick={() => handleOpenManageSongs(album)}
                      >
                        <ListMusic className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedAlbum(album)
                          setIsEditAlbumOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => {
                          setSelectedAlbum(album)
                          setIsDeleteAlbumOpen(true)
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

      {/* Add Album Dialog */}
      <Dialog open={isAddAlbumOpen} onOpenChange={setIsAddAlbumOpen}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle>Thêm album mới</DialogTitle>
            <DialogDescription className="text-zinc-400">Điền thông tin để tạo album mới</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Tên album <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                value={newAlbum.title}
                onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="artist" className="text-sm font-medium">
                Nghệ sĩ <span className="text-red-500">*</span>
              </label>
              <Input
                id="artist"
                value={newAlbum.artist}
                onChange={(e) => setNewAlbum({ ...newAlbum, artist: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="release_date" className="text-sm font-medium">
                Ngày phát hành
              </label>
              <Input
                id="release_date"
                type="date"
                value={newAlbum.release_date}
                onChange={(e) => setNewAlbum({ ...newAlbum, release_date: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="cover_image" className="text-sm font-medium">
                URL ảnh bìa
              </label>
              <Input
                id="cover_image"
                value={newAlbum.cover_image}
                onChange={(e) => setNewAlbum({ ...newAlbum, cover_image: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="https://example.com/cover.jpg"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Mô tả
              </label>
              <Textarea
                id="description"
                value={newAlbum.description}
                onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddAlbumOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddAlbum}>Thêm album</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Album Dialog */}
      <Dialog open={isEditAlbumOpen} onOpenChange={setIsEditAlbumOpen}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa album</DialogTitle>
            <DialogDescription className="text-zinc-400">Cập nhật thông tin album</DialogDescription>
          </DialogHeader>
          {selectedAlbum && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit_title" className="text-sm font-medium">
                  Tên album
                </label>
                <Input
                  id="edit_title"
                  value={selectedAlbum.title}
                  onChange={(e) => setSelectedAlbum({ ...selectedAlbum, title: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit_artist" className="text-sm font-medium">
                  Nghệ sĩ
                </label>
                <Input
                  id="edit_artist"
                  value={selectedAlbum.artist}
                  onChange={(e) => setSelectedAlbum({ ...selectedAlbum, artist: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit_release_date" className="text-sm font-medium">
                  Ngày phát hành
                </label>
                <Input
                  id="edit_release_date"
                  type="date"
                  value={selectedAlbum.release_date.split("T")[0]}
                  onChange={(e) => setSelectedAlbum({ ...selectedAlbum, release_date: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit_cover_image" className="text-sm font-medium">
                  URL ảnh bìa
                </label>
                <Input
                  id="edit_cover_image"
                  value={selectedAlbum.cover_image || ""}
                  onChange={(e) => setSelectedAlbum({ ...selectedAlbum, cover_image: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit_description" className="text-sm font-medium">
                  Mô tả
                </label>
                <Textarea
                  id="edit_description"
                  value={selectedAlbum.description || ""}
                  onChange={(e) => setSelectedAlbum({ ...selectedAlbum, description: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAlbumOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleEditAlbum}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Album Dialog */}
      <Dialog open={isDeleteAlbumOpen} onOpenChange={setIsDeleteAlbumOpen}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa album</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Bạn có chắc chắn muốn xóa album này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          {selectedAlbum && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 bg-zinc-800 rounded-md">
                <Image
                  src={selectedAlbum.cover_image || "/placeholder.svg?height=80&width=80"}
                  width={80}
                  height={80}
                  alt={selectedAlbum.title}
                  className="rounded"
                />
                <div>
                  <div className="font-medium">{selectedAlbum.title}</div>
                  <div className="text-sm text-zinc-400">{selectedAlbum.artist}</div>
                  <div className="text-xs text-zinc-400">{formatDate(selectedAlbum.release_date)}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteAlbumOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteAlbum}>
              Xóa album
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Songs Dialog */}
      <Dialog open={isManageSongsOpen} onOpenChange={setIsManageSongsOpen}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-3xl">
          <DialogHeader>
            <DialogTitle>Quản lý bài hát trong album</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {selectedAlbum && `Chọn bài hát cho album "${selectedAlbum.title}"`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <Input
                placeholder="Tìm kiếm bài hát..."
                className="bg-zinc-800 border-zinc-700 text-white"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {songs
                  .filter(
                    (song) =>
                      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      song.artist.toLowerCase().includes(searchQuery.toLowerCase()),
                  )
                  .map((song) => (
                    <div key={song.id} className="flex items-center gap-3 p-3 bg-zinc-800 rounded-md">
                      <Checkbox
                        id={`song-${song.id}`}
                        checked={selectedSongs.includes(song.id)}
                        onCheckedChange={() => toggleSongSelection(song.id)}
                      />
                      <Image
                        src={song.cover_image || "/placeholder.svg?height=40&width=40"}
                        width={40}
                        height={40}
                        alt={song.title}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor={`song-${song.id}`} className="font-medium cursor-pointer">
                          {song.title}
                        </label>
                        <div className="text-xs text-zinc-400">{song.artist}</div>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageSongsOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveSongs}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
