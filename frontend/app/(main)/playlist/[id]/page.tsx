"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { PlayIcon, ShuffleIcon, Clock, Heart, MoreHorizontal, UserPlus, ShareIcon, Pencil, Plus, PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePlayer } from "@/components/player/PlayerContext"
import postmanApi from "@/lib/api/postman"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Song {
    id: string
    title: string
    artist: any
    album?: string
    duration: number
    audio_url?: string
    audio_file?: string
    cover_image?: string
    play_count?: number
    likes_count?: number
    is_liked?: boolean
}

interface Playlist {
    id: string | number
    name: string
    description?: string
    is_public: boolean
    cover_image: string | null
    user?: {
        id: number | string
        username: string
        avatar: string | null
    }
    songs_count: number
    created_at: string
    updated_at: string
    songs?: Song[]
    is_following?: boolean
}

export default function PlaylistPage() {
    const params = useParams()
    const playlistId = params?.id as string
    const router = useRouter()
    const { user } = useAuth()
    const { toast } = useToast()
    const { play, isPlaying, currentSong, pause, resume, addToQueue } = usePlayer()

    const [playlist, setPlaylist] = useState<Playlist | null>(null)
    const [songs, setSongs] = useState<Song[]>([])
    const [loading, setLoading] = useState(true)
    const [isFollowing, setIsFollowing] = useState(false)
    const [isOwner, setIsOwner] = useState(false)

    useEffect(() => {
        if (!user) {
            router.push("/")
            return
        }

        if (!playlistId) return

        async function fetchPlaylistDetails() {
            try {
                setLoading(true)

                try {
                    // Lấy chi tiết playlist
                    const response = await postmanApi.music.getPlaylist(playlistId)

                    // Xử lý dữ liệu playlist
                    const playlistData = {
                        ...response,
                        songs: response.songs || []
                    }

                    // Kiểm tra xem user hiện tại có phải là chủ sở hữu không
                    if (playlistData.user && user) {
                        setIsOwner(String(playlistData.user.id) === String(user.id))
                    }

                    // Định dạng lại dữ liệu bài hát nếu cần
                    const formattedSongs = (playlistData.songs || []).map((song: any) => ({
                        id: song.id,
                        title: song.title || song.name,
                        artist: song.artist,
                        album: song.album,
                        duration: song.duration || 0,
                        audio_url: song.audio_url || song.audio_file,
                        audio_file: song.audio_file,
                        cover_image: song.cover_image,
                        play_count: song.play_count || 0,
                        likes_count: song.likes_count || 0,
                        is_liked: song.is_liked || false
                    }))

                    setPlaylist(playlistData)
                    setSongs(formattedSongs)

                    // Kiểm tra xem user hiện tại có đang theo dõi playlist này không
                    try {
                        // Kiểm tra nếu API trả về thông tin theo dõi
                        if (response.is_following !== undefined) {
                            setIsFollowing(Boolean(response.is_following))
                        } else {
                            // Nếu không có thông tin theo dõi trong response, gọi API riêng
                            const followStatus = await postmanApi.music.checkFollowingPlaylist(playlistId)
                            setIsFollowing(followStatus?.is_following || false)
                        }
                    } catch (error) {
                        console.error("Không thể kiểm tra trạng thái theo dõi:", error)
                        // Mặc định là không theo dõi nếu có lỗi
                        setIsFollowing(false)
                    }
                } catch (error) {
                    console.error("Lỗi khi lấy chi tiết playlist, sử dụng mock data:", error)

                    // Sử dụng mock data khi API gặp lỗi
                    const mockPlaylist = getMockPlaylist(playlistId);
                    const mockSongs = mockPlaylist.songs || [];

                    setPlaylist(mockPlaylist);
                    setSongs(mockSongs);
                    setIsOwner(mockPlaylist.user?.id === user?.id);
                    setIsFollowing(false);

                    toast({
                        title: "Chú ý",
                        description: "Đang sử dụng dữ liệu tạm thời. Kết nối với server đang gặp sự cố.",
                        variant: "default",
                    });
                }
            } catch (error) {
                console.error("Lỗi khi lấy chi tiết playlist:", error)
                toast({
                    title: "Lỗi",
                    description: "Không thể tải thông tin playlist. Vui lòng thử lại sau.",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        // Hàm tạo mock data khi API gặp lỗi
        function getMockPlaylist(id: string): Playlist {
            // Sử dụng id từ URL để tạo mock data có tính logic
            return {
                id: id,
                name: `Playlist #${id}`,
                description: "Playlist này đang được hiển thị ở chế độ ngoại tuyến.",
                is_public: true,
                cover_image: "https://spotifybackend.shop/media/covers/2025/05/01/Bi%E1%BB%83n_Nh%E1%BB%9B.jpg",
                user: {
                    id: user?.id ? Number(user.id) : 1,
                    username: user?.username || "admin",
                    avatar: null
                },
                songs_count: 15,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                songs: [
                    {
                        id: "1",
                        title: "Sài Gòn Buồn Quá Em Ơi (Jazzhop)",
                        artist: "Dế Choắt, Jason",
                        album: "Chạm Đáy Nỗi Đau",
                        duration: 316,
                        audio_file: "https://spotifybackend.shop/media/songs/2025/05/01/saigonbuonquaemoijazzhop-dechoatjason-8053816.mp3",
                        cover_image: "https://spotifybackend.shop/media/covers/2025/05/01/S%C3%A0i_G%C3%B2n_Bu%E1%BB%93n_Qu%C3%A1_Em_%C6%A0i_Jazzhop.jpg",
                        play_count: 103,
                        likes_count: 31
                    },
                    {
                        id: "14",
                        title: "Tình Nhớ",
                        artist: "Thanh Hiền",
                        album: "NhacCuaTui.com",
                        duration: 229,
                        audio_file: "https://spotifybackend.shop/media/songs/2025/05/01/tinhnho-thanhhien-5825173.mp3",
                        cover_image: "https://spotifybackend.shop/media/covers/2025/05/01/T%C3%ACnh_Nh%E1%BB%9B.jpg",
                        play_count: 112,
                        likes_count: 30
                    },
                    {
                        id: "7",
                        title: "Wrong Times",
                        artist: "Puppy (Việt Nam), Dangrangto",
                        album: "Rap Việt Collection",
                        duration: 211,
                        audio_file: "https://spotifybackend.shop/media/songs/2025/05/01/wrongtimes-puppyvietnamdangrangto-9475978.mp3",
                        cover_image: "https://spotifybackend.shop/media/covers/2025/05/01/Wrong_Times.jpg",
                        play_count: 97,
                        likes_count: 29
                    }
                ]
            };
        }

        fetchPlaylistDetails()
    }, [playlistId, user, router, toast])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date)
    }

    const handlePlayAll = () => {
        if (songs.length > 0) {
            // Định dạng lại các bài hát để phù hợp với định dạng SongType
            const songsToPlay = songs.map(song => ({
                id: Number(song.id),
                title: song.title,
                duration: formatTime(song.duration),
                file_url: song.audio_url || song.audio_file || '',
                image_url: song.cover_image || playlist?.cover_image || '/placeholder-song.jpg',
                album: song.album ? {
                    id: 0,
                    title: song.album
                } : null,
                artist: {
                    id: typeof song.artist === 'string' ? 0 : Number(song.artist?.id || 0),
                    name: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                    avatar: typeof song.artist === 'string' ? null : song.artist?.avatar
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }))

            // Gọi hàm play
            if (songsToPlay.length > 0) {
                play(songsToPlay[0], songsToPlay)
            }

            // Hiển thị thông báo
            toast({
                title: "Đang phát",
                description: `Playlist: ${playlist?.name}`,
            })
        }
    }

    const handlePlaySong = (index: number) => {
        if (songs.length > index) {
            // Định dạng lại các bài hát để phù hợp với định dạng SongType
            const songsToPlay = songs.map(song => ({
                id: Number(song.id),
                title: song.title,
                duration: formatTime(song.duration),
                file_url: song.audio_url || song.audio_file || '',
                image_url: song.cover_image || playlist?.cover_image || '/placeholder-song.jpg',
                album: song.album ? {
                    id: 0,
                    title: song.album
                } : null,
                artist: {
                    id: typeof song.artist === 'string' ? 0 : Number(song.artist?.id || 0),
                    name: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                    avatar: typeof song.artist === 'string' ? null : song.artist?.avatar
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }))

            // Gọi hàm play với bài hát được chọn
            if (songsToPlay.length > index) {
                play(songsToPlay[index], songsToPlay)
            }

            // Hiển thị thông báo
            toast({
                title: "Đang phát",
                description: `${songs[index].title}`,
            })
        }
    }

    const handleShufflePlay = () => {
        if (songs.length > 0) {
            // Sắp xếp ngẫu nhiên danh sách nhạc
            const shuffledSongs = [...songs].sort(() => Math.random() - 0.5)

            // Định dạng lại các bài hát để phù hợp với định dạng SongType
            const songsToPlay = shuffledSongs.map(song => ({
                id: Number(song.id),
                title: song.title,
                duration: formatTime(song.duration),
                file_url: song.audio_url || song.audio_file || '',
                image_url: song.cover_image || playlist?.cover_image || '/placeholder-song.jpg',
                album: song.album ? {
                    id: 0,
                    title: song.album
                } : null,
                artist: {
                    id: typeof song.artist === 'string' ? 0 : Number(song.artist?.id || 0),
                    name: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                    avatar: typeof song.artist === 'string' ? null : song.artist?.avatar
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }))

            // Gọi hàm play với danh sách đã trộn
            if (songsToPlay.length > 0) {
                play(songsToPlay[0], songsToPlay)
            }

            // Hiển thị thông báo
            toast({
                title: "Đang phát ngẫu nhiên",
                description: `Playlist: ${playlist?.name}`,
            })
        }
    }

    const handleFollowPlaylist = async () => {
        try {
            if (isFollowing) {
                await postmanApi.music.unfollowPlaylist(playlistId)
                setIsFollowing(false)
                toast({
                    title: "Đã hủy theo dõi",
                    description: `Đã hủy theo dõi playlist "${playlist?.name}"`,
                })
            } else {
                await postmanApi.music.followPlaylist(playlistId)
                setIsFollowing(true)
                toast({
                    title: "Đã theo dõi",
                    description: `Đã theo dõi playlist "${playlist?.name}"`,
                })
            }
        } catch (error) {
            console.error("Lỗi khi thay đổi trạng thái theo dõi:", error)
            toast({
                title: "Lỗi",
                description: "Không thể thay đổi trạng thái theo dõi. Vui lòng thử lại sau.",
                variant: "destructive",
            })
        }
    }

    const handleEditPlaylist = () => {
        router.push(`/edit-playlist/${playlistId}`)
    }

    const handleShare = async () => {
        // Đây chỉ là demo, thực tế cần có chức năng chia sẻ
        toast({
            title: "Chia sẻ",
            description: "Tính năng chia sẻ đang được phát triển",
        })
    }

    const handleAddToQueue = (song: Song) => {
        // Chuyển đổi định dạng bài hát để phù hợp với SongType
        const songToQueue = {
            id: Number(song.id),
            title: song.title,
            duration: formatTime(song.duration),
            file_url: song.audio_url || song.audio_file || '',
            image_url: song.cover_image || playlist?.cover_image || '/placeholder-song.jpg',
            album: song.album ? {
                id: 0,
                title: song.album
            } : null,
            artist: {
                id: typeof song.artist === 'string' ? 0 : Number(song.artist?.id || 0),
                name: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                avatar: typeof song.artist === 'string' ? null : song.artist?.avatar
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        // Thêm vào hàng đợi
        addToQueue(songToQueue);

        toast({
            title: "Đã thêm vào hàng đợi",
            description: `${song.title}`,
        })
    }

    const handleLikeSong = async (song: Song) => {
        try {
            // Gọi API để thích/bỏ thích bài hát
            const success = await postmanApi.music.likeSong(song.id);
            if (success) {
                // Cập nhật UI khi thích/bỏ thích thành công
                setSongs(prevSongs => prevSongs.map(s =>
                    s.id === song.id ? { ...s, is_liked: !s.is_liked } : s
                ));

                toast({
                    title: song.is_liked ? "Đã bỏ thích" : "Đã thích",
                    description: `${song.is_liked ? "Đã bỏ thích" : "Đã thích"} bài hát "${song.title}"`,
                });
            }
        } catch (error) {
            console.error("Lỗi khi thích bài hát:", error);
            toast({
                title: "Lỗi",
                description: "Không thể thích bài hát. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        }
    };

    const handleRemoveSongFromPlaylist = async (song: Song) => {
        if (!isOwner || !playlist) return;

        try {
            // Gọi API để xóa bài hát khỏi playlist
            await postmanApi.music.removeSongFromPlaylist(String(playlist.id), String(song.id));

            // Cập nhật UI sau khi xóa
            setSongs(prevSongs => prevSongs.filter(s => s.id !== song.id));

            toast({
                title: "Đã xóa khỏi playlist",
                description: `Đã xóa "${song.title}" khỏi playlist "${playlist.name}"`,
            });
        } catch (error) {
            console.error("Lỗi khi xóa bài hát khỏi playlist:", error);
            toast({
                title: "Lỗi",
                description: "Không thể xóa bài hát khỏi playlist. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        }
    };

    return (
        <div>
            {loading ? (
                <div className="space-y-4">
                    <div className="flex gap-6">
                        <div className="w-52 h-52 bg-zinc-800/40 rounded-lg animate-pulse"></div>
                        <div className="flex-1 space-y-4">
                            <div className="h-8 w-1/3 bg-zinc-800/40 rounded animate-pulse"></div>
                            <div className="h-12 w-2/3 bg-zinc-800/40 rounded animate-pulse"></div>
                            <div className="h-4 w-1/4 bg-zinc-800/40 rounded animate-pulse"></div>
                        </div>
                    </div>
                    <div className="h-12 w-72 bg-zinc-800/40 rounded animate-pulse mt-6"></div>
                    <div className="space-y-2 mt-8">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-zinc-800/40 rounded-md animate-pulse" />
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row gap-6 mb-8">
                        <div className="w-52 h-52 flex-shrink-0">
                            <div className="relative w-full h-full overflow-hidden rounded-lg shadow-lg">
                                <Image
                                    src={playlist?.cover_image || "/placeholder-playlist.jpg"}
                                    alt={playlist?.name || "Playlist"}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col justify-end">
                            <div className="text-sm font-medium mb-1">Playlist</div>
                            <h1 className="text-5xl font-extrabold mb-6">{playlist?.name}</h1>

                            {playlist?.description && (
                                <p className="text-zinc-400 mb-3">{playlist.description}</p>
                            )}

                            <div className="flex items-center gap-1 text-sm text-zinc-400">
                                <span className="font-medium text-white">
                                    {playlist?.user?.username || "Unknown User"}
                                </span>
                                <span>•</span>
                                <span>{songs.length} bài hát</span>
                                <span>•</span>
                                <span>Tạo ngày {playlist?.created_at ? formatDate(playlist.created_at) : "Unknown"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mb-8">
                        <Button
                            onClick={handlePlayAll}
                            size="lg"
                            className="bg-green-500 hover:bg-green-600 text-black gap-2"
                        >
                            <PlayIcon className="h-5 w-5" /> Phát
                        </Button>

                        <Button
                            onClick={handleShufflePlay}
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                        >
                            <ShuffleIcon className="h-5 w-5" />
                        </Button>

                        {!isOwner && (
                            <Button
                                onClick={handleFollowPlaylist}
                                variant={isFollowing ? "default" : "outline"}
                                size="sm"
                                className={isFollowing ? "bg-green-500 hover:bg-green-600 text-black" : ""}
                            >
                                {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {isOwner && (
                                    <DropdownMenuItem onClick={handleEditPlaylist}>
                                        <Pencil className="h-4 w-4 mr-2" /> Chỉnh sửa playlist
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={handleShare}>
                                    <ShareIcon className="h-4 w-4 mr-2" /> Chia sẻ
                                </DropdownMenuItem>
                                {!isOwner && (
                                    <DropdownMenuItem onClick={handleFollowPlaylist}>
                                        {isFollowing ? (
                                            <>Hủy theo dõi</>
                                        ) : (
                                            <>
                                                <UserPlus className="h-4 w-4 mr-2" /> Theo dõi
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Songs list */}
                    {songs.length > 0 ? (
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-sm text-zinc-400 border-b border-zinc-800">
                                    <tr>
                                        <th className="px-4 py-3 w-12">#</th>
                                        <th className="px-4 py-3">Tiêu đề</th>
                                        <th className="px-4 py-3">Album</th>
                                        <th className="px-4 py-3 text-center w-24">
                                            <Clock className="h-4 w-4 inline" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {songs.map((song, index) => (
                                        <tr
                                            key={song.id}
                                            className="hover:bg-zinc-800/50 text-sm group"
                                        >
                                            <td className="px-4 py-3 w-12 group-hover:bg-zinc-800/50">
                                                <div className="flex items-center justify-center h-full relative">
                                                    <span className="group-hover:hidden">{index + 1}</span>
                                                    <button
                                                        className="hidden group-hover:block"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePlaySong(index);
                                                        }}
                                                    >
                                                        <PlayIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3" onClick={() => handlePlaySong(index)}>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0 w-10 h-10 relative">
                                                        <Image
                                                            src={song.cover_image || "/placeholder-song.jpg"}
                                                            alt={song.title}
                                                            className="object-cover rounded-sm"
                                                            fill
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{song.title}</div>
                                                        <div className="text-zinc-400">
                                                            {typeof song.artist === 'string'
                                                                ? song.artist
                                                                : song.artist?.name || 'Unknown Artist'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-zinc-400">{song.album || "-"}</td>
                                            <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                                <button
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLikeSong(song);
                                                    }}
                                                >
                                                    <Heart className={`h-4 w-4 ${song.is_liked ? 'fill-red-500 text-red-500' : 'text-zinc-400 hover:text-white'}`} />
                                                </button>
                                                <span className="text-zinc-400">{formatTime(song.duration)}</span>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4 text-zinc-400 hover:text-white" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 bg-zinc-800 border-zinc-700">
                                                        <DropdownMenuItem
                                                            className="text-white hover:bg-zinc-700 cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddToQueue(song);
                                                            }}
                                                        >
                                                            <PlusCircle className="h-4 w-4 mr-2" /> Thêm vào hàng đợi
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-white hover:bg-zinc-700 cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleLikeSong(song);
                                                            }}
                                                        >
                                                            <Heart className={`h-4 w-4 mr-2 ${song.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
                                                            {song.is_liked ? 'Đã thích' : 'Thêm vào yêu thích'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-zinc-700" />
                                                        <DropdownMenuItem
                                                            className="text-white hover:bg-zinc-700 cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(`/song/${song.id}`, '_blank');
                                                            }}
                                                        >
                                                            Chi tiết bài hát
                                                        </DropdownMenuItem>
                                                        {isOwner && (
                                                            <DropdownMenuItem
                                                                className="text-red-500 hover:bg-zinc-700 cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveSongFromPlaylist(song);
                                                                }}
                                                            >
                                                                Xóa khỏi playlist
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-zinc-900/30 rounded-lg">
                            <p className="text-zinc-400 mb-4">Playlist này chưa có bài hát nào</p>
                            {isOwner && (
                                <Button
                                    onClick={() => router.push("/songs")}
                                    className="bg-green-500 hover:bg-green-600 text-black"
                                >
                                    Thêm bài hát
                                </Button>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
} 