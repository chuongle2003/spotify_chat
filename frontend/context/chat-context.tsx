"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from "react"
import { useAuth } from "@/context/auth-context"

// Định nghĩa types
interface Message {
    message: string
    username: string
    timestamp?: string
    message_id?: number
    type?: string
}

interface TypingIndicator {
    username: string
    is_typing: boolean
}

interface ReadStatus {
    username: string
    timestamp: string
}

interface UserStatus {
    username: string
    status: string
}

interface ChatContextType {
    messages: Message[]
    sendMessage: (message: string, recipient: string) => boolean
    setTyping: (isTyping: boolean, recipient: string) => void
    markAsRead: (recipient: string) => void
    typingUsers: TypingIndicator[]
    isConnected: boolean
    connectToChat: (recipientUsername: string) => void
    disconnectFromChat: () => void
    currentRecipient: string | null
    isLoading: boolean
    loadMessages: (username: string) => Promise<void>
    loadConversations: () => Promise<any[]>
    unreadCounts: Record<string, number>
}

// Tạo context với giá trị mặc định
const ChatContext = createContext<ChatContextType>({
    messages: [],
    sendMessage: () => false,
    setTyping: () => { },
    markAsRead: () => { },
    typingUsers: [],
    isConnected: false,
    connectToChat: () => { },
    disconnectFromChat: () => { },
    currentRecipient: null,
    isLoading: false,
    loadMessages: async () => { },
    loadConversations: async () => [],
    unreadCounts: {},
})

// Custom hook để sử dụng chat context
export const useChat = () => useContext(ChatContext)

// WebSocket timeout và backoff
const RECONNECT_TIMEOUT = 3000
const MAX_RECONNECT_ATTEMPTS = 5

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [currentRecipient, setCurrentRecipient] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

    const socketRef = useRef<WebSocket | null>(null)
    const reconnectAttemptsRef = useRef(0)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastConversationsRef = useRef<any[]>([])
    const lastFetchTimeRef = useRef<number>(0)

    const { user, accessToken } = useAuth()

    // Hàm kết nối đến WebSocket chat
    const connectToChat = (recipientUsername: string) => {
        // Reset trạng thái
        setIsLoading(true)
        setMessages([])
        setTypingUsers([])

        // Đóng kết nối cũ nếu có
        if (socketRef.current) {
            socketRef.current.close()
            socketRef.current = null
        }

        // Cập nhật người nhận hiện tại
        setCurrentRecipient(recipientUsername)

        // Không thể kết nối nếu không có token
        if (!accessToken || !user) {
            console.error("Không thể kết nối: Chưa đăng nhập")
            setIsLoading(false)
            return
        }

        // Tải tin nhắn cũ
        loadMessages(recipientUsername)

        // Tạo kết nối WebSocket mới
        // Sử dụng định dạng URL WebSocket mới: ws://<domain>/ws/chat/<username_người_nhận>/
        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "wss://spotifybackend.shop"}/ws/chat/${recipientUsername}/`

        // Tạo đối tượng WebSocket với headers Authorization
        const socket = new WebSocket(wsUrl)

        // Xác thực bằng cách gửi token trong header
        socket.onopen = () => {
            // Gửi token trong tin nhắn xác thực
            const authMessage = {
                type: "authentication",
                token: accessToken
            }
            socket.send(JSON.stringify(authMessage))

            console.log("WebSocket kết nối thành công")
            setIsConnected(true)
            setIsLoading(false)
            reconnectAttemptsRef.current = 0 // Reset số lần kết nối lại

            // Đánh dấu tin nhắn là đã đọc khi kết nối thành công
            markAsRead(recipientUsername)
        }

        // Xử lý tin nhắn nhận được
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                // Phân loại loại tin nhắn
                switch (data.type) {
                    case "typing":
                        // Xử lý trạng thái đang nhập
                        handleTypingIndicator(data)
                        break
                    case "read":
                        // Xử lý trạng thái đã đọc
                        console.log(`${data.username} đã đọc tin nhắn vào lúc ${data.timestamp}`)
                        break
                    case "status":
                        // Xử lý trạng thái người dùng
                        console.log(`${data.username} hiện đang ${data.status}`)
                        break
                    case "chat_message":  // Cập nhật tên sự kiện theo định dạng mới
                        // Xử lý tin nhắn thông thường
                        const messageData = {
                            message: data.message,
                            username: data.username,
                            timestamp: data.timestamp || new Date().toISOString(),
                            message_id: data.message_id,
                            type: "message"
                        }
                        setMessages((prevMessages) => [...prevMessages, messageData])

                        // Nếu đang kết nối với người gửi, tự động đánh dấu là đã đọc
                        if (data.username === currentRecipient) {
                            markAsRead(data.username)
                        } else {
                            // Cập nhật số lượng tin nhắn chưa đọc nếu không trong cuộc trò chuyện hiện tại
                            setUnreadCounts(prev => ({
                                ...prev,
                                [data.username]: (prev[data.username] || 0) + 1
                            }))
                        }
                        break
                    case "auth_success":
                        console.log("Xác thực WebSocket thành công")
                        break;
                    case "auth_error":
                        console.error("Lỗi xác thực WebSocket:", data.message)
                        socket.close(4003); // Đóng kết nối với mã lỗi xác thực
                        break;
                    default:
                        console.log("Tin nhắn không xác định:", data)
                }
            } catch (error) {
                console.error("Lỗi khi xử lý tin nhắn:", error)
            }
        }

        // Xử lý sự kiện khi kết nối bị đóng
        socket.onclose = (event) => {
            setIsConnected(false)
            console.log(`WebSocket đóng kết nối với mã: ${event.code}`)

            // Xử lý các mã lỗi khác nhau
            switch (event.code) {
                case 4000:
                    console.error("Người dùng bị hạn chế chat")
                    break
                case 4001:
                    console.error("Người dùng chưa đăng nhập")
                    break
                case 4003:
                    console.error("Token không hợp lệ hoặc hết hạn")
                    break
                case 4004:
                    console.error("Không tìm thấy người dùng")
                    break
                case 1000:
                    console.log("Đóng kết nối bình thường")
                    break
                default:
                    console.error("Lỗi không xác định, mã: " + event.code)
            }

            // Kết nối lại nếu không phải lỗi nghiêm trọng
            if (![4000, 4004].includes(event.code) && currentRecipient) {
                reconnectWithBackoff(recipientUsername)
            } else {
                setIsLoading(false)
            }
        }

        // Xử lý lỗi
        socket.onerror = (error) => {
            console.error("Lỗi WebSocket:", error)
        }

        socketRef.current = socket
    }

    // Hàm kết nối lại với backoff
    const reconnectWithBackoff = (recipientUsername: string) => {
        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            console.log("Đã đạt đến số lần thử kết nối tối đa")
            setIsLoading(false)
            return
        }

        // Tính thời gian chờ tăng dần
        const backoffTime = Math.min(
            RECONNECT_TIMEOUT * Math.pow(2, reconnectAttemptsRef.current),
            30000
        )

        console.log(`Thử kết nối lại sau ${backoffTime}ms`)

        // Xóa timeout cũ nếu có
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
        }

        // Đặt timeout mới
        reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1
            connectToChat(recipientUsername)
        }, backoffTime)
    }

    // Xử lý chỉ báo đang nhập
    const handleTypingIndicator = (data: TypingIndicator) => {
        if (data.is_typing) {
            // Thêm người dùng vào danh sách đang nhập
            setTypingUsers((prev) => {
                if (prev.some((user) => user.username === data.username)) {
                    return prev
                }
                return [...prev, data]
            })

            // Tự động xóa trạng thái đang nhập sau 3 giây
            setTimeout(() => {
                setTypingUsers((prev) =>
                    prev.filter((user) => user.username !== data.username)
                )
            }, 3000)
        } else {
            // Xóa người dùng khỏi danh sách đang nhập
            setTypingUsers((prev) =>
                prev.filter((user) => user.username !== data.username)
            )
        }
    }

    // Gửi tin nhắn
    const sendMessage = (message: string, recipient: string): boolean => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            console.error("Kết nối WebSocket không mở")
            return false
        }

        if (!user) {
            console.error("Chưa đăng nhập")
            return false
        }

        // Tạo đối tượng tin nhắn theo định dạng mới
        const messageObj = {
            message: message,
            username: user.username || user.email
        }

        try {
            socketRef.current.send(JSON.stringify(messageObj))
            return true
        } catch (error) {
            console.error("Lỗi khi gửi tin nhắn:", error)
            return false
        }
    }

    // Gửi trạng thái đang nhập
    const setTyping = (isTyping: boolean, recipient: string) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            return
        }

        if (!user) {
            return
        }

        const typingData = {
            type: "typing",
            is_typing: isTyping
        }

        try {
            socketRef.current.send(JSON.stringify(typingData))
        } catch (error) {
            console.error("Lỗi khi gửi trạng thái đang nhập:", error)
        }
    }

    // Đánh dấu tin nhắn đã đọc
    const markAsRead = (username: string) => {
        // Gửi xác nhận đọc qua WebSocket nếu đang kết nối
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const readData = {
                type: "read"
            }

            try {
                socketRef.current.send(JSON.stringify(readData))
            } catch (error) {
                console.error("Lỗi khi gửi trạng thái đã đọc:", error)
            }
        }

        // Gọi API để đánh dấu đã đọc
        if (accessToken && username) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://spotifybackend.shop"}/api/v1/chat/mark-read/${username}/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (response.ok) {
                        // Cập nhật số lượng tin chưa đọc
                        setUnreadCounts(prev => ({
                            ...prev,
                            [username]: 0
                        }))
                    }
                })
                .catch(error => {
                    console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error)
                })
        }
    }

    // Tải tin nhắn cũ
    const loadMessages = async (username: string) => {
        if (!accessToken || !username) return

        try {
            setIsLoading(true)
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://spotifybackend.shop"}/api/v1/chat/messages/${username}/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setMessages(data)
                // Đánh dấu là đã đọc khi tải tin nhắn
                markAsRead(username)
            } else {
                console.error("Lỗi khi tải tin nhắn:", response.statusText)
            }
        } catch (error) {
            console.error("Lỗi khi tải tin nhắn:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Tải danh sách cuộc trò chuyện
    const loadConversations = async () => {
        if (!accessToken) return []

        // Nếu đã có dữ liệu conversations trong state và không phải là lần đầu tiên tải
        // thì trả về dữ liệu đó để tránh gọi API liên tục
        if (lastConversationsRef.current.length > 0 &&
            Date.now() - lastFetchTimeRef.current < 30000) {
            return lastConversationsRef.current;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://spotifybackend.shop"}/api/v1/chat/conversations/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })

            if (response.ok) {
                const data = await response.json()

                // Cập nhật số lượng tin nhắn chưa đọc
                const unreadMap: Record<string, number> = {}
                data.forEach((conversation: any) => {
                    unreadMap[conversation.username] = conversation.unread_count || 0
                })
                setUnreadCounts(unreadMap)

                // Lưu vào cache
                lastConversationsRef.current = data;
                lastFetchTimeRef.current = Date.now();

                return data
            } else {
                console.error("Lỗi khi tải cuộc trò chuyện:", response.statusText)
                return lastConversationsRef.current || []; // Trả về cache nếu có lỗi
            }
        } catch (error) {
            console.error("Lỗi khi tải cuộc trò chuyện:", error)
            return lastConversationsRef.current || []; // Trả về cache nếu có lỗi
        }
    }

    // Ngắt kết nối
    const disconnectFromChat = () => {
        if (socketRef.current) {
            socketRef.current.close()
            socketRef.current = null
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }

        setCurrentRecipient(null)
        setIsConnected(false)
        setMessages([])
        setTypingUsers([])
    }

    // Cleanup khi component unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.close()
            }

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
        }
    }, [])

    // Tải số lượng tin nhắn chưa đọc khi người dùng đăng nhập
    useEffect(() => {
        if (accessToken) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://spotifybackend.shop"}/api/v1/chat/unread-count/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
                .then(response => {
                    if (response.ok) {
                        return response.json()
                    }
                    throw new Error("Lỗi khi tải số lượng tin nhắn chưa đọc")
                })
                .then(data => {
                    setUnreadCounts(data)
                })
                .catch(error => {
                    console.error(error)
                })
        }
    }, [accessToken])

    // Context value
    const contextValue = {
        messages,
        sendMessage,
        setTyping,
        markAsRead,
        typingUsers,
        isConnected,
        connectToChat,
        disconnectFromChat,
        currentRecipient,
        isLoading,
        loadMessages,
        loadConversations,
        unreadCounts
    }

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    )
} 