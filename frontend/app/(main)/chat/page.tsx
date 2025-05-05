"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useChat } from "@/context/chat-context"
import { useAuth } from "@/context/auth-context"
import { ChatList, ChatBox } from "@/app/components/chat"
import { User } from "@/types"

export default function ChatPage() {
    const [activeChat, setActiveChat] = useState<string | null>(null)
    const [conversations, setConversations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAutoRefreshing, setIsAutoRefreshing] = useState(true)

    // Biến theo dõi đã gọi API hay chưa
    const hasLoadedRef = useRef(false)

    const { user } = useAuth()
    const {
        loadConversations,
        unreadCounts,
        connectToChat,
        disconnectFromChat
    } = useChat()

    // Hàm fetch conversations được bọc trong useCallback để tránh tạo lại hàm mỗi lần render
    const fetchConversations = useCallback(async (force = false) => {
        if (!user) return
        if (!force && hasLoadedRef.current) return // Không tải lại nếu đã tải rồi trừ khi bắt buộc

        setIsLoading(true)
        try {
            const data = await loadConversations()
            setConversations(data || [])
            hasLoadedRef.current = true // Đánh dấu đã tải xong
        } catch (error) {
            console.error("Lỗi khi tải cuộc trò chuyện:", error)
            setConversations([])
        } finally {
            setIsLoading(false)
        }
    }, [user, loadConversations])

    // Tải danh sách cuộc trò chuyện khi lần đầu render
    useEffect(() => {
        if (user && !hasLoadedRef.current) {
            fetchConversations()
        }

        // Cleanup function
        return () => {
            hasLoadedRef.current = false
        }
    }, [user, fetchConversations])

    // Xử lý khi chọn một cuộc trò chuyện
    const handleSelectChat = (username: string) => {
        if (activeChat) {
            disconnectFromChat()
        }
        setActiveChat(username)
        connectToChat(username)
    }

    // Làm mới danh sách cuộc trò chuyện định kỳ - chỉ khi isAutoRefreshing = true
    useEffect(() => {
        if (!isAutoRefreshing || !user) return

        const interval = setInterval(() => {
            fetchConversations(true) // Force update
        }, 60000) // Làm mới mỗi 60 giây thay vì 30s

        return () => clearInterval(interval)
    }, [user, fetchConversations, isAutoRefreshing])

    // Ngắt kết nối khi unmount
    useEffect(() => {
        return () => {
            if (activeChat) {
                disconnectFromChat()
            }
        }
    }, [activeChat, disconnectFromChat])

    // Nếu chưa đăng nhập, hiển thị thông báo
    if (!user) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="bg-neutral-900 p-6 rounded-lg max-w-md text-center">
                    <h2 className="text-xl font-bold mb-4">Cần đăng nhập</h2>
                    <p className="text-neutral-400 mb-4">Bạn cần đăng nhập để sử dụng tính năng chat</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full max-h-[calc(100vh-120px)]">
            {/* Danh sách chat */}
            <div className="w-1/4 bg-neutral-900 border-r border-neutral-700 p-4 h-full overflow-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Trò chuyện</h2>
                    <button
                        onClick={() => fetchConversations(true)} // Force update
                        className="text-xs bg-neutral-800 hover:bg-neutral-700 p-2 rounded-full"
                        title="Làm mới danh sách"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
                {isLoading && !hasLoadedRef.current ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin h-8 w-8 border-t-2 border-white rounded-full"></div>
                    </div>
                ) : (
                    <ChatList
                        conversations={conversations}
                        activeChat={activeChat}
                        onSelectChat={handleSelectChat}
                        unreadCounts={unreadCounts}
                    />
                )}
            </div>

            {/* Khung chat */}
            <div className="w-3/4 h-full flex flex-col">
                {activeChat ? (
                    <ChatBox recipientUsername={activeChat} />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-neutral-400">Chọn một cuộc trò chuyện để bắt đầu</p>
                    </div>
                )}
            </div>
        </div>
    )
} 