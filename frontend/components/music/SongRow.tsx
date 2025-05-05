"use client"

import Image from "next/image"
import { Play, Heart, MoreHorizontal, PlusCircle, ListMusic, CheckCircle, Download, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SongType } from "./SongCard"
import { usePlayer } from "@/components/player/PlayerContext"
import { useOffline } from "@/context/offline-context"
import { useAuth } from "@/context/auth-context"
import { toast } from "@/components/ui/use-toast"
import { useState } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SongRowProps {
    song: SongType
    index?: number
    songs?: SongType[]
    showAlbum?: boolean
    showArtist?: boolean
    isActive?: boolean
}

export function SongRow({
    song,
    index,
    songs = [],
    showAlbum = true,
    showArtist = true,
    isActive = false
}: SongRowProps) {
    const { play, currentSong, isPlaying, togglePlay, addToQueue, playlist: currentPlaylist } = usePlayer()
    const { user } = useAuth()
    const { isDownloaded, downloadSong, deleteDownload, getDownloadById } = useOffline()
    const [isDownloading, setIsDownloading] = useState(false)

    const isCurrentSong = currentSong?.id === song.id

    // Lấy trạng thái tải xuống của bài hát
    const songDownload = getDownloadById(song.id)
    const isAlreadyDownloaded = isDownloaded(song.id)
    const downloadStatus = songDownload?.status || null

    // Kiểm tra xem bài hát đã có trong danh sách phát chưa (loại trừ bài hát đang phát)
    const isInQueue = currentPlaylist.some(item => item.id === song.id && item.id !== currentSong?.id)

    const formatDuration = (durationString: string) => {
        // Nếu duration là chuỗi "mm:ss" thì trả về nguyên
        if (/^\d+:\d{2}$/.test(durationString)) {
            return durationString
        }

        // Chuyển đổi số giây thành mm:ss
        const seconds = parseInt(durationString, 10)
        if (isNaN(seconds)) return "0:00"

        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    const handlePlay = () => {
        if (isCurrentSong) {
            togglePlay()
        } else {
            play(song, songs.length > 0 ? songs : [song])
        }
    }

    const handleAddToQueue = (e: React.MouseEvent) => {
        e.stopPropagation();

        // Kiểm tra nếu bài hát đang phát
        if (isCurrentSong) {
            toast({
                title: "Bài hát đang phát",
                description: `"${song.title}" đang được phát.`,
            });
            return;
        }

        // Kiểm tra nếu bài hát đã có trong hàng đợi
        if (isInQueue) {
            toast({
                title: "Đã có trong hàng đợi",
                description: `"${song.title}" đã có trong danh sách phát.`,
            });
            return;
        }

        try {
            // Bài hát đã là định dạng SongType, có thể thêm trực tiếp
            addToQueue(song);

            toast({
                title: "Đã thêm vào hàng đợi",
                description: `Đã thêm "${song.title}" vào danh sách phát.`,
            });
        } catch (error) {
            console.error("Lỗi khi thêm vào hàng đợi:", error);
            toast({
                title: "Lỗi",
                description: "Không thể thêm bài hát vào hàng đợi. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        }
    }

    const handleDownloadSong = async (e: React.MouseEvent) => {
        e.stopPropagation()

        // Kiểm tra đăng nhập
        if (!user) {
            toast({
                title: "Cần đăng nhập",
                description: "Vui lòng đăng nhập để tải bài hát nghe offline.",
                variant: "destructive",
            })
            return
        }

        // Kiểm tra nếu bài hát đã tải xuống hoàn tất
        if (isAlreadyDownloaded) {
            toast({
                title: "Đã tải xuống",
                description: `Bài hát "${song.title}" đã được tải xuống.`,
            })
            return
        }

        // Nếu đang trong quá trình tải xuống, hiển thị thông báo
        if (downloadStatus === 'PENDING' || downloadStatus === 'DOWNLOADING') {
            toast({
                title: "Đang tải xuống",
                description: `Bài hát "${song.title}" đang được tải xuống.`,
            })
            return
        }

        // Nếu đã tải xuống nhưng thất bại, cho phép tải lại
        if (downloadStatus === 'FAILED') {
            // Xóa tải xuống cũ trước khi tải lại
            if (songDownload) {
                await deleteDownload(songDownload.id)
            }
        }

        // Bắt đầu tải xuống mới
        setIsDownloading(true)
        try {
            const result = await downloadSong(song.id)
            toast({
                title: "Tải xuống thành công",
                description: `Bài hát "${song.title}" đã được tải xuống thành công. Bạn có thể nghe offline.`,
            })
        } catch (error) {
            console.error("Lỗi khi tải xuống bài hát:", error)
            toast({
                title: "Lỗi tải xuống",
                description: "Không thể tải xuống bài hát. Vui lòng thử lại sau.",
                variant: "destructive",
            })
        } finally {
            setIsDownloading(false)
        }
    }

    const handleDeleteDownload = async (e: React.MouseEvent) => {
        e.stopPropagation()

        if (!songDownload) return

        try {
            await deleteDownload(songDownload.id)
            toast({
                title: "Đã xóa",
                description: `Đã xóa bài hát "${song.title}" khỏi danh sách tải xuống.`,
            })
        } catch (error) {
            console.error("Lỗi khi xóa bài hát tải xuống:", error)
            toast({
                title: "Lỗi",
                description: "Không thể xóa bài hát. Vui lòng thử lại sau.",
                variant: "destructive",
            })
        }
    }

    return (
        <div
            className={`grid grid-cols-12 gap-4 px-4 py-2 rounded-md text-sm items-center group hover:bg-zinc-800/50 ${isActive ? 'bg-zinc-800/50' : ''}`}
        >
            {/* Số thứ tự hoặc nút phát */}
            <div className="col-span-1 flex items-center justify-center">
                <div className="w-4 text-center group-hover:hidden">
                    {index !== undefined ? <span className="text-zinc-400">{index + 1}</span> : null}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 hidden group-hover:flex items-center justify-center p-0"
                    onClick={handlePlay}
                >
                    <Play className="h-4 w-4" />
                </Button>
            </div>

            {/* Thông tin bài hát */}
            <div className="col-span-4 flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded">
                    <Image
                        src={song.image_url || "/placeholder.jpg"}
                        alt={song.title}
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="min-w-0">
                    <p className={`font-medium truncate ${isCurrentSong ? 'text-green-500' : ''}`}>
                        {song.title}
                    </p>
                    {showArtist && (
                        <p className="text-xs text-zinc-400 truncate">{song.artist.name}</p>
                    )}
                </div>
            </div>

            {/* Album */}
            {showAlbum && (
                <div className="col-span-3 truncate text-zinc-400">
                    {song.album?.title || "-"}
                </div>
            )}

            {/* Thêm các tính năng khác */}
            <div className="col-span-3"></div>

            {/* Nút yêu thích và các tùy chọn */}
            <div className="col-span-1 flex items-center opacity-0 group-hover:opacity-100">
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-zinc-400 hover:text-white"
                >
                    <Heart className="h-4 w-4" />
                </Button>
            </div>

            {/* Thời lượng */}
            <div className="col-span-1 text-right text-zinc-400">
                {formatDuration(song.duration)}
            </div>

            {/* Menu tùy chọn */}
            <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-zinc-400 hover:text-white"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-white">
                        <DropdownMenuItem
                            className="cursor-pointer hover:bg-zinc-800"
                            onClick={handleAddToQueue}
                        >
                            {isCurrentSong ? (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                    <span>Đang phát</span>
                                </>
                            ) : isInQueue ? (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                    <span>Đã có trong hàng đợi</span>
                                </>
                            ) : (
                                <>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    <span>Thêm vào hàng đợi</span>
                                </>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem
                            className="cursor-pointer hover:bg-zinc-800"
                            onClick={(e) => {
                                e.stopPropagation();
                                toast({
                                    title: "Tính năng đang phát triển",
                                    description: "Chức năng thêm vào playlist sẽ được cập nhật trong phiên bản tiếp theo.",
                                });
                            }}
                        >
                            <ListMusic className="mr-2 h-4 w-4" />
                            <span>Thêm vào playlist</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        {/* Nút tải xuống offline */}
                        {isAlreadyDownloaded ? (
                            <DropdownMenuItem
                                className="cursor-pointer hover:bg-zinc-800"
                                onClick={handleDeleteDownload}
                            >
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Đã tải xuống</span>
                            </DropdownMenuItem>
                        ) : downloadStatus === 'PENDING' || downloadStatus === 'DOWNLOADING' ? (
                            <DropdownMenuItem
                                className="cursor-pointer hover:bg-zinc-800"
                                disabled
                            >
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                <span>Đang tải xuống... {songDownload?.progress ? `${songDownload.progress}%` : ''}</span>
                            </DropdownMenuItem>
                        ) : downloadStatus === 'FAILED' ? (
                            <DropdownMenuItem
                                className="cursor-pointer hover:bg-zinc-800"
                                onClick={handleDownloadSong}
                            >
                                <X className="mr-2 h-4 w-4 text-red-500" />
                                <span>Tải xuống thất bại - Thử lại</span>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                className="cursor-pointer hover:bg-zinc-800"
                                onClick={handleDownloadSong}
                                disabled={isDownloading || !user}
                            >
                                {isDownloading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                <span>Tải xuống nghe offline</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
} 