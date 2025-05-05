"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import postmanApi from "@/lib/api/postman"
import { toast } from "@/components/ui/use-toast"
import { SongType } from "@/components/music/SongCard"

export interface OfflineDownload {
    id: number
    song_details: SongType
    status: 'PENDING' | 'DOWNLOADING' | 'COMPLETED' | 'FAILED' | 'EXPIRED'
    status_display: string
    progress: number
    download_time?: string
    expiry_time?: string
    is_active: boolean
    is_available: boolean
}

type OfflineContextType = {
    offlineDownloads: OfflineDownload[]
    isLoading: boolean
    downloadSong: (songId: number | string) => Promise<OfflineDownload>
    deleteDownload: (downloadId: number) => Promise<void>
    isDownloaded: (songId: number | string) => boolean
    getDownloadById: (songId: number | string) => OfflineDownload | undefined
    refreshDownloads: () => Promise<void>
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

// Lưu cache để tránh quá nhiều lần kiểm tra
const downloadStatusCache = new Map<string, boolean>();
const downloadCache = new Map<string, OfflineDownload>();

export function OfflineProvider({ children }: { children: ReactNode }) {
    const { user, isLoading: authLoading } = useAuth()
    const [offlineDownloads, setOfflineDownloads] = useState<OfflineDownload[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<number>(0)

    // Lấy danh sách bài hát đã tải xuống khi người dùng đã đăng nhập
    useEffect(() => {
        if (user && !authLoading) {
            refreshDownloads()
        } else {
            setOfflineDownloads([])
            downloadStatusCache.clear();
            downloadCache.clear();
            setIsLoading(false)
        }
    }, [user, authLoading])

    // Tự động làm mới danh sách sau mỗi 5 phút
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (user) {
            intervalId = setInterval(() => {
                refreshDownloads();
            }, 5 * 60 * 1000); // 5 phút
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [user]);

    // Hàm refresh danh sách tải xuống
    const refreshDownloads = useCallback(async () => {
        if (!user) return

        setIsLoading(true)
        try {
            const response = await postmanApi.offline.getDownloads()
            setOfflineDownloads(response)

            // Cập nhật cache
            downloadStatusCache.clear();
            downloadCache.clear();

            // Cập nhật cache cho mỗi bài hát
            response.forEach(download => {
                const songId = String(download.song_details.id);
                const isCompleted = download.status === 'COMPLETED' && download.is_available;

                downloadStatusCache.set(songId, isCompleted);
                downloadCache.set(songId, download);
            });

            setLastUpdated(Date.now());
        } catch (error) {
            console.error("Failed to fetch offline downloads:", error)
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách bài hát offline",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }, [user]);

    // Kiểm tra xem bài hát đã được tải xuống chưa - sử dụng cache
    const isDownloaded = useCallback((songId: number | string) => {
        const id = String(songId);

        // Kiểm tra cache trước
        if (downloadStatusCache.has(id)) {
            return downloadStatusCache.get(id) || false;
        }

        // Nếu không có trong cache, tính toán và lưu vào cache
        const isCompleted = offlineDownloads.some(
            download =>
                download.song_details.id == songId &&
                download.status === 'COMPLETED' &&
                download.is_available
        );

        downloadStatusCache.set(id, isCompleted);
        return isCompleted;
    }, [offlineDownloads, lastUpdated]);

    // Lấy download theo song ID - sử dụng cache
    const getDownloadById = useCallback((songId: number | string) => {
        const id = String(songId);

        // Kiểm tra cache trước
        if (downloadCache.has(id)) {
            return downloadCache.get(id);
        }

        // Nếu không có trong cache, tìm và lưu vào cache
        const download = offlineDownloads.find(download => download.song_details.id == songId);

        if (download) {
            downloadCache.set(id, download);
        }

        return download;
    }, [offlineDownloads, lastUpdated]);

    // Tải xuống một bài hát mới
    const downloadSong = useCallback(async (songId: number | string): Promise<OfflineDownload> => {
        if (!user) {
            throw new Error("Bạn cần đăng nhập để tải bài hát nghe offline")
        }

        try {
            const response = await postmanApi.offline.downloadSong(songId)

            // Cập nhật danh sách tải xuống mà không cần gọi lại API
            const newDownload = response.download;
            setOfflineDownloads(prev => {
                // Tìm và cập nhật nếu đã tồn tại
                const exists = prev.findIndex(d => d.song_details.id == songId);
                if (exists >= 0) {
                    const updated = [...prev];
                    updated[exists] = newDownload;
                    return updated;
                }
                // Thêm mới nếu chưa tồn tại
                return [...prev, newDownload];
            });

            // Cập nhật cache
            downloadCache.set(String(songId), newDownload);
            // Status ban đầu là đang tải xuống, nên isDownloaded sẽ là false
            downloadStatusCache.set(String(songId), false);

            toast({
                title: "Đã thêm vào hàng đợi tải xuống",
                description: `Bài hát "${response.download.song_details.title}" đang được tải xuống.`,
            })

            // Thiết lập timeout để tự động làm mới sau 30s để kiểm tra tiến độ
            setTimeout(() => {
                refreshDownloads();
            }, 30000);

            return response.download
        } catch (error) {
            console.error("Failed to download song:", error)
            toast({
                title: "Không thể tải xuống",
                description: "Đã xảy ra lỗi khi tải bài hát. Vui lòng thử lại sau.",
                variant: "destructive",
            })
            throw error
        }
    }, [user, refreshDownloads]);

    // Xóa một bài hát đã tải xuống
    const deleteDownload = useCallback(async (downloadId: number) => {
        if (!user) return

        try {
            await postmanApi.offline.deleteDownload(downloadId)

            // Cập nhật danh sách tải xuống
            setOfflineDownloads(prevDownloads => {
                const downloadToRemove = prevDownloads.find(d => d.id === downloadId);

                // Xóa khỏi cache nếu tìm thấy
                if (downloadToRemove) {
                    const songId = String(downloadToRemove.song_details.id);
                    downloadStatusCache.delete(songId);
                    downloadCache.delete(songId);
                }

                return prevDownloads.filter(download => download.id !== downloadId);
            });

            toast({
                title: "Đã xóa",
                description: "Đã xóa bài hát khỏi danh sách tải xuống offline",
            })
        } catch (error) {
            console.error("Failed to delete download:", error)
            toast({
                title: "Lỗi",
                description: "Không thể xóa bài hát. Vui lòng thử lại sau.",
                variant: "destructive",
            })
        }
    }, [user]);

    // Sử dụng useMemo để giảm thiểu việc tạo lại các hàm và giá trị
    const contextValue = useMemo(() => ({
        offlineDownloads,
        isLoading,
        downloadSong,
        deleteDownload,
        isDownloaded,
        getDownloadById,
        refreshDownloads
    }), [
        offlineDownloads,
        isLoading,
        downloadSong,
        deleteDownload,
        isDownloaded,
        getDownloadById,
        refreshDownloads
    ]);

    return (
        <OfflineContext.Provider value={contextValue}>
            {children}
        </OfflineContext.Provider>
    )
}

export function useOffline() {
    const context = useContext(OfflineContext)
    if (context === undefined) {
        throw new Error("useOffline must be used within an OfflineProvider")
    }
    return context
} 