"use client"

import { useEffect, useState } from "react"
import { SongType } from "@/components/music/SongCard"
import { SongRow } from "@/components/music/SongRow"
import { SongListHeader } from "@/components/music/SongListHeader"
import { musicApi } from "@/app/api/music"
import { usePlayer } from "@/components/player/PlayerContext"

export default function SongsPage() {
    const [songs, setSongs] = useState<SongType[]>([])
    const [loading, setLoading] = useState(true)
    const { currentSong } = usePlayer()

    useEffect(() => {
        async function fetchSongs() {
            try {
                setLoading(true)
                const response = await musicApi.getSongs({ limit: 50 })
                setSongs(response.data)
            } catch (error) {
                console.error("Lỗi khi lấy danh sách bài hát:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchSongs()
    }, [])

    return (
        <div className="container mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold mb-6">Danh sách bài hát</h1>

            {loading ? (
                <div className="space-y-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="h-16 bg-zinc-800/40 rounded-md animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="rounded-lg overflow-hidden bg-zinc-900/30">
                    <SongListHeader />
                    <div className="space-y-1 py-2">
                        {songs.map((song, index) => (
                            <SongRow
                                key={song.id}
                                song={song}
                                index={index}
                                songs={songs}
                                isActive={currentSong?.id === song.id}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
} 