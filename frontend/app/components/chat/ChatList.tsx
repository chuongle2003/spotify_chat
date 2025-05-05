"use client"

import { useState } from "react"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface Conversation {
    username: string
    last_message?: string
    timestamp?: string
    avatar?: string
}

interface ChatListProps {
    conversations: Conversation[]
    activeChat: string | null
    onSelectChat: (username: string) => void
    unreadCounts: Record<string, number>
}

export default function ChatList({
    conversations,
    activeChat,
    onSelectChat,
    unreadCounts
}: ChatListProps) {
    const [searchTerm, setSearchTerm] = useState("")

    // Lọc danh sách cuộc trò chuyện theo từ khóa tìm kiếm
    const filteredConversations = conversations.filter(
        (conv) => conv && conv.username && conv.username.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Format thời gian hiển thị
    const formatTime = (timestamp: string) => {
        if (!timestamp) return ""
        try {
            return formatDistanceToNow(new Date(timestamp), {
                addSuffix: true,
                locale: vi
            })
        } catch (error) {
            return ""
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Input tìm kiếm */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Tìm kiếm người dùng..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Danh sách cuộc trò chuyện */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation) => (
                        <div
                            key={conversation?.username || `conversation-${Math.random()}`}
                            className={`flex items-center p-3 mb-2 rounded-md cursor-pointer hover:bg-neutral-800 transition-colors ${activeChat === conversation?.username ? "bg-neutral-800" : ""
                                }`}
                            onClick={() => conversation?.username && onSelectChat(conversation.username)}
                        >
                            {/* Avatar */}
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-700 flex-shrink-0">
                                {conversation?.avatar ? (
                                    <Image
                                        src={conversation.avatar}
                                        alt={conversation?.username || "User"}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
                                        {conversation?.username ? conversation.username.charAt(0).toUpperCase() : "?"}
                                    </div>
                                )}
                            </div>

                            {/* Thông tin */}
                            <div className="ml-3 flex-1 overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-medium truncate">{conversation?.username || "Người dùng không xác định"}</h3>
                                    {conversation?.timestamp && (
                                        <span className="text-xs text-neutral-400">
                                            {formatTime(conversation.timestamp)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-neutral-400 truncate">
                                    {conversation?.last_message || "Chưa có tin nhắn"}
                                </p>
                            </div>

                            {/* Số tin nhắn chưa đọc */}
                            {conversation?.username && unreadCounts[conversation.username] > 0 && (
                                <div className="ml-2 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                    {unreadCounts[conversation.username]}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6 text-neutral-400">
                        {searchTerm ? "Không tìm thấy người dùng" : "Chưa có cuộc trò chuyện nào"}
                    </div>
                )}
            </div>
        </div>
    )
} 