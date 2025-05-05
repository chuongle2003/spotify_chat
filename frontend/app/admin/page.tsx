"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Music, Disc, ListMusic, BarChart3 } from "lucide-react"
import { musicApi, accountsApi } from "@/lib/api"
import type { User, Song, Album, Playlist } from "@/types"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    songs: 0,
    albums: 0,
    playlists: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        // Trong thực tế, bạn sẽ gọi API để lấy thống kê
        // Ở đây chúng ta giả lập dữ liệu

        // Thử lấy dữ liệu thực từ API nếu có
        try {
          const [users, songs, albums, playlists] = await Promise.all([
            accountsApi.getUsers(),
            musicApi.getSongs(),
            musicApi.getAlbums(),
            musicApi.getPlaylists(),
          ])

          setStats({
            users: (users as User[]).length || 0,
            songs: (songs as Song[]).length || 0,
            albums: (albums as Album[]).length || 0,
            playlists: (playlists as Playlist[]).length || 0,
          })
        } catch (error) {
          console.error("Error fetching stats:", error)
          // Fallback to mock data
          setStats({
            users: 125,
            songs: 1458,
            albums: 87,
            playlists: 342,
          })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-6">Bảng điều khiển quản trị</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-800 border-zinc-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.users}</div>
            <p className="text-xs text-zinc-400 mt-1">+12% so với tháng trước</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng bài hát</CardTitle>
            <Music className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.songs}</div>
            <p className="text-xs text-zinc-400 mt-1">+24% so với tháng trước</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng album</CardTitle>
            <Disc className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.albums}</div>
            <p className="text-xs text-zinc-400 mt-1">+8% so với tháng trước</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng playlist</CardTitle>
            <ListMusic className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.playlists}</div>
            <p className="text-xs text-zinc-400 mt-1">+18% so với tháng trước</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-800 border-zinc-700 text-white">
          <CardHeader>
            <CardTitle>Thống kê hoạt động</CardTitle>
            <CardDescription className="text-zinc-400">Số lượt nghe trong 30 ngày qua</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <BarChart3 className="h-40 w-40 text-zinc-600" />
            <p className="text-zinc-500">Biểu đồ thống kê sẽ hiển thị ở đây</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700 text-white">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription className="text-zinc-400">Các hoạt động mới nhất trên hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 border-b border-zinc-700 pb-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-sm">Người dùng mới đăng ký</p>
                    <p className="text-xs text-zinc-400">{30 - i * 5} phút trước</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
