"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Home, Search, Plus, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SongCard, SongType } from "@/components/music/SongCard"
import { AlbumCard, AlbumType } from "@/components/music/AlbumCard"
import ArtistCard, { ArtistType } from "@/components/music/ArtistCard"
import { musicApi } from "@/app/api/music"
import { usePlayer } from "@/components/player/PlayerContext"

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [trendingSongs, setTrendingSongs] = useState<SongType[]>([])
  const [popularArtists, setPopularArtists] = useState<ArtistType[]>([])
  const [loading, setLoading] = useState(true)
  const { play, getDirectMediaUrl } = usePlayer()

  // If user is logged in, redirect to the music app
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        // Lấy danh sách bài hát thịnh hành từ API thật
        const trendingResponse = await musicApi.getTrendingSongs();


        // Chuyển đổi dữ liệu từ API thật sang định dạng của ứng dụng
        const mappedSongs = trendingResponse.results.map(song => ({
          id: song.id,
          title: song.title,
          artist: {
            id: song.uploaded_by?.id || 0,
            name: song.artist,
            avatar: null
          },
          album: {
            id: 0,
            title: song.album || "Unknown Album"
          },
          duration: song.duration.toString(),
          play_count: song.play_count,
          // Sử dụng URL trực tiếp từ API
          image_url: song.cover_image,
          file_url: song.audio_file,
          created_at: song.created_at,
          updated_at: song.created_at
        }));

        setTrendingSongs(mappedSongs);

        // Lấy danh sách nghệ sĩ phổ biến
        const artistsResponse = await musicApi.getArtists({ limit: 6 })
        setPopularArtists(artistsResponse.data)
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error)
        // Fallback sang mocked data
        const songsResponse = await musicApi.getSongs({ limit: 6 })
        setTrendingSongs(songsResponse.data)

        const artistsResponse = await musicApi.getArtists({ limit: 6 })
        setPopularArtists(artistsResponse.data)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handlePlaySong = (song: SongType) => {
    // Cho phép phát nhạc mà không cần kiểm tra đăng nhập
    // PlayerProvider sẽ hiển thị thông báo đăng nhập nếu cần
    play(song, trendingSongs)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-black">
        <div>
          <svg viewBox="0 0 78 24" width="78" height="24" className="text-white">
            <path
              fill="currentColor"
              d="M18.616 10.639c-3.77-2.297-9.99-2.509-13.59-1.388a1.077 1.077 0 0 1-1.164-.363 1.14 1.14 0 0 1-.119-1.237c.136-.262.37-.46.648-.548 4.132-1.287 11-1.038 15.342 1.605a1.138 1.138 0 0 1 .099 1.863 1.081 1.081 0 0 1-.813.213c-.142-.02-.28-.07-.403-.145Zm-.124 3.402a.915.915 0 0 1-.563.42.894.894 0 0 1-.69-.112c-3.144-1.983-7.937-2.557-11.657-1.398a.898.898 0 0 1-.971-.303.952.952 0 0 1-.098-1.03.929.929 0 0 1 .54-.458c4.248-1.323 9.53-.682 13.14 1.595a.95.95 0 0 1 .3 1.286Zm-1.43 3.267a.73.73 0 0 1-.45.338.712.712 0 0 1-.553-.089c-2.748-1.722-6.204-2.111-10.276-1.156a.718.718 0 0 1-.758-.298.745.745 0 0 1-.115-.265.757.757 0 0 1 .092-.563.737.737 0 0 1 .457-.333c4.455-1.045 8.277-.595 11.361 1.338a.762.762 0 0 1 .241 1.028ZM11.696 0C5.237 0 0 5.373 0 12c0 6.628 5.236 12 11.697 12 6.46 0 11.698-5.372 11.698-12 0-6.627-5.238-12-11.699-12h.001Z"
            />
          </svg>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-white hover:text-white hover:bg-transparent">
            Premium
          </Button>
          <Button variant="ghost" className="text-white hover:text-white hover:bg-transparent">
            Hỗ trợ
          </Button>
          <Button variant="ghost" className="text-white hover:text-white hover:bg-transparent">
            Tải xuống
          </Button>
          <div className="h-6 w-px bg-white/30 mx-2"></div>
          <Link href="/register">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-transparent">
              Đăng ký
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-white text-black hover:bg-white/90 rounded-full px-8">Đăng nhập</Button>
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-black p-4">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Button variant="ghost" className="justify-start text-white/70 hover:text-white">
                <Home className="mr-2 h-5 w-5" />
                Trang chủ
              </Button>
              <Button variant="ghost" className="justify-start text-white/70 hover:text-white">
                <Search className="mr-2 h-5 w-5" />
                Tìm kiếm
              </Button>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Thư viện</h3>
                  <Plus className="h-5 w-5 text-white/70" />
                </div>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <h4 className="font-bold mb-2">Tạo danh sách phát đầu tiên của bạn</h4>
                  <p className="text-sm text-white/70 mb-4">Rất dễ! Chúng tôi sẽ giúp bạn</p>
                  <Button className="bg-white text-black hover:bg-white/90 rounded-full text-sm">
                    Tạo danh sách phát
                  </Button>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <h4 className="font-bold mb-2">Hãy cùng tìm và theo dõi một số podcast</h4>
                  <p className="text-sm text-white/70 mb-4">Chúng tôi sẽ cập nhật cho bạn thông tin về các tập mới</p>
                  <Button className="bg-white text-black hover:bg-white/90 rounded-full text-sm">
                    Duyệt xem podcast
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 bg-gradient-to-b from-zinc-900 to-black p-6 overflow-auto">
          <h2 className="text-2xl font-bold mb-4 flex justify-between items-center">
            Bài hát thịnh hành trong 7 ngày qua
            <Link href="/songs" className="text-white/70 hover:text-white text-sm">
              Hiển thị tất cả <ChevronRight className="h-4 w-4" />
            </Link>
          </h2>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-zinc-800/40 rounded-md aspect-square animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {trendingSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={{
                    ...song,
                    // Sử dụng getDirectMediaUrl để xử lý URL trực tiếp
                    image_url: getDirectMediaUrl(song.image_url),
                    file_url: getDirectMediaUrl(song.file_url)
                  }}
                  onPlay={() => handlePlaySong(song)}
                  playlist={trendingSongs}
                />
              ))}
            </div>
          )}

          <h2 className="text-2xl font-bold mb-4 flex justify-between items-center mt-8">
            Nghệ sĩ phổ biến
            <Link href="/artists" className="text-white/70 hover:text-white text-sm">
              Hiển thị tất cả <ChevronRight className="h-4 w-4" />
            </Link>
          </h2>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-zinc-800/40 rounded-md aspect-square animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {popularArtists.map((artist) => (
                <ArtistCard
                  key={artist.id}
                  artist={{
                    ...artist,
                    // Xử lý URL cho ảnh nghệ sĩ
                    image: getDirectMediaUrl(artist.image)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-700 to-pink-500 p-3 flex justify-between items-center">
        <div>
          <h3 className="font-bold">Xem trước Spotify</h3>
          <p className="text-sm">
            Đăng ký để nghe không giới hạn các bài hát và podcast với quảng cáo không thường xuyên. Không cần thẻ tín
            dụng.
          </p>
        </div>
        <Link href="/register">
          <Button className="bg-white text-black hover:bg-white/90 rounded-full px-8">Đăng ký miễn phí</Button>
        </Link>
      </div>
    </div>
  )
}
