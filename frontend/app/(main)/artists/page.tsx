"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import postmanApi from "@/lib/api/postman"

interface ArtistType {
    id: number
    name: string
    image: string
    bio?: string
}

export default function ArtistsPage() {
    const [artists, setArtists] = useState<ArtistType[]>([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!user) {
            router.push("/")
            return
        }

        async function fetchArtists() {
            try {
                setLoading(true)
                const response = await postmanApi.music.getArtists({ limit: 50 })

                // Kiểm tra cấu trúc dữ liệu
                let artistData = [];
                if (Array.isArray(response)) {
                    artistData = response;
                } else if (response.data && Array.isArray(response.data)) {
                    artistData = response.data;
                } else if (response.results && Array.isArray(response.results)) {
                    artistData = response.results;
                }

                setArtists(artistData)
            } catch (error) {
                console.error("Lỗi khi lấy danh sách nghệ sĩ:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchArtists()
    }, [user, router])

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Nghệ sĩ</h1>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <div className="w-40 h-40 rounded-full bg-zinc-800/40 animate-pulse" />
                            <div className="h-5 w-24 mt-3 bg-zinc-800/40 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {artists.map((artist) => (
                        <Link
                            href={`/artist/${artist.id}`}
                            key={artist.id}
                            className="flex flex-col items-center group"
                        >
                            <div className="relative w-40 h-40 rounded-full overflow-hidden mb-3 group-hover:shadow-lg transition-all">
                                <Image
                                    src={artist.image || "/placeholder-artist.jpg"}
                                    alt={artist.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform"
                                />
                            </div>
                            <h3 className="font-bold text-center group-hover:text-white transition-colors">{artist.name}</h3>
                            <p className="text-xs text-zinc-400 text-center">Nghệ sĩ</p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
} 