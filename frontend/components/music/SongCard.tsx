"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { PlayButton } from "@/components/music/PlayButton"
import { usePlayer } from "@/components/player/PlayerContext"
import { useOffline } from "@/context/offline-context"
import { MoreHorizontal, PlusCircle, ListMusic, CheckCircle, Download, Check, X, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"

export interface SongType {
    id: number
    title: string
    duration: string
    file_url: string
    image_url: string | null
    album: {
        id: number
        title: string
    } | null
    artist: {
        id: number
        name: string
        avatar: string | null
    }
    created_at: string
    updated_at: string
}

interface SongCardProps {
    song: SongType
    className?: string
    onPlay?: () => void
    playlist?: SongType[]
}

export function SongCard({ song, className = "", onPlay, playlist }: SongCardProps) {
    const { checkAuthBeforePlaying, play, addToQueue, currentSong, playlist: currentPlaylist, togglePlay } = usePlayer()
    const { user } = useAuth()
    const { isDownloaded, downloadSong, deleteDownload, getDownloadById } = useOffline()
    const [showMenu, setShowMenu] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)

    // Lấy trạng thái tải xuống của bài hát
    const songDownload = getDownloadById(song.id)
    const isAlreadyDownloaded = isDownloaded(song.id)
    const downloadStatus = songDownload?.status || null

    // Kiểm tra xem bài hát có đang phát không
    const isCurrentlyPlaying = currentSong?.id === song.id

    // Kiểm tra xem bài hát đã có trong danh sách phát chưa
    const isInQueue = currentPlaylist.some(item => item.id === song.id && item.id !== currentSong?.id)

    const handlePlay = () => {
        // Không thực hiện bất kỳ kiểm tra nào để đảm bảo phát ngay lập tức
        if (onPlay) {
            onPlay()
        } else if (currentSong?.id === song.id && isCurrentlyPlaying) {
            // Nếu đang phát bài hát này, chuyển sang trạng thái tạm dừng
            togglePlay();
        } else {
            // Phát trực tiếp
            play(song, playlist)
        }
    }

    const handleAddToQueue = (e: React.MouseEvent) => {
        e.stopPropagation();

        // Kiểm tra nếu bài hát đang phát
        if (isCurrentlyPlaying) {
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
        <Card className={`group bg-zinc-900/40 hover:bg-zinc-800/80 transition border-none p-4 ${className}`}>
            <div className="space-y-3">
                <div className="relative aspect-square overflow-hidden rounded-md">
                    <Image
                        src={song.image_url || "/placeholder.jpg"}
                        alt={song.title}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayButton onClick={handlePlay} size="lg" />
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-white">
                                <DropdownMenuItem
                                    className="cursor-pointer hover:bg-zinc-800 font-medium"
                                    onClick={handleAddToQueue}
                                >
                                    {isCurrentlyPlaying ? (
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
                                    className="cursor-pointer hover:bg-zinc-800 font-medium"
                                    onClick={handleDownloadSong}
                                    disabled={isDownloading || !user}
                                >
                                    {isAlreadyDownloaded ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4 text-green-500" />
                                            <span className="text-green-500">Đã tải xuống</span>
                                        </>
                                    ) : downloadStatus === 'PENDING' || downloadStatus === 'DOWNLOADING' ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            <span>Đang tải xuống... {songDownload?.progress ? `${songDownload.progress}%` : ''}</span>
                                        </>
                                    ) : downloadStatus === 'FAILED' ? (
                                        <>
                                            <X className="mr-2 h-4 w-4 text-red-500" />
                                            <span className="text-red-500">Tải xuống thất bại - Thử lại</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="mr-2 h-4 w-4" />
                                            <span>Tải xuống nghe offline</span>
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
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div>
                    <h3 className="font-medium text-sm truncate">{song.title}</h3>
                    <p className="text-xs text-zinc-400 truncate">
                        {song.artist.name}
                        {song.album ? ` • ${song.album.title}` : ""}
                    </p>
                </div>
            </div>
        </Card>
    )
} 