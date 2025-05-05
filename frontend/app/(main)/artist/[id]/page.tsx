"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Play, Shuffle, Clock, Heart, MoreHorizontal, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePlayer } from "@/components/player/PlayerContext"
import { SongCard } from "@/components/music/SongCard"
import { AlbumCard } from "@/components/music/AlbumCard"
import postmanApi from "@/lib/api/postman"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Artist {
    id: string | number;
    name: string;
    image: string;
    bio?: string;
    monthly_listeners?: number;
    followers?: number;
}

interface Song {
    id: string;
    title: string;
    artist: any;
    album?: string;
    duration: number;
    audio_url?: string;
    audio_file?: string;
    cover_image?: string;
    play_count?: number;
    likes_count?: number;
}

interface Album {
    id: string | number;
    title: string;
    artist: any;
    cover_image: string;
    release_date: string;
    songs_count: number;
}

export default function ArtistPage({ params }: { params: { id: string } }) {
    const { id } = params
    const router = useRouter()
    const { user } = useAuth()
    const { toast } = useToast()
    const { play } = usePlayer()

    const [artist, setArtist] = useState<Artist | null>(null)
    const [popularSongs, setPopularSongs] = useState<Song[]>([])
    const [albums, setAlbums] = useState<Album[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            router.push("/")
            return
        }

        async function fetchArtistDetails() {
            try {
                setLoading(true)

                // Lấy thông tin chi tiết nghệ sĩ
                const artistResponse = await postmanApi.music.getArtist(id)

                // Lấy bài hát phổ biến của nghệ sĩ (sẽ được thêm vào API sau)
                let songsData: Song[] = []
                let albumsData: Album[] = []

                // Giả sử API trả về bài hát phổ biến trong nghệ sĩ
                if (artistResponse.popular_songs) {
                    songsData = artistResponse.popular_songs.map((song: any) => ({
                        id: song.id,
                        title: song.title || song.name,
                        artist: artistResponse,
                        album: song.album,
                        duration: song.duration || 0,
                        audio_url: song.audio_url || song.audio_file,
                        audio_file: song.audio_file,
                        cover_image: song.cover_image,
                        play_count: song.play_count || 0,
                        likes_count: song.likes_count || 0
                    }))
                } else {
                    // Nếu không có, tìm kiếm bài hát của nghệ sĩ
                    try {
                        const searchResponse = await postmanApi.music.search(artistResponse.name)
                        const songResults = searchResponse.results?.songs || searchResponse.songs || searchResponse

                        if (Array.isArray(songResults)) {
                            songsData = songResults
                                .filter((song: any) => {
                                    const artistName = typeof song.artist === 'string'
                                        ? song.artist
                                        : song.artist?.name || '';

                                    return artistName.toLowerCase().includes(artistResponse.name.toLowerCase())
                                })
                                .map((song: any) => ({
                                    id: song.id,
                                    title: song.title || song.name,
                                    artist: artistResponse,
                                    album: song.album,
                                    duration: song.duration || 0,
                                    audio_url: song.audio_url || song.audio_file,
                                    audio_file: song.audio_file,
                                    cover_image: song.cover_image,
                                    play_count: song.play_count || 0,
                                    likes_count: song.likes_count || 0
                                }))
                        }
                    } catch (error) {
                        console.error("Lỗi khi tìm bài hát của nghệ sĩ:", error)
                    }
                }

                // Lấy album của nghệ sĩ
                if (artistResponse.albums) {
                    albumsData = artistResponse.albums
                } else {
                    // Có thể tìm kiếm album riêng
                    try {
                        const albumsResponse = await postmanApi.music.getAlbums()
                        if (Array.isArray(albumsResponse)) {
                            albumsData = albumsResponse
                                .filter((album: any) => {
                                    const albumArtistName = typeof album.artist === 'string'
                                        ? album.artist
                                        : album.artist?.name || '';

                                    return albumArtistName.toLowerCase().includes(artistResponse.name.toLowerCase())
                                })
                                .map((album: any) => ({
                                    id: album.id,
                                    title: album.title || album.name,
                                    artist: artistResponse,
                                    cover_image: album.cover_image,
                                    release_date: album.release_date || new Date().toISOString(),
                                    songs_count: album.songs_count || 0
                                }))
                        }
                    } catch (error) {
                        console.error("Lỗi khi lấy album của nghệ sĩ:", error)
                    }
                }

                setArtist(artistResponse)
                setPopularSongs(songsData)
                setAlbums(albumsData)
            } catch (error) {
                console.error("Lỗi khi lấy thông tin nghệ sĩ:", error)
                toast({
                    title: "Lỗi",
                    description: "Không thể tải thông tin nghệ sĩ. Vui lòng thử lại sau.",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchArtistDetails()
    }, [id, user, router, toast])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + ' triệu'
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + ' nghìn'
        }
        return num.toString()
    }

    const handlePlayAll = () => {
        if (popularSongs.length > 0) {
            const songsToPlay = popularSongs.map(song => ({
                ...song,
                audio_url: song.audio_url || song.audio_file
            }))
            play(songsToPlay, 0)
            toast({
                title: "Đang phát",
                description: `Bài hát phổ biến của ${artist?.name}`,
            })
        }
    }

    const handlePlaySong = (index: number) => {
        if (popularSongs.length > index) {
            const songsToPlay = popularSongs.map(song => ({
                ...song,
                audio_url: song.audio_url || song.audio_file
            }))
            play(songsToPlay, index)
        }
    }

    const handleShufflePlay = () => {
        if (popularSongs.length > 0) {
            // Sắp xếp ngẫu nhiên danh sách nhạc
            const shuffled = [...popularSongs].sort(() => Math.random() - 0.5)
            const songsToPlay = shuffled.map(song => ({
                ...song,
                audio_url: song.audio_url || song.audio_file
            }))
            play(songsToPlay, 0)
            toast({
                title: "Đang phát ngẫu nhiên",
                description: `Bài hát của ${artist?.name}`,
            })
        }
    }

    return (
        <div>
            {loading ? (
                <div className="space-y-6">
                    <div className="flex items-end h-64 relative">
                        <div className="w-52 h-52 rounded-full bg-zinc-800/40 animate-pulse absolute bottom-0 left-8"></div>
                        <div className="ml-72 mb-8 space-y-4">
                            <div className="h-8 w-1/3 bg-zinc-800/40 rounded animate-pulse"></div>
                            <div className="h-12 w-1/2 bg-zinc-800/40 rounded animate-pulse"></div>
                        </div>
                    </div>
                    <div className="h-12 w-72 bg-zinc-800/40 rounded animate-pulse mt-16"></div>
                    <div className="space-y-2 mt-8">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-zinc-800/40 rounded-md animate-pulse" />
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Artist Header */}
                    <div className="flex items-end h-64 relative bg-gradient-to-b from-violet-900/70 to-zinc-900 rounded-t-lg p-8 mb-8">
                        <div className="absolute inset-0 bg-black/20 rounded-t-lg"></div>

                        <div className="relative z-10 flex items-end gap-6">
                            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white/10 shadow-xl">
                                <Image
                                    src={artist?.image || "/placeholder-artist.jpg"}
                                    alt={artist?.name || "Artist"}
                                    width={192}
                                    height={192}
                                    className="object-cover"
                                />
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="h-4 w-4 text-blue-400" />
                                    <span className="text-sm font-medium">Nghệ sĩ đã xác minh</span>
                                </div>
                                <h1 className="text-5xl font-extrabold mb-2">{artist?.name}</h1>
                                <div className="text-zinc-300 flex items-center gap-1">
                                    <span>{formatNumber(artist?.monthly_listeners || 0)} người nghe hàng tháng</span>
                                    {artist?.followers && (
                                        <>
                                            <span>•</span>
                                            <span>{formatNumber(artist.followers)} người theo dõi</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mb-8">
                        {popularSongs.length > 0 && (
                            <>
                                <Button
                                    onClick={handlePlayAll}
                                    size="lg"
                                    className="bg-green-500 hover:bg-green-600 text-black gap-2"
                                >
                                    <Play className="h-5 w-5" /> Phát
                                </Button>

                                <Button
                                    onClick={handleShufflePlay}
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10"
                                >
                                    <Shuffle className="h-5 w-5" />
                                </Button>
                            </>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                        >
                            Theo dõi
                        </Button>
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="overview" className="mt-8">
                        <TabsList className="mb-6">
                            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                            <TabsTrigger value="songs">Bài hát</TabsTrigger>
                            <TabsTrigger value="albums">Album</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview">
                            {/* Popular Songs */}
                            {popularSongs.length > 0 && (
                                <div className="mb-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-2xl font-bold">Phổ biến</h2>
                                        <Link href={`/artist/${id}/songs`} className="text-sm text-zinc-400 hover:underline">
                                            Xem tất cả
                                        </Link>
                                    </div>

                                    <div className="space-y-1">
                                        {popularSongs.slice(0, 5).map((song, index) => (
                                            <div
                                                key={song.id}
                                                className="hover:bg-zinc-800/50 rounded-md p-2 grid grid-cols-[auto_1fr_auto] gap-4 items-center cursor-pointer"
                                                onClick={() => handlePlaySong(index)}
                                            >
                                                <div className="w-8 text-center text-zinc-400">{index + 1}</div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 relative">
                                                        <Image
                                                            src={song.cover_image || "/placeholder-song.jpg"}
                                                            alt={song.title}
                                                            fill
                                                            className="object-cover rounded-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{song.title}</div>
                                                        <div className="text-zinc-400 text-sm">{song.play_count?.toLocaleString() || 0} lượt phát</div>
                                                    </div>
                                                </div>
                                                <div className="text-zinc-400 text-sm">{formatTime(song.duration)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Albums */}
                            {albums.length > 0 && (
                                <div className="mt-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-2xl font-bold">Albums</h2>
                                        <Link href={`/artist/${id}/albums`} className="text-sm text-zinc-400 hover:underline">
                                            Xem tất cả
                                        </Link>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {albums.slice(0, 5).map((album) => (
                                            <Link key={album.id} href={`/album/${album.id}`} className="group">
                                                <div className="bg-zinc-900/70 p-4 rounded-md hover:bg-zinc-800/50 transition-colors">
                                                    <div className="aspect-square relative overflow-hidden rounded-md mb-4">
                                                        <Image
                                                            src={album.cover_image || "/placeholder-album.jpg"}
                                                            alt={album.title}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform"
                                                        />
                                                    </div>
                                                    <div className="font-medium truncate">{album.title}</div>
                                                    <div className="text-zinc-400 text-sm">{new Date(album.release_date).getFullYear()}</div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* About */}
                            {artist?.bio && (
                                <div className="mt-12">
                                    <h2 className="text-2xl font-bold mb-4">Giới thiệu</h2>
                                    <div className="bg-zinc-900/70 p-6 rounded-lg">
                                        <p className="text-zinc-300 whitespace-pre-line">{artist.bio}</p>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="songs">
                            {popularSongs.length > 0 ? (
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
                                            {popularSongs.map((song, index) => (
                                                <tr
                                                    key={song.id}
                                                    className="hover:bg-zinc-800/50 text-sm cursor-pointer"
                                                    onClick={() => handlePlaySong(index)}
                                                >
                                                    <td className="px-4 py-3 w-12">{index + 1}</td>
                                                    <td className="px-4 py-3">
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
                                                                <div className="text-zinc-400 text-sm">{song.play_count?.toLocaleString() || 0} lượt phát</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-zinc-400">{song.album || "-"}</td>
                                                    <td className="px-4 py-3 text-center text-zinc-400">
                                                        {formatTime(song.duration)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-zinc-900/30 rounded-lg">
                                    <p className="text-zinc-400">Không tìm thấy bài hát nào của nghệ sĩ này</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="albums">
                            {albums.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {albums.map((album) => (
                                        <Link key={album.id} href={`/album/${album.id}`} className="group">
                                            <div className="bg-zinc-900/70 p-4 rounded-md hover:bg-zinc-800/50 transition-colors">
                                                <div className="aspect-square relative overflow-hidden rounded-md mb-4">
                                                    <Image
                                                        src={album.cover_image || "/placeholder-album.jpg"}
                                                        alt={album.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                                <div className="font-medium truncate">{album.title}</div>
                                                <div className="text-zinc-400 text-sm">
                                                    Album • {new Date(album.release_date).getFullYear()}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-zinc-900/30 rounded-lg">
                                    <p className="text-zinc-400">Không tìm thấy album nào của nghệ sĩ này</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    )
} 