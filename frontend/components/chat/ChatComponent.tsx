"use client"

import React, { useState, useEffect, useRef } from "react"
import { useChat } from "@/context/chat-context"
import { useAuth } from "@/context/auth-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar } from "@/components/ui/avatar"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tooltip } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { debounce } from "lodash"

interface ChatComponentProps {
    roomName: string
}

const ChatComponent: React.FC<ChatComponentProps> = ({ roomName }) => {
    const [inputMessage, setInputMessage] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const {
        messages,
        sendMessage,
        setTyping,
        typingUsers,
        isConnected,
        connectToRoom,
        disconnectFromRoom,
        currentRoom,
        isLoading,
    } = useChat()
    const { user } = useAuth()

    // Kết nối đến phòng chat khi component mount
    useEffect(() => {
        if (roomName) {
            connectToRoom(roomName)
        }

        // Cleanup khi component unmount
        return () => {
            disconnectFromRoom()
        }
    }, [roomName])

    // Cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Hàm cuộn xuống cuối
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    // Xử lý sự kiện khi nhập tin nhắn
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputMessage(e.target.value)
        handleTyping(e.target.value.length > 0)
    }

    // Xử lý debounce để gửi trạng thái đang nhập
    const handleTyping = debounce((isTyping: boolean) => {
        if (roomName) {
            setTyping(isTyping, roomName)
        }
    }, 500)

    // Gửi tin nhắn
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault()

        if (!inputMessage.trim() || !roomName) return

        const sent = sendMessage(inputMessage.trim(), roomName)

        if (sent) {
            setInputMessage("")
            // Gửi trạng thái không đang nhập
            setTyping(false, roomName)
        }
    }

    // Kiểm tra xem tin nhắn có phải của người dùng hiện tại
    const isCurrentUser = (username: string) => {
        if (!user) return false
        return username === (user.username || user.email)
    }

    // Hiển thị chỉ báo đang nhập
    const renderTypingIndicator = () => {
        if (typingUsers.length === 0) return null

        return (
            <div className="typing-indicator text-sm text-muted-foreground italic my-2">
                {typingUsers.map(user => user.user_id).join(", ")} đang nhập...
            </div>
        )
    }

    return (
        <Card className="w-full h-[600px] flex flex-col">
            <CardHeader className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">
                            Chat - {roomName}
                        </h3>
                        {isConnected ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                Đã kết nối
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                                Mất kết nối
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative">
                <ScrollArea className="h-[460px] p-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[250px]" />
                                        <Skeleton className="h-4 w-[200px]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground text-center">
                                Không có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-3 ${isCurrentUser(msg.username) ? "flex-row-reverse" : ""
                                        }`}
                                >
                                    <Avatar className="h-8 w-8 mt-1">
                                        <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-semibold text-sm">
                                            {msg.username.charAt(0).toUpperCase()}
                                        </div>
                                    </Avatar>

                                    <div
                                        className={`max-w-[80%] ${isCurrentUser(msg.username)
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-secondary"
                                            } rounded-lg p-3`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-xs">
                                                {msg.username}
                                            </span>
                                            {msg.timestamp && (
                                                <span className="text-xs opacity-70">
                                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm break-words">{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                            {renderTypingIndicator()}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-3 border-t">
                <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                    <Input
                        value={inputMessage}
                        onChange={handleInputChange}
                        placeholder="Nhập tin nhắn..."
                        disabled={!isConnected}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        disabled={!isConnected || !inputMessage.trim()}
                    >
                        Gửi
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
}

export default ChatComponent 