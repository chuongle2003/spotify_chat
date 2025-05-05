"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, Upload, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import postmanApi from "@/lib/api/postman"

export default function CreatePlaylistPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { toast } = useToast()

    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [isPublic, setIsPublic] = useState(true)
    const [coverImage, setCoverImage] = useState<File | null>(null)
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setCoverImage(file)

            // Tạo URL xem trước cho hình ảnh
            const reader = new FileReader()
            reader.onload = (event) => {
                if (event.target && typeof event.target.result === 'string') {
                    setCoverImagePreview(event.target.result)
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập tên playlist",
                variant: "destructive",
            })
            return
        }

        try {
            setLoading(true)

            // Tạo playlist mới
            const playlistData = {
                name,
                description: description.trim() || null,
                is_public: isPublic
            }

            const response = await postmanApi.music.createPlaylist(playlistData)

            // Nếu có hình ảnh bìa, tải lên
            if (coverImage && response.id) {
                const formData = new FormData()
                formData.append('cover_image', coverImage)

                await postmanApi.music.updatePlaylistCover(response.id.toString(), formData)
            }

            toast({
                title: "Thành công",
                description: "Đã tạo playlist mới",
            })

            // Chuyển hướng đến trang playlist
            router.push(`/playlist/${response.id}`)
        } catch (error) {
            console.error("Lỗi khi tạo playlist:", error)
            toast({
                title: "Lỗi",
                description: "Không thể tạo playlist. Vui lòng thử lại sau.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center mb-8">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="mr-4"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold">Tạo Playlist Mới</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-1/3">
                        <div className="aspect-square bg-zinc-800 rounded-md overflow-hidden relative">
                            {coverImagePreview ? (
                                <Image
                                    src={coverImagePreview}
                                    alt="Ảnh bìa"
                                    className="object-cover"
                                    fill
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                                    <ImageIcon className="h-20 w-20 mb-2" />
                                    <span>Chọn ảnh bìa</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <Label htmlFor="cover-image" className="cursor-pointer">
                                <div className="flex items-center justify-center py-2 px-4 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 rounded-md text-center">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Tải ảnh lên
                                </div>
                                <Input
                                    id="cover-image"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </Label>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tên playlist</Label>
                            <Input
                                id="name"
                                placeholder="Playlist của tôi"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả (không bắt buộc)</Label>
                            <Textarea
                                id="description"
                                placeholder="Mô tả về playlist này..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <div className="flex items-center space-x-2 pt-4">
                            <Switch
                                id="is-public"
                                checked={isPublic}
                                onCheckedChange={setIsPublic}
                            />
                            <Label htmlFor="is-public">Công khai</Label>
                        </div>

                        <div className="text-sm text-zinc-400">
                            {isPublic ? (
                                "Playlist sẽ hiển thị với người dùng khác"
                            ) : (
                                "Chỉ bạn mới có thể xem playlist này"
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="mr-2"
                        disabled={loading}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        className="bg-green-500 hover:bg-green-600 text-black"
                        disabled={loading}
                    >
                        {loading ? "Đang tạo..." : "Tạo playlist"}
                    </Button>
                </div>
            </form>
        </div>
    )
} 