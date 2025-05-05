"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Search, Music, Play, Pause, UploadCloud } from "lucide-react";
import { musicApi } from "@/lib/api";
import type { Song } from "@/types";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function AdminSongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [genres, setGenres] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const [isEditSongOpen, setIsEditSongOpen] = useState(false);
  const [isDeleteSongOpen, setIsDeleteSongOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [playingSong, setPlayingSong] = useState<string | null>(null);
  const audioRef = typeof Audio !== 'undefined' ? new Audio() : null;

  // State cho việc thêm bài hát mới
  const [newSong, setNewSong] = useState({
    title: "",
    artist: "",
    album: "",
    genre: "",
    duration: 0,
    audio_file: null as File | null,
    cover_image: null as File | null,
  });

  const [editSongData, setEditSongData] = useState<{
    title: string;
    artist: string;
    album?: string;
    genre?: string;
    duration?: number;
    audio_file: File | null;
    cover_image: File | null;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAudioEnded = () => {
      setPlayingSong(null);
    };

    if (audioRef) {
      audioRef.addEventListener('ended', handleAudioEnded);

      return () => {
        audioRef.removeEventListener('ended', handleAudioEnded);
      };
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [songsData, genresData] = await Promise.all([musicApi.getSongs(), musicApi.getGenres()]);
      setSongs(songsData as Song[]);
      setGenres(genresData as { id: string; name: string }[]);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);

    } finally {
      setLoading(false);
    }
  };

  const handleAddSong = async () => {
    try {
      if (!newSong.title || !newSong.artist || !newSong.audio_file) {
        alert("Vui lòng điền đầy đủ thông tin bắt buộc (tên, nghệ sĩ, file nhạc).");
        return;
      }

      const formData = new FormData();
      formData.append("title", newSong.title);
      formData.append("artist", newSong.artist);
      formData.append("album", newSong.album || '');
      formData.append("genre", newSong.genre);
      formData.append("duration", newSong.duration.toString());
      formData.append("audio_file", newSong.audio_file);
      if (newSong.cover_image) {
        formData.append("cover_image", newSong.cover_image);
      }

      const createdSong = await musicApi.createSong(formData);
      setSongs([...songs, createdSong as Song]);
      setNewSong({ title: "", artist: "", album: "", genre: "", duration: 0, audio_file: null, cover_image: null });
      setIsAddSongOpen(false);
      alert("Thêm bài hát thành công!");
    } catch (error) {
      console.error("Lỗi khi tạo bài hát:", error);
      alert("Có lỗi xảy ra khi tạo bài hát.");
    }
  };

  const handleOpenEditDialog = (song: Song) => {
    setSelectedSong(song);
    setEditSongData({
      title: song.title,
      artist: song.artist,
      album: song.album,
      genre: song.genre,
      duration: song.duration,
      audio_file: null,
      cover_image: null,
    });
    setIsEditSongOpen(true);
  };

  const handleEditSong = async () => {
    if (!selectedSong || !editSongData) return;

    try {
      const formData = new FormData();
      formData.append("title", editSongData.title);
      formData.append("artist", editSongData.artist);
      if (editSongData.album !== undefined) formData.append("album", editSongData.album);
      if (editSongData.genre !== undefined) formData.append("genre", editSongData.genre);
      if (editSongData.duration !== undefined) formData.append("duration", editSongData.duration?.toString() || "0");
      if (editSongData.audio_file) {
        formData.append("audio_file", editSongData.audio_file);
      }
      if (editSongData.cover_image) {
        formData.append("cover_image", editSongData.cover_image);
      }

      const updatedSong = await musicApi.updateSong(selectedSong.id, formData);
      setSongs(songs.map((s) => (s.id === selectedSong.id ? (updatedSong as Song) : s)));
      setSelectedSong(null);
      setEditSongData(null);
      setIsEditSongOpen(false);
      alert("Cập nhật bài hát thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật bài hát:", error);
      alert("Có lỗi xảy ra khi cập nhật bài hát.");
    }
  };

  const handleDeleteSong = async () => {
    if (!selectedSong) return;

    try {
      await musicApi.deleteSong(selectedSong.id);
      setSongs(songs.filter((song) => song.id !== selectedSong.id));
      setSelectedSong(null);
      setIsDeleteSongOpen(false);
      alert("Xóa bài hát thành công!");
    } catch (error) {
      console.error("Lỗi khi xóa bài hát:", error);
      alert("Có lỗi xảy ra khi xóa bài hát.");
    }
  };

  const togglePlaySong = (songId: string) => {
    if (playingSong === songId) {
      setPlayingSong(null);
      if (audioRef) {
        audioRef.pause();
      }
    } else {
      setPlayingSong(songId);
      const songToPlay = songs.find((song) => song.id === songId);
      if (songToPlay && audioRef) {
        audioRef.src = songToPlay.audio_url ?? ""; // Sử dụng nullish coalescing operator
        audioRef.play().catch(err => {
          console.error("Lỗi khi phát nhạc:", err);
          setPlayingSong(null);
          alert("Không thể phát bài hát này.");
        });
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `<span class="math-inline">\{minutes\}\:</span>{remainingSeconds.toString().padStart(2, "0")}`;
  };

  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (song.album && song.album.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (song.genre && song.genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý bài hát</h1>
        <Button onClick={() => setIsAddSongOpen(true)}>
          <Music className="h-4 w-4 mr-2" />
          Thêm bài hát
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Tìm kiếm bài hát..."
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
              <TableHead className="text-zinc-400 w-12"></TableHead>
              <TableHead className="text-zinc-400">Bài hát</TableHead>
              <TableHead className="text-zinc-400">Album</TableHead>
              <TableHead className="text-zinc-400">Thể loại</TableHead>
              <TableHead className="text-zinc-400">Thời lượng</TableHead>
              <TableHead className="text-zinc-400">Lượt nghe</TableHead>
              <TableHead className="text-zinc-400 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-zinc-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredSongs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-zinc-500">
                  Không tìm thấy bài hát nào
                </TableCell>
              </TableRow>
            ) : (
              filteredSongs.map((song) => (
                <TableRow key={song.id} className="hover:bg-zinc-700/50">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={() => togglePlaySong(song.id)}
                    >
                      {playingSong === song.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src={song.cover_image ?? "/placeholder.svg?height=40&width=40"}
                        width={40}
                        height={40}
                        alt={song.title}
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium">{song.title}</div>
                        <div className="text-xs text-zinc-400">{song.artist}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{song.album || "-"}</TableCell>
                  <TableCell>{song.genre || "-"}</TableCell>
                  <TableCell>{formatDuration(song.duration)}</TableCell>
                  <TableCell>{song.play_count?.toLocaleString() || "0"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditDialog(song)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => {
                          setSelectedSong(song);
                          setIsDeleteSongOpen(true);
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

      {/* Add Song Dialog */}
      <Dialog open={isAddSongOpen} onOpenChange={setIsAddSongOpen}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thêm bài hát mới</DialogTitle>
            <DialogDescription className="text-zinc-400">Điền thông tin để tạo bài hát mới</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Tên bài hát <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  value={newSong.title}
                  onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
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
                  value={newSong.artist}
                  onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="album" className="text-sm font-medium">
                  Album
                </label>
                <Input
                  id="album"
                  value={newSong.album}
                  onChange={(e) => setNewSong({ ...newSong, album: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="genre" className="text-sm font-medium">
                  Thể loại
                </label>
                <Select value={newSong.genre} onValueChange={(value) => setNewSong({ ...newSong, genre: value })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Chọn thể loại" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                    {genres.map((genre) => (
                      <SelectItem key={genre.id} value={genre.name}>
                        {genre.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="duration" className="text-sm font-medium">
                  Thời lượng (giây)
                </label>
                <Input
                  id="duration"
                  type="number"
                  value={newSong.duration || ""}
                  onChange={(e) => setNewSong({ ...newSong, duration: parseInt(e.target.value) || 0 })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="audio_file" className="text-sm font-medium">
                  File nhạc <span className="text-red-500">*</span>
                </label>
                <Input
                  id="audio_file"
                  type="file"
                  accept="audio/*"
                  className="bg-zinc-800 border-zinc-700 text-white file:border-0 file:bg-zinc-700 file:text-zinc-300 file:rounded-md"
                  onChange={(e) => setNewSong({ ...newSong, audio_file: e.target.files?.[0] ?? null })}required
                  />
                  {newSong.audio_file && (
                    <p className="text-xs text-zinc-400">Đã chọn: {newSong.audio_file.name}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="cover_image" className="text-sm font-medium">
                  Ảnh bìa
                </label>
                <Input
                  id="cover_image"
                  type="file"
                  accept="image/*"
                  className="bg-zinc-800 border-zinc-700 text-white file:border-0 file:bg-zinc-700 file:text-zinc-300 file:rounded-md"
                  onChange={(e) => setNewSong({ ...newSong, cover_image: e.target.files?.[0] ?? null })}
                />
                {newSong.cover_image && (
                  <p className="text-xs text-zinc-400">Đã chọn: {newSong.cover_image.name}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddSongOpen(false);
                setNewSong({ title: "", artist: "", album: "", genre: "", duration: 0, audio_file: null, cover_image: null });
              }}>
                Hủy
              </Button>
              <Button onClick={handleAddSong}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Thêm bài hát
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
  
        {/* Edit Song Dialog */}
        <Dialog open={isEditSongOpen} onOpenChange={setIsEditSongOpen}>
          <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa bài hát</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Chỉnh sửa thông tin bài hát
              </DialogDescription>
            </DialogHeader>
            {selectedSong && editSongData && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="edit_title" className="text-sm font-medium">
                      Tên bài hát <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="edit_title"
                      value={editSongData.title}
                      onChange={(e) => setEditSongData({ ...editSongData, title: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit_artist" className="text-sm font-medium">
                      Nghệ sĩ <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="edit_artist"
                      value={editSongData.artist}
                      onChange={(e) => setEditSongData({ ...editSongData, artist: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="edit_album" className="text-sm font-medium">
                      Album
                    </label>
                    <Input
                      id="edit_album"
                      value={editSongData.album || ""}
                      onChange={(e) => setEditSongData({ ...editSongData, album: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit_genre" className="text-sm font-medium">
                      Thể loại
                    </label>
                    <Select
                      value={editSongData.genre}
                      onValueChange={(value) => setEditSongData({ ...editSongData, genre: value })}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Chọn thể loại" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                        {genres.map((genre) => (
                          <SelectItem key={genre.id} value={genre.name}>
                            {genre.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="edit_duration" className="text-sm font-medium">
                      Thời lượng (giây)
                    </label>
                    <Input
                      id="edit_duration"
                      type="number"
                      value={editSongData.duration || ""}
                      onChange={(e) =>
                        setEditSongData({ ...editSongData, duration: parseInt(e.target.value) || 0 })
                      }
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit_audio_file" className="text-sm font-medium">
                      File nhạc mới (nếu muốn thay đổi)
                    </label>
                    <Input
                      id="edit_audio_file"
                      type="file"
                      accept="audio/*"
                      className="bg-zinc-800 border-zinc-700 text-white file:border-0 file:bg-zinc-700 file:text-zinc-300 file:rounded-md"
                      onChange={(e) => setEditSongData({ ...editSongData, audio_file: e.target.files?.[0] ?? null })}
                    />
                    {editSongData.audio_file && (
                      <p className="text-xs text-zinc-400">Đã chọn: {editSongData.audio_file.name}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit_cover_image" className="text-sm font-medium">
                    Ảnh bìa mới (nếu muốn thay đổi)
                  </label>
                  <Input
                    id="edit_cover_image"
                    type="file"
                    accept="image/*"
                    className="bg-zinc-800 border-zinc-700 text-white file:border-0 file:bg-zinc-700 file:text-zinc-300 file:rounded-md"
                    onChange={(e) => setEditSongData({ ...editSongData, cover_image: e.target.files?.[0] ?? null })}
                  />
                  {editSongData.cover_image && (
                    <p className="text-xs text-zinc-400">Đã chọn: {editSongData.cover_image.name}</p>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsEditSongOpen(false);
                setSelectedSong(null);
                setEditSongData(null);
              }}>
                Hủy
              </Button>
              <Button onClick={handleEditSong}>
                <Pencil className="mr-2 h-4 w-4" />
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
  
        {/* Delete Song Dialog */}
        <Dialog open={isDeleteSongOpen} onOpenChange={setIsDeleteSongOpen}>
          <DialogContent className="bg-zinc-900 text-white border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-red-500">Xóa bài hát</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Bạn có chắc chắn muốn xóa bài hát này? Thao tác này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDeleteSongOpen(false);
                setSelectedSong(null);
              }}>
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSong}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }